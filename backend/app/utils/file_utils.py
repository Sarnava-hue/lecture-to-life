from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

import aiofiles
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

CHUNK_SIZE = 64 * 1024  # 64 KB chunks to cap memory usage during upload.


@dataclass(frozen=True)
class FileFormatSpec:
    extension: str
    source_type: str
    content_types: frozenset[str]


ALLOWED_FORMATS: dict[str, FileFormatSpec] = {
    ".pdf": FileFormatSpec(
        extension=".pdf",
        source_type="pdf",
        content_types=frozenset({"application/pdf"}),
    ),
    ".docx": FileFormatSpec(
        extension=".docx",
        source_type="docx",
        content_types=frozenset(
            {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            }
        ),
    ),
    ".txt": FileFormatSpec(
        extension=".txt",
        source_type="txt",
        content_types=frozenset({"text/plain"}),
    ),
    ".mp3": FileFormatSpec(
        extension=".mp3",
        source_type="audio",
        content_types=frozenset({"audio/mpeg", "audio/mp3"}),
    ),
    ".wav": FileFormatSpec(
        extension=".wav",
        source_type="audio",
        content_types=frozenset({"audio/wav", "audio/x-wav", "audio/wave"}),
    ),
    ".m4a": FileFormatSpec(
        extension=".m4a",
        source_type="audio",
        content_types=frozenset({"audio/mp4", "audio/x-m4a", "audio/m4a"}),
    ),
    ".mp4": FileFormatSpec(
        extension=".mp4",
        source_type="audio",
        content_types=frozenset({"video/mp4", "audio/mp4"}),
    ),
    ".webm": FileFormatSpec(
        extension=".webm",
        source_type="audio",
        content_types=frozenset({"video/webm", "audio/webm"}),
    ),
}


def validate_upload_metadata(file: UploadFile) -> FileFormatSpec:
    """Validate file extension and declared Content-Type against supported lecture formats."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required.",
        )

    extension = Path(file.filename).suffix.lower()
    spec = ALLOWED_FORMATS.get(extension)
    if spec is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unsupported file type. Allowed formats: "
                "PDF, DOCX, TXT, MP3, WAV, M4A, MP4, WEBM."
            ),
        )

    declared_type = (file.content_type or "").split(";")[0].strip().lower()
    if (
        declared_type
        and declared_type != "application/octet-stream"
        and declared_type not in spec.content_types
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content-Type '{declared_type}' does not match '{extension}' files.",
        )

    return spec


def _matches_magic_bytes(header: bytes, extension: str) -> bool:
    """Verify file header magic bytes match the expected format."""
    if extension == ".pdf":
        return header.lstrip().startswith(b"%PDF-")
    if extension == ".docx":
        return header.startswith(b"PK\x03\x04")
    if extension == ".txt":
        if b"\x00" in header:
            return False
        try:
            header.decode("utf-8")
            return True
        except UnicodeDecodeError:
            # Permit UTF-8 multi-byte boundary at end of first chunk, or latin-1 text.
            try:
                header[:-4].decode("utf-8")
                return True
            except UnicodeDecodeError:
                return False
    if extension == ".mp3":
        return header.startswith(b"ID3") or (
            len(header) >= 2 and header[0] == 0xFF and (header[1] & 0xE0) == 0xE0
        )
    if extension == ".wav":
        return len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WAVE"
    if extension in {".m4a", ".mp4"}:
        return len(header) >= 12 and header[4:8] == b"ftyp"
    if extension == ".webm":
        return header.startswith(b"\x1a\x45\xdf\xa3")
    return False


async def save_validated_upload(
    file: UploadFile,
    spec: FileFormatSpec,
    upload_dir: Path | None = None,
    max_size_bytes: int | None = None,
) -> tuple[Path, str, int]:
    """Stream an uploaded file to disk while enforcing magic-byte and size checks.

    Returns (absolute_path, relative_storage_path, byte_size).
    """
    target_dir = (upload_dir or settings.upload_dir_path).resolve()
    target_dir.mkdir(parents=True, exist_ok=True)
    size_limit = (
        max_size_bytes
        if max_size_bytes is not None
        else settings.max_upload_size_bytes
    )

    unique_filename = f"{uuid4().hex}{spec.extension}"
    destination = (target_dir / unique_filename).resolve()

    total_bytes = 0
    first_chunk_checked = False

    try:
        async with aiofiles.open(destination, "wb") as output:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break

                if not first_chunk_checked:
                    first_chunk_checked = True
                    if not _matches_magic_bytes(chunk[:64], spec.extension):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"File content does not match '{spec.extension}' format.",
                        )

                total_bytes += len(chunk)
                if total_bytes > size_limit:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail=f"File size must not exceed {settings.MAX_UPLOAD_SIZE_MB} MB.",
                    )

                await output.write(chunk)

        if total_bytes == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )
    except Exception:
        if destination.exists():
            destination.unlink()
        raise

    return destination, unique_filename, total_bytes


def delete_stored_file(storage_path: str, upload_dir: Path | None = None) -> None:
    """Safely delete an uploaded file inside the configured upload directory."""
    if not storage_path or storage_path == "legacy/unknown":
        return

    base_dir = (upload_dir or settings.upload_dir_path).resolve()
    candidate = Path(storage_path)
    target = (
        candidate.resolve()
        if candidate.is_absolute()
        else (base_dir / candidate).resolve()
    )

    # Guard against path traversal outside the upload directory.
    if base_dir not in target.parents and target != base_dir:
        return

    if target.exists() and target.is_file():
        target.unlink()

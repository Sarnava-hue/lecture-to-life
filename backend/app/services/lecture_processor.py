from pathlib import Path
from typing import Any

from pypdf import PdfReader
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.document import Document


def _resolve_file_path(storage_path: str, upload_dir: Path) -> Path:
    candidate = Path(storage_path)
    if candidate.is_absolute():
        return candidate
    return (upload_dir / candidate).resolve()


def _extract_pdf_segments(
    file_path: Path, lecture_id: int
) -> tuple[str, list[dict[str, Any]], str]:
    reader = PdfReader(str(file_path))
    pages_text: list[str] = []
    segments: list[dict[str, Any]] = []

    for index, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages_text.append(text)
            segments.append(
                {
                    "id": f"{lecture_id}-p{index}",
                    "label": f"Page {index}",
                    "reference": f"Page {index}",
                    "text": text,
                }
            )

    page_count = len(reader.pages)
    duration = f"{page_count} page" if page_count == 1 else f"{page_count} pages"
    return "\n\n".join(pages_text), segments, duration


def _extract_txt_segments(
    file_path: Path, lecture_id: int
) -> tuple[str, list[dict[str, Any]], str]:
    raw_text = file_path.read_text(encoding="utf-8", errors="replace").strip()
    paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
    segments = [
        {
            "id": f"{lecture_id}-s{index}",
            "label": f"Section {index}",
            "reference": f"Section {index}",
            "text": paragraph,
        }
        for index, paragraph in enumerate(paragraphs[:50], start=1)
    ]
    word_count = len(raw_text.split())
    est_minutes = max(1, round(word_count / 180)) if word_count else 1
    return raw_text, segments, f"{est_minutes} min read"


def process_lecture_background(
    lecture_id: int,
    session_factory: sessionmaker = SessionLocal,
    upload_dir: Path | None = None,
) -> None:
    """Extract readable lecture content and update processing status in the background."""
    base_upload_dir = (upload_dir or settings.upload_dir_path).resolve()

    with session_factory() as db:
        document = db.get(Document, lecture_id)
        if document is None:
            return

        try:
            file_path = _resolve_file_path(document.storage_path, base_upload_dir)
            extracted_text = ""
            segments: list[dict[str, Any]] = []
            duration = document.duration or "—"

            if document.source_type == "pdf" and file_path.exists():
                extracted_text, segments, duration = _extract_pdf_segments(
                    file_path, document.id
                )
            elif document.source_type == "txt" and file_path.exists():
                extracted_text, segments, duration = _extract_txt_segments(
                    file_path, document.id
                )
            elif document.source_type == "docx":
                duration = "Document uploaded"
            elif document.source_type == "audio":
                duration = "Audio uploaded"

            preview = extracted_text[:400].strip() if extracted_text else ""
            document.extracted_text = extracted_text or None
            document.segments = segments
            document.duration = duration
            document.summary = (
                preview
                if preview
                else f"Uploaded {document.source_type.upper()} file ready for AI processing."
            )
            document.status = "ready"
            document.progress = 100
            document.error_message = None
            db.commit()
        except Exception as exc:
            db.rollback()
            document = db.get(Document, lecture_id)
            if document is not None:
                document.status = "failed"
                document.progress = 0
                document.error_message = str(exc)
                db.commit()

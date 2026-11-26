from pathlib import Path
from typing import Any

import docx
from pypdf import PdfReader

from app.core.config import settings


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


def _extract_docx_segments(
    file_path: Path, lecture_id: int
) -> tuple[str, list[dict[str, Any]], str]:
    document = docx.Document(str(file_path))
    sections: list[tuple[str, list[str]]] = []
    current_heading = "Overview"
    current_lines: list[str] = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue
        style_name = (paragraph.style.name or "").lower() if paragraph.style else ""
        if style_name.startswith("heading"):
            if current_lines:
                sections.append((current_heading, current_lines))
                current_lines = []
            current_heading = text[:120]
        else:
            current_lines.append(text)

    if current_lines:
        sections.append((current_heading, current_lines))

    segments: list[dict[str, Any]] = []
    full_parts: list[str] = []
    for index, (heading, lines) in enumerate(sections, start=1):
        body = "\n".join(lines).strip()
        if not body:
            continue
        full_parts.append(f"{heading}\n{body}")
        segments.append(
            {
                "id": f"{lecture_id}-d{index}",
                "label": heading,
                "reference": f"Section {index}",
                "text": body,
            }
        )

    full_text = "\n\n".join(full_parts)
    word_count = len(full_text.split())
    est_minutes = max(1, round(word_count / 180)) if word_count else 1
    return full_text, segments, f"{est_minutes} min read"


def _extract_txt_segments(
    file_path: Path, lecture_id: int
) -> tuple[str, list[dict[str, Any]], str]:
    raw_text = file_path.read_text(encoding="utf-8", errors="replace").strip()
    paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
    if not paragraphs and raw_text:
        paragraphs = [raw_text]

    segments = [
        {
            "id": f"{lecture_id}-s{index}",
            "label": f"Section {index}",
            "reference": f"Section {index}",
            "text": paragraph,
        }
        for index, paragraph in enumerate(paragraphs[:100], start=1)
    ]
    word_count = len(raw_text.split())
    est_minutes = max(1, round(word_count / 180)) if word_count else 1
    return raw_text, segments, f"{est_minutes} min read"


def extract_lecture_content(
    file_path: Path,
    source_type: str,
    lecture_id: int,
    content_type: str = "",
    gemini_client: Any = None,
) -> tuple[str, list[dict[str, Any]], str]:
    """Extract raw text, structured segments, and duration label from a lecture file."""
    if not file_path.exists():
        return "", [], "—"

    if source_type == "pdf":
        return _extract_pdf_segments(file_path, lecture_id)

    if source_type == "docx":
        return _extract_docx_segments(file_path, lecture_id)

    if source_type == "txt":
        return _extract_txt_segments(file_path, lecture_id)

    if source_type == "audio":
        if gemini_client is not None or settings.GEMINI_API_KEY.strip():
            from app.services.gemini_service import transcribe_audio_with_gemini

            return transcribe_audio_with_gemini(
                file_path=file_path,
                lecture_id=lecture_id,
                content_type=content_type,
                client=gemini_client,
            )
        return (
            "",
            [
                {
                    "id": f"{lecture_id}-a1",
                    "label": "Audio Recording Uploaded",
                    "reference": "00:00",
                    "text": (
                        "Recording stored. Configure GEMINI_API_KEY to transcribe audio "
                        "into timestamped lecture segments."
                    ),
                }
            ],
            "Audio uploaded",
        )

    return "", [], "—"

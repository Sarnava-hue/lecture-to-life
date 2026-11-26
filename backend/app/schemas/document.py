from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import StrId

LectureStatus = Literal["ready", "processing", "failed"]
LectureSourceType = Literal["pdf", "docx", "txt", "audio"]
GenerationTarget = Literal["summary", "flashcards", "quiz", "conceptMap"]

ALLOWED_GENERATION_TARGETS: frozenset[str] = frozenset(
    {"summary", "flashcards", "quiz", "conceptMap"}
)


class LectureSegmentSchema(BaseModel):
    id: str
    label: str
    reference: str
    text: str


class ConceptNodeSchema(BaseModel):
    id: str
    label: str
    x: float
    y: float
    kind: Literal["root", "branch", "leaf"] = "branch"


class ConceptEdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    label: str | None = None


class LectureResponse(BaseModel):
    """Full lecture representation matching frontend/types/study.ts Lecture."""

    id: StrId
    title: str
    subject: str
    duration: str
    status: LectureStatus
    source_type: LectureSourceType = Field(alias="sourceType")
    uploaded_at: str = Field(alias="uploadedAt")
    summary: str
    key_takeaways: list[str] = Field(alias="keyTakeaways")
    segments: list[LectureSegmentSchema]
    concept_nodes: list[ConceptNodeSchema] = Field(alias="conceptNodes")
    concept_edges: list[ConceptEdgeSchema] = Field(alias="conceptEdges")
    flashcard_count: int = Field(default=0, alias="flashcardCount")
    quiz_count: int = Field(default=0, alias="quizCount")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class UploadLectureResponse(BaseModel):
    """Response returned by POST /api/v1/lectures/upload."""

    lecture_id: StrId
    status: LectureStatus
    message: str | None = None


class LectureStatusResponse(BaseModel):
    """Response returned by GET /api/v1/lectures/{id}/status."""

    lecture_id: StrId
    status: LectureStatus
    progress: int | None = None
    error: str | None = None


def format_uploaded_at(dt: datetime) -> str:
    """Format a timestamp as an ISO-8601 UTC string."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def document_to_lecture_response(
    document: Any,
    flashcard_count: int = 0,
    quiz_count: int = 0,
) -> LectureResponse:
    """Map a Document ORM model into the frontend Lecture contract."""
    title = document.title or document.filename
    raw_status = document.status
    normalized_status: LectureStatus = (
        raw_status
        if raw_status in {"ready", "processing", "failed"}
        else "ready"
    )
    raw_source = document.source_type
    normalized_source: LectureSourceType = (
        raw_source
        if raw_source in {"pdf", "docx", "txt", "audio"}
        else "pdf"
    )

    return LectureResponse(
        id=str(document.id),
        title=title,
        subject=document.subject or "General",
        duration=document.duration or "—",
        status=normalized_status,
        sourceType=normalized_source,
        uploadedAt=format_uploaded_at(document.created_at),
        summary=document.summary or "",
        keyTakeaways=list(document.key_takeaways or []),
        segments=[
            LectureSegmentSchema(**seg) for seg in (document.segments or [])
        ],
        conceptNodes=[
            ConceptNodeSchema(**node)
            for node in (document.concept_nodes or [])
        ],
        conceptEdges=[
            ConceptEdgeSchema(**edge)
            for edge in (document.concept_edges or [])
        ],
        flashcardCount=flashcard_count,
        quizCount=quiz_count,
    )

import json
from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Body,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.db.session import SessionLocal
from app.models.document import Document
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.document import (
    ALLOWED_GENERATION_TARGETS,
    GenerationTarget,
    LectureResponse,
    LectureStatusResponse,
    UploadLectureResponse,
    document_to_lecture_response,
)
from app.services.lecture_processor import process_lecture_background
from app.utils.file_utils import (
    delete_stored_file,
    resolve_safe_stored_path,
    save_validated_upload,
    validate_upload_metadata,
)

router = APIRouter(
    prefix="/api/v1/lectures",
    tags=["Lectures"],
)


class ReprocessLectureRequest(BaseModel):
    targets: list[GenerationTarget] | None = None


def _parse_targets(raw_targets: str) -> list[str]:
    """Parse and validate JSON-encoded generation targets from multipart form input."""
    try:
        parsed = json.loads(raw_targets)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="targets must be a valid JSON array.",
        ) from exc

    if not isinstance(parsed, list) or not all(
        isinstance(item, str) and item in ALLOWED_GENERATION_TARGETS
        for item in parsed
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="targets contains unsupported generation options.",
        )

    return parsed


def _get_owned_lecture_or_404(
    lecture_id: int,
    user_id: int,
    db: Session,
) -> Document:
    """Fetch a lecture owned by user_id or raise 404."""
    document = db.scalar(
        select(Document).where(
            Document.id == lecture_id,
            Document.user_id == user_id,
        )
    )
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )
    return document


def get_lecture_counts(
    db: Session, document_ids: list[int]
) -> tuple[dict[int, int], dict[int, int]]:
    """Fetch flashcard and quiz counts for a batch of lecture IDs in two queries."""
    if not document_ids:
        return {}, {}

    fc_rows = db.execute(
        select(Flashcard.document_id, func.count(Flashcard.id))
        .where(Flashcard.document_id.in_(document_ids))
        .group_by(Flashcard.document_id)
    ).all()
    quiz_rows = db.execute(
        select(Quiz.document_id, func.count(Quiz.id))
        .where(Quiz.document_id.in_(document_ids))
        .group_by(Quiz.document_id)
    ).all()
    return dict(fc_rows), dict(quiz_rows)


@router.get("", response_model=list[LectureResponse])
def list_lectures(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """List lectures belonging to the authenticated user, newest first."""
    documents = db.scalars(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc(), Document.id.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    doc_ids = [doc.id for doc in documents]
    fc_counts, quiz_counts = get_lecture_counts(db, doc_ids)

    return [
        document_to_lecture_response(
            doc,
            flashcard_count=fc_counts.get(doc.id, 0),
            quiz_count=quiz_counts.get(doc.id, 0),
        )
        for doc in documents
    ]


@router.post(
    "/upload",
    response_model=UploadLectureResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_lecture(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
    title: str = Form(default=""),
    subject: str = Form(default="General"),
    targets: str = Form(default='["summary","flashcards","quiz","conceptMap"]'),
):
    """Upload a lecture document or recording and start background AI processing."""
    spec = validate_upload_metadata(file)
    parsed_targets = _parse_targets(targets)

    upload_dir = getattr(
        request.app.state, "upload_dir", settings.upload_dir_path
    )
    destination, storage_path, byte_size = await save_validated_upload(
        file=file,
        spec=spec,
        upload_dir=upload_dir,
    )

    original_filename = file.filename or f"lecture{spec.extension}"
    resolved_title = title.strip() or Path(original_filename).stem
    resolved_subject = subject.strip() or "General"

    document = Document(
        user_id=current_user.id,
        title=resolved_title[:255],
        subject=resolved_subject[:150],
        filename=original_filename[:255],
        content_type=(file.content_type or "application/octet-stream")[:100],
        source_type=spec.source_type,
        duration="Processing...",
        file_size=byte_size,
        storage_path=storage_path,
        status="processing",
        progress=10,
        targets=parsed_targets,
    )

    try:
        db.add(document)
        db.commit()
        db.refresh(document)
    except Exception:
        db.rollback()
        if destination.exists():
            destination.unlink()
        raise

    session_factory = getattr(request.app.state, "session_factory", SessionLocal)
    gemini_client = getattr(request.app.state, "gemini_client", None)
    background_tasks.add_task(
        process_lecture_background,
        document.id,
        session_factory,
        upload_dir,
        gemini_client,
    )

    return UploadLectureResponse(
        lecture_id=str(document.id),
        status="processing",
        message="Lecture uploaded and queued for processing.",
    )


@router.get("/{lecture_id}", response_model=LectureResponse)
def get_lecture(
    lecture_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Fetch full details for a single lecture owned by the authenticated user."""
    document = _get_owned_lecture_or_404(lecture_id, current_user.id, db)
    fc_counts, quiz_counts = get_lecture_counts(db, [document.id])
    return document_to_lecture_response(
        document,
        flashcard_count=fc_counts.get(document.id, 0),
        quiz_count=quiz_counts.get(document.id, 0),
    )


@router.get("/{lecture_id}/status", response_model=LectureStatusResponse)
def get_lecture_status(
    lecture_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Poll processing status and progress for an uploaded lecture."""
    document = _get_owned_lecture_or_404(lecture_id, current_user.id, db)
    normalized_status = (
        document.status
        if document.status in {"ready", "processing", "failed"}
        else "ready"
    )
    return LectureStatusResponse(
        lecture_id=str(document.id),
        status=normalized_status,
        progress=document.progress,
        error=document.error_message,
    )


@router.get("/{lecture_id}/download")
def download_lecture(
    lecture_id: int,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Download the original uploaded lecture file after verifying ownership."""
    document = _get_owned_lecture_or_404(lecture_id, current_user.id, db)
    upload_dir = getattr(
        request.app.state, "upload_dir", settings.upload_dir_path
    )
    file_path = resolve_safe_stored_path(
        document.storage_path, upload_dir=upload_dir
    )
    if file_path is None or not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stored lecture file is missing.",
        )

    return FileResponse(
        path=str(file_path),
        media_type=document.content_type or "application/octet-stream",
        filename=document.filename,
    )


@router.post(
    "/{lecture_id}/reprocess",
    response_model=UploadLectureResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def reprocess_lecture(
    lecture_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    payload: ReprocessLectureRequest | None = Body(default=None),
):
    """Re-run extraction, chunking, and AI artifact generation for an existing lecture."""
    document = _get_owned_lecture_or_404(lecture_id, current_user.id, db)
    if document.status == "processing":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Lecture is already processing.",
        )

    if payload and payload.targets is not None:
        document.targets = list(payload.targets)

    document.status = "processing"
    document.progress = 10
    document.error_message = None
    db.commit()

    upload_dir = getattr(
        request.app.state, "upload_dir", settings.upload_dir_path
    )
    session_factory = getattr(request.app.state, "session_factory", SessionLocal)
    gemini_client = getattr(request.app.state, "gemini_client", None)
    background_tasks.add_task(
        process_lecture_background,
        document.id,
        session_factory,
        upload_dir,
        gemini_client,
    )

    return UploadLectureResponse(
        lecture_id=str(document.id),
        status="processing",
        message="Lecture queued for reprocessing.",
    )


@router.delete("/{lecture_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lecture(
    lecture_id: int,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Delete a lecture and remove its stored file from disk."""
    document = _get_owned_lecture_or_404(lecture_id, current_user.id, db)
    storage_path = document.storage_path
    upload_dir = getattr(
        request.app.state, "upload_dir", settings.upload_dir_path
    )

    db.delete(document)
    db.commit()

    delete_stored_file(storage_path, upload_dir=upload_dir)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

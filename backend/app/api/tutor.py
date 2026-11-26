from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.document import Document
from app.models.tutor import StudyActivityLog, TutorMessage
from app.models.user import User
from app.schemas.document import format_uploaded_at
from app.schemas.study import (
    TutorAskRequest,
    TutorAskResponse,
    TutorCitationSchema,
    TutorHistoryMessageResponse,
)
from app.services.rag_service import ask_tutor_with_rag

router = APIRouter(
    prefix="/api/v1/tutor",
    tags=["AI Tutor"],
)


def _resolve_optional_lecture_id(
    raw_lecture_id: str | None,
    user_id: int,
    db: Session,
) -> int | None:
    if not raw_lecture_id or raw_lecture_id.strip().lower() == "all":
        return None
    try:
        doc_id = int(raw_lecture_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid lectureId.",
        ) from exc

    doc = db.scalar(
        select(Document).where(
            Document.id == doc_id,
            Document.user_id == user_id,
        )
    )
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )
    return doc.id


@router.post("/ask", response_model=TutorAskResponse)
def ask_tutor(
    payload: TutorAskRequest,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Answer a question grounded in the user's lectures via hybrid RAG."""
    doc_id = _resolve_optional_lecture_id(
        payload.lecture_id, current_user.id, db
    )
    gemini_client = getattr(request.app.state, "gemini_client", None)

    answer, citations = ask_tutor_with_rag(
        db=db,
        user_id=current_user.id,
        question=payload.question.strip(),
        document_id=doc_id,
        gemini_client=gemini_client,
    )

    db.add(
        TutorMessage(
            user_id=current_user.id,
            document_id=doc_id,
            role="user",
            content=payload.question.strip(),
            citations=[],
        )
    )
    db.add(
        TutorMessage(
            user_id=current_user.id,
            document_id=doc_id,
            role="assistant",
            content=answer,
            citations=citations,
        )
    )
    db.add(
        StudyActivityLog(
            user_id=current_user.id,
            document_id=doc_id,
            activity_type="tutor_ask",
            duration_seconds=60,
            cards_count=0,
        )
    )
    db.commit()

    return TutorAskResponse(
        answer=answer,
        citations=[TutorCitationSchema(**c) for c in citations],
    )


@router.get("/history", response_model=list[TutorHistoryMessageResponse])
def get_tutor_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    lecture_id: str | None = Query(default=None),
):
    """Return persisted AI tutor chat history for the user or a specific lecture."""
    doc_id = _resolve_optional_lecture_id(lecture_id, current_user.id, db)
    stmt = select(TutorMessage).where(TutorMessage.user_id == current_user.id)
    if doc_id is not None:
        stmt = stmt.where(TutorMessage.document_id == doc_id)
    stmt = stmt.order_by(TutorMessage.created_at.asc(), TutorMessage.id.asc())

    messages = db.scalars(stmt).all()
    return [
        TutorHistoryMessageResponse(
            id=str(m.id),
            role="user" if m.role == "user" else "assistant",
            content=m.content,
            timestamp=format_uploaded_at(m.created_at),
            citations=[TutorCitationSchema(**c) for c in (m.citations or [])],
        )
        for m in messages
    ]

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.document import Document
from app.models.flashcard import Flashcard
from app.models.tutor import StudyActivityLog
from app.models.user import User
from app.schemas.study import (
    CreateFlashcardRequest,
    FlashcardMastery,
    FlashcardResponse,
    ReviewFlashcardRequest,
)
from app.services.spaced_repetition import compute_sm2_schedule

router = APIRouter(
    prefix="/api/v1/flashcards",
    tags=["Flashcards"],
)


def _to_flashcard_response(card: Flashcard, doc: Document) -> FlashcardResponse:
    mastery: FlashcardMastery = (
        card.mastery if card.mastery in {"new", "learning", "mastered"} else "new"
    )
    return FlashcardResponse(
        id=str(card.id),
        lectureId=str(card.document_id),
        lectureTitle=doc.title or doc.filename,
        subject=doc.subject or "General",
        front=card.front,
        back=card.back,
        hint=card.hint,
        mastery=mastery,
        nextReviewLabel=card.next_review_label or "New card",
    )


@router.get("", response_model=list[FlashcardResponse])
def list_flashcards(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    lecture_id: int | None = Query(default=None, ge=1),
):
    """List flashcards for the authenticated user, optionally filtered by lecture."""
    stmt = (
        select(Flashcard, Document)
        .join(Document, Flashcard.document_id == Document.id)
        .where(Flashcard.user_id == current_user.id)
    )
    if lecture_id is not None:
        stmt = stmt.where(Flashcard.document_id == lecture_id)

    stmt = stmt.order_by(Flashcard.created_at.desc(), Flashcard.id.desc())
    rows = db.execute(stmt).all()
    return [_to_flashcard_response(card, doc) for card, doc in rows]


@router.post("", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
def create_flashcard(
    payload: CreateFlashcardRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Create a custom flashcard linked to an owned lecture."""
    try:
        doc_id = int(payload.lecture_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid lectureId.",
        ) from exc

    doc = db.scalar(
        select(Document).where(
            Document.id == doc_id,
            Document.user_id == current_user.id,
        )
    )
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )

    card = Flashcard(
        user_id=current_user.id,
        document_id=doc.id,
        front=payload.front.strip(),
        back=payload.back.strip(),
        hint=payload.hint.strip() if payload.hint else None,
        mastery="new",
        next_review_label="New card",
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return _to_flashcard_response(card, doc)


@router.post("/{flashcard_id}/review", response_model=FlashcardResponse)
def review_flashcard(
    flashcard_id: int,
    payload: ReviewFlashcardRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Apply SM-2 spaced-repetition update for a flashcard review rating."""
    row = db.execute(
        select(Flashcard, Document)
        .join(Document, Flashcard.document_id == Document.id)
        .where(
            Flashcard.id == flashcard_id,
            Flashcard.user_id == current_user.id,
        )
    ).first()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard not found.",
        )

    card, doc = row
    schedule = compute_sm2_schedule(
        rating=payload.rating,
        current_ease_factor=card.ease_factor,
        current_interval_days=card.interval_days,
        current_repetitions=card.repetitions,
    )

    card.mastery = schedule.mastery
    card.ease_factor = schedule.ease_factor
    card.interval_days = schedule.interval_days
    card.repetitions = schedule.repetitions
    card.next_review_at = schedule.next_review_at
    card.next_review_label = schedule.next_review_label

    db.add(
        StudyActivityLog(
            user_id=current_user.id,
            document_id=doc.id,
            activity_type="flashcard_review",
            duration_seconds=30,
            cards_count=1,
        )
    )
    db.commit()
    db.refresh(card)
    return _to_flashcard_response(card, doc)


@router.delete("/{flashcard_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flashcard(
    flashcard_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Delete a flashcard owned by the authenticated user."""
    card = db.scalar(
        select(Flashcard).where(
            Flashcard.id == flashcard_id,
            Flashcard.user_id == current_user.id,
        )
    )
    if card is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard not found.",
        )
    db.delete(card)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

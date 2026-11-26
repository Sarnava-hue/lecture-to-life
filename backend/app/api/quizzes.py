from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.document import Document
from app.models.quiz import Quiz, QuizAttempt
from app.models.tutor import StudyActivityLog
from app.models.user import User
from app.schemas.study import (
    QuizDifficulty,
    QuizQuestionResponse,
    QuizResponse,
    SubmitQuizRequest,
    SubmitQuizResponse,
)

router = APIRouter(
    prefix="/api/v1/quizzes",
    tags=["Quizzes"],
)


def _to_quiz_response(quiz: Quiz, doc: Document) -> QuizResponse:
    difficulty: QuizDifficulty = (
        quiz.difficulty
        if quiz.difficulty in {"Easy", "Medium", "Hard"}
        else "Medium"
    )
    return QuizResponse(
        id=str(quiz.id),
        lectureId=str(quiz.document_id),
        lectureTitle=doc.title or doc.filename,
        subject=doc.subject or "General",
        title=quiz.title,
        difficulty=difficulty,
        estimatedMinutes=quiz.estimated_minutes,
        questions=[
            QuizQuestionResponse(
                id=str(q.id),
                question=q.question,
                options=list(q.options),
                correctIndex=q.correct_index,
                explanation=q.explanation,
                sourceRef=q.source_ref,
            )
            for q in quiz.questions
        ],
    )


@router.get("", response_model=list[QuizResponse])
def list_quizzes(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    lecture_id: int | None = Query(default=None, ge=1),
):
    """List practice quizzes owned by the authenticated user."""
    stmt = (
        select(Quiz, Document)
        .join(Document, Quiz.document_id == Document.id)
        .options(selectinload(Quiz.questions))
        .where(Quiz.user_id == current_user.id)
    )
    if lecture_id is not None:
        stmt = stmt.where(Quiz.document_id == lecture_id)

    stmt = stmt.order_by(Quiz.created_at.desc(), Quiz.id.desc())
    rows = db.execute(stmt).all()
    return [_to_quiz_response(quiz, doc) for quiz, doc in rows]


@router.post("/{quiz_id}/attempt", response_model=SubmitQuizResponse)
def submit_quiz_attempt(
    quiz_id: int,
    payload: SubmitQuizRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Grade a submitted quiz attempt server-side and record analytics."""
    quiz = db.scalar(
        select(Quiz)
        .options(selectinload(Quiz.questions))
        .where(Quiz.id == quiz_id, Quiz.user_id == current_user.id)
    )
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )

    total_questions = len(quiz.questions)
    correct_count = sum(
        1
        for question in quiz.questions
        if payload.answers.get(str(question.id)) == question.correct_index
    )
    score_percent = (
        round((correct_count / total_questions) * 100)
        if total_questions > 0
        else 0
    )

    attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz.id,
        answers=payload.answers,
        correct_count=correct_count,
        total_questions=total_questions,
        score_percent=score_percent,
        elapsed_seconds=payload.elapsed_seconds,
    )
    db.add(attempt)
    db.add(
        StudyActivityLog(
            user_id=current_user.id,
            document_id=quiz.document_id,
            activity_type="quiz_attempt",
            duration_seconds=max(60, payload.elapsed_seconds),
            cards_count=0,
        )
    )
    db.commit()

    return SubmitQuizResponse(
        quizId=str(quiz.id),
        scorePercent=score_percent,
        correctCount=correct_count,
        totalQuestions=total_questions,
    )

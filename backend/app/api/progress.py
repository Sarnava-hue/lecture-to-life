from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.lectures import get_lecture_counts
from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.document import Document
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz, QuizAttempt
from app.models.tutor import StudyActivityLog
from app.models.user import User
from app.schemas.document import document_to_lecture_response
from app.schemas.study import (
    ProgressAnalyticsResponse,
    QuizScorePointSchema,
    SubjectMasteryPointSchema,
    WeeklyStudyPointSchema,
)

router = APIRouter(
    prefix="/api/v1/progress",
    tags=["Progress"],
)


def _as_utc_date(dt: datetime):
    if dt.tzinfo is None:
        return dt.date()
    return dt.astimezone(timezone.utc).date()


@router.get("", response_model=ProgressAnalyticsResponse)
def get_progress_analytics(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Aggregate weekly study activity, quiz scores, and subject mastery."""
    today = datetime.now(timezone.utc).date()
    seven_days = [today - timedelta(days=offset) for offset in range(6, -1, -1)]
    window_start = datetime.combine(
        seven_days[0], datetime.min.time(), tzinfo=timezone.utc
    )

    logs = db.scalars(
        select(StudyActivityLog).where(
            StudyActivityLog.user_id == current_user.id,
            StudyActivityLog.created_at >= window_start,
        )
    ).all()

    minutes_by_day: dict = defaultdict(float)
    cards_by_day: dict = defaultdict(int)
    for log in logs:
        day_key = _as_utc_date(log.created_at)
        minutes_by_day[day_key] += log.duration_seconds / 60.0
        cards_by_day[day_key] += log.cards_count

    weekly_study = [
        WeeklyStudyPointSchema(
            day=day.strftime("%a"),
            minutes=round(minutes_by_day[day]),
            cards=cards_by_day[day],
        )
        for day in seven_days
    ]

    attempts = db.scalars(
        select(QuizAttempt)
        .where(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.created_at.asc(), QuizAttempt.id.asc())
        .limit(20)
    ).all()
    quiz_trend = [
        QuizScorePointSchema(attempt=f"Attempt {idx}", score=attempt.score_percent)
        for idx, attempt in enumerate(attempts, start=1)
    ]

    documents = db.scalars(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc(), Document.id.desc())
    ).all()

    lectures_by_subject: dict[str, int] = defaultdict(int)
    doc_subject_map: dict[int, str] = {}
    for doc in documents:
        subj = doc.subject or "General"
        lectures_by_subject[subj] += 1
        doc_subject_map[doc.id] = subj

    subject_scores: dict[str, list[int]] = defaultdict(list)
    flashcards = db.scalars(
        select(Flashcard).where(Flashcard.user_id == current_user.id)
    ).all()
    mastery_points = {"mastered": 100, "learning": 50, "new": 0}
    for card in flashcards:
        subj = doc_subject_map.get(card.document_id, "General")
        subject_scores[subj].append(mastery_points.get(card.mastery, 0))

    attempt_quiz_docs = db.execute(
        select(QuizAttempt.score_percent, Quiz.document_id)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .where(QuizAttempt.user_id == current_user.id)
    ).all()
    for score_pct, doc_id in attempt_quiz_docs:
        subj = doc_subject_map.get(doc_id, "General")
        subject_scores[subj].append(score_pct)

    subject_mastery = [
        SubjectMasteryPointSchema(
            subject=subj,
            mastery=(
                round(sum(subject_scores[subj]) / len(subject_scores[subj]))
                if subject_scores[subj]
                else 0
            ),
            lectures=count,
        )
        for subj, count in lectures_by_subject.items()
    ]

    recent_docs = documents[:5]
    fc_counts, quiz_counts = get_lecture_counts(db, [d.id for d in recent_docs])
    recent_lectures = [
        document_to_lecture_response(
            doc,
            flashcard_count=fc_counts.get(doc.id, 0),
            quiz_count=quiz_counts.get(doc.id, 0),
        )
        for doc in recent_docs
    ]

    total_flashcards = (
        db.scalar(
            select(func.count(Flashcard.id)).where(
                Flashcard.user_id == current_user.id
            )
        )
        or 0
    )
    total_quizzes = (
        db.scalar(
            select(func.count(Quiz.id)).where(Quiz.user_id == current_user.id)
        )
        or 0
    )

    return ProgressAnalyticsResponse(
        weeklyStudy=weekly_study,
        quizTrend=quiz_trend,
        subjectMastery=subject_mastery,
        recentLectures=recent_lectures,
        totalFlashcards=total_flashcards,
        totalQuizzes=total_quizzes,
    )

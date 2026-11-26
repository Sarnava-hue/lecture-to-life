from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Literal

ReviewRating = Literal["again", "hard", "good", "easy"]
MasteryLevel = Literal["new", "learning", "mastered"]


@dataclass(frozen=True)
class ReviewScheduleResult:
    mastery: MasteryLevel
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_at: datetime
    next_review_label: str


def compute_sm2_schedule(
    rating: ReviewRating,
    current_ease_factor: float = 2.5,
    current_interval_days: int = 0,
    current_repetitions: int = 0,
    now: datetime | None = None,
) -> ReviewScheduleResult:
    """Compute next spaced-repetition interval and mastery state using SM-2."""
    ts = now or datetime.now(timezone.utc)
    ef = max(1.3, current_ease_factor)

    if rating == "again":
        return ReviewScheduleResult(
            mastery="learning",
            ease_factor=max(1.3, round(ef - 0.2, 2)),
            interval_days=0,
            repetitions=0,
            next_review_at=ts + timedelta(minutes=10),
            next_review_label="In 10 min",
        )

    if rating == "hard":
        next_interval = max(1, round(current_interval_days * 1.2)) if current_interval_days else 1
        next_ef = max(1.3, round(ef - 0.15, 2))
        next_reps = current_repetitions + 1
        mastery: MasteryLevel = "mastered" if next_interval >= 4 else "learning"
        label = "In 1 day" if next_interval == 1 else f"In {next_interval} days"
        return ReviewScheduleResult(
            mastery=mastery,
            ease_factor=next_ef,
            interval_days=next_interval,
            repetitions=next_reps,
            next_review_at=ts + timedelta(days=next_interval),
            next_review_label=label,
        )

    if rating == "good":
        if current_repetitions == 0:
            next_interval = 1
        elif current_repetitions == 1:
            next_interval = 4
        else:
            next_interval = max(4, round(current_interval_days * ef))
        next_reps = current_repetitions + 1
        mastery = "mastered" if next_reps >= 2 or next_interval >= 4 else "learning"
        label = "In 1 day" if next_interval == 1 else f"In {next_interval} days"
        return ReviewScheduleResult(
            mastery=mastery,
            ease_factor=round(ef, 2),
            interval_days=next_interval,
            repetitions=next_reps,
            next_review_at=ts + timedelta(days=next_interval),
            next_review_label=label,
        )

    # rating == "easy"
    next_interval = max(4, round((current_interval_days or 2) * ef * 1.3))
    next_ef = round(ef + 0.15, 2)
    return ReviewScheduleResult(
        mastery="mastered",
        ease_factor=next_ef,
        interval_days=next_interval,
        repetitions=current_repetitions + 1,
        next_review_at=ts + timedelta(days=next_interval),
        next_review_label=f"In {next_interval} days",
    )

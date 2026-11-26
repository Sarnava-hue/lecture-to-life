from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import StrId
from app.schemas.document import LectureResponse

FlashcardMastery = Literal["new", "learning", "mastered"]
ReviewRating = Literal["again", "hard", "good", "easy"]
QuizDifficulty = Literal["Easy", "Medium", "Hard"]


class FlashcardResponse(BaseModel):
    id: StrId
    lecture_id: StrId = Field(alias="lectureId")
    lecture_title: str = Field(alias="lectureTitle")
    subject: str
    front: str
    back: str
    hint: str | None = None
    mastery: FlashcardMastery
    next_review_label: str = Field(alias="nextReviewLabel")

    model_config = ConfigDict(populate_by_name=True)


class CreateFlashcardRequest(BaseModel):
    lecture_id: str = Field(alias="lectureId")
    front: str = Field(..., min_length=1, max_length=2000)
    back: str = Field(..., min_length=1, max_length=4000)
    hint: str | None = Field(default=None, max_length=1000)

    model_config = ConfigDict(populate_by_name=True)


class ReviewFlashcardRequest(BaseModel):
    flashcard_id: str | None = Field(default=None, alias="flashcardId")
    rating: ReviewRating
    next_mastery: FlashcardMastery | None = Field(default=None, alias="nextMastery")
    next_review_label: str | None = Field(default=None, alias="nextReviewLabel")

    model_config = ConfigDict(populate_by_name=True)


class QuizQuestionResponse(BaseModel):
    id: StrId
    question: str
    options: list[str]
    correct_index: int = Field(alias="correctIndex")
    explanation: str
    source_ref: str = Field(alias="sourceRef")

    model_config = ConfigDict(populate_by_name=True)


class QuizResponse(BaseModel):
    id: StrId
    lecture_id: StrId = Field(alias="lectureId")
    lecture_title: str = Field(alias="lectureTitle")
    subject: str
    title: str
    difficulty: QuizDifficulty
    estimated_minutes: int = Field(alias="estimatedMinutes")
    questions: list[QuizQuestionResponse]

    model_config = ConfigDict(populate_by_name=True)


class SubmitQuizRequest(BaseModel):
    quiz_id: str | None = Field(default=None, alias="quizId")
    answers: dict[str, int] = Field(default_factory=dict)
    elapsed_seconds: int = Field(default=0, ge=0, alias="elapsedSeconds")

    model_config = ConfigDict(populate_by_name=True)


class SubmitQuizResponse(BaseModel):
    quiz_id: StrId = Field(alias="quizId")
    score_percent: int = Field(alias="scorePercent")
    correct_count: int = Field(alias="correctCount")
    total_questions: int = Field(alias="totalQuestions")

    model_config = ConfigDict(populate_by_name=True)


class TutorCitationSchema(BaseModel):
    lecture_id: StrId = Field(alias="lectureId")
    lecture_title: str = Field(alias="lectureTitle")
    reference: str

    model_config = ConfigDict(populate_by_name=True)


class TutorAskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    lecture_id: str | None = Field(default=None, alias="lectureId")

    model_config = ConfigDict(populate_by_name=True)


class TutorAskResponse(BaseModel):
    answer: str
    citations: list[TutorCitationSchema]


class TutorHistoryMessageResponse(BaseModel):
    id: StrId
    role: Literal["user", "assistant"]
    content: str
    timestamp: str
    citations: list[TutorCitationSchema] = Field(default_factory=list)


class WeeklyStudyPointSchema(BaseModel):
    day: str
    minutes: int
    cards: int


class QuizScorePointSchema(BaseModel):
    attempt: str
    score: int


class SubjectMasteryPointSchema(BaseModel):
    subject: str
    mastery: int
    lectures: int


class ProgressAnalyticsResponse(BaseModel):
    weekly_study: list[WeeklyStudyPointSchema] = Field(alias="weeklyStudy")
    quiz_trend: list[QuizScorePointSchema] = Field(alias="quizTrend")
    subject_mastery: list[SubjectMasteryPointSchema] = Field(alias="subjectMastery")
    recent_lectures: list[LectureResponse] = Field(alias="recentLectures")
    total_flashcards: int = Field(alias="totalFlashcards")
    total_quizzes: int = Field(alias="totalQuizzes")

    model_config = ConfigDict(populate_by_name=True)

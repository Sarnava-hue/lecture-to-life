import type {
  FlashcardMastery,
  Lecture,
  LectureStatus,
  QuizScorePoint,
  SubjectMasteryPoint,
  TutorCitation,
  WeeklyStudyPoint,
} from "@/types/study";

export interface HealthResponse {
  status: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: UserProfile;
}

export type GenerationTarget = "summary" | "flashcards" | "quiz" | "conceptMap";

export interface UploadLectureMetadata {
  title: string;
  subject: string;
  targets: GenerationTarget[];
}

export interface UploadLectureResponse {
  lecture_id: string;
  status: LectureStatus;
  message?: string;
}

export interface LectureStatusResponse {
  lecture_id: string;
  status: LectureStatus;
  progress?: number;
  error?: string;
}

export interface CreateFlashcardRequest {
  lectureId: string;
  front: string;
  back: string;
  hint?: string;
}

export interface ReviewFlashcardRequest {
  flashcardId: string;
  rating: "again" | "hard" | "good" | "easy";
  nextMastery: FlashcardMastery;
  nextReviewLabel: string;
}

export interface SubmitQuizRequest {
  quizId: string;
  answers: Record<string, number>;
  elapsedSeconds: number;
}

export interface SubmitQuizResponse {
  quizId: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
}

export interface TutorAskRequest {
  question: string;
  lectureId?: string;
}

export interface TutorAskResponse {
  answer: string;
  citations: TutorCitation[];
}

export interface ProgressAnalyticsResponse {
  weeklyStudy: WeeklyStudyPoint[];
  quizTrend: QuizScorePoint[];
  subjectMastery: SubjectMasteryPoint[];
  recentLectures: Lecture[];
  totalFlashcards: number;
  totalQuizzes: number;
}

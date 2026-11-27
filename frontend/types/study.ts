export type LectureStatus = "ready" | "processing" | "failed";

export type LectureSourceType = "pdf" | "docx" | "txt" | "audio";

export interface LectureSegment {
  id: string;
  label: string;
  reference: string;
  text: string;
}

export interface ConceptNodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  kind?: "root" | "branch" | "leaf";
}

export interface ConceptEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Lecture {
  id: string;
  title: string;
  subject: string;
  duration: string;
  status: LectureStatus;
  sourceType: LectureSourceType;
  uploadedAt: string;
  summary: string;
  keyTakeaways: string[];
  segments: LectureSegment[];
  conceptNodes: ConceptNodeData[];
  conceptEdges: ConceptEdgeData[];
  flashcardCount: number;
  quizCount: number;
}

export interface LecturePreview {
  id: string;
  title: string;
  subject: string;
  duration: string;
}

export type FlashcardMastery = "new" | "learning" | "mastered";

export interface Flashcard {
  id: string;
  lectureId: string;
  lectureTitle: string;
  subject: string;
  front: string;
  back: string;
  hint?: string;
  mastery: FlashcardMastery;
  nextReviewLabel: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceRef: string;
}

export interface Quiz {
  id: string;
  lectureId: string;
  lectureTitle: string;
  subject: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedMinutes: number;
  questions: QuizQuestion[];
}

export interface TutorCitation {
  lectureId: string;
  lectureTitle: string;
  reference: string;
}

export interface TutorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: TutorCitation[];
}

export interface WeeklyStudyPoint {
  day: string;
  minutes: number;
  cards: number;
}

export interface QuizScorePoint {
  attempt: string;
  score: number;
}

export interface SubjectMasteryPoint {
  subject: string;
  mastery: number;
  lectures: number;
}

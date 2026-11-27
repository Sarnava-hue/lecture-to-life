import {
  ApiError,
  apiClient,
  clearAccessToken,
  isMockModeEnabled,
  setAccessToken,
} from "@/lib/api-client";
import {
  flashcardsData,
  initialTutorMessages,
  lecturesData,
  quizzesData,
  quizScoreTrendData,
  subjectMasteryData,
  weeklyStudyData,
} from "@/lib/mock-data";
import type {
  AuthResponse,
  CreateFlashcardRequest,
  HealthResponse,
  LectureStatusResponse,
  LoginRequest,
  ProgressAnalyticsResponse,
  RegisterRequest,
  ReviewFlashcardRequest,
  SubmitQuizRequest,
  SubmitQuizResponse,
  TutorAskRequest,
  TutorAskResponse,
  UploadLectureMetadata,
  UploadLectureResponse,
  UserProfile,
} from "@/types/api";
import type { Flashcard, Lecture, Quiz, TutorMessage } from "@/types/study";

const API_PREFIX = "/api/v1";

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function checkBackendHealth(): Promise<{
  reachable: boolean;
  status: string;
}> {
  try {
    const response = await apiClient.get<HealthResponse>("/health", {
      timeout: 3000,
    });
    return {
      reachable: true,
      status: response.data?.status ?? "healthy",
    };
  } catch {
    return {
      reachable: false,
      status: "offline",
    };
  }
}

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  if (isMockModeEnabled()) {
    await delay(450);
    const mockAuth: AuthResponse = {
      access_token: "preview-mock-token",
      token_type: "bearer",
      user: {
        id: "preview-user",
        name: "Anushka Dey",
        email: payload.email,
      },
    };
    setAccessToken(mockAuth.access_token);
    return mockAuth;
  }

  const response = await apiClient.post<AuthResponse>(
    `${API_PREFIX}/auth/login`,
    payload
  );
  if (response.data.access_token) {
    setAccessToken(response.data.access_token);
  }
  return response.data;
}

export async function registerUser(
  payload: RegisterRequest
): Promise<AuthResponse> {
  if (isMockModeEnabled()) {
    await delay(500);
    const mockAuth: AuthResponse = {
      access_token: "preview-mock-token",
      token_type: "bearer",
      user: {
        id: "preview-user",
        name: payload.name,
        email: payload.email,
      },
    };
    setAccessToken(mockAuth.access_token);
    return mockAuth;
  }

  const response = await apiClient.post<AuthResponse>(
    `${API_PREFIX}/auth/register`,
    payload
  );
  if (response.data.access_token) {
    setAccessToken(response.data.access_token);
  }
  return response.data;
}

export function logoutUser(): void {
  clearAccessToken();
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  if (isMockModeEnabled()) {
    return {
      id: "preview-user",
      name: "Anushka Dey",
      email: "student@lecturetolife.app",
    };
  }
  const response = await apiClient.get<UserProfile>(`${API_PREFIX}/auth/profile`);
  return response.data;
}

export async function fetchLectures(): Promise<Lecture[]> {
  if (isMockModeEnabled()) {
    return lecturesData;
  }
  const response = await apiClient.get<Lecture[]>(`${API_PREFIX}/lectures`);
  return response.data;
}

export async function fetchLectureById(id: string): Promise<Lecture | null> {
  if (isMockModeEnabled()) {
    return lecturesData.find((item) => item.id === id) ?? null;
  }
  try {
    const response = await apiClient.get<Lecture>(`${API_PREFIX}/lectures/${id}`);
    return response.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function uploadLecture(
  file: File,
  metadata: UploadLectureMetadata,
  options?: {
    onProgress?: (percent: number) => void;
    signal?: AbortSignal;
  }
): Promise<UploadLectureResponse> {
  if (isMockModeEnabled()) {
    options?.onProgress?.(25);
    await delay(650, options?.signal);
    options?.onProgress?.(58);
    await delay(750, options?.signal);
    options?.onProgress?.(85);
    return {
      lecture_id: "1",
      status: "processing",
      message: "Mock upload accepted",
    };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", metadata.title);
  formData.append("subject", metadata.subject);
  formData.append("targets", JSON.stringify(metadata.targets));

  const response = await apiClient.post<UploadLectureResponse>(
    `${API_PREFIX}/lectures/upload`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      signal: options?.signal,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && progressEvent.total > 0) {
          const pct = Math.min(
            95,
            Math.round((progressEvent.loaded / progressEvent.total) * 100)
          );
          options?.onProgress?.(pct);
        }
      },
    }
  );
  return response.data;
}

export async function pollLectureStatus(
  lectureId: string,
  options?: {
    onTick?: (status: LectureStatusResponse) => void;
    signal?: AbortSignal;
    intervalMs?: number;
    maxAttempts?: number;
  }
): Promise<LectureStatusResponse> {
  if (isMockModeEnabled()) {
    await delay(1400, options?.signal);
    const done: LectureStatusResponse = {
      lecture_id: lectureId,
      status: "ready",
      progress: 100,
    };
    options?.onTick?.(done);
    return done;
  }

  const intervalMs = options?.intervalMs ?? 2000;
  const maxAttempts = options?.maxAttempts ?? 45;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await apiClient.get<LectureStatusResponse>(
      `${API_PREFIX}/lectures/${lectureId}/status`,
      { signal: options?.signal }
    );
    options?.onTick?.(response.data);

    if (
      response.data.status === "ready" ||
      response.data.status === "failed"
    ) {
      return response.data;
    }

    await delay(intervalMs, options?.signal);
  }

  return {
    lecture_id: lectureId,
    status: "processing",
  };
}

export async function deleteLecture(lectureId: string): Promise<void> {
  if (isMockModeEnabled()) {
    return;
  }
  await apiClient.delete(`${API_PREFIX}/lectures/${lectureId}`);
}

export async function fetchFlashcards(
  lectureId?: string
): Promise<Flashcard[]> {
  if (isMockModeEnabled()) {
    return lectureId
      ? flashcardsData.filter((c) => c.lectureId === lectureId)
      : flashcardsData;
  }
  const response = await apiClient.get<Flashcard[]>(
    `${API_PREFIX}/flashcards`,
    { params: lectureId ? { lecture_id: lectureId } : undefined }
  );
  return response.data;
}

export async function createFlashcard(
  payload: CreateFlashcardRequest
): Promise<Flashcard> {
  if (isMockModeEnabled()) {
    const lecture = lecturesData.find((item) => item.id === payload.lectureId);
    return {
      id: `fc-custom-${Date.now()}`,
      lectureId: lecture?.id ?? payload.lectureId,
      lectureTitle: lecture?.title ?? "Custom Deck",
      subject: lecture?.subject ?? "General",
      front: payload.front,
      back: payload.back,
      hint: payload.hint,
      mastery: "new",
      nextReviewLabel: "New card",
    };
  }

  const response = await apiClient.post<Flashcard>(
    `${API_PREFIX}/flashcards`,
    payload
  );
  return response.data;
}

export async function reviewFlashcard(
  payload: ReviewFlashcardRequest
): Promise<Flashcard | void> {
  if (isMockModeEnabled()) {
    return;
  }
  const response = await apiClient.post<Flashcard>(
    `${API_PREFIX}/flashcards/${payload.flashcardId}/review`,
    payload
  );
  return response.data;
}

export async function fetchQuizzes(lectureId?: string): Promise<Quiz[]> {
  if (isMockModeEnabled()) {
    return lectureId
      ? quizzesData.filter((q) => q.lectureId === lectureId)
      : quizzesData;
  }
  const response = await apiClient.get<Quiz[]>(`${API_PREFIX}/quizzes`, {
    params: lectureId ? { lecture_id: lectureId } : undefined,
  });
  return response.data;
}

export async function submitQuizAttempt(
  payload: SubmitQuizRequest
): Promise<SubmitQuizResponse> {
  if (isMockModeEnabled()) {
    const quiz = quizzesData.find((item) => item.id === payload.quizId);
    const total = quiz?.questions.length ?? 0;
    const correct = quiz
      ? quiz.questions.filter(
          (q) => payload.answers[q.id] === q.correctIndex
        ).length
      : 0;
    return {
      quizId: payload.quizId,
      correctCount: correct,
      totalQuestions: total,
      scorePercent: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }

  const response = await apiClient.post<SubmitQuizResponse>(
    `${API_PREFIX}/quizzes/${payload.quizId}/attempt`,
    payload
  );
  return response.data;
}

export async function askTutor(
  payload: TutorAskRequest,
  signal?: AbortSignal
): Promise<TutorAskResponse> {
  if (isMockModeEnabled()) {
    await delay(550, signal);
    const pool =
      !payload.lectureId || payload.lectureId === "all"
        ? lecturesData
        : lecturesData.filter((lecture) => lecture.id === payload.lectureId);

    const tokens = payload.question
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3);

    let bestLecture = pool[0] ?? lecturesData[0];
    let bestSegment = bestLecture.segments[0];
    let bestScore = -1;

    for (const lecture of pool) {
      for (const segment of lecture.segments) {
        const haystack =
          `${lecture.title} ${segment.label} ${segment.text}`.toLowerCase();
        const score = tokens.reduce(
          (acc, token) => (haystack.includes(token) ? acc + 1 : acc),
          0
        );
        if (score > bestScore) {
          bestScore = score;
          bestLecture = lecture;
          bestSegment = segment;
        }
      }
    }

    return {
      answer: `Based on "${bestLecture.title}" (${bestSegment.label}): ${bestSegment.text}\n\nKey takeaway: ${bestLecture.keyTakeaways[0]}`,
      citations: [
        {
          lectureId: bestLecture.id,
          lectureTitle: bestLecture.title,
          reference: bestSegment.reference,
        },
      ],
    };
  }

  const response = await apiClient.post<TutorAskResponse>(
    `${API_PREFIX}/tutor/ask`,
    payload,
    { signal }
  );
  return response.data;
}

export async function fetchTutorHistory(
  lectureId?: string
): Promise<TutorMessage[]> {
  if (isMockModeEnabled()) {
    return initialTutorMessages;
  }
  const response = await apiClient.get<TutorMessage[]>(
    `${API_PREFIX}/tutor/history`,
    {
      params:
        lectureId && lectureId !== "all" ? { lecture_id: lectureId } : undefined,
    }
  );
  return response.data;
}

export async function fetchProgressAnalytics(): Promise<ProgressAnalyticsResponse> {
  if (isMockModeEnabled()) {
    return {
      weeklyStudy: weeklyStudyData,
      quizTrend: quizScoreTrendData,
      subjectMastery: subjectMasteryData,
      recentLectures: lecturesData,
      totalFlashcards: flashcardsData.length,
      totalQuizzes: quizzesData.length,
    };
  }
  const response = await apiClient.get<ProgressAnalyticsResponse>(
    `${API_PREFIX}/progress`
  );
  return response.data;
}

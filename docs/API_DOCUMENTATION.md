# API Documentation

Base URL (local development): `http://localhost:8000`
Interactive OpenAPI docs: `/docs` (Swagger UI) and `/redoc`.
Static schema export: `docs/openapi.json` (generated via `python scripts/export_openapi.py`).

All `/api/v1/*` routes except `/api/v1/auth/register`, `/api/v1/auth/login`, and `/api/v1/auth/token` require `Authorization: Bearer <access_token>`.

## Health

- `GET /` — API welcome & running status
- `GET /health` — Verifies database connectivity (`200 {"status":"healthy"}` or `503 {"status":"unhealthy"}`)

## Authentication (`/api/v1/auth`)

| Method | Path | Body | Response | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | `{ name, email, password }` | `201 AuthResponse` | Returns JWT + `user` (`id` string) |
| `POST` | `/api/v1/auth/login` | `{ email, password }` | `200 AuthResponse` | Used by frontend JSON login |
| `POST` | `/api/v1/auth/token` | OAuth2 form (`username`, `password`) | `200 AuthResponse` | Used by Swagger UI Authorize |
| `GET` | `/api/v1/auth/profile` | — | `200 UserResponse` | Current user profile |

Auth endpoints enforce sliding-window rate limiting (`429 Too Many Requests`).

## Lectures (`/api/v1/lectures`)

| Method | Path | Input | Response | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/lectures` | `?limit=50&offset=0` | `200 Lecture[]` | CamelCase fields matching `frontend/types/study.ts` |
| `POST` | `/api/v1/lectures/upload` | `multipart/form-data`: `file`, `title`, `subject`, `targets` | `201 UploadLectureResponse` | Streams & checks magic bytes (PDF, DOCX, TXT, MP3, WAV, M4A, MP4, WEBM up to 100 MB) |
| `GET` | `/api/v1/lectures/{id}` | — | `200 Lecture` | Includes `segments`, `summary`, `keyTakeaways`, `conceptNodes`, `conceptEdges`, counts |
| `GET` | `/api/v1/lectures/{id}/status` | — | `200 LectureStatusResponse` | `{ lecture_id, status, progress, error }` |
| `GET` | `/api/v1/lectures/{id}/download` | — | `200 FileResponse` | Downloads original uploaded file |
| `POST` | `/api/v1/lectures/{id}/reprocess` | Optional `{ targets? }` | `202 UploadLectureResponse` | Re-runs extraction, chunking & AI generation |
| `DELETE` | `/api/v1/lectures/{id}` | — | `204 No Content` | Deletes DB record & stored file |

## Flashcards (`/api/v1/flashcards`)

| Method | Path | Input | Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/flashcards` | Optional `?lecture_id=` | `200 Flashcard[]` |
| `POST` | `/api/v1/flashcards` | `{ lectureId, front, back, hint? }` | `201 Flashcard` |
| `POST` | `/api/v1/flashcards/{id}/review` | `{ rating: "again" \| "hard" \| "good" \| "easy", ... }` | `200 Flashcard` (SM-2 updated) |
| `DELETE` | `/api/v1/flashcards/{id}` | — | `204 No Content` |

## Quizzes (`/api/v1/quizzes`)

| Method | Path | Input | Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/quizzes` | Optional `?lecture_id=` | `200 Quiz[]` |
| `POST` | `/api/v1/quizzes/{id}/attempt` | `{ answers: Record<string, int>, elapsedSeconds }` | `200 { quizId, scorePercent, correctCount, totalQuestions }` |

## AI Tutor & Progress (`/api/v1/tutor`, `/api/v1/progress`)

| Method | Path | Input | Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/tutor/ask` | `{ question, lectureId? }` | `200 { answer, citations: [{ lectureId, lectureTitle, reference }] }` |
| `GET` | `/api/v1/tutor/history` | Optional `?lecture_id=` | `200 TutorHistoryMessage[]` |
| `GET` | `/api/v1/progress` | — | `200 ProgressAnalyticsResponse` |

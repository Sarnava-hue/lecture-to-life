# Development Log

## Backend & AI/ML Milestones (Member 1 — `main`)

1. **Initial Backend Foundation (`1dcd0eb` – `3ac97e9`)**
   - FastAPI scaffolding, PostgreSQL connection, initial `User` and `Document` models, JWT authentication, and initial Alembic setup.
2. **Point 1 — Frontend Contract Alignment & Security Hardening (`80cd839`)**
   - Fixed UTF-16LE `requirements.txt` encoding and `bcrypt==4.0.1` / `passlib` compatibility.
   - Added CORS middleware, DB-verified `/health`, `/api/v1/auth/*` JSON login/register returning `AuthResponse`, and `/api/v1/lectures/*` endpoints matching `member2-frontend`.
   - Added streaming chunked file uploads with magic-byte verification, user isolation, and Backend CI (`.github/workflows/backend-ci.yml`).
3. **Point 2 — AI/ML Pipeline & Complete Study APIs (`5bcdf22`)**
   - Added `lecture_chunks`, `flashcards`, `quizzes`, `quiz_questions`, `quiz_attempts`, `tutor_messages`, and `study_activity_logs` tables (`4f8a9d2c1b0e`).
   - Built multi-format extraction (`pypdf`, `python-docx`, TXT, Gemini audio/video transcription), overlapping chunking, Gemini structured study-bundle generation with deterministic offline fallback, hybrid semantic + lexical RAG tutor, SM-2 flashcard scheduler, quiz grading, and progress analytics.
4. **Point 3 — OCR, Rate Limiting, Docker, OpenAPI & Docs**
   - Added scanned-PDF OCR fallback (`pytesseract` + `Pillow` or Gemini Vision), sliding-window auth rate limiting, `/lectures/{id}/download`, `/lectures/{id}/reprocess`, `backend/Dockerfile`, `docker-compose.yml`, `scripts/export_openapi.py`, and full project docs.

## Merging `member2-frontend` with `main`

`member2-frontend` branched from `4397547` before later backend commits on `main`. When merging `main` into `member2-frontend` (or opening the integration PR):
- Keep **`main`'s** `backend/` directory, `.github/workflows/backend-ci.yml`, `requirements.txt`, `docker-compose.yml`, and `docs/`.
- Keep **`member2-frontend`'s** `frontend/` directory and `.github/workflows/frontend-ci.yml`.
- Merge `.gitignore` cleanly to retain both Python/storage and Next.js ignore rules.
- Set `NEXT_PUBLIC_USE_MOCK_DATA=false` in `frontend/.env.local` to connect the live UI to `http://localhost:8000`.

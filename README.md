# Lecture-to-Life

Lecture-to-Life is an AI-powered learning companion that transforms lecture documents and recordings into structured study material: summaries, key takeaways, interactive concept maps, spaced-repetition flashcards, quizzes, a citation-backed RAG AI tutor, and learning progress analytics.

## Features Implemented (Backend & AI/ML)

- **JWT Authentication & Rate Limiting (`/api/v1/auth`)**: Registration, JSON & OAuth2 login, active-user profile, bcrypt password hashing, and sliding-window auth rate limiting.
- **Hardened Multi-Format Ingestion (`/api/v1/lectures`)**: Streaming chunked uploads up to 100 MB with magic-byte validation for `.pdf`, `.docx`, `.txt`, `.mp3`, `.wav`, `.m4a`, `.mp4`, and `.webm`, plus download, status polling, and reprocessing.
- **Extraction & Scanned-PDF OCR**: Page-level `pypdf` extraction with OCR fallback (`pytesseract` + `Pillow` or Gemini Vision), `python-docx` section parsing, TXT extraction, and Gemini multimodal audio/video transcription.
- **Gemini AI Study Generation & Offline Fallback**: Generates executive summaries, key takeaways, hierarchical concept maps, flashcards, and MCQs using `google-genai` structured outputs (falling back gracefully to deterministic extractive generation when `GEMINI_API_KEY` is unset).
- **Hybrid RAG AI Tutor (`/api/v1/tutor`)**: Overlapping lecture chunking, Gemini embeddings, and user-isolated hybrid semantic + lexical retrieval returning cited answers (`lectureId`, `lectureTitle`, `reference`).
- **Spaced Repetition, Quizzes & Analytics (`/api/v1/flashcards`, `/api/v1/quizzes`, `/api/v1/progress`)**: Server-side SM-2 scheduling, server-side quiz grading, and 7-day study/mastery aggregation.

## Project Structure

- `backend/` — FastAPI app, SQLAlchemy 2.0 models, Alembic migrations, AI/RAG services, `Dockerfile`, and `pytest` suite
- `frontend/` — Next.js frontend (actively developed on the `member2-frontend` branch)
- `docs/` — Architecture, database schema, API docs, development log, and exported `openapi.json`
- `scripts/` — OpenAPI export utility (`export_openapi.py`)
- `docker-compose.yml` — Local PostgreSQL + FastAPI stack

## Quick Start (Local Backend)

```bash
cd backend
cp .env.example .env
# Edit backend/.env with your PostgreSQL DATABASE_URL, SECRET_KEY, and optional GEMINI_API_KEY

python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

alembic upgrade head
uvicorn app.main:app --reload
```

Or run PostgreSQL + FastAPI with Docker:

```bash
docker compose up --build
```

## Verification Commands

```bash
cd backend
ruff check app tests alembic/env.py
pytest -v
```

Export OpenAPI schema:

```bash
python scripts/export_openapi.py
```

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Development Log & Branch Merge Guide](docs/DEVELOPMENT_LOG.md)

## Team

- **Member 1 (`main`)** – AI/ML and Backend
- **Member 2 (`member2-frontend`)** – Frontend and Product

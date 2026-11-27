# Project Overview

**Lecture-to-Life** is an AI-powered learning companion that transforms lecture documents (`.pdf`, `.docx`, `.txt`) and lecture recordings (`.mp3`, `.wav`, `.m4a`, `.mp4`, `.webm`) into structured study tools:

- Executive summaries & key takeaways
- Interactive concept maps (nodes & edges)
- Spaced-repetition flashcards (SM-2 scheduling)
- Auto-graded comprehension quizzes with source citations
- Hybrid RAG AI Tutor chat grounded in uploaded lecture segments
- Study consistency, quiz score trend, and subject mastery analytics

## Team Ownership

| Role | Branch | Scope |
| :--- | :--- | :--- |
| **Member 1** | `main` | FastAPI backend, PostgreSQL + Alembic schema, file ingestion/OCR/transcription, Gemini AI generation, hybrid RAG retrieval, SM-2 scheduling, tests, Docker & backend CI |
| **Member 2** | `member2-frontend` | Next.js 16 + TypeScript App Router UI, shadcn/Tailwind components, ReactFlow concept maps, Recharts analytics, Vitest & frontend CI |

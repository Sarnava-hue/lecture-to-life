# Lecture to Life — Frontend

Next.js (App Router) web interface for **Lecture to Life**, an AI-powered learning workspace that turns lecture documents and recordings into summaries, concept maps, flashcards, practice quizzes, and cited AI tutoring.

## Tech Stack

- **Framework:** Next.js `16.3.5` (App Router) & React `19.2.8`
- **Language:** TypeScript (strict mode)
- **Styling & UI:** Tailwind CSS v4, `shadcn` (`base-nova` / `@base-ui/react`), Lucide icons
- **Visualizations:** `recharts` (learning analytics), `reactflow` (interactive concept maps)
- **HTTP Client:** `axios` (`lib/api-client.ts` & `lib/services/study-service.ts`)
- **Testing & Quality:** Vitest, React Testing Library, ESLint, `tsc --noEmit`

## Routes

- `/dashboard` — Learning overview, KPIs, recent lectures, quick actions
- `/lectures` — Searchable/filterable lecture library
- `/lectures/upload` — Lecture document & audio/video uploader with progress & status polling
- `/lectures/[id]` — Lecture study workspace (Summary, Transcript/Notes, Concept Map, Study Tools)
- `/flashcards` — Active-recall flashcard studio with spaced-repetition ratings & custom card creation
- `/quizzes` — Practice quiz runner with live timer, instant explanations, and score breakdown
- `/tutor` — Lecture-scoped AI Tutor chat with clickable source citations
- `/progress` — Weekly study minutes, quiz accuracy trend, and subject mastery charts
- `/settings` — Profile, study goals, Light/Dark/System theme, and FastAPI `/health` check
- `/login` & `/register` — Authentication UI ready for JWT integration

## Local Setup

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Create your environment file from the example:

   ```bash
   cp .env.local.example .env.local
   ```

   - `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000` (FastAPI backend).
   - `NEXT_PUBLIC_USE_MOCK_DATA` defaults to `true` for standalone frontend preview; set to `false` to send requests to the live backend.

3. Start the development server:

   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` — Run Next.js dev server at `http://localhost:3000`
- `npm run build` — Build production bundle
- `npm run start` — Serve production build
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript type check (`tsc --noEmit`)
- `npm test` — Run unit and component tests with Vitest

import Link from "next/link";
import { Upload, Sparkles } from "lucide-react";

export default function WelcomeSection() {
  return (
    <section className="overflow-hidden rounded-2xl bg-indigo-600 p-6 text-white shadow-sm md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-200">
            <Sparkles size={17} />

            <span className="text-sm font-medium">
              Your AI learning workspace
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Turn your next lecture into a complete study session.
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 md:text-base">
            Upload a lecture and transform it into structured learning
            material including summaries, flashcards, quizzes, and more.
          </p>
        </div>

        <Link
          href="/lectures/upload"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
        >
          <Upload size={18} />
          Upload Lecture
        </Link>
      </div>
    </section>
  );
}
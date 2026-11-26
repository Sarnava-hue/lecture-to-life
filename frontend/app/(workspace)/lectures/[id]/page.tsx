import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock3 } from "lucide-react";
import { getLectureById } from "@/lib/mock-lectures";

export default async function LectureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lecture = getLectureById(id);

  if (!lecture) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/lectures"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to Lectures
        </Link>

        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              {lecture.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>{lecture.subject}</span>

              <span className="flex items-center gap-1">
                <Clock3 size={15} />
                {lecture.duration}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Lecture Overview
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Structured summaries, transcripts, flashcards, quizzes, and lecture-scoped AI tutor tools will appear here once connected to the backend pipeline.
        </p>
      </div>
    </div>
  );
}

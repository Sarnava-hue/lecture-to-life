import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LectureUploader from "@/components/lectures/LectureUploader";

export default function UploadLecturePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/lectures"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to Lectures
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Upload New Lecture
        </h1>

        <p className="mt-2 text-slate-600">
          Upload a lecture document to generate summaries, flashcards, and quizzes.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <LectureUploader />
      </div>
    </div>
  );
}

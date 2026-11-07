
import LectureUploader from "../../components/lectures/LectureUploader";

export default function LecturesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          My Lectures
        </h1>

        <p className="mt-2 text-slate-600">
          Upload and manage your learning materials.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Upload New Lecture
        </h2>

        <LectureUploader />
      </div>
    </div>
  );
}

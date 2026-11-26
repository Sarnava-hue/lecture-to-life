import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LectureUploader from "@/components/lectures/LectureUploader";
import { Card, CardContent } from "@/components/ui/card";

export default function UploadLecturePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/lectures"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to Lectures
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-foreground">
          Upload New Lecture
        </h1>

        <p className="mt-2 text-muted-foreground">
          Upload a lecture document to generate summaries, flashcards, and quizzes.
        </p>
      </div>

      <Card className="rounded-2xl py-6 shadow-sm">
        <CardContent className="px-6">
          <LectureUploader />
        </CardContent>
      </Card>
    </div>
  );
}

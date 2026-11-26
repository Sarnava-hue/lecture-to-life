import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to Lectures
        </Link>

        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              {lecture.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="secondary">{lecture.subject}</Badge>

              <span className="flex items-center gap-1">
                <Clock3 size={15} />
                {lecture.duration}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl py-6 shadow-sm">
        <CardHeader className="px-6">
          <CardTitle className="text-lg font-semibold">
            Lecture Overview
          </CardTitle>
        </CardHeader>

        <CardContent className="px-6">
          <p className="text-sm text-muted-foreground">
            Structured summaries, transcripts, flashcards, quizzes, and lecture-scoped AI tutor tools will appear here once connected to the backend pipeline.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

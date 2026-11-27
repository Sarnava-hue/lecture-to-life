import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  Clock3,
  Layers,
  MessageCircle,
} from "lucide-react";
import LectureDetailTabs from "@/components/lectures/LectureDetailTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { flashcardsData } from "@/lib/mock-data";
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

  const lectureFlashcards = flashcardsData.filter(
    (card) => card.lectureId === lecture.id
  );

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

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {lecture.title}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
                <Badge variant="secondary">{lecture.subject}</Badge>
                <Badge variant="outline" className="uppercase">
                  {lecture.sourceType}
                </Badge>

                <span className="flex items-center gap-1">
                  <Clock3 size={15} />
                  {lecture.duration}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              render={<Link href={`/flashcards?lectureId=${lecture.id}`} />}
              nativeButton={false}
              variant="outline"
              size="sm"
            >
              <Layers size={15} />
              Flashcards
            </Button>
            <Button
              render={<Link href={`/quizzes?lectureId=${lecture.id}`} />}
              nativeButton={false}
              variant="outline"
              size="sm"
            >
              <ClipboardCheck size={15} />
              Quiz
            </Button>
            <Button
              render={<Link href={`/tutor?lectureId=${lecture.id}`} />}
              nativeButton={false}
              size="sm"
            >
              <MessageCircle size={15} />
              Ask Tutor
            </Button>
          </div>
        </div>
      </div>

      <LectureDetailTabs lecture={lecture} flashcards={lectureFlashcards} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  BookX,
  ClipboardCheck,
  Clock3,
  Layers,
  Loader2,
  MessageCircle,
  Upload,
} from "lucide-react";
import LectureDetailTabs from "@/components/lectures/LectureDetailTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isMockModeEnabled } from "@/lib/api-client";
import { flashcardsData, lecturesData } from "@/lib/mock-data";
import { fetchFlashcards, fetchLectureById } from "@/lib/services/study-service";
import type { Flashcard, Lecture } from "@/types/study";

export default function LectureDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const mockMode = isMockModeEnabled();

  const [lecture, setLecture] = useState<Lecture | null>(() =>
    mockMode ? lecturesData.find((item) => item.id === id) ?? null : null
  );
  const [lectureFlashcards, setLectureFlashcards] = useState<Flashcard[]>(() =>
    mockMode ? flashcardsData.filter((card) => card.lectureId === id) : []
  );
  const [loading, setLoading] = useState(!mockMode);

  useEffect(() => {
    if (mockMode || !id) {
      return;
    }

    let cancelled = false;
    void Promise.all([fetchLectureById(id), fetchFlashcards(id)])
      .then(([loadedLecture, loadedCards]) => {
        if (!cancelled) {
          setLecture(loadedLecture);
          setLectureFlashcards(loadedCards);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLecture(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, mockMode]);

  if (loading) {
    return (
      <Card className="mx-auto mt-10 max-w-lg rounded-2xl py-10 text-center shadow-sm">
        <CardContent className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={18} className="animate-spin text-primary" />
          Loading study session...
        </CardContent>
      </Card>
    );
  }

  if (!lecture) {
    return (
      <Card className="mx-auto mt-10 max-w-lg rounded-2xl py-8 text-center shadow-sm">
        <CardContent className="space-y-4 px-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookX size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-foreground">
              Lecture not found
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              We couldn&apos;t find a study session for that lecture ID.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button
              render={<Link href="/lectures" />}
              nativeButton={false}
              variant="outline"
            >
              <ArrowLeft size={15} />
              Back to Lectures
            </Button>
            <Button render={<Link href="/lectures/upload" />} nativeButton={false}>
              <Upload size={15} />
              Upload Lecture
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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

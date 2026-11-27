"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Eye,
  Lightbulb,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { extractApiErrorMessage, isMockModeEnabled } from "@/lib/api-client";
import { flashcardsData, lecturesData } from "@/lib/mock-data";
import {
  createFlashcard,
  fetchFlashcards,
  fetchLectures,
  reviewFlashcard,
} from "@/lib/services/study-service";
import type { Flashcard, FlashcardMastery, Lecture } from "@/types/study";

type MasteryFilter = "all" | FlashcardMastery;

const masteryBadgeLabel: Record<FlashcardMastery, string> = {
  new: "New",
  learning: "Learning",
  mastered: "Mastered",
};

const ratingActions: {
  key: string;
  label: string;
  rating: "again" | "hard" | "good" | "easy";
  nextMastery: FlashcardMastery;
  nextReviewLabel: string;
  variant: "destructive" | "outline" | "secondary" | "default";
}[] = [
  {
    key: "1",
    label: "Again",
    rating: "again",
    nextMastery: "learning",
    nextReviewLabel: "In 10 min",
    variant: "destructive",
  },
  {
    key: "2",
    label: "Hard",
    rating: "hard",
    nextMastery: "learning",
    nextReviewLabel: "In 1 day",
    variant: "outline",
  },
  {
    key: "3",
    label: "Good",
    rating: "good",
    nextMastery: "mastered",
    nextReviewLabel: "In 4 days",
    variant: "secondary",
  },
  {
    key: "4",
    label: "Easy",
    rating: "easy",
    nextMastery: "mastered",
    nextReviewLabel: "In 7 days",
    variant: "default",
  },
];

export interface FlashcardStudioProps {
  initialLectureId?: string;
}

export default function FlashcardStudio({
  initialLectureId,
}: FlashcardStudioProps) {
  const mockMode = isMockModeEnabled();

  const [cards, setCards] = useState<Flashcard[]>(() =>
    mockMode ? flashcardsData : []
  );
  const [lectures, setLectures] = useState<Lecture[]>(() =>
    mockMode ? lecturesData : []
  );
  const [loading, setLoading] = useState(!mockMode);
  const [loadError, setLoadError] = useState("");

  const [lectureFilter, setLectureFilter] = useState<string>(() => {
    if (!initialLectureId) {
      return "all";
    }
    if (mockMode) {
      return lecturesData.some((l) => l.id === initialLectureId)
        ? initialLectureId
        : "all";
    }
    return initialLectureId;
  });
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newLectureId, setNewLectureId] = useState(() =>
    mockMode ? (lecturesData[0]?.id ?? "1") : ""
  );
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newHint, setNewHint] = useState("");

  useEffect(() => {
    if (mockMode) {
      return;
    }

    let cancelled = false;
    void Promise.all([fetchFlashcards(), fetchLectures()])
      .then(([loadedCards, loadedLectures]) => {
        if (cancelled) {
          return;
        }
        setCards(loadedCards);
        setLectures(loadedLectures);
        setNewLectureId((prev) => prev || loadedLectures[0]?.id || "");
        setLoadError("");
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(extractApiErrorMessage(err).message);
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
  }, [mockMode]);

  const deck = useMemo(() => {
    return cards.filter((card) => {
      const matchesLecture =
        lectureFilter === "all" || card.lectureId === lectureFilter;
      const matchesMastery =
        masteryFilter === "all" || card.mastery === masteryFilter;
      return matchesLecture && matchesMastery;
    });
  }, [cards, lectureFilter, masteryFilter]);

  const safeIndex = deck.length > 0 ? Math.min(currentIndex, deck.length - 1) : 0;
  const currentCard = deck[safeIndex];

  const handleRate = useCallback(
    (
      nextMastery: FlashcardMastery,
      nextReviewLabel: string,
      ratingValue?: "again" | "hard" | "good" | "easy"
    ) => {
      if (!currentCard) {
        return;
      }

      const resolvedRating =
        ratingValue ??
        (nextReviewLabel === "In 10 min"
          ? "again"
          : nextReviewLabel === "In 1 day"
            ? "hard"
            : nextReviewLabel === "In 4 days"
              ? "good"
              : "easy");

      const targetCardId = currentCard.id;

      void reviewFlashcard({
        flashcardId: targetCardId,
        rating: resolvedRating,
        nextMastery,
        nextReviewLabel,
      }).then((updated) => {
        if (updated) {
          setCards((prev) =>
            prev.map((item) => (item.id === targetCardId ? updated : item))
          );
        }
      });

      setCards((prev) =>
        prev.map((item) =>
          item.id === targetCardId
            ? { ...item, mastery: nextMastery, nextReviewLabel }
            : item
        )
      );
      setReviewedCount((count) => count + 1);
      setIsFlipped(false);
      setShowHint(false);

      if (safeIndex + 1 >= deck.length) {
        setSessionDone(true);
      } else {
        setCurrentIndex(safeIndex + 1);
      }
    },
    [currentCard, deck.length, safeIndex]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (addOpen || sessionDone || !currentCard) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        setIsFlipped((prev) => !prev);
        return;
      }

      const rating = ratingActions.find((item) => item.key === event.key);
      if (rating && isFlipped) {
        event.preventDefault();
        handleRate(rating.nextMastery, rating.nextReviewLabel, rating.rating);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addOpen, currentCard, handleRate, isFlipped, sessionDone]);

  function resetSession(nextLecture = lectureFilter, nextMastery = masteryFilter) {
    setLectureFilter(nextLecture);
    setMasteryFilter(nextMastery);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setReviewedCount(0);
    setSessionDone(false);
  }

  async function handleAddCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newFront.trim() || !newBack.trim() || !newLectureId) {
      return;
    }

    const created = await createFlashcard({
      lectureId: newLectureId,
      front: newFront.trim(),
      back: newBack.trim(),
      hint: newHint.trim() || undefined,
    });

    setCards((prev) => [created, ...prev]);
    setNewFront("");
    setNewBack("");
    setNewHint("");
    setAddOpen(false);
    setCurrentIndex(0);
    setSessionDone(false);
    setIsFlipped(false);
  }

  const progressPercent =
    deck.length === 0
      ? 0
      : sessionDone
        ? 100
        : Math.round(((safeIndex + (isFlipped ? 0.5 : 0)) / deck.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Flashcards</h1>
          <p className="mt-1.5 text-muted-foreground">
            Reinforce key concepts with active recall and spaced repetition.
          </p>
        </div>

        <Button
          type="button"
          disabled={lectures.length === 0}
          onClick={() => setAddOpen(true)}
          className="h-10 shrink-0 rounded-xl px-4 text-sm font-semibold"
        >
          <Plus size={17} />
          Add Flashcard
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="deck-lecture" className="text-xs font-medium text-muted-foreground">
            Deck:
          </label>
          <select
            id="deck-lecture"
            value={lectureFilter}
            onChange={(event) => resetSession(event.target.value, masteryFilter)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Lectures ({cards.length})</option>
            {lectures.map((lecture) => (
              <option key={lecture.id} value={lecture.id}>
                {lecture.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "new", "learning", "mastered"] as MasteryFilter[]).map(
            (filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={masteryFilter === filter ? "default" : "outline"}
                onClick={() => resetSession(lectureFilter, filter)}
                className="rounded-full capitalize"
              >
                {filter === "all" ? "All Cards" : masteryBadgeLabel[filter]}
              </Button>
            )
          )}
        </div>
      </div>

      {loadError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {loadError}
        </p>
      )}

      {loading ? (
        <Card className="rounded-2xl py-12 text-center shadow-sm">
          <CardContent className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={18} className="animate-spin text-primary" />
            Loading flashcards...
          </CardContent>
        </Card>
      ) : deck.length === 0 ? (
        <Card className="rounded-2xl py-12 text-center shadow-sm">
          <CardContent className="space-y-3 px-6">
            <Sparkles size={28} className="mx-auto text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              No flashcards in this filter
            </h2>
            <p className="text-sm text-muted-foreground">
              Switch your lecture or mastery filter, or create a new flashcard.
            </p>
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => resetSession("all", "all")}
              >
                Show all flashcards
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : sessionDone ? (
        <Card className="mx-auto max-w-2xl rounded-2xl py-10 text-center shadow-sm">
          <CardContent className="space-y-4 px-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Deck review complete!
            </h2>
            <p className="text-sm text-muted-foreground">
              You reviewed {reviewedCount} flashcard{reviewedCount === 1 ? "" : "s"} in this session.
            </p>
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => resetSession(lectureFilter, masteryFilter)}
              >
                <RotateCcw size={16} />
                Review Deck Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Card {safeIndex + 1} of {deck.length}
              </span>
              <span>Space to flip · Keys 1–4 to rate</span>
            </div>
            <Progress value={progressPercent} />
          </div>

          <Card className="rounded-2xl py-6 shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 px-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{currentCard.subject}</Badge>
                <Badge variant="outline">
                  {masteryBadgeLabel[currentCard.mastery]}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {currentCard.lectureTitle} · {currentCard.nextReviewLabel}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-6">
              <button
                type="button"
                onClick={() => setIsFlipped((prev) => !prev)}
                className="flex min-h-60 w-full flex-col items-center justify-center rounded-2xl border border-border bg-muted/30 p-8 text-center transition hover:border-primary/40 hover:bg-muted/50"
              >
                <Badge variant={isFlipped ? "default" : "secondary"}>
                  {isFlipped ? "Answer" : "Question"}
                </Badge>

                <p className="mt-5 max-w-xl text-lg font-semibold leading-relaxed text-foreground md:text-xl">
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>

                <span className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Eye size={14} />
                  {isFlipped ? "Click to show question" : "Click or press Space to reveal answer"}
                </span>
              </button>

              {!isFlipped && currentCard.hint && (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint((prev) => !prev)}
                  >
                    <Lightbulb size={15} />
                    {showHint ? "Hide hint" : "Show hint"}
                  </Button>

                  {showHint && (
                    <p className="rounded-xl bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-300">
                      {currentCard.hint}
                    </p>
                  )}
                </div>
              )}

              {isFlipped ? (
                <div className="space-y-2">
                  <p className="text-center text-xs font-medium text-muted-foreground">
                    How well did you recall this?
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {ratingActions.map((action) => (
                      <Button
                        key={action.label}
                        type="button"
                        variant={action.variant}
                        onClick={() =>
                          handleRate(
                            action.nextMastery,
                            action.nextReviewLabel,
                            action.rating
                          )
                        }
                        className="h-auto flex-col gap-0.5 py-2.5"
                      >
                        <span className="text-sm font-semibold">
                          {action.key}. {action.label}
                        </span>
                        <span className="text-[11px] opacity-80">
                          {action.nextReviewLabel}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setIsFlipped(true)}
                  className="h-11 w-full rounded-xl text-sm font-semibold"
                >
                  Reveal Answer
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create flashcard</DialogTitle>
            <DialogDescription>
              Add a custom question-and-answer card to your study deck.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCard} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="new-card-lecture" className="text-xs font-medium">
                Lecture
              </label>
              <select
                id="new-card-lecture"
                value={newLectureId}
                onChange={(event) => setNewLectureId(event.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                {lectures.map((lecture) => (
                  <option key={lecture.id} value={lecture.id}>
                    {lecture.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-card-front" className="text-xs font-medium">
                Question (Front)
              </label>
              <Textarea
                id="new-card-front"
                required
                value={newFront}
                onChange={(event) => setNewFront(event.target.value)}
                placeholder="e.g. Why is regularization used in linear regression?"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-card-back" className="text-xs font-medium">
                Answer (Back)
              </label>
              <Textarea
                id="new-card-back"
                required
                value={newBack}
                onChange={(event) => setNewBack(event.target.value)}
                placeholder="Penalizes large weights to prevent overfitting..."
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-card-hint" className="text-xs font-medium">
                Hint (Optional)
              </label>
              <Input
                id="new-card-hint"
                value={newHint}
                onChange={(event) => setNewHint(event.target.value)}
                placeholder="Optional memory cue"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Flashcard</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

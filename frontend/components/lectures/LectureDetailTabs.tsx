"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ClipboardCheck,
  Copy,
  Layers,
  MessageCircle,
  Search,
} from "lucide-react";
import ConceptMap from "@/components/lectures/ConceptMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Flashcard, Lecture } from "@/types/study";

export interface LectureDetailTabsProps {
  lecture: Lecture;
  flashcards: Flashcard[];
}

export default function LectureDetailTabs({
  lecture,
  flashcards,
}: LectureDetailTabsProps) {
  const [copied, setCopied] = useState(false);
  const [segmentQuery, setSegmentQuery] = useState("");
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({});

  const filteredSegments = useMemo(() => {
    const normalized = segmentQuery.trim().toLowerCase();
    if (!normalized) {
      return lecture.segments;
    }
    return lecture.segments.filter(
      (segment) =>
        segment.label.toLowerCase().includes(normalized) ||
        segment.text.toLowerCase().includes(normalized)
    );
  }, [lecture.segments, segmentQuery]);

  async function copySummary() {
    const content = [
      lecture.title,
      "",
      lecture.summary,
      "",
      "Key Takeaways:",
      ...lecture.keyTakeaways.map((point) => `- ${point}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be restricted in non-HTTPS contexts.
    }
  }

  function toggleFlip(cardId: string) {
    setFlippedIds((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  }

  return (
    <Tabs defaultValue="summary" className="space-y-4">
      <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted p-1">
        <TabsTrigger value="summary" className="px-3 py-1.5">
          Summary &amp; Takeaways
        </TabsTrigger>
        <TabsTrigger value="transcript" className="px-3 py-1.5">
          Transcript &amp; Notes
        </TabsTrigger>
        <TabsTrigger value="concept-map" className="px-3 py-1.5">
          Concept Map
        </TabsTrigger>
        <TabsTrigger value="study-tools" className="px-3 py-1.5">
          Flashcards &amp; Quiz
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="space-y-5">
        <Card className="rounded-2xl py-5 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 px-5">
            <div>
              <CardTitle className="text-lg font-semibold">
                AI Executive Summary
              </CardTitle>
              <CardDescription className="mt-1">
                Synthesized overview from your uploaded material.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copySummary}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </CardHeader>

          <CardContent className="space-y-5 px-5">
            <p className="leading-7 text-foreground/90">{lecture.summary}</p>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Key Takeaways
              </h3>

              <ul className="space-y-2.5">
                {lecture.keyTakeaways.map((takeaway, index) => (
                  <li
                    key={takeaway}
                    className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3.5 text-sm leading-6 text-foreground"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transcript" className="space-y-4">
        <Card className="rounded-2xl py-5 shadow-sm">
          <CardHeader className="flex flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Lecture Sections &amp; Notes
              </CardTitle>
              <CardDescription className="mt-1">
                Search across extracted paragraphs, slides, or timestamps.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={segmentQuery}
                onChange={(event) => setSegmentQuery(event.target.value)}
                placeholder="Search sections..."
                className="h-9 pl-8"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-3 px-5">
            {filteredSegments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No transcript sections match &ldquo;{segmentQuery}&rdquo;.
              </p>
            ) : (
              filteredSegments.map((segment) => (
                <div
                  key={segment.id}
                  className="rounded-xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">
                      {segment.label}
                    </h3>
                    <Badge variant="secondary">{segment.reference}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {segment.text}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="concept-map">
        <Card className="rounded-2xl py-5 shadow-sm">
          <CardHeader className="px-5">
            <CardTitle className="text-lg font-semibold">
              Interactive Concept Map
            </CardTitle>
            <CardDescription className="mt-1">
              Drag nodes or zoom to inspect how key ideas in this lecture connect.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-5">
            <ConceptMap
              nodesData={lecture.conceptNodes}
              edgesData={lecture.conceptEdges}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="study-tools" className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl py-4 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 px-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Flashcard Deck
                </p>
                <p className="text-xs text-muted-foreground">
                  {flashcards.length} cards from this lecture
                </p>
              </div>
              <Button
                render={<Link href={`/flashcards?lectureId=${lecture.id}`} />}
                nativeButton={false}
                size="sm"
              >
                <Layers size={15} />
                Practice
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl py-4 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 px-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Practice Quiz
                </p>
                <p className="text-xs text-muted-foreground">
                  Test comprehension with citations
                </p>
              </div>
              <Button
                render={<Link href={`/quizzes?lectureId=${lecture.id}`} />}
                nativeButton={false}
                size="sm"
              >
                <ClipboardCheck size={15} />
                Start Quiz
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl py-4 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 px-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  AI Tutor Chat
                </p>
                <p className="text-xs text-muted-foreground">
                  Ask lecture-scoped questions
                </p>
              </div>
              <Button
                render={<Link href={`/tutor?lectureId=${lecture.id}`} />}
                nativeButton={false}
                size="sm"
              >
                <MessageCircle size={15} />
                Ask Tutor
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl py-5 shadow-sm">
          <CardHeader className="px-5">
            <CardTitle className="text-base font-semibold">
              Quick Card Preview
            </CardTitle>
            <CardDescription>
              Click any card below to reveal its answer.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 px-5 md:grid-cols-2">
            {flashcards.map((card) => {
              const flipped = Boolean(flippedIds[card.id]);
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => toggleFlip(card.id)}
                  className="rounded-xl border border-border bg-muted/20 p-4 text-left transition hover:border-primary/50 hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={flipped ? "default" : "secondary"}>
                      {flipped ? "Answer" : "Question"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Click to flip
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-foreground">
                    {flipped ? card.back : card.front}
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

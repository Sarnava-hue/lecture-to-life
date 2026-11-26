"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  FileAudio,
  FileText,
  Layers,
  ClipboardCheck,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { lecturesData } from "@/lib/mock-data";
import { deleteLecture } from "@/lib/services/study-service";
import type { Lecture, LectureStatus } from "@/types/study";

const statusLabel: Record<LectureStatus, string> = {
  ready: "Ready",
  processing: "Processing",
  failed: "Failed",
};

export default function LectureLibrary() {
  const [lectures, setLectures] = useState<Lecture[]>(lecturesData);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState<Lecture | null>(null);

  const subjects = useMemo(() => {
    const unique = Array.from(new Set(lectures.map((item) => item.subject)));
    return ["All", ...unique];
  }, [lectures]);

  const filteredLectures = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return lectures.filter((lecture) => {
      const matchesSubject =
        selectedSubject === "All" || lecture.subject === selectedSubject;
      const matchesQuery =
        !normalized ||
        lecture.title.toLowerCase().includes(normalized) ||
        lecture.subject.toLowerCase().includes(normalized) ||
        lecture.summary.toLowerCase().includes(normalized);
      return matchesSubject && matchesQuery;
    });
  }, [lectures, searchQuery, selectedSubject]);

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    const targetId = deleteTarget.id;
    setLectures((prev) => prev.filter((item) => item.id !== targetId));
    setDeleteTarget(null);
    await deleteLecture(targetId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Lectures</h1>
          <p className="mt-1.5 text-muted-foreground">
            Browse, search, and open AI-generated study sessions from your materials.
          </p>
        </div>

        <Button
          render={<Link href="/lectures/upload" />}
          nativeButton={false}
          size="lg"
          className="h-10 shrink-0 rounded-xl px-4 text-sm font-semibold"
        >
          <Upload size={17} />
          Upload Lecture
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter lectures by title or topic..."
            className="h-9 bg-card pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <Button
              key={subject}
              type="button"
              size="sm"
              variant={selectedSubject === subject ? "default" : "outline"}
              onClick={() => setSelectedSubject(subject)}
              className="rounded-full"
            >
              {subject}
            </Button>
          ))}
        </div>
      </div>

      {filteredLectures.length === 0 ? (
        <Card className="rounded-2xl py-12 text-center shadow-sm">
          <CardContent className="space-y-3 px-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen size={22} />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              No lectures found
            </h2>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Try adjusting your search or subject filter, or upload a new lecture to generate study tools.
            </p>
            <div className="pt-2">
              <Button
                render={<Link href="/lectures/upload" />}
                nativeButton={false}
              >
                <Upload size={16} />
                Upload a Lecture
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredLectures.map((lecture) => (
            <Card
              key={lecture.id}
              className="flex flex-col justify-between rounded-2xl py-5 shadow-sm transition hover:ring-primary/40 hover:shadow-md"
            >
              <CardHeader className="space-y-3 px-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {lecture.sourceType === "audio" ? (
                      <FileAudio size={19} />
                    ) : (
                      <FileText size={19} />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="uppercase">
                      {lecture.sourceType}
                    </Badge>
                    <Badge variant="secondary">
                      {statusLabel[lecture.status]}
                    </Badge>
                  </div>
                </div>

                <div>
                  <CardTitle className="line-clamp-2 text-lg font-semibold">
                    {lecture.title}
                  </CardTitle>
                  <CardDescription className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary">{lecture.subject}</Badge>
                    <span className="flex items-center gap-1">
                      <Clock3 size={13} />
                      {lecture.duration}
                    </span>
                    <span>· {lecture.uploadedAt}</span>
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-5">
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {lecture.summary}
                </p>

                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers size={14} className="text-primary" />
                    {lecture.flashcardCount} flashcards
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardCheck size={14} className="text-primary" />
                    {lecture.quizCount} quiz
                  </span>
                </div>
              </CardContent>

              <CardFooter className="justify-between gap-2 bg-transparent px-5 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(lecture)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${lecture.title}`}
                >
                  <Trash2 size={15} />
                  Remove
                </Button>

                <Button
                  render={<Link href={`/lectures/${lecture.id}`} />}
                  nativeButton={false}
                  size="sm"
                  className="rounded-lg"
                >
                  Open session
                  <ArrowRight size={15} />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove lecture?</DialogTitle>
            <DialogDescription>
              This removes &ldquo;{deleteTarget?.title}&rdquo; from your current workspace view.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

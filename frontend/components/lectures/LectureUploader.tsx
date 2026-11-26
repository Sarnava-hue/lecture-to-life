"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  FileAudio,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { extractApiErrorMessage } from "@/lib/api-client";
import { pollLectureStatus, uploadLecture } from "@/lib/services/study-service";
import type { GenerationTarget } from "@/types/api";

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".txt",
  ".mp3",
  ".wav",
  ".m4a",
  ".mp4",
  ".webm",
];

const GENERATION_OPTIONS: { id: GenerationTarget; label: string }[] = [
  { id: "summary", label: "AI Summary" },
  { id: "flashcards", label: "Flashcards" },
  { id: "quiz", label: "Practice Quiz" },
  { id: "conceptMap", label: "Concept Map" },
];

function stripExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function LectureUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<GenerationTarget[]>([
    "summary",
    "flashcards",
    "quiz",
    "conceptMap",
  ]);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState("");
  const [uploadedLectureId, setUploadedLectureId] = useState("1");

  function abortOngoingUpload() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }

  useEffect(() => {
    return () => abortOngoingUpload();
  }, []);

  function isSupportedFile(selectedFile: File): boolean {
    if (selectedFile.type && ALLOWED_TYPES.includes(selectedFile.type)) {
      return true;
    }

    const lowerName = selectedFile.name?.toLowerCase() ?? "";
    return ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  }

  function validateFile(selectedFile: File | null): string | null {
    if (!selectedFile) {
      return "Please select a file.";
    }

    if (!isSupportedFile(selectedFile)) {
      return "Please upload a PDF, DOCX, TXT, MP3, WAV, M4A, MP4, or WEBM file.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "The file must be smaller than 100 MB.";
    }

    return null;
  }

  function handleFile(selectedFile: File) {
    abortOngoingUpload();
    setError("");

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setFile(null);
      setStatus("idle");
      setProgress(0);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setTitle((prev) => prev || stripExtension(selectedFile.name));
    setStatus("idle");
    setProgress(0);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  }

  function handleDropzoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  function toggleTarget(target: GenerationTarget) {
    setSelectedTargets((prev) =>
      prev.includes(target)
        ? prev.filter((item) => item !== target)
        : [...prev, target]
    );
  }

  function removeFile() {
    abortOngoingUpload();
    setFile(null);
    setTitle("");
    setSubject("");
    setStatus("idle");
    setProgress(0);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a lecture file first.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a lecture title before processing.");
      return;
    }

    if (selectedTargets.length === 0) {
      setError("Select at least one resource type to generate.");
      return;
    }

    abortOngoingUpload();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError("");
    setStatus("uploading");
    setProgress(10);

    try {
      const uploadResponse = await uploadLecture(
        file,
        {
          title: title.trim(),
          subject: subject.trim() || "General",
          targets: selectedTargets,
        },
        {
          signal: controller.signal,
          onProgress: (pct) => setProgress(pct),
        }
      );

      setUploadedLectureId(uploadResponse.lecture_id);
      setStatus("processing");
      setProgress(88);

      const finalStatus = await pollLectureStatus(uploadResponse.lecture_id, {
        signal: controller.signal,
        onTick: (tick) => {
          if (typeof tick.progress === "number") {
            setProgress(tick.progress);
          }
        },
      });

      if (finalStatus.status === "failed") {
        setStatus("error");
        setError(finalStatus.error || "Processing failed on the server.");
        return;
      }

      setProgress(100);
      setStatus("success");
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      const normalized = extractApiErrorMessage(err);
      setError(normalized.message);
      setStatus("error");
    }
  }

  const isAudioOrVideo =
    file?.type.startsWith("audio/") ||
    file?.type.startsWith("video/") ||
    /\.(mp3|wav|m4a|mp4|webm)$/i.test(file?.name ?? "");

  return (
    <div className="space-y-5">
      {!file && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload lecture file"
          onClick={() => inputRef.current?.click()}
          onKeyDown={handleDropzoneKeyDown}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-72 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:border-primary/60 hover:bg-muted/40"
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Upload size={25} />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-foreground">
            Drop your lecture here
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            or click to browse your computer
          </p>

          <p className="mt-4 text-xs text-muted-foreground">
            Documents (PDF, DOCX, TXT) or Recordings (MP3, WAV, M4A, MP4) · Max 100 MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.mp3,.wav,.m4a,.mp4,.webm"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {file && (
        <Card aria-live="polite" className="rounded-2xl py-5 shadow-sm">
          <CardContent className="space-y-5 px-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {isAudioOrVideo ? <FileAudio size={22} /> : <FileText size={22} />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {status !== "success" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={removeFile}
                  aria-label="Cancel or remove file"
                >
                  <X size={18} />
                </Button>
              )}
            </div>

            {status === "idle" && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="lecture-title"
                      className="text-xs font-medium text-foreground"
                    >
                      Lecture Title
                    </label>
                    <Input
                      id="lecture-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. Neural Networks Basics"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="lecture-subject"
                      className="text-xs font-medium text-foreground"
                    >
                      Subject / Course
                    </label>
                    <Input
                      id="lecture-subject"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder="e.g. Artificial Intelligence"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-medium text-foreground">
                    Generate study materials
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {GENERATION_OPTIONS.map((option) => {
                      const active = selectedTargets.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleTarget(option.id)}
                          className="rounded-full outline-none"
                        >
                          <Badge
                            variant={active ? "default" : "outline"}
                            className="cursor-pointer px-3 py-1 text-xs"
                          >
                            {option.label}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={handleUpload}
                  className="h-11 w-full rounded-xl text-sm font-semibold"
                >
                  <Upload size={18} />
                  Start Processing
                </Button>
              </div>
            )}

            {(status === "uploading" || status === "processing") && (
              <div className="space-y-3">
                <Progress value={progress} className="w-full" />

                <div
                  className={`flex items-center gap-3 rounded-xl p-4 text-sm ${
                    status === "uploading"
                      ? "bg-primary/10 text-primary"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  <Loader2 size={18} className="shrink-0 animate-spin" />
                  <div>
                    <p className="font-medium">
                      {status === "uploading"
                        ? `Uploading "${title || file.name}"...`
                        : "Processing your lecture..."}
                    </p>
                    <p className="mt-0.5 text-xs opacity-90">
                      {status === "uploading"
                        ? `${progress}% uploaded`
                        : `Generating ${selectedTargets.length} study resource(s).`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleUpload}
                  className="h-11 w-full rounded-xl text-sm font-semibold"
                >
                  <Upload size={18} />
                  Retry Upload
                </Button>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

                  <div>
                    <p className="font-medium">
                      &ldquo;{title || file.name}&rdquo; processed successfully!
                    </p>

                    <p className="mt-1 text-xs opacity-90">
                      Your study resources are ready to explore.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    render={<Link href={`/lectures/${uploadedLectureId}`} />}
                    nativeButton={false}
                    className="h-10 flex-1 rounded-xl text-sm font-semibold"
                  >
                    Open study session
                    <ArrowRight size={16} />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={removeFile}
                    className="h-10 flex-1 rounded-xl text-sm font-medium"
                  >
                    Upload another lecture
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

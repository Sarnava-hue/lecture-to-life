"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

export default function LectureUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState("");

  function clearTimers() {
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current = [];
  }

  useEffect(() => {
    return () => clearTimers();
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
      return "Please upload a PDF, DOCX, or TXT file.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "The file must be smaller than 50 MB.";
    }

    return null;
  }

  function handleFile(selectedFile: File) {
    clearTimers();
    setError("");

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setFile(null);
      setStatus("idle");
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setStatus("idle");
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

  function removeFile() {
    clearTimers();
    setFile(null);
    setStatus("idle");
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleUpload() {
    if (!file) {
      setError("Please select a lecture file first.");
      return;
    }

    clearTimers();
    setError("");
    setStatus("uploading");

    // Temporary mock processing.
    // Later this will call Member 1's backend API.
    const processingTimer = setTimeout(() => {
      setStatus("processing");
    }, 1500);

    const successTimer = setTimeout(() => {
      setStatus("success");
    }, 4000);

    timersRef.current = [processingTimer, successTimer];
  }

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
            PDF, DOCX, or TXT · Maximum 50 MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
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
          <CardContent className="px-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {(status === "idle" || status === "error") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={removeFile}
                  aria-label="Remove file"
                >
                  <X size={18} />
                </Button>
              )}
            </div>

            {status === "idle" && (
              <Button
                type="button"
                size="lg"
                onClick={handleUpload}
                className="mt-5 h-11 w-full rounded-xl text-sm font-semibold"
              >
                <Upload size={18} />
                Start Processing
              </Button>
            )}

            {status === "uploading" && (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-primary/10 p-4 text-sm text-primary">
                <Loader2 size={18} className="animate-spin" />
                Uploading your lecture...
              </div>
            )}

            {status === "processing" && (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                <Loader2 size={18} className="animate-spin" />
                <div>
                  <p className="font-medium">Processing your lecture...</p>
                  <p className="mt-1 text-xs opacity-90">
                    Generating your learning resources.
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>Upload failed. Please try again.</p>
                </div>

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
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

                  <div>
                    <p className="font-medium">
                      Lecture processed successfully!
                    </p>

                    <p className="mt-1 text-xs opacity-90">
                      Your study resources are ready.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={removeFile}
                  className="h-10 w-full rounded-xl text-sm font-medium"
                >
                  Upload another lecture
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

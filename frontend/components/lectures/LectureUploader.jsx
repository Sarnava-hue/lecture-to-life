"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export default function LectureUploader() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  function validateFile(selectedFile) {
    if (!selectedFile) {
      return "Please select a file.";
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      return "Please upload a PDF, DOCX, or TXT file.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "The file must be smaller than 50 MB.";
    }

    return null;
  }

  function handleFile(selectedFile) {
    setError("");

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setStatus("idle");
  }

  function handleInputChange(event) {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  }

  function removeFile() {
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

    setError("");
    setStatus("uploading");

    // Temporary mock processing.
    // Later this will call Member 1's backend API.
    setTimeout(() => {
      setStatus("processing");
    }, 1500);

    setTimeout(() => {
      setStatus("success");
    }, 4000);
  }

  return (
    <div className="space-y-5">
      {!file && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-72 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50"
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Upload size={25} />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            Drop your lecture here
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            or click to browse your computer
          </p>

          <p className="mt-4 text-xs text-slate-400">
            PDF, DOCX, or TXT · Maximum 50 MB
          </p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {file && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">
                {file.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            {status === "idle" && (
              <button
                type="button"
                onClick={removeFile}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Remove file"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {status === "idle" && (
            <button
              type="button"
              onClick={handleUpload}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Upload size={18} />
              Start Processing
            </button>
          )}

          {status === "uploading" && (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700">
              <Loader2 size={18} className="animate-spin" />
              Uploading your lecture...
            </div>
          )}

          {status === "processing" && (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
              <Loader2 size={18} className="animate-spin" />
              <div>
                <p className="font-medium">
                  Processing your lecture...
                </p>
                <p className="mt-1 text-xs">
                  Generating your learning resources.
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle2 size={18} className="mt-0.5" />

              <div>
                <p className="font-medium">
                  Lecture processed successfully!
                </p>

                <p className="mt-1 text-xs">
                  Your study resources are ready.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
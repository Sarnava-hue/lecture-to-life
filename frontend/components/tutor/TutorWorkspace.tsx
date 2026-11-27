"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  BookOpen,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { extractApiErrorMessage } from "@/lib/api-client";
import { initialTutorMessages, lecturesData } from "@/lib/mock-data";
import { askTutor } from "@/lib/services/study-service";
import type { TutorMessage } from "@/types/study";

const suggestedPromptsByScope: Record<string, string[]> = {
  all: [
    "Compare overfitting vs. underfitting from my ML lecture",
    "What is a Process Control Block and why does context switching cost time?",
    "Summarize the difference between 2NF and 3NF",
  ],
  "1": [
    "Explain the bias-variance tradeoff in simple terms",
    "Why do we need a validation split separately from a test split?",
    "How does mini-batch gradient descent update weights?",
  ],
  "2": [
    "Walk through the 5-state process lifecycle",
    "What happens during a context switch?",
    "Compare Round Robin vs. FCFS scheduling",
  ],
  "3": [
    "Give an example of a partial dependency violating 2NF",
    "When does a 3NF table still violate BCNF?",
    "What anomalies happen in unnormalized tables?",
  ],
};

export interface TutorWorkspaceProps {
  initialLectureId?: string;
}

export default function TutorWorkspace({
  initialLectureId,
}: TutorWorkspaceProps) {
  const initialScope =
    initialLectureId && lecturesData.some((l) => l.id === initialLectureId)
      ? initialLectureId
      : "all";

  const [scopeId, setScopeId] = useState(initialScope);
  const [chatSession, setChatSession] = useState(1);
  const [messages, setMessages] = useState<TutorMessage[]>(initialTutorMessages);
  const [input, setInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isResponding]);

  function handleResetChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsResponding(false);
    setChatSession((prev) => prev + 1);
    setMessages(initialTutorMessages);
  }

  async function handleSendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isResponding) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const nextOrdinal = messages.length + 1;
    const userMsg: TutorMessage = {
      id: `u-${chatSession}-${nextOrdinal}`,
      role: "user",
      content: trimmed,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsResponding(true);

    try {
      const reply = await askTutor(
        {
          question: trimmed,
          lectureId: scopeId === "all" ? undefined : scopeId,
        },
        controller.signal
      );

      const aiMsg: TutorMessage = {
        id: `a-${chatSession}-${nextOrdinal + 1}`,
        role: "assistant",
        content: reply.answer,
        timestamp: "Just now",
        citations: reply.citations,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      const normalized = extractApiErrorMessage(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${chatSession}-${nextOrdinal + 1}`,
          role: "assistant",
          content: `Could not reach tutor endpoint: ${normalized.message}`,
          timestamp: "Just now",
        },
      ]);
    } finally {
      setIsResponding(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSendMessage(input);
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage(input);
    }
  }

  const prompts =
    suggestedPromptsByScope[scopeId] ?? suggestedPromptsByScope.all;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Tutor</h1>
          <p className="mt-1.5 text-muted-foreground">
            Ask questions grounded in your uploaded lectures with source citations.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetChat}
          className="self-start sm:self-auto"
        >
          <RotateCcw size={15} />
          New Chat
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="h-fit rounded-2xl py-5 shadow-sm lg:col-span-1">
          <CardHeader className="px-5">
            <CardTitle className="text-sm font-semibold">Lecture Scope</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 px-5">
            <div className="space-y-1.5">
              <Button
                type="button"
                variant={scopeId === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setScopeId("all")}
                className="w-full justify-start rounded-lg"
              >
                <Sparkles size={15} />
                All Lectures
              </Button>

              {lecturesData.map((lecture) => (
                <Button
                  key={lecture.id}
                  type="button"
                  variant={scopeId === lecture.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setScopeId(lecture.id)}
                  className="h-auto w-full justify-start rounded-lg py-2 text-left"
                >
                  <BookOpen size={15} className="shrink-0" />
                  <span className="truncate">{lecture.title}</span>
                </Button>
              ))}
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Suggested prompts
              </p>

              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSendMessage(prompt)}
                    className="w-full rounded-xl border border-border bg-muted/30 p-2.5 text-left text-xs leading-5 text-foreground transition hover:border-primary/40 hover:bg-muted/60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-[600px] flex-col rounded-2xl py-0 shadow-sm lg:col-span-3">
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="mt-0.5 shrink-0">
                    <AvatarFallback
                      className={
                        isUser
                          ? "bg-primary text-xs font-semibold text-primary-foreground"
                          : "bg-primary/10 text-xs font-semibold text-primary"
                      }
                    >
                      {isUser ? "AD" : "AI"}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`max-w-[82%] space-y-2 rounded-2xl px-4 py-3 text-sm leading-6 ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/40 text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>

                    {message.citations && message.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {message.citations.map((citation) => (
                          <Link
                            key={`${message.id}-${citation.lectureId}-${citation.reference}`}
                            href={`/lectures/${citation.lectureId}`}
                          >
                            <Badge variant="secondary" className="hover:bg-primary/15">
                              {citation.lectureTitle} · {citation.reference}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isResponding && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Avatar className="shrink-0">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    AI
                  </AvatarFallback>
                </Avatar>
                <span className="inline-flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-2.5">
                  <Loader2 size={15} className="animate-spin text-primary" />
                  Searching lecture notes...
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 border-t border-border bg-card p-4"
          >
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Ask a question about your lectures (Enter to send, Shift+Enter for new line)..."
              className="max-h-32 min-h-11 resize-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isResponding}
              aria-label="Send message"
              className="h-11 w-11 shrink-0 rounded-xl"
            >
              <Send size={17} />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

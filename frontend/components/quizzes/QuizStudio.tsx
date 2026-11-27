"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  RotateCcw,
  XCircle,
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
import { Progress } from "@/components/ui/progress";
import { quizzesData } from "@/lib/mock-data";
import { submitQuizAttempt } from "@/lib/services/study-service";
import type { Quiz } from "@/types/study";

export interface QuizStudioProps {
  initialLectureId?: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function QuizStudio({ initialLectureId }: QuizStudioProps) {
  const initialQuiz = initialLectureId
    ? quizzesData.find((q) => q.lectureId === initialLectureId) ?? null
    : null;

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(initialQuiz);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!activeQuiz || finished) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz, finished]);

  function startQuiz(quiz: Quiz) {
    setActiveQuiz(quiz);
    setQuestionIndex(0);
    setSelectedOption(null);
    setChecked(false);
    setAnswers({});
    setFinished(false);
    setElapsedSeconds(0);
  }

  function handleCheckAnswer() {
    if (!activeQuiz || selectedOption === null) {
      return;
    }
    const currentQuestion = activeQuiz.questions[questionIndex];
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedOption }));
    setChecked(true);
  }

  async function handleNextQuestion() {
    if (!activeQuiz) {
      return;
    }

    if (questionIndex + 1 >= activeQuiz.questions.length) {
      const result = await submitQuizAttempt({
        quizId: activeQuiz.id,
        answers,
        elapsedSeconds,
      });
      setBestScores((prev) => ({
        ...prev,
        [activeQuiz.id]: Math.max(prev[activeQuiz.id] ?? 0, result.scorePercent),
      }));
      setFinished(true);
      return;
    }

    setQuestionIndex((prev) => prev + 1);
    setSelectedOption(null);
    setChecked(false);
  }

  if (!activeQuiz) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quizzes</h1>
          <p className="mt-1.5 text-muted-foreground">
            Test your comprehension with AI-generated practice quizzes and instant explanations.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {quizzesData.map((quiz) => {
            const best = bestScores[quiz.id];
            return (
              <Card
                key={quiz.id}
                className="flex flex-col justify-between rounded-2xl py-5 shadow-sm transition hover:ring-primary/40 hover:shadow-md"
              >
                <CardHeader className="space-y-2.5 px-5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{quiz.subject}</Badge>
                    <Badge variant="outline">{quiz.difficulty}</Badge>
                  </div>

                  <CardTitle className="text-lg font-semibold">
                    {quiz.title}
                  </CardTitle>
                  <CardDescription>{quiz.lectureTitle}</CardDescription>
                </CardHeader>

                <CardContent className="px-5">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ClipboardCheck size={14} className="text-primary" />
                      {quiz.questions.length} questions
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={14} className="text-primary" />
                      ~{quiz.estimatedMinutes} min
                    </span>
                    {best !== undefined && (
                      <Badge variant="default">Best: {best}%</Badge>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="bg-transparent px-5 pt-3">
                  <Button
                    type="button"
                    onClick={() => startQuiz(quiz)}
                    className="w-full rounded-xl"
                  >
                    Start Quiz
                    <ArrowRight size={15} />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (finished) {
    const correctCount = activeQuiz.questions.filter(
      (q) => answers[q.id] === q.correctIndex
    ).length;
    const scorePercent = Math.round(
      (correctCount / activeQuiz.questions.length) * 100
    );

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="rounded-2xl py-8 text-center shadow-sm">
          <CardContent className="space-y-4 px-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Award size={28} />
            </div>

            <div>
              <Badge variant="secondary">{activeQuiz.lectureTitle}</Badge>
              <h1 className="mt-3 text-3xl font-bold text-foreground">
                You scored {scorePercent}%
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {correctCount} of {activeQuiz.questions.length} correct · Completed in{" "}
                {formatDuration(elapsedSeconds)}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button type="button" onClick={() => startQuiz(activeQuiz)}>
                <RotateCcw size={15} />
                Retake Quiz
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveQuiz(null)}
              >
                All Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Answer Breakdown
          </h2>

          {activeQuiz.questions.map((question, idx) => {
            const userChoice = answers[question.id];
            const isCorrect = userChoice === question.correctIndex;
            return (
              <Card key={question.id} className="rounded-2xl py-4 shadow-sm">
                <CardContent className="space-y-2 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-foreground">
                      {idx + 1}. {question.question}
                    </p>
                    {isCorrect ? (
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-emerald-600 dark:text-emerald-400"
                      />
                    ) : (
                      <XCircle
                        size={18}
                        className="shrink-0 text-destructive"
                      />
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Your answer:{" "}
                    <span className="font-medium text-foreground">
                      {userChoice !== undefined
                        ? question.options[userChoice]
                        : "Unanswered"}
                    </span>{" "}
                    · Correct:{" "}
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {question.options[question.correctIndex]}
                    </span>
                  </p>

                  <p className="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                    {question.explanation}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const currentQuestion = activeQuiz.questions[questionIndex];
  const progressValue = Math.round(
    ((questionIndex + (checked ? 1 : 0)) / activeQuiz.questions.length) * 100
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="secondary">{activeQuiz.lectureTitle}</Badge>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            {activeQuiz.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 px-3 py-1">
            <Clock3 size={14} />
            {formatDuration(elapsedSeconds)}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveQuiz(null)}
          >
            Exit
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question {questionIndex + 1} of {activeQuiz.questions.length}
          </span>
          <span>Source: {currentQuestion.sourceRef}</span>
        </div>
        <Progress value={progressValue} />
      </div>

      <Card className="rounded-2xl py-6 shadow-sm">
        <CardContent className="space-y-5 px-6">
          <h2 className="text-lg font-semibold leading-snug text-foreground">
            {currentQuestion.question}
          </h2>

          <div className="space-y-2.5">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOption = idx === currentQuestion.correctIndex;

              let optionStyle =
                "border-border bg-card hover:border-primary/50 hover:bg-muted/40";
              if (checked) {
                if (isCorrectOption) {
                  optionStyle =
                    "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
                } else if (isSelected) {
                  optionStyle =
                    "border-destructive bg-destructive/10 text-destructive";
                }
              } else if (isSelected) {
                optionStyle = "border-primary bg-primary/10 text-foreground";
              }

              return (
                <button
                  key={option}
                  type="button"
                  disabled={checked}
                  onClick={() => setSelectedOption(idx)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition ${optionStyle}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/25 text-xs font-semibold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 font-medium">{option}</span>
                </button>
              );
            })}
          </div>

          {checked && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <p className="font-semibold text-foreground">
                {selectedOption === currentQuestion.correctIndex
                  ? "Correct!"
                  : "Not quite"}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            {!checked ? (
              <Button
                type="button"
                disabled={selectedOption === null}
                onClick={handleCheckAnswer}
                className="rounded-xl px-5"
              >
                Check Answer
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNextQuestion}
                className="rounded-xl px-5"
              >
                {questionIndex + 1 >= activeQuiz.questions.length
                  ? "Finish Quiz"
                  : "Next Question"}
                <ArrowRight size={15} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

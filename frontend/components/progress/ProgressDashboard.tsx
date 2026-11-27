"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, BookOpen, Clock3, Flame, Loader2 } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { extractApiErrorMessage, isMockModeEnabled } from "@/lib/api-client";
import {
  flashcardsData,
  lecturesData,
  quizzesData,
  quizScoreTrendData,
  subjectMasteryData,
  weeklyStudyData,
} from "@/lib/mock-data";
import { fetchProgressAnalytics } from "@/lib/services/study-service";
import type { ProgressAnalyticsResponse } from "@/types/api";

const emptySubscribe = () => () => {};

const mockAnalytics: ProgressAnalyticsResponse = {
  weeklyStudy: weeklyStudyData,
  quizTrend: quizScoreTrendData,
  subjectMastery: subjectMasteryData,
  recentLectures: lecturesData,
  totalFlashcards: flashcardsData.length,
  totalQuizzes: quizzesData.length,
};

export default function ProgressDashboard() {
  const mockMode = isMockModeEnabled();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [analytics, setAnalytics] = useState<ProgressAnalyticsResponse | null>(
    () => (mockMode ? mockAnalytics : null)
  );
  const [loading, setLoading] = useState(!mockMode);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (mockMode) {
      return;
    }

    let cancelled = false;
    void fetchProgressAnalytics()
      .then((data) => {
        if (!cancelled) {
          setAnalytics(data);
          setLoadError("");
        }
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

  const weeklyStudy = analytics?.weeklyStudy ?? [];
  const quizTrend = analytics?.quizTrend ?? [];
  const subjectMastery = analytics?.subjectMastery ?? [];

  const totalWeeklyMinutes = weeklyStudy.reduce(
    (sum, item) => sum + item.minutes,
    0
  );
  const totalWeeklyCards = weeklyStudy.reduce(
    (sum, item) => sum + item.cards,
    0
  );
  const latestQuizScore =
    quizTrend.length > 0 ? `${quizTrend[quizTrend.length - 1].score}%` : "—";
  const activeDays = weeklyStudy.filter(
    (item) => item.minutes > 0 || item.cards > 0
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Learning Progress
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Monitor study consistency, quiz accuracy, and mastery across your courses.
        </p>
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
            Loading analytics...
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Study Time (7d)"
              value={`${(totalWeeklyMinutes / 60).toFixed(1)} hrs`}
              description={`${totalWeeklyMinutes} minutes total`}
              icon={Clock3}
            />
            <StatCard
              title="Cards Reviewed"
              value={String(totalWeeklyCards)}
              description={`${analytics?.totalFlashcards ?? 0} total flashcards`}
              icon={BookOpen}
              href="/flashcards"
            />
            <StatCard
              title="Latest Quiz Score"
              value={latestQuizScore}
              description={`${quizTrend.length} completed attempt(s)`}
              icon={Award}
              href="/quizzes"
            />
            <StatCard
              title="Active Days (7d)"
              value={`${activeDays} days`}
              description={`${analytics?.totalQuizzes ?? 0} total quizzes`}
              icon={Flame}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl py-5 shadow-sm">
              <CardHeader className="px-5">
                <CardTitle className="text-base font-semibold">
                  Weekly Study Minutes &amp; Flashcards
                </CardTitle>
                <CardDescription>
                  Daily learning minutes vs. cards reviewed over the past 7 days.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-5">
                <div className="h-72 w-full">
                  {isClient ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyStudy}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis dataKey="day" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar
                          dataKey="minutes"
                          name="Study Minutes"
                          fill="#4f46e5"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="cards"
                          name="Flashcards"
                          fill="#818cf8"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-xl bg-muted/50" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl py-5 shadow-sm">
              <CardHeader className="px-5">
                <CardTitle className="text-base font-semibold">
                  Quiz Accuracy Trend
                </CardTitle>
                <CardDescription>
                  Score progression across your recent practice quizzes.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-5">
                <div className="h-72 w-full">
                  {isClient ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={quizTrend}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis dataKey="attempt" fontSize={12} />
                        <YAxis domain={[0, 100]} fontSize={12} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="score"
                          name="Score (%)"
                          stroke="#4f46e5"
                          fill="#6366f1"
                          fillOpacity={0.2}
                          strokeWidth={2.5}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-xl bg-muted/50" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl py-5 shadow-sm">
            <CardHeader className="px-5">
              <CardTitle className="text-base font-semibold">
                Subject Mastery Breakdown
              </CardTitle>
              <CardDescription>
                Combined mastery estimated from flashcard recall and quiz performance.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 px-5">
              {subjectMastery.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Upload lectures and complete quizzes or flashcard reviews to see subject mastery.
                </p>
              ) : (
                subjectMastery.map((item) => (
                  <div key={item.subject} className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {item.subject}
                        </span>
                        <Badge variant="secondary">
                          {item.lectures} lecture{item.lectures === 1 ? "" : "s"}
                        </Badge>
                      </div>
                      <span className="font-semibold text-primary">
                        {item.mastery}%
                      </span>
                    </div>

                    <Progress value={item.mastery} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

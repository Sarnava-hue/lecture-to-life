"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  ClipboardCheck,
  Flame,
  Plus,
  Upload,
} from "lucide-react";

import WelcomeSection from "@/components/dashboard/WelcomeSection";
import StatCard from "@/components/dashboard/StatCard";
import QuickAction from "@/components/dashboard/QuickAction";
import RecentLecture from "@/components/dashboard/RecentLecture";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isMockModeEnabled } from "@/lib/api-client";
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

const mockAnalytics: ProgressAnalyticsResponse = {
  weeklyStudy: weeklyStudyData,
  quizTrend: quizScoreTrendData,
  subjectMastery: subjectMasteryData,
  recentLectures: lecturesData,
  totalFlashcards: flashcardsData.length,
  totalQuizzes: quizzesData.length,
};

export default function DashboardPage() {
  const mockMode = isMockModeEnabled();
  const [analytics, setAnalytics] = useState<ProgressAnalyticsResponse | null>(
    () => (mockMode ? mockAnalytics : null)
  );

  useEffect(() => {
    if (mockMode) {
      return;
    }

    let cancelled = false;
    void fetchProgressAnalytics()
      .then((data) => {
        if (!cancelled) {
          setAnalytics(data);
        }
      })
      .catch(() => {
        // 401 redirect or offline state handled cleanly.
      });

    return () => {
      cancelled = true;
    };
  }, [mockMode]);

  const weeklyMinutes = (analytics?.weeklyStudy ?? []).reduce(
    (sum, point) => sum + point.minutes,
    0
  );
  const weeklyCards = (analytics?.weeklyStudy ?? []).reduce(
    (sum, point) => sum + point.cards,
    0
  );
  const activeDays = (analytics?.weeklyStudy ?? []).filter(
    (point) => point.minutes > 0 || point.cards > 0
  ).length;
  const quizTrend = analytics?.quizTrend ?? [];
  const avgQuizScore =
    quizTrend.length > 0
      ? Math.round(
          quizTrend.reduce((sum, item) => sum + item.score, 0) / quizTrend.length
        )
      : null;

  const recentLectures = (analytics?.recentLectures ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      <WelcomeSection />

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Your learning overview
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            A quick look at your current learning activity.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Lectures"
            value={analytics ? String(analytics.recentLectures.length) : "—"}
            description="Uploaded to your workspace"
            icon={BookOpen}
            href="/lectures"
          />

          <StatCard
            title="Flashcards"
            value={analytics ? String(analytics.totalFlashcards) : "—"}
            description={`${weeklyCards} reviewed this week`}
            icon={Layers}
            href="/flashcards"
          />

          <StatCard
            title="Quizzes"
            value={analytics ? String(analytics.totalQuizzes) : "—"}
            description={
              avgQuizScore !== null
                ? `Average score: ${avgQuizScore}%`
                : "No attempts recorded yet"
            }
            icon={ClipboardCheck}
            href="/quizzes"
          />

          <StatCard
            title="Study activity"
            value={analytics ? `${activeDays}d` : "—"}
            description={`${weeklyMinutes} minutes in last 7 days`}
            icon={Flame}
            href="/progress"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl py-5 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between px-5">
            <div>
              <CardTitle className="text-base font-semibold">
                Recent lectures
              </CardTitle>

              <CardDescription className="mt-1">
                Continue where you left off.
              </CardDescription>
            </div>

            <Link
              href="/lectures"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>

          <CardContent className="px-5">
            {analytics && recentLectures.length === 0 ? (
              <div className="space-y-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No lectures uploaded yet. Upload your first PDF, DOCX, TXT, or audio recording.
                </p>
                <Button
                  render={<Link href="/lectures/upload" />}
                  nativeButton={false}
                  size="sm"
                >
                  <Upload size={15} />
                  Upload Lecture
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentLectures.map((lecture) => (
                  <RecentLecture
                    key={lecture.id}
                    id={lecture.id}
                    title={lecture.title}
                    subject={lecture.subject}
                    duration={lecture.duration}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl py-5 shadow-sm">
          <CardHeader className="px-5">
            <CardTitle className="text-base font-semibold">
              Quick actions
            </CardTitle>

            <CardDescription className="mt-1">
              Jump straight into learning.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 px-5">
            <QuickAction
              href="/lectures/upload"
              title="Upload lecture"
              description="Add new learning material"
              icon={Plus}
            />

            <QuickAction
              href="/flashcards"
              title="Review flashcards"
              description="Strengthen your memory"
              icon={Layers}
            />

            <QuickAction
              href="/quizzes"
              title="Take a quiz"
              description="Test your understanding"
              icon={ClipboardCheck}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

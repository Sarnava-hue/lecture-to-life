import Link from "next/link";
import {
  BookOpen,
  Layers,
  ClipboardCheck,
  Flame,
  Plus,
} from "lucide-react";

import WelcomeSection from "@/components/dashboard/WelcomeSection";
import StatCard from "@/components/dashboard/StatCard";
import QuickAction from "@/components/dashboard/QuickAction";
import RecentLecture from "@/components/dashboard/RecentLecture";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { recentLectures } from "@/lib/mock-lectures";

export default function DashboardPage() {
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
            value="12"
            description="3 added this week"
            icon={BookOpen}
            href="/lectures"
          />

          <StatCard
            title="Flashcards"
            value="186"
            description="24 reviewed this week"
            icon={Layers}
            href="/flashcards"
          />

          <StatCard
            title="Quizzes"
            value="8"
            description="Average score: 84%"
            icon={ClipboardCheck}
            href="/quizzes"
          />

          <StatCard
            title="Study streak"
            value="7 days"
            description="Keep the streak going"
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
            <div className="divide-y divide-border">
              {recentLectures.map((lecture) => (
                <RecentLecture key={lecture.id} {...lecture} />
              ))}
            </div>
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

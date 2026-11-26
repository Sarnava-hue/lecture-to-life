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
import { recentLectures } from "@/lib/mock-lectures";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WelcomeSection />

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Your learning overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            A quick look at your current learning activity.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Lectures"
            value="12"
            description="3 added this week"
            icon={BookOpen}
          />

          <StatCard
            title="Flashcards"
            value="186"
            description="24 reviewed this week"
            icon={Layers}
          />

          <StatCard
            title="Quizzes"
            value="8"
            description="Average score: 84%"
            icon={ClipboardCheck}
          />

          <StatCard
            title="Study streak"
            value="7 days"
            description="Keep the streak going"
            icon={Flame}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Recent lectures
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Continue where you left off.
              </p>
            </div>

            <Link
              href="/lectures"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {recentLectures.map((lecture) => (
              <RecentLecture
                key={lecture.id}
                {...lecture}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-semibold text-slate-900">
              Quick actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Jump straight into learning.
            </p>
          </div>

          <div className="mt-4 space-y-3">
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
          </div>
        </div>
      </section>
    </div>
  );
}
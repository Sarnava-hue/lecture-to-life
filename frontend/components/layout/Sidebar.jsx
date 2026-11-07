
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  ClipboardList,
  MessageCircle,
  TrendingUp,
  Settings,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Lectures",
    href: "/lectures",
    icon: BookOpen,
  },
  {
    name: "Flashcards",
    href: "/flashcards",
    icon: Layers,
  },
  {
    name: "Quizzes",
    href: "/quizzes",
    icon: ClipboardList,
  },
  {
    name: "AI Tutor",
    href: "/tutor",
    icon: MessageCircle,
  },
  {
    name: "Progress",
    href: "/progress",
    icon: TrendingUp,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-xl font-bold text-indigo-600">
          Lecture to Life
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Your AI learning workspace
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
            pathname === "/settings"
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
          }`}
        >
          <Settings size={20} />
          Settings
        </Link>
      </div>
    </aside>
  );
}

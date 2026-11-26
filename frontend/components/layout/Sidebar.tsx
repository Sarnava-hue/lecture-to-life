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
  GraduationCap,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavItem[] = [
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

export interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  function isRouteActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      aria-label="Primary navigation"
      className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-4">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <GraduationCap size={20} />
          </div>

          <div>
            <span className="block text-base font-bold tracking-tight text-sidebar-foreground">
              Lecture to Life
            </span>
            <span className="block text-xs text-muted-foreground">
              AI learning workspace
            </span>
          </div>
        </Link>

        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="md:hidden"
          >
            <X size={18} />
          </Button>
        )}
      </div>

      <nav aria-label="Workspace routes" className="flex-1 space-y-1.5 overflow-y-auto p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = isRouteActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={19} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/settings"
          onClick={onClose}
          aria-current={isRouteActive("/settings") ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
            isRouteActive("/settings")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Settings size={19} />
          Settings
        </Link>
      </div>
    </aside>
  );
}

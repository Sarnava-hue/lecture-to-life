"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Check,
  LogIn,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  TrendingUp,
  Upload,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { recentLectures } from "@/lib/mock-lectures";

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  href: string;
  unread: boolean;
}

interface SearchResultItem {
  label: string;
  sublabel: string;
  href: string;
  category: string;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Flashcards ready",
    detail: "18 cards generated for Introduction to Machine Learning",
    href: "/flashcards",
    unread: true,
  },
  {
    id: "n2",
    title: "7-day study streak",
    detail: "Keep going with a quick 5-question quiz today",
    href: "/quizzes",
    unread: true,
  },
  {
    id: "n3",
    title: "Lecture indexed",
    detail: "Database Normalization is ready for AI Tutor Q&A",
    href: "/lectures/3",
    unread: false,
  },
];

const quickJumpLinks = [
  { label: "Upload a new lecture", href: "/lectures/upload", category: "Action" },
  { label: "Review flashcards", href: "/flashcards", category: "Study" },
  { label: "Take a quiz", href: "/quizzes", category: "Study" },
  { label: "Ask AI Tutor", href: "/tutor", category: "Study" },
  { label: "View learning progress", href: "/progress", category: "Analytics" },
];

function SearchResultsList({
  results,
  emptyMessage,
  keyPrefix,
  onSelect,
}: {
  results: SearchResultItem[];
  emptyMessage: string;
  keyPrefix: string;
  onSelect: (href: string) => void;
}) {
  if (results.length === 0) {
    return (
      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-0.5" role="listbox">
      {results.map((result) => (
        <li key={`${keyPrefix}-${result.category}-${result.href}`}>
          <button
            type="button"
            onClick={() => onSelect(result.href)}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <BookOpen size={15} className="shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {result.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {result.sublabel}
                </p>
              </div>
            </div>
            <Badge variant="secondary">{result.category}</Badge>
          </button>
        </li>
      ))}
    </ul>
  );
}

function subscribeThemeChange(callback: () => void): () => void {
  window.addEventListener("theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot(): boolean {
  return document.documentElement.classList.contains("dark");
}

function getThemeServerSnapshot(): boolean {
  return false;
}

export interface NavbarProps {
  onOpenMobileNav?: () => void;
}

export default function Navbar({ onOpenMobileNav }: NavbarProps) {
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const isDark = useSyncExternalStore(
    subscribeThemeChange,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (window.innerWidth < 768) {
          setMobileSearchOpen(true);
        } else {
          desktopInputRef.current?.focus();
          setSearchDropdownOpen(true);
        }
      } else if (event.key === "Escape") {
        setSearchDropdownOpen(false);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        event.target instanceof Node &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setSearchDropdownOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const normalized = query.trim().toLowerCase();

    const matchedLectures: SearchResultItem[] = recentLectures
      .filter(
        (lecture) =>
          !normalized ||
          lecture.title.toLowerCase().includes(normalized) ||
          lecture.subject.toLowerCase().includes(normalized)
      )
      .map((lecture) => ({
        label: lecture.title,
        sublabel: `${lecture.subject} · ${lecture.duration}`,
        href: `/lectures/${lecture.id}`,
        category: "Lecture",
      }));

    const matchedQuickLinks: SearchResultItem[] = quickJumpLinks
      .filter(
        (item) =>
          !normalized ||
          item.label.toLowerCase().includes(normalized) ||
          item.category.toLowerCase().includes(normalized)
      )
      .map((item) => ({
        label: item.label,
        sublabel: item.href,
        href: item.href,
        category: item.category,
      }));

    return [...matchedLectures, ...matchedQuickLinks].slice(0, 6);
  }, [query]);

  const unreadCount = notifications.filter((item) => item.unread).length;

  function toggleTheme() {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    try {
      localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    } catch {
      // Ignore storage failures in restricted contexts.
    }
    window.dispatchEvent(new Event("theme-change"));
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  }

  function navigateToResult(href: string) {
    setSearchDropdownOpen(false);
    setMobileSearchOpen(false);
    setQuery("");
    router.push(href);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchResults.length > 0) {
      navigateToResult(searchResults[0].href);
    }
  }

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur-xs md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </Button>

        <Link href="/dashboard" className="text-sm font-bold text-primary">
          Lecture to Life
        </Link>
      </div>

      <div
        ref={searchContainerRef}
        className="relative hidden w-full max-w-md md:block"
      >
        <form onSubmit={handleSearchSubmit}>
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            ref={desktopInputRef}
            type="search"
            value={query}
            onFocus={() => setSearchDropdownOpen(true)}
            onChange={(event) => {
              handleQueryChange(event);
              setSearchDropdownOpen(true);
            }}
            placeholder="Search lectures or jump to..."
            aria-label="Search lectures or workspace routes"
            className="h-9 bg-muted/60 pl-9 pr-14"
          />

          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Ctrl K
          </kbd>
        </form>

        {searchDropdownOpen && (
          <div className="absolute left-0 right-0 top-11 z-40 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
            <SearchResultsList
              results={searchResults}
              emptyMessage={`No lectures or actions matching "${query}".`}
              keyPrefix="desktop"
              onSelect={navigateToResult}
            />
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Search lectures"
          className="md:hidden"
        >
          <Search size={19} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
              />
            }
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0 text-xs font-semibold text-foreground">
                Notifications
              </DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              {notifications.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                    );
                    router.push(item.href);
                  }}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {item.title}
                    </span>
                    {item.unread && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-full px-1"
                aria-label="Account menu"
              />
            }
          >
            <Avatar>
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                AD
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium text-foreground">Student Workspace</p>
                <p className="text-xs text-muted-foreground">Local preview profile</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/lectures/upload")}>
                <Upload size={15} />
                Upload Lecture
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/progress")}>
                <TrendingUp size={15} />
                Learning Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings size={15} />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/login")}>
                <LogIn size={15} />
                Sign In / Switch Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search workspace</DialogTitle>
            <DialogDescription>
              Find lectures or jump straight to a study tool.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <Input
              type="search"
              autoFocus
              value={query}
              onChange={handleQueryChange}
              placeholder="Search lectures or actions..."
            />

            <div className="max-h-64 overflow-y-auto">
              <SearchResultsList
                results={searchResults}
                emptyMessage="No matching lectures or routes."
                keyPrefix="mobile"
                onSelect={navigateToResult}
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}

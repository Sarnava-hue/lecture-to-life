"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Loader2,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL, isMockModeEnabled } from "@/lib/api-client";
import {
  checkBackendHealth,
  fetchCurrentUser,
} from "@/lib/services/study-service";

type ThemeChoice = "light" | "dark" | "system";

function subscribeThemeStorage(callback: () => void): () => void {
  window.addEventListener("theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getStoredTheme(): ThemeChoice {
  try {
    const value = localStorage.getItem("theme");
    if (value === "light" || value === "dark") {
      return value;
    }
  } catch {
    // Ignore storage read errors.
  }
  return "system";
}

export default function SettingsPanel() {
  const mockMode = isMockModeEnabled();
  const [name, setName] = useState(mockMode ? "Anushka Dey" : "");
  const [email, setEmail] = useState(
    mockMode ? "student@lecturetolife.app" : ""
  );
  const [major, setMajor] = useState("Computer Science & AI");
  const [dailyCardsGoal, setDailyCardsGoal] = useState("25");
  const [quizDifficulty, setQuizDifficulty] = useState("Medium");
  const [savedBanner, setSavedBanner] = useState(false);

  const [checkingHealth, setCheckingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState<{
    reachable: boolean;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (mockMode) {
      return;
    }
    let cancelled = false;
    void fetchCurrentUser()
      .then((user) => {
        if (!cancelled) {
          setName(user.name);
          setEmail(user.email);
        }
      })
      .catch(() => {
        // Ignore when unauthenticated.
      });
    return () => {
      cancelled = true;
    };
  }, [mockMode]);

  const themeChoice = useSyncExternalStore<ThemeChoice>(
    subscribeThemeStorage,
    getStoredTheme,
    () => "system"
  );

  function applyTheme(choice: ThemeChoice) {
    try {
      if (choice === "system") {
        localStorage.removeItem("theme");
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      } else {
        localStorage.setItem("theme", choice);
        document.documentElement.classList.toggle("dark", choice === "dark");
      }
    } catch {
      // Ignore storage failures.
    }
    window.dispatchEvent(new Event("theme-change"));
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  }

  async function handleTestBackend() {
    setCheckingHealth(true);
    const result = await checkBackendHealth();
    setHealthResult(result);
    setCheckingHealth(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1.5 text-muted-foreground">
          Manage your profile, study targets, appearance, and backend API status.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-5">
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted p-1">
          <TabsTrigger value="profile" className="px-3 py-1.5">
            Profile &amp; Goals
          </TabsTrigger>
          <TabsTrigger value="appearance" className="px-3 py-1.5">
            Appearance
          </TabsTrigger>
          <TabsTrigger value="account" className="px-3 py-1.5">
            Account &amp; API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="rounded-2xl py-6 shadow-sm">
            <CardHeader className="px-6">
              <CardTitle className="text-lg font-semibold">
                Student Profile &amp; Study Preferences
              </CardTitle>
              <CardDescription>
                Customize your daily learning targets and default quiz settings.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6">
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="settings-name" className="text-xs font-medium">
                      Full Name
                    </label>
                    <Input
                      id="settings-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="settings-email" className="text-xs font-medium">
                      Email
                    </label>
                    <Input
                      id="settings-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label htmlFor="settings-major" className="text-xs font-medium">
                      Field of Study
                    </label>
                    <Input
                      id="settings-major"
                      value={major}
                      onChange={(event) => setMajor(event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="settings-cards" className="text-xs font-medium">
                      Daily Flashcard Goal
                    </label>
                    <Input
                      id="settings-cards"
                      type="number"
                      min={5}
                      max={200}
                      value={dailyCardsGoal}
                      onChange={(event) => setDailyCardsGoal(event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="settings-difficulty"
                      className="text-xs font-medium"
                    >
                      Default Quiz Difficulty
                    </label>
                    <select
                      id="settings-difficulty"
                      value={quizDifficulty}
                      onChange={(event) => setQuizDifficulty(event.target.value)}
                      className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button type="submit">Save Preferences</Button>

                  {savedBanner && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={15} />
                      Preferences updated
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="rounded-2xl py-6 shadow-sm">
            <CardHeader className="px-6">
              <CardTitle className="text-lg font-semibold">Theme</CardTitle>
              <CardDescription>
                Choose how Lecture to Life looks across all study views.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3 px-6 sm:grid-cols-3">
              {[
                { id: "light" as ThemeChoice, label: "Light", icon: Sun },
                { id: "dark" as ThemeChoice, label: "Dark", icon: Moon },
                { id: "system" as ThemeChoice, label: "System", icon: Monitor },
              ].map((option) => {
                const Icon = option.icon;
                const active = themeChoice === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => applyTheme(option.id)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-5">
          <Card className="rounded-2xl py-6 shadow-sm">
            <CardHeader className="px-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Backend Connection
                  </CardTitle>
                  <CardDescription className="mt-1">
                    API Base URL:{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {API_BASE_URL}
                    </code>
                  </CardDescription>
                </div>
                <Badge variant={isMockModeEnabled() ? "secondary" : "default"}>
                  {isMockModeEnabled() ? "Mock Fallback On" : "Live API Mode"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={checkingHealth}
                  onClick={handleTestBackend}
                >
                  {checkingHealth ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Activity size={15} />
                  )}
                  Ping FastAPI /health
                </Button>

                {healthResult && (
                  <Badge
                    variant={healthResult.reachable ? "default" : "destructive"}
                  >
                    {healthResult.reachable
                      ? `Connected (${healthResult.status})`
                      : "Backend unreachable (check uvicorn & CORS)"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl py-6 shadow-sm">
            <CardHeader className="px-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Authentication Preview
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Ready to connect with FastAPI JWT authentication endpoints.
                  </CardDescription>
                </div>
                <Badge variant="secondary">Preview Mode</Badge>
              </div>
            </CardHeader>

            <CardContent className="flex flex-wrap gap-3 px-6">
              <Button
                render={<Link href="/login" />}
                nativeButton={false}
                variant="outline"
              >
                Open Sign In Page
              </Button>
              <Button
                render={<Link href="/register" />}
                nativeButton={false}
              >
                Open Registration Page
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

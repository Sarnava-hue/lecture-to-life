"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { extractApiErrorMessage } from "@/lib/api-client";
import { loginUser, registerUser } from "@/lib/services/study-service";

export interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isRegister && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await registerUser({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      } else {
        await loginUser({
          email: email.trim(),
          password,
        });
      }
      router.push("/dashboard");
    } catch (err) {
      const normalized = extractApiErrorMessage(err);
      setError(normalized.message);
      setSubmitting(false);
    }
  }

  return (
    <Card className="rounded-2xl py-6 shadow-md">
      <CardHeader className="px-6">
        <CardTitle className="text-xl font-bold">
          {isRegister ? "Create your account" : "Welcome back"}
        </CardTitle>
        <CardDescription>
          {isRegister
            ? "Start turning lectures into flashcards, quizzes, and AI tutoring."
            : "Sign in to access your study workspace."}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label htmlFor="auth-name" className="text-xs font-medium">
                Full Name
              </label>
              <Input
                id="auth-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Anushka Dey"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="text-xs font-medium">
              Email Address
            </label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@university.edu"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="text-xs font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="pr-9"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1.5">
              <label htmlFor="auth-confirm" className="text-xs font-medium">
                Confirm Password
              </label>
              <Input
                id="auth-confirm"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="h-10 w-full rounded-xl font-semibold"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {isRegister ? "Create Account" : "Sign In"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-2 bg-transparent px-6 pt-3 text-xs text-muted-foreground">
        <p>
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-medium text-primary hover:underline"
          >
            {isRegister ? "Sign in" : "Create one"}
          </Link>
        </p>

        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          Continue to workspace preview →
        </Link>
      </CardFooter>
    </Card>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <GraduationCap size={22} />
        </div>
        <div>
          <span className="block text-lg font-bold tracking-tight text-foreground">
            Lecture to Life
          </span>
          <span className="block text-xs text-muted-foreground">
            AI learning companion
          </span>
        </div>
      </Link>

      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

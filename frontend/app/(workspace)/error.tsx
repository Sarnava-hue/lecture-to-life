"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WorkspaceError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  function handleRetry() {
    if (retry) {
      retry();
    } else {
      reset?.();
    }
  }

  return (
    <Card className="mx-auto mt-10 max-w-lg rounded-2xl py-8 text-center shadow-sm">
      <CardContent className="space-y-4 px-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle size={22} />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {error.message || "Unable to load this workspace view right now."}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button type="button" onClick={handleRetry}>
            <RotateCcw size={15} />
            Try again
          </Button>
          <Button
            render={<Link href="/dashboard" />}
            nativeButton={false}
            variant="outline"
          >
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

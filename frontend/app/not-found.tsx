import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <SearchX size={26} />
      </div>

      <h1 className="mt-5 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The study page you are looking for does not exist or may have moved.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button render={<Link href="/dashboard" />} nativeButton={false}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
        <Button
          render={<Link href="/lectures" />}
          nativeButton={false}
          variant="outline"
        >
          Browse Lectures
        </Button>
      </div>
    </div>
  );
}

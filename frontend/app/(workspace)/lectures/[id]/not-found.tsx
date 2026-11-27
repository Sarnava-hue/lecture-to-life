import Link from "next/link";
import { ArrowLeft, BookX, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LectureNotFound() {
  return (
    <Card className="mx-auto mt-10 max-w-lg rounded-2xl py-8 text-center shadow-sm">
      <CardContent className="space-y-4 px-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookX size={24} />
        </div>

        <div>
          <h1 className="text-xl font-bold text-foreground">
            Lecture not found
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We couldn&apos;t find a study session for that lecture ID.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button
            render={<Link href="/lectures" />}
            nativeButton={false}
            variant="outline"
          >
            <ArrowLeft size={15} />
            Back to Lectures
          </Button>
          <Button render={<Link href="/lectures/upload" />} nativeButton={false}>
            <Upload size={15} />
            Upload Lecture
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

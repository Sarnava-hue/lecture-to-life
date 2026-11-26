import Link from "next/link";
import { BookOpen, Clock3, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RecentLecture({
  id,
  title,
  subject,
  duration,
}) {
  return (
    <Link
      href={`/lectures/${id}`}
      className="group flex items-center gap-4 rounded-xl p-4 transition hover:bg-muted/60"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
        <BookOpen size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-foreground">{title}</h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
          <Badge variant="secondary">{subject}</Badge>

          <span className="flex items-center gap-1">
            <Clock3 size={13} />
            {duration}
          </span>
        </div>
      </div>

      <ArrowRight
        size={18}
        className="shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
      />
    </Link>
  );
}

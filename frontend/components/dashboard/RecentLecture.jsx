import Link from "next/link";
import { BookOpen, Clock3, ArrowRight } from "lucide-react";

export default function RecentLecture({
  id,
  title,
  subject,
  duration,
}) {
  return (
    <Link
      href={`/lectures/${id}`}
      className="group flex items-center gap-4 rounded-xl p-4 transition hover:bg-slate-50"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <BookOpen size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-slate-900">
          {title}
        </h3>

        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span>{subject}</span>

          <span className="flex items-center gap-1">
            <Clock3 size={13} />
            {duration}
          </span>
        </div>
      </div>

      <ArrowRight
        size={18}
        className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600"
      />
    </Link>
  );
}
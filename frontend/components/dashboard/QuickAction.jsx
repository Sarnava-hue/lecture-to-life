import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function QuickAction({
  href,
  title,
  description,
  icon: Icon,
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <ArrowRight
        size={18}
        className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600"
      />
    </Link>
  );
}
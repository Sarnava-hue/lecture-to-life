import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  href?: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
}: StatCardProps) {
  const cardBody = (
    <Card
      className={`rounded-2xl py-5 shadow-sm transition ${
        href
          ? "hover:-translate-y-0.5 hover:ring-primary/40 hover:shadow-md"
          : ""
      }`}
    >
      <CardContent className="px-5">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon size={20} />
          </div>

          {href && (
            <ArrowUpRight
              size={18}
              className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
            />
          )}
        </div>

        <p className="mt-5 text-sm font-medium text-muted-foreground">
          {title}
        </p>

        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          {value}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="group block rounded-2xl outline-none">
        {cardBody}
      </Link>
    );
  }

  return cardBody;
}

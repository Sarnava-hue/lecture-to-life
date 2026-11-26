import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function QuickAction({
  href,
  title,
  description,
  icon: Icon,
}) {
  return (
    <Link href={href} className="group block rounded-2xl outline-none">
      <Card className="rounded-2xl py-4 shadow-sm transition group-hover:-translate-y-0.5 group-hover:ring-primary/40 group-hover:shadow-md">
        <CardContent className="flex items-center gap-4 px-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground">{title}</h3>

            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          <ArrowRight
            size={18}
            className="shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
          />
        </CardContent>
      </Card>
    </Link>
  );
}

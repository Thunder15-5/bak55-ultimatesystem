import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag } from "lucide-react";
import { MILESTONES } from "@/lib/journey";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

/** Real, dated BAK55 milestones. No projections, no illustrative entries. */
export function JourneyTimeline() {
  const ordered = [...MILESTONES].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          Our Journey So Far
        </CardTitle>
        <CardDescription>
          Every milestone below actually happened, with the date it happened on.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative ml-3 space-y-6 border-l border-border">
          {ordered.map((m) => (
            <li key={`${m.date}-${m.title}`} className="ml-6">
              <span className="absolute -left-[7px] h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-background" />
              <time className="text-xs text-muted-foreground">{formatDate(m.date)}</time>
              <h3 className="mt-0.5 text-sm font-semibold">{m.title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{m.description}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

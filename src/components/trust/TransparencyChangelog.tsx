import { ScrollText, GitCommit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { CHANGELOG, type ChangeCategory } from "@/lib/journey";

const CATEGORY_STYLES: Record<ChangeCategory, string> = {
  feature: "bg-primary/15 text-primary border-primary/30",
  fix: "bg-secondary/40 text-foreground border-border",
  security: "bg-destructive/15 text-destructive border-destructive/30",
  performance: "bg-accent/15 text-accent border-accent/30",
  policy: "bg-muted text-foreground border-border",
};

/**
 * Append-only public record of real releases. Sourced from src/lib/journey.ts —
 * never add entries here that did not actually ship.
 */
export function TransparencyChangelog() {
  const recent = CHANGELOG.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          Public Change Log
        </CardTitle>
        <CardDescription>
          Every rule, fee and policy change we have shipped — append-only, never edited silently.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative ml-3 space-y-6 border-l border-border">
          {recent.map((release) => (
            <li key={release.version} className="ml-6">
              <span className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary ring-4 ring-background">
                <GitCommit className="h-2.5 w-2.5 text-primary-foreground" />
              </span>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">v{release.version}</span>
                <time className="text-xs text-muted-foreground">
                  {new Date(release.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
              <ul className="space-y-1.5">
                {release.changes.map((change) => (
                  <li key={change.text} className="flex flex-wrap items-start gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase ${CATEGORY_STYLES[change.category]}`}
                    >
                      {change.category}
                    </Badge>
                    <span className="flex-1 text-xs text-muted-foreground">{change.text}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className="mt-6 border-t pt-4 text-[11px] text-muted-foreground">
          <Link to="/changelog" className="text-primary underline underline-offset-2">
            See the full change log
          </Link>{" "}
          — including every bug fixed in beta and the work still in progress. Material changes are
          announced to artists before they take effect.
        </p>
      </CardContent>
    </Card>
  );
}

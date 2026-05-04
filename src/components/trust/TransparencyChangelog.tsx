import { ScrollText, GitCommit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ChangelogEntry {
  date: string; // ISO
  version: string;
  category: "rule" | "fee" | "policy" | "security" | "feature";
  title: string;
  description: string;
}

/**
 * Hard-coded, append-only public changelog of every rule, fee, or policy change.
 * Maintained by the team — never silently edited.
 */
const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-04-28",
    version: "v3.2",
    category: "feature",
    title: "Vote receipts now include full ledger details",
    description: "Every vote now produces a verifiable receipt with full Vote ID, fund-flow breakdown, and ledger reference.",
  },
  {
    date: "2026-04-15",
    version: "v3.1",
    category: "policy",
    title: "Two-admin approval for winner overrides",
    description: "Any manual change to a competition winner now requires sign-off from two separate admins, both logged publicly.",
  },
  {
    date: "2026-03-30",
    version: "v3.0",
    category: "rule",
    title: "Final score weighting set to 70% fan / 30% AI",
    description: "Locked the scoring formula across all competitions. Changes to weighting now require a 14-day public notice.",
  },
  {
    date: "2026-03-12",
    version: "v2.8",
    category: "fee",
    title: "Withdrawal fee reduced from 7% to 5%",
    description: "Lower processing fee passed back to artists. Minimum withdrawal stays at 250 BAK.",
  },
  {
    date: "2026-02-20",
    version: "v2.7",
    category: "security",
    title: "7-day fraud review window before settlement",
    description: "All competition prize payouts now hold for 7 days post-finals to allow fraud detection to invalidate suspicious votes.",
  },
  {
    date: "2026-01-18",
    version: "v2.5",
    category: "rule",
    title: "Self-vote daily cap of 10 votes per user",
    description: "Artists can vote on their own submissions but capped at 10 self-votes per day, to prevent self-pumping.",
  },
];

const CATEGORY_STYLES: Record<ChangelogEntry["category"], string> = {
  rule: "bg-primary/15 text-primary border-primary/30",
  fee: "bg-accent/15 text-accent border-accent/30",
  policy: "bg-secondary/40 text-foreground border-border",
  security: "bg-destructive/15 text-destructive border-destructive/30",
  feature: "bg-muted text-foreground border-border",
};

export function TransparencyChangelog() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />Public Change Log
        </CardTitle>
        <CardDescription>
          Every rule, fee, and policy change — append-only. Nothing edited silently.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative border-l border-border ml-3 space-y-6">
          {CHANGELOG.map((entry) => (
            <li key={entry.version} className="ml-6">
              <span className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary ring-4 ring-background">
                <GitCommit className="h-2.5 w-2.5 text-primary-foreground" />
              </span>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className={`text-[10px] uppercase ${CATEGORY_STYLES[entry.category]}`}>
                  {entry.category}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">{entry.version}</span>
                <time className="text-xs text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </time>
              </div>
              <h4 className="font-semibold text-sm">{entry.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-muted-foreground mt-6 pt-4 border-t">
          Older entries archived. Material changes are emailed to all artists 14 days in advance.
        </p>
      </CardContent>
    </Card>
  );
}

import { Users, Brain, Sparkles, Mic, Music2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FairnessBreakdownProps {
  fanWeightPct?: number; // default 70
  aiWeightPct?: number; // default 30
  /** Optional live values to show real numbers, not just rules. */
  fanVotes?: number;
  aiScore?: number; // 0-100
  className?: string;
}

const AI_FACTORS = [
  { icon: Mic, label: "Vocal performance", weight: 30 },
  { icon: Music2, label: "Production quality", weight: 30 },
  { icon: Sparkles, label: "Originality", weight: 20 },
  { icon: TrendingUp, label: "Commercial readiness", weight: 20 },
];

/**
 * Visual breakdown of how the final score is calculated.
 * Shows the 70/30 split AND the sub-factors inside the AI score.
 */
export function FairnessBreakdown({
  fanWeightPct = 70,
  aiWeightPct = 30,
  fanVotes,
  aiScore,
  className,
}: FairnessBreakdownProps) {
  return (
    <Card className={`p-5 space-y-5 border-primary/20 ${className || ""}`}>
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Fairness Scoring Breakdown</h3>
          <p className="text-xs text-muted-foreground">Exactly how the final score is calculated.</p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">Audited</Badge>
      </div>

      {/* Visual split bar */}
      <div className="space-y-2">
        <div className="flex h-3 rounded-full overflow-hidden border">
          <div
            className="bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground"
            style={{ width: `${fanWeightPct}%` }}
          >
            {fanWeightPct}%
          </div>
          <div
            className="bg-accent flex items-center justify-center text-[10px] font-bold text-accent-foreground"
            style={{ width: `${aiWeightPct}%` }}
          >
            {aiWeightPct}%
          </div>
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Fan Votes</span>
          <span className="flex items-center gap-1"><Brain className="h-3 w-3" /> AI Judge</span>
        </div>
      </div>

      {/* Live values */}
      {(fanVotes !== undefined || aiScore !== undefined) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fan Votes</p>
            <p className="text-lg font-bold">{fanVotes?.toLocaleString() ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">Weighted at {fanWeightPct}%</p>
          </div>
          <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Score</p>
            <p className="text-lg font-bold">{aiScore !== undefined ? `${Math.round(aiScore)}/100` : "—"}</p>
            <p className="text-[10px] text-muted-foreground">Weighted at {aiWeightPct}%</p>
          </div>
        </div>
      )}

      {/* AI sub-factors */}
      <div className="space-y-3 pt-2 border-t">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Inside the AI Judge ({aiWeightPct}%)
        </p>
        {AI_FACTORS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {f.label}
                </span>
                <span className="font-semibold">{f.weight}%</span>
              </div>
              <Progress value={f.weight} className="h-1.5" />
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-center text-muted-foreground pt-1 border-t">
        No human can override the formula mid-competition. Changes require a public changelog entry.
      </p>
    </Card>
  );
}

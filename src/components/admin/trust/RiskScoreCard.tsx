import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

export function RiskScoreCard({ artistId }: { artistId: string }) {
  const [risk, setRisk] = useState<any>(null);

  useEffect(() => {
    if (!artistId) return;
    supabase.rpc("compute_artist_risk_score" as any, { p_artist_id: artistId }).then(({ data }) => setRisk(data));
  }, [artistId]);

  if (!risk) return null;
  const score = Number(risk.score) || 0;
  const tone = score >= 70 ? "text-destructive" : score >= 40 ? "text-amber-500" : "text-emerald-500";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className={`h-4 w-4 ${tone}`} />
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Risk Score</p>
        </div>
        <span className={`text-2xl font-bold ${tone}`}>{score}</span>
      </div>
      <Progress value={score} className="h-2 mb-4" />
      <div className="space-y-2 text-xs">
        <Factor label="Self-vote ratio" value={`${risk.self_vote_ratio}%`} weight={25} />
        <Factor label="New voter ratio" value={`${risk.new_voter_ratio}%`} weight={20} />
        <Factor label="IP concentration" value={`${risk.ip_concentration}%`} weight={25} />
        <Factor label="Past enforcement" value={String(risk.past_enforcement)} weight={15} />
        <Factor label="Total votes" value={String(risk.total_votes)} weight={15} />
      </div>
    </Card>
  );
}

function Factor({ label, value, weight }: { label: string; value: string; weight: number }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono">{value}</span>
        <span className="text-[10px] text-muted-foreground">×{weight}%</span>
      </span>
    </div>
  );
}

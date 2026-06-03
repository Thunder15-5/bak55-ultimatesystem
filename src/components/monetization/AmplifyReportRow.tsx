import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AmplifyCampaignRow {
  id: string;
  tier_name: string;
  bak_price: number;
  status: string;
  starts_at: string;
  ends_at: string;
  predicted_impressions_low: number;
  predicted_impressions_high: number;
  predicted_new_fans_low: number;
  predicted_new_fans_high: number;
  actual_impressions: number;
  actual_new_fans: number;
  refund_amount: number;
  refunded_at: string | null;
}

export function AmplifyReportRow({ c }: { c: AmplifyCampaignRow }) {
  const impPct = c.predicted_impressions_low
    ? Math.min(100, Math.round((c.actual_impressions / c.predicted_impressions_low) * 100))
    : 0;
  const fanPct = c.predicted_new_fans_low
    ? Math.min(100, Math.round((c.actual_new_fans / c.predicted_new_fans_low) * 100))
    : 0;

  const underDelivered = impPct < 50;
  const ended = new Date(c.ends_at) < new Date();
  const settled = c.status === "settled" || c.status === "refunded";

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="font-semibold text-sm flex items-center gap-2">
              {c.tier_name} Boost
              <Badge variant="outline" className="text-[10px]">{c.bak_price} BAK</Badge>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {new Date(c.starts_at).toLocaleDateString()} → {new Date(c.ends_at).toLocaleDateString()}
            </div>
          </div>
          <StatusBadge status={c.status} ended={ended} underDelivered={underDelivered && settled} />
        </div>

        <Metric
          label="Impressions"
          actual={c.actual_impressions}
          predictedLow={c.predicted_impressions_low}
          predictedHigh={c.predicted_impressions_high}
          pct={impPct}
          warn={underDelivered}
        />
        <Metric
          label="New fans"
          actual={c.actual_new_fans}
          predictedLow={c.predicted_new_fans_low}
          predictedHigh={c.predicted_new_fans_high}
          pct={fanPct}
        />

        {c.refund_amount > 0 && (
          <div className="flex items-center gap-2 text-xs rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/50 px-3 py-2 text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Refunded <span className="font-semibold">{c.refund_amount} BAK</span> to your wallet
            {c.refunded_at && ` on ${new Date(c.refunded_at).toLocaleDateString()}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label, actual, predictedLow, predictedHigh, pct, warn,
}: {
  label: string; actual: number; predictedLow: number; predictedHigh: number; pct: number; warn?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", warn && "text-amber-600")}>
          {actual.toLocaleString()} / {predictedLow.toLocaleString()}–{predictedHigh.toLocaleString()} ({pct}%)
        </span>
      </div>
      <Progress value={pct} className={cn("h-1.5", warn && "[&>div]:bg-amber-500")} />
    </div>
  );
}

function StatusBadge({ status, ended, underDelivered }: { status: string; ended: boolean; underDelivered: boolean }) {
  if (status === "refunded") {
    return <Badge className="text-[10px] gap-1 bg-amber-500/15 text-amber-700 border-amber-500/30"><AlertTriangle className="h-3 w-3" />Refunded</Badge>;
  }
  if (status === "settled") {
    return <Badge className="text-[10px] gap-1 bg-emerald-500/15 text-emerald-700 border-emerald-500/30"><CheckCircle2 className="h-3 w-3" />Delivered</Badge>;
  }
  if (ended) {
    return <Badge variant="secondary" className="text-[10px] gap-1"><Clock className="h-3 w-3" />Pending settlement</Badge>;
  }
  return <Badge variant="secondary" className="text-[10px] gap-1"><Clock className="h-3 w-3" />Running</Badge>;
}

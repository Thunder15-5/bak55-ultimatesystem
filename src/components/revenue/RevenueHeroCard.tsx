import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  netLast30: number;
  netAllTime: number;
  grossLast30: number;
  feesLast30: number;
  changePct: number; // vs previous 30d
}

export function RevenueHeroCard({ netLast30, netAllTime, grossLast30, feesLast30, changePct }: Props) {
  const positive = changePct >= 0;
  return (
    <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden">
      <CardContent className="p-5 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Net earnings · last 30 days</p>
            <div className="mt-1 flex items-baseline gap-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {netLast30.toFixed(2)}
              </h2>
              <span className="text-base font-medium text-muted-foreground">BAK</span>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`gap-1 ${positive ? "text-green-500" : "text-red-500"}`}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {positive ? "+" : ""}{changePct.toFixed(1)}%
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/40">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gross</p>
            <p className="text-sm font-semibold">{grossLast30.toFixed(2)} BAK</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fees</p>
            <p className="text-sm font-semibold text-muted-foreground">−{feesLast30.toFixed(2)} BAK</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">All-time net</p>
            <p className="text-sm font-semibold flex items-center gap-1">
              {netAllTime.toFixed(2)} <ArrowUpRight className="h-3 w-3 text-primary" />
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

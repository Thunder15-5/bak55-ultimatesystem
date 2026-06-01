import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Trophy, Music2, Star, Disc3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export interface StreamRow {
  key: "tips" | "competitions" | "trackSales" | "fanClub" | "beats";
  label: string;
  gross: number;
  feePct: number;
  feeNote: string;
}

const ICONS = {
  tips: Heart,
  competitions: Trophy,
  trackSales: Music2,
  fanClub: Star,
  beats: Disc3,
} as const;

interface Props {
  rows: StreamRow[];
}

export function EarningsByStream({ rows }: Props) {
  const totalGross = rows.reduce((s, r) => s + r.gross, 0);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Earnings by stream</CardTitle>
        <CardDescription className="text-xs">
          Gross income, platform fee, and net amount credited to your wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((r) => {
          const Icon = ICONS[r.key];
          const fee = r.gross * (r.feePct / 100);
          const net = r.gross - fee;
          const share = totalGross > 0 ? (r.gross / totalGross) * 100 : 0;
          return (
            <div key={r.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium truncate">{r.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground">
                        <Info className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] text-xs">
                      {r.feeNote}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold tabular-nums">{net.toFixed(2)} BAK</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {r.gross.toFixed(2)} gross · −{fee.toFixed(2)} fee ({r.feePct}%)
                  </p>
                </div>
              </div>
              <Progress value={share} className="h-1.5" />
            </div>
          );
        })}

        {totalGross === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No earnings yet. Upload, enter a competition, or open tips to start.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

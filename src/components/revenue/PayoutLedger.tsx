import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  gross: number;
  fee: number;
  net: number;
  source: string;
}

interface Props {
  entries: LedgerEntry[];
}

export function PayoutLedger({ entries }: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Payout ledger
            </CardTitle>
            <CardDescription className="text-xs">
              Every credit, every fee. Itemized and timestamped.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No payouts yet.</p>
        ) : (
          <div className="divide-y divide-border/40">
            {entries.map((e) => (
              <div key={e.id} className="grid grid-cols-[1fr_auto] gap-3 py-2.5 items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(e.date).toLocaleString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })} · <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[9px] font-normal">{e.source}</Badge>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-primary">+{e.net.toFixed(2)} BAK</p>
                  {e.fee > 0 ? (
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      {e.gross.toFixed(2)} − {e.fee.toFixed(2)} fee
                    </p>
                  ) : (
                    <p className="text-[10px] text-green-600 dark:text-green-400">No fee</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

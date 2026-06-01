import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Receipt, Search, ChevronDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const PAGE_SIZE = 15;

function dayKey(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function PayoutLedger({ entries }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const sources = useMemo(() => Array.from(new Set(entries.map((e) => e.source))), [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter !== "all" && e.source !== filter) return false;
      if (!q) return true;
      return e.description.toLowerCase().includes(q) || e.source.toLowerCase().includes(q);
    });
  }, [entries, query, filter]);

  const shown = filtered.slice(0, visible);

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, { day: string; rows: LedgerEntry[]; total: number }>();
    for (const e of shown) {
      const k = dayKey(e.date);
      if (!map.has(k)) map.set(k, { day: k, rows: [], total: 0 });
      const bucket = map.get(k)!;
      bucket.rows.push(e);
      bucket.total += e.net;
    }
    return Array.from(map.values());
  }, [shown]);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Payout ledger
            </CardTitle>
            <CardDescription className="text-xs">
              Every credit, every fee. Itemized and timestamped.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {filtered.length} entries
          </Badge>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setVisible(PAGE_SIZE); }}
              placeholder="Search payouts…"
              className="pl-8 h-9 text-sm"
            />
          </div>
          {sources.length > 1 && (
            <Tabs value={filter} onValueChange={(v) => { setFilter(v); setVisible(PAGE_SIZE); }}>
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-[11px] px-2.5">All</TabsTrigger>
                {sources.map((s) => (
                  <TabsTrigger key={s} value={s} className="text-[11px] px-2.5">{s}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-10 space-y-1.5">
            <Receipt className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {entries.length === 0 ? "No payouts yet." : "No matches for that filter."}
            </p>
            {entries.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                Earnings appear here the moment they hit your wallet.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((g) => (
              <div key={g.day}>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {g.day}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    +{g.total.toFixed(2)} BAK
                  </span>
                </div>
                <div className="rounded-lg border border-border/40 divide-y divide-border/40 overflow-hidden">
                  {g.rows.map((e) => (
                    <LedgerRow key={e.id} entry={e} />
                  ))}
                </div>
              </div>
            ))}

            {filtered.length > visible && (
              <Button
                variant="outline" size="sm"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="w-full"
              >
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                Load {Math.min(PAGE_SIZE, filtered.length - visible)} more
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LedgerRow({ entry: e }: { entry: LedgerEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="w-full text-left px-3 py-2.5 hover:bg-muted/30 transition"
    >
      <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{e.description}</p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            <span className="mx-1">·</span>
            <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-normal">{e.source}</Badge>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-primary">+{e.net.toFixed(2)} BAK</p>
          {e.fee > 0 ? (
            <p className="text-[10px] text-muted-foreground tabular-nums">−{e.fee.toFixed(2)} fee</p>
          ) : (
            <p className="text-[10px] text-green-600 dark:text-green-400">No fee</p>
          )}
        </div>
      </div>
      {open && (
        <div className="mt-2 pt-2 border-t border-border/40 grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <p className="text-muted-foreground">Gross</p>
            <p className="font-semibold tabular-nums">{e.gross.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fee</p>
            <p className="font-semibold tabular-nums">{e.fee.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reference</p>
            <p className="font-mono text-[9px] truncate" title={e.id}>{e.id.slice(0, 10)}…</p>
          </div>
        </div>
      )}
    </button>
  );
}

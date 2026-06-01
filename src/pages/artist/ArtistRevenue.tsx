import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Wallet, ArrowDownToLine } from "lucide-react";
import { Link } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

import { RevenuePrivacyBanner } from "@/components/revenue/RevenuePrivacyBanner";
import { RevenueHeroCard } from "@/components/revenue/RevenueHeroCard";
import { EarningsByStream, type StreamRow } from "@/components/revenue/EarningsByStream";
import { PayoutLedger, type LedgerEntry } from "@/components/revenue/PayoutLedger";
import { WithdrawalEligibilityCard } from "@/components/WithdrawalEligibilityCard";
import { WithdrawDialog } from "@/components/revenue/WithdrawDialog";

type Bucket = StreamRow["key"];

// Fee model (BAK55 monetization plan)
const FEE_RULES: Record<Bucket, { feePct: (gross: number) => number; label: string; note: string }> = {
  tips: {
    label: "Tips",
    feePct: (g) => (g < 50 ? 0 : 5),
    note: "0% platform fee under 50 BAK per tip · 5% above. 100% goes to you under threshold.",
  },
  competitions: {
    label: "Competition prizes",
    feePct: () => 0,
    note: "Prizes are paid net. Platform takes 0% of prize payouts; the 65/35 split happens before payout.",
  },
  trackSales: {
    label: "Track sales",
    feePct: () => 0,
    note: "Artist direct song sales — 0% platform commission on every sale.",
  },
  fanClub: {
    label: "Fan club",
    feePct: () => 15,
    note: "15% platform fee on recurring fan-club subscriptions.",
  },
  beats: {
    label: "Beat licensing",
    feePct: () => 15,
    note: "85% to creator · 15% platform fee on beat licenses.",
  },
};

function classify(desc: string, type: string): Bucket | null {
  const d = (desc || "").toLowerCase();
  const t = (type || "").toLowerCase();
  if (d.includes("tip")) return "tips";
  if (t === "prize" || d.includes("competition") || d.includes("prize")) return "competitions";
  if (d.includes("beat") || d.includes("license")) return "beats";
  if (d.includes("fan club") || d.includes("membership") || d.includes("subscription")) return "fanClub";
  if (t === "purchase" || d.includes("sale") || d.includes("purchase") || d.includes("track")) return "trackSales";
  if (t === "earning" || t === "income") return "tips";
  return null;
}

export default function ArtistRevenue() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [txns, setTxns] = useState<any[]>([]);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!wallet?.id) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("transactions")
        .select("id, type, amount, description, created_at")
        .eq("wallet_id", wallet.id)
        .gt("amount", 0)
        .order("created_at", { ascending: false })
        .limit(500);

      setTxns(data || []);
    } catch (e) {
      console.error("Revenue fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const computed = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const start30 = now - 30 * day;
    const startPrev30 = now - 60 * day;

    const totals: Record<Bucket, number> = {
      tips: 0, competitions: 0, trackSales: 0, fanClub: 0, beats: 0,
    };
    let gross30 = 0, fees30 = 0, net30 = 0, netAll = 0, netPrev30 = 0;
    const ledger: LedgerEntry[] = [];

    for (const t of txns) {
      const bucket = classify(t.description, t.type);
      if (!bucket) continue;
      const amt = Number(t.amount);
      const feePct = FEE_RULES[bucket].feePct(amt);
      const fee = amt * (feePct / 100);
      const net = amt - fee;
      const ts = new Date(t.created_at).getTime();

      totals[bucket] += amt;
      netAll += net;

      if (ts >= start30) {
        gross30 += amt;
        fees30 += fee;
        net30 += net;
      } else if (ts >= startPrev30) {
        netPrev30 += net;
      }

      if (ledger.length < 25) {
        ledger.push({
          id: t.id,
          date: t.created_at,
          description: t.description || FEE_RULES[bucket].label,
          gross: amt,
          fee,
          net,
          source: FEE_RULES[bucket].label,
        });
      }
    }

    const rows: StreamRow[] = (Object.keys(FEE_RULES) as Bucket[]).map((k) => ({
      key: k,
      label: FEE_RULES[k].label,
      gross: totals[k],
      feePct: FEE_RULES[k].feePct(totals[k]),
      feeNote: FEE_RULES[k].note,
    }));

    const changePct = netPrev30 > 0 ? ((net30 - netPrev30) / netPrev30) * 100 : net30 > 0 ? 100 : 0;

    return { rows, gross30, fees30, net30, netAll, changePct, ledger };
  }, [txns]);

  const exportCSV = () => {
    const rows = [
      ["Date", "Description", "Source", "Gross (BAK)", "Fee (BAK)", "Net (BAK)"],
      ...computed.ledger.map((e) => [
        new Date(e.date).toISOString(),
        `"${e.description.replace(/"/g, '""')}"`,
        e.source,
        e.gross.toFixed(2),
        e.fee.toFixed(2),
        e.net.toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bak55-revenue-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-24">
        <div className="max-w-5xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link to="/artist/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Revenue</h1>
                <p className="text-xs text-muted-foreground">Your earnings, itemized and transparent.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={loading || computed.ledger.length === 0}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Export</span> CSV
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setWithdrawOpen(true)}>
                <ArrowDownToLine className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Request</span> payout
              </Button>
            </div>
          </div>

          <RevenuePrivacyBanner />

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <div className="grid md:grid-cols-2 gap-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <Skeleton className="h-80 w-full" />
            </div>
          ) : (
            <TooltipProvider delayDuration={200}>
              <RevenueHeroCard
                netLast30={computed.net30}
                netAllTime={computed.netAll}
                grossLast30={computed.gross30}
                feesLast30={computed.fees30}
                changePct={computed.changePct}
              />

              <div className="grid lg:grid-cols-2 gap-4">
                <EarningsByStream rows={computed.rows} />
                <WithdrawalEligibilityCard userId={user!.id} />
              </div>

              <PayoutLedger entries={computed.ledger} />

              {/* Trust footnote */}
              <Card className="border-border/40 bg-muted/20">
                <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">How fees work:</span> all platform fees are disclosed before any transaction. Tips under 50 BAK are 0%. Track sales are 0%. Competition prizes are paid net of the 65/35 split.</p>
                  <p>Discrepancy? <Link to="/support" className="text-primary hover:underline">Contact support</Link> — every credit is logged and auditable.</p>
                </CardContent>
              </Card>
            </TooltipProvider>
          )}
        </div>
      </main>

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}

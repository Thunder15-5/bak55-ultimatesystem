import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { AmplifyBoostCard, type AmplifyBoostTier } from "@/components/monetization/AmplifyBoostCard";
import { AmplifyReportRow, type AmplifyCampaignRow } from "@/components/monetization/AmplifyReportRow";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Eye, Megaphone, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function ArtistAmplify() {
  const { user } = useAuth();
  const [launching, setLaunching] = useState(false);
  const [campaigns, setCampaigns] = useState<AmplifyCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("amplify_campaigns")
      .select("*")
      .eq("artist_id", user.id)
      .order("created_at", { ascending: false });
    setCampaigns((data as AmplifyCampaignRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const computeCostPerFan = (tier: AmplifyBoostTier, audience: number) => {
    const tightness = audience / 100;
    const convMult = 1 + tightness * 0.6;
    const fansAvg = ((tier.predictedNewFansMin + tier.predictedNewFansMax) / 2) * convMult;
    return Number((tier.bakPrice / fansAvg).toFixed(4));
  };

  const handleLaunch = async (tier: AmplifyBoostTier, audience: number) => {
    if (!user) {
      toast.error("Please sign in to launch a boost");
      return;
    }
    setLaunching(true);
    try {
      const tightness = audience / 100;
      const reachMult = 1 - tightness * 0.45;
      const convMult = 1 + tightness * 0.6;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in required");

      const { data, error } = await supabase.functions.invoke("amplify-checkout", {
        body: {
          tier_id: tier.id,
          tier_name: tier.name,
          bak_price: tier.bakPrice,
          duration_days: tier.durationDays,
          audience_level: audience,
          placements: tier.placements,
          predicted_impressions_low: Math.round(tier.predictedImpressionsMin * reachMult),
          predicted_impressions_high: Math.round(tier.predictedImpressionsMax * reachMult),
          predicted_new_fans_low: Math.round(tier.predictedNewFansMin * convMult),
          predicted_new_fans_high: Math.round(tier.predictedNewFansMax * convMult),
          predicted_cost_per_fan: computeCostPerFan(tier, audience),
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Checkout failed");

      toast.success(`${tier.name} Boost launched`, {
        description: `${tier.bakPrice} BAK charged · runs for ${tier.durationDays} days · auto-refund if under 50% delivered.`,
      });
      load();
    } catch (e: any) {
      toast.error(e.message || "Could not launch boost");
    } finally {
      setLaunching(false);
    }
  };

  const settleEnded = async () => {
    setSettling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const due = campaigns.filter(c => new Date(c.ends_at) < new Date() && (c.status === "active" || c.status === "completed"));
      if (due.length === 0) {
        toast.info("No campaigns ready to settle yet");
        return;
      }
      for (const c of due) {
        await supabase.functions.invoke("amplify-settle", {
          body: { campaign_id: c.id },
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        });
      }
      toast.success(`Settled ${due.length} campaign${due.length === 1 ? "" : "s"}`);
      load();
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Amplify Boost</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Pay to reach more fans — without buying votes or rankings.
            Every Amplify placement is publicly labeled <span className="font-semibold">Promoted</span>,
            and predicted results are shown before you spend a single BAK.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { icon: Eye, title: "Honest predictions", body: "Impression and fan ranges based on similar boosts." },
            { icon: Megaphone, title: "Labeled Promoted", body: "Fans always see when a placement is paid." },
            { icon: ShieldCheck, title: "Auto-refund", body: "Below 50% predicted reach? Difference returns as BAK." },
          ].map((it) => (
            <Card key={it.title}>
              <CardContent className="p-3 flex gap-2">
                <it.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">{it.title}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">{it.body}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="launch" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="launch">Launch boost</TabsTrigger>
            <TabsTrigger value="reports">
              Reports {campaigns.length > 0 && `(${campaigns.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="launch" className="mt-4 space-y-3">
            {launching && (
              <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Launching boost…
              </div>
            )}
            <AmplifyBoostCard onLaunch={handleLaunch} />
          </TabsContent>

          <TabsContent value="reports" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Actual vs. predicted reach. Under-delivered boosts auto-refund.
              </p>
              <Button variant="outline" size="sm" onClick={settleEnded} disabled={settling}>
                {settling ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                Settle ended
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" /> Loading reports…
              </div>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No boosts yet. Launch your first one from the Launch tab.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => <AmplifyReportRow key={c.id} c={c} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <p className="text-[11px] text-center text-muted-foreground">
          Amplify never affects competition rankings, vote weights, or editorial picks.
        </p>
      </div>
    </div>
  );
}

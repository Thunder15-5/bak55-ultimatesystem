import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Vote, Users, Trophy, Coins, FileCheck, Scale, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrustSignals } from "@/components/competition/TrustSignals";
import { LiveAuditFeed } from "@/components/trust/LiveAuditFeed";
import { RuleCard } from "@/components/trust/RuleCard";
import { TransparencyChangelog } from "@/components/trust/TransparencyChangelog";
import { PageSEO } from "@/components/SEO";

interface PlatformStats {
  totalVotes: number;
  totalArtists: number;
  totalCompetitions: number;
  totalPayoutsBak: number;
  votesReversed: number;
  tracksReviewed: number;
}

export default function Transparency() {
  const [stats, setStats] = useState<PlatformStats>({
    totalVotes: 0,
    totalArtists: 0,
    totalCompetitions: 0,
    totalPayoutsBak: 0,
    votesReversed: 0,
    tracksReviewed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [votes, artists, comps, payouts, reversed, reviewed] = await Promise.all([
          supabase.from("votes" as any).select("*", { count: "exact", head: true }),
          supabase.from("artist_profiles" as any).select("*", { count: "exact", head: true }),
          supabase.from("competitions" as any).select("*", { count: "exact", head: true }),
          supabase
            .from("transactions" as any)
            .select("amount")
            .eq("type", "earning"),
          supabase
            .from("admin_activity_log" as any)
            .select("*", { count: "exact", head: true })
            .eq("event_type", "votes_invalidated"),
          supabase
            .from("tracks" as any)
            .select("*", { count: "exact", head: true })
            .neq("moderation_status", "pending"),
        ]);

        const totalPayouts = (payouts.data || []).reduce(
          (s: number, t: any) => s + Number(t.amount || 0),
          0
        );

        setStats({
          totalVotes: votes.count || 0,
          totalArtists: artists.count || 0,
          totalCompetitions: comps.count || 0,
          totalPayoutsBak: totalPayouts,
          votesReversed: reversed.count || 0,
          tracksReviewed: reviewed.count || 0,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const headlineStats = [
    { label: "Verified Votes", value: stats.totalVotes, icon: Vote },
    { label: "Artists On-Platform", value: stats.totalArtists, icon: Users },
    { label: "Competitions Run", value: stats.totalCompetitions, icon: Trophy },
    { label: "BAK Paid to Artists", value: stats.totalPayoutsBak, icon: Coins, format: "bak" },
  ];

  const integrityStats = [
    { label: "Tracks Reviewed", value: stats.tracksReviewed, icon: FileCheck },
    { label: "Suspicious Votes Reversed", value: stats.votesReversed, icon: ShieldCheck },
  ];

  return (
    <>
      <PageSEO page="home" />
      <div className="min-h-screen bg-background pb-32">
        <Navigation />

        <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
          {/* Hero */}
          <div className="text-center mb-10 space-y-3">
            <Badge className="bg-primary/15 text-primary border-primary/30 mb-2">
              <Eye className="h-3 w-3 mr-1.5" />Public Transparency Report
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              BAK55 Operates <span className="text-gradient">in the Open</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real-time platform metrics, the rules that govern competitions, and every integrity action we take.
              No hidden algorithms. No black boxes.
            </p>
          </div>

          {/* Headline metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {headlineStats.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="text-center">
                  <CardContent className="p-5">
                    <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl sm:text-3xl font-black">
                      {loading ? "—" : s.value.toLocaleString()}
                      {s.format === "bak" && <span className="text-sm font-medium text-muted-foreground ml-1">BAK</span>}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trust signals strip */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />Our Trust Pillars
              </CardTitle>
              <CardDescription>How we protect every artist, vote, and payout.</CardDescription>
            </CardHeader>
            <CardContent>
              <TrustSignals />
            </CardContent>
          </Card>

          {/* Integrity actions + live feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />Integrity Actions
                </CardTitle>
                <CardDescription>Every action we take to keep BAK55 fair.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {integrityStats.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{s.label}</span>
                      </div>
                      <span className="text-lg font-bold">{loading ? "—" : s.value.toLocaleString()}</span>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground pt-2">
                  Auto-detection runs continuously. Suspected fraud is reviewed in a 7-day window after each finals before final settlement.
                </p>
              </CardContent>
            </Card>

            <LiveAuditFeed limit={6} />
          </div>

          {/* Rules */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">The Rules That Govern Everything</h2>

            <RuleCard
              title="Voting"
              subtitle="How votes are counted and weighted."
              defaultOpen
              rules={[
                { label: "Cost per vote", value: "1 BAK", hint: "0.65 BAK goes directly to the artist" },
                { label: "Self-vote daily cap", value: "10 / day" },
                { label: "Per-submission rate limit", value: "50 / hour", hint: "Globally enforced" },
                { label: "Final score weighting", value: "70% fan · 30% AI" },
                { label: "Fraud review window", value: "7 days post-finals" },
              ]}
            />

            <RuleCard
              title="Prizes & Payouts"
              subtitle="Where the money flows after a competition ends."
              rules={[
                { label: "Artist revenue share", value: "65%" },
                { label: "Platform operations", value: "35%", hint: "Used for prize pool, infra, moderation" },
                { label: "Minimum withdrawal", value: "250 BAK" },
                { label: "Withdrawal fee", value: "5%" },
                { label: "KYC required", value: "Yes (Level 3+)" },
                { label: "Settlement", value: "Day 7 post-finals", hint: "After fraud review window closes" },
              ]}
            />

            <RuleCard
              title="Artist Eligibility"
              subtitle="Who can compete and upload."
              rules={[
                { label: "Free tier track uploads", value: "1 track" },
                { label: "Free tier competition entries", value: "1 entry" },
                { label: "Withdrawal eligibility", value: "Level 3 + KYC" },
                { label: "Min followers for payout", value: "100" },
                { label: "Min streams for payout", value: "1,000" },
              ]}
            />

            <RuleCard
              title="BAKCoin Economy"
              subtitle="The unit that powers BAK55."
              rules={[
                { label: "BAKCoin value", value: "1 BAK = $0.16 USD" },
                { label: "Approx KES rate", value: "~20 KES" },
                { label: "Tip minimum", value: "0.1 BAK" },
                { label: "Direct song sale minimum", value: "2.5 BAK" },
              ]}
            />
          </div>

          {/* Public change log */}
          <div className="mb-8">
            <TransparencyChangelog />
          </div>

          {/* Commitments */}
          <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/20">
            <CardHeader>
              <CardTitle>Our Public Commitments</CardTitle>
              <CardDescription>What we will never do.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                "We will never alter vote counts without a public log entry.",
                "We will never override a competition winner without two-admin approval.",
                "We will never charge a hidden fee. Every cost is in this report.",
                "We will never run a competition without a published prize and timeline.",
                "We will never share artist KYC or fan PII with third parties without consent.",
                "We will never let suspicious votes count toward final settlement.",
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-foreground/90">{c}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
}

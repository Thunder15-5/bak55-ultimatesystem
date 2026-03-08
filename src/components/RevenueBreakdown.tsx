import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, DollarSign, TrendingUp, Users, Music, Loader2 } from "lucide-react";

interface RevenueData {
  tips: number;
  competitions: number;
  trackSales: number;
  fanClub: number;
}

interface FollowerGrowth {
  date: string;
  count: number;
}

interface TopTrack {
  title: string;
  plays: number;
  revenue: number;
}

export function RevenueBreakdown() {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState<RevenueData>({ tips: 0, competitions: 0, trackSales: 0, fanClub: 0 });
  const [followerGrowth, setFollowerGrowth] = useState<FollowerGrowth[]>([]);
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    try {
      // Get wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (wallet) {
        // Get all transactions grouped by type
        const { data: txns } = await supabase
          .from("transactions")
          .select("type, amount, description")
          .eq("wallet_id", wallet.id)
          .gt("amount", 0);

        const rev: RevenueData = { tips: 0, competitions: 0, trackSales: 0, fanClub: 0 };
        txns?.forEach((t) => {
          const amt = Number(t.amount);
          if (t.type === "tip" || t.description?.toLowerCase().includes("tip")) {
            rev.tips += amt;
          } else if (t.type === "competition_prize" || t.description?.toLowerCase().includes("competition")) {
            rev.competitions += amt;
          } else if (t.type === "sale" || t.description?.toLowerCase().includes("sale") || t.description?.toLowerCase().includes("purchase")) {
            rev.trackSales += amt;
          } else if (t.description?.toLowerCase().includes("fan club") || t.description?.toLowerCase().includes("membership")) {
            rev.fanClub += amt;
          } else if (t.type === "earning" || t.type === "income") {
            rev.tips += amt; // Default earnings to tips
          }
        });
        setRevenue(rev);
      }

      // Follower growth (last 30 days)
      const { data: followers } = await supabase
        .from("followers")
        .select("created_at")
        .eq("artist_id", user!.id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at");

      const growthMap = new Map<string, number>();
      let cumulative = 0;
      followers?.forEach((f) => {
        const date = new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        cumulative++;
        growthMap.set(date, cumulative);
      });
      setFollowerGrowth(Array.from(growthMap.entries()).map(([date, count]) => ({ date, count })));

      // Top tracks
      const { data: tracks } = await supabase
        .from("tracks")
        .select("title, plays")
        .eq("artist_id", user!.id)
        .order("plays", { ascending: false })
        .limit(10);

      setTopTracks(
        (tracks || []).map((t) => ({
          title: t.title,
          plays: t.plays || 0,
          revenue: 0, // Would need per-track earnings query
        }))
      );
    } catch (err) {
      console.error("Error fetching revenue data:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const totalRev = revenue.tips + revenue.competitions + revenue.trackSales + revenue.fanClub;
    const rows = [
      ["Revenue Source", "Amount (BAK)", "Percentage"],
      ["Tips", revenue.tips.toFixed(2), totalRev > 0 ? ((revenue.tips / totalRev) * 100).toFixed(1) + "%" : "0%"],
      ["Competitions", revenue.competitions.toFixed(2), totalRev > 0 ? ((revenue.competitions / totalRev) * 100).toFixed(1) + "%" : "0%"],
      ["Track Sales", revenue.trackSales.toFixed(2), totalRev > 0 ? ((revenue.trackSales / totalRev) * 100).toFixed(1) + "%" : "0%"],
      ["Fan Club", revenue.fanClub.toFixed(2), totalRev > 0 ? ((revenue.fanClub / totalRev) * 100).toFixed(1) + "%" : "0%"],
      ["", "", ""],
      ["Total", totalRev.toFixed(2), "100%"],
      ["", "", ""],
      ["Top Tracks", "Plays", ""],
      ...topTracks.map((t) => [t.title, t.plays.toString(), ""]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bak55-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = revenue.tips + revenue.competitions + revenue.trackSales + revenue.fanClub;
  const pieData = [
    { name: "Tips", value: revenue.tips, color: "hsl(var(--primary))" },
    { name: "Competitions", value: revenue.competitions, color: "hsl(var(--secondary))" },
    { name: "Track Sales", value: revenue.trackSales, color: "hsl(var(--accent))" },
    { name: "Fan Club", value: revenue.fanClub, color: "hsl(var(--muted-foreground))" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Revenue Breakdown
        </h3>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Tips", value: revenue.tips, icon: "💝" },
          { label: "Competitions", value: revenue.competitions, icon: "🏆" },
          { label: "Track Sales", value: revenue.trackSales, icon: "🎵" },
          { label: "Fan Club", value: revenue.fanClub, icon: "⭐" },
        ].map((item) => (
          <Card key={item.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <span className="text-xl">{item.icon}</span>
              <p className="text-lg font-bold mt-1">{item.value.toFixed(1)} BAK</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Pie Chart */}
      {totalRevenue > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Sources</CardTitle>
            <CardDescription>Total: {totalRevenue.toFixed(2)} BAK</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} BAK`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Follower Growth */}
      {followerGrowth.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Follower Growth (30 Days)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={followerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Tracks Table */}
      {topTracks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Top Tracks by Plays</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topTracks.map((track, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <span className="text-sm font-bold text-muted-foreground w-6 text-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {track.plays.toLocaleString()} plays
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

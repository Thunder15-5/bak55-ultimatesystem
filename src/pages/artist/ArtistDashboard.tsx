import { useEffect, useState } from "react";
import { getArtistShareUrl } from "@/lib/shareUrl";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HeroAction } from "@/components/HeroAction";
import {
  StatsCard, DashboardHeader, QuickActions, DashboardSkeleton,
  ShareAndGrow, OpportunitiesFeed, ActiveCompetitionCard,
} from "@/components/dashboard";
import { supabase } from "@/integrations/supabase/client";
import {
  Music, Wallet, TrendingUp, Upload, BarChart3,
  DollarSign, Users, Trophy, Clock, Play, Headphones,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ArtistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    balance: 0,
    tracksCount: 0,
    totalPlays: 0,
    totalEarnings: 0,
    followers: 0,
    likes: 0,
    comments: 0,
    competitions: 0,
    topTrack: null as any,
    recentActivity: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
      const walletChannel = supabase
        .channel('artist_wallet_rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, () => fetchStats())
        .subscribe();
      return () => { supabase.removeChannel(walletChannel); };
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [walletData, tracksData, artistProfile, followersResult, competitionsResult] = await Promise.all([
        supabase.from("wallets").select("id, balance").eq("user_id", user?.id).maybeSingle(),
        supabase.from("tracks").select("id, title, plays").eq("artist_id", user?.id).order("plays", { ascending: false }),
        supabase.from("artist_profiles").select("total_earnings").eq("user_id", user?.id).maybeSingle(),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("artist_id", user?.id),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("artist_id", user?.id),
      ]);

      const trackIds = tracksData.data?.map(t => t.id) || [];
      const [likesResult, commentsResult, transactionsResult] = await Promise.all([
        trackIds.length > 0
          ? supabase.from("track_likes").select("*", { count: "exact", head: true }).in("track_id", trackIds)
          : Promise.resolve({ count: 0 }),
        trackIds.length > 0
          ? supabase.from("comments").select("*", { count: "exact", head: true }).in("track_id", trackIds)
          : Promise.resolve({ count: 0 }),
        walletData.data?.id
          ? supabase.from("transactions").select("*").eq("wallet_id", walletData.data.id).order("created_at", { ascending: false }).limit(5)
          : Promise.resolve({ data: [] }),
      ]);

      setStats({
        balance: walletData.data?.balance || 0,
        tracksCount: tracksData.data?.length || 0,
        totalPlays: tracksData.data?.reduce((sum, track) => sum + (track.plays || 0), 0) || 0,
        totalEarnings: artistProfile.data?.total_earnings || 0,
        followers: followersResult.count || 0,
        likes: (likesResult as any).count || 0,
        comments: (commentsResult as any).count || 0,
        competitions: competitionsResult.count || 0,
        topTrack: tracksData.data?.[0] || null,
        recentActivity: (transactionsResult as any).data || [],
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "Artist";

  const getHeroAction = () => {
    if (stats.tracksCount === 0) {
      return { icon: Upload, title: "Upload Your First Track", description: "Get started by sharing your music with the world.", actionLabel: "Upload Now", actionLink: "/artist/upload" };
    }
    if (stats.competitions === 0) {
      return { icon: Trophy, title: "Enter a Competition", description: "Compete for prizes and grow your fanbase.", actionLabel: "Browse", actionLink: "/artist/competitions" };
    }
    return null;
  };

  const heroAction = getHeroAction();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-24">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <DashboardSkeleton statsCount={4} />
          ) : (
            <div className="space-y-5">
              {/* Header */}
              <DashboardHeader
                greeting="Welcome Back"
                username={username}
                subtitle="Here's what's happening with your music"
                actions={[
                  { label: "Upload Track", icon: Upload, variant: "hero" as any, onClick: () => navigate("/artist/upload") },
                ]}
              />

              <EmailVerificationBanner />

              {/* Contextual Hero Action */}
              {heroAction && (
                <HeroAction
                  icon={heroAction.icon}
                  title={heroAction.title}
                  description={heroAction.description}
                  actionLabel={heroAction.actionLabel}
                  actionLink={heroAction.actionLink}
                />
              )}

              {/* 4 Primary Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatsCard icon={Wallet} label="BAKCoins" value={stats.balance.toFixed(2)} variant="primary" link="/artist/revenue" />
                <StatsCard icon={Music} label="Tracks" value={stats.tracksCount} variant="secondary" link="/artist/catalog" />
                <StatsCard icon={TrendingUp} label="Plays" value={stats.totalPlays.toLocaleString()} variant="accent" link="/artist/analytics" />
                <StatsCard icon={Users} label="Followers" value={stats.followers} variant="success" link="/artist/profile" />
              </div>

              {/* Active Competition — High Priority */}
              <ActiveCompetitionCard userId={user?.id || ""} />

              {/* Quick Actions + Share & Grow */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <QuickActions
                    columns={3}
                    actions={[
                      { icon: Upload, label: "Upload", link: "/artist/upload", variant: "hero" },
                      { icon: BarChart3, label: "Analytics", link: "/artist/analytics" },
                      { icon: Wallet, label: "Revenue", link: "/artist/revenue" },
                      { icon: Trophy, label: "Competitions", link: "/artist/competitions" },
                      { icon: Music, label: "My Tracks", link: "/artist/catalog" },
                      { icon: Headphones, label: "Beats", link: "/beats" },
                    ]}
                  />
                </div>
                <ShareAndGrow userId={user?.id || ""} />
              </div>

              {/* Top Track + Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      Top Performing
                    </CardTitle>
                    <CardDescription className="text-xs">Your most played track</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.topTrack ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                            <Play className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{stats.topTrack.title}</p>
                            <p className="text-xs text-muted-foreground">{stats.topTrack.plays} plays</p>
                          </div>
                        </div>
                        <Progress value={Math.min((stats.topTrack.plays / 10000) * 100, 100)} />
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-2">
                        <Upload className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                        <p className="text-sm text-muted-foreground">Upload a track to see performance</p>
                        <Link to="/artist/upload">
                          <Button variant="outline" size="sm">Upload Now</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.recentActivity.length > 0 ? (
                        stats.recentActivity.map((activity, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge variant={activity.amount > 0 ? "default" : "secondary"} className="text-xs">
                              {activity.amount > 0 ? '+' : ''}{activity.amount} BAK
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4 text-sm">Activity will appear here as you earn BAKCoins.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Opportunities */}
              <OpportunitiesFeed />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

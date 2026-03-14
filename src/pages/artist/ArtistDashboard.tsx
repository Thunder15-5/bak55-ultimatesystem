import { useEffect, useState } from "react";
import { getArtistShareUrl } from "@/lib/shareUrl";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { TrackRecommendations } from "@/components/TrackRecommendations";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { ArtistLevelCard } from "@/components/ArtistLevelCard";
import { WithdrawalEligibilityCard } from "@/components/WithdrawalEligibilityCard";
import { CompetitionBanner } from "@/components/CompetitionBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { DailyStreak } from "@/components/DailyStreak";
import { StatsCard, DashboardHeader, QuickActions, DashboardSkeleton } from "@/components/dashboard";
import { ArtistCollaboration } from "@/components/ArtistCollaboration";
import { supabase } from "@/integrations/supabase/client";
import {
  Music, Wallet, TrendingUp, Upload, BarChart3, DollarSign,
  Users, Heart, MessageCircle, Trophy, Clock, Play, Headphones,
  GraduationCap, Share2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useFeaturedCompetition } from "@/hooks/useFeaturedCompetition";

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
  const featuredCompetition = useFeaturedCompetition(user?.id);

  useEffect(() => {
    if (user) {
      fetchStats();

      const walletChannel = supabase
        .channel('artist_wallet_rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, () => fetchStats())
        .subscribe();

      const artistChannel = supabase
        .channel('artist_profile_rt')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'artist_profiles', filter: `user_id=eq.${user.id}` }, () => fetchStats())
        .subscribe();

      return () => {
        supabase.removeChannel(walletChannel);
        supabase.removeChannel(artistChannel);
      };
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-24">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <DashboardSkeleton statsCount={4} />
          ) : (
            <div className="space-y-6">
              <DashboardHeader
                greeting="Welcome Back"
                username={username}
                subtitle="Ready to create amazing music today?"
                actions={[
                  {
                    label: "Share Profile",
                    icon: Share2,
                    variant: "outline",
                    onClick: () => {
                      const url = getArtistShareUrl(user?.id || "");
                      const text = `Check out my music on BAK55 Talent! 🎶🔥`;
                      if (navigator.share) {
                        navigator.share({ title: "My BAK55 Profile", text, url });
                      } else {
                        navigator.clipboard.writeText(`${text}\n${url}`);
                        toast.success("Profile link copied!");
                      }
                    },
                  },
                  { label: "Upload Track", icon: Upload, variant: "hero" as any, onClick: () => navigate("/artist/upload") },
                ]}
              />

              <EmailVerificationBanner />
              <DailyStreak />
              <OnboardingChecklist />

              {/* Artist Course Banner */}
              <Link to="/artist/course" className="block">
                <Card className="border-primary/20 hover:border-primary/40 transition-all bg-gradient-to-r from-primary/5 to-accent/5 cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-3 px-4">
                    <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">BAK55 Artist Course</p>
                      <p className="text-xs text-muted-foreground">Learn how to succeed on the platform</p>
                    </div>
                    <Button size="sm" variant="outline" className="flex-shrink-0">Start</Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Featured Competition */}
              {featuredCompetition && (
                <CompetitionBanner
                  competitionId={featuredCompetition.id}
                  title={featuredCompetition.title}
                  coverImage={featuredCompetition.cover_image}
                  prizeAmount={featuredCompetition.prize_amount}
                  endDate={featuredCompetition.end_date}
                  maxSubmissions={featuredCompetition.max_submissions}
                  currentSubmissions={featuredCompetition.submissions?.[0]?.count || 0}
                  ctaText="Submit Your Track"
                  ctaLink={`/artist/upload?competition=${featuredCompetition.id}`}
                />
              )}

              {/* Stats Grid - 4 cols on large, 2 on mobile */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatsCard icon={Wallet} label="BAKCoins" value={stats.balance.toFixed(2)} variant="primary" link="/artist/wallet" />
                <StatsCard icon={Music} label="Tracks" value={stats.tracksCount} variant="secondary" link="/artist/catalog" />
                <StatsCard icon={TrendingUp} label="Total Plays" value={stats.totalPlays.toLocaleString()} variant="accent" link="/artist/analytics" />
                <StatsCard icon={DollarSign} label="Lifetime Earnings" value={`${stats.totalEarnings.toFixed(2)} BAK`} variant="success" link="/artist/wallet" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatsCard icon={Users} label="Followers" value={stats.followers} variant="primary" link="/artist/profile" />
                <StatsCard icon={Heart} label="Likes" value={stats.likes} variant="destructive" link="/artist/catalog" />
                <StatsCard icon={Trophy} label="Competitions" value={stats.competitions} variant="warning" link="/artist/competitions" />
                <StatsCard icon={MessageCircle} label="Comments" value={stats.comments} variant="accent" link="/artist/catalog" />
              </div>

              {/* Revenue Split */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Revenue Split
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                      <p className="text-xl sm:text-2xl font-bold text-primary">90%</p>
                      <p className="text-xs text-muted-foreground">Fan Tips</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/10 text-center">
                      <p className="text-xl sm:text-2xl font-bold text-secondary">65%</p>
                      <p className="text-xs text-muted-foreground">Competition Votes</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/10 text-center">
                      <p className="text-xl sm:text-2xl font-bold text-accent">70%</p>
                      <p className="text-xs text-muted-foreground">Track Sales</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Level & Withdrawal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {user && <ArtistLevelCard userId={user.id} />}
                {user && <WithdrawalEligibilityCard userId={user.id} />}
              </div>

              <SubscriptionStatusCard />
              <ArtistCollaboration />

              {/* Performance & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Track */}
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
                            <Play className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{stats.topTrack.title}</p>
                            <p className="text-xs text-muted-foreground">{stats.topTrack.plays} plays</p>
                          </div>
                        </div>
                        <Progress value={Math.min((stats.topTrack.plays / 10000) * 100, 100)} />
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4 text-sm">No tracks yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="lg:col-span-2 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription className="text-xs">Latest transactions and earnings</CardDescription>
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
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={activity.amount > 0 ? "default" : "secondary"} className="text-xs">
                              {activity.amount > 0 ? '+' : ''}{activity.amount} BAK
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4 text-sm">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <QuickActions
                    columns={3}
                    actions={[
                      { icon: Upload, label: "Upload Track", link: "/artist/upload", variant: "hero" },
                      { icon: BarChart3, label: "Analytics", link: "/artist/analytics" },
                      { icon: Wallet, label: "Wallet", link: "/artist/wallet" },
                      { icon: Trophy, label: "Competitions", link: "/artist/competitions" },
                      { icon: Music, label: "My Tracks", link: "/artist/catalog" },
                      { icon: Headphones, label: "Browse Beats", link: "/beats" },
                    ]}
                  />
                </div>
                <TrackRecommendations />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

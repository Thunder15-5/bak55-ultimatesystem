import { useEffect, useState } from "react";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { TrackRecommendations } from "@/components/TrackRecommendations";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { CompetitionBanner } from "@/components/CompetitionBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCollection } from "@/components/competition/BadgeCollection";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { DailyStreak } from "@/components/DailyStreak";
import { ActivityFeed } from "@/components/ActivityFeed";
import { supabase } from "@/integrations/supabase/client";
import { Music, Wallet, TrendingUp, Upload, Sparkles, BarChart3, DollarSign, Users, Heart, MessageCircle, Trophy, Clock, Play, Award, Headphones, GraduationCap, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ArtistCollaboration } from "@/components/ArtistCollaboration";
import { toast } from "sonner";
import { useFeaturedCompetition } from "@/hooks/useFeaturedCompetition";

export default function ArtistDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    balance: 0,
    tracksCount: 0,
    totalPlays: 0,
    totalEarnings: 0,
    followers: 0,
    likes: 0,
    comments: 0,
    competitions: 0,
    avgPlayDuration: 0,
    topTrack: null as any,
    recentActivity: [] as any[],
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const featuredCompetition = useFeaturedCompetition(user?.id);

  useEffect(() => {
    if (user) {
      fetchStats();
      
      // Subscribe to wallet changes
      const walletChannel = supabase
        .channel('dashboard_wallet')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchStats();
        })
        .subscribe();
      
      // Subscribe to artist profile changes
      const artistChannel = supabase
        .channel('dashboard_artist')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'artist_profiles',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchStats();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(walletChannel);
        supabase.removeChannel(artistChannel);
      };
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Parallel fetch for all stats
      const [walletData, tracksData, artistProfile, followersResult, competitionsResult] = await Promise.all([
        supabase.from("wallets").select("id, balance").eq("user_id", user?.id).maybeSingle(),
        supabase.from("tracks").select("id, title, plays").eq("artist_id", user?.id).order("plays", { ascending: false }),
        supabase.from("artist_profiles").select("total_earnings").eq("user_id", user?.id).maybeSingle(),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("artist_id", user?.id),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("artist_id", user?.id),
      ]);

      const trackIds = tracksData.data?.map(t => t.id) || [];
      
      // Second parallel batch for track-dependent and wallet-dependent queries
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

      const topTrack = tracksData.data?.[0] || null;

      setStats({
        balance: walletData.data?.balance || 0,
        tracksCount: tracksData.data?.length || 0,
        totalPlays: tracksData.data?.reduce((sum, track) => sum + (track.plays || 0), 0) || 0,
        totalEarnings: artistProfile.data?.total_earnings || 0,
        followers: followersResult.count || 0,
        likes: (likesResult as any).count || 0,
        comments: (commentsResult as any).count || 0,
        competitions: competitionsResult.count || 0,
        avgPlayDuration: 0,
        topTrack,
        recentActivity: (transactionsResult as any).data || [],
        monthlyGrowth: 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Wallet, value: stats.balance.toFixed(2), label: "BAKCoins Balance", color: "from-primary to-primary-glow", link: "/artist/wallet", trend: null },
    { icon: Music, value: stats.tracksCount, label: "Total Tracks", color: "from-secondary to-secondary-glow", link: "/artist/catalog", trend: null },
    { icon: TrendingUp, value: stats.totalPlays.toLocaleString(), label: "Total Plays", color: "from-accent to-accent-glow", link: "/artist/analytics", trend: null },
    { icon: DollarSign, value: stats.totalEarnings.toFixed(2), label: "Lifetime Earnings", color: "from-primary via-accent to-secondary", link: "/artist/wallet", trend: null },
    { icon: Users, value: stats.followers, label: "Followers", color: "from-blue-500 to-cyan-500", link: "/artist/profile", trend: null },
    { icon: Heart, value: stats.likes, label: "Total Likes", color: "from-red-500 to-pink-500", link: "/artist/catalog", trend: null },
    { icon: Trophy, value: stats.competitions, label: "Competitions", color: "from-yellow-500 to-amber-500", link: "/artist/competitions", trend: null },
    { icon: MessageCircle, value: stats.comments, label: "Comments", color: "from-green-500 to-emerald-500", link: "/artist/catalog", trend: null },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-12">
        {/* Welcome Section */}
        <div className="mb-8 md:mb-12 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Welcome Back</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-3">
            Hey,{" "}
            <span className="text-gradient">
              {user?.user_metadata?.username || user?.email?.split("@")[0]}
            </span>
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-lg text-muted-foreground">
              Ready to create amazing music today?
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `${window.location.origin}/artist/${user?.id}`;
                const text = `Check out my music on BAK55 Talent! 🎶🔥`;
                if (navigator.share) {
                  navigator.share({ title: "My BAK55 Profile", text, url });
                } else {
                  navigator.clipboard.writeText(`${text}\n${url}`);
                  toast.success("Profile link copied!");
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share Profile
            </Button>
          </div>
        </div>

        <EmailVerificationBanner />

        {/* Daily Streak */}
        <div className="mb-8">
          <DailyStreak />
        </div>

        {/* Onboarding Checklist */}
        <div className="mb-8">
          <OnboardingChecklist />
        </div>

        {/* Artist Course Banner */}
        <Link to="/artist/course" className="block mb-8">
          <Card className="border-primary/20 hover:border-primary/40 transition-all bg-gradient-to-r from-primary/5 to-accent/5 cursor-pointer">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">BAK55 Artist Course</p>
                <p className="text-xs text-muted-foreground">Learn how to succeed on the platform</p>
              </div>
              <Button size="sm" variant="outline" className="flex-shrink-0">Start</Button>
            </CardContent>
          </Card>
        </Link>

        {/* Featured Competition Banner */}
        {featuredCompetition && (
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
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
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {statCards.map((stat, index) => (
            <Link key={index} to={stat.link}>
              <Card className="group relative overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-2xl">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <div className="text-2xl font-bold text-gradient mb-1">
                    {loading ? "..." : stat.value}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">View details →</span>
                    {stat.trend && (
                      <Badge variant="secondary" className="text-xs">
                        {stat.trend}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Revenue Split Info */}
        <Card className="mb-8 border-primary/20 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <CardTitle className="font-heading text-lg">Revenue Split</CardTitle>
            </div>
            <CardDescription>How you earn on BAK55 Talent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <p className="text-2xl font-bold text-primary">90%</p>
                <p className="text-xs text-muted-foreground">Fan Tips</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <p className="text-2xl font-bold text-primary">65%</p>
                <p className="text-xs text-muted-foreground">Competition Votes</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <p className="text-2xl font-bold text-primary">70%</p>
                <p className="text-xs text-muted-foreground">Track Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <div className="mb-8">
          <SubscriptionStatusCard />
        </div>

        {/* Artist Collaboration */}
        <div className="mb-8">
          <ArtistCollaboration />
        </div>

        {/* Performance & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Top Track */}
          <Card className="border-primary/20 bg-card/60 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <CardTitle className="font-heading text-lg">Top Performing</CardTitle>
              </div>
              <CardDescription>Your most played track</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : stats.topTrack ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{stats.topTrack.title}</p>
                      <p className="text-sm text-muted-foreground">{stats.topTrack.plays} plays</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Performance</span>
                      <span className="font-medium">{stats.topTrack.plays > 1000 ? 'Excellent' : 'Good'}</span>
                    </div>
                    <Progress value={Math.min((stats.topTrack.plays / 10000) * 100, 100)} />
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No tracks yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-primary/20 bg-card/60 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <CardTitle className="font-heading text-lg">Recent Activity</CardTitle>
              </div>
              <CardDescription>Latest transactions and earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={activity.amount > 0 ? "default" : "secondary"}>
                        {activity.amount > 0 ? '+' : ''}{activity.amount} BAK
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="lg:col-span-2">
            <Card className="border-primary/20 bg-card/60 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <CardTitle className="font-heading">Quick Actions</CardTitle>
                </div>
                <CardDescription>Jump right into what you need</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Link to="/artist/upload" className="group">
                  <Button variant="hero" className="w-full h-14 text-base font-semibold">
                    <Upload className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Upload Track
                  </Button>
                </Link>
                <Link to="/artist/analytics" className="group">
                  <Button variant="outline" className="w-full h-14 text-base font-semibold border-2">
                    <BarChart3 className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Analytics
                  </Button>
                </Link>
                <Link to="/artist/wallet" className="group">
                  <Button variant="secondary" className="w-full h-14 text-base font-semibold">
                    <Wallet className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Wallet
                  </Button>
                </Link>
                <Link to="/artist/competitions" className="group">
                  <Button variant="outline" className="w-full h-14 text-base font-semibold border-2">
                    <Trophy className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Competitions
                  </Button>
                </Link>
                <Link to="/artist/catalog" className="group">
                  <Button variant="secondary" className="w-full h-14 text-base font-semibold">
                    <Music className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    My Tracks
                  </Button>
                </Link>
                <Link to="/beats" className="group">
                  <Button variant="outline" className="w-full h-14 text-base font-semibold border-2">
                    <Headphones className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Browse Beats
                  </Button>
                </Link>
                <Link to="/artist/discover" className="group">
                  <Button variant="outline" className="w-full h-14 text-base font-semibold border-2">
                    <TrendingUp className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Discover
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div>
            <TrackRecommendations />
          </div>
        </div>

        {/* Revenue Split Transparency */}
        <Card className="mt-8 border-primary/20 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <CardTitle className="font-heading text-lg">Revenue Split</CardTitle>
            </div>
            <CardDescription>How earnings are distributed on BAK55</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <p className="text-3xl font-bold text-primary mb-1">65%</p>
                <p className="text-sm text-muted-foreground">Artist Share</p>
                <p className="text-xs text-muted-foreground mt-1">Competition winnings</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/10 text-center">
                <p className="text-3xl font-bold text-secondary mb-1">85%</p>
                <p className="text-sm text-muted-foreground">Producer Share</p>
                <p className="text-xs text-muted-foreground mt-1">Beat licensing</p>
              </div>
              <div className="p-4 rounded-lg bg-muted border border-border text-center">
                <p className="text-3xl font-bold mb-1">100%</p>
                <p className="text-sm text-muted-foreground">Tips</p>
                <p className="text-xs text-muted-foreground mt-1">Fan tips go directly to you</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

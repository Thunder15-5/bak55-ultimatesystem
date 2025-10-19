import { useEffect, useState } from "react";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { TrackRecommendations } from "@/components/TrackRecommendations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Music, Wallet, Trophy, TrendingUp, Upload, Vote, Sparkles, BarChart3, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, userRole } = useAuth();
  const [stats, setStats] = useState({
    balance: 0,
    tracksCount: 0,
    totalPlays: 0,
    totalEarnings: 0,
    votesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
      
      // Subscribe to wallet changes for real-time balance updates
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
      
      // Subscribe to artist profile changes for real-time earnings updates
      let artistChannel: any = null;
      if (userRole === 'artist') {
        artistChannel = supabase
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
      }
      
      return () => {
        supabase.removeChannel(walletChannel);
        if (artistChannel) supabase.removeChannel(artistChannel);
      };
    }
  }, [user, userRole]);

  const fetchStats = async () => {
    try {
      // Fetch wallet balance
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user?.id)
        .single();

      if (userRole === "artist") {
        // Fetch artist-specific stats
        const { data: tracksData } = await supabase
          .from("tracks")
          .select("id, plays")
          .eq("artist_id", user?.id);

        const { data: artistProfile } = await supabase
          .from("artist_profiles")
          .select("total_earnings")
          .eq("user_id", user?.id)
          .single();

        setStats({
          balance: walletData?.balance || 0,
          tracksCount: tracksData?.length || 0,
          totalPlays: tracksData?.reduce((sum, track) => sum + (track.plays || 0), 0) || 0,
          totalEarnings: artistProfile?.total_earnings || 0,
          votesCount: 0,
        });
      } else {
        // Fetch fan-specific stats
        const { data: votesData } = await supabase
          .from("votes")
          .select("id")
          .eq("voter_id", user?.id);

        setStats({
          balance: walletData?.balance || 0,
          tracksCount: 0,
          totalPlays: 0,
          totalEarnings: 0,
          votesCount: votesData?.length || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = userRole === "artist" ? [
    { icon: Wallet, value: stats.balance.toFixed(2), label: "BAKCoins Balance", color: "from-primary to-primary-glow", link: "/wallet" },
    { icon: Music, value: stats.tracksCount, label: "Total Tracks", color: "from-secondary to-secondary-glow", link: "/catalog" },
    { icon: TrendingUp, value: stats.totalPlays, label: "Total Plays", color: "from-accent to-accent-glow", link: "/analytics" },
    { icon: DollarSign, value: stats.totalEarnings.toFixed(2), label: "Lifetime Earnings", color: "from-primary via-accent to-secondary", link: "/wallet" },
  ] : [
    { icon: Wallet, value: stats.balance.toFixed(2), label: "BAKCoins Balance", color: "from-primary to-primary-glow", link: "/wallet" },
    { icon: Vote, value: stats.votesCount, label: "Votes Cast", color: "from-secondary to-secondary-glow", link: "/competitions" },
    { icon: Music, value: "Discover", label: "Music Catalog", color: "from-accent to-accent-glow", link: "/streaming" },
    { icon: Trophy, value: "Compete", label: "Competitions", color: "from-primary via-secondary to-accent", link: "/competitions" },
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
          <p className="text-lg text-muted-foreground">
            {userRole === "artist" 
              ? "Ready to create amazing music today?" 
              : userRole === "brand" 
                ? "Discover and partner with talented artists" 
                : "Discover new music and support your favorite artists"}
          </p>
        </div>

        <EmailVerificationBanner />

        {/* Admin Panel CTA - Only visible to admins */}
        {userRole === "admin" && (
          <Card className="mb-8 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 border-primary/30 shadow-xl animate-fade-in-up">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold">Admin Panel</h2>
                  </div>
                  <p className="text-muted-foreground">
                    Manage platform operations, users, competitions, and finances
                  </p>
                </div>
                <Link to="/admin">
                  <Button size="lg" variant="hero" className="shadow-lg w-full md:w-auto">
                    Open Admin Panel
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {statCards.map((stat, index) => (
            <Link key={index} to={stat.link}>
              <Card className="group relative overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-2xl">
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <CardHeader className="relative flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gradient mb-1">
                    {loading ? "..." : stat.value}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    <span>View details →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Quick Actions */}
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
                {userRole === "artist" && (
                  <>
                    <Link to="/upload" className="group">
                      <Button variant="hero" className="w-full h-14 text-base font-semibold">
                        <Upload className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                        Upload Track
                      </Button>
                    </Link>
                    <Link to="/analytics" className="group">
                      <Button variant="outline" className="w-full h-14 text-base font-semibold border-2">
                        <BarChart3 className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                        Analytics
                      </Button>
                    </Link>
                  </>
                )}
                <Link to="/competitions" className="group">
                  <Button variant="outline" className="w-full h-14 text-base font-semibold border-2">
                    <Trophy className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Competitions
                  </Button>
                </Link>
                <Link to="/wallet" className="group">
                  <Button variant="secondary" className="w-full h-14 text-base font-semibold">
                    <Wallet className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Wallet
                  </Button>
                </Link>
                <Link to="/streaming" className="group">
                  <Button variant="glass" className="w-full h-14 text-base font-semibold">
                    <Music className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Discover
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <div>
            <TrackRecommendations />
          </div>
        </div>
      </main>
    </div>
  );
}

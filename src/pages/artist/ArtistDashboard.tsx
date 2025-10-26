import { useEffect, useState } from "react";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { TrackRecommendations } from "@/components/TrackRecommendations";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Music, Wallet, TrendingUp, Upload, Sparkles, BarChart3, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

export default function ArtistDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    balance: 0,
    tracksCount: 0,
    totalPlays: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

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
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user?.id)
        .single();

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
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Wallet, value: stats.balance.toFixed(2), label: "BAKCoins Balance", color: "from-primary to-primary-glow", link: "/wallet" },
    { icon: Music, value: stats.tracksCount, label: "Total Tracks", color: "from-secondary to-secondary-glow", link: "/catalog" },
    { icon: TrendingUp, value: stats.totalPlays, label: "Total Plays", color: "from-accent to-accent-glow", link: "/analytics" },
    { icon: DollarSign, value: stats.totalEarnings.toFixed(2), label: "Lifetime Earnings", color: "from-primary via-accent to-secondary", link: "/wallet" },
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
            Ready to create amazing music today?
          </p>
        </div>

        <EmailVerificationBanner />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {statCards.map((stat, index) => (
            <Link key={index} to={stat.link}>
              <Card className="group relative overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-2xl">
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

        {/* Subscription Status */}
        <div className="mb-8">
          <SubscriptionStatusCard />
        </div>

        {/* Quick Actions & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
                <Link to="/wallet" className="group">
                  <Button variant="secondary" className="w-full h-14 text-base font-semibold">
                    <Wallet className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Wallet
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div>
            <TrackRecommendations />
          </div>
        </div>
      </main>
    </div>
  );
}

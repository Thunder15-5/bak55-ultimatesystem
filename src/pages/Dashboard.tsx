import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { TrackRecommendations } from "@/components/TrackRecommendations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Music, Wallet, Trophy, TrendingUp, Upload, Vote } from "lucide-react";
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
    }
  }, [user]);

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {user?.user_metadata?.username || user?.email?.split("@")[0]}
            </span>
          </h1>
          <p className="text-muted-foreground">
            {userRole === "artist" ? "Your artist dashboard" : userRole === "brand" ? "Your brand dashboard" : "Your fan dashboard"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">BAKCoins Balance</CardTitle>
              <Wallet className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {loading ? "..." : stats.balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">BAK</p>
            </CardContent>
          </Card>

          {userRole === "artist" && (
            <>
              <Card className="border-secondary/20 hover:border-secondary/40 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
                  <Music className="w-4 h-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary">
                    {loading ? "..." : stats.tracksCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Uploaded</p>
                </CardContent>
              </Card>

              <Card className="border-accent/20 hover:border-accent/40 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                  <TrendingUp className="w-4 h-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">
                    {loading ? "..." : stats.totalPlays}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <Trophy className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {loading ? "..." : stats.totalEarnings.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">BAK earned</p>
                </CardContent>
              </Card>
            </>
          )}

          {userRole === "fan" && (
            <Card className="border-secondary/20 hover:border-secondary/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
                <Vote className="w-4 h-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">
                  {loading ? "..." : stats.votesCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Cast</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump right into what you need</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userRole === "artist" && (
                  <>
                    <Link to="/upload">
                      <Button variant="hero" className="w-full">
                        <Upload className="mr-2 w-4 h-4" />
                        Upload Track
                      </Button>
                    </Link>
                    <Link to="/analytics">
                      <Button variant="outline" className="w-full">
                        <TrendingUp className="mr-2 w-4 h-4" />
                        Analytics
                      </Button>
                    </Link>
                  </>
                )}
                <Link to="/competitions">
                  <Button variant="outline" className="w-full">
                    <Trophy className="mr-2 w-4 h-4" />
                    View Competitions
                  </Button>
                </Link>
                <Link to="/wallet">
                  <Button variant="secondary" className="w-full">
                    <Wallet className="mr-2 w-4 h-4" />
                    Manage Wallet
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

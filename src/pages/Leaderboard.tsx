import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, Music, DollarSign, Users, Crown, Medal, Award } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface LeaderboardArtist {
  id: string;
  username: string;
  avatar_url: string | null;
  stage_name: string | null;
  verified: boolean;
  follower_count: number;
  total_plays: number;
  total_earnings: number;
}

export default function Leaderboard() {
  const [artists, setArtists] = useState<LeaderboardArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Single efficient query: get artists with their profiles
      const { data: artistProfiles, error } = await supabase
        .from("artist_profiles")
        .select(`
          user_id,
          stage_name,
          verified,
          total_earnings,
          profiles!artist_profiles_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('hidden', false)
        .limit(50);

      if (error) throw error;
      if (!artistProfiles?.length) { setLoading(false); return; }

      // Batch fetch follower counts and play counts
      const artistIds = artistProfiles.map(a => a.user_id);
      
      const [followersRes, tracksRes] = await Promise.all([
        supabase
          .from("followers")
          .select("artist_id")
          .in("artist_id", artistIds),
        supabase
          .from("tracks")
          .select("artist_id, plays")
          .in("artist_id", artistIds),
      ]);

      // Aggregate counts
      const followerCounts: Record<string, number> = {};
      followersRes.data?.forEach(f => {
        followerCounts[f.artist_id] = (followerCounts[f.artist_id] || 0) + 1;
      });

      const playCounts: Record<string, number> = {};
      tracksRes.data?.forEach(t => {
        playCounts[t.artist_id] = (playCounts[t.artist_id] || 0) + (t.plays || 0);
      });

      const mapped: LeaderboardArtist[] = artistProfiles.map(a => ({
        id: a.user_id,
        username: (a.profiles as any)?.username || 'Unknown',
        avatar_url: (a.profiles as any)?.avatar_url || null,
        stage_name: a.stage_name,
        verified: a.verified || false,
        follower_count: followerCounts[a.user_id] || 0,
        total_plays: playCounts[a.user_id] || 0,
        total_earnings: Number(a.total_earnings) || 0,
      }));

      setArtists(mapped);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-bold">#{rank}</span>;
  };

  const sortedBy = (metric: 'followers' | 'plays' | 'earnings') => {
    return [...artists].sort((a, b) => {
      if (metric === 'followers') return b.follower_count - a.follower_count;
      if (metric === 'plays') return b.total_plays - a.total_plays;
      return b.total_earnings - a.total_earnings;
    });
  };

  const renderLeaderboardList = (sorted: LeaderboardArtist[], metric: 'followers' | 'plays' | 'earnings') => (
    <div className="space-y-3">
      {sorted.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No artists yet. Be the first to join!</p>
      ) : sorted.map((artist, index) => (
        <Link key={artist.id} to={`/artist/${artist.id}`}>
          <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(index + 1)}
                </div>
                <Avatar className="h-14 w-14 border-2 border-primary/20 group-hover:border-primary transition-colors">
                  <AvatarImage src={artist.avatar_url || undefined} />
                  <AvatarFallback className="text-lg font-bold">
                    {(artist.stage_name || artist.username).substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">
                      {artist.stage_name || artist.username}
                    </h3>
                    {artist.verified && (
                      <Badge variant="default" className="h-5 px-1.5 text-xs">✓</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{artist.username}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {metric === 'followers' && artist.follower_count.toLocaleString()}
                    {metric === 'plays' && artist.total_plays.toLocaleString()}
                    {metric === 'earnings' && `${artist.total_earnings.toLocaleString()} BAK`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric === 'followers' && 'followers'}
                    {metric === 'plays' && 'total plays'}
                    {metric === 'earnings' && 'earned'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Artist Leaderboard | BAK55 Talent</title>
        <meta name="description" content="Discover the top artists on BAK55 Talent. See who's leading by followers, plays, and earnings." />
      </Helmet>
      
      <div className="min-h-screen bg-background pb-32">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center mb-12">
            <Trophy className="inline-block h-12 w-12 text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Artist Leaderboard
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the top-performing artists on BAK55 Talent
            </p>
          </div>

          <Tabs defaultValue="followers" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="followers" className="gap-2">
                <Users className="h-4 w-4" />
                Most Followers
              </TabsTrigger>
              <TabsTrigger value="plays" className="gap-2">
                <Music className="h-4 w-4" />
                Most Plays
              </TabsTrigger>
              <TabsTrigger value="earnings" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Top Earners
              </TabsTrigger>
            </TabsList>

            <TabsContent value="followers">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Top Artists by Followers
                  </CardTitle>
                  <CardDescription>Artists with the most loyal fanbase</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLeaderboardList(sortedBy('followers'), 'followers')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plays">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    Top Artists by Plays
                  </CardTitle>
                  <CardDescription>Artists with the most track plays</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLeaderboardList(sortedBy('plays'), 'plays')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Top Earning Artists
                  </CardTitle>
                  <CardDescription>Artists earning the most BAKCoins</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLeaderboardList(sortedBy('earnings'), 'earnings')}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <Footer />
      </div>
    </>
  );
}
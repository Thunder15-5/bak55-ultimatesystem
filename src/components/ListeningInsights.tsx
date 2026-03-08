import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Headphones, TrendingUp, Music2, Clock, Flame, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TopArtist {
  artist_id: string;
  username: string;
  count: number;
}

interface GenreBreakdown {
  genre: string;
  count: number;
  percentage: number;
}

export function ListeningInsights() {
  const { user } = useAuth();
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [genres, setGenres] = useState<GenreBreakdown[]>([]);
  const [totalListens, setTotalListens] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchInsights();
  }, [user]);

  const fetchInsights = async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: history } = await supabase
        .from("listening_history")
        .select("*, tracks(artist_id, genre)")
        .eq("user_id", user!.id)
        .gte("listened_at", thirtyDaysAgo)
        .order("listened_at", { ascending: false });

      if (!history?.length) {
        setLoading(false);
        return;
      }

      setTotalListens(history.length);

      // Top artists
      const artistCounts: Record<string, number> = {};
      history.forEach((h: any) => {
        const aid = h.tracks?.artist_id;
        if (aid) artistCounts[aid] = (artistCounts[aid] || 0) + 1;
      });

      const sortedArtists = Object.entries(artistCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      const artistIds = sortedArtists.map(([id]) => id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", artistIds.length ? artistIds : ["00000000-0000-0000-0000-000000000000"]);

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

      setTopArtists(sortedArtists.map(([id, count]) => ({
        artist_id: id,
        username: profileMap.get(id) || "Unknown",
        count,
      })));

      // Genre breakdown
      const genreCounts: Record<string, number> = {};
      history.forEach((h: any) => {
        const g = h.tracks?.genre || "Unknown";
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });

      const total = Object.values(genreCounts).reduce((a, b) => a + b, 0);
      setGenres(
        Object.entries(genreCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([genre, count]) => ({
            genre,
            count,
            percentage: Math.round((count / total) * 100),
          }))
      );

      // Listening streak
      const dates = new Set(history.map((h: any) => new Date(h.listened_at).toDateString()));
      let currentStreak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (dates.has(d.toDateString())) {
          currentStreak++;
        } else {
          break;
        }
      }
      setStreak(currentStreak);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const shareWrapped = () => {
    const text = `🎵 My BAK55 Wrapped!\n\n🎧 ${totalListens} tracks in 30 days\n🔥 ${streak}-day streak\n🎤 Top artist: ${topArtists[0]?.username || "N/A"}\n🎶 Top genre: ${genres[0]?.genre || "N/A"}\n\nJoin me on BAK55!`;
    
    if (navigator.share) {
      navigator.share({ title: "My BAK55 Wrapped", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  if (loading) return null;

  if (totalListens === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Headphones className="h-6 w-6 text-primary" />
          Your Listening Insights
        </h2>
        <Button variant="outline" size="sm" onClick={shareWrapped} className="gap-2">
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Music2 className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-3xl font-bold text-primary">{totalListens}</div>
            <div className="text-xs text-muted-foreground">Tracks (30d)</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-3xl font-bold text-orange-500">{streak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-secondary" />
            <div className="text-3xl font-bold text-secondary">{Math.round(totalListens * 3.5)}</div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Artists */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Your Top Artists
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topArtists.map((artist, i) => (
              <div key={artist.artist_id} className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                <div className="flex-1">
                  <p className="font-medium">{artist.username}</p>
                  <p className="text-xs text-muted-foreground">{artist.count} plays</p>
                </div>
                <div className="h-2 bg-muted rounded-full w-20">
                  <div
                    className="h-2 bg-primary rounded-full"
                    style={{ width: `${(artist.count / topArtists[0].count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Genre Breakdown */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Music2 className="h-4 w-4 text-secondary" />
              Your Top Genres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {genres.map(g => (
              <div key={g.genre} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{g.genre}</span>
                  <span className="text-muted-foreground">{g.percentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div
                    className="h-2 bg-secondary rounded-full transition-all"
                    style={{ width: `${g.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

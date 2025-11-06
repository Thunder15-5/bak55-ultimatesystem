import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Music } from "lucide-react";

interface TrendingArtist {
  id: string;
  username: string;
  avatar_url: string | null;
  artist_profiles: {
    stage_name: string | null;
    verified: boolean;
  } | null;
  follower_count: number;
  track_count: number;
}

export function TrendingArtists() {
  const [artists, setArtists] = useState<TrendingArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingArtists();
  }, []);

  const fetchTrendingArtists = async () => {
    try {
      const { data: artistsData, error } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          avatar_url,
          artist_profiles (
            stage_name,
            verified
          )
        `)
        .not("artist_profiles", "is", null)
        .limit(6);

      if (error) throw error;

      // Fetch follower counts and track counts for each artist
      const artistsWithStats = await Promise.all(
        artistsData.map(async (artist) => {
          const [followersResult, tracksResult] = await Promise.all([
            supabase
              .from("followers")
              .select("id", { count: "exact", head: true })
              .eq("artist_id", artist.id),
            supabase
              .from("tracks")
              .select("id", { count: "exact", head: true })
              .eq("artist_id", artist.id)
              .eq("moderation_status", "approved"),
          ]);

          return {
            ...artist,
            follower_count: followersResult.count || 0,
            track_count: tracksResult.count || 0,
          };
        })
      );

      // Sort by follower count
      const sorted = artistsWithStats.sort((a, b) => b.follower_count - a.follower_count);
      setArtists(sorted);
    } catch (error) {
      console.error("Failed to fetch trending artists:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              <TrendingUp className="inline-block mr-3 h-8 w-8 text-primary" />
              Trending Artists
            </h2>
            <p className="text-muted-foreground text-lg">Discover the hottest talent on the platform</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (artists.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            <TrendingUp className="inline-block mr-3 h-8 w-8 text-primary" />
            Trending Artists
          </h2>
          <p className="text-muted-foreground text-lg">Discover the hottest talent on the platform</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artists.map((artist, index) => (
            <Link key={artist.id} to={`/artist/${artist.id}`}>
              <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-2 border-primary/20 group-hover:border-primary transition-colors">
                        <AvatarImage src={artist.avatar_url || undefined} />
                        <AvatarFallback className="text-lg font-bold">
                          {(artist.artist_profiles?.stage_name || artist.username).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {artist.artist_profiles?.stage_name || artist.username}
                        </h3>
                        {artist.artist_profiles?.verified && (
                          <Badge variant="default" className="h-5 px-1.5 text-xs">✓</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span className="font-medium">{artist.follower_count.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Music className="h-3.5 w-3.5" />
                          <span className="font-medium">{artist.track_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

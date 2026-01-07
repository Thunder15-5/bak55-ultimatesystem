import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Users, Music, ChevronLeft, ChevronRight } from "lucide-react";

interface FeaturedArtist {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  artist_profiles: {
    stage_name: string | null;
    verified: boolean;
    genres: string[];
  } | null;
  follower_count: number;
  track_count: number;
  top_track?: {
    id: string;
    title: string;
    cover_image: string | null;
  };
}

export function FeaturedArtistsCarousel() {
  const [artists, setArtists] = useState<FeaturedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchFeaturedArtists();
  }, []);

  const fetchFeaturedArtists = async () => {
    try {
      // Get all artists (remove verified filter since no artists are verified yet)
      const { data: artistsData, error } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          avatar_url,
          bio,
          artist_profiles!inner (
            stage_name,
            verified,
            genres
          )
        `)
        .limit(10);

      if (error) throw error;

      if (!artistsData || artistsData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch stats for each artist
      const artistsWithStats = await Promise.all(
        artistsData.map(async (artist) => {
          const [followersResult, tracksData] = await Promise.all([
            supabase
              .from("followers")
              .select("id", { count: "exact", head: true })
              .eq("artist_id", artist.id),
            supabase
              .from("tracks")
              .select("id, title, cover_image, plays")
              .eq("artist_id", artist.id)
              .eq("moderation_status", "approved")
              .order("plays", { ascending: false })
              .limit(1),
          ]);

          return {
            ...artist,
            follower_count: followersResult.count || 0,
            track_count: tracksData.data?.length || 0,
            top_track: tracksData.data?.[0],
          };
        })
      );

      // Sort by follower count but don't filter out zero followers
      const sorted = artistsWithStats.sort((a, b) => b.follower_count - a.follower_count);
      setArtists(sorted);
    } catch (error) {
      console.error("Failed to fetch featured artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, artists.length));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + artists.length) % Math.max(1, artists.length));
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary fill-primary" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
                Featured Artists
              </h2>
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary fill-primary" />
            </div>
            <p className="text-muted-foreground text-base sm:text-lg">
              Discover talented artists on BAK55 Talent
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-14">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-48 sm:h-64">
                <CardContent className="p-4 sm:p-6">
                  <div className="h-full bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (artists.length === 0) {
    return (
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary fill-primary" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
                Featured Artists
              </h2>
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary fill-primary" />
            </div>
            <p className="text-muted-foreground text-base sm:text-lg mb-6">
              Be the first to join our community of talented artists
            </p>
            <Link to="/apply">
              <Button size="lg" className="w-full sm:w-auto">
                Apply as an Artist
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // For mobile, show 1 artist; for tablet, show 2; for desktop, show 3
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 768) return 2;
    return 3;
  };

  const visibleCount = Math.min(getVisibleCount(), artists.length);
  const visibleArtists = Array.from({ length: visibleCount }, (_, i) => 
    artists[(currentIndex + i) % artists.length]
  );

  return (
    <section className="py-12 sm:py-16 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary fill-primary" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
              Featured Artists
            </h2>
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary fill-primary" />
          </div>
          <p className="text-muted-foreground text-base sm:text-lg">
            Discover talented artists on BAK55 Talent
          </p>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          {artists.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg -ml-2 sm:ml-0"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg -mr-2 sm:mr-0"
                onClick={nextSlide}
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </>
          )}

          {/* Carousel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 px-8 sm:px-14">
            {visibleArtists.map((artist, idx) => (
              <Link key={`${artist.id}-${idx}`} to={`/artist/${artist.id}`}>
                <Card className="group hover:shadow-2xl hover:border-primary transition-all duration-300 overflow-hidden h-full">
                  {/* Artist Top Track Cover as Background */}
                  {artist.top_track?.cover_image && (
                    <div className="relative h-32 sm:h-48 overflow-hidden">
                      <img
                        src={artist.top_track.cover_image}
                        alt={artist.top_track.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
                    </div>
                  )}
                  
                  <CardContent className="p-4 sm:p-6 relative">
                    {/* Avatar */}
                    <div className="flex justify-center -mt-10 sm:-mt-14 mb-3 sm:mb-4">
                      <Avatar className="h-16 w-16 sm:h-24 sm:w-24 border-4 border-background shadow-xl">
                        <AvatarImage src={artist.avatar_url || undefined} />
                        <AvatarFallback className="text-lg sm:text-2xl font-bold">
                          {(artist.artist_profiles?.stage_name || artist.username).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Artist Info */}
                    <div className="text-center space-y-2 sm:space-y-3">
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <h3 className="font-bold text-base sm:text-xl truncate max-w-[180px]">
                            {artist.artist_profiles?.stage_name || artist.username}
                          </h3>
                          {artist.artist_profiles?.verified && (
                            <Badge variant="default" className="h-5 px-1.5 text-xs">✓</Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">@{artist.username}</p>
                      </div>

                      {artist.bio && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                          {artist.bio}
                        </p>
                      )}

                      {/* Genres */}
                      {artist.artist_profiles?.genres && artist.artist_profiles.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {artist.artist_profiles.genres.slice(0, 2).map((genre) => (
                            <Badge key={genre} variant="secondary" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-center gap-4 text-xs sm:text-sm pt-2 border-t">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-medium">{artist.follower_count.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Music className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-medium">{artist.track_count}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Dots Indicator */}
          {artists.length > 1 && (
            <div className="flex justify-center gap-2 mt-6 sm:mt-8">
              {artists.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 touch-target ${
                    idx === currentIndex ? 'w-6 sm:w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

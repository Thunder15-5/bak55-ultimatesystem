import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Search, Users, Music } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function BrandDiscover() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<any[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  useEffect(() => {
    fetchArtists();
  }, []);

  useEffect(() => {
    filterArtists();
  }, [artists, searchQuery, selectedGenre]);

  const fetchArtists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("artist_profiles")
      .select(`
        *,
        profiles!artist_profiles_user_id_fkey (
          username,
          avatar_url
        ),
        tracks (count),
        followers (count)
      `)
      .order("talent_score", { ascending: false });

    if (!error && data) {
      setArtists(data);
    }
    setLoading(false);
  };

  const filterArtists = () => {
    let filtered = [...artists];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (artist) =>
          artist.stage_name?.toLowerCase().includes(query) ||
          artist.profiles?.username?.toLowerCase().includes(query) ||
          artist.genres?.some((g: string) => g.toLowerCase().includes(query))
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter((artist) =>
        artist.genres?.includes(selectedGenre)
      );
    }

    setFilteredArtists(filtered);
  };

  const genres = ["Afrobeats", "Hip Hop", "Gospel", "Bongo Flava", "Reggae", "R&B", "Pop"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Discover Artists</h1>
          <p className="text-muted-foreground">
            Find talented East African artists for your next campaign
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search artists by name or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedGenre === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGenre(null)}
            >
              All Genres
            </Button>
            {genres.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>

        {/* Artist Cards */}
        {filteredArtists.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              No artists match your criteria. Adjust filters to see more results.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtists.map((artist) => (
              <Card key={artist.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={artist.profiles?.avatar_url || "/placeholder.svg"}
                    alt={artist.stage_name}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />
                  <h3 className="text-xl font-semibold mb-2">
                    {artist.stage_name || artist.profiles?.username}
                  </h3>
                  
                  {artist.genres && artist.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3 justify-center">
                      {artist.genres.slice(0, 3).map((genre: string) => (
                        <span
                          key={genre}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{artist.followers?.[0]?.count || 0} followers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      <span>{artist.tracks?.[0]?.count || 0} tracks</span>
                    </div>
                  </div>

                  {artist.verified && (
                    <span className="text-xs px-3 py-1 bg-green-500/10 text-green-500 rounded-full mb-4">
                      ✓ Verified
                    </span>
                  )}

                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/brand/artist/${artist.user_id}`)}
                    >
                      View Profile
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => navigate(`/brand/competitions/create?artist=${artist.user_id}`)}
                    >
                      Invite
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

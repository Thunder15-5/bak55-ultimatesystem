import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Users, Music, Shield, SlidersHorizontal, Loader2, Handshake, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function BrandDiscover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<any[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minFollowers, setMinFollowers] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("talent");
  const [sendingPartnership, setSendingPartnership] = useState<string | null>(null);

  useEffect(() => {
    fetchArtists();
  }, []);

  useEffect(() => {
    filterArtists();
  }, [artists, searchQuery, selectedGenre, verifiedOnly, minFollowers, sortBy]);

  const fetchArtists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("artist_profiles")
      .select(`
        *,
        profiles!artist_profiles_user_id_fkey (
          username,
          avatar_url,
          location
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
          artist.profiles?.location?.toLowerCase().includes(query) ||
          artist.genres?.some((g: string) => g.toLowerCase().includes(query))
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter((artist) =>
        artist.genres?.includes(selectedGenre)
      );
    }

    if (verifiedOnly) {
      filtered = filtered.filter((artist) => artist.verified);
    }

    if (minFollowers !== "all") {
      const min = parseInt(minFollowers);
      filtered = filtered.filter((artist) => (artist.followers?.[0]?.count || 0) >= min);
    }

    // Sort
    if (sortBy === "followers") {
      filtered.sort((a, b) => (b.followers?.[0]?.count || 0) - (a.followers?.[0]?.count || 0));
    } else if (sortBy === "tracks") {
      filtered.sort((a, b) => (b.tracks?.[0]?.count || 0) - (a.tracks?.[0]?.count || 0));
    } else if (sortBy === "earnings") {
      filtered.sort((a, b) => (b.total_earnings || 0) - (a.total_earnings || 0));
    }

    setFilteredArtists(filtered);
  };

  const sendPartnershipRequest = async (artistId: string) => {
    if (!user) return;
    setSendingPartnership(artistId);
    try {
      // Create a notification for the artist about partnership interest
      const { error } = await supabase.from("notifications").insert({
        user_id: artistId,
        type: "partnership_request",
        title: "🤝 Brand Partnership Interest",
        message: "A brand is interested in partnering with you! Check your messages.",
        link: "/profile",
      });
      if (error) throw error;
      toast.success("Partnership request sent!");
    } catch (error: any) {
      toast.error("Failed to send request");
    } finally {
      setSendingPartnership(null);
    }
  };

  const genres = ["Afrobeats", "Hip Hop", "Gospel", "Bongo Flava", "Reggae", "R&B", "Pop", "Gengetone", "Benga"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
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
              placeholder="Search by name, genre, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Genre Pills */}
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

          {/* Advanced Filters Row */}
          <div className="flex flex-wrap gap-3 items-center p-3 rounded-lg bg-muted/30 border border-border/50">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            
            <Button
              variant={verifiedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className="gap-1"
            >
              <Shield className="h-3 w-3" /> Verified Only
            </Button>

            <Select value={minFollowers} onValueChange={setMinFollowers}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Min followers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any followers</SelectItem>
                <SelectItem value="10">10+ followers</SelectItem>
                <SelectItem value="50">50+ followers</SelectItem>
                <SelectItem value="100">100+ followers</SelectItem>
                <SelectItem value="500">500+ followers</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="talent">Talent Score</SelectItem>
                <SelectItem value="followers">Most Followers</SelectItem>
                <SelectItem value="tracks">Most Tracks</SelectItem>
                <SelectItem value="earnings">Top Earners</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground ml-auto">
              {filteredArtists.length} artists found
            </span>
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
              <Card key={artist.id} className="hover:shadow-lg transition-shadow border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={artist.profiles?.avatar_url || "/placeholder.svg"}
                      alt={artist.stage_name}
                      className="w-24 h-24 rounded-full object-cover mb-4 ring-2 ring-border"
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold">
                        {artist.stage_name || artist.profiles?.username}
                      </h3>
                      {artist.verified && (
                        <Badge variant="default" className="gap-1 text-xs">
                          <Shield className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                    </div>
                    
                    {artist.profiles?.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="h-3 w-3" /> {artist.profiles.location}
                      </p>
                    )}

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

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{artist.followers?.[0]?.count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Music className="w-4 h-4" />
                        <span>{artist.tracks?.[0]?.count || 0} tracks</span>
                      </div>
                    </div>

                    {artist.talent_score > 0 && (
                      <div className="mb-4">
                        <span className="text-xs text-muted-foreground">Talent Score: </span>
                        <span className="text-sm font-semibold text-primary">{artist.talent_score}</span>
                      </div>
                    )}

                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/artist/${artist.user_id}`)}
                      >
                        View Profile
                      </Button>
                      <Button
                        className="flex-1 gap-1"
                        disabled={sendingPartnership === artist.user_id}
                        onClick={() => sendPartnershipRequest(artist.user_id)}
                      >
                        {sendingPartnership === artist.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Handshake className="h-4 w-4" />
                        )}
                        Partner
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

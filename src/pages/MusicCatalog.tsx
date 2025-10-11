import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { Music, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Track {
  id: string;
  title: string;
  artist_id: string;
  audio_url: string;
  cover_image: string | null;
  genre: string | null;
  plays: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function MusicCatalog() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [minPlays, setMinPlays] = useState<number>(0);

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    filterTracks();
  }, [tracks, searchQuery, genreFilter, sortBy, minPlays]);

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from("tracks")
        .select(`
          *,
          profiles:artist_id (username, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTracks(data || []);
      setFilteredTracks(data || []);
    } catch (error: any) {
      toast.error("Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  const filterTracks = () => {
    let filtered = [...tracks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (track) =>
          track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.profiles.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Genre filter
    if (genreFilter !== "all") {
      filtered = filtered.filter((track) => track.genre === genreFilter);
    }

    // Minimum plays filter
    if (minPlays > 0) {
      filtered = filtered.filter((track) => track.plays >= minPlays);
    }

    // Sorting
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "popular":
        filtered.sort((a, b) => b.plays - a.plays);
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      default:
        break;
    }

    setFilteredTracks(filtered);
  };

  const genres = Array.from(new Set(tracks.map((t) => t.genre).filter(Boolean)));

  const handleTrackClick = (trackId: string) => {
    navigate(`/track/${trackId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Music Catalog</h1>
          <p className="text-muted-foreground">
            Discover amazing tracks from talented artists
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by track or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre!}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="minPlays" className="whitespace-nowrap text-sm">Min Plays:</Label>
            <Input
              id="minPlays"
              type="number"
              min="0"
              value={minPlays}
              onChange={(e) => setMinPlays(parseInt(e.target.value) || 0)}
              className="w-full sm:w-32"
              placeholder="0"
            />
          </div>
        </div>

        {filteredTracks.length === 0 ? (
          <Card className="p-12 text-center">
            <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {tracks.length === 0 ? "No tracks yet" : "No tracks found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {tracks.length === 0 
                ? "Be the first to upload a track!" 
                : "Try adjusting your filters"}
            </p>
            {tracks.length === 0 && userRole === "artist" && (
              <Button onClick={() => navigate("/upload")} variant="default">
                Upload Your First Track
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTracks.map((track) => (
              <Card
                key={track.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => handleTrackClick(track.id)}
              >
                <div className="aspect-square relative bg-muted">
                  {track.cover_image ? (
                    <img
                      src={track.cover_image}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate">{track.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.profiles.username}
                  </p>
                  {track.genre && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {track.genre}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {track.plays} plays
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

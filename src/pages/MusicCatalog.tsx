import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Music, Play } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { TrackCardSkeleton } from "@/components/ui/skeleton-components";

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
  const { playTrack } = useMusicPlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [minPlays, setMinPlays] = useState<string>("");

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    filterTracks();
  }, [tracks, searchQuery, selectedGenre, sortBy, minPlays]);

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
    if (selectedGenre !== "all") {
      filtered = filtered.filter((track) => track.genre === selectedGenre);
    }

    // Minimum plays filter
    const minPlaysNum = parseInt(minPlays) || 0;
    if (minPlaysNum > 0) {
      filtered = filtered.filter((track) => track.plays >= minPlaysNum);
    }

    // Sorting
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "popular":
        filtered.sort((a, b) => b.plays - a.plays);
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredTracks(filtered);
  };

  const genres = Array.from(new Set(tracks.map((t) => t.genre).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-2 animate-fade-in">Music Catalog</h1>
            <p className="text-muted-foreground animate-fade-in">Discover amazing tracks from talented artists</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <TrackCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-radial from-primary/10 via-background to-background border-b border-primary/10">
        <div className="container mx-auto px-4 py-12 pt-32">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
              <Music className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Music Discovery</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold leading-tight animate-fade-in">
              Discover Amazing
              <br />
              <span className="text-gradient">African Talent</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in">
              Stream tracks from emerging artists across the continent and support them directly
            </p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Filters */}
        <Card className="mb-8 border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <Label className="text-sm font-medium mb-2 block">Search</Label>
                <Input
                  placeholder="Search tracks or artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Genre</Label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All Genres" />
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
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <Label className="text-sm font-medium">Min plays:</Label>
              <Input
                type="number"
                placeholder="0"
                value={minPlays}
                onChange={(e) => setMinPlays(e.target.value)}
                className="w-32 h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Track Grid */}
        {filteredTracks.length === 0 ? (
          <Card className="p-12 text-center border-primary/10 bg-card/50 backdrop-blur-sm">
            <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-2xl font-heading font-semibold mb-2">
              {tracks.length === 0 ? "No tracks yet" : "No tracks found"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {tracks.length === 0 
                ? "Be the first to upload a track!" 
                : "Try adjusting your filters"}
            </p>
            {tracks.length === 0 && userRole === "artist" && (
              <Button onClick={() => navigate("/upload")} variant="hero" size="lg">
                Upload Your First Track
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredTracks.map((track, index) => (
              <Card 
                key={track.id} 
                className="group overflow-hidden hover:shadow-elegant transition-all duration-300 border-primary/10 hover:border-primary/30 bg-card/50 backdrop-blur-sm"
              >
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 cursor-pointer" onClick={() => navigate(`/track/${track.id}`)}>
                  {track.cover_image ? (
                    <img 
                      src={track.cover_image} 
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      size="icon"
                      variant="default"
                      className="h-16 w-16 rounded-full scale-90 group-hover:scale-100 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(track, filteredTracks.slice(index));
                      }}
                    >
                      <Play className="h-8 w-8 fill-white ml-1" />
                    </Button>
                  </div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="line-clamp-1 text-lg font-heading">{track.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    by {track.profiles?.username || 'Unknown Artist'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {track.genre || 'Uncategorized'}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Play className="h-3 w-3" />
                      {track.plays}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Music, Play } from "lucide-react";
import { toast } from "sonner";

interface Track {
  id: string;
  title: string;
  artist_id: string;
  audio_url: string;
  cover_image: string | null;
  genre: string | null;
  plays: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function MusicCatalog() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

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
    } catch (error: any) {
      toast.error("Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (track: Track) => {
    setCurrentTrack(track);
    
    // Increment play count
    await supabase
      .from("tracks")
      .update({ plays: track.plays + 1 })
      .eq("id", track.id);
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Music Catalog</h1>
          <p className="text-muted-foreground">
            Discover amazing tracks from talented artists
          </p>
        </div>

        {tracks.length === 0 ? (
          <Card className="p-12 text-center">
            <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No tracks yet</h3>
            <p className="text-muted-foreground">
              Be the first to upload a track!
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => (
              <Card
                key={track.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handlePlay(track)}
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
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-16 w-16 text-white" />
                  </div>
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

      {currentTrack && (
        <MusicPlayer
          track={currentTrack}
          onClose={() => setCurrentTrack(null)}
        />
      )}
    </div>
  );
}

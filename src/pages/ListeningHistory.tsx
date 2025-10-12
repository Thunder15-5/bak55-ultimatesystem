import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { History, Play, Loader2, Clock } from "lucide-react";
import { MusicPlayer } from "@/components/MusicPlayer";

interface HistoryEntry {
  id: string;
  listened_at: string;
  tracks: {
    id: string;
    title: string;
    genre: string;
    audio_url: string;
    cover_image: string;
    artist_id: string;
    artist_username?: string;
  };
}

export default function ListeningHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("listening_history")
        .select(`
          *,
          tracks (*)
        `)
        .eq("user_id", user?.id)
        .order("listened_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const historyRows = data || [];
      const artistIds = Array.from(new Set(historyRows.map((h: any) => h.tracks?.artist_id).filter(Boolean)));

      const { data: artists } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", artistIds.length ? artistIds : ["00000000-0000-0000-0000-000000000000"]);

      const artistMap = new Map((artists || []).map((a: any) => [a.id, a.username]));

      const enriched = historyRows.map((h: any) => ({
        ...h,
        tracks: {
          ...h.tracks,
          artist_username: artistMap.get(h.tracks?.artist_id) || "Unknown Artist",
        },
      }));

      setHistory(enriched);
    } catch (error: any) {
      toast.error("Failed to load listening history");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (entry: HistoryEntry) => {
    setCurrentTrack({
      id: entry.tracks.id,
      title: entry.tracks.title,
      audio_url: entry.tracks.audio_url,
      cover_image: entry.tracks.cover_image,
      profiles: {
        username: entry.tracks.artist_username || "Unknown Artist",
      },
    });

    // Record new listening entry
    supabase.from("listening_history").insert({
      user_id: user?.id,
      track_id: entry.tracks.id,
    });
  };

  const groupByDate = (entries: HistoryEntry[]) => {
    const groups: { [key: string]: HistoryEntry[] } = {};
    
    entries.forEach((entry) => {
      const date = new Date(entry.listened_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const groupedHistory = groupByDate(history);

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <History className="h-10 w-10" />
            Listening History
          </h1>
          <p className="text-muted-foreground">
            Your recently played tracks
          </p>
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Clock className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No listening history</h3>
              <p className="text-muted-foreground mb-4">
                Start listening to tracks to build your history
              </p>
              <Button onClick={() => navigate("/catalog")}>
                Browse Catalog
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedHistory).map(([date, entries]) => (
              <div key={date}>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  {date}
                </h2>
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <Card
                      key={entry.id}
                      className="border-2 hover:border-primary transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handlePlayTrack(entry)}
                          >
                            <Play className="h-5 w-5" />
                          </Button>

                          {entry.tracks.cover_image && (
                            <img
                              src={entry.tracks.cover_image}
                              alt={entry.tracks.title}
                              className="h-16 w-16 rounded object-cover cursor-pointer"
                              onClick={() => navigate(`/track/${entry.tracks.id}`)}
                            />
                          )}

                          <div className="flex-1">
                            <h3
                              className="font-semibold text-lg cursor-pointer hover:text-primary"
                              onClick={() => navigate(`/track/${entry.tracks.id}`)}
                            >
                              {entry.tracks.title}
                            </h3>
                            <p
                              className="text-sm text-muted-foreground cursor-pointer hover:text-primary"
                              onClick={() => navigate(`/artist/${entry.tracks.artist_id}`)}
                            >
                              {entry.tracks.artist_username}
                            </p>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {new Date(entry.listened_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
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

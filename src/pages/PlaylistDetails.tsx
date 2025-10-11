import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Play, Trash2, Loader2, ListMusic } from "lucide-react";
import { MusicPlayer } from "@/components/MusicPlayer";

interface Playlist {
  id: string;
  title: string;
  description: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
}

interface PlaylistTrack {
  id: string;
  position: number;
  added_at: string;
  tracks: {
    id: string;
    title: string;
    genre: string;
    audio_url: string;
    cover_image: string;
    artist_id: string;
    profiles: {
      username: string;
      artist_profiles: {
        stage_name: string;
      };
    };
  };
}

export default function PlaylistDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchPlaylistData();
    }
  }, [id]);

  const fetchPlaylistData = async () => {
    try {
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .single();

      if (playlistError) throw playlistError;

      if (!playlistData.is_public && playlistData.user_id !== user?.id) {
        toast.error("You don't have access to this playlist");
        navigate("/playlists");
        return;
      }

      setPlaylist(playlistData);

      const { data: tracksData, error: tracksError } = await supabase
        .from("playlist_tracks")
        .select(`
          *,
          tracks (
            *,
            profiles:artist_id (
              username,
              artist_profiles (stage_name)
            )
          )
        `)
        .eq("playlist_id", id)
        .order("position", { ascending: true });

      if (tracksError) throw tracksError;
      setTracks(tracksData || []);
    } catch (error: any) {
      toast.error("Failed to load playlist");
      console.error(error);
      navigate("/playlists");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTrack = async (playlistTrackId: string) => {
    if (!confirm("Remove this track from the playlist?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("playlist_tracks")
        .delete()
        .eq("id", playlistTrackId);

      if (error) throw error;

      toast.success("Track removed from playlist");
      fetchPlaylistData();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove track");
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm("Are you sure you want to delete this playlist? This cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Playlist deleted");
      navigate("/playlists");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete playlist");
    }
  };

  const handlePlayTrack = (track: PlaylistTrack) => {
    setCurrentTrack({
      id: track.tracks.id,
      title: track.tracks.title,
      audio_url: track.tracks.audio_url,
      cover_image: track.tracks.cover_image,
      profiles: {
        username: track.tracks.profiles.artist_profiles?.stage_name || track.tracks.profiles.username,
      },
    });

    if (user) {
      supabase.from("listening_history").insert({
        user_id: user.id,
        track_id: track.tracks.id,
      });
    }
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

  if (!playlist) {
    return null;
  }

  const isOwner = user?.id === playlist.user_id;

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate("/playlists")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Playlists
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <ListMusic className="h-12 w-12 text-primary" />
                <div>
                  <CardTitle className="text-3xl mb-2">{playlist.title}</CardTitle>
                  {playlist.description && (
                    <p className="text-muted-foreground">{playlist.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {tracks.length} {tracks.length === 1 ? "track" : "tracks"} • 
                    {playlist.is_public ? " Public" : " Private"} • 
                    Created {new Date(playlist.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {isOwner && (
                <Button variant="destructive" onClick={handleDeletePlaylist}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Playlist
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {tracks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ListMusic className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tracks in this playlist</h3>
              <p className="text-muted-foreground">
                Add tracks from the catalog to build your playlist
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tracks.map((playlistTrack) => (
              <Card
                key={playlistTrack.id}
                className="border-2 hover:border-primary transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handlePlayTrack(playlistTrack)}
                    >
                      <Play className="h-5 w-5" />
                    </Button>

                    {playlistTrack.tracks.cover_image && (
                      <img
                        src={playlistTrack.tracks.cover_image}
                        alt={playlistTrack.tracks.title}
                        className="h-16 w-16 rounded object-cover"
                      />
                    )}

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{playlistTrack.tracks.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {playlistTrack.tracks.profiles.artist_profiles?.stage_name || 
                         playlistTrack.tracks.profiles.username}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/track/${playlistTrack.tracks.id}`)}
                      >
                        <ListMusic className="h-4 w-4" />
                      </Button>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTrack(playlistTrack.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
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

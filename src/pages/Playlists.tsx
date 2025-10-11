import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ListMusic, Plus, Loader2, Music, Lock } from "lucide-react";

interface Playlist {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  is_public: boolean;
  created_at: string;
  playlist_tracks: Array<{ id: string }>;
}

export default function Playlists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    title: "",
    description: "",
    is_public: true,
  });

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    }
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select(`
          *,
          playlist_tracks (id)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error: any) {
      toast.error("Failed to load playlists");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPlaylist.title.trim()) {
      toast.error("Playlist title is required");
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await supabase
        .from("playlists")
        .insert({
          user_id: user?.id,
          title: newPlaylist.title.trim(),
          description: newPlaylist.description.trim(),
          is_public: newPlaylist.is_public,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Playlist created!");
      setShowCreateDialog(false);
      setNewPlaylist({ title: "", description: "", is_public: true });
      fetchPlaylists();
      navigate(`/playlist/${data.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create playlist");
    } finally {
      setCreating(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Playlists</h1>
            <p className="text-muted-foreground">
              Create and manage your music collections
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
                <DialogDescription>
                  Create a new playlist to organize your favorite tracks
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePlaylist} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Playlist Title *</Label>
                  <Input
                    id="title"
                    placeholder="My Awesome Playlist"
                    value={newPlaylist.title}
                    onChange={(e) =>
                      setNewPlaylist({ ...newPlaylist, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your playlist..."
                    value={newPlaylist.description}
                    onChange={(e) =>
                      setNewPlaylist({ ...newPlaylist, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_public">Public Playlist</Label>
                  <Switch
                    id="is_public"
                    checked={newPlaylist.is_public}
                    onCheckedChange={(checked) =>
                      setNewPlaylist({ ...newPlaylist, is_public: checked })
                    }
                  />
                </div>

                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Playlist"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {playlists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ListMusic className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first playlist to start organizing your music
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Playlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <Card
                key={playlist.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate(`/playlist/${playlist.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <ListMusic className="h-5 w-5 text-primary" />
                      <CardTitle className="line-clamp-1">{playlist.title}</CardTitle>
                    </div>
                    {!playlist.is_public && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {playlist.description && (
                    <CardDescription className="line-clamp-2">
                      {playlist.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Music className="h-4 w-4" />
                      {playlist.playlist_tracks?.length || 0} tracks
                    </div>
                    <div className="text-xs">
                      {new Date(playlist.created_at).toLocaleDateString()}
                    </div>
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

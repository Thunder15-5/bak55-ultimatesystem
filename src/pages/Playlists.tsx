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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ListMusic, Plus, Loader2, Music, Lock } from "lucide-react";
import { PlaylistCardSkeleton } from "@/components/ui/skeleton-components";

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
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Playlists</h1>
            <p className="text-muted-foreground">Create and manage your music collections</p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <PlaylistCardSkeleton key={i} />
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
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
                  <ListMusic className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Your Collections</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold leading-tight animate-fade-in">
                  My <span className="text-gradient">Playlists</span>
                </h1>
                <p className="text-lg text-muted-foreground animate-fade-in">
                  Create and manage your music collections
                </p>
              </div>

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Playlist
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md mx-4 sm:mx-auto">
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
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {playlists.length === 0 ? (
          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-20">
              <div className="p-6 rounded-full bg-primary/10 mb-6">
                <ListMusic className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-heading font-semibold mb-3">No playlists yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">
                Create your first playlist to start organizing your music
              </p>
              <Button onClick={() => setShowCreateDialog(true)} variant="hero" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Playlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <Card
                key={playlist.id}
                className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] border-primary/10 hover:border-primary/30 bg-card/50 backdrop-blur-sm"
                onClick={() => navigate(`/playlist/${playlist.id}`)}
              >
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <ListMusic className="h-5 w-5 text-primary flex-shrink-0" />
                      </div>
                      <CardTitle className="line-clamp-1 text-lg sm:text-xl font-heading group-hover:text-primary transition-colors">
                        {playlist.title}
                      </CardTitle>
                    </div>
                    {!playlist.is_public && (
                      <div className="p-1.5 rounded-lg bg-muted/50">
                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    )}
                  </div>
                  {playlist.description && (
                    <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                      {playlist.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Music className="h-4 w-4" />
                      <span className="font-medium">{playlist.playlist_tracks?.length || 0} tracks</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
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

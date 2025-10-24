import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Music, Play, Heart, ArrowLeft, ListPlus, Share2, Loader2, Trash2 } from "lucide-react";
import { MusicPlayer } from "@/components/MusicPlayer";
import { CommentSection } from "@/components/CommentSection";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TipDialog } from "@/components/TipDialog";

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

export default function TrackDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTrack();
      fetchLikeData();
    }
    if (user) {
      fetchUserPlaylists();
    }
  }, [id, user]);

  useEffect(() => {
    // Subscribe to realtime like updates
    const channel = supabase
      .channel('track_likes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'track_likes',
          filter: `track_id=eq.${id}`
        },
        () => {
          fetchLikeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchTrack = async () => {
    try {
      const { data, error } = await supabase
        .from("tracks")
        .select(`
          *,
          profiles:artist_id (username, avatar_url)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setTrack(data);
    } catch (error: any) {
      toast.error("Failed to load track");
      navigate("/catalog");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("id, title")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error: any) {
      console.error("Failed to load playlists:", error);
    }
  };

  const fetchLikeData = async () => {
    if (!id) return;

    try {
      // Get like count
      const { count, error: countError } = await supabase
        .from("track_likes")
        .select("*", { count: "exact", head: true })
        .eq("track_id", id);

      if (countError) throw countError;
      setLikeCount(count || 0);

      // Check if current user has liked
      if (user) {
        const { data, error: likeError } = await supabase
          .from("track_likes")
          .select("id")
          .eq("track_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (likeError) throw likeError;
        setIsLiked(!!data);
      }
    } catch (error: any) {
      console.error("Failed to load like data:", error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like tracks");
      navigate("/login");
      return;
    }

    if (userRole === 'fan') {
      toast.error("Upgrade to Artist to like tracks");
      return;
    }

    setLiking(true);

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("track_likes")
          .delete()
          .eq("track_id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
        toast.success("Removed from liked tracks");
      } else {
        // Like
        const { error } = await supabase
          .from("track_likes")
          .insert({
            track_id: id,
            user_id: user.id,
          });

        if (error) throw error;
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success("Added to liked tracks!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update like status");
    } finally {
      setLiking(false);
    }
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylist) {
      toast.error("Please select a playlist");
      return;
    }

    setAddingToPlaylist(true);

    try {
      const { error } = await supabase.from("playlist_tracks").insert({
        playlist_id: selectedPlaylist,
        track_id: id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Track already in playlist");
        } else {
          throw error;
        }
      } else {
        toast.success("Added to playlist!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add to playlist");
    } finally {
      setAddingToPlaylist(false);
    }
  };

  const handlePlay = async () => {
    if (!track) return;
    setPlaying(true);
    
    // Track play start time for 30-second rule
    const playStartTime = Date.now();
    
    // Wait 30 seconds before counting as legitimate play
    setTimeout(async () => {
      const playDuration = Date.now() - playStartTime;
      
      // Only count if played for at least 30 seconds
      if (playDuration >= 30000) {
        // Increment play count for analytics
        await supabase
          .from("tracks")
          .update({ plays: track.plays + 1 })
          .eq("id", track.id);

        // Add to listening history
        if (user) {
          await supabase.from("listening_history").insert({
            user_id: user.id,
            track_id: track.id,
          });
        }

        setTrack({ ...track, plays: track.plays + 1 });
      }
    }, 30000); // 30 seconds
  };

  const handleDeleteTrack = async () => {
    if (!confirm("Are you sure you want to delete this track? This action cannot be undone.")) {
      return;
    }

    try {
      // Delete track (CASCADE will handle related data)
      const { error } = await supabase
        .from("tracks")
        .delete()
        .eq("id", track.id);

      if (error) throw error;

      toast.success("Track deleted successfully");
      navigate("/catalog");
    } catch (error: any) {
      toast.error("Failed to delete track");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!track) return null;

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navigation />
      
      {/* Hero Section with Cover Art */}
      <div className="relative min-h-[60vh] flex items-end">
        {/* Blurred Background */}
        <div className="absolute inset-0 overflow-hidden">
          {track.cover_image ? (
            <>
              <img
                src={track.cover_image}
                alt={track.title}
                className="w-full h-full object-cover blur-3xl scale-110 opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-radial from-primary/10 via-background to-background" />
          )}
        </div>
        
        {/* Content */}
        <div className="relative container mx-auto px-4 py-8 pt-24">
          <Button variant="ghost" onClick={() => navigate("/catalog")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Catalog
          </Button>

          <div className="grid md:grid-cols-2 gap-8 items-end">
            {/* Cover Image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted shadow-2xl border border-primary/20">
              {track.cover_image ? (
                <img
                  src={track.cover_image}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Music className="h-32 w-32 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="space-y-6 pb-4">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-heading font-bold leading-tight animate-fade-in">
                  {track.title}
                </h1>
                <p className="text-xl text-muted-foreground animate-fade-in">
                  by <Link to={`/artist/${track.artist_id}`} className="text-primary hover:text-primary-glow transition-colors font-medium">
                    {track.profiles.username}
                  </Link>
                </p>
                {track.genre && (
                  <div className="inline-block">
                    <span className="px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium">
                      {track.genre}
                    </span>
                  </div>
                )}
                <div className="flex gap-6 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    <span className="font-medium">{track.plays} plays</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="font-medium">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
                  </div>
                </div>
               </div>

              <div className="flex gap-3 flex-wrap">
                <Button onClick={handlePlay} size="lg" variant="hero" className="flex-1 h-14 text-lg">
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Play Track
                </Button>

            {user && (
              <Button 
                onClick={handleLike} 
                disabled={liking || userRole === 'fan'}
                size="lg"
                variant={isLiked ? "default" : "outline"}
                title={userRole === 'fan' ? "Upgrade to Artist to like tracks" : ""}
              >
                {liking ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Heart className={`mr-2 h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                )}
                {isLiked ? 'Liked' : 'Like'}
              </Button>
            )}

            {user && user.id === track.artist_id && (
              <Button 
                size="lg" 
                variant="destructive"
                onClick={handleDeleteTrack}
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Delete Track
              </Button>
            )}

            {user && user.id !== track.artist_id && (
              <>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setTipDialogOpen(true)}
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Tip Artist
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline">
                      <ListPlus className="mr-2 h-5 w-5" />
                      Add to Playlist
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add to Playlist</DialogTitle>
                      <DialogDescription>
                        Choose a playlist to add this track to
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {playlists.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground mb-4">
                            You don't have any playlists yet
                          </p>
                          <Button onClick={() => navigate("/playlists")}>
                            Create Playlist
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a playlist" />
                            </SelectTrigger>
                            <SelectContent>
                              {playlists.map((playlist) => (
                                <SelectItem key={playlist.id} value={playlist.id}>
                                  {playlist.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handleAddToPlaylist} 
                            className="w-full" 
                            disabled={addingToPlaylist || !selectedPlaylist}
                          >
                            {addingToPlaylist ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add to Playlist"
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
              </Dialog>
            </>
          )}

          {/* Social Sharing */}
          <Button 
            size="lg" 
            variant="outline"
            onClick={async () => {
                const url = window.location.href;
                const text = `Check out "${track.title}" by ${track.profiles.username} on BAK55!`;
                
                // Track share analytics
                if (user) {
                  await supabase.from('share_analytics').insert({
                    track_id: id,
                    user_id: user.id,
                    platform: navigator.share ? 'native_share' : 'clipboard',
                  });
                }
                
                if (navigator.share) {
                  try {
                    await navigator.share({ title: track.title, text, url });
                    toast.success("Shared successfully!");
                  } catch (err) {
                    // User cancelled share
                  }
                } else {
                  navigator.clipboard.writeText(url);
                  toast.success("Link copied to clipboard!");
                }
              }}
            >
            <Share2 className="mr-2 h-5 w-5" />
            Share
          </Button>
        </div>
      </div>
    </div>
  </div>

        {/* Comments Section */}
        <div className="mt-8">
          <CommentSection trackId={id!} />
        </div>
      </div>

      {playing && track && (
        <MusicPlayer
          track={track}
          onClose={() => setPlaying(false)}
        />
      )}

      {track && (
        <TipDialog
          open={tipDialogOpen}
          onOpenChange={setTipDialogOpen}
          artistId={track.artist_id}
          artistName={track.profiles.username}
          trackId={track.id}
        />
      )}
    </div>
  );
}

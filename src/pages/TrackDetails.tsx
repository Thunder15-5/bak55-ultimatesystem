import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { TrackSEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFanActivity } from "@/hooks/useFanActivity";
import { toast } from "sonner";
import { Music, Play, Pause, ArrowLeft, ListPlus, Share2, Loader2, Trash2, UserPlus, Heart, Download, ShoppingCart, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TipDialog } from "@/components/TipDialog";
import { Badge } from "@/components/ui/badge";
import { useExclusiveAccess } from "@/hooks/useExclusiveAccess";
import { ExclusiveContentOverlay } from "@/components/ExclusiveContentOverlay";
import { CommentSection } from "@/components/CommentSection";
import { isFeatureEnabled } from "@/lib/featureFlags";

  interface Track {
  id: string;
  title: string;
  artist_id: string;
  audio_url: string;
  cover_image: string | null;
  genre: string | null;
  plays: number;
  is_paid_download?: boolean;
  price_kes?: number | null;
  price_in_bak?: number | null;
  is_exclusive?: boolean;
  required_tier_level?: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function TrackDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer();
  const { trackActivity } = useFanActivity();
  const [track, setTrack] = useState<Track | null>(null);
  const [bakRate, setBakRate] = useState(1); // BAK to KES rate
  const [loading, setLoading] = useState(true);
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isInCompetition, setIsInCompetition] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  // Exclusive content access check
  const { hasAccess: hasExclusiveAccess, loading: exclusiveLoading } = useExclusiveAccess(
    track?.artist_id,
    track?.is_exclusive || false,
    track?.required_tier_level || 0,
    user?.id
  );

  useEffect(() => {
    if (id) {
      fetchTrack();
    }
    if (user) {
      fetchUserPlaylists();
    }
    fetchBakRate();
  }, [id, user]);

  const fetchBakRate = async () => {
    const { data } = await supabase
      .from('sales_config')
      .select('config_value')
      .eq('config_key', 'bak_to_kes_rate')
      .maybeSingle();
    if (data) setBakRate(Number(data.config_value) || 1);
  };

  // Separate effect for follow status that depends on track
  useEffect(() => {
    if (user && track?.artist_id) {
      fetchFollowStatus();
    }
    if (user && track?.id) {
      checkPurchaseStatus();
      checkCompetitionStatus();
      if (isFeatureEnabled('LIKES_ENABLED')) {
        fetchLikeStatus();
      }
    }
    if (track?.id && isFeatureEnabled('LIKES_ENABLED')) {
      fetchLikeCount();
    }
  }, [user, track?.artist_id, track?.id]);

  const checkPurchaseStatus = async () => {
    if (!user || !track) return;
    const { data } = await supabase
      .from('song_purchases')
      .select('id')
      .eq('track_id', track.id)
      .eq('buyer_id', user.id)
      .eq('status', 'completed')
      .maybeSingle();
    setHasPurchased(!!data);
  };

  const checkCompetitionStatus = async () => {
    if (!track) return;
    const { data: sub } = await supabase
      .from('submissions')
      .select('id, competition_id')
      .eq('track_id', track.id)
      .eq('status', 'approved')
      .maybeSingle();
    if (sub) {
      const { data: comp } = await supabase
        .from('competitions')
        .select('id')
        .eq('id', sub.competition_id)
        .eq('status', 'active')
        .maybeSingle();
      setIsInCompetition(!!comp);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please log in to purchase");
      navigate("/login");
      return;
    }
    if (!track) return;

    setPurchasing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('purchase-track', {
        body: { track_id: track.id },
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      });

      if (error) throw error;
      if (data.error) {
        if (data.error === 'Already purchased') {
          setHasPurchased(true);
          toast.info("You already own this track!");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setHasPurchased(true);
      setHasPurchased(true);
      toast.success(data.message || "Purchase successful! 🎉", {
        description: `${data.amount_bak} BAK Coins deducted`,
      });
    } catch (error: any) {
      toast.error(error.message || "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  const handleDownload = async () => {
    if (!track) return;
    setDownloading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('download-track', {
        body: { track_id: track.id },
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = `${track.title}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started!");
    } catch (error: any) {
      toast.error(error.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };


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
      
      // Only show rejected tracks to non-owners and non-admins
      // null or 'pending' moderation_status should still be viewable publicly
      if (data.moderation_status === 'rejected' && 
          data.artist_id !== user?.id && 
          userRole !== 'admin') {
        toast.error("This track is not available");
        setTrack(null);
        return;
      }
      
      setTrack(data);
    } catch (error: any) {
      console.error("Failed to load track:", error);
      toast.error("Track not found or unavailable");
      setTrack(null);
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


  const fetchFollowStatus = async () => {
    if (!user || !track?.artist_id) return;

    try {
      const { data, error } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("artist_id", track.artist_id)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error: any) {
      console.error("Failed to load follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please log in to follow artists");
      navigate("/login");
      return;
    }

    if (!track?.artist_id) return;

    setFollowLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", user.id)
          .eq("artist_id", track.artist_id);

        if (error) throw error;
        setIsFollowing(false);
        toast.success("Unfollowed artist");
      } else {
        // Follow
        const { error } = await supabase
          .from("followers")
          .insert({
            follower_id: user.id,
            artist_id: track.artist_id,
          });

        if (error) throw error;
        setIsFollowing(true);
        toast.success("Following artist!");
        
        // Track fan activity for rewards
        await trackActivity('artist_follow', { artist_id: track.artist_id });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update follow status");
    } finally {
      setFollowLoading(false);
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

  const isCurrentTrack = currentTrack?.id === track?.id;
  const isThisPlaying = isCurrentTrack && isPlaying;

  const handlePlayPause = async () => {
    if (!track) return;
    
    if (isCurrentTrack) {
      // Toggle play/pause for current track
      togglePlay();
    } else {
      // Start playing this track
      playTrack({
        id: track.id,
        title: track.title,
        artist_id: track.artist_id,
        audio_url: track.audio_url,
        cover_image: track.cover_image,
        genre: track.genre,
        profiles: {
          username: track.profiles.username,
          avatar_url: track.profiles.avatar_url,
        },
      });
      
      // Track fan activity for rewards (play count is handled by PersistentMusicPlayer)
      if (user) {
        await trackActivity('track_play', { track_id: track.id });
      }
    }
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

  if (!track) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Track Not Found</h1>
          <p className="text-muted-foreground mb-6">This track may have been removed or is unavailable.</p>
          <Button onClick={() => navigate("/catalog")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Music
          </Button>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/track/${id}`;
  const shareTitle = `${track.title} by ${track.profiles.username}`;
  const shareDescription = `🎵 Stream ${track.title} now on BAK55 Talent • ${track.plays} plays • ${track.genre || 'Music'}`;

  return (
    <>
      <TrackSEO 
        track={{
          id: track.id,
          title: track.title,
          artistName: track.profiles.username,
          artistId: track.artist_id,
          genre: track.genre || undefined,
          coverImage: track.cover_image || undefined,
          plays: track.plays,
        }} 
      />
      
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
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-2xl border border-primary/20">
              {track.is_exclusive && !hasExclusiveAccess && (
                <ExclusiveContentOverlay
                  artistId={track.artist_id}
                  requiredTierLevel={track.required_tier_level || 1}
                  artistName={track.profiles.username}
                />
              )}
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
                </div>
               </div>

              <div className="flex gap-3 flex-wrap">
                {/* Exclusive badge */}
                {track.is_exclusive && (
                  <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
                    <Lock className="w-3 h-3 mr-1" />
                    Fan Club Exclusive
                  </Badge>
                )}

                {track.is_exclusive && !hasExclusiveAccess ? (
                  <Button
                    size="lg"
                    variant="hero"
                    className="flex-1 min-w-[140px] h-14 text-lg"
                    onClick={() => navigate(`/artist/${track.artist_id}`)}
                  >
                    <Lock className="mr-2 h-5 w-5" />
                    Join Fan Club to Play
                  </Button>
                ) : (
                <Button onClick={handlePlayPause} size="lg" variant="hero" className="flex-1 min-w-[140px] h-14 text-lg">
                  {isThisPlaying ? (
                    <>
                      <Pause className="mr-2 h-5 w-5 fill-current" />
                      Pause Track
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5 fill-current" />
                      Play Track
                    </>
                  )}
                </Button>
                )}

                {/* Purchase / Download Button */}
                {track.is_paid_download && (track.price_in_bak || track.price_kes) && !isInCompetition && user?.id !== track.artist_id && (
                  <>
                    {hasPurchased ? (
                      <Button onClick={handleDownload} disabled={downloading} size="lg" variant="default" className="min-w-[140px]">
                        {downloading ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-5 w-5" />
                        )}
                        Download
                        <Badge variant="outline" className="ml-2 text-xs">Purchased</Badge>
                      </Button>
                    ) : (
                      <Button onClick={handlePurchase} disabled={purchasing} size="lg" variant="hero" className="min-w-[160px]">
                        {purchasing ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <ShoppingCart className="mr-2 h-5 w-5" />
                        )}
                        Buy for {track.price_in_bak ?? (track.price_kes ? track.price_kes / bakRate : 0)} BAK
                      </Button>
                    )}
                  </>
                )}

                {/* Free download for track owner */}
                {user?.id === track.artist_id && (
                  <Button onClick={handleDownload} disabled={downloading} size="lg" variant="outline">
                    {downloading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                    Download
                  </Button>
                )}

            {user ? (
              <>

                {user.id !== track.artist_id && (
                  <Button 
                    onClick={handleFollow}
                    disabled={followLoading}
                    size="lg"
                    variant={isFollowing ? "default" : "outline"}
                  >
                    {followLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-5 w-5" />
                    )}
                    {isFollowing ? 'Following' : 'Follow Artist'}
                  </Button>
                )}

                {user.id === track.artist_id && (
                  <Button 
                    size="lg" 
                    variant="destructive"
                    onClick={handleDeleteTrack}
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    Delete Track
                  </Button>
                )}

                {user.id !== track.artist_id && (
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
              </>
            ) : (
              <Button onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/track/${id}`)}`)} size="lg" variant="outline" className="min-w-[140px]">
                Sign Up to Interact
              </Button>
            )}

          {/* Social Sharing - Always visible */}
          <Button 
            size="lg" 
            variant="outline"
            onClick={async () => {
                const shareData = {
                  title: shareTitle,
                  text: shareDescription,
                  url: shareUrl,
                };
                
                // Track share activity
                if (user) {
                  try {
                    await supabase.from('fan_activities').insert({
                      user_id: user.id,
                      activity_type: 'track_share',
                      points_earned: 5,
                      metadata: { track_id: id, platform: navigator.share ? 'native_share' : 'clipboard' },
                    });
                  } catch (error) {
                    console.error('Failed to log share activity:', error);
                  }
                }
                
                try {
                  if (navigator.share && navigator.canShare?.(shareData)) {
                    await navigator.share(shareData);
                    toast.success("Shared successfully! 🎉");
                  } else {
                    // Fallback to clipboard
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied to clipboard! 📋");
                  }
                } catch (error: any) {
                  // User cancelled or error occurred
                  if (error.name !== 'AbortError') {
                    // Try clipboard as final fallback
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copied to clipboard! 📋");
                    } catch (clipboardError) {
                      toast.error("Failed to share. Please copy the URL manually.");
                      console.error('Share failed:', error, clipboardError);
                    }
                  }
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
</div>

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
    </>
  );
}

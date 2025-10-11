import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Music, Play, Heart, DollarSign, Loader2, ArrowLeft, ListPlus } from "lucide-react";
import { MusicPlayer } from "@/components/MusicPlayer";
import { CommentSection } from "@/components/CommentSection";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const { user } = useAuth();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [tipping, setTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTrack();
    }
    if (user) {
      fetchUserPlaylists();
    }
  }, [id, user]);

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

    // Increment play count
    await supabase
      .from("tracks")
      .update({ plays: track.plays + 1 })
      .eq("id", track.id);

    // Award streaming royalty to artist (0.01 BAK per play)
    const royaltyAmount = 0.01;

    // Get artist's wallet
    const { data: walletData } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", track.artist_id)
      .single();

    if (walletData) {
      // Update wallet balance
      await supabase
        .from("wallets")
        .update({ balance: walletData.balance + royaltyAmount })
        .eq("id", walletData.id);

      // Create transaction record
      await supabase
        .from("transactions")
        .insert({
          wallet_id: walletData.id,
          amount: royaltyAmount,
          type: "earning",
          description: `Streaming royalty for "${track.title}"`,
          reference_id: track.id,
        });
    }

    setTrack({ ...track, plays: track.plays + 1 });
  };

  const handleTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !track) return;

    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setTipping(true);

    try {
      // Get fan's wallet
      const { data: fanWallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", user.id)
        .single();

      if (!fanWallet || fanWallet.balance < amount) {
        toast.error("Insufficient balance");
        setTipping(false);
        return;
      }

      // Get artist's wallet
      const { data: artistWallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", track.artist_id)
        .single();

      if (!artistWallet) {
        toast.error("Artist wallet not found");
        setTipping(false);
        return;
      }

      // Deduct from fan's wallet
      await supabase
        .from("wallets")
        .update({ balance: fanWallet.balance - amount })
        .eq("id", fanWallet.id);

      // Add to artist's wallet
      await supabase
        .from("wallets")
        .update({ balance: artistWallet.balance + amount })
        .eq("id", artistWallet.id);

      // Create fan's transaction
      await supabase
        .from("transactions")
        .insert({
          wallet_id: fanWallet.id,
          amount: -amount,
          type: "spending",
          description: `Tip to ${track.profiles.username} for "${track.title}"`,
          reference_id: track.id,
        });

      // Create artist's transaction
      await supabase
        .from("transactions")
        .insert({
          wallet_id: artistWallet.id,
          amount: amount,
          type: "tip",
          description: `Tip from fan for "${track.title}"`,
          reference_id: track.id,
        });

      toast.success(`Tipped ${amount} BAK to ${track.profiles.username}!`);
      setTipAmount("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send tip");
    } finally {
      setTipping(false);
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
      <div className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate("/catalog")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalog
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Cover Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            {track.cover_image ? (
              <img
                src={track.cover_image}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-32 w-32 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{track.title}</h1>
              <p className="text-xl text-muted-foreground">
                by {track.profiles.username}
              </p>
              {track.genre && (
                <p className="text-sm text-muted-foreground mt-2">
                  Genre: {track.genre}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {track.plays} plays
              </p>
            </div>

            <div className="flex gap-4">
              <Button onClick={handlePlay} size="lg" variant="hero" className="flex-1">
                <Play className="mr-2 h-5 w-5" />
                Play Track
              </Button>

              {user && user.id !== track.artist_id && (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" variant="outline">
                        <Heart className="mr-2 h-5 w-5" />
                        Tip Artist
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Tip {track.profiles.username}</DialogTitle>
                        <DialogDescription>
                          Show your support by sending BAKCoins
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleTip} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="tipAmount">Amount (BAK)</Label>
                          <Input
                            id="tipAmount"
                            type="number"
                            step="0.01"
                            value={tipAmount}
                            onChange={(e) => setTipAmount(e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={tipping}>
                          {tipping ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Send Tip
                            </>
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

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
    </div>
  );
}

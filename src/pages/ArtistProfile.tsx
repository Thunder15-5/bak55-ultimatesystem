import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { toast } from "sonner";
import { 
  UserPlus, UserMinus, Music, Users, TrendingUp,
  MapPin, Calendar, ExternalLink, Loader2, Play, Plus, Lock, Trophy
} from "lucide-react";
import { ArtistJourneyTimeline } from "@/components/competition/ArtistJourneyTimeline";

interface ArtistData {
  id: string;
  username: string;
  bio: string;
  location: string;
  avatar_url: string;
  created_at: string;
  artist_profiles: {
    stage_name: string;
    genres: string[];
    social_links: any;
    verified: boolean;
    talent_score: number;
    total_earnings: number;
  };
}

interface Track {
  id: string;
  title: string;
  artist_id: string;
  genre: string;
  audio_url: string;
  cover_image: string;
  plays: number;
  created_at: string;
}

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { playTrack, addToQueue } = useMusicPlayer();
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [following, setFollowingLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArtistData();
      fetchTracks();
      fetchFollowerData();
    }
  }, [id]);

  const fetchArtistData = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          bio,
          location,
          avatar_url,
          created_at,
          artist_profiles (
            stage_name,
            genres,
            social_links,
            verified,
            talent_score,
            total_earnings
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setArtist(data);
    } catch (error: any) {
      toast.error("Failed to load artist profile");
      console.error(error);
      navigate("/catalog");
    } finally {
      setLoading(false);
    }
  };

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("artist_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTracks(data || []);
    } catch (error: any) {
      console.error("Failed to load tracks:", error);
    }
  };

  const fetchFollowerData = async () => {
    try {
      // Get follower count
      const { count, error: countError } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", id);

      if (countError) throw countError;
      setFollowerCount(count || 0);

      // Check if current user is following
      if (user) {
        const { data, error: followError } = await supabase
          .from("followers")
          .select("id")
          .eq("follower_id", user.id)
          .eq("artist_id", id)
          .maybeSingle();

        if (followError) throw followError;
        setIsFollowing(!!data);
      }
    } catch (error: any) {
      console.error("Failed to load follower data:", error);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please log in to follow artists");
      navigate("/login");
      return;
    }

    if (user.id === id) {
      toast.error("You cannot follow yourself");
      return;
    }

    setFollowingLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", user.id)
          .eq("artist_id", id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
        toast.success("Unfollowed artist");
      } else {
        // Follow
        const { error } = await supabase
          .from("followers")
          .insert({
            follower_id: user.id,
            artist_id: id,
          });

        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success("Following artist!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update follow status");
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleTrackPlay = (track: Track, index: number) => {
    const trackWithProfile = {
      id: track.id,
      title: track.title,
      artist_id: track.artist_id,
      audio_url: track.audio_url,
      cover_image: track.cover_image,
      genre: track.genre,
      profiles: {
        username: artist?.artist_profiles?.stage_name || artist?.username || '',
        avatar_url: artist?.avatar_url,
      },
    };
    playTrack(trackWithProfile, tracks.slice(index).map(t => ({
      id: t.id,
      title: t.title,
      artist_id: t.artist_id,
      audio_url: t.audio_url,
      cover_image: t.cover_image,
      genre: t.genre,
      profiles: {
        username: artist?.artist_profiles?.stage_name || artist?.username || '',
        avatar_url: artist?.avatar_url,
      },
    })));
  };

  const handleAddToQueue = (track: Track) => {
    const trackWithProfile = {
      id: track.id,
      title: track.title,
      artist_id: track.artist_id,
      audio_url: track.audio_url,
      cover_image: track.cover_image,
      genre: track.genre,
      profiles: {
        username: artist?.artist_profiles?.stage_name || artist?.username || '',
        avatar_url: artist?.avatar_url,
      },
    };
    addToQueue(trackWithProfile);
    toast.success("Added to queue");
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

  if (!artist) {
    return null;
  }

  const socialLinks = artist.artist_profiles?.social_links || {};

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Artist Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <Avatar className="h-32 w-32">
                <AvatarImage src={artist.avatar_url} />
                <AvatarFallback className="text-3xl">
                  {artist.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold">
                      {artist.artist_profiles?.stage_name || artist.username}
                    </h1>
                    {artist.artist_profiles?.verified && (
                      <Badge variant="default">Verified</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{artist.username}</p>
                </div>

                {artist.bio && (
                  <p className="text-lg">{artist.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {artist.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {artist.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(artist.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {followerCount} followers
                  </div>
                  <div className="flex items-center gap-1">
                    <Music className="h-4 w-4" />
                    {tracks.length} tracks
                  </div>
                </div>

                {artist.artist_profiles?.genres && artist.artist_profiles.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {artist.artist_profiles.genres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleFollow}
                    disabled={following || user?.id === id}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {following ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>

                  {socialLinks.twitter && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {artist.artist_profiles && (
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {artist.artist_profiles.talent_score}
                      </div>
                      <div className="text-xs text-muted-foreground">Talent Score</div>
                    </div>
                    {user?.id === id && (
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {artist.artist_profiles.total_earnings.toFixed(0)} BAK
                        </div>
                        <div className="text-xs text-muted-foreground">Total Earnings</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Competition Journey */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Competition Journey
            </CardTitle>
            <CardDescription>Track record in BAK55 competitions</CardDescription>
          </CardHeader>
          <CardContent>
            <ArtistJourneyTimeline artistId={id!} />
          </CardContent>
        </Card>

        {/* Tracks Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tracks</CardTitle>
            <CardDescription>
              {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tracks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No tracks uploaded yet
              </p>
            ) : (
              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleTrackPlay(track, index)}
                      className="flex-shrink-0"
                    >
                      <Play className="h-5 w-5" />
                    </Button>

                    <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 cursor-pointer" onClick={() => navigate(`/track/${track.id}`)}>
                      {track.cover_image ? (
                        <img
                          src={track.cover_image}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/track/${track.id}`)}>
                      <h3 className="font-semibold truncate">{track.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {track.genre && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            {track.genre}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {track.plays || 0}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground flex-shrink-0 hidden md:block">
                      {new Date(track.created_at).toLocaleDateString()}
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleAddToQueue(track)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

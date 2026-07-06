import { useEffect, useState, useMemo, useRef } from "react";
import { toPng } from "html-to-image";
import { TipDialog } from "@/components/TipDialog";
import { SupporterCount } from "@/components/monetization/SupporterCount";
import { ShareCard } from "@/components/competition/ShareCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getArtistShareUrl } from "@/lib/shareUrl";
import { useParams, useNavigate } from "react-router-dom";
import { ArtistSEO } from "@/components/SEO";
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
  MapPin, Calendar, ExternalLink, Loader2, Play, Plus, Trophy, Share2,
  CheckCircle2, Vote, Heart, Sparkles, Flame, ShieldCheck, Copy, MessageCircle,
  Twitter, Instagram, Youtube, Globe, ChevronRight, Download, Gift, Image as ImageIcon,
} from "lucide-react";
import { ArtistJourneyTimeline } from "@/components/competition/ArtistJourneyTimeline";
import { ArtistBadges } from "@/components/ArtistBadges";
import { ArtistLevelCard } from "@/components/ArtistLevelCard";
import { FanClubSection } from "@/components/FanClubSection";
import { TrustSignals } from "@/components/competition/TrustSignals";
import { VerifiedTrustStack } from "@/components/trust/VerifiedTrustStack";
import { RuleCard } from "@/components/trust/RuleCard";

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
    banner_url: string | null;
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

interface ActiveSubmission {
  id: string;
  competition_id: string;
  votes_count: number;
  competition?: { title: string; status: string; voting_end?: string | null };
}

interface RelatedArtist {
  id: string;
  username: string;
  avatar_url: string;
  stage_name?: string;
  genres?: string[];
}

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playTrack, addToQueue } = useMusicPlayer();
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [following, setFollowingLoading] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<ActiveSubmission | null>(null);
  const [relatedArtists, setRelatedArtists] = useState<RelatedArtist[]>([]);
  const [tipOpen, setTipOpen] = useState(false);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const handleDownloadShareCard = async () => {
    if (!shareCardRef.current) return;
    setGeneratingCard(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `${(artist?.username || "artist")}-bak55.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Share card downloaded!");
    } catch (e: any) {
      toast.error("Failed to generate card");
    } finally {
      setGeneratingCard(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchArtistData();
      fetchTracks();
      fetchFollowerData();
      fetchActiveSubmission();
    }
  }, [id]);

  useEffect(() => {
    if (artist?.artist_profiles?.genres?.length) {
      fetchRelatedArtists(artist.artist_profiles.genres);
    }
  }, [artist?.id]);

  const fetchArtistData = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, username, bio, location, avatar_url, created_at,
          artist_profiles (stage_name, genres, social_links, verified, talent_score, total_earnings, banner_url)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      setArtist(data);
    } catch (error: any) {
      toast.error("Failed to load artist profile");
      navigate("/catalog");
    } finally {
      setLoading(false);
    }
  };

  const fetchTracks = async () => {
    const { data } = await supabase
      .from("tracks")
      .select("*")
      .eq("artist_id", id)
      .order("created_at", { ascending: false });
    setTracks(data || []);
  };

  const fetchFollowerData = async () => {
    const { count } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", id);
    setFollowerCount(count || 0);

    if (user) {
      const { data } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("artist_id", id)
        .maybeSingle();
      setIsFollowing(!!data);
    }
  };

  const fetchActiveSubmission = async () => {
    try {
      const { data } = await supabase
        .from("competition_submissions" as any)
        .select("id, competition_id, votes_count, competitions(title, status, voting_end)")
        .eq("artist_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && (data as any).competitions?.status !== "completed") {
        setActiveSubmission({
          id: (data as any).id,
          competition_id: (data as any).competition_id,
          votes_count: (data as any).votes_count || 0,
          competition: (data as any).competitions,
        });
      }
    } catch {
      // table may not exist in some envs — fail silently
    }
  };

  const fetchRelatedArtists = async (genres: string[]) => {
    try {
      const { data } = await supabase
        .from("artist_profiles" as any)
        .select("id, stage_name, genres, profiles(username, avatar_url)")
        .neq("id", id)
        .overlaps("genres", genres)
        .limit(8);
      const mapped: RelatedArtist[] = (data || []).map((a: any) => ({
        id: a.id,
        username: a.profiles?.username || "",
        avatar_url: a.profiles?.avatar_url || "",
        stage_name: a.stage_name,
        genres: a.genres,
      }));
      setRelatedArtists(mapped);
    } catch {
      setRelatedArtists([]);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please log in to follow artists");
      navigate("/login");
      return;
    }
    if (user.id === id) return;
    setFollowingLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("followers").delete().eq("follower_id", user.id).eq("artist_id", id);
        setIsFollowing(false);
        setFollowerCount((p) => p - 1);
      } else {
        await supabase.from("followers").insert({ follower_id: user.id, artist_id: id });
        setIsFollowing(true);
        setFollowerCount((p) => p + 1);
        toast.success("Following!");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setFollowingLoading(false);
    }
  };

  const trackToPlayable = (t: Track) => ({
    id: t.id, title: t.title, artist_id: t.artist_id, audio_url: t.audio_url,
    cover_image: t.cover_image, genre: t.genre,
    profiles: {
      username: artist?.artist_profiles?.stage_name || artist?.username || "",
      avatar_url: artist?.avatar_url,
    },
  });

  const handleTrackPlay = (track: Track, index: number) => {
    playTrack(trackToPlayable(track), tracks.slice(index).map(trackToPlayable));
  };

  const handleAddToQueue = (track: Track) => {
    addToQueue(trackToPlayable(track));
    toast.success("Added to queue");
  };

  const displayName = artist?.artist_profiles?.stage_name || artist?.username || "";
  const shareUrl = id ? getArtistShareUrl(id) : "";
  const shareText = `Check out ${displayName} on BAK55 Talent! 🎤🔥`;

  const handleShare = (channel?: "whatsapp" | "twitter" | "copy" | "native") => {
    if (!channel || channel === "native") {
      if (navigator.share) {
        navigator.share({ title: `${displayName} - BAK55 Talent`, text: shareText, url: shareUrl });
      } else {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast.success("Link copied!");
      }
      return;
    }
    if (channel === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, "_blank");
    } else if (channel === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (channel === "copy") {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    }
  };

  const featuredTrack = useMemo(
    () => [...tracks].sort((a, b) => (b.plays || 0) - (a.plays || 0))[0],
    [tracks]
  );

  const totalPlays = tracks.reduce((s, t) => s + (t.plays || 0), 0);

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

  if (!artist) return null;

  const socialLinks = artist.artist_profiles?.social_links || {};
  const socials = [
    { key: "twitter", icon: Twitter, label: "Twitter" },
    { key: "instagram", icon: Instagram, label: "Instagram" },
    { key: "tiktok", icon: Music, label: "TikTok" },
    { key: "youtube", icon: Youtube, label: "YouTube" },
    { key: "spotify", icon: Music, label: "Spotify" },
    { key: "website", icon: Globe, label: "Website" },
  ].filter((s) => socialLinks[s.key]);

  const votingDaysLeft = activeSubmission?.competition?.voting_end
    ? Math.max(0, Math.ceil((new Date(activeSubmission.competition.voting_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <>
      <ArtistSEO
        artist={{
          id: id!,
          stageName: displayName,
          username: artist.username,
          bio: artist.bio || undefined,
          avatarUrl: artist.avatar_url || undefined,
          genres: artist.artist_profiles?.genres || undefined,
          followerCount,
          trackCount: tracks.length,
          location: artist.location || undefined,
          verified: artist.artist_profiles?.verified || false,
        }}
      />

      <div className="min-h-screen bg-background pb-32">
        <Navigation />

        {/* Cinematic Hero */}
        <div className="relative">
          <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-gradient-to-br from-primary/30 via-accent/20 to-background">
            {artist.artist_profiles?.banner_url && (
              <img
                src={artist.artist_profiles.banner_url}
                alt={`${displayName} banner`}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
          </div>

          <div className="container mx-auto px-4 -mt-28 sm:-mt-32 relative z-10">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
              <div className="relative">
                <div className={`rounded-full p-1 ${artist.artist_profiles?.verified ? "bg-gradient-to-br from-primary via-accent to-primary" : "bg-border"}`}>
                  <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background">
                    <AvatarImage src={artist.avatar_url} />
                    <AvatarFallback className="text-4xl">
                      {displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {artist.artist_profiles?.verified && (
                  <div className="absolute bottom-1 right-1 bg-primary rounded-full p-1.5 border-4 border-background">
                    <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pb-2">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{displayName}</h1>
                  {artist.artist_profiles?.verified && (
                    <Badge className="bg-primary/15 text-primary border-primary/30">Verified Artist</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">@{artist.username}</p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                  {artist.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{artist.location}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />Joined {new Date(artist.created_at).getFullYear()}
                  </span>
                </div>

                {artist.artist_profiles?.genres && artist.artist_profiles.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {artist.artist_profiles.genres.map((g) => (
                      <Badge key={g} variant="secondary" className="rounded-full">{g}</Badge>
                    ))}
                  </div>
                )}

                <div className="mt-3">
                  <VerifiedTrustStack
                    identityVerified={artist.artist_profiles?.verified}
                    kycComplete={artist.artist_profiles?.verified}
                    rightsAttested={tracks.length > 0}
                    activeSince={artist.created_at}
                  />
                </div>
              </div>
            </div>

            {/* Live stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: "Followers", value: followerCount.toLocaleString(), icon: Users },
                { label: "Total Plays", value: totalPlays.toLocaleString(), icon: TrendingUp },
                { label: "Tracks", value: tracks.length, icon: Music },
                { label: "Talent Score", value: artist.artist_profiles?.talent_score ?? 0, icon: Sparkles },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-xl border bg-card/60 backdrop-blur p-4 text-center">
                    <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
                    <div className="text-xl sm:text-2xl font-bold">{s.value}</div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Public supporter count — never reveals amounts */}
            <div className="mt-4 flex justify-center">
              <SupporterCount artistId={id!} />
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky top-16 z-30 mt-6 backdrop-blur-md bg-background/80 border-y">
          <div className="container mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
            {activeSubmission && (
              <Button
                onClick={() => navigate("/rising-stars/voting")}
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-lg flex-shrink-0"
              >
                <Vote className="mr-2 h-4 w-4" />Vote Now
              </Button>
            )}
            {id && (
              <FollowButton
                artistId={id}
                artistName={displayName}
                className="flex-shrink-0"
                onChange={(next) => {
                  setIsFollowing(next);
                  setFollowerCount((p) => Math.max(0, p + (next ? 1 : -1)));
                }}
              />
            )}
            <Button variant="outline" onClick={() => handleShare("native")} className="flex-shrink-0">
              <Share2 className="mr-2 h-4 w-4" />Share
            </Button>
            <Button
              variant="outline"
              onClick={() => setTipOpen(true)}
              disabled={!user || user.id === id}
              className="flex-shrink-0 border-primary/40 text-primary hover:bg-primary/10"
            >
              <Gift className="mr-2 h-4 w-4" />Tip
            </Button>
            {featuredTrack && (
              <Button
                variant="ghost"
                onClick={() => handleTrackPlay(featuredTrack, tracks.indexOf(featuredTrack))}
                className="flex-shrink-0"
              >
                <Play className="mr-2 h-4 w-4" />Play
              </Button>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Active Competition Banner */}
          {activeSubmission && (
            <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Flame className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge className="bg-primary text-primary-foreground mb-2">LIVE COMPETITION</Badge>
                    <h3 className="text-lg sm:text-xl font-bold">
                      {displayName} is competing in {activeSubmission.competition?.title || "BAK55 Rising Stars"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Vote className="h-4 w-4" />{activeSubmission.votes_count.toLocaleString()} votes</span>
                      {votingDaysLeft !== null && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Calendar className="h-4 w-4" />{votingDaysLeft} day{votingDaysLeft !== 1 ? "s" : ""} left
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        onClick={() => navigate("/rising-stars/voting")}
                        size="lg"
                        className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
                      >
                        <Vote className="mr-2 h-5 w-5" />Vote for {displayName}
                        <ChevronRight className="ml-1 h-5 w-5" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setShareCardOpen(true)}
                        className="border-primary/40"
                      >
                        <ImageIcon className="mr-2 h-5 w-5" />Get Share Card
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setTipOpen(true)}
                        disabled={!user || user.id === id}
                      >
                        <Gift className="mr-2 h-5 w-5" />Tip Artist
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Featured Track */}
          {featuredTrack && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative w-full sm:w-56 h-56 flex-shrink-0 bg-muted">
                    {featuredTrack.cover_image ? (
                      <img src={featuredTrack.cover_image} alt={featuredTrack.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Music className="h-12 w-12 text-muted-foreground" /></div>
                    )}
                    <button
                      onClick={() => handleTrackPlay(featuredTrack, tracks.indexOf(featuredTrack))}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl">
                        <Play className="h-8 w-8 ml-1" />
                      </div>
                    </button>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    <Badge variant="outline" className="w-fit mb-2">⭐ Featured Track</Badge>
                    <h3 className="text-2xl font-bold">{featuredTrack.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {featuredTrack.genre} · {(featuredTrack.plays || 0).toLocaleString()} plays
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => handleTrackPlay(featuredTrack, tracks.indexOf(featuredTrack))}>
                        <Play className="mr-2 h-4 w-4" />Play
                      </Button>
                      <Button variant="outline" onClick={() => navigate(`/track/${featuredTrack.id}`)}>
                        Track Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bio / Story */}
          {artist.bio && (
            <Card>
              <CardHeader><CardTitle>About {displayName}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">{artist.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Tracks Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Music</CardTitle>
              <CardDescription>{tracks.length} {tracks.length === 1 ? "track" : "tracks"}</CardDescription>
            </CardHeader>
            <CardContent>
              {tracks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tracks uploaded yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tracks.map((track, index) => (
                    <div key={track.id} className="group relative">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                        onClick={() => handleTrackPlay(track, index)}>
                        {track.cover_image ? (
                          <img src={track.cover_image} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Music className="h-10 w-10 text-muted-foreground" /></div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Play className="h-6 w-6 ml-0.5" />
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddToQueue(track); }}
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Add to queue"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 cursor-pointer" onClick={() => navigate(`/track/${track.id}`)}>
                        <h4 className="font-medium text-sm truncate">{track.title}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />{(track.plays || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust Signals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />Why Trust BAK55
              </CardTitle>
              <CardDescription>Every artist, vote, and payout is verified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TrustSignals />
              <RuleCard
                title="How tips & support work"
                subtitle="Where your money goes when you support this artist."
                rules={[
                  { label: "Tip minimum", value: "0.1 BAK" },
                  { label: "Artist receives", value: "100% of tips", hint: "No platform commission on tips" },
                  { label: "Vote cost", value: "1 BAK", hint: "0.65 BAK goes to the artist" },
                  { label: "Fan club minimum", value: "10 BAK / month" },
                  { label: "Refund policy", value: "Auto-refund on fraud reversal" },
                ]}
              />
            </CardContent>
          </Card>

          {/* Fan Support */}
          <FanClubSection artistId={id!} isOwner={user?.id === id} />

          {/* Badges & Level */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ArtistLevelCard userId={id!} />
            <ArtistBadges
              artistId={id!}
              followerCount={followerCount}
              totalPlays={totalPlays}
              trackCount={tracks.length}
            />
          </div>

          {/* Competition Journey */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />Competition Journey
              </CardTitle>
              <CardDescription>Track record in BAK55 competitions</CardDescription>
            </CardHeader>
            <CardContent>
              <ArtistJourneyTimeline artistId={id!} />
            </CardContent>
          </Card>

          {/* Share & Socials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-primary" />Share & Connect</CardTitle>
              <CardDescription>Help {displayName} reach more fans.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button variant="outline" onClick={() => handleShare("whatsapp")} className="justify-start">
                  <MessageCircle className="mr-2 h-4 w-4 text-green-600" />WhatsApp
                </Button>
                <Button variant="outline" onClick={() => handleShare("twitter")} className="justify-start">
                  <Twitter className="mr-2 h-4 w-4 text-sky-500" />Twitter
                </Button>
                <Button variant="outline" onClick={() => handleShare("copy")} className="justify-start">
                  <Copy className="mr-2 h-4 w-4" />Copy Link
                </Button>
                <Button variant="outline" onClick={() => handleShare("native")} className="justify-start">
                  <Share2 className="mr-2 h-4 w-4" />More
                </Button>
              </div>

              {socials.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Find {displayName} on</p>
                  <div className="flex flex-wrap gap-2">
                    {socials.map((s) => {
                      const Icon = s.icon;
                      return (
                        <Button key={s.key} variant="outline" size="sm" asChild>
                          <a href={socialLinks[s.key]} target="_blank" rel="noopener noreferrer">
                            <Icon className="mr-2 h-4 w-4" />{s.label}
                            <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" />
                          </a>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discover Related Artists */}
          {relatedArtists.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary" />Fans Also Love</CardTitle>
                <CardDescription>Discover similar artists on BAK55</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
                  {relatedArtists.map((a) => {
                    const name = a.stage_name || a.username;
                    return (
                      <button
                        key={a.id}
                        onClick={() => navigate(`/artist/${a.id}`)}
                        className="flex-shrink-0 w-32 text-center group"
                      >
                        <Avatar className="h-24 w-24 mx-auto mb-2 group-hover:ring-2 group-hover:ring-primary transition-all">
                          <AvatarImage src={a.avatar_url} />
                          <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium truncate">{name}</p>
                        {a.genres?.[0] && (
                          <p className="text-xs text-muted-foreground truncate">{a.genres[0]}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {id && (
        <TipDialog
          open={tipOpen}
          onOpenChange={setTipOpen}
          artistId={id}
          artistName={displayName}
        />
      )}

      <Dialog open={shareCardOpen} onOpenChange={setShareCardOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />Downloadable Share Card
            </DialogTitle>
            <DialogDescription>
              A premium 1080×1350 vote-promotion card optimized for Instagram, WhatsApp, and X.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl overflow-hidden border bg-muted">
            <div
              style={{
                transform: "scale(0.35)",
                transformOrigin: "top left",
                width: 1080,
                height: 1350,
              }}
            >
              <ShareCard
                ref={shareCardRef}
                artistName={displayName}
                username={artist.username}
                avatarUrl={artist.avatar_url}
                bannerUrl={artist.artist_profiles?.banner_url || undefined}
                competitionTitle={activeSubmission?.competition?.title}
                votes={activeSubmission?.votes_count}
                daysLeft={votingDaysLeft}
                verified={artist.artist_profiles?.verified}
                shareUrl={shareUrl}
              />
            </div>
            <div style={{ height: 1350 * 0.35, marginTop: -1350 }} />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleDownloadShareCard}
              disabled={generatingCard}
              className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              {generatingCard ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download PNG
            </Button>
            <Button variant="outline" onClick={() => handleShare("whatsapp")} className="flex-1">
              <MessageCircle className="mr-2 h-4 w-4" />Share Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

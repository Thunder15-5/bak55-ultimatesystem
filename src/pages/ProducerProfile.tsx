import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Headphones, Star, ShoppingCart, Award, MapPin, Calendar, 
  Loader2, Play, Pause, Music2, MessageSquare, TrendingUp
} from "lucide-react";

interface ProducerData {
  user_id: string;
  producer_name: string;
  producer_tier: string | null;
  verified: boolean | null;
  genres: string[] | null;
  bio: string | null;
  total_beats_sold: number | null;
  total_earnings: number | null;
  total_licenses_issued: number | null;
  average_rating: number | null;
  total_reviews: number | null;
  available_for_hire: boolean | null;
  equipment: string[] | null;
}

interface ProfileData {
  username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
}

interface Beat {
  id: string;
  title: string;
  audio_url: string;
  cover_image: string | null;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  plays: number | null;
  price_lease_kes: number | null;
  is_free: boolean | null;
  status: string | null;
  moderation_status: string | null;
}

export default function ProducerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [producer, setProducer] = useState<ProducerData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingBeatId, setPlayingBeatId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (id) fetchData();
    return () => { audioRef?.pause(); };
  }, [id]);

  const fetchData = async () => {
    try {
      const [producerRes, profileRes, beatsRes] = await Promise.all([
        supabase.from("producer_profiles").select("*").eq("user_id", id).single(),
        supabase.from("profiles").select("username, avatar_url, bio, location, created_at").eq("id", id).single(),
        supabase.from("beats").select("*").eq("producer_id", id!).eq("status", "active").eq("moderation_status", "approved").order("created_at", { ascending: false }),
      ]);

      if (producerRes.error) throw producerRes.error;
      setProducer(producerRes.data);
      setProfile(profileRes.data);
      setBeats(beatsRes.data || []);
    } catch (err) {
      toast.error("Producer not found");
      navigate("/beats");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (beat: Beat) => {
    if (playingBeatId === beat.id) {
      audioRef?.pause();
      setPlayingBeatId(null);
    } else {
      audioRef?.pause();
      const audio = new Audio(beat.audio_url);
      audio.play();
      audio.onended = () => setPlayingBeatId(null);
      setAudioRef(audio);
      setPlayingBeatId(beat.id);
    }
  };

  const getTierBadge = (tier: string | null) => {
    switch (tier) {
      case 'platinum': return { label: '💎 Platinum', className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0' };
      case 'elite': return { label: '🏆 Elite', className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0' };
      case 'pro': return { label: '⭐ Pro', className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0' };
      default: return { label: '🎵 Starter', className: '' };
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

  if (!producer || !profile) return null;

  const tierBadge = getTierBadge(producer.producer_tier);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${producer.producer_name} | BAK55 Producer`}
        description={`Listen to beats by ${producer.producer_name} on BAK55 Talent.`}
      />
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-20">
        {/* Producer Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-3xl">
                  {producer.producer_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-bold">{producer.producer_name}</h1>
                    {producer.verified && <Badge variant="default">Verified</Badge>}
                    <Badge className={tierBadge.className}>{tierBadge.label}</Badge>
                  </div>
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>

                {(profile.bio || producer.bio) && (
                  <p className="text-lg">{profile.bio || producer.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                  {producer.available_for_hire && (
                    <Badge variant="outline" className="border-primary text-primary">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Available for Hire
                    </Badge>
                  )}
                </div>

                {producer.genres && producer.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {producer.genres.map((genre) => (
                      <Badge key={genre} variant="secondary">{genre}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Card */}
              <Card className="p-4 min-w-[160px]">
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                      <Star className="w-5 h-5" />
                      {producer.average_rating || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">{producer.total_reviews || 0} reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{producer.total_beats_sold || 0}</div>
                    <div className="text-xs text-muted-foreground">Beats Sold</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{beats.length}</div>
                    <div className="text-xs text-muted-foreground">Available Beats</div>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Beats Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-primary" />
              Beats
            </CardTitle>
            <CardDescription>{beats.length} beats available</CardDescription>
          </CardHeader>
          <CardContent>
            {beats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No beats available yet</p>
            ) : (
              <div className="space-y-2">
                {beats.map((beat) => {
                  const isPlaying = playingBeatId === beat.id;
                  return (
                    <div
                      key={beat.id}
                      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Button size="icon" variant="ghost" onClick={() => togglePlay(beat)} className="flex-shrink-0">
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>

                      <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                        {beat.cover_image ? (
                          <img src={beat.cover_image} alt={beat.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{beat.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {beat.genre && (
                            <Badge variant="secondary" className="text-xs">{beat.genre}</Badge>
                          )}
                          {beat.bpm && <span className="text-xs">{beat.bpm} BPM</span>}
                          {beat.key && <span className="text-xs">Key: {beat.key}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {beat.plays || 0}
                        </span>
                        {beat.is_free ? (
                          <Badge variant="outline" className="text-xs border-primary text-primary">Free</Badge>
                        ) : beat.price_lease_kes ? (
                          <Badge variant="default" className="text-xs">KES {beat.price_lease_kes}</Badge>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment */}
        {producer.equipment && producer.equipment.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Equipment & Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {producer.equipment.map((item, i) => (
                  <Badge key={i} variant="outline">{item}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
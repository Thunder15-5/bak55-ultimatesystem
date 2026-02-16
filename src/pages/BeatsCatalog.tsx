import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Play, Pause, Music2, User, Headphones, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BeatLicenseDialog } from "@/components/BeatLicenseDialog";

interface Beat {
  id: string;
  title: string;
  audio_url: string;
  cover_image: string | null;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  mood: string[] | null;
  plays: number | null;
  likes: number | null;
  price_lease_kes: number | null;
  price_exclusive_kes: number | null;
  is_free: boolean | null;
  producer_id: string;
  tags: string[] | null;
  description: string | null;
}

interface ProducerInfo {
  producer_name: string;
  user_id: string;
}

export default function BeatsCatalog() {
  const { userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [playingBeatId, setPlayingBeatId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const { data: beats, isLoading } = useQuery({
    queryKey: ["public-beats", searchQuery, genreFilter],
    queryFn: async () => {
      let query = supabase
        .from("beats")
        .select("*")
        .eq("status", "active")
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }
      if (genreFilter !== "all") {
        query = query.eq("genre", genreFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Beat[];
    },
  });

  // Fetch producer profiles separately
  const producerIds = [...new Set(beats?.map((b) => b.producer_id) || [])];
  const { data: producers } = useQuery({
    queryKey: ["beat-producers", producerIds],
    queryFn: async () => {
      if (producerIds.length === 0) return {};
      const { data, error } = await supabase
        .from("producer_profiles")
        .select("user_id, producer_name")
        .in("user_id", producerIds);
      if (error) throw error;
      const map: Record<string, ProducerInfo> = {};
      data?.forEach((p) => {
        map[p.user_id] = p;
      });
      return map;
    },
    enabled: producerIds.length > 0,
  });

  // Fetch unique genres for filter
  const { data: genres } = useQuery({
    queryKey: ["beat-genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beats")
        .select("genre")
        .eq("status", "active")
        .eq("moderation_status", "approved")
        .not("genre", "is", null);
      if (error) throw error;
      const uniqueGenres = [...new Set(data?.map((d) => d.genre).filter(Boolean))];
      return uniqueGenres as string[];
    },
  });

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

  useEffect(() => {
    return () => {
      audioRef?.pause();
    };
  }, [audioRef]);

  const getRolePrefix = () => {
    if (!userRole) return "";
    return `/${userRole}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Browse Beats | BAK55 Talent"
        description="Discover and license beats from talented producers on BAK55 Talent platform."
      />
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            <span className="text-gradient">Browse Beats</span>
          </h1>
          <p className="text-muted-foreground">
            Discover beats from talented producers. Stream, license, and collaborate.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search beats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres?.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Beats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !beats || beats.length === 0 ? (
          <div className="text-center py-20">
            <Music2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No beats found</h2>
            <p className="text-muted-foreground">
              {searchQuery || genreFilter !== "all"
                ? "Try adjusting your filters."
                : "Beats uploaded by producers will appear here once approved."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {beats.map((beat) => {
              const producer = producers?.[beat.producer_id];
              const isPlaying = playingBeatId === beat.id;

              return (
                <Card
                  key={beat.id}
                  className="group overflow-hidden border-primary/10 bg-card hover:border-primary/30 transition-all"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-square bg-muted">
                    {beat.cover_image ? (
                      <img
                        src={beat.cover_image}
                        alt={beat.title}
                        className="w-full h-full object-contain bg-black/50"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <Headphones className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Play button overlay */}
                    <button
                      onClick={() => togglePlay(beat)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isPlaying ? (
                        <Pause className="w-12 h-12 text-white" />
                      ) : (
                        <Play className="w-12 h-12 text-white" />
                      )}
                    </button>
                    {isPlaying && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="default" className="animate-pulse">
                          Playing
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm truncate">{beat.title}</h3>

                    {/* Producer name */}
                    {producer ? (
                      <Link
                        to={`/producer/${beat.producer_id}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <User className="w-3 h-3" />
                        {producer.producer_name}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">Producer</span>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {beat.genre && (
                        <Badge variant="secondary" className="text-[10px]">
                          {beat.genre}
                        </Badge>
                      )}
                      {beat.bpm && (
                        <span className="text-[10px] text-muted-foreground">
                          {beat.bpm} BPM
                        </span>
                      )}
                      {beat.key && (
                        <span className="text-[10px] text-muted-foreground">
                          Key: {beat.key}
                        </span>
                      )}
                    </div>

                    {/* Plays & License */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{beat.plays || 0} plays</span>
                      <BeatLicenseDialog
                        beat={beat as any}
                        producerName={producer?.producer_name || "Producer"}
                      >
                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          {beat.is_free ? "Free" : beat.price_lease_kes ? `KES ${beat.price_lease_kes}` : "License"}
                        </Button>
                      </BeatLicenseDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TrackList } from "@/components/music/TrackList";
import { TrackFilters } from "@/components/music/TrackFilters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FanDiscover() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<any[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    filterTracks();
  }, [tracks, selectedGenre, searchQuery]);

  const fetchTracks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tracks")
      .select(`
        *,
        artist_profiles!tracks_artist_id_fkey (
          stage_name,
          user_id
        )
      `)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTracks(data);
    }
    setLoading(false);
  };

  const fetchFollowingTracks = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data: followedArtists } = await supabase
      .from("followers")
      .select("artist_id")
      .eq("follower_id", user.id);

    if (followedArtists && followedArtists.length > 0) {
      const artistIds = followedArtists.map((f) => f.artist_id);
      const { data, error } = await supabase
        .from("tracks")
        .select(`
          *,
          artist_profiles!tracks_artist_id_fkey (
            stage_name,
            user_id
          )
        `)
        .in("artist_id", artistIds)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTracks(data);
      }
    } else {
      setTracks([]);
    }
    setLoading(false);
  };

  const filterTracks = () => {
    let filtered = [...tracks];

    if (selectedGenre) {
      filtered = filtered.filter((track) => track.genre === selectedGenre);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (track) =>
          track.title.toLowerCase().includes(query) ||
          track.artist_profiles?.stage_name?.toLowerCase().includes(query) ||
          track.genre?.toLowerCase().includes(query)
      );
    }

    setFilteredTracks(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Discover Music</h1>
          <p className="text-muted-foreground">
            Explore the best tracks from East African artists
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all" onClick={fetchTracks}>
              All Tracks
            </TabsTrigger>
            <TabsTrigger value="following" onClick={fetchFollowingTracks}>
              Following
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <TrackFilters
              onSearch={setSearchQuery}
              onGenreFilter={setSelectedGenre}
              selectedGenre={selectedGenre}
            />
            <TrackList
              tracks={filteredTracks}
              loading={loading}
              emptyMessage="No tracks available. Check back soon!"
              viewMode="fan"
            />
          </TabsContent>

          <TabsContent value="following" className="space-y-6">
            <TrackFilters
              onSearch={setSearchQuery}
              onGenreFilter={setSelectedGenre}
              selectedGenre={selectedGenre}
            />
            <TrackList
              tracks={filteredTracks}
              loading={loading}
              emptyMessage="You're not following any artists yet. Browse All Tracks to discover new music!"
              viewMode="fan"
            />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { TrackList } from "@/components/music/TrackList";
import { TrackFilters } from "@/components/music/TrackFilters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApprovedTracks } from "@/hooks/useTracks";
import { useQuery } from "@tanstack/react-query";

export default function FanDiscover() {
  const { user } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Use React Query for approved tracks
  const { data: allTracks = [], isLoading: loadingAll } = useApprovedTracks();

  // Fetch following tracks
  const { data: followingTracks = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ['tracks', 'following', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: followedArtists } = await supabase
        .from("followers")
        .select("artist_id")
        .eq("follower_id", user.id);

      if (!followedArtists || followedArtists.length === 0) {
        return [];
      }

      const artistIds = followedArtists.map((f) => f.artist_id);
      
      const { data: tracksData, error } = await supabase
        .from("tracks")
        .select("*")
        .in("artist_id", artistIds)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!tracksData || tracksData.length === 0) return [];

      // Fetch artist profiles
      const { data: artistsData } = await supabase
        .from("artist_profiles")
        .select("user_id, stage_name")
        .in("user_id", artistIds);

      // Merge data
      return tracksData.map(track => ({
        ...track,
        artist_profiles: artistsData?.find(a => a.user_id === track.artist_id) || null
      }));
    },
    enabled: !!user,
  });

  // Select tracks based on active tab
  const tracks = activeTab === "all" ? allTracks : followingTracks;
  const loading = activeTab === "all" ? loadingAll : loadingFollowing;

  // Filter tracks
  const filteredTracks = useMemo(() => {
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

    return filtered;
  }, [tracks, selectedGenre, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Discover Music</h1>
          <p className="text-muted-foreground">
            Explore the best tracks from East African artists
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All Tracks
            </TabsTrigger>
            <TabsTrigger value="following">
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

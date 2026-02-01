import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { TrackList } from "@/components/music/TrackList";
import { TrackFilters } from "@/components/music/TrackFilters";
import { supabase } from "@/integrations/supabase/client";

export default function ArtistDiscover() {
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
    
    // Fetch tracks
    // Fetch only approved tracks - RLS handles visibility but we also filter explicitly
    const { data: tracksData, error: tracksError } = await supabase
      .from("tracks")
      .select("*")
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false });

    if (tracksError) {
      console.error("Error fetching tracks:", tracksError);
      setLoading(false);
      return;
    }

    if (!tracksData || tracksData.length === 0) {
      setTracks([]);
      setLoading(false);
      return;
    }

    // Fetch artist profiles for these tracks
    const artistIds = [...new Set(tracksData.map(t => t.artist_id))];
    const { data: artistsData, error: artistsError } = await supabase
      .from("artist_profiles")
      .select("user_id, stage_name")
      .in("user_id", artistIds);

    if (artistsError) {
      console.error("Error fetching artists:", artistsError);
    }

    // Merge data
    const tracksWithArtists = tracksData.map(track => ({
      ...track,
      artist_profiles: artistsData?.find(a => a.user_id === track.artist_id) || null
    }));

    setTracks(tracksWithArtists);
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
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Tracks</h1>
          <p className="text-muted-foreground">
            Discover trending music and connect with other artists
          </p>
        </div>

        <div className="space-y-6">
          <TrackFilters
            onSearch={setSearchQuery}
            onGenreFilter={setSelectedGenre}
            selectedGenre={selectedGenre}
          />
          <TrackList
            tracks={filteredTracks}
            loading={loading}
            emptyMessage="No tracks available"
            viewMode="artist"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

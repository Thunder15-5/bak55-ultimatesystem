import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
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

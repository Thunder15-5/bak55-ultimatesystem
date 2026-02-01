import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { TrackList } from "@/components/music/TrackList";
import { TrackFilters } from "@/components/music/TrackFilters";
import { useApprovedTracks } from "@/hooks/useTracks";

export default function ArtistDiscover() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Use React Query for approved tracks with automatic cache invalidation
  const { data: tracks = [], isLoading: loading } = useApprovedTracks();

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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";

interface TrackFiltersProps {
  onSearch: (query: string) => void;
  onGenreFilter: (genre: string | null) => void;
  genres?: string[];
  selectedGenre?: string | null;
}

const DEFAULT_GENRES = ["Afrobeats", "Hip Hop", "Gospel", "Bongo Flava", "Reggae", "R&B", "Pop"];

export function TrackFilters({
  onSearch,
  onGenreFilter,
  genres = DEFAULT_GENRES,
  selectedGenre = null,
}: TrackFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tracks, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedGenre === null ? "default" : "outline"}
          size="sm"
          onClick={() => onGenreFilter(null)}
        >
          All
        </Button>
        {genres.map((genre) => (
          <Button
            key={genre}
            variant={selectedGenre === genre ? "default" : "outline"}
            size="sm"
            onClick={() => onGenreFilter(genre)}
          >
            {genre}
          </Button>
        ))}
      </div>
    </div>
  );
}

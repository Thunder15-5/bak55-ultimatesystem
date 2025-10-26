import { TrackCard } from "./TrackCard";
import { Loader2 } from "lucide-react";

interface Track {
  id: string;
  title: string;
  audio_url: string;
  cover_image?: string;
  genre?: string;
  artist_id: string;
  artist_profiles?: {
    stage_name?: string;
    user_id: string;
  };
}

interface TrackListProps {
  tracks: Track[];
  loading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
  viewMode?: "fan" | "artist" | "brand";
}

export function TrackList({
  tracks,
  loading = false,
  emptyMessage = "No tracks found",
  showActions = true,
  viewMode = "fan",
}: TrackListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          showActions={showActions}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}

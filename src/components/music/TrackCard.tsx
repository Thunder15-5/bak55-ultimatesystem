import { Play, Pause, MoreVertical, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ExclusiveContentOverlay } from "@/components/ExclusiveContentOverlay";
import { useExclusiveAccess } from "@/hooks/useExclusiveAccess";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    audio_url: string;
    cover_image?: string;
    genre?: string;
    artist_id: string;
    is_exclusive?: boolean;
    required_tier_level?: number;
    artist_profiles?: {
      stage_name?: string;
      user_id: string;
    };
  };
  showActions?: boolean;
  viewMode?: "fan" | "artist" | "brand";
}

export function TrackCard({ track, showActions = true, viewMode = "fan" }: TrackCardProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  const { hasAccess: hasExclusiveAccess } = useExclusiveAccess(
    track.artist_id,
    track.is_exclusive || false,
    track.required_tier_level || 0,
    user?.id
  );

  const isLocked = track.is_exclusive && !hasExclusiveAccess;
  const isCurrentTrack = currentTrack?.id === track.id;
  const isThisPlaying = isCurrentTrack && isPlaying;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack({
        id: track.id,
        title: track.title,
        artist_id: track.artist_id,
        audio_url: track.audio_url,
        cover_image: track.cover_image || "/placeholder.svg",
        genre: track.genre,
        profiles: {
          username: track.artist_profiles?.stage_name || "Unknown Artist",
          avatar_url: null,
        },
      });
    }
  };

  const handleViewDetails = () => {
    if (userRole) {
      navigate(`/${userRole}/track/${track.id}`);
    } else {
      navigate(`/track/${track.id}`);
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all touch-manipulation w-full max-w-full">
      <div className="relative aspect-square cursor-pointer touch-manipulation" onClick={handleViewDetails}>
        <img
          src={track.cover_image || "/placeholder.svg"}
          alt={track.title}
          className={`w-full h-full object-cover ${isLocked ? 'blur-sm' : ''}`}
        />
        {/* Exclusive content overlay */}
        {isLocked && (
          <ExclusiveContentOverlay
            artistId={track.artist_id}
            requiredTierLevel={track.required_tier_level || 1}
            artistName={track.artist_profiles?.stage_name}
          />
        )}
        {/* Play/Pause overlay - only show when not locked */}
        {!isLocked && (
          <div 
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 flex items-center justify-center ${
              isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-active:opacity-100'
            }`}
          >
            <Button
              size="icon"
              onClick={handlePlayPause}
              className={`rounded-full w-14 h-14 min-w-[56px] min-h-[56px] shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation flex items-center justify-center ${
                isThisPlaying 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-white text-black hover:bg-white/90'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              {isThisPlaying ? (
                <Pause className="w-6 h-6 flex-shrink-0" />
              ) : (
                <Play className="w-6 h-6 ml-0.5 flex-shrink-0" />
              )}
            </Button>
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-4">
        <h3 
          className="font-semibold text-sm sm:text-base md:text-lg truncate cursor-pointer hover:text-primary transition-colors break-words"
          onClick={handleViewDetails}
        >
          {track.title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground truncate break-words">
          {track.artist_profiles?.stage_name || "Unknown Artist"}
        </p>
        {track.genre && (
          <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full truncate max-w-full">
            {track.genre}
          </span>
        )}

        {showActions && (
          <div className="flex items-center justify-end mt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewDetails}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>Add to Playlist</DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </Card>
  );
}

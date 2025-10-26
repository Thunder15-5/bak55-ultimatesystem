import { Play, Heart, MessageCircle, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
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
    artist_profiles?: {
      stage_name?: string;
      user_id: string;
    };
  };
  showActions?: boolean;
  viewMode?: "fan" | "artist" | "brand";
}

export function TrackCard({ track, showActions = true, viewMode = "fan" }: TrackCardProps) {
  const { playTrack } = useMusicPlayer();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    fetchEngagement();
  }, [track.id, user]);

  const fetchEngagement = async () => {
    // Fetch like count
    const { count: likes } = await supabase
      .from("track_likes")
      .select("*", { count: "exact", head: true })
      .eq("track_id", track.id);
    setLikeCount(likes || 0);

    // Fetch comment count
    const { count: comments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("track_id", track.id);
    setCommentCount(comments || 0);

    // Check if user liked
    if (user) {
      const { data } = await supabase
        .from("track_likes")
        .select("id")
        .eq("track_id", track.id)
        .eq("user_id", user.id)
        .single();
      setIsLiked(!!data);
    }
  };

  const handlePlay = () => {
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
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like tracks");
      return;
    }

    if (isLiked) {
      await supabase
        .from("track_likes")
        .delete()
        .eq("track_id", track.id)
        .eq("user_id", user.id);
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      await supabase
        .from("track_likes")
        .insert({ track_id: track.id, user_id: user.id });
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
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
    <Card className="group overflow-hidden hover:shadow-lg transition-all">
      <div className="relative aspect-square">
        <img
          src={track.cover_image || "/placeholder.svg"}
          alt={track.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="lg"
            onClick={handlePlay}
            className="rounded-full w-16 h-16"
          >
            <Play className="w-6 h-6 fill-current" />
          </Button>
        </div>
      </div>
      
      <div className="p-4">
        <h3 
          className="font-semibold text-lg truncate cursor-pointer hover:text-primary transition-colors"
          onClick={handleViewDetails}
        >
          {track.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate">
          {track.artist_profiles?.stage_name || "Unknown Artist"}
        </p>
        {track.genre && (
          <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
            {track.genre}
          </span>
        )}

        {showActions && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={isLiked ? "text-red-500" : ""}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
                {likeCount}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleViewDetails}>
                <MessageCircle className="w-4 h-4 mr-1" />
                {commentCount}
              </Button>
            </div>
            
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

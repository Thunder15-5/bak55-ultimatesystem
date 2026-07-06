import { useEffect, useState, useCallback } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { PressableButton } from "@/components/PressableButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { actionToast } from "@/lib/actionToast";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  artistId: string;
  artistName?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
  onChange?: (isFollowing: boolean) => void;
  /** Track activity side-effect (fan rewards) */
  onFollowed?: () => void | Promise<void>;
}

/**
 * Standardized follow control: optimistic UI, haptics, unified toast copy.
 * One primitive across ArtistProfile, TrackDetails, cards, sheets.
 */
export function FollowButton({
  artistId,
  artistName,
  size = "default",
  className,
  onChange,
  onFollowed,
}: FollowButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  const isSelf = user?.id === artistId;

  useEffect(() => {
    let cancelled = false;
    if (!user || !artistId) {
      setReady(true);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("artist_id", artistId)
        .maybeSingle();
      if (cancelled) return;
      setIsFollowing(!!data);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, artistId]);

  const toggle = useCallback(async () => {
    if (!user) {
      actionToast.info("Sign in to follow artists");
      navigate("/login");
      return;
    }
    if (isSelf || pending) return;

    const next = !isFollowing;
    setIsFollowing(next); // optimistic
    onChange?.(next);
    setPending(true);
    try {
      if (next) {
        const { error } = await supabase
          .from("followers")
          .insert({ follower_id: user.id, artist_id: artistId });
        if (error) throw error;
        actionToast.success(
          artistName ? `Following ${artistName}` : "Following",
          "You'll get updates from new drops and shows.",
        );
        await onFollowed?.();
      } else {
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", user.id)
          .eq("artist_id", artistId);
        if (error) throw error;
        actionToast.info("Unfollowed");
      }
    } catch (e: any) {
      // rollback
      setIsFollowing(!next);
      onChange?.(!next);
      actionToast.error("Couldn't update follow", e?.message ?? "Please try again.");
    } finally {
      setPending(false);
    }
  }, [user, isFollowing, isSelf, pending, artistId, artistName, navigate, onChange, onFollowed]);

  if (isSelf) return null;

  return (
    <PressableButton
      onClick={toggle}
      disabled={!ready || pending}
      size={size}
      hapticPattern={isFollowing ? "light" : "success"}
      variant={isFollowing ? "outline" : "default"}
      className={cn("min-w-[120px]", className)}
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="mr-2 h-4 w-4" />
      ) : (
        <UserPlus className="mr-2 h-4 w-4" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </PressableButton>
  );
}

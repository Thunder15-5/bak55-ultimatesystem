import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ExclusiveAccessResult {
  hasAccess: boolean;
  loading: boolean;
  memberTierLevel: number;
  requiredTierLevel: number;
}

export function useExclusiveAccess(
  trackArtistId: string | undefined,
  isExclusive: boolean,
  requiredTierLevel: number,
  userId: string | undefined
): ExclusiveAccessResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memberTierLevel, setMemberTierLevel] = useState(0);

  useEffect(() => {
    if (!isExclusive || !trackArtistId) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    if (!userId) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    // Track owner always has access
    if (userId === trackArtistId) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        // Check if user has an active fan club membership for this artist
        const { data: membership } = await supabase
          .from("fan_club_memberships")
          .select("tier_id, fan_club_tiers!inner(tier_level)")
          .eq("fan_id", userId)
          .eq("artist_id", trackArtistId)
          .eq("status", "active")
          .gte("expires_at", new Date().toISOString())
          .order("fan_club_tiers(tier_level)", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (membership) {
          const tierLevel = (membership as any).fan_club_tiers?.tier_level || 0;
          setMemberTierLevel(tierLevel);
          setHasAccess(tierLevel >= requiredTierLevel);
        } else {
          setMemberTierLevel(0);
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Error checking exclusive access:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [trackArtistId, isExclusive, requiredTierLevel, userId]);

  return { hasAccess, loading, memberTierLevel, requiredTierLevel };
}

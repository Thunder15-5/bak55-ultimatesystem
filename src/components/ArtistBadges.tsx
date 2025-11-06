import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, Lock } from "lucide-react";

interface ArtistBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string | null;
  badge_icon: string | null;
  requirement_value: number;
  earned: boolean;
}

interface ArtistBadgesProps {
  artistId: string;
  followerCount: number;
  totalPlays: number;
  trackCount: number;
  compact?: boolean;
}

export function ArtistBadges({ artistId, followerCount, totalPlays, trackCount, compact = false }: ArtistBadgesProps) {
  const [badges, setBadges] = useState<ArtistBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [artistId, followerCount, totalPlays, trackCount]);

  const fetchBadges = async () => {
    try {
      // Get all badges
      const { data: allBadges, error: badgesError } = await supabase
        .from("artist_badges")
        .select("*")
        .order("requirement_value", { ascending: true });

      if (badgesError) throw badgesError;

      // Get earned badges for this artist
      const { data: earnedBadges, error: earnedError } = await supabase
        .from("artist_earned_badges")
        .select("badge_id")
        .eq("artist_id", artistId);

      if (earnedError) throw earnedError;

      const earnedBadgeIds = new Set(earnedBadges?.map(b => b.badge_id) || []);

      // Check which badges should be earned based on current stats
      const badgesWithStatus = allBadges?.map(badge => {
        let shouldEarn = false;
        
        if (badge.badge_type === 'followers' && followerCount >= badge.requirement_value) {
          shouldEarn = true;
        } else if (badge.badge_type === 'plays' && totalPlays >= badge.requirement_value) {
          shouldEarn = true;
        } else if (badge.badge_type === 'tracks' && trackCount >= badge.requirement_value) {
          shouldEarn = true;
        }

        const isEarned = earnedBadgeIds.has(badge.id);

        // Auto-award badge if earned but not in database
        if (shouldEarn && !isEarned) {
          awardBadge(artistId, badge.id);
        }

        return {
          ...badge,
          earned: shouldEarn,
        };
      }) || [];

      setBadges(badgesWithStatus);
    } catch (error) {
      console.error("Failed to fetch badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const awardBadge = async (artistId: string, badgeId: string) => {
    try {
      await supabase.from("artist_earned_badges").insert({
        artist_id: artistId,
        badge_id: badgeId,
      });
    } catch (error) {
      console.error("Failed to award badge:", error);
    }
  };

  if (loading) return null;

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  if (compact) {
    // Show only earned badges in compact mode
    if (earnedBadges.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2">
        {earnedBadges.map((badge) => (
          <TooltipProvider key={badge.id}>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-lg px-3 py-1 cursor-help">
                  {badge.badge_icon}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{badge.badge_name}</p>
                <p className="text-xs">{badge.badge_description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Achievements
        </CardTitle>
        <CardDescription>
          {earnedBadges.length} of {badges.length} badges earned
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Earned</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {earnedBadges.map((badge) => (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors cursor-help">
                          <span className="text-3xl">{badge.badge_icon}</span>
                          <span className="text-xs font-medium text-center line-clamp-2">
                            {badge.badge_name}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">{badge.badge_name}</p>
                        <p className="text-xs">{badge.badge_description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Locked Badges */}
          {lockedBadges.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Locked</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {lockedBadges.map((badge) => (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 border border-muted hover:border-muted-foreground/30 transition-colors cursor-help opacity-50">
                          <div className="relative">
                            <span className="text-3xl grayscale">{badge.badge_icon}</span>
                            <Lock className="absolute -bottom-1 -right-1 h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-medium text-center line-clamp-2 text-muted-foreground">
                            {badge.badge_name}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">{badge.badge_name}</p>
                        <p className="text-xs">{badge.badge_description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Progress: {badge.badge_type === 'followers' ? followerCount : badge.badge_type === 'plays' ? totalPlays : trackCount} / {badge.requirement_value}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UserBadge {
  id: string;
  earned_at: string;
  fan_badges: {
    id: string;
    badge_name: string;
    badge_icon: string | null;
    badge_description: string | null;
    rarity: string;
  };
}

interface BadgeCollectionProps {
  competitionId?: string;
}

export function BadgeCollection({ competitionId }: BadgeCollectionProps) {
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user, competitionId]);

  const fetchBadges = async () => {
    try {
      // Get all available badges
      const { data: badges } = await supabase
        .from('fan_badges')
        .select('*')
        .order('rarity', { ascending: false });

      setAllBadges(badges || []);

      // Get user's earned badges
      let query = supabase
        .from('user_badges')
        .select(`
          *,
          fan_badges(*)
        `)
        .eq('user_id', user?.id);

      if (competitionId) {
        query = query.eq('competition_id', competitionId);
      }

      const { data: earned } = await query;
      setEarnedBadges(earned || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500';
      case 'epic': return 'border-purple-500';
      case 'rare': return 'border-blue-500';
      default: return 'border-muted';
    }
  };

  const isEarned = (badgeId: string) => {
    return earnedBadges.some(eb => eb.fan_badges.id === badgeId);
  };

  const completionPercentage = (earnedBadges.length / allBadges.length) * 100;

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Badge Collection</h3>
          <Badge variant="outline">
            {earnedBadges.length} / {allBadges.length}
          </Badge>
        </div>
        <Progress value={completionPercentage} className="h-2" />
        <p className="text-sm text-muted-foreground">
          {completionPercentage.toFixed(0)}% Complete
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {allBadges.map((badge) => {
          const earned = isEarned(badge.id);
          const earnedBadge = earnedBadges.find(eb => eb.fan_badges.id === badge.id);

          return (
            <Card
              key={badge.id}
              className={`p-4 transition-all hover:scale-105 ${
                earned ? `border-2 ${getRarityBorder(badge.rarity)}` : 'opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="relative">
                  <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center text-3xl ${
                    earned 
                      ? `bg-gradient-to-br ${getRarityColor(badge.rarity)}`
                      : 'bg-muted'
                  }`}>
                    {earned ? badge.badge_icon : <Lock className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  {earned && badge.rarity === 'legendary' && (
                    <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500 animate-pulse" />
                  )}
                </div>

                <div className="text-center space-y-1">
                  <h4 className="font-semibold text-sm line-clamp-1">
                    {badge.badge_name}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {badge.badge_description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      earned ? `border-${badge.rarity === 'legendary' ? 'yellow' : badge.rarity === 'epic' ? 'purple' : 'blue'}-500` : ''
                    }`}
                  >
                    {badge.rarity}
                  </Badge>
                  {earned && earnedBadge && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(earnedBadge.earned_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FanActivity {
  id: string;
  activity_type: string;
  points_earned: number;
  created_at: string;
}

interface RewardTier {
  tier_name: string;
  min_points: number;
  reward_multiplier: number;
  badge_icon: string;
}

export function FanRewards() {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentTier, setCurrentTier] = useState<RewardTier | null>(null);
  const [nextTier, setNextTier] = useState<RewardTier | null>(null);
  const [recentActivities, setRecentActivities] = useState<FanActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRewards();
    }
  }, [user]);

  const fetchRewards = async () => {
    try {
      const { data: activities } = await supabase
        .from("fan_activities")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: tiers } = await supabase
        .from("fan_rewards_tiers")
        .select("*")
        .order("min_points", { ascending: true });

      if (activities) {
        setRecentActivities(activities);
        const total = activities.reduce((sum, act) => sum + act.points_earned, 0);
        setTotalPoints(total);

        if (tiers) {
          const current = [...tiers].reverse().find(t => total >= t.min_points) || tiers[0];
          const next = tiers.find(t => t.min_points > total);
          setCurrentTier(current);
          setNextTier(next);
        }
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily_login: "Daily Login",
      track_play: "Played Track",
      track_like: "Liked Track",
      artist_follow: "Followed Artist",
      track_share: "Shared Track",
      comment: "Left Comment",
      vote: "Voted",
      referral: "Referral Signup"
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  const progressToNext = nextTier 
    ? ((totalPoints - currentTier!.min_points) / (nextTier.min_points - currentTier!.min_points)) * 100
    : 100;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Fan Rewards Program
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Tier</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{currentTier?.badge_icon}</span>
                <span className="text-xl font-bold">{currentTier?.tier_name}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-3xl font-bold text-primary">{totalPoints}</p>
            </div>
          </div>

          {nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to {nextTier.tier_name}</span>
                <span>{totalPoints} / {nextTier.min_points}</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}

          <div className="flex items-center gap-2 text-sm bg-background/50 p-3 rounded-lg">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>Reward Multiplier: {currentTier?.reward_multiplier}x</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activities yet. Start engaging to earn points!</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{getActivityLabel(activity.activity_type)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">+{activity.points_earned} pts</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

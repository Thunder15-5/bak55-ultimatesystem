import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Flame, Award } from "lucide-react";

interface FanStats {
  voter_id: string;
  vote_count: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  badges: { id: string }[];
}

interface FanLeaderboardProps {
  competitionId: string;
  limit?: number;
}

export function FanLeaderboard({ competitionId, limit = 10 }: FanLeaderboardProps) {
  const [topFans, setTopFans] = useState<FanStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopFans();
  }, [competitionId]);

  const fetchTopFans = async () => {
    try {
      // Get submissions for this competition
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('competition_id', competitionId);

      if (!submissions) return;

      const submissionIds = submissions.map(s => s.id);

      // Get vote counts grouped by voter
      const { data: votes, error } = await supabase
        .from('votes')
        .select(`
          voter_id,
          profiles:voter_id(username, avatar_url)
        `)
        .in('submission_id', submissionIds);

      if (error) throw error;

      // Count votes per user
      const voterCounts = votes?.reduce((acc, vote) => {
        const voterId = vote.voter_id;
        if (!acc[voterId]) {
          acc[voterId] = {
            voter_id: voterId,
            vote_count: 0,
            profiles: vote.profiles,
            badges: [],
          };
        }
        acc[voterId].vote_count++;
        return acc;
      }, {} as Record<string, FanStats>);

      // Get badges for top voters
      const topVoters = Object.values(voterCounts || {})
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, limit);

      // Fetch badges for these users
      for (const voter of topVoters) {
        const { data: userBadges } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', voter.voter_id)
          .eq('competition_id', competitionId);
        
        voter.badges = userBadges || [];
      }

      setTopFans(topVoters);
    } catch (error) {
      console.error('Error fetching top fans:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  if (topFans.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No votes cast yet
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Top Supporters</h3>
        <Badge variant="outline">
          <Crown className="h-3 w-3 mr-1" />
          Leaderboard
        </Badge>
      </div>

      <div className="grid gap-2">
        {topFans.map((fan, index) => (
          <Card
            key={fan.voter_id}
            className={`p-3 transition-all hover:shadow-md ${
              index === 0 ? 'ring-2 ring-yellow-500/50 bg-gradient-to-r from-yellow-500/5 to-transparent' :
              index === 1 ? 'ring-1 ring-gray-400/50' :
              index === 2 ? 'ring-1 ring-orange-600/50' :
              ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={fan.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    {fan.profiles?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {index < 3 && (
                  <div className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    'bg-orange-600'
                  } text-white shadow-lg`}>
                    {index + 1}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">
                    {fan.profiles?.username || 'Anonymous'}
                  </p>
                  {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                  {fan.vote_count >= 50 && <Flame className="h-4 w-4 text-orange-500" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{fan.vote_count} votes</span>
                  {fan.badges.length > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        <span>{fan.badges.length} badges</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                <Badge
                  variant={index === 0 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  #{index + 1}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
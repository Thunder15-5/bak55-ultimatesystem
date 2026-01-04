import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, 
  Music, 
  Users, 
  Trophy, 
  Share2, 
  ListMusic,
  CheckCircle2,
  Coins
} from 'lucide-react';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_count: number;
  reward_amount: number;
  progress: number;
  completed: boolean;
  reward_claimed: boolean;
}

const CHALLENGE_ICONS: Record<string, any> = {
  listen: Music,
  follow: Users,
  vote: Trophy,
  share: Share2,
  playlist: ListMusic,
};

export function WeeklyChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user]);

  const fetchChallenges = async () => {
    try {
      // Get all active challenges
      const { data: activeChallenges } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('is_active', true);

      if (!activeChallenges) return;

      const today = new Date().toISOString().split('T')[0];

      // Get user's progress for today
      const { data: userProgress } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user?.id)
        .eq('challenge_date', today);

      // Create progress map
      const progressMap = new Map(
        userProgress?.map(p => [p.challenge_id, p]) || []
      );

      // Calculate actual progress for each challenge type
      const progressCounts = await calculateProgress();

      // Merge challenges with progress
      const mergedChallenges = activeChallenges.map(challenge => {
        const userChallenge = progressMap.get(challenge.id);
        const actualProgress = progressCounts[challenge.challenge_type] || 0;
        const completed = actualProgress >= challenge.target_count;

        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          challenge_type: challenge.challenge_type,
          target_count: challenge.target_count,
          reward_amount: challenge.reward_amount,
          progress: Math.min(actualProgress, challenge.target_count),
          completed,
          reward_claimed: userChallenge?.reward_claimed || false,
        };
      });

      setChallenges(mergedChallenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const counts: Record<string, number> = {};

    // Listens today
    const { count: listenCount } = await supabase
      .from('listening_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .gte('listened_at', todayISO);
    counts['listen'] = listenCount || 0;

    // Follows today
    const { count: followCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user?.id)
      .gte('created_at', todayISO);
    counts['follow'] = followCount || 0;

    // Votes today
    const { count: voteCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('voter_id', user?.id)
      .gte('created_at', todayISO);
    counts['vote'] = voteCount || 0;

    // Playlist adds today
    const { count: playlistCount } = await supabase
      .from('playlist_tracks')
      .select('*, playlists!inner(*)', { count: 'exact', head: true })
      .eq('playlists.user_id', user?.id)
      .gte('added_at', todayISO);
    counts['playlist'] = playlistCount || 0;

    // Shares today
    const { count: shareCount } = await supabase
      .from('share_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .gte('shared_at', todayISO);
    counts['share'] = shareCount || 0;

    return counts;
  };

  const claimReward = async (challenge: Challenge) => {
    if (!challenge.completed || challenge.reward_claimed) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Upsert user challenge record
      await supabase
        .from('user_challenges')
        .upsert({
          user_id: user?.id,
          challenge_id: challenge.id,
          challenge_date: today,
          progress: challenge.progress,
          completed: true,
          completed_at: new Date().toISOString(),
          reward_claimed: true,
        }, {
          onConflict: 'user_id,challenge_id,challenge_date',
        });

      // Add reward to wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', user?.id)
        .single();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + challenge.reward_amount })
          .eq('id', wallet.id);

        await supabase
          .from('transactions')
          .insert({
            wallet_id: wallet.id,
            amount: challenge.reward_amount,
            type: 'earning',
            description: `Challenge reward: ${challenge.title}`,
          });
      }

      toast.success(`🎉 +${challenge.reward_amount} BAKCoins claimed!`, {
        description: `You completed "${challenge.title}"`,
      });

      fetchChallenges();
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-4 h-4" />
            Daily Challenges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const completedCount = challenges.filter(c => c.completed).length;

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Daily Challenges
            </CardTitle>
            <CardDescription>Complete challenges to earn BAKCoins</CardDescription>
          </div>
          <Badge variant={completedCount === challenges.length ? 'default' : 'secondary'}>
            {completedCount}/{challenges.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.map(challenge => {
          const Icon = CHALLENGE_ICONS[challenge.challenge_type] || Target;
          const progressPercent = (challenge.progress / challenge.target_count) * 100;

          return (
            <div 
              key={challenge.id} 
              className={`p-3 rounded-lg border transition-all ${
                challenge.completed 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-muted/30 border-transparent hover:border-primary/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  challenge.completed 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {challenge.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium text-sm ${
                      challenge.completed ? 'text-green-600 dark:text-green-400' : ''
                    }`}>
                      {challenge.title}
                    </h4>
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      {challenge.reward_amount}
                    </Badge>
                  </div>

                  {challenge.description && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {challenge.description}
                    </p>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {challenge.progress}/{challenge.target_count}
                      </span>
                      {challenge.completed && !challenge.reward_claimed && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-xs text-green-600 hover:text-green-700"
                          onClick={() => claimReward(challenge)}
                        >
                          Claim Reward
                        </Button>
                      )}
                      {challenge.reward_claimed && (
                        <span className="text-xs text-green-500">Claimed ✓</span>
                      )}
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

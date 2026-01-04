import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Gift, Zap } from 'lucide-react';
import { toast } from 'sonner';

export function DailyStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAndUpdateStreak();
    }
  }, [user]);

  const checkAndUpdateStreak = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_login_at, login_streak, longest_streak')
        .eq('id', user?.id)
        .single();

      if (!profile) return;

      const now = new Date();
      const lastLogin = profile.last_login_at ? new Date(profile.last_login_at) : null;
      
      let newStreak = profile.login_streak || 0;
      let newLongest = profile.longest_streak || 0;

      if (lastLogin) {
        const hoursSinceLastLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
        const isSameDay = now.toDateString() === lastLogin.toDateString();
        
        if (!isSameDay) {
          if (hoursSinceLastLogin <= 48) {
            // Continuing streak
            newStreak += 1;
            if (newStreak > newLongest) {
              newLongest = newStreak;
            }
            
            // Streak milestone rewards
            if (newStreak === 7) {
              toast.success('🔥 7-Day Streak! +20 BAKCoins bonus!', {
                description: 'Keep it up for more rewards!',
              });
            } else if (newStreak === 30) {
              toast.success('🏆 30-Day Streak! +100 BAKCoins bonus!', {
                description: "You're a dedicated fan!",
              });
            } else if (newStreak > 1) {
              toast.success(`🔥 ${newStreak}-Day Streak!`, {
                description: 'Come back tomorrow to keep it going!',
              });
            }
          } else {
            // Streak broken
            if (newStreak > 1) {
              toast.info('Streak reset! Start a new one today.', {
                description: `Your longest streak was ${newLongest} days.`,
              });
            }
            newStreak = 1;
          }

          // Update profile
          await supabase
            .from('profiles')
            .update({
              last_login_at: now.toISOString(),
              login_streak: newStreak,
              longest_streak: newLongest,
            })
            .eq('id', user?.id);
        }
      } else {
        // First login
        newStreak = 1;
        newLongest = 1;
        await supabase
          .from('profiles')
          .update({
            last_login_at: now.toISOString(),
            login_streak: 1,
            longest_streak: 1,
          })
          .eq('id', user?.id);
      }

      setStreak(newStreak);
      setLongestStreak(newLongest);
    } catch (error) {
      console.error('Error checking streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  // Only show if user has logged in before
  if (streak === 0) return null;

  const getStreakColor = () => {
    if (streak >= 30) return 'from-purple-500 to-pink-500';
    if (streak >= 7) return 'from-orange-500 to-red-500';
    return 'from-yellow-500 to-orange-500';
  };

  const getStreakMessage = () => {
    if (streak >= 30) return 'Legendary!';
    if (streak >= 14) return 'On Fire!';
    if (streak >= 7) return 'Hot Streak!';
    if (streak >= 3) return 'Keep Going!';
    return "You're Back!";
  };

  return (
    <Card className={`border-0 bg-gradient-to-r ${getStreakColor()} text-white overflow-hidden relative`}>
      <div className="absolute inset-0 bg-black/10" />
      <CardContent className="p-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{streak}</span>
                <span className="text-sm font-medium opacity-90">Day Streak</span>
              </div>
              <p className="text-xs opacity-80">{getStreakMessage()}</p>
            </div>
          </div>

          <div className="text-right">
            {streak >= 7 && (
              <Badge className="bg-white/20 text-white border-0 mb-1">
                <Gift className="w-3 h-3 mr-1" />
                Bonus Active
              </Badge>
            )}
            <p className="text-xs opacity-70">Best: {longestStreak} days</p>
          </div>
        </div>

        {/* Streak progress to next milestone */}
        {streak < 7 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Next reward: 7-day streak</span>
              <span>{7 - streak} days left</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${(streak / 7) * 100}%` }}
              />
            </div>
          </div>
        )}

        {streak >= 7 && streak < 30 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Next reward: 30-day streak</span>
              <span>{30 - streak} days left</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${(streak / 30) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

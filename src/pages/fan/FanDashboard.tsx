import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { CompetitionBanner } from '@/components/CompetitionBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCollection } from '@/components/competition/BadgeCollection';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';
import { DailyStreak } from '@/components/DailyStreak';
import { WeeklyChallenges } from '@/components/WeeklyChallenges';
import { ActivityFeed } from '@/components/ActivityFeed';
import { TrendingTracks } from '@/components/TrendingTracks';
import { ForYouSection } from '@/components/ForYouSection';
import { StatsCard, DashboardHeader, QuickActions, DashboardSkeleton } from '@/components/dashboard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFeaturedCompetition } from '@/hooks/useFeaturedCompetition';
import { Music, Trophy, Heart, Users, Wallet, TrendingUp, Play, Sparkles, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FanDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const featuredCompetition = useFeaturedCompetition(user?.id);
  const [stats, setStats] = useState({
    balance: 0,
    votesCast: 0,
    tracksLiked: 0,
    artistsFollowing: 0,
    playlistsCreated: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();

      // Real-time wallet updates
      const channel = supabase
        .channel('fan_wallet_realtime')
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'wallets',
          filter: `user_id=eq.${user.id}`
        }, () => fetchStats())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [walletResult, votesResult, likesResult, followsResult, playlistsResult] = await Promise.all([
        supabase.from('wallets').select('balance').eq('user_id', user?.id).maybeSingle(),
        supabase.from('votes').select('*', { count: 'exact', head: true }).eq('voter_id', user?.id),
        supabase.from('track_likes').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', user?.id),
        supabase.from('playlists').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
      ]);

      setStats({
        balance: walletResult.data?.balance || 0,
        votesCast: votesResult.count || 0,
        tracksLiked: likesResult.count || 0,
        artistsFollowing: followsResult.count || 0,
        playlistsCreated: playlistsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching fan stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || 'Fan';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-24">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <DashboardSkeleton statsCount={5} />
          ) : (
            <div className="space-y-6">
              <DashboardHeader
                greeting="Welcome Back"
                username={username}
                subtitle="Discover, engage, and support your favorite artists"
              />

              {/* Daily Streak */}
              <DailyStreak />

              {/* Onboarding */}
              <OnboardingChecklist />

              {/* Stats Grid */}
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <StatsCard icon={Wallet} label="BAKCoins" value={stats.balance.toFixed(0)} variant="primary" link="/fan/wallet/buy-coins" />
                <StatsCard icon={Trophy} label="Votes Cast" value={stats.votesCast} variant="secondary" link="/competitions" />
                <StatsCard icon={Heart} label="Tracks Liked" value={stats.tracksLiked} variant="destructive" link="/fan/discover" />
                <StatsCard icon={Users} label="Following" value={stats.artistsFollowing} variant="accent" link="/fan/discover" />
                <StatsCard icon={Music} label="Playlists" value={stats.playlistsCreated} variant="default" link="/fan/playlists" />
              </div>

              {/* Quick Actions */}
              <QuickActions
                columns={5}
                actions={[
                  { icon: Play, label: "Discover", link: "/fan/discover" },
                  { icon: Trophy, label: "Vote", link: "/competitions" },
                  { icon: Headphones, label: "Beats", link: "/beats" },
                  { icon: Wallet, label: "Buy BAK", link: "/fan/wallet/buy-coins" },
                  { icon: Music, label: "Playlists", link: "/fan/playlists" },
                ]}
              />

              {/* Upgrade Banners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-warning/30 bg-gradient-to-r from-warning/5 to-secondary/5">
                  <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-warning/10 flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">Fan Premium</p>
                      <p className="text-xs text-muted-foreground">Voting bonuses, ad-free streaming, exclusive badges</p>
                    </div>
                    <Button onClick={() => navigate('/fan/subscribe')} variant="outline" size="sm" className="flex-shrink-0">Upgrade</Button>
                  </CardContent>
                </Card>
                <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
                  <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">Become an Artist</p>
                      <p className="text-xs text-muted-foreground">Upload music, earn BAKCoins, access analytics</p>
                    </div>
                    <Button onClick={() => navigate('/upgrade')} variant="outline" size="sm" className="flex-shrink-0">Apply</Button>
                  </CardContent>
                </Card>
              </div>

              {/* Featured Competition */}
              {featuredCompetition && (
                <CompetitionBanner
                  competitionId={featuredCompetition.id}
                  title={featuredCompetition.title}
                  coverImage={featuredCompetition.cover_image}
                  prizeAmount={featuredCompetition.prize_amount}
                  endDate={featuredCompetition.end_date}
                  maxSubmissions={featuredCompetition.max_submissions}
                  currentSubmissions={featuredCompetition.submissions?.[0]?.count || 0}
                  ctaText="Vote Now"
                  ctaLink={`/competition/${featuredCompetition.id}`}
                />
              )}

              {/* Discovery & Gamification */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ForYouSection />
                </div>
                <WeeklyChallenges />
              </div>

              {/* Activity & Trending */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TrendingTracks limit={5} />
                <ActivityFeed limit={5} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

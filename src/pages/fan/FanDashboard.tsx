import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { CompetitionBanner } from '@/components/CompetitionBanner';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';
import { DailyStreak } from '@/components/DailyStreak';
import { WeeklyChallenges } from '@/components/WeeklyChallenges';
import { ActivityFeed } from '@/components/ActivityFeed';
import { TrendingTracks } from '@/components/TrendingTracks';
import { ForYouSection } from '@/components/ForYouSection';
import { HeroAction } from '@/components/HeroAction';
import { StatsCard, DashboardHeader, QuickActions, DashboardSkeleton } from '@/components/dashboard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFeaturedCompetition } from '@/hooks/useFeaturedCompetition';
import { Music, Trophy, Heart, Users, Wallet, Play, Headphones } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      const channel = supabase
        .channel('fan_wallet_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, () => fetchStats())
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
            <DashboardSkeleton statsCount={3} />
          ) : (
            <div className="space-y-6">
              <DashboardHeader
                greeting="Welcome Back"
                username={username}
                subtitle="Discover, engage, and support your favorite artists"
              />

              {/* Hero Action — contextual "do this now" */}
              <HeroAction
                icon={Trophy}
                title="Vote for Rising Stars"
                description="Support your favorite artists — every vote counts toward their career."
                actionLabel="Vote Now"
                actionLink="/rising-stars/voting"
                gradient="from-secondary/10 to-primary/5"
              />

              <OnboardingChecklist />

              {/* 3 Primary Stats */}
              <div className="grid gap-3 grid-cols-3">
                <StatsCard icon={Wallet} label="BAKCoins" value={stats.balance.toFixed(0)} variant="primary" link="/fan/wallet/buy-coins" />
                <StatsCard icon={Trophy} label="Votes" value={stats.votesCast} variant="secondary" link="/competitions" />
                <StatsCard icon={Users} label="Following" value={stats.artistsFollowing} variant="accent" link="/fan/discover" />
              </div>

              {/* Quick Actions */}
              <QuickActions
                columns={4}
                actions={[
                  { icon: Play, label: "Discover", link: "/fan/discover" },
                  { icon: Trophy, label: "Vote", link: "/rising-stars/voting" },
                  { icon: Wallet, label: "Buy BAK", link: "/fan/wallet/buy-coins" },
                  { icon: Headphones, label: "Beats", link: "/beats" },
                ]}
              />

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

              {/* Engagement — tabbed for density reduction */}
              <Tabs defaultValue="streak" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="streak">Daily Streak</TabsTrigger>
                  <TabsTrigger value="challenges">Challenges</TabsTrigger>
                </TabsList>
                <TabsContent value="streak"><DailyStreak /></TabsContent>
                <TabsContent value="challenges"><WeeklyChallenges /></TabsContent>
              </Tabs>

              {/* Discovery */}
              <ForYouSection />

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

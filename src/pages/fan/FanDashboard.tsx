import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { CompetitionBanner } from '@/components/CompetitionBanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeCollection } from '@/components/competition/BadgeCollection';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';
import { DailyStreak } from '@/components/DailyStreak';
import { WeeklyChallenges } from '@/components/WeeklyChallenges';
import { ActivityFeed } from '@/components/ActivityFeed';
import { TrendingTracks } from '@/components/TrendingTracks';
import { ForYouSection } from '@/components/ForYouSection';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { Music, Trophy, Heart, Users, Wallet, TrendingUp, Play, Sparkles, MessageCircle } from 'lucide-react';

export default function FanDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    balance: 0,
    votesCast: 0,
    tracksLiked: 0,
    artistsFollowing: 0,
    playlistsCreated: 0,
  });
  const [featuredCompetition, setFeaturedCompetition] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchFeaturedCompetition();
    }
  }, [user]);

  const fetchFeaturedCompetition = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('*, submissions(count)')
      .eq('id', '627488d7-abe5-4469-bb7a-0863225fea34')
      .single();
    
    if (data) {
      setFeaturedCompetition(data);
    }
  };

  const fetchStats = async () => {
    // Fetch wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user?.id)
      .single();

    // Fetch votes cast
    const { count: votesCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('voter_id', user?.id);

    // Fetch tracks liked
    const { count: likesCount } = await supabase
      .from('track_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id);

    // Fetch artists following
    const { count: followsCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user?.id);

    // Fetch playlists created
    const { count: playlistsCount } = await supabase
      .from('playlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id);

    setStats({
      balance: wallet?.balance || 0,
      votesCast: votesCount || 0,
      tracksLiked: likesCount || 0,
      artistsFollowing: followsCount || 0,
      playlistsCreated: playlistsCount || 0,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome Back, Fan! 🎵</h1>
            <p className="text-muted-foreground">
              Discover, engage, and support your favorite artists
            </p>
          </div>

          {/* Daily Streak */}
          <DailyStreak />

          {/* Onboarding Checklist */}
          <OnboardingChecklist />

          {/* Premium Subscription Card */}
          <Card className="border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Fan Premium
                  </h3>
                  <p className="text-muted-foreground">
                    Get voting bonuses, ad-free streaming, and exclusive badges. From just 1 BAK/day!
                  </p>
                </div>
                <Button onClick={() => navigate('/fan/subscribe')} variant="hero" size="lg">
                  View Plans
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade to Artist Banner */}
          <Card className="border-primary/50 bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">Become an Artist</h3>
                  <p className="text-muted-foreground">
                    Upload your own music, earn BAKCoins, and access analytics
                  </p>
                </div>
                <Button onClick={() => navigate('/upgrade')} variant="outline" size="lg">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Featured Competition Banner */}
          {featuredCompetition && (
            <div className="animate-fade-in-up">
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
            </div>
          )}

          {/* What's New Card - Only show enabled features */}
          <Card className="border-green-500/50 bg-green-500/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Music className="h-5 w-5 text-green-500" />
                Fan Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-green-500" />
                  <span>Vote in competitions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span>Follow artists</span>
                </li>
                <li className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-green-500" />
                  <span>Create playlists</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Upgrade to artist anytime</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  BAKCoins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.balance.toFixed(0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Votes Cast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.votesCast}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Tracks Liked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.tracksLiked}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Following
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.artistsFollowing}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Playlists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.playlistsCreated}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <Button onClick={() => navigate('/fan/discover')} variant="outline" className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Discover Music
              </Button>
              <Button onClick={() => navigate('/competitions/active')} variant="outline" className="w-full">
                <Trophy className="mr-2 h-4 w-4" />
                Vote in Competitions
              </Button>
              <Button onClick={() => navigate('/buy-coins')} variant="outline" className="w-full">
                <Wallet className="mr-2 h-4 w-4" />
                Buy BAKCoins
              </Button>
              <Button onClick={() => navigate('/playlists')} variant="outline" className="w-full">
                <Music className="mr-2 h-4 w-4" />
                My Playlists
              </Button>
            </CardContent>
          </Card>

          {/* Gamification & Discovery Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ForYouSection />
            </div>
            <div className="space-y-6">
              <WeeklyChallenges />
            </div>
          </div>

          {/* Activity & Trending */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TrendingTracks limit={5} />
            <ActivityFeed limit={5} />
          </div>
        </div>
      </main>
    </div>
  );
}

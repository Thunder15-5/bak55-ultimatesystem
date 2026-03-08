import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Users, Wallet, Plus, TrendingUp, Music, Award, BarChart3, Target } from 'lucide-react';
import { BrandCampaignManager } from '@/components/BrandCampaignManager';

export default function BrandDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    balance: 0,
    activeCompetitions: 0,
    totalBudget: 0,
    totalSubmissions: 0,
    totalVotes: 0,
  });
  const [recentCompetitions, setRecentCompetitions] = useState<any[]>([]);
  const [trendingArtists, setTrendingArtists] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentCompetitions();
      fetchTrendingArtists();
    }
  }, [user]);

  const fetchStats = async () => {
    // Parallel fetch for independent queries
    const [walletResult, competitionsResult] = await Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', user?.id).single(),
      supabase.from('competitions').select('id, prize_amount', { count: 'exact' }).eq('created_by', user?.id).eq('status', 'active'),
    ]);

    const competitions = competitionsResult.data;
    const compIds = competitions?.map(c => c.id) || [];

    // Second batch - depends on competition IDs
    const [submissionsResult] = await Promise.all([
      compIds.length > 0
        ? supabase.from('submissions').select('id, competition_id').in('competition_id', compIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const submissions = submissionsResult.data || [];
    const subIds = submissions.map(s => s.id);

    const [votesResult] = await Promise.all([
      subIds.length > 0
        ? supabase.from('votes').select('id').in('submission_id', subIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const totalBudget = competitions?.reduce((sum, c) => sum + Number(c.prize_amount), 0) || 0;

    setStats({
      balance: walletResult.data?.balance || 0,
      activeCompetitions: competitionsResult.count || 0,
      totalBudget,
      totalSubmissions: submissions.length,
      totalVotes: votesResult.data?.length || 0,
    });
  };

  const fetchRecentCompetitions = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('id, title, status, prize_amount, created_at')
      .eq('created_by', user?.id)
      .order('created_at', { ascending: false })
      .limit(3);

    setRecentCompetitions(data || []);
  };

  const fetchTrendingArtists = async () => {
    const { data: tracks } = await supabase
      .from('tracks')
      .select('artist_id')
      .eq('moderation_status', 'approved')
      .order('plays', { ascending: false })
      .limit(50);

    const artistIds = [...new Set(tracks?.map(t => t.artist_id))].slice(0, 5);

    const { data: artists } = await supabase
      .from('artist_profiles')
      .select('user_id, stage_name, total_earnings')
      .in('user_id', artistIds);

    setTrendingArtists(artists || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gradient">Brand Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Discover talent, create competitions, and grow your brand
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="inline-flex h-10 p-1 bg-muted/50">
              <TabsTrigger value="overview" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="gap-1.5">
                <Target className="h-3.5 w-3.5" /> Campaigns
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">

          {/* Main Stats Grid */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  BAKCoins Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gradient-primary">{stats.balance.toFixed(0)}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-secondary/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-secondary" />
                  Active Competitions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gradient-secondary">{stats.activeCompetitions}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-accent/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  Total Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalBudget.toFixed(0)} <span className="text-sm text-muted-foreground">BAK</span></div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  Total Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalSubmissions}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-secondary/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-secondary" />
                  Total Votes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalVotes}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <Button onClick={() => navigate('/brand/competitions/create')} variant="hero" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Competition
              </Button>
              <Button onClick={() => navigate('/brand/discover')} variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Discover Artists
              </Button>
              <Button onClick={() => navigate('/beats')} variant="outline" className="w-full">
                <Music className="mr-2 h-4 w-4" />
                Browse Beats
              </Button>
              <Button onClick={() => navigate('/brand/wallet')} variant="outline" className="w-full">
                <Wallet className="mr-2 h-4 w-4" />
                Manage Wallet
              </Button>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Competitions */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-secondary" />
                  Recent Competitions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentCompetitions.length > 0 ? (
                  recentCompetitions.map((comp) => (
                    <div key={comp.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate(`/competition/${comp.id}`)}>
                      <div>
                        <h4 className="font-semibold">{comp.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {comp.prize_amount} BAK • {comp.status}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No competitions yet</p>
                    <Button onClick={() => navigate('/brand/competitions/create')} variant="outline" size="sm" className="mt-3">
                      Create Your First
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trending Artists */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Trending Artists
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingArtists.length > 0 ? (
                  trendingArtists.map((artist) => (
                    <div key={artist.user_id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-accent/30 transition-colors cursor-pointer" onClick={() => navigate(`/artist/${artist.user_id}`)}>
                      <div>
                        <h4 className="font-semibold">{artist.stage_name || 'Artist'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {artist.total_earnings.toFixed(0)} BAK earned
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Discover artists</p>
                    <Button onClick={() => navigate('/brand/discover')} variant="outline" size="sm" className="mt-3">
                      Browse Artists
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Industry Insights - IFPI Verified Data */}
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                African Music Market Insights
                <span className="text-xs text-muted-foreground font-normal ml-2">(IFPI 2025)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-card/50 border border-primary/10">
                <p className="text-2xl font-bold text-primary mb-1">$110M</p>
                <p className="text-sm text-muted-foreground">Sub-Saharan Africa recorded music revenue</p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-secondary/10">
                <p className="text-2xl font-bold text-secondary mb-1">22.6%</p>
                <p className="text-sm text-muted-foreground">Year-over-year growth (fastest globally)</p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-accent/10">
                <p className="text-2xl font-bold text-accent mb-1">$59M</p>
                <p className="text-sm text-muted-foreground">Nigeria & South Africa Spotify payouts</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

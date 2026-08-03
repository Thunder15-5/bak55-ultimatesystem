import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StatsCard, DashboardHeader, QuickActions, DashboardSkeleton } from '@/components/dashboard';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);

  const fetchAll = async () => {
    try {
      await Promise.all([fetchStats(), fetchRecentCompetitions(), fetchTrendingArtists()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const [walletResult, competitionsResult] = await Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', user?.id).maybeSingle(),
      supabase.from('competitions').select('id, prize_amount', { count: 'exact' }).eq('created_by', user?.id).eq('status', 'active'),
    ]);

    const competitions = competitionsResult.data;
    const compIds = competitions?.map(c => c.id) || [];

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

    setStats({
      balance: walletResult.data?.balance || 0,
      activeCompetitions: competitionsResult.count || 0,
      totalBudget: competitions?.reduce((sum, c) => sum + Number(c.prize_amount), 0) || 0,
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
    if (artistIds.length === 0) { setTrendingArtists([]); return; }

    const { data: artists } = await supabase
      .from('artist_profiles')
      .select('user_id, stage_name, total_earnings')
      .in('user_id', artistIds);
    setTrendingArtists(artists || []);
  };

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
                greeting="Brand Hub"
                username="Dashboard"
                subtitle="Discover talent, create competitions, and grow your brand"
              />

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="inline-flex h-9 p-1 bg-muted/50">
                  <TabsTrigger value="overview" className="gap-1.5 text-xs">
                    <BarChart3 className="h-3 w-3" /> Overview
                  </TabsTrigger>
                  <TabsTrigger value="campaigns" className="gap-1.5 text-xs">
                    <Target className="h-3 w-3" /> Campaigns
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Stats */}
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                    <StatsCard icon={Wallet} label="BAKCoins" value={stats.balance.toFixed(0)} variant="primary" />
                    <StatsCard icon={Trophy} label="Active Comps" value={stats.activeCompetitions} variant="secondary" />
                    <StatsCard icon={BarChart3} label="Total Budget" value={`${stats.totalBudget.toFixed(0)} BAK`} variant="accent" />
                    <StatsCard icon={Music} label="Submissions" value={stats.totalSubmissions} variant="primary" />
                    <StatsCard icon={Award} label="Votes" value={stats.totalVotes} variant="secondary" />
                  </div>

                  {/* Quick Actions */}
                  <QuickActions
                    columns={4}
                    actions={[
                      { icon: Plus, label: "Create Competition", link: "/brand/competitions/create", variant: "hero" },
                      { icon: Users, label: "Discover Artists", link: "/brand/discover" },
                      { icon: Music, label: "Browse Beats", link: "/beats" },
                      { icon: Wallet, label: "Manage Wallet", link: "/brand/wallet" },
                    ]}
                  />

                  {/* Two Column */}
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-secondary" /> Recent Competitions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {recentCompetitions.length > 0 ? (
                          recentCompetitions.map((comp) => (
                            <div key={comp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/competition/${comp.id}`)}>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-sm truncate">{comp.title}</h4>
                                <p className="text-xs text-muted-foreground">{comp.prize_amount} BAK • {comp.status}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="text-xs">View</Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No competitions yet</p>
                            <Button onClick={() => navigate('/brand/competitions/create')} variant="outline" size="sm" className="mt-2 text-xs">Create First</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-accent" /> Trending Artists
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {trendingArtists.length > 0 ? (
                          trendingArtists.map((artist) => (
                            <div key={artist.user_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/artist/${artist.user_id}`)}>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-sm truncate">{artist.stage_name || 'Artist'}</h4>
                                <p className="text-xs text-muted-foreground">{artist.total_earnings?.toFixed(0) || 0} BAK earned</p>
                              </div>
                              <Button variant="ghost" size="sm" className="text-xs">View</Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Discover artists</p>
                            <Button onClick={() => navigate('/brand/discover')} variant="outline" size="sm" className="mt-2 text-xs">Browse</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Platform snapshot — live data only */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        BAK55 platform snapshot
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LiveStatsRow />
                    </CardContent>
                  </Card>

                </TabsContent>

                <TabsContent value="campaigns">
                  <BrandCampaignManager />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

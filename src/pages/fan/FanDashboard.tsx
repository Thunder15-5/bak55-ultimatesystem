import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { HeroAction } from '@/components/HeroAction';
import { StatsCard, DashboardHeader, QuickActions, DashboardSkeleton } from '@/components/dashboard';
import { ActiveCompetitionCard } from '@/components/dashboard/ActiveCompetitionCard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Heart, Users, Wallet, Play, Headphones,
  Music, TrendingUp, ArrowRight, Sparkles, Clock
} from 'lucide-react';

export default function FanDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    balance: 0,
    votesCast: 0,
    tracksLiked: 0,
    artistsFollowing: 0,
  });
  const [recentVotes, setRecentVotes] = useState<any[]>([]);
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
      const [walletResult, votesResult, likesResult, followsResult, recentVotesResult] = await Promise.all([
        supabase.from('wallets').select('balance').eq('user_id', user?.id).maybeSingle(),
        supabase.from('votes').select('*', { count: 'exact', head: true }).eq('voter_id', user?.id),
        supabase.from('track_likes').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', user?.id),
        supabase.from('votes').select('id, created_at, submission_id').eq('voter_id', user?.id).order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({
        balance: walletResult.data?.balance || 0,
        votesCast: votesResult.count || 0,
        tracksLiked: likesResult.count || 0,
        artistsFollowing: followsResult.count || 0,
      });
      setRecentVotes(recentVotesResult.data || []);
    } catch (error) {
      console.error('Error fetching fan stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || 'Fan';

  const getHeroAction = () => {
    if (stats.votesCast === 0) {
      return {
        icon: Trophy,
        title: "Cast Your First Vote",
        description: "Support rising artists — every vote sends BAKCoins directly to them.",
        actionLabel: "Vote Now",
        actionLink: "/rising-stars/voting",
      };
    }
    if (stats.artistsFollowing === 0) {
      return {
        icon: Users,
        title: "Discover Artists to Follow",
        description: "Find your next favorite African artist and support their journey.",
        actionLabel: "Explore",
        actionLink: "/fan/discover",
      };
    }
    return null;
  };

  const heroAction = getHeroAction();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-24">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <DashboardSkeleton statsCount={4} />
          ) : (
            <div className="space-y-5">
              <DashboardHeader
                greeting="Welcome Back"
                username={username}
                subtitle="Discover and support Africa's rising talent"
                actions={[
                  { label: "Vote Now", icon: Trophy, variant: "hero" as any, onClick: () => navigate("/rising-stars/voting") },
                ]}
              />

              {/* Contextual Hero Action */}
              {heroAction && (
                <HeroAction
                  icon={heroAction.icon}
                  title={heroAction.title}
                  description={heroAction.description}
                  actionLabel={heroAction.actionLabel}
                  actionLink={heroAction.actionLink}
                />
              )}

              {/* 4 Primary Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatsCard icon={Wallet} label="BAKCoins" value={stats.balance.toFixed(0)} variant="primary" link="/fan/wallet/buy-coins" />
                <StatsCard icon={Trophy} label="Votes Cast" value={stats.votesCast} variant="secondary" link="/rising-stars/voting" />
                <StatsCard icon={Heart} label="Liked" value={stats.tracksLiked} variant="accent" link="/fan/discover" />
                <StatsCard icon={Users} label="Following" value={stats.artistsFollowing} variant="success" link="/fan/discover" />
              </div>

              {/* Active Competition — vote CTA */}
              <ActiveCompetitionCard userId={user?.id || ""} />

              {/* Quick Actions */}
              <QuickActions
                columns={4}
                actions={[
                  { icon: Play, label: "Discover", link: "/fan/discover" },
                  { icon: Trophy, label: "Vote", link: "/rising-stars/voting", variant: "hero" },
                  { icon: Wallet, label: "Buy BAK", link: "/fan/wallet/buy-coins" },
                  { icon: Headphones, label: "Beats", link: "/beats" },
                ]}
              />

              {/* Recent Activity + Discover */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Recent Activity
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentVotes.length > 0 ? (
                      <div className="space-y-2">
                        {recentVotes.map((vote, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Heart className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">Voted for an artist</p>
                              <p className="text-xs text-muted-foreground">{new Date(vote.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">-1 BAK</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4 text-sm">
                        Your voting activity will appear here
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Why Vote?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TrendingUp className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Support Artists Directly</p>
                        <p className="text-xs text-muted-foreground">65% of every vote goes straight to the artist</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Trophy className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Shape Careers</p>
                        <p className="text-xs text-muted-foreground">Your votes determine competition winners</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Music className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Discover First</p>
                        <p className="text-xs text-muted-foreground">Be the first to find Africa's next big star</p>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-2"
                      size="sm"
                      onClick={() => navigate("/rising-stars/voting")}
                    >
                      Start Voting <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

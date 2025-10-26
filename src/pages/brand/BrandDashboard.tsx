import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Users, Wallet, Plus } from 'lucide-react';

export default function BrandDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    balance: 0,
    activeCompetitions: 0,
    totalBudget: 0,
  });

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user?.id)
      .single();

    const { data: competitions, count } = await supabase
      .from('competitions')
      .select('prize_amount', { count: 'exact' })
      .eq('created_by', user?.id)
      .eq('status', 'active');

    const totalBudget = competitions?.reduce((sum, c) => sum + Number(c.prize_amount), 0) || 0;

    setStats({
      balance: wallet?.balance || 0,
      activeCompetitions: count || 0,
      totalBudget,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Brand Dashboard 🏢</h1>
            <p className="text-muted-foreground">
              Discover talent and create competitions
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  BAKCoins Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.balance.toFixed(0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Active Competitions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.activeCompetitions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalBudget.toFixed(0)} BAK</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Button onClick={() => navigate('/admin/create-competition')} variant="hero" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Competition
              </Button>
              <Button onClick={() => navigate('/streaming')} variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Discover Artists
              </Button>
              <Button onClick={() => navigate('/wallet/buy-coins')} variant="outline" className="w-full">
                <Wallet className="mr-2 h-4 w-4" />
                Buy BAKCoins
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

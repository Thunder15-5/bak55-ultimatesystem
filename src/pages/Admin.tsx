import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';

export default function Admin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArtists: 0,
    totalCompetitions: 0,
    totalCoins: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: artistCount } = await supabase
      .from('artist_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: compCount } = await supabase
      .from('competitions')
      .select('*', { count: 'exact', head: true });

    const { data: wallets } = await supabase
      .from('wallets')
      .select('balance');
    
    const totalCoins = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0;

    setStats({
      totalUsers: userCount || 0,
      totalArtists: artistCount || 0,
      totalCompetitions: compCount || 0,
      totalCoins,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-gradient mb-8">Admin Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-primary mb-2">Total Users</h2>
            <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-bold text-secondary mb-2">Total Artists</h2>
            <p className="text-3xl font-bold text-foreground">{stats.totalArtists}</p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-bold text-accent mb-2">Competitions</h2>
            <p className="text-3xl font-bold text-foreground">{stats.totalCompetitions}</p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-bold text-primary mb-2">Total BAKCoins</h2>
            <p className="text-3xl font-bold text-foreground">{stats.totalCoins}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

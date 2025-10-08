import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .single();
    setProfile(profileData);

    // Fetch role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user!.id)
      .single();
    setRole(roleData?.role || '');

    // Fetch wallet
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user!.id)
      .single();
    setWallet(walletData);

    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-gradient mb-8">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-primary mb-2">Profile</h2>
            <p className="text-foreground">Username: {profile?.username}</p>
            <p className="text-foreground">Email: {profile?.email}</p>
            <p className="text-foreground">Role: {role}</p>
          </Card>
          <Card className="p-6">
            <h2 className="text-xl font-bold text-secondary mb-2">Wallet</h2>
            <p className="text-2xl font-bold text-gradient">{wallet?.balance || 0} BAKCoins</p>
          </Card>
          <Card className="p-6">
            <h2 className="text-xl font-bold text-accent mb-2">Quick Stats</h2>
            <p className="text-foreground">Member since: {new Date(profile?.created_at).toLocaleDateString()}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

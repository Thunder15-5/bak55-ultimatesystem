import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Music, TrendingUp } from 'lucide-react';

export default function Upgrade() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(false);
  const [stageName, setStageName] = useState('');

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !stageName) return;

    setUpgrading(true);

    try {
      const { data, error } = await supabase.functions.invoke('upgrade-to-artist', {
        body: { stageName }
      });

      if (error) throw error;

      toast.success('Congratulations! You are now an artist!');
      window.location.href = '/artist/dashboard';
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || 'Failed to upgrade account');
    } finally {
      setUpgrading(false);
    }
  };

  if (userRole === 'artist' || userRole === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <Music className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">You're Already an Artist!</h2>
              <p className="text-muted-foreground mb-6">
                You have full access to all artist features.
              </p>
              <Button onClick={() => navigate('/artist/dashboard')} variant="hero">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Upgrade to Artist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpgrade} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="stageName">Choose Your Stage Name</Label>
                <Input
                  id="stageName"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  placeholder="e.g., DJ Maestro, MC Flow"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is how fans will see you on the platform
                </p>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={upgrading}>
                {upgrading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Music className="mr-2 h-4 w-4" />
                    Complete Upgrade
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

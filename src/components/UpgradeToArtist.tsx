import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Music, BarChart, DollarSign, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UpgradeToArtist() {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Upgrade to Artist Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground">
          Unlock the full potential of BAK55 by becoming an artist. Start earning from your music today!
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Upload unlimited tracks</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Earn BAKCoins from plays & tips</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Access detailed analytics</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Compete for prizes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Withdraw earnings</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Build your fanbase</span>
            </div>
          </div>
        </div>

        <Button onClick={() => navigate('/upgrade')} variant="hero" size="lg" className="w-full">
          <Music className="mr-2 h-4 w-4" />
          Upgrade Now - It's Free!
        </Button>
      </CardContent>
    </Card>
  );
}

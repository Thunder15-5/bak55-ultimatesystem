import { Card } from '@/components/ui/card';
import { Music } from 'lucide-react';

export default function ArtistDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-8">Artist Dashboard</h1>

        <Card className="p-12 text-center">
          <Music className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-semibold mb-2">Welcome Artist!</h2>
          <p className="text-muted-foreground">Your dashboard is being prepared</p>
        </Card>
      </div>
    </div>
  );
}

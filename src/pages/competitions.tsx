import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function CompetitionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Active Competitions</h1>
          <p className="text-xl text-muted-foreground">Browse and join music competitions</p>
        </div>

        <Card className="p-12 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">Competitions feature is under development</p>
        </Card>
      </div>
    </div>
  );
}

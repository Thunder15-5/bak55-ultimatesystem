import { Card } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function ArtistSubscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-8">Subscription</h1>

        <Card className="p-12 text-center">
          <CreditCard className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-semibold mb-2">Manage Subscription</h2>
          <p className="text-muted-foreground">Subscription management coming soon</p>
        </Card>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, Trophy, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">BAK55</h1>
        <nav className="flex gap-4">
          <Button variant="ghost" asChild>
            <Link to="/competitions">Competitions</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/pricing">Pricing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <h2 className="text-5xl font-bold tracking-tight">
            Connect Artists, Brands & Fans Through Music
          </h2>
          <p className="text-xl text-muted-foreground">
            AI-powered talent discovery platform for music competitions
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/register">Start Competing</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/competitions">Browse Competitions</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 rounded-lg bg-card">
              <Music className="h-12 w-12 mb-4 mx-auto text-primary" />
              <h3 className="text-xl font-semibold mb-2">For Artists</h3>
              <p className="text-muted-foreground">
                Showcase your talent, compete in challenges, and get discovered
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card">
              <Trophy className="h-12 w-12 mb-4 mx-auto text-primary" />
              <h3 className="text-xl font-semibold mb-2">For Brands</h3>
              <p className="text-muted-foreground">
                Create campaigns, discover talent, and engage your audience
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card">
              <Users className="h-12 w-12 mb-4 mx-auto text-primary" />
              <h3 className="text-xl font-semibold mb-2">For Fans</h3>
              <p className="text-muted-foreground">
                Vote for favorites, discover new music, and support artists
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

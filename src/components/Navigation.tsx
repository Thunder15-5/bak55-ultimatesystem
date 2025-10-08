import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const { user, signOut } = useAuth();

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="text-2xl font-bold text-gradient">
          BAK55 Talent
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link to="/tracks" className="text-foreground hover:text-primary transition-colors">
            Tracks
          </Link>
          <Link to="/competitions" className="text-foreground hover:text-primary transition-colors">
            Competitions
          </Link>
          <Link to="/wallet" className="text-foreground hover:text-primary transition-colors">
            Wallet
          </Link>
          <Link to="/profile" className="text-foreground hover:text-primary transition-colors">
            Profile
          </Link>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}

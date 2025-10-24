import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { Menu, X, LogOut, User, Wallet, History, ListMusic, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/bak55-logo.png";

export function Navigation() {
  const { user, signOut, userRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (user && userRole === 'artist') {
      fetchSubscription();
    }
  }, [user, userRole]);

  const fetchSubscription = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (data) {
      setSubscription(data);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-primary/10 shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logoImage} alt="BAK55 Talent" className="h-10 w-auto group-hover:scale-110 transition-transform" />
            <span className="text-xl md:text-2xl font-heading font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              BAK55 Talent
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/dashboard" className="text-foreground hover:text-primary transition-all relative group">
                  <span>Dashboard</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>
                {userRole === "artist" && (
                  <Link to="/subscribe" className="text-foreground hover:text-primary transition-colors">
                    Subscription
                  </Link>
                )}
                <Link to={userRole === 'fan' ? '/streaming' : '/catalog'} className="text-foreground hover:text-primary transition-all relative group">
                  <span>{userRole === 'fan' ? 'Discover Music' : 'Music'}</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>
                {userRole === "artist" && (
                  <Link to="/upload" className="text-foreground hover:text-primary transition-colors">
                    Upload
                  </Link>
                )}
                <Link to="/competitions" className="text-foreground hover:text-primary transition-colors">
                  About Competitions
                </Link>
                <Link to="/competitions/active" className="text-foreground hover:text-primary transition-colors">
                  Active Competitions
                </Link>
                <Link to="/playlists" className="text-foreground hover:text-primary transition-colors">
                  <ListMusic className="w-4 h-4 inline mr-1" />
                  Playlists
                </Link>
                <Link to="/history" className="text-foreground hover:text-primary transition-colors">
                  <History className="w-4 h-4 inline mr-1" />
                  History
                </Link>
                <Link to="/wallet" className="text-foreground hover:text-primary transition-colors">
                  <Wallet className="w-4 h-4 inline mr-1" />
                  Wallet
                </Link>
                <NotificationBell />
                {subscription && userRole === "artist" && (
                  <SubscriptionBadge planName={subscription.subscription_plans.name} />
                )}
                {userRole === "admin" && (
                  <Link to="/admin">
                    <Button variant="hero" size="sm" className="shadow-lg">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/streaming" className="text-foreground hover:text-primary transition-colors">
                  Streaming
                </Link>
                <Link to="/competitions" className="text-foreground hover:text-primary transition-colors">
                  About Competitions
                </Link>
                <Link to="/competitions/active" className="text-foreground hover:text-primary transition-colors">
                  Active Competitions
                </Link>
                <Link to="/bakcoins" className="text-foreground hover:text-primary transition-colors">
                  BAKCoins
                </Link>
                <Link to="/ai-tools" className="text-foreground hover:text-primary transition-colors">
                  AI Tools
                </Link>
                <Link to="/about" className="text-foreground hover:text-primary transition-colors">
                  About
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="hero" size="sm">
                    Join Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to={userRole === 'fan' ? '/streaming' : '/catalog'}
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {userRole === 'fan' ? 'Discover Music' : 'Music'}
                </Link>
                {userRole === "artist" && (
                  <Link
                    to="/upload"
                    className="block py-2 text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Upload
                  </Link>
                )}
                <Link
                  to="/competitions"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  About Competitions
                </Link>
                <Link
                  to="/competitions/active"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Active Competitions
                </Link>
                <Link
                  to="/wallet"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Wallet
                </Link>
                <Link
                  to="/profile"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                {userRole === "admin" && (
                  <Link
                    to="/admin"
                    className="block py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Admin Panel
                  </Link>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/streaming"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Streaming
                </Link>
                <Link
                  to="/competitions"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  About Competitions
                </Link>
                <Link
                  to="/competitions/active"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Active Competitions
                </Link>
                <Link
                  to="/bakcoins"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  BAKCoins
                </Link>
                <Link
                  to="/ai-tools"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  AI Tools
                </Link>
                <Link
                  to="/about"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full mb-2">
                    Login
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsOpen(false)}>
                  <Button variant="hero" className="w-full">
                    Join Now
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

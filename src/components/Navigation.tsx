import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeNotifications } from "@/components/RealtimeNotifications";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { Menu, X, LogOut, User, Wallet, History, ListMusic, BarChart3, TrendingUp, Trophy, Radio } from "lucide-react";
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
      .maybeSingle();

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
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {/* Fan Navigation */}
                {userRole === 'fan' && (
                  <>
                    <Link to="/fan/dashboard">
                      <Button variant="ghost" size="sm">Dashboard</Button>
                    </Link>
                    <Link to="/fan/discover">
                      <Button variant="ghost" size="sm">Discover</Button>
                    </Link>
                    <Link to="/fan/competitions/active">
                      <Button variant="ghost" size="sm" className="relative">
                        Competitions
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                      </Button>
                    </Link>
                    <Link to="/fan/playlists">
                      <Button variant="ghost" size="sm">Playlists</Button>
                    </Link>
                    <Link to="/fan/wallet">
                      <Button variant="ghost" size="sm">Wallet</Button>
                    </Link>
                    <Link to="/leaderboard">
                      <Button variant="ghost" size="sm">
                        <Trophy className="mr-1 h-3 w-3" />
                        Leaderboard
                      </Button>
                    </Link>
                    <Link to="/live-streams">
                      <Button variant="ghost" size="sm">
                        <Radio className="mr-1 h-3 w-3" />
                        Live Streams
                      </Button>
                    </Link>
                    <Link to="/upgrade">
                      <Button variant="hero" size="sm" className="ml-2">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Upgrade to Artist
                      </Button>
                    </Link>
                  </>
                )}

                {/* Artist Navigation */}
                {userRole === 'artist' && (
                  <>
                    <Link to="/artist/dashboard">
                      <Button variant="ghost" size="sm">Dashboard</Button>
                    </Link>
                    <Link to="/artist/upload">
                      <Button variant="ghost" size="sm">Upload</Button>
                    </Link>
                    <Link to="/artist/catalog">
                      <Button variant="ghost" size="sm">My Music</Button>
                    </Link>
                    <Link to="/artist/discover">
                      <Button variant="ghost" size="sm">Browse</Button>
                    </Link>
                    <Link to="/artist/analytics">
                      <Button variant="ghost" size="sm">Analytics</Button>
                    </Link>
                    <Link to="/artist/competitions">
                      <Button variant="ghost" size="sm" className="relative">
                        Competitions
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                      </Button>
                    </Link>
                    <Link to="/artist/wallet">
                      <Button variant="ghost" size="sm">Wallet</Button>
                    </Link>
                    <Link to="/leaderboard">
                      <Button variant="ghost" size="sm">
                        <Trophy className="mr-1 h-3 w-3" />
                        Leaderboard
                      </Button>
                    </Link>
                    <Link to="/live-streams">
                      <Button variant="ghost" size="sm">
                        <Radio className="mr-1 h-3 w-3" />
                        Live Streams
                      </Button>
                    </Link>
                    {subscription && <SubscriptionBadge planName={subscription.subscription_plans.name} />}
                  </>
                )}

                {/* Brand Navigation */}
                {userRole === 'brand' && (
                  <>
                    <Link to="/brand/dashboard">
                      <Button variant="ghost" size="sm">Dashboard</Button>
                    </Link>
                    <Link to="/brand/discover">
                      <Button variant="ghost" size="sm">Discover Artists</Button>
                    </Link>
                    <Link to="/brand/competitions">
                      <Button variant="ghost" size="sm">My Competitions</Button>
                    </Link>
                    <Link to="/brand/competitions/create">
                      <Button variant="ghost" size="sm">Create Competition</Button>
                    </Link>
                    <Link to="/brand/wallet">
                      <Button variant="ghost" size="sm">Wallet</Button>
                    </Link>
                  </>
                )}

                {/* Admin Navigation */}
                {userRole === 'admin' && (
                  <>
                    <Link to="/admin">
                      <Button variant="ghost" size="sm">Dashboard</Button>
                    </Link>
                    <Link to="/admin/streaming">
                      <Button variant="ghost" size="sm">Streaming</Button>
                    </Link>
                    <Link to="/admin/wallet">
                      <Button variant="ghost" size="sm">Wallet</Button>
                    </Link>
                  </>
                )}

                {/* Common Actions */}
                <RealtimeNotifications />
                <Link to={`/${userRole}/profile`}>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
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
                <Link to="/competitions/active" className="text-foreground hover:text-primary transition-colors relative inline-flex items-center gap-1">
                  Active Competitions
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
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
                <Link to="/blog" className="text-foreground hover:text-primary transition-colors">
                  Blog
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
                {/* Fan Mobile Navigation */}
                {userRole === 'fan' && (
                  <>
                    <Link to="/fan/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                    </Link>
                    <Link to="/fan/discover" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Discover</Button>
                    </Link>
                    <Link to="/fan/competitions/active" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Competitions</Button>
                    </Link>
                    <Link to="/fan/playlists" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Playlists</Button>
                    </Link>
                    <Link to="/fan/wallet" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Wallet</Button>
                    </Link>
                    <Link to="/upgrade" onClick={() => setIsOpen(false)}>
                      <Button variant="hero" className="w-full">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Upgrade to Artist
                      </Button>
                    </Link>
                  </>
                )}

                {/* Artist Mobile Navigation */}
                {userRole === 'artist' && (
                  <>
                    <Link to="/artist/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                    </Link>
                    <Link to="/artist/upload" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Upload</Button>
                    </Link>
                    <Link to="/artist/catalog" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">My Music</Button>
                    </Link>
                    <Link to="/artist/discover" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Browse</Button>
                    </Link>
                    <Link to="/artist/analytics" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Analytics</Button>
                    </Link>
                    <Link to="/artist/competitions" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Competitions</Button>
                    </Link>
                    <Link to="/artist/wallet" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Wallet</Button>
                    </Link>
                    {subscription && <SubscriptionBadge planName={subscription.subscription_plans.name} />}
                  </>
                )}

                {/* Brand Mobile Navigation */}
                {userRole === 'brand' && (
                  <>
                    <Link to="/brand/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                    </Link>
                    <Link to="/brand/discover" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Discover Artists</Button>
                    </Link>
                    <Link to="/brand/competitions" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">My Competitions</Button>
                    </Link>
                    <Link to="/brand/competitions/create" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Create Competition</Button>
                    </Link>
                    <Link to="/brand/wallet" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Wallet</Button>
                    </Link>
                  </>
                )}

                {/* Admin Mobile Navigation */}
                {userRole === 'admin' && (
                  <>
                    <Link to="/admin" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                    </Link>
                    <Link to="/admin/streaming" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Streaming</Button>
                    </Link>
                    <Link to="/admin/wallet" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Wallet</Button>
                    </Link>
                  </>
                )}

                <Link to={`/${userRole}/profile`} onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Profile</Button>
                </Link>
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
                <Link
                  to="/blog"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Blog
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

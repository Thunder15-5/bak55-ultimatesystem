import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeNotifications } from "@/components/RealtimeNotifications";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { GlobalSearch } from "@/components/GlobalSearch";
import { CurrencySelector } from "@/components/CurrencySelector";
import {
  Menu, X, LogOut, User, ChevronDown,
  BarChart3, ListMusic, Trophy, Radio, Headphones, History, Music
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const logoImage = "/bak55-logo.png";

function NavLink({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + "/");
  return (
    <Link to={to}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "text-sm",
          active && "bg-primary/10 text-primary font-semibold",
          className
        )}
      >
        {children}
      </Button>
    </Link>
  );
}

export function Navigation() {
  const { user, signOut, userRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (user && userRole === 'artist') {
      supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()
        .then(({ data }) => { if (data) setSubscription(data); });
    }
  }, [user, userRole]);

  const rolePrefix = userRole || 'fan';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-primary/10 shadow-sm">
      <nav className="container mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logoImage} alt="BAK55 Talent" className="h-9 w-auto group-hover:scale-105 transition-transform" />
            <span className="text-lg md:text-xl font-heading font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              BAK55
            </span>
          </Link>

          {/* Desktop Navigation — max 5 primary + overflow */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {/* Fan: Home, Discover, Vote, Wallet, [More] */}
                {userRole === 'fan' && (
                  <>
                    <NavLink to="/fan/dashboard">Home</NavLink>
                    <NavLink to="/fan/discover">Discover</NavLink>
                    <NavLink to="/rising-stars/voting">Vote</NavLink>
                    <NavLink to="/fan/wallet">Wallet</NavLink>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-sm">
                          More <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild><Link to="/fan/playlists" className="flex items-center gap-2"><ListMusic className="w-4 h-4" /> Playlists</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/fan/history" className="flex items-center gap-2"><History className="w-4 h-4" /> Listening History</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/fan/competitions/active" className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Competitions</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/leaderboard" className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Leaderboard</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/live-streams" className="flex items-center gap-2"><Radio className="w-4 h-4" /> Live Streams</Link></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}

                {/* Artist: Home, Upload, My Music, Wallet, [More] */}
                {userRole === 'artist' && (
                  <>
                    <NavLink to="/artist/dashboard">Home</NavLink>
                    <NavLink to="/artist/upload">Upload</NavLink>
                    <NavLink to="/artist/catalog">My Music</NavLink>
                    <NavLink to="/artist/wallet">Wallet</NavLink>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-sm">
                          More <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild><Link to="/artist/analytics" className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Analytics</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/artist/competitions" className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Competitions</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/beats" className="flex items-center gap-2"><Headphones className="w-4 h-4" /> Beats</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/leaderboard" className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Leaderboard</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/live-streams" className="flex items-center gap-2"><Radio className="w-4 h-4" /> Live Streams</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/artist/course" className="flex items-center gap-2"><Music className="w-4 h-4" /> Artist Course</Link></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {subscription && <SubscriptionBadge planName={subscription.subscription_plans.name} />}
                  </>
                )}

                {/* Brand */}
                {userRole === 'brand' && (
                  <>
                    <NavLink to="/brand/dashboard">Home</NavLink>
                    <NavLink to="/brand/discover">Discover</NavLink>
                    <NavLink to="/brand/competitions">Competitions</NavLink>
                    <NavLink to="/brand/wallet">Wallet</NavLink>
                  </>
                )}

                {/* Producer */}
                {userRole === 'producer' && (
                  <>
                    <NavLink to="/producer/dashboard">Home</NavLink>
                    <NavLink to="/producer/upload">Upload</NavLink>
                    <NavLink to="/producer/catalog">My Beats</NavLink>
                    <NavLink to="/producer/wallet">Wallet</NavLink>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-sm">
                          More <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild><Link to="/producer/discover" className="flex items-center gap-2">Browse</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/producer/collaborations" className="flex items-center gap-2">Collaborations</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/producer/competitions" className="flex items-center gap-2">Competitions</Link></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}

                {/* Admin */}
                {userRole === 'admin' && (
                  <>
                    <NavLink to="/admin">Dashboard</NavLink>
                    <NavLink to="/admin/streaming">Streaming</NavLink>
                    <NavLink to="/admin/wallet">Wallet</NavLink>
                  </>
                )}

                {/* Common */}
                <CurrencySelector variant="compact" />
                <GlobalSearch />
                <RealtimeNotifications />
                <Link to={`/${rolePrefix}/profile`}>
                  <Button variant="ghost" size="sm"><User className="h-4 w-4" /></Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/about">About</NavLink>
                <NavLink to="/competitions">Competitions</NavLink>
                <NavLink to="/streaming">Music</NavLink>
                <NavLink to="/bakcoins">BAKCoins</NavLink>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-sm">
                      More <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild><Link to="/beats">Browse Beats</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/ai-tools">AI Tools</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/blog">Blog</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/rising-stars/voting">Vote Now 🔥</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="hero" size="sm">Join Free</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            {user ? (
              <>
                {userRole === 'fan' && (
                  <>
                    <MobileLink to="/fan/competitions/active" label="Competitions" icon={Trophy} onClick={() => setIsOpen(false)} />
                    <MobileLink to="/fan/playlists" label="Playlists" icon={ListMusic} onClick={() => setIsOpen(false)} />
                    <MobileLink to="/fan/history" label="Listening History" icon={History} onClick={() => setIsOpen(false)} />
                    <MobileLink to="/leaderboard" label="Leaderboard" icon={Trophy} onClick={() => setIsOpen(false)} />
                  </>
                )}
                {userRole === 'artist' && (
                  <>
                    <MobileLink to="/artist/analytics" label="Analytics" icon={BarChart3} onClick={() => setIsOpen(false)} />
                    <MobileLink to="/artist/competitions" label="Competitions" icon={Trophy} onClick={() => setIsOpen(false)} />
                    <MobileLink to="/leaderboard" label="Leaderboard" icon={Trophy} onClick={() => setIsOpen(false)} />
                    <MobileLink to="/artist/course" label="Artist Course" icon={Music} onClick={() => setIsOpen(false)} />
                    {subscription && <SubscriptionBadge planName={subscription.subscription_plans.name} />}
                  </>
                )}
                {userRole === 'brand' && (
                  <>
                    <MobileLink to="/brand/competitions" label="My Competitions" icon={Trophy} onClick={() => setIsOpen(false)} />
                    <MobileLink to="/brand/competitions/create" label="Create Competition" icon={Trophy} onClick={() => setIsOpen(false)} />
                  </>
                )}
                {userRole === 'producer' && (
                  <>
                    <MobileLink to="/producer/catalog" label="My Beats" icon={Headphones} onClick={() => setIsOpen(false)} />
                    <MobileLink to="/producer/collaborations" label="Collaborations" icon={Music} onClick={() => setIsOpen(false)} />
                  </>
                )}
                {userRole === 'admin' && (
                  <>
                    <MobileLink to="/admin/deposits" label="Deposits" icon={Music} onClick={() => setIsOpen(false)} />
                    <MobileLink to="/admin/vouchers" label="Vouchers" icon={Music} onClick={() => setIsOpen(false)} />
                  </>
                )}
                <div className="border-t border-primary/10 pt-3 mt-3">
                  <Button variant="outline" className="w-full" onClick={() => { signOut(); setIsOpen(false); }}>
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <MobileTextLink to="/about" label="About" onClick={() => setIsOpen(false)} />
                <MobileTextLink to="/competitions" label="Competitions" onClick={() => setIsOpen(false)} />
                <MobileTextLink to="/streaming" label="Music" onClick={() => setIsOpen(false)} />
                <MobileTextLink to="/bakcoins" label="BAKCoins" onClick={() => setIsOpen(false)} />
                <MobileTextLink to="/blog" label="Blog" onClick={() => setIsOpen(false)} />
                <MobileTextLink to="/rising-stars/voting" label="🗳️ Vote Now" onClick={() => setIsOpen(false)} className="text-primary font-semibold" />
                <div className="space-y-2 pt-3">
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full mb-2">Login</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)}>
                    <Button variant="hero" className="w-full">Join Free</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

function MobileLink({ to, label, icon: Icon, onClick }: { to: string; label: string; icon: any; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick}>
      <Button variant="ghost" className="w-full justify-start">
        <Icon className="mr-2 h-4 w-4" /> {label}
      </Button>
    </Link>
  );
}

function MobileTextLink({ to, label, onClick, className }: { to: string; label: string; onClick: () => void; className?: string }) {
  return (
    <Link to={to} className={cn("block py-2 text-foreground hover:text-primary transition-colors", className)} onClick={onClick}>
      {label}
    </Link>
  );
}

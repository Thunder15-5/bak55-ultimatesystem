import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { Menu, X, LogOut, User, Wallet, Music, History, ListMusic } from "lucide-react";
import { useState } from "react";

export function Navigation() {
  const { user, signOut, userRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/10">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              BAK55
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/catalog" className="text-foreground hover:text-primary transition-colors">
                  Music
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
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                {userRole === "admin" && (
                  <Link to="/admin">
                    <Button variant="secondary" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
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
                  to="/catalog"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Music
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
                    className="block py-2 text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin
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

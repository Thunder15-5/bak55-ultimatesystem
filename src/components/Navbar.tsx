import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import logo from "@/assets/bak55-logo.png";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-primary/20 shadow-lg">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <img 
              src={logo} 
              alt="BAK55 Talent" 
              className="h-8 sm:h-10 md:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            <Link to="/streaming" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              Streaming
            </Link>
            <Link to="/competitions" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              Competitions
            </Link>
            <Link to="/bakcoins" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              BAKCoins
            </Link>
            <Link to="/ai-tools" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              AI Tools
            </Link>
            <Link to="/about" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              About
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="default" className="hidden xl:inline-flex">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="gradient" size="default">
                Join as Artist
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 space-y-2 border-t border-primary/20 animate-fade-in bg-background/95 backdrop-blur-xl">
            <Link
              to="/streaming"
              className="block px-4 py-3 text-base font-medium hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Streaming
            </Link>
            <Link
              to="/competitions"
              className="block px-4 py-3 text-base font-medium hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Competitions
            </Link>
            <Link
              to="/bakcoins"
              className="block px-4 py-3 text-base font-medium hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              BAKCoins
            </Link>
            <Link
              to="/ai-tools"
              className="block px-4 py-3 text-base font-medium hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              AI Tools
            </Link>
            <Link
              to="/about"
              className="block px-4 py-3 text-base font-medium hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <div className="pt-2 space-y-2">
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" size="default" className="w-full">
                  Log In
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setIsOpen(false)}>
                <Button variant="gradient" size="default" className="w-full">
                  Join as Artist
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

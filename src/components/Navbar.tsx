import { Button } from "@/components/ui/button";
import { Music, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/10">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">BAK55</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/streaming" className="text-sm font-medium hover:text-primary transition-colors">
              Streaming
            </Link>
            <Link to="/competitions" className="text-sm font-medium hover:text-primary transition-colors">
              Competitions
            </Link>
            <Link to="/bakcoins" className="text-sm font-medium hover:text-primary transition-colors">
              BAKCoins
            </Link>
            <Link to="/ai-tools" className="text-sm font-medium hover:text-primary transition-colors">
              AI Tools
            </Link>
            <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/join">
              <Button variant="gradient" size="default">
                Join as Artist
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-primary/10">
            <Link
              to="/streaming"
              className="block px-4 py-2 hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Streaming
            </Link>
            <Link
              to="/competitions"
              className="block px-4 py-2 hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Competitions
            </Link>
            <Link
              to="/bakcoins"
              className="block px-4 py-2 hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              BAKCoins
            </Link>
            <Link
              to="/ai-tools"
              className="block px-4 py-2 hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              AI Tools
            </Link>
            <Link
              to="/about"
              className="block px-4 py-2 hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link to="/join" onClick={() => setIsOpen(false)}>
              <Button variant="gradient" size="default" className="w-full">
                Join as Artist
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

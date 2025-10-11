import { Link } from "react-router-dom";
import logo from "@/assets/bak55-logo.png";

export const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-primary/10">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={logo} 
                alt="BAK55 Talent" 
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              Powering African Music's Digital Revolution by building infrustructure for African music digital future an AI powered talent ecosystem that discovers, develops and monetizes artists through a proprietary digital economy. Our platform combines streaming, competition, live events and AI tools in a circular economy powered by BAKCoins.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/streaming" className="hover:text-primary transition-colors">Streaming Hub</Link></li>
              <li><Link to="/competitions" className="hover:text-primary transition-colors">Competitions</Link></li>
              <li><Link to="/bakcoins" className="hover:text-primary transition-colors">BAKCoins</Link></li>
              <li><Link to="/ai-tools" className="hover:text-primary transition-colors">AI Tools</Link></li>
            </ul>
          </div>

          {/* For Artists */}
          <div className="space-y-4">
            <h4 className="font-semibold">For Artists</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/join" className="hover:text-primary transition-colors">Join as Artist</Link></li>
              <li><Link to="/how-to-earn" className="hover:text-primary transition-colors">How to Earn</Link></li>
              <li><Link to="/success-stories" className="hover:text-primary transition-colors">Success Stories</Link></li>
              <li><Link to="/support" className="hover:text-primary transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/investors" className="hover:text-primary transition-colors">Investors</Link></li>
              <li><Link to="/press-kit" className="hover:text-primary transition-colors">Press Kit</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 BAK55. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/legal" className="hover:text-primary transition-colors">Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

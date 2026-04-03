import { Link } from "react-router-dom";
import { Shield, Banknote, BarChart3 } from "lucide-react";

const logo = "/bak55-logo.png";

const trustItems = [
  { icon: Shield, label: "Verified Payouts" },
  { icon: Banknote, label: "M-Pesa Cash Out" },
  { icon: BarChart3, label: "Fair Voting" },
];

export const Footer = () => {
  return (
    <footer className="py-8 md:py-12 px-4 border-t border-border/30 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Brand */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={logo}
                alt="BAK55 Talent"
                className="h-8 sm:h-10 w-auto object-contain group-hover:scale-110 transition-transform"
              />
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              The career launchpad for African music talent. Upload, compete, earn.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              {trustItems.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <item.icon className="w-3.5 h-3.5 text-primary/70" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-sm">Platform</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/streaming" className="hover:text-primary transition-colors">Music</Link></li>
              <li><Link to="/competitions" className="hover:text-primary transition-colors">Competitions</Link></li>
              <li><Link to="/bakcoins" className="hover:text-primary transition-colors">BAKCoins</Link></li>
              <li><Link to="/how-to-earn" className="hover:text-primary transition-colors">How to Earn</Link></li>
            </ul>
          </div>

          {/* For Artists */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">For Artists</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/apply" className="hover:text-primary transition-colors">Apply as Artist</Link></li>
              <li><Link to="/success-stories" className="hover:text-primary transition-colors">Success Stories</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/support" className="hover:text-primary transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Company</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><a href="https://instagram.com/bak55.talent" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Instagram</a></li>
              <li><a href="https://twitter.com/Bak55Official" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Twitter</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <p>© 2025 BAK55 Talent. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

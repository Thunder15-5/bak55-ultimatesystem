import { Link } from "react-router-dom";
const logo = "/bak55-logo.png";

export const Footer = () => {
  return (
    <footer className="py-8 md:py-12 px-4 border-t border-primary/10 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Brand */}
          <div className="space-y-3 md:space-y-4 sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src={logo} 
                alt="BAK55 Talent" 
                className="h-8 sm:h-10 w-auto object-contain group-hover:scale-110 transition-transform"
              />
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Powering African Music's Digital Revolution by building infrastructure for African music's digital future—an AI-powered talent ecosystem.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-heading font-semibold text-sm sm:text-base">Platform</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/streaming" className="hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform">Streaming Hub</Link></li>
              <li><Link to="/competitions" className="hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform">Competitions</Link></li>
              <li><Link to="/bakcoins" className="hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform">BAKCoins</Link></li>
              <li><Link to="/ai-tools" className="hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform">AI Tools</Link></li>
            </ul>
          </div>

          {/* For Artists */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-semibold text-sm sm:text-base">For Artists</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/join" className="hover:text-primary transition-colors">Join as Artist</Link></li>
              <li><Link to="/how-to-earn" className="hover:text-primary transition-colors">How to Earn</Link></li>
              <li><Link to="/success-stories" className="hover:text-primary transition-colors">Success Stories</Link></li>
              <li><Link to="/support" className="hover:text-primary transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-semibold text-sm sm:text-base">Company</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/investors" className="hover:text-primary transition-colors">Investors</Link></li>
              <li><Link to="/press-kit" className="hover:text-primary transition-colors">Press Kit</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><a href="https://instagram.com/bak55.talent" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Instagram</a></li>
              <li><a href="https://twitter.com/Bak55Official" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Twitter</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 md:pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
          <p className="text-center md:text-left">© 2025 BAK55. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
            <Link to="/legal" className="hover:text-primary transition-colors">Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

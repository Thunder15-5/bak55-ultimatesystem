import { Button } from "@/components/ui/button";
import { Music, Sparkles, TrendingUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      </div>
      
      {/* Floating elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-primary/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Talent Economy for African Music</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
            Where African Artists{" "}
            <span className="text-gradient">Build Careers</span>,
            <br />
            Not Just Content
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The complete ecosystem combining streaming, competitions, and AI tools—powered by BAKCoins. 
            Discover talent, earn real money, and shape the future of African music.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto py-8">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 hover:border-primary/30 transition-all duration-300">
              <div className="text-4xl font-bold text-gradient-primary mb-2">$1.7B</div>
              <div className="text-sm text-muted-foreground">African Music Market</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-secondary/10 hover:border-secondary/30 transition-all duration-300">
              <div className="text-4xl font-bold text-gradient-secondary mb-2">5M+</div>
              <div className="text-sm text-muted-foreground">Aspiring Artists</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-accent/10 hover:border-accent/30 transition-all duration-300">
              <div className="text-4xl font-bold text-accent mb-2">92%</div>
              <div className="text-sm text-muted-foreground">Artists Earn Under $100/mo</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link to="/signup">
              <Button variant="hero" size="xl" className="group">
                <Music className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Join as Artist
              </Button>
            </Link>
            <Link to="/streaming">
              <Button variant="outline" size="xl" className="group">
                <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Discover Talent
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <p className="text-sm text-muted-foreground pt-4">
            Launching in Kenya · Expanding across East Africa · Powered by AI
          </p>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

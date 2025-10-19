import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import heroBackground from "@/assets/hero-bg.jpg";
import { MarketResearchStats } from "./MarketResearchStats";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-12">
      {/* Animated background with hero image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      </div>

      {/* Animated gradient orbs - hidden on mobile to prevent overlap */}
      <div className="absolute inset-0 z-0 overflow-hidden hidden md:block">
        <div className="absolute top-1/4 -left-12 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-12 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8 mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary">Launching Q1 2026 · MVP Phase</span>
            </div>

            {/* Main Headline with staggered animation */}
            <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight animate-fade-in-up break-words">
              Building Infrastructure for
            </h1>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight animate-fade-in-up break-words" style={{ animationDelay: '0.1s' }}>
              <span className="text-gradient-primary">
                African Music's Digital Future
              </span>
            </h1>
            </div>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in-up break-words" style={{ animationDelay: '0.2s' }}>
              An AI-powered talent ecosystem transforming how African artists{" "}
              <span className="text-foreground font-semibold">monetize, grow,</span> and build{" "}
              <span className="text-foreground font-semibold">sustainable music careers</span> through streaming, competitions, and a creator-first economy.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full sm:w-auto group shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(147,51,234,0.5)]">
                  <Sparkles className="w-5 h-5" />
                  Join as Artist
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/about" className="w-full sm:w-auto">
                <Button variant="glass" size="xl" className="w-full sm:w-auto">
                  Discover BAK55
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>100% Free Beta Access</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <span>No Credit Card Required</span>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <span>Launching Early 2026</span>
            </div>
          </div>

          {/* Market Research Stats */}
          <MarketResearchStats />
        </div>
      </div>
    </section>
  );
};

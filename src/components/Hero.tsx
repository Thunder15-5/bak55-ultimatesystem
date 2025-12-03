import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Music, Star } from "lucide-react";
import heroBackground from "@/assets/hero-bg.jpg";
import { MarketResearchStats } from "./MarketResearchStats";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-12">
      {/* Enhanced animated background with hero image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
      </div>

      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Large animated orbs */}
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] animate-pulse-slow" />
        
        {/* Floating particles - hidden on mobile */}
        <div className="hidden md:block">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/40 rounded-full animate-float"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + i}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8 mb-16">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 backdrop-blur-xl animate-fade-in shadow-lg shadow-primary/10">
              <div className="relative">
                <Sparkles className="w-4 h-4 text-primary" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="w-4 h-4 text-primary opacity-50" />
                </div>
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Launching Q1 2026 · MVP Phase
              </span>
              <Star className="w-3 h-3 text-secondary fill-secondary" />
            </div>

            {/* Main Headline with enhanced styling */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight animate-fade-in-up break-words">
                <span className="inline-block hover:scale-105 transition-transform duration-300">Building</span>{" "}
                <span className="inline-block hover:scale-105 transition-transform duration-300">Infrastructure</span>{" "}
                <span className="inline-block hover:scale-105 transition-transform duration-300">for</span>
              </h1>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight animate-fade-in-up break-words" style={{ animationDelay: '0.1s' }}>
                <span className="text-gradient-primary relative">
                  African Music's Digital Future
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl -z-10 animate-pulse-slow" />
                </span>
              </h1>
            </div>

            {/* Enhanced Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in-up break-words" style={{ animationDelay: '0.2s' }}>
              An AI-powered talent ecosystem transforming how African artists{" "}
              <span className="text-foreground font-semibold bg-gradient-to-r from-primary/20 to-transparent px-2 rounded">monetize</span>,{" "}
              <span className="text-foreground font-semibold bg-gradient-to-r from-secondary/20 to-transparent px-2 rounded">grow</span>, and build{" "}
              <span className="text-foreground font-semibold bg-gradient-to-r from-accent/20 to-transparent px-2 rounded">sustainable music careers</span>{" "}
              through streaming, competitions, and a creator-first economy.
            </p>

            {/* Enhanced CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full sm:w-auto group relative overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(147,51,234,0.5)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient-shift opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Join as Artist
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link to="/about" className="w-full sm:w-auto">
                <Button variant="glass" size="xl" className="w-full sm:w-auto backdrop-blur-xl border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all">
                  Discover BAK55
                </Button>
              </Link>
            </div>

            {/* Enhanced Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                <span>100% Free Beta Access</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
                <span>Launching Early 2026</span>
              </div>
            </div>
          </div>

          {/* Market Research Stats */}
          <MarketResearchStats />
        </div>
      </div>
    </section>
  );
};
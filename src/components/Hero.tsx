import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Music, Star } from "lucide-react";
import heroBackground from "@/assets/hero-bg.jpg";
import { MarketResearchStats } from "./MarketResearchStats";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12">
      {/* Background */}
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

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[80px] sm:blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-secondary/20 rounded-full blur-[80px] sm:blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:60px_60px]" />

      <div className="container mx-auto px-5 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6 sm:space-y-8 mb-10 sm:mb-16">
            {/* Badge - Competition Promo */}
            <Link to="/competitions" className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 backdrop-blur-xl animate-fade-in shadow-lg shadow-primary/10 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
              <div className="relative">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary opacity-50" />
                </div>
              </div>
              <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                🏆 Founders Season Live · Win 1000 BAK
              </span>
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-secondary fill-secondary" />
            </Link>

            {/* Main Headline - Optimized for mobile with better spacing */}
            <div className="space-y-3 sm:space-y-4 px-1">
              <h1 className="text-[1.65rem] leading-tight xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold sm:leading-[1.1] tracking-tight animate-fade-in-up">
                Building Infrastructure for
              </h1>
              <h1 className="text-[1.65rem] leading-tight xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold sm:leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <span className="text-gradient-primary relative">
                  African Music's Digital Future
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl sm:blur-2xl -z-10 animate-pulse-slow" />
                </span>
              </h1>
            </div>

            {/* Subheadline - Optimized for mobile */}
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in-up px-2" style={{ animationDelay: '0.2s' }}>
              An AI-powered talent ecosystem transforming how African artists{" "}
              <span className="text-foreground font-semibold">monetize</span>,{" "}
              <span className="text-foreground font-semibold">grow</span>, and build{" "}
              <span className="text-foreground font-semibold">sustainable music careers</span>{" "}
              through streaming, competitions, and a creator-first economy.
            </p>

            {/* CTAs - Optimized for mobile */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6 animate-fade-in-up px-4" style={{ animationDelay: '0.3s' }}>
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="w-full sm:w-auto group relative overflow-hidden shadow-xl sm:shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(147,51,234,0.5)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient-shift opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-2 py-1">
                    <Music className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Join as Artist</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link to="/about" className="w-full sm:w-auto">
                <Button variant="glass" size="lg" className="w-full sm:w-auto backdrop-blur-xl border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all">
                  <span className="text-sm sm:text-base">Discover BAK55</span>
                </Button>
              </Link>
            </div>

            {/* Trust indicators - Competition focused */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-4 pt-3 sm:pt-4 text-xs sm:text-sm text-muted-foreground animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>
              <Link to="/competitions" className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                <span>Founders Season Active</span>
              </Link>
              <Link to="/competitions" className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer">
                <span>🏆 Compete & Win Prizes</span>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
                <span>55 Artists · 7 Stages</span>
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

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Music, TrendingUp, Award, Sparkles, ArrowRight } from "lucide-react";
import heroBackground from "@/assets/hero-bg.jpg";

const stats = [
  { icon: Music, value: "$1.7B", label: "African Music Market", color: "from-primary to-primary-glow" },
  { icon: TrendingUp, value: "5M+", label: "Aspiring Artists", color: "from-secondary to-secondary-glow" },
  { icon: Award, value: "92%", label: "Earn Under $100/mo", color: "from-accent to-accent-glow" },
];

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

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
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
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight animate-fade-in-up">
                Building Infrastructure for
              </h1>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <span className="text-gradient bg-gradient-hero">
                  African Music's Digital Future
                </span>
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative"
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                <div className="relative p-8 rounded-2xl bg-card/60 backdrop-blur-xl border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                  
                  <div className="relative flex flex-col items-center gap-4 text-center">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                      <stat.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-gradient mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

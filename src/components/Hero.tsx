import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Music, Play, Users } from "lucide-react";
import heroBackground from "@/assets/hero-bg.jpg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Hero = () => {
  const [stats, setStats] = useState({ total_artists: 0, total_tracks: 0, total_votes: 0 });

  useEffect(() => {
    supabase.rpc('get_public_platform_stats').then(({ data }) => {
      if (data) setStats(data);
    });
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-24 sm:pt-28 pb-8 sm:pb-12">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/92 to-background" />
      </div>

      {/* Gradient orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-primary/15 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-secondary/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-5 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-xl animate-fade-in">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              Now live — Competitions open for entries
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-3 px-1">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-[1.1] tracking-tight animate-fade-in-up">
              Where African Artists
            </h1>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <span className="text-gradient-primary">Launch Careers</span>
            </h1>
          </div>

          {/* Subheadline — concrete, benefit-focused */}
          <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up px-2" style={{ animationDelay: '0.2s' }}>
            Upload music. Win competitions. Earn real money.
            <br className="hidden sm:block" />
            <span className="text-foreground/80">The all-in-one platform for emerging African talent.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 animate-fade-in-up px-4" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup" className="w-full sm:w-auto">
              <Button variant="hero" size="lg" className="w-full sm:w-auto group shadow-xl hover:shadow-elegant">
                <Music className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Join Free</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/streaming" className="w-full sm:w-auto">
              <Button variant="glass" size="lg" className="w-full sm:w-auto backdrop-blur-xl border-primary/20 hover:border-primary/40">
                <Play className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">Explore Music</span>
              </Button>
            </Link>
          </div>

          {/* Live stats — concrete social proof */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-4 animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>
            {[
              { value: stats.total_artists || '50+', label: 'Artists' },
              { value: stats.total_tracks || '100+', label: 'Tracks' },
              { value: stats.total_votes || '1K+', label: 'Votes Cast' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                <span className="text-lg sm:text-xl font-bold text-foreground">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</span>
                <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

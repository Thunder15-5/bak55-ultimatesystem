import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music2, TrendingUp, Users, Cpu, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import streamingIcon from "@/assets/streaming-icon.png";
import competitionIcon from "@/assets/competition-icon.png";
import coinsIcon from "@/assets/coins-icon.png";
import aiIcon from "@/assets/ai-icon.png";

const features = [
  {
    icon: streamingIcon,
    iconFallback: Music2,
    title: "Streaming Hub",
    description: "Track your music's performance with detailed analytics. Monitor plays, audience growth, and engagement metrics in real-time.",
    color: "from-primary to-primary-glow",
    gradient: "bg-gradient-to-br from-primary/10 to-primary-glow/5",
    link: "/streaming",
    stats: "Full Analytics",
  },
  {
    icon: competitionIcon,
    iconFallback: TrendingUp,
    title: "Talent Competitions",
    description: "Hybrid judging system: 70% fan voting meets 30% AI analysis. Transparent, fair, and life-changing prizes for emerging talent.",
    color: "from-secondary to-secondary-glow",
    gradient: "bg-gradient-to-br from-secondary/10 to-secondary-glow/5",
    link: "/competitions",
    stats: "Win Big Prizes",
  },
  {
    icon: coinsIcon,
    iconFallback: Users,
    title: "BAKCoins Economy",
    description: "Platform currency enabling transparent earnings, instant withdrawals, and seamless fan-artist interactions.",
    color: "from-accent to-accent-glow",
    gradient: "bg-gradient-to-br from-accent/10 to-accent-glow/5",
    link: "/bakcoins",
    stats: "Cash Out Anytime",
  },
  {
    icon: aiIcon,
    iconFallback: Cpu,
    title: "AI-Powered Tools",
    description: "Personalized feedback, trend forecasting, release timing optimization, and AI-driven career guidance to grow your music career.",
    color: "from-primary via-accent to-secondary",
    gradient: "bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10",
    link: "/ai-tools",
    stats: "Smart Insights",
  },
];

export const Features = () => {
  return (
    <section className="py-16 md:py-28 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20 space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Four Pillars of Success</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Everything You Need to <br className="hidden sm:block" />
            <span className="text-gradient">Build Your Music Career</span>
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A complete, integrated ecosystem designed to empower African artists and revolutionize how music careers are built and monetized.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Link to={feature.link}>
                <Card className={`group relative p-8 h-full bg-card/60 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl cursor-pointer overflow-hidden ${feature.gradient}`}>
                  {/* Animated gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <div className="relative space-y-6">
                    {/* Icon and Title */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className={`inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 mb-4`}>
                          <img 
                            src={feature.icon} 
                            alt={feature.title}
                            className="w-9 h-9 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'block';
                            }}
                          />
                          <feature.iconFallback className="w-9 h-9 text-white hidden" />
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                          {feature.title}
                        </h3>
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
                    </div>
                    
                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {feature.description}
                    </p>
                    
                    {/* Stats Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r ${feature.color} text-white text-xs font-semibold shadow-md`}>
                        {feature.stats}
                      </div>
                      <span className="text-sm text-muted-foreground">Learn more →</span>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <Link to="/about">
            <Button variant="glass" size="lg" className="group">
              Explore All Features
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

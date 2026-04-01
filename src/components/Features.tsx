import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Upload, Trophy, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload & Earn",
    description: "Share your music with the world. Earn BAKCoins from streams, tips, and track sales — cash out anytime via M-Pesa.",
    color: "from-primary to-primary-glow",
    gradient: "bg-gradient-to-br from-primary/10 to-primary-glow/5",
    link: "/streaming",
    stats: "Up to 90% Revenue",
  },
  {
    icon: Trophy,
    title: "Compete & Win",
    description: "Enter talent competitions with real prizes. Hybrid judging: 70% fan votes + 30% AI analysis ensures fairness.",
    color: "from-secondary to-secondary-glow",
    gradient: "bg-gradient-to-br from-secondary/10 to-secondary-glow/5",
    link: "/competitions",
    stats: "Win BAKCoin Prizes",
  },
  {
    icon: TrendingUp,
    title: "Engage & Grow",
    description: "AI-powered career tools, fan engagement, producer collaborations, and analytics to accelerate your growth.",
    color: "from-accent to-accent-glow",
    gradient: "bg-gradient-to-br from-accent/10 to-accent-glow/5",
    link: "/ai-tools",
    stats: "Smart AI Insights",
  },
];

export const Features = () => {
  return (
    <section className="py-14 md:py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16 space-y-4 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Three Pillars</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold leading-tight">
            Everything to <span className="text-gradient">Build Your Career</span>
          </h2>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload, compete, and grow — all in one platform built for African artists.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {features.map((feature, index) => (
            <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <Link to={feature.link}>
                <Card className={`group relative p-6 sm:p-8 h-full bg-card/60 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden ${feature.gradient}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                  <div className="relative space-y-5">
                    <div className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-xl font-heading font-bold group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r ${feature.color} text-white text-xs font-semibold`}>
                        {feature.stats}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link to="/about">
            <Button variant="glass" size="lg" className="group">
              Learn More About BAK55
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

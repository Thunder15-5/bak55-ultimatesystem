import { Music, Trophy, Coins, Sparkles } from "lucide-react";

const FourPillars = () => {
  const pillars = [
    {
      icon: Music,
      title: "Streaming Hub",
      description: "AI-curated music and video streaming with regional discovery and integrated social features",
      color: "primary",
      features: ["Personalized discovery", "Regional content", "Social integration"]
    },
    {
      icon: Trophy,
      title: "Competition Engine",
      description: "Regular themed competitions with cash prizes and hybrid judging (70% fans, 30% AI + experts)",
      color: "secondary",
      features: ["Bi-weekly contests", "Live events", "Fair judging"]
    },
    {
      icon: Coins,
      title: "BAKCoins Economy",
      description: "Proprietary currency powering multiple earning streams with real cash conversion",
      color: "accent",
      features: ["Multiple income streams", "Cash withdrawals", "Circular economy"]
    },
    {
      icon: Sparkles,
      title: "AI Infrastructure",
      description: "End-to-end AI integration with predictive analytics and automated production tools",
      color: "primary-glow",
      features: ["Talent prediction", "Auto-production", "Market insights"]
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/50" },
      secondary: { bg: "bg-secondary/10", text: "text-secondary", border: "border-secondary/50" },
      accent: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/50" },
      "primary-glow": { bg: "bg-primary-glow/10", text: "text-primary-glow", border: "border-primary-glow/50" }
    };
    return colorMap[color];
  };

  return (
    <section className="py-24 px-4 relative">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Complete <span className="bg-gradient-primary bg-clip-text text-transparent">Artist Development</span> Ecosystem
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Four integrated pillars working together to transform how African artists build sustainable careers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            const colors = getColorClasses(pillar.color);
            
            return (
              <div
                key={index}
                className={`group relative p-8 rounded-2xl bg-card border ${colors.border} hover:shadow-glow transition-all duration-300`}
              >
                <div className={`mb-6 inline-flex p-4 rounded-xl ${colors.bg} ${colors.text} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-8 w-8" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {pillar.title}
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  {pillar.description}
                </p>

                <ul className="space-y-2">
                  {pillar.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Decorative corner */}
                <div className={`absolute top-0 right-0 w-20 h-20 ${colors.bg} rounded-bl-full opacity-20`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FourPillars;

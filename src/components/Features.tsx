import { Card } from "@/components/ui/card";
import streamingIcon from "@/assets/streaming-icon.png";
import competitionIcon from "@/assets/competition-icon.png";
import coinsIcon from "@/assets/coins-icon.png";
import aiIcon from "@/assets/ai-icon.png";

const features = [
  {
    icon: streamingIcon,
    title: "BAK55 Streaming Hub",
    description: "AI-curated music and video streaming with regionalized discovery. Get found by the right audience across 50+ African genres.",
    gradient: "from-primary to-primary-glow",
  },
  {
    icon: competitionIcon,
    title: "Competition Engine",
    description: "Regular themed competitions with real cash prizes. Hybrid judging combines fan votes (70%) with expert+AI scoring (30%).",
    gradient: "from-secondary to-secondary-glow",
  },
  {
    icon: coinsIcon,
    title: "BAKCoins Economy",
    description: "Earn through streaming, competitions, tips, and platform contributions. Convert to cash anytime with full transparency.",
    gradient: "from-primary via-secondary to-accent",
  },
  {
    icon: aiIcon,
    title: "AI Talent Infrastructure",
    description: "End-to-end AI integration: talent discovery, predictive analytics, automated tools, and continuous learning systems.",
    gradient: "from-accent to-primary",
  },
];

export const Features = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-6xl font-bold">
            Four Pillars,{" "}
            <span className="text-gradient">One Ecosystem</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything artists need to create, compete, earn, and grow—all in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`} />
              </div>
              
              <div className="relative p-8 space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-card to-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <img 
                    src={feature.icon} 
                    alt={feature.title}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

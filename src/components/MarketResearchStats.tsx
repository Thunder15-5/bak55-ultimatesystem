import { Music, TrendingUp, Award } from "lucide-react";

const marketStats = [
  { 
    icon: Music, 
    value: "$1.7B", 
    label: "African Music Market", 
    color: "from-primary to-primary-glow",
    context: "Industry Size (2024)"
  },
  { 
    icon: TrendingUp, 
    value: "5M+", 
    label: "Aspiring Artists", 
    color: "from-secondary to-secondary-glow",
    context: "Across Africa"
  },
  { 
    icon: Award, 
    value: "92%", 
    label: "Earn Under $100/mo", 
    color: "from-accent to-accent-glow",
    context: "Market Gap"
  },
];

export const MarketResearchStats = () => {
  return (
    <div className="space-y-8">
      {/* Context Label */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            Market Opportunity
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto">
          Industry research data showing the massive opportunity in African music
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        {marketStats.map((stat, index) => (
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
                  <div className="text-xs text-muted-foreground/60 mt-1">{stat.context}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

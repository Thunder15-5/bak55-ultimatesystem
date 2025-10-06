import { Brain, Target, Shield, BarChart3, Users, Zap } from "lucide-react";

const AIFeatures = () => {
  const features = [
    {
      icon: Brain,
      title: "Talent Discovery AI",
      description: "Audio/video analysis with 85%+ accuracy in predicting artist success",
      metrics: ["Vocal quality scoring", "Stage presence analysis", "Cultural context understanding"]
    },
    {
      icon: Target,
      title: "Hyper-Personalization",
      description: "50+ African genres with mood and context-aware recommendations",
      metrics: ["Multi-lingual support", "Voice interface", "Predictive notifications"]
    },
    {
      icon: Shield,
      title: "Fraud Detection",
      description: "Multi-layered protection against manipulation and abuse",
      metrics: ["Pattern analysis", "Copyright protection", "Real-time moderation"]
    },
    {
      icon: BarChart3,
      title: "Business Intelligence",
      description: "Real-time trend forecasting 3-6 months ahead of market",
      metrics: ["Revenue prediction", "Audience insights", "Performance optimization"]
    },
    {
      icon: Users,
      title: "Automated A&R",
      description: "Smart scouting with custom criteria matching for labels and brands",
      metrics: ["Demographic matching", "Success prediction", "Partnership optimization"]
    },
    {
      icon: Zap,
      title: "Production Suite",
      description: "AI-powered tools for creation, mastering, and enhancement",
      metrics: ["Smart auto-tune", "AI mastering", "Lyric generation"]
    }
  ];

  return (
    <section className="py-24 px-4 relative">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powered by Advanced AI</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Complete <span className="bg-gradient-primary bg-clip-text text-transparent">AI Infrastructure</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            End-to-end artificial intelligence that discovers talent, personalizes experiences, and predicts success
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-glow transition-all duration-300"
              >
                <div className="mb-4 inline-flex p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground mb-4">
                  {feature.description}
                </p>

                <ul className="space-y-2 pt-4 border-t border-border">
                  {feature.metrics.map((metric, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* AI Stat showcase */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-primary text-primary-foreground text-center">
            <div className="text-4xl font-bold mb-2">85%+</div>
            <div className="text-sm opacity-90">Success Prediction Accuracy</div>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-secondary text-secondary-foreground text-center">
            <div className="text-4xl font-bold mb-2">50+</div>
            <div className="text-sm opacity-90">African Genres Supported</div>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-accent text-accent-foreground text-center">
            <div className="text-4xl font-bold mb-2">3-6mo</div>
            <div className="text-sm opacity-90">Trend Forecasting Lead Time</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIFeatures;

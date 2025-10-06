import { ArrowRight, Coins, DollarSign, Repeat, TrendingUp } from "lucide-react";

const BAKCoinsEconomy = () => {
  const flowSteps = [
    { label: "Create", icon: "🎵", color: "primary" },
    { label: "Stream", icon: "📱", color: "accent" },
    { label: "Compete", icon: "🏆", color: "secondary" },
    { label: "Earn", icon: "💰", color: "primary-glow" },
    { label: "Withdraw", icon: "💳", color: "accent" },
    { label: "Reinvest", icon: "🔄", color: "primary" }
  ];

  const features = [
    {
      icon: Coins,
      title: "Multiple Revenue Streams",
      items: ["Streaming royalties", "Competition prizes", "Fan tips", "Platform contributions"]
    },
    {
      icon: DollarSign,
      title: "Real Cash Value",
      items: ["1 BAKCoin = KSh 20", "95%+ withdrawal success", "Multiple payout methods", "Low fees (15%)"]
    },
    {
      icon: Repeat,
      title: "Circular Economy",
      items: ["Value preservation", "AI-powered promotion", "NFT collectibles", "Premium features"]
    },
    {
      icon: TrendingUp,
      title: "Sustainable Growth",
      items: ["Cash reserves", "Coin sinks", "Inflation prevention", "Artist-first model"]
    }
  ];

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      <div className="container max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            The <span className="bg-gradient-secondary bg-clip-text text-transparent">BAKCoins</span> Economy
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A revolutionary circular economy where artists earn real income and fans actively participate in success
          </p>
        </div>

        {/* Flow visualization */}
        <div className="mb-16 p-8 rounded-3xl bg-card/50 backdrop-blur-sm border border-border">
          <h3 className="text-xl font-semibold text-center mb-8 text-foreground">Artist Value Creation Cycle</h3>
          
          <div className="flex flex-wrap justify-center items-center gap-4">
            {flowSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all min-w-[100px]">
                    <div className="text-3xl">{step.icon}</div>
                    <div className="text-sm font-medium text-foreground">{step.label}</div>
                  </div>
                </div>
                
                {index < flowSteps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-glow transition-all duration-300"
              >
                <div className="mb-4 inline-flex p-3 rounded-xl bg-gradient-primary text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {feature.title}
                </h3>
                
                <ul className="space-y-2">
                  {feature.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Key stat */}
        <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-secondary">
          <div className="text-4xl md:text-5xl font-bold text-secondary-foreground mb-2">
            1 BAKCoin = KSh 20
          </div>
          <p className="text-lg text-secondary-foreground/80">
            Real value. Real earnings. Real opportunity.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BAKCoinsEconomy;

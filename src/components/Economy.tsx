import { Card } from "@/components/ui/card";
import { ArrowRight, Coins, DollarSign, Music, TrendingUp, Users, Zap, Sparkles } from "lucide-react";

const earningStreams = [
  { icon: TrendingUp, label: "Competition Prizes", color: "text-secondary" },
  { icon: Users, label: "Fan Tips", color: "text-accent" },
  { icon: Zap, label: "Platform Contributions", color: "text-primary" },
];

const coinSinks = [
  "AI-Powered Promotion",
  "Exclusive NFTs",
  "Premium Analytics",
  "Virtual Gifting",
  "Educational Content",
];

export const Economy = () => {
  return (
    <section className="py-16 md:py-28 px-4 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 md:mb-20 space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Sustainable Economy</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold">
            The <span className="text-gradient">BAKCoins</span> Circular Economy
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A sustainable ecosystem where artists earn real income and fans actively participate in success stories.
            <br />
            <span className="text-primary font-semibold">Convertible to cash anytime via M-Pesa</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Artist Value Creation */}
          <Card className="p-8 bg-card/60 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all duration-500 space-y-6 shadow-lg hover:shadow-2xl group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <Coins className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-heading font-bold">Artists Earn BAKCoins</h3>
            </div>
            
            <div className="space-y-3">
              {earningStreams.map((stream, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-primary/5"
                >
                  <stream.icon className={`w-6 h-6 ${stream.color}`} />
                  <span className="font-medium text-base">{stream.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-2 text-sm text-muted-foreground border-t border-primary/10">
              <DollarSign className="w-4 h-4" />
              <span>Withdraw to cash via M-Pesa · 15% platform fee (10% for top earners)</span>
            </div>
          </Card>

          {/* Fan Participation */}
          <Card className="p-8 bg-card/60 backdrop-blur-xl border-secondary/10 hover:border-secondary/30 transition-all duration-500 space-y-6 shadow-lg hover:shadow-2xl group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-heading font-bold">Fans Use BAKCoins</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed text-base">
                Purchase BAKCoins to actively participate in artist development:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-secondary/5">
                  <div className="font-semibold mb-1 text-base">Vote in Competitions</div>
                  <div className="text-xs text-muted-foreground">Influence winners</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-secondary/5">
                  <div className="font-semibold mb-1 text-base">Tip Favorite Artists</div>
                  <div className="text-xs text-muted-foreground">Direct support</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-secondary/5">
                  <div className="font-semibold mb-1 text-base">Access Exclusives</div>
                  <div className="text-xs text-muted-foreground">Behind the scenes</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-secondary/5">
                  <div className="font-semibold mb-1 text-base">Virtual Gifting</div>
                  <div className="text-xs text-muted-foreground">Live interactions</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Value Preservation */}
        <Card className="p-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 shadow-lg hover:shadow-2xl transition-shadow duration-500">
          <div className="text-center space-y-4">
            <h3 className="text-2xl md:text-3xl font-heading font-bold">Value Preservation & Coin Sinks</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Strategic mechanisms maintain BAKCoins value while creating additional revenue streams:
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {coinSinks.map((sink, index) => (
                <div 
                  key={index}
                  className="px-5 py-2.5 rounded-full bg-card/50 backdrop-blur-sm border border-accent/20 text-sm font-semibold hover:border-accent/50 hover:scale-105 transition-all duration-300"
                >
                  {sink}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Flow visualization */}
        <div className="mt-16 p-10 rounded-2xl bg-card/40 backdrop-blur-xl border border-primary/10 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-primary">STEP 1</div>
              <div className="font-bold text-lg">Create Content</div>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 md:rotate-0" />
            <div className="space-y-2">
              <div className="text-sm font-semibold text-secondary">STEP 2</div>
              <div className="font-bold text-lg">Fans Engage</div>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 md:rotate-0" />
            <div className="space-y-2">
              <div className="text-sm font-semibold text-accent">STEP 3</div>
              <div className="font-bold text-lg">Earn BAKCoins</div>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 md:rotate-0" />
            <div className="space-y-2">
              <div className="text-sm font-semibold text-primary">STEP 4</div>
              <div className="font-bold text-lg">Cash Out or Reinvest</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

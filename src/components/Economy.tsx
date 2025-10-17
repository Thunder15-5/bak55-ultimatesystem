import { Card } from "@/components/ui/card";
import { ArrowRight, Coins, DollarSign, Music, TrendingUp, Users, Zap } from "lucide-react";

const earningStreams = [
  { icon: Music, label: "Streaming Royalties", color: "text-primary" },
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
    <section className="py-12 md:py-24 px-4 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold">
            The <span className="text-gradient">BAKCoins</span> Circular Economy
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A sustainable ecosystem where artists earn real income and fans actively participate in success stories.
            1 BAKCoin = KSh 20 · Convertible to cash anytime
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Artist Value Creation */}
          <Card className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-primary/10 space-y-4 md:space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center flex-shrink-0">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Artists Earn BAKCoins</h3>
            </div>
            
            <div className="space-y-3">
              {earningStreams.map((stream, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <stream.icon className={`w-5 h-5 ${stream.color}`} />
                  <span className="font-medium">{stream.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>Withdraw to cash with 15% processing fee · Volume discounts available</span>
            </div>
          </Card>

          {/* Fan Participation */}
          <Card className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-secondary/10 space-y-4 md:space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Fans Use BAKCoins</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Purchase BAKCoins to actively participate in artist development:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-1">Vote in Competitions</div>
                  <div className="text-xs text-muted-foreground">Influence winners</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-1">Tip Favorite Artists</div>
                  <div className="text-xs text-muted-foreground">Direct support</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-1">Access Exclusives</div>
                  <div className="text-xs text-muted-foreground">Behind the scenes</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-1">Virtual Gifting</div>
                  <div className="text-xs text-muted-foreground">Live interactions</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Value Preservation */}
        <Card className="p-6 md:p-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <div className="text-center space-y-3 md:space-y-4">
            <h3 className="text-xl md:text-2xl font-bold">Value Preservation & Coin Sinks</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Strategic mechanisms maintain BAKCoins value while creating additional revenue streams:
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {coinSinks.map((sink, index) => (
                <div 
                  key={index}
                  className="px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-accent/20 text-sm font-medium hover:border-accent/50 transition-colors"
                >
                  {sink}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Flow visualization */}
        <div className="mt-12 p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-primary/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-primary">STEP 1</div>
              <div className="font-bold">Create Content</div>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 md:rotate-0" />
            <div className="space-y-2">
              <div className="text-sm font-semibold text-secondary">STEP 2</div>
              <div className="font-bold">Fans Engage</div>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 md:rotate-0" />
            <div className="space-y-2">
              <div className="text-sm font-semibold text-accent">STEP 3</div>
              <div className="font-bold">Earn BAKCoins</div>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 md:rotate-0" />
            <div className="space-y-2">
              <div className="text-sm font-semibold text-primary">STEP 4</div>
              <div className="font-bold">Cash Out or Reinvest</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

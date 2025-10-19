import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Trophy, Heart, TrendingUp, Coins, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const earningMethods = [
  {
    icon: Trophy,
    title: "Competition Prizes",
    amount: "Up to KSh 50K+",
    description: "Win cash and BAKCoins in bi-weekly micro competitions and quarterly championships.",
    color: "from-secondary to-secondary-glow",
  },
  {
    icon: Heart,
    title: "Fan Tips",
    amount: "100% to Artist",
    description: "Receive direct tips from fans. You keep everything (minus 10% platform fee).",
    color: "from-accent to-primary",
  },
  {
    icon: TrendingUp,
    title: "Platform Contributions",
    amount: "Bonus BAKCoins",
    description: "Earn for engaging with community, creating playlists, and referring new users.",
    color: "from-primary via-secondary to-accent",
  },
];

const HowToEarn = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-7xl font-bold">
              How to <span className="text-gradient">Earn Money</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Multiple income streams designed to reward artists fairly. No tricks, no hidden fees—just transparent earnings.
            </p>
          </div>

          {/* Earning Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {earningMethods.map((method, index) => (
              <Card key={index} className="p-8 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-6`}>
                  <method.icon className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{method.title}</h3>
                    <span className="text-sm font-semibold text-primary px-3 py-1 rounded-full bg-primary/10">
                      {method.amount}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{method.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Cash Out Process */}
          <Card className="p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 mb-16">
            <div className="text-center space-y-8">
              <div>
                <Coins className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-4xl font-bold mb-4">Converting BAKCoins to Cash</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Simple M-Pesa integration means you can withdraw your earnings anytime
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-gradient-primary">1</div>
                  <div className="text-sm font-semibold">Accumulate BAKCoins</div>
                  <p className="text-xs text-muted-foreground">Earn through any of the methods above</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-gradient-secondary">2</div>
                  <div className="text-sm font-semibold">Request Withdrawal</div>
                  <p className="text-xs text-muted-foreground">Convert BAKCoins to cash (1 coin = KSh 20)</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-accent">3</div>
                  <div className="text-sm font-semibold">Platform Processing Fee</div>
                  <p className="text-xs text-muted-foreground">15% standard withdrawal fee (10% for high earners)</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-gradient-primary">4</div>
                  <div className="text-sm font-semibold">Receive Money</div>
                  <p className="text-xs text-muted-foreground">M-Pesa payment within 24 hours</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Realistic Earnings */}
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-center">
              Realistic <span className="text-gradient">Earnings Potential</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10 text-center">
                <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Emerging Artist</h3>
                <p className="text-muted-foreground text-sm mb-4">1 competition/month, tips</p>
                <div className="text-3xl font-bold text-gradient-primary">KSh 5-10K</div>
                <p className="text-xs text-muted-foreground mt-2">per month</p>
              </Card>
              
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-secondary/10 text-center">
                <DollarSign className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Growing Artist</h3>
                <p className="text-muted-foreground text-sm mb-4">Active fan base, regular wins</p>
                <div className="text-3xl font-bold text-gradient-secondary">KSh 30-50K</div>
                <p className="text-xs text-muted-foreground mt-2">per month</p>
              </Card>
              
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-accent/10 text-center">
                <DollarSign className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Established Artist</h3>
                <p className="text-muted-foreground text-sm mb-4">Multiple competitions, large fanbase</p>
                <div className="text-3xl font-bold text-accent">KSh 100K+</div>
                <p className="text-xs text-muted-foreground mt-2">per month</p>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-16">
            <Link to="/join" className="inline-block w-full sm:w-auto max-w-md mx-auto">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Start Earning Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowToEarn;

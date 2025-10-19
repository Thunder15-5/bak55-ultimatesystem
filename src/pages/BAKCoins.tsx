import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, ArrowRightLeft, TrendingUp, Shield, DollarSign, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

const BAKCoinsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <Coins className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">BAKCoins Economy</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Digital Currency
            <br />
            <span className="text-gradient">Built for Artists</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            BAKCoins power the entire ecosystem. Earn, spend, and convert to cash—all within one transparent, artist-first economy.
          </p>
          
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-primary/20">
            <span className="text-2xl font-bold">1 BAKCoin</span>
            <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
            <span className="text-2xl font-bold text-gradient">KSh 20</span>
          </div>
        </div>
      </section>

      {/* How to Earn */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            How Artists <span className="text-gradient">Earn BAKCoins</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-secondary/10 hover:border-secondary/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center mb-4">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Competition Prizes</h3>
              <p className="text-muted-foreground">
                Win BAKCoins (and cash) in regular competitions. Even top 10 finishers receive coin rewards.
              </p>
            </Card>
            
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-accent/10 hover:border-accent/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Fan Tips</h3>
              <p className="text-muted-foreground">
                Receive direct tips from fans who love your work. 100% of tips go to you (minus platform fee).
              </p>
            </Card>
            
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Platform Contributions</h3>
              <p className="text-muted-foreground">
                Engage with the community, create playlists, refer new users—earn coins for building the ecosystem.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How to Spend */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            How to <span className="text-gradient-secondary">Use BAKCoins</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
              <h3 className="font-bold mb-2">AI-Powered Promotion</h3>
              <p className="text-sm text-muted-foreground">Boost your tracks for better visibility</p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
              <h3 className="font-bold mb-2">Exclusive NFTs</h3>
              <p className="text-sm text-muted-foreground">AI-generated visualizers and collectibles</p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
              <h3 className="font-bold mb-2">Premium Analytics</h3>
              <p className="text-sm text-muted-foreground">Advanced insights and trend data</p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
              <h3 className="font-bold mb-2">Virtual Gifting</h3>
              <p className="text-sm text-muted-foreground">Enhanced interactions during live streams</p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
              <h3 className="font-bold mb-2">Educational Content</h3>
              <p className="text-sm text-muted-foreground">Masterclasses and production courses</p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
              <h3 className="font-bold mb-2">Cash Withdrawal</h3>
              <p className="text-sm text-muted-foreground">Convert to real money anytime</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Withdrawal Info */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-6 sm:p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Platform Withdrawal Policy</span>
              </div>
              <h2 className="text-3xl font-bold">Simple, Transparent Withdrawals</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our M-Pesa integration fees are designed to be fair and sustainable, supporting platform operations while keeping artist earnings high.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gradient-primary mb-2">15%</div>
                  <div className="text-sm text-muted-foreground">Standard Withdrawal Fee</div>
                  <div className="text-xs text-muted-foreground/70 mt-1">For all cash withdrawals</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gradient-secondary mb-2">10%</div>
                  <div className="text-sm text-muted-foreground">High Volume Discount</div>
                  <div className="text-xs text-muted-foreground/70 mt-1">For verified artists earning 10K+ BAKCoins/month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">24hrs</div>
                  <div className="text-sm text-muted-foreground">Processing Time</div>
                  <div className="text-xs text-muted-foreground/70 mt-1">M-Pesa transfer timeline</div>
                </div>
              </div>

              {/* Industry Comparison */}
              <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-primary/10 text-left">
                <h3 className="text-sm font-semibold text-primary mb-3 text-center">Why These Fees?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p>Lower than traditional streaming platforms (30-50% revenue share)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p>Covers M-Pesa transaction costs and platform sustainability</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p>High earners get better rates (10% vs standard 15%)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p>24-hour processing ensures reliable, fast payouts</p>
                  </div>
                </div>
              </div>
              
              <Link to="/join" className="inline-block w-full sm:w-auto">
                <Button variant="hero" size="xl" className="mt-8 w-full sm:w-auto">
                  Start Earning BAKCoins
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BAKCoinsPage;

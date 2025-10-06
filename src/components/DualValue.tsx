import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const DualValue = () => {
  const artistBenefits = [
    "Multiple revenue streams (streaming, competitions, tips)",
    "AI-powered career analytics and insights",
    "Fair ownership - keep your rights",
    "Direct fan connection and community",
    "Professional production tools",
    "Cash withdrawals starting at 100 BAKCoins"
  ];

  const fanBenefits = [
    "Discover emerging talent before they blow up",
    "Vote and influence artist success",
    "Direct support through tips and votes",
    "Exclusive content and early releases",
    "Personalized recommendations across 50+ genres",
    "Be part of artist success stories"
  ];

  return (
    <section className="py-24 px-4 relative">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Built for <span className="bg-gradient-primary bg-clip-text text-transparent">Everyone</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A platform where artists thrive and fans become active participants in music discovery
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* For Artists */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all duration-300">
              <div className="mb-6">
                <div className="inline-flex px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  For Artists
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-3">
                  Build Your Career
                </h3>
                <p className="text-muted-foreground">
                  Everything you need to go from bedroom studio to professional success
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {artistBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 p-1 rounded-full bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-glow-strong transition-all">
                Get Started as Artist
              </Button>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold text-foreground">92%</div>
                    <div className="text-xs text-muted-foreground">Artists earn more</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">KSh 20</div>
                    <div className="text-xs text-muted-foreground">per BAKCoin</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">15%</div>
                    <div className="text-xs text-muted-foreground">Cash-out fee</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* For Fans */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-secondary rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative p-8 rounded-3xl bg-card border border-border hover:border-secondary/50 transition-all duration-300">
              <div className="mb-6">
                <div className="inline-flex px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
                  For Fans
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-3">
                  Shape the Future
                </h3>
                <p className="text-muted-foreground">
                  Discover talent early and be part of their journey to success
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {fanBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 p-1 rounded-full bg-secondary/10">
                      <Check className="h-4 w-4 text-secondary" />
                    </div>
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-gradient-secondary text-secondary-foreground hover:opacity-90 transition-all">
                Join as Fan
              </Button>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold text-foreground">50+</div>
                    <div className="text-xs text-muted-foreground">Genres</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">2M+</div>
                    <div className="text-xs text-muted-foreground">Songs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">Free</div>
                    <div className="text-xs text-muted-foreground">To start</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DualValue;

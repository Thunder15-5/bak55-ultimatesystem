import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Pricing = () => {
  const tiers = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for getting started",
      features: [
        "Platform access",
        "Upload unlimited songs",
        "Enter competitions",
        "Earn BAKCoins",
        "Basic analytics",
        "Community access"
      ],
      cta: "Start Free",
      highlighted: false
    },
    {
      name: "Pro",
      price: "KSh 1,500/year",
      priceMonthly: "KSh 125/mo",
      description: "For serious artists",
      features: [
        "Everything in Basic",
        "Enhanced analytics",
        "Priority support",
        "Promotional tools",
        "Advanced AI features",
        "Featured placement",
        "Early access to new features"
      ],
      cta: "Go Pro",
      highlighted: true
    },
    {
      name: "Elite",
      price: "KSh 5,000/year",
      priceMonthly: "KSh 417/mo",
      description: "Maximum growth potential",
      features: [
        "Everything in Pro",
        "Premium AI tools",
        "Dedicated support",
        "Custom analytics",
        "Brand partnership access",
        "Priority in competitions",
        "API access",
        "White-label options"
      ],
      cta: "Go Elite",
      highlighted: false
    }
  ];

  return (
    <section className="py-24 px-4 relative">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Choose Your <span className="bg-gradient-primary bg-clip-text text-transparent">Path</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start free, upgrade when you're ready to accelerate your growth
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative rounded-3xl p-8 ${
                tier.highlighted
                  ? "bg-gradient-primary text-primary-foreground shadow-glow-strong scale-105"
                  : "bg-card border border-border"
              } transition-all duration-300 hover:scale-105`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-2xl font-bold mb-2 ${tier.highlighted ? "text-primary-foreground" : "text-foreground"}`}>
                  {tier.name}
                </h3>
                <div className={`text-4xl font-bold mb-1 ${tier.highlighted ? "text-primary-foreground" : "text-foreground"}`}>
                  {tier.price}
                </div>
                {tier.priceMonthly && (
                  <div className={`text-sm ${tier.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {tier.priceMonthly}
                  </div>
                )}
                <p className={`mt-2 ${tier.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1 rounded-full ${
                      tier.highlighted ? "bg-primary-foreground/20" : "bg-primary/10"
                    }`}>
                      <Check className={`h-4 w-4 ${tier.highlighted ? "text-primary-foreground" : "text-primary"}`} />
                    </div>
                    <span className={tier.highlighted ? "text-primary-foreground/90" : "text-muted-foreground"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  tier.highlighted
                    ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    : "bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-glow-strong"
                }`}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Enterprise solutions</span> available for labels, brands, and organizations.{" "}
            <a href="#contact" className="text-primary hover:underline">Contact us</a> for custom pricing.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

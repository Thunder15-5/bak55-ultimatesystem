import { Card } from "@/components/ui/card";
import { Upload, Trophy, Wallet, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Music",
    description: "Create an account, upload your tracks, and get them in front of a real audience instantly.",
    color: "from-primary to-primary-glow",
  },
  {
    icon: Trophy,
    step: "02",
    title: "Compete & Get Voted",
    description: "Enter competitions. Fans vote with BAKCoins. The best talent rises to the top — fair and transparent.",
    color: "from-secondary to-secondary-glow",
  },
  {
    icon: Wallet,
    step: "03",
    title: "Earn Real Money",
    description: "Win prizes, receive tips, sell tracks. Cash out anytime via M-Pesa. Artists keep up to 85%.",
    color: "from-accent to-accent-glow",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-16 md:py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20 space-y-4 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <ArrowRight className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">3 Simple Steps</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold leading-tight">
            How <span className="text-gradient">It Works</span>
          </h2>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            From signup to earning — your complete journey on Africa's talent launchpad
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card className="group relative p-6 h-full bg-card/60 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 shadow-lg hover:shadow-2xl">
                {/* Step Number */}
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-background to-card border-2 border-primary/20 flex items-center justify-center font-bold text-primary text-xl">
                  {step.step}
                </div>

                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-500`} />

                <div className="relative space-y-4">
                  <div className={`inline-flex w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-heading font-bold group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 z-20">
                      <ArrowRight className="w-6 h-6 text-primary/40" />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

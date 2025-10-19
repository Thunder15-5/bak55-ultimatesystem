import { Card } from "@/components/ui/card";
import { UserPlus, Upload, Trophy, Wallet, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign Up Free",
    description: "Create your account in minutes. Choose your role: Artist, Fan, or Brand Partner.",
    color: "from-primary to-primary-glow",
  },
  {
    icon: Upload,
    step: "02",
    title: "Upload & Create",
    description: "Artists upload tracks. Fans discover music. Brands launch competitions with prizes.",
    color: "from-secondary to-secondary-glow",
  },
  {
    icon: Trophy,
    step: "03",
    title: "Compete & Vote",
    description: "Enter competitions with hybrid judging (70% fan votes + 30% AI). Fair and transparent.",
    color: "from-accent to-accent-glow",
  },
  {
    icon: Wallet,
    step: "04",
    title: "Earn & Grow",
    description: "Earn BAKCoins through streams, prizes, and tips. Cash out anytime via M-Pesa (15% platform fee, 10% for high earners).",
    color: "from-primary via-secondary to-accent",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-16 md:py-28 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20 space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <ArrowRight className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">Simple & Powerful</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight">
            How <span className="text-gradient">BAK55</span> Works
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From signup to success—your complete journey on Africa's premier music platform
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-500`} />
                
                <div className="relative space-y-4">
                  {/* Icon */}
                  <div className={`inline-flex w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-heading font-bold group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow connector (hidden on mobile, last card) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-8 top-1/2 -translate-y-1/2 z-20">
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

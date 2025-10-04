import { Zap, Shield, Sparkles, Rocket, BarChart3, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Experience blazing-fast performance with our optimized infrastructure.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and security protocols to protect your data.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description: "Smart automation that learns from your workflow and adapts.",
  },
  {
    icon: Rocket,
    title: "Scale Effortlessly",
    description: "Grow from startup to enterprise without changing platforms.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Deep insights with real-time dashboards and reporting.",
  },
  {
    icon: Layers,
    title: "Seamless Integration",
    description: "Connect with 100+ tools and services out of the box.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              succeed
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you build, launch, and grow your business faster.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-8 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 group"
            >
              <div className="mb-4 inline-block p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

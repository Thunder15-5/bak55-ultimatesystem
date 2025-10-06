import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import FourPillars from "@/components/FourPillars";
import BAKCoinsEconomy from "@/components/BAKCoinsEconomy";
import AIFeatures from "@/components/AIFeatures";
import DualValue from "@/components/DualValue";
import Pricing from "@/components/Pricing";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Problem />
      <FourPillars />
      <BAKCoinsEconomy />
      <AIFeatures />
      <DualValue />
      <Pricing />
      <Waitlist />
      <Footer />
    </div>
  );
};

export default Index;

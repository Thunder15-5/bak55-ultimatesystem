import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { SocialProof } from "@/components/SocialProof";
import { Economy } from "@/components/Economy";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { StatsBar } from "@/components/StatsBar";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  // Don't auto-redirect - let users view the landing page if they want
  // They can manually navigate to their dashboard via the navigation menu

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Only show landing page to non-authenticated users
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <SocialProof />
      <Economy />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;

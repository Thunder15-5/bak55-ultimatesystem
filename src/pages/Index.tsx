import { useEffect, useState } from "react";
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
import { CompetitionBanner } from "@/components/CompetitionBanner";
import { TrendingArtists } from "@/components/TrendingArtists";
import { FeaturedArtistsCarousel } from "@/components/FeaturedArtistsCarousel";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [featuredCompetition, setFeaturedCompetition] = useState<any>(null);

  useEffect(() => {
    fetchFeaturedCompetition();
  }, []);

  const fetchFeaturedCompetition = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('*, submissions(count)')
      .eq('id', '627488d7-abe5-4469-bb7a-0863225fea34')
      .single();
    
    if (data) {
      setFeaturedCompetition(data);
    }
  };

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
      
      {/* Featured Competition Banner */}
      {featuredCompetition && (
        <section className="py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <CompetitionBanner
              competitionId={featuredCompetition.id}
              title={featuredCompetition.title}
              coverImage={featuredCompetition.cover_image}
              prizeAmount={featuredCompetition.prize_amount}
              endDate={featuredCompetition.end_date}
              maxSubmissions={featuredCompetition.max_submissions}
              currentSubmissions={featuredCompetition.submissions?.[0]?.count || 0}
              ctaText="Join Now"
              ctaLink="/signup"
            />
          </div>
        </section>
      )}
      <Features />
      <HowItWorks />
      <FeaturedArtistsCarousel />
      <TrendingArtists />
      <SocialProof />
      <Economy />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;

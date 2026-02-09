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
import { PageSEO } from "@/components/SEO";

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [featuredCompetition, setFeaturedCompetition] = useState<any>(null);

  useEffect(() => {
    fetchFeaturedCompetition();
  }, []);

  const fetchFeaturedCompetition = async () => {
    // Fetch the latest active competition dynamically
    const { data } = await supabase
      .from('competitions')
      .select('*, submissions(count)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setFeaturedCompetition(data);
    }
  };

  // Don't auto-redirect - let users view the landing page if they want
  // They can manually navigate to their dashboard via the navigation menu
  // Note: We don't block on loading - show the landing page immediately

  // Only show landing page to non-authenticated users
  return (
    <>
      <PageSEO page="home" />
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navigation />
        <main>
          <Hero />
          <StatsBar />
          
          {/* Featured Competition Banner */}
          {featuredCompetition && (
            <section className="py-12 md:py-16 px-4" aria-label="Featured Competition">
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
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;

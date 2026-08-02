import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { SocialProof } from "@/components/SocialProof";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { CompetitionBanner } from "@/components/CompetitionBanner";
import { StickyMobileCTA } from "@/components/mobile/StickyMobileCTA";
import { useAuth } from "@/contexts/AuthContext";
import { FeaturedArtistsCarousel } from "@/components/FeaturedArtistsCarousel";
import { FAQ } from "@/components/FAQ";
import { HostOnBak55 } from "@/components/home/HostOnBak55";
import { VerifiedOrganizers } from "@/components/home/VerifiedOrganizers";
import { supabase } from "@/integrations/supabase/client";
import { PageSEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic2, Heart, Briefcase, Shield, Banknote, BarChart3 } from "lucide-react";

const audienceCards = [
  {
    icon: Mic2,
    title: "For Artists",
    description: "Upload tracks, enter competitions, earn BAKCoins, and grow your fanbase with AI-powered insights.",
    cta: "Apply as Artist",
    link: "/apply",
    gradient: "from-primary/10 to-primary-glow/5",
    border: "border-primary/20 hover:border-primary/40",
    iconBg: "from-primary to-primary-glow",
  },
  {
    icon: Heart,
    title: "For Fans",
    description: "Discover new music, vote for rising stars, earn rewards, and support the artists you love.",
    cta: "Join as Fan",
    link: "/signup",
    gradient: "from-secondary/10 to-secondary-glow/5",
    border: "border-secondary/20 hover:border-secondary/40",
    iconBg: "from-secondary to-secondary-glow",
  },
  {
    icon: Briefcase,
    title: "For Brands",
    description: "Sponsor competitions, discover talent, and connect your brand with Africa's music audience.",
    cta: "Partner with Us",
    link: "/contact",
    gradient: "from-accent/10 to-accent-glow/5",
    border: "border-accent/20 hover:border-accent/40",
    iconBg: "from-accent to-accent-glow",
  },
];

const trustBadges = [
  { icon: Shield, label: "Verified Payouts" },
  { icon: Banknote, label: "M-Pesa Cash Out" },
  { icon: BarChart3, label: "Transparent Voting" },
];

const Index = () => {
  const { user } = useAuth();
  const [featuredCompetition, setFeaturedCompetition] = useState<any>(null);

  useEffect(() => {
    supabase
      .from('competitions')
      .select('*, submissions(count)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setFeaturedCompetition(data);
      });
  }, []);

  return (
    <>
      <PageSEO page="home" />
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navigation />
        <main>
          <Hero />

          {/* Trust Bar */}
          <section className="py-6 px-4 border-y border-border/30 bg-card/20 backdrop-blur-sm">
            <div className="container mx-auto max-w-4xl flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {trustBadges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <badge.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">{badge.label}</span>
                </div>
              ))}
              <Link
                to="/transparency"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
              >
                See live platform stats
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          <HostOnBak55 />
          <VerifiedOrganizers />
          <SocialProof />
          <HowItWorks />

          {/* Who is BAK55 For? */}
          <section className="py-12 md:py-20 px-4">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-10 md:mb-14 space-y-3">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
                  Built for <span className="text-gradient">Everyone in Music</span>
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
                  Whether you create, listen, or invest — BAK55 has a place for you.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {audienceCards.map((card, i) => (
                  <Link key={i} to={card.link}>
                    <Card className={`group p-6 h-full bg-gradient-to-br ${card.gradient} ${card.border} border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer`}>
                      <div className="space-y-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <card.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-heading font-bold">{card.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                        <div className="flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                          {card.cta}
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <Features />

          {/* Featured Competition */}
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

          <FeaturedArtistsCarousel />
          <FAQ />
          <CTA />
        </main>
        <Footer />
        <StickyMobileCTA
          label="Join Free · 10 BAK Bonus"
          to="/signup"
          secondary={{ label: "Already have an account? Log in", to: "/login" }}
          hidden={!!user}
          hint="Vote, earn & get discovered"
        />
      </div>
    </>
  );
};

export default Index;

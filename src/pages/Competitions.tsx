import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Clock, DollarSign, Star, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { CompetitionBanner } from "@/components/CompetitionBanner";
import { FoundersSeason } from "@/components/FoundersSeason";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Competitions = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 px-4">
        <div className="container mx-auto max-w-6xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
            <Trophy className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">Competition Engine</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight">
            Compete, Win,
            <br />
            <span className="text-gradient">Get Discovered</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Regular competitions with real cash prizes. Fair hybrid judging combines fan votes with expert AI analysis.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/competitions/active" className="inline-block w-full sm:w-auto">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                View Active Competitions
              </Button>
            </Link>
            <Link to="/join" className="inline-block w-full sm:w-auto">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                Join as Artist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Competition */}
      {featuredCompetition && (
        <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-gradient">Live Now:</span> BAK55 Genesis
              </h2>
              <p className="text-lg text-muted-foreground">
                The first 55 founding artists of the BAK55 movement
              </p>
            </div>
            <CompetitionBanner
              competitionId={featuredCompetition.id}
              title={featuredCompetition.title}
              coverImage={featuredCompetition.cover_image}
              prizeAmount={featuredCompetition.prize_amount}
              endDate={featuredCompetition.end_date}
              maxSubmissions={featuredCompetition.max_submissions}
              currentSubmissions={featuredCompetition.submissions?.[0]?.count || 0}
              ctaText="Enter Competition"
              ctaLink={`/competition/${featuredCompetition.id}`}
            />
          </div>
        </section>
      )}

      {/* Founders Season Timeline */}
      <FoundersSeason />

      {/* How Competitions Work */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 md:mb-16">
            How <span className="text-gradient">Competitions Work</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3">Bi-Weekly Micro Competitions</h3>
              <p className="text-muted-foreground">
                Themed competitions every two weeks. Genre-specific, skill-based, or creative challenges.
              </p>
            </Card>
            
            <Card className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-secondary/10 hover:border-secondary/30 transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center mb-4">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3">Quarterly Championships</h3>
              <p className="text-muted-foreground">
                Major competitions with live event finals. Bigger prizes, industry exposure, brand partnerships.
              </p>
            </Card>
            
            <Card className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-accent/10 hover:border-accent/30 transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-4">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3">Hybrid Judging</h3>
              <p className="text-muted-foreground">
                70% fan votes + 30% expert & AI scoring. Fair, transparent, and community-driven.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Prize Structure */}
      <section className="py-12 md:py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">
            Win <span className="text-gradient-secondary">Real Cash Prizes</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="p-8 text-center bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30">
              <Award className="w-16 h-16 text-secondary mx-auto mb-4" />
              <div className="text-4xl font-bold text-gradient-secondary mb-2">1st Place</div>
              <p className="text-muted-foreground mb-4">Major Competitions</p>
              <div className="text-3xl font-bold">KSh 50,000+</div>
            </Card>
            
            <Card className="p-8 text-center bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
              <Star className="w-16 h-16 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold text-gradient-primary mb-2">2nd Place</div>
              <p className="text-muted-foreground mb-4">Major Competitions</p>
              <div className="text-3xl font-bold">KSh 25,000+</div>
            </Card>
            
            <Card className="p-8 text-center bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
              <DollarSign className="w-16 h-16 text-accent mx-auto mb-4" />
              <div className="text-4xl font-bold text-accent mb-2">Top 10</div>
              <p className="text-muted-foreground mb-4">All Competitions</p>
              <div className="text-3xl font-bold">BAKCoins</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Badge System Showcase */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            Earn <span className="text-gradient">Fan Badges</span>
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Show your dedication and climb the supporter rankings with exclusive badges
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 text-center border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-transparent">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-3xl shadow-lg">
                🏆
              </div>
              <h3 className="font-bold mb-2">Legendary</h3>
              <p className="text-sm text-muted-foreground">
                For the most dedicated fans and talent scouts
              </p>
            </Card>

            <Card className="p-6 text-center border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-transparent">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg">
                💎
              </div>
              <h3 className="font-bold mb-2">Epic</h3>
              <p className="text-sm text-muted-foreground">
                Exclusive badges for super supporters
              </p>
            </Card>

            <Card className="p-6 text-center border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/5 to-transparent">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl shadow-lg">
                ⭐
              </div>
              <h3 className="font-bold mb-2">Rare</h3>
              <p className="text-sm text-muted-foreground">
                Recognizing active community members
              </p>
            </Card>

            <Card className="p-6 text-center border-2 border-gray-400/50 bg-gradient-to-br from-gray-400/5 to-transparent">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-3xl shadow-lg">
                🎖️
              </div>
              <h3 className="font-bold mb-2">Common</h3>
              <p className="text-sm text-muted-foreground">
                Milestone achievements for all fans
              </p>
            </Card>
          </div>
          
          <div className="text-center">
            <Link to="/competitions/active">
              <Button variant="hero" size="lg">
                Start Earning Badges
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Beyond <span className="text-gradient">Prize Money</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10">
              <h3 className="text-2xl font-bold mb-4">Industry Exposure</h3>
              <p className="text-muted-foreground mb-4">
                Top performers get featured across the platform, increasing streams and fan base. Winners are showcased to record labels, brands, and event organizers.
              </p>
            </Card>
            
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-secondary/10">
              <h3 className="text-2xl font-bold mb-4">Fan Growth</h3>
              <p className="text-muted-foreground mb-4">
                Competitions attract thousands of listeners. Every submission is an opportunity to convert casual listeners into dedicated fans who follow your journey.
              </p>
            </Card>
            
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-accent/10">
              <h3 className="text-2xl font-bold mb-4">AI Feedback</h3>
              <p className="text-muted-foreground mb-4">
                Get detailed AI analysis on your submission: technical quality, emotional impact, commercial potential, and areas for improvement.
              </p>
            </Card>
            
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10">
              <h3 className="text-2xl font-bold mb-4">Live Event Opportunities</h3>
              <p className="text-muted-foreground mb-4">
                Quarterly championship finals feature live performances. Showcase your talent in front of industry professionals and enthusiastic crowds.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Competitions;

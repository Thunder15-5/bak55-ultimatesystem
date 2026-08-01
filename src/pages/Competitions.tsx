import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Clock, Vote, ArrowRight, Music, ShieldCheck, Sparkles, Star, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CompetitionPhaseTimeline } from "@/components/competition/CompetitionPhaseTimeline";
import { PrizeBreakdown } from "@/components/competition/PrizeBreakdown";
import { TrustSignals } from "@/components/competition/TrustSignals";
import { format, differenceInDays } from "date-fns";

interface Competition {
  id: string;
  title: string;
  description: string | null;
  prize_amount: number;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  voting_start_date: string | null;
  voting_end_date: string | null;
  status: string;
  max_submissions: number | null;
  submissions: { count: number }[];
}

const Competitions = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const { data } = await supabase
        .from('competitions')
        .select('*, submissions(count)')
        .order('created_at', { ascending: false })
        .limit(20);
      setCompetitions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeComps = competitions.filter(c => c.status === 'active');
  const pastComps = competitions.filter(c => c.status === 'completed');
  const featured = activeComps[0];

  const getPhase = (c: Competition) => {
    const now = new Date();
    const start = new Date(c.start_date);
    const end = new Date(c.end_date);
    const vs = c.voting_start_date ? new Date(c.voting_start_date) : null;
    const ve = c.voting_end_date ? new Date(c.voting_end_date) : null;
    if (now < start) return { label: "Opening Soon", color: "outline" as const };
    if (vs && ve && now >= vs && now <= ve) return { label: "Voting Live", color: "default" as const };
    if (now >= start && now <= end) return { label: "Submissions Open", color: "default" as const };
    return { label: "Completed", color: "secondary" as const };
  };

  const getTimeLeft = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return "Ended";
    if (days === 0) return "Ends today";
    return `${days}d left`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-10 px-4">
        <div className="container mx-auto max-w-5xl text-center space-y-5">
          <Badge variant="outline" className="text-xs gap-1.5">
            <Trophy className="w-3 h-3" /> Competition Engine
          </Badge>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
            Compete. Win.
            <br />
            <span className="text-gradient">Get Discovered.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Fair competitions with real prizes. 70% fan votes + 30% AI judging. Your talent decides.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/rising-stars/voting">
              <Button variant="hero" size="lg" className="w-full sm:w-auto gap-2">
                <Vote className="w-4 h-4" />
                Vote for Rising Stars
              </Button>
            </Link>
            <Link to="/join">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Join as Artist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Spotlight */}
      {featured && (
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-5xl">
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative aspect-video md:aspect-auto">
                  <img
                    src={featured.cover_image || "/genesis-competition.png.jpeg"}
                    alt={featured.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                      🔴 LIVE NOW
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">{featured.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {featured.description || "Join the competition and showcase your talent."}
                    </p>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 rounded-lg bg-background/50 border border-border/50">
                        <Trophy className="h-4 w-4 mx-auto mb-1 text-primary" />
                        <div className="text-xs text-muted-foreground">Prize</div>
                        <div className="text-sm font-bold">{featured.prize_amount.toLocaleString()}</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-background/50 border border-border/50">
                        <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                        <div className="text-xs text-muted-foreground">Entries</div>
                        <div className="text-sm font-bold">{featured.submissions?.[0]?.count || 0}/{featured.max_submissions || "∞"}</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-background/50 border border-border/50">
                        <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                        <div className="text-xs text-muted-foreground">Time</div>
                        <div className="text-sm font-bold">{getTimeLeft(featured.end_date)}</div>
                      </div>
                    </div>

                    {/* Phase Timeline */}
                    <div className="mb-4">
                      <CompetitionPhaseTimeline currentPhase={
                        getPhase(featured).label === "Submissions Open" ? "submissions" :
                        getPhase(featured).label === "Voting Live" ? "voting" : "submissions"
                      } />
                    </div>
                  </div>

                  <Link to={`/competition/${featured.id}`}>
                    <Button className="w-full" size="lg">
                      Enter Competition <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Active Competitions Grid */}
      {activeComps.length > 1 && (
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-xl font-bold mb-4">Active Competitions</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {activeComps.slice(1).map((comp) => {
                const phase = getPhase(comp);
                return (
                  <Link key={comp.id} to={`/competition/${comp.id}`}>
                    <Card className="p-4 hover:border-primary/30 transition-all group cursor-pointer h-full">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {comp.cover_image ? (
                            <img src={comp.cover_image} alt={comp.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Trophy className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">{comp.title}</h3>
                            <Badge variant={phase.color} className="text-[10px] flex-shrink-0">{phase.label}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3 w-3" /> {comp.prize_amount.toLocaleString()} BAK
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {comp.submissions?.[0]?.count || 0} entries
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-12 px-4 bg-muted/20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            How <span className="text-gradient">It Works</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Submit Your Track", desc: "Upload your original music during the submission window.", icon: Music },
              { step: "2", title: "Fans Vote", desc: "Community votes with BAKCoins. 65% of each vote goes to you.", icon: Vote },
              { step: "3", title: "Win Prizes", desc: "Top artists win cash prizes, exposure, and industry recognition.", icon: Trophy },
            ].map((item) => (
              <Card key={item.step} className="p-5 text-center bg-card/50 border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Step {item.step}</div>
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Structure */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-6">
            Prize <span className="text-gradient">Distribution</span>
          </h2>
          <PrizeBreakdown totalPrize={featured?.prize_amount || 10000} />
          <p className="text-xs text-center text-muted-foreground mt-3">
            Prize pools vary by competition. All prizes paid in BAKCoins.
          </p>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-10 px-4 bg-muted/20">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-bold text-center mb-5">Fair & Transparent</h2>
          <TrustSignals />
        </div>
      </section>

      {/* Founders Season Journey */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <Badge variant="outline" className="text-xs gap-1.5 mb-3">
              <Star className="w-3 h-3" /> Founders Season
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              The <span className="text-gradient">7-Phase Journey</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              From 55 founding artists to 1 champion
            </p>
          </div>
          <div className="space-y-2">
            {[
              { n: 1, name: "Selection", artists: "55 Artists", icon: Users },
              { n: 2, name: "Mini Edition 1", artists: "55 → 45", icon: Music },
              { n: 3, name: "Mini Edition 2", artists: "45 → 35", icon: Music },
              { n: 4, name: "Mini Edition 3", artists: "35 → 25", icon: Sparkles },
              { n: 5, name: "Studio Round", artists: "25 → 15", icon: Music },
              { n: 6, name: "Semi-Finals", artists: "15 → 5", icon: Star },
              { n: 7, name: "Grand Finale", artists: "5 → 1 🏆", icon: Trophy },
            ].map((stage) => (
              <div key={stage.n} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/30">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <stage.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{stage.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px] flex-shrink-0">{stage.artists}</Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Winners / Completed */}
      {pastComps.length > 0 && (
        <section className="py-10 px-4 bg-muted/20">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-xl font-bold mb-4">Past Competitions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pastComps.slice(0, 6).map((comp) => (
                <Link key={comp.id} to={`/competition/${comp.id}`}>
                  <Card className="p-4 hover:border-primary/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Trophy className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{comp.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {comp.prize_amount.toLocaleString()} BAK • {comp.submissions?.[0]?.count || 0} entries
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Compete?</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Enter an open competition and let fans back your track.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/rising-stars/voting">
              <Button variant="hero" size="lg" className="w-full sm:w-auto gap-2">
                <Vote className="w-4 h-4" /> Vote Now
              </Button>
            </Link>
            <Link to="/join">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Apply as Artist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Competitions;

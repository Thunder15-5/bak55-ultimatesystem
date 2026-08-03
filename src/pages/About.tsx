import { PageSEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LiveStatsRow } from "@/components/LiveStatsRow";
import {
  Target, Eye, Music, Users, TrendingUp, DollarSign,
  ArrowRight, Shield, Zap, Globe, AlertTriangle, CheckCircle2,
  Smartphone, Brain, BarChart3
} from "lucide-react";

const differentiators = [
  { competitor: "Spotify / Boomplay", them: "Pay per stream ($0.003)", us: "Competitions + direct fan purchases" },
  { competitor: "Audiomack", them: "Free distribution only", us: "Monetization + competition + fan economy" },
  { competitor: "TikTok", them: "Algorithmic lottery", us: "Structured competition, open-entry, fan-judged" },
  { competitor: "Traditional (Idols)", them: "TV-based, gatekept", us: "Digital-first, continuous, transparent" },
];

const whyNowReasons = [
  { icon: Smartphone, title: "Mobile Money is Mature", text: "M-Pesa and fintech APIs make micropayments viable across Africa. This wasn't possible 5 years ago." },
  { icon: Globe, title: "Africa's Global Moment", text: "Afrobeats and African sounds are breaking worldwide, but most emerging artists still have no structured route to an audience." },
  { icon: Brain, title: "AI Reduces Costs", text: "What used to require a label — feedback, analytics, positioning — can now be delivered via software at near-zero cost." },
  { icon: BarChart3, title: "Youth Demographics", text: "Africa is the youngest continent on earth, and its next generation of artists is building online first." },

];

const About = () => {
  return (
    <>
      <PageSEO page="about" />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main>
          <article>
            {/* Hero */}
            <section className="relative pt-32 pb-16 px-4 overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-5" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-background to-background" aria-hidden="true" />

              <div className="container mx-auto max-w-4xl relative">
                <header className="text-center space-y-5 mb-16">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
                    <Target className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span className="text-sm font-medium">Our Story</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold animate-fade-in leading-tight">
                    The Career Launchpad <br className="hidden sm:block" />
                    for <span className="text-gradient">African Artists</span>
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in">
                    BAK55 is a talent discovery and monetization platform where emerging African musicians compete, grow fanbases, and earn real money — without signing away their rights.
                  </p>
                </header>
              </div>
            </section>

            {/* Problem + Solution */}
            <section className="py-12 md:py-20 px-4">
              <div className="container mx-auto max-w-4xl space-y-8">
                <Card className="p-8 md:p-10 bg-card/50 backdrop-blur-sm border-destructive/10">
                  <div className="flex items-start gap-4 md:gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-7 h-7 text-destructive" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">The Problem</h2>
                      <ul className="space-y-3 text-muted-foreground">
                        <li className="flex gap-3"><span className="text-destructive font-bold">→</span> Discovery is broken. Labels scout from 3 cities — the vast majority of talent is invisible.</li>
                        <li className="flex gap-3"><span className="text-destructive font-bold">→</span> Monetization is gatekept. Spotify pays $0.003/stream. An emerging artist needs 300K+ monthly streams to earn minimum wage.</li>
                        <li className="flex gap-3"><span className="text-destructive font-bold">→</span> The industry extracts, not builds. Labels offer exploitative deals claiming 50-80% of rights because artists have no leverage.</li>
                        <li className="flex gap-3"><span className="text-destructive font-bold">→</span> Fan energy has no channel. Fans want to support artists but have no meaningful way beyond passive streaming.</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card className="p-8 md:p-10 bg-card/50 backdrop-blur-sm border-primary/10">
                  <div className="flex items-start gap-4 md:gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Zap className="w-7 h-7 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">Our Solution</h2>
                      <p className="text-muted-foreground mb-4">BAK55 solves this with four interlocking systems that create a self-reinforcing flywheel:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { title: "Competitions", desc: "Structured talent contests with fan voting and real prizes" },
                          { title: "BAKCoin Economy", desc: "Platform currency for voting, tipping, and purchases" },
                          { title: "Artist Tools", desc: "Upload, analytics, AI feedback, and career building" },
                          { title: "Fan Engagement", desc: "Follow, vote, tip, join fan clubs, earn rewards" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-semibold text-foreground">{item.title}</span>
                              <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-4 italic">
                        Competitions create urgency → urgency drives coin purchases → purchases fund prizes → prizes attract artists → artists attract fans. It's a flywheel, not a feature list.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* Vision + Mission */}
            <section className="py-12 md:py-20 px-4">
              <div className="container mx-auto max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-8 bg-card/50 backdrop-blur-sm border-secondary/10 hover:shadow-elegant transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center mb-5 shadow-lg">
                      <Eye className="w-7 h-7 text-white" aria-hidden="true" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold mb-3">Vision</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      To become the default launchpad for African musical talent — the platform where the next Burna Boy, Tems, or Diamond Platnumz gets their first 10,000 fans, first revenue, and first industry opportunity.
                    </p>
                  </Card>

                  <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10 hover:shadow-elegant transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-5 shadow-lg">
                      <Target className="w-7 h-7 text-white" aria-hidden="true" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold mb-3">Mission</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      To give every talented African artist — regardless of location, connections, or capital — a fair shot at building a music career through transparent competition, direct fan monetization, and professional tools.
                    </p>
                  </Card>
                </div>
              </div>
            </section>

            {/* Where we are today */}
            <section className="py-12 md:py-20 px-4">
              <div className="container mx-auto max-w-4xl">
                <Card className="p-8 md:p-10 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
                  <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3 text-center">
                    Where We <span className="text-gradient">Stand Today</span>
                  </h2>
                  <p className="mb-8 text-center text-sm text-muted-foreground">
                    Live counts read directly from our database. No projections, no estimates.
                  </p>
                  <LiveStatsRow />
                </Card>
              </div>
            </section>


            {/* Why Now */}
            <section className="py-12 md:py-20 px-4">
              <div className="container mx-auto max-w-4xl">
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-10">
                  Why <span className="text-gradient">Now</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {whyNowReasons.map((reason, i) => (
                    <Card key={i} className="p-6 bg-card/50 backdrop-blur-sm border-primary/5 hover:border-primary/20 transition-all group">
                      <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                        <reason.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-heading font-bold mb-2">{reason.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{reason.text}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* What Makes BAK55 Different */}
            <section className="py-12 md:py-20 px-4">
              <div className="container mx-auto max-w-4xl">
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-10">
                  What Makes BAK55 <span className="text-gradient">Different</span>
                </h2>
                <Card className="overflow-hidden border-primary/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-primary/5 border-b border-primary/10">
                          <th className="text-left p-4 font-heading font-bold">Platform</th>
                          <th className="text-left p-4 font-heading font-bold text-muted-foreground">What They Do</th>
                          <th className="text-left p-4 font-heading font-bold text-primary">BAK55 Difference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {differentiators.map((row, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="p-4 font-medium">{row.competitor}</td>
                            <td className="p-4 text-muted-foreground">{row.them}</td>
                            <td className="p-4 text-primary font-medium">{row.us}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
                <p className="text-sm text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
                  BAK55 is the only platform where fans directly fund artist careers through a gamified economy. It's not streaming. It's not social media. It's a talent marketplace with built-in monetization.
                </p>
              </div>
            </section>

            {/* Our Journey */}
            <section className="py-12 md:py-20 px-4">
              <div className="container mx-auto max-w-4xl">
                <Card className="p-10 md:p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                  <div className="text-center space-y-6">
                    <h2 className="text-2xl md:text-3xl font-heading font-bold">Our Journey</h2>
                    <div className="max-w-2xl mx-auto space-y-4 text-muted-foreground leading-relaxed">
                      <p>
                        Founded by Bith Agustine A., who spent 5 years managing artists and witnessing firsthand the exploitation in the industry. After helping 5 artists record songs and organizing 10 live events, Bith recognized the need for systemic change.
                      </p>
                      <p>
                        BAK55 launched in 2025 with a clear thesis: use AI and a circular token economy to create a fairer music industry. Starting in Kenya, we're building the infrastructure that will scale across Africa.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* CTA */}
            <section className="py-12 md:py-20 px-4">
              <div className="container mx-auto max-w-4xl text-center space-y-6">
                <h2 className="text-2xl md:text-3xl font-heading font-bold">
                  Ready to Be Part of This?
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Whether you create music, support artists, or want to partner — there's a place for you on BAK55.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link to="/signup">
                    <Button variant="hero" size="lg" className="group">
                      Join BAK55 Free
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="glass" size="lg">
                      Partner with Us
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default About;

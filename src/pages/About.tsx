import { PageSEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Music, Target, Eye, Users, TrendingUp, DollarSign } from "lucide-react";

const About = () => {
  return (
    <>
      <PageSEO page="about" />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main>
          <article>
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-5" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-background to-background" aria-hidden="true" />
              
              <div className="container mx-auto max-w-4xl relative">
                <header className="text-center space-y-6 mb-16">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
                    <Target className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span className="text-sm font-medium">Our Story</span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-heading font-bold animate-fade-in">
                    About <span className="text-gradient">BAK55</span>
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
                    Building the essential infrastructure for African music's digital future
                  </p>
                </header>

                <div className="space-y-12">
                  <Card className="p-8 md:p-10 bg-card/50 backdrop-blur-sm border-primary/10 hover:shadow-elegant transition-all">
                    <div className="flex items-start gap-4 md:gap-6 mb-6">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Target className="w-7 h-7 md:w-8 md:h-8 text-white" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Our Mission</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          To create a fair, transparent, and artist-first ecosystem where African musicians can build sustainable careers without exploitation. We combine AI technology with a circular economy to ensure artists are fairly compensated and fans actively participate in success stories.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-8 md:p-10 bg-card/50 backdrop-blur-sm border-secondary/10 hover:shadow-elegant transition-all">
                    <div className="flex items-start gap-4 md:gap-6 mb-6">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Eye className="w-7 h-7 md:w-8 md:h-8 text-white" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Our Vision</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          To become the default platform for the next generation of African artists—a place where talent is discovered, developed, and monetized fairly. We envision a future where every African artist has access to professional tools, global audiences, and sustainable income streams.
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Market Context - VERIFIED IFPI DATA */}
                  <Card className="p-8 md:p-10 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
                    <h3 className="text-2xl font-heading font-bold mb-6 text-center">
                      The <span className="text-gradient">Market Opportunity</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4">
                        <DollarSign className="w-10 h-10 text-primary mx-auto mb-3" aria-hidden="true" />
                        <div className="text-3xl font-bold text-gradient mb-1">$110M</div>
                        <p className="text-sm text-muted-foreground">Sub-Saharan Africa Recorded Music Revenue (2024)</p>
                      </div>
                      <div className="text-center p-4">
                        <TrendingUp className="w-10 h-10 text-secondary mx-auto mb-3" aria-hidden="true" />
                        <div className="text-3xl font-bold text-gradient-secondary mb-1">22.6%</div>
                        <p className="text-sm text-muted-foreground">Year-on-Year Growth (Fastest Globally)</p>
                      </div>
                      <div className="text-center p-4">
                        <Music className="w-10 h-10 text-accent mx-auto mb-3" aria-hidden="true" />
                        <div className="text-3xl font-bold text-accent mb-1">$59M</div>
                        <p className="text-sm text-muted-foreground">Spotify Payouts Nigeria & SA (2024)</p>
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-4">Source: IFPI Global Music Report 2025</p>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-8 md:p-10 bg-card/50 backdrop-blur-sm border-accent/10 hover:shadow-elegant transition-all group">
                      <div className="p-3 rounded-xl bg-accent/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                        <Music className="w-10 h-10 text-accent" aria-hidden="true" />
                      </div>
                      <h3 className="text-2xl font-heading font-bold mb-3">The Problem We Solve</h3>
                      <p className="text-muted-foreground">
                        African artists face systemic challenges: unfair label contracts claiming 50-80% of rights, limited access to professional tools, and lack of direct monetization options. We're changing that with fair compensation and artist ownership.
                      </p>
                    </Card>

                    <Card className="p-8 md:p-10 bg-card/50 backdrop-blur-sm border-primary/10 hover:shadow-elegant transition-all group">
                      <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                        <Users className="w-10 h-10 text-primary" aria-hidden="true" />
                      </div>
                      <h3 className="text-2xl font-heading font-bold mb-3">Our Approach</h3>
                      <p className="text-muted-foreground">
                        Four integrated pillars: Streaming, Competitions, BAKCoins Economy, and AI Tools. Everything works together to create multiple income streams and growth opportunities for artists.
                      </p>
                    </Card>
                  </div>

                  <Card className="p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                    <div className="text-center space-y-6">
                      <h2 className="text-3xl font-bold">Our Journey</h2>
                      <div className="max-w-2xl mx-auto space-y-4 text-muted-foreground">
                        <p>
                          Founded by Bith Agustine A., who spent 5 years managing artists and witnessing firsthand the exploitation in the industry. After helping 5 artists record songs and organizing 10 live events, Bith recognized the need for systemic change.
                        </p>
                        <p>
                          BAK55 launched in 2025 with a clear mission: use AI and blockchain economics to create a fairer music industry. Starting in Kenya, we're building the infrastructure that will scale across Africa.
                        </p>
                      </div>
                    </div>
                  </Card>
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

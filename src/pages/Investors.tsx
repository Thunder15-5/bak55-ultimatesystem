import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, DollarSign, Users, Zap, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Investors = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-7xl font-bold">
              Invest in
              <br />
              <span className="text-gradient">African Music's Future</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join us in building essential infrastructure for the fastest-growing music market globally
            </p>
          </div>

          {/* Funding Round */}
          <Card className="p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 mb-16">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Pre-Seed Round Open</span>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold">$50,000 for 15% Equity</h2>
                <p className="text-xl text-muted-foreground">
                  Post-money valuation: $333K
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold text-gradient-primary mb-2">Q1 2026</div>
                  <div className="text-sm text-muted-foreground">MVP Launch</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gradient-secondary mb-2">$500K</div>
                  <div className="text-sm text-muted-foreground">Seed Round Target</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent mb-2">$10-50M</div>
                  <div className="text-sm text-muted-foreground">Exit Range (Year 5-7)</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Market Opportunity - UPDATED WITH VERIFIED IFPI DATA */}
          <div className="space-y-12 mb-16">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">
                The <span className="text-gradient">Opportunity</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Verified IFPI Global Music Report 2025 data showing Africa's explosive growth
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all hover:scale-105">
                <DollarSign className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-3">$110M Market</h3>
                <p className="text-muted-foreground">
                  Sub-Saharan Africa recorded music revenue (2024). Fastest-growing region globally with Afrobeats going mainstream.
                </p>
                <p className="text-xs text-primary/60 mt-2">Source: IFPI Global Music Report 2025</p>
              </Card>

              <Card className="p-8 bg-card/50 backdrop-blur-sm border-secondary/10 hover:border-secondary/30 transition-all hover:scale-105">
                <TrendingUp className="w-12 h-12 text-secondary mb-4" />
                <h3 className="text-2xl font-bold mb-3">22.6% YoY Growth</h3>
                <p className="text-muted-foreground">
                  Year-on-year growth rate—the fastest of any region worldwide. Digital adoption accelerating across the continent.
                </p>
                <p className="text-xs text-secondary/60 mt-2">Source: IFPI Global Music Report 2025</p>
              </Card>

              <Card className="p-8 bg-card/50 backdrop-blur-sm border-accent/10 hover:border-accent/30 transition-all hover:scale-105">
                <Globe className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-2xl font-bold mb-3">First-Mover</h3>
                <p className="text-muted-foreground">
                  No direct competitors in integrated AI-powered, fair-economy model. Defining the category for African music tech.
                </p>
              </Card>
            </div>

            {/* Additional Market Context */}
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Why Now?
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Afrobeats is now a global genre on mainstream charts</li>
                    <li>• Mobile money penetration enables direct artist payments</li>
                    <li>• Youth population (median age 19) driving digital adoption</li>
                    <li>• Internet access growing 20%+ annually across Africa</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-secondary" />
                    Revenue Reality
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• $59M Spotify payouts to Nigeria & South Africa (2024)</li>
                    <li>• Most artists lack infrastructure to monetize effectively</li>
                    <li>• Label contracts often take 50-80% of artist revenue</li>
                    <li>• BAK55 offers fair 85/15 artist-first split</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Traction & Roadmap */}
          <Card className="p-12 bg-card/50 backdrop-blur-sm border-primary/10 mb-16">
            <h2 className="text-4xl font-bold text-center mb-12">
              Our <span className="text-gradient">Roadmap</span>
            </h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                  <span className="text-white font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Months 1-6: Foundation</h3>
                  <p className="text-muted-foreground">
                    MVP launch, 100 founding artists, 1,000 total artists, 5,000 fans, first cash withdrawals, product-market fit validation
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Months 7-18: Growth</h3>
                  <p className="text-muted-foreground">
                    Kenya dominance, 5,000 artists, 50,000 fans, full AI suite, mobile optimization, profitability, Tanzania prep
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <span className="text-white font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Year 2-3: Regional Scale</h3>
                  <p className="text-muted-foreground">
                    East Africa coverage, 20,000 artists, 250,000 fans, $300K+ revenue, 40%+ margins, West Africa entry
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                  <span className="text-white font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Year 4-5: Continental Leadership</h3>
                  <p className="text-muted-foreground">
                    Pan-African scale, 100,000+ artists, 1M+ fans, enterprise tools, API platform, industry standard status, exit readiness
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Financial Projections */}
          <Card className="p-12 bg-gradient-to-br from-secondary/10 to-accent/10 border-secondary/20 mb-16">
            <h2 className="text-4xl font-bold text-center mb-12">
              Financial <span className="text-gradient-secondary">Projections</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-4 px-4">Metric</th>
                    <th className="text-right py-4 px-4">Year 1</th>
                    <th className="text-right py-4 px-4">Year 2</th>
                    <th className="text-right py-4 px-4">Year 3</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-primary/10">
                    <td className="py-4 px-4">Total Revenue</td>
                    <td className="text-right py-4 px-4 font-semibold">$61K</td>
                    <td className="text-right py-4 px-4 font-semibold">$183K</td>
                    <td className="text-right py-4 px-4 font-semibold">$300K</td>
                  </tr>
                  <tr className="border-b border-primary/10">
                    <td className="py-4 px-4">Operating Profit</td>
                    <td className="text-right py-4 px-4 font-semibold text-primary">$17K</td>
                    <td className="text-right py-4 px-4 font-semibold text-primary">$68K</td>
                    <td className="text-right py-4 px-4 font-semibold text-primary">$122K</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">Operating Margin</td>
                    <td className="text-right py-4 px-4 font-semibold text-accent">28.3%</td>
                    <td className="text-right py-4 px-4 font-semibold text-accent">36.8%</td>
                    <td className="text-right py-4 px-4 font-semibold text-accent">40.6%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Team */}
          <Card className="p-12 bg-card/50 backdrop-blur-sm border-primary/10 mb-16">
            <h2 className="text-4xl font-bold text-center mb-8">
              <span className="text-gradient">The Team</span>
            </h2>
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-muted/50">
                <h3 className="text-xl font-bold mb-2">Bith Agustine A. - CEO & Vision</h3>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• 5 years artist management (3 artists to Top 100 on Boomplay)</li>
                  <li>• Organized 12 live events with 500+ average attendance</li>
                  <li>• 50+ industry connections including A&Rs at major Record Labels</li>
                  <li>• Previously led digital marketing agency serving 20+ African artists</li>
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-muted/50">
                <h3 className="text-xl font-bold mb-2">CTO & AI Architect (Recruiting)</h3>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• Full-stack development with Mobile Money Transfer integration experience</li>
                  <li>• ML specialization and AI recommendation engine background</li>
                  <li>• AWS cloud architecture and real-time data processing</li>
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-muted/50">
                <h3 className="text-xl font-bold mb-2">Head of Artist Relations (Recruiting)</h3>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• Media/radio background with industry connections</li>
                  <li>• Artist development expertise and community building</li>
                  <li>• Deep understanding of youth culture and music trends</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <Card className="p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="text-center space-y-8">
              <Target className="w-16 h-16 text-primary mx-auto" />
              <div className="space-y-4">
                <h2 className="text-4xl font-bold">Ready to Discuss?</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  We're seeking strategic investors who understand African markets and believe in building fair, artist-first infrastructure.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button variant="hero" size="xl">
                    Request Pitch Deck
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="xl">
                    Schedule Call
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                investor@bak55talent.co.ke · Confidential business plan available to qualified investors
              </p>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Investors;
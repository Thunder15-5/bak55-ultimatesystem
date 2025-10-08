import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Music, Target, Eye, Users } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-7xl font-bold">
              About <span className="text-gradient">BAK55</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Building the essential infrastructure for African music's digital future
            </p>
          </div>

          <div className="space-y-12">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    To create a fair, transparent, and artist-first ecosystem where African musicians can build sustainable careers without exploitation. We combine AI technology with a circular economy to ensure artists are fairly compensated and fans actively participate in success stories.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur-sm border-secondary/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    To become the default platform for the next generation of African artists—a place where talent is discovered, developed, and monetized fairly. We envision a future where every African artist has access to professional tools, global audiences, and sustainable income streams.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-accent/10">
                <Music className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-2xl font-bold mb-3">The Problem We Solve</h3>
                <p className="text-muted-foreground">
                  92% of African artists earn under $100/month despite industry growth. Standard label contracts claim 50-80% of rights. We're changing that with fair compensation and artist ownership.
                </p>
              </Card>

              <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10">
                <Users className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-3">Our Approach</h3>
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
                    Founded by Atem Bith Madut, who spent 5 years managing artists and witnessing firsthand the exploitation in the industry. After helping 3 artists reach Top 100 on Boomplay and organizing 12 live events, Atem recognized the need for systemic change.
                  </p>
                  <p>
                    BAK55 launched in 2025 with a clear mission: use AI and blockchain economics to create a fairer music industry. Starting in Kenya, we're building the infrastructure that will scale across Africa.
                  </p>
                  <p className="font-semibold text-foreground">
                    We're currently seeking $50,000 pre-seed funding to launch our MVP and demonstrate product-market fit for a larger seed round.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;

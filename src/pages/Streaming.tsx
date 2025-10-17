import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Radio, Users, TrendingUp, Globe, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Radio,
    title: "AI-Curated Discovery",
    description: "Smart algorithms that understand 50+ African genres and connect you with the right audience.",
  },
  {
    icon: Users,
    title: "Artist-First Streaming",
    description: "Fair royalty rates and transparent payment tracking. Artists know exactly what they earn.",
  },
  {
    icon: Globe,
    title: "Regional Focus",
    description: "Discover emerging talent from Kenya, Tanzania, Uganda, and across East Africa.",
  },
  {
    icon: Heart,
    title: "Social Integration",
    description: "Follow artists, create playlists, share discoveries, and build your music community.",
  },
];

const Streaming = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 px-4">
        <div className="container mx-auto max-w-6xl text-center space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Music className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium">BAK55 Streaming Hub</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight">
            Stream African Music
            <br />
            <span className="text-gradient">Your Way</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience music streaming designed for African artists and fans. AI-powered discovery meets fair compensation in one powerful platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/join">
              <Button variant="hero" size="xl">
                Start Streaming
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="xl">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4 flex-shrink-0">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-gradient-primary mb-2">50+</div>
              <div className="text-muted-foreground">African Genres</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-gradient-secondary mb-2">Fair</div>
              <div className="text-muted-foreground">Royalty Rates</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-2">100%</div>
              <div className="text-muted-foreground">Transparent</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 md:mb-16">
            How <span className="text-gradient">Streaming Works</span>
          </h2>
          
          <div className="space-y-6 md:space-y-8">
            <Card className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-primary/10">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg sm:text-xl">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Upload Your Music</h3>
                  <p className="text-muted-foreground">
                    Upload tracks in high quality. Our AI analyzes your music to understand genre, mood, and cultural context for perfect discovery.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-primary/10">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg sm:text-xl">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">AI-Powered Discovery</h3>
                  <p className="text-muted-foreground">
                    Your music is matched with listeners who love your style. No need to game algorithms—our AI finds your audience organically.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-primary/10">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg sm:text-xl">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Earn BAKCoins</h3>
                  <p className="text-muted-foreground">
                    Every stream earns you BAKCoins. Track your earnings in real-time and withdraw to cash whenever you want.
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

export default Streaming;

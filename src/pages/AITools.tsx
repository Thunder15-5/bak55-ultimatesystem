import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, LineChart, Music, Mic, Image } from "lucide-react";
import { Link } from "react-router-dom";

const tools = [
  {
    icon: Brain,
    title: "AI Talent Scout",
    description: "Multi-modal analysis of audio, video, and social engagement. Predicts success probability with 85%+ accuracy.",
    color: "from-primary to-primary-glow",
  },
  {
    icon: Music,
    title: "Smart Discovery Engine",
    description: "Hyper-personalized recommendations across 50+ African genres. Understands cultural nuances and regional preferences.",
    color: "from-secondary to-secondary-glow",
  },
  {
    icon: LineChart,
    title: "Predictive Analytics",
    description: "Real-time trend forecasting 3-6 months ahead. Identify emerging genres and regional hotspots before they go mainstream.",
    color: "from-accent to-primary",
  },
  {
    icon: Mic,
    title: "Production Suite",
    description: "AI mastering, auto-tune, lyric generation, and backing tracks. Professional sound without expensive studio time.",
    color: "from-primary via-secondary to-accent",
  },
  {
    icon: Sparkles,
    title: "Content Enhancement",
    description: "AI-generated cover art, visualizers, and promotional content. Stand out with professional-quality assets.",
    color: "from-secondary to-accent",
  },
  {
    icon: Image,
    title: "Performance Analysis",
    description: "Video performance scoring for stage presence and emotional connection. Improve your live shows with AI feedback.",
    color: "from-accent to-secondary",
  },
];

const AITools = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Enhanced Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-background to-background" />
        
        <div className="container mx-auto max-w-6xl text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Infrastructure</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight animate-fade-in">
            Professional Tools
            <br />
            <span className="text-gradient">Powered by AI</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            End-to-end artificial intelligence integration that helps you create better, reach more fans, and make smarter career decisions.
          </p>
          
          <Link to="/ai-intelligence" className="inline-block w-full sm:w-auto max-w-md mx-auto">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">
              Launch AI Intelligence Suite
            </Button>
          </Link>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <Card 
                key={index} 
                className="group p-8 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 hover:shadow-elegant transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <tool.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-heading font-bold mb-3 group-hover:text-primary transition-colors">{tool.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
                <Link to="/ai-intelligence">
                  <Button variant="ghost" className="mt-4 group-hover:bg-primary/10">
                    Launch Tool →
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Artists Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Built for <span className="text-gradient">African Artists</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10">
              <h3 className="text-2xl font-bold mb-4">Cultural Understanding</h3>
              <p className="text-muted-foreground mb-4">
                Our AI is trained on African music specifically. It understands Afrobeats, Bongo Flava, Gengetone, Amapiano, and 50+ other genres with their cultural contexts.
              </p>
              <p className="text-muted-foreground">
                This means better recommendations, accurate talent scoring, and marketing insights that actually work for African artists.
              </p>
            </Card>
            
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-secondary/10">
              <h3 className="text-2xl font-bold mb-4">Accessible & Affordable</h3>
              <p className="text-muted-foreground mb-4">
                Professional AI tools that would normally cost hundreds of dollars per month. Available to all BAK55 artists for free or at minimal BAKCoins cost.
              </p>
              <p className="text-muted-foreground">
                No expensive studio time. No complex software. Just powerful tools that help you focus on creating great music.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Business Intelligence */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            <span className="text-gradient">Business Intelligence</span> for Artists
          </h2>
          
          <Card className="p-12 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <LineChart className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold mb-2">Demographic Deep Dive</h3>
                  <p className="text-muted-foreground">
                    Understand who your fans are, where they're from, and what they love. Map the complete listener journey from discovery to superfan.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <LineChart className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold mb-2">Release Timing Optimization</h3>
                  <p className="text-muted-foreground">
                    AI analyzes when your audience is most active and engaged. Get personalized recommendations for the best days and times to drop new music.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <LineChart className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold mb-2">Career Trajectory Modeling</h3>
                  <p className="text-muted-foreground">
                    See projections of your growth based on current trends. Understand what it takes to reach the next level and track progress toward your goals.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AITools;

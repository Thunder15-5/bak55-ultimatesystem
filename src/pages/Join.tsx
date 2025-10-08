import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Music, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const artistBenefits = [
  "Upload unlimited music and videos",
  "Participate in all competitions",
  "Earn BAKCoins from streaming and tips",
  "Access AI production and analytics tools",
  "Connect with fans and build community",
  "Get discovered by labels and brands",
];

const fanBenefits = [
  "Discover emerging African talent",
  "Vote in competitions and influence winners",
  "Tip your favorite artists directly",
  "Access exclusive content and behind-the-scenes",
  "Build playlists and share discoveries",
  "Be part of artist success stories",
];

const Join = () => {
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<"artist" | "fan">("artist");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    toast.success(`Thanks for your interest! We'll contact you soon about joining as ${userType === "artist" ? "an artist" : "a fan"}.`);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Join the
            <br />
            <span className="text-gradient">100 Artist Alliance</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Be among the first to experience BAK55. Limited spots available for founding members with exclusive lifetime benefits.
          </p>
        </div>
      </section>

      {/* User Type Selection */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className={`p-8 cursor-pointer transition-all ${
                userType === "artist" 
                  ? "border-primary bg-primary/5" 
                  : "border-primary/10 hover:border-primary/30"
              }`}
              onClick={() => setUserType("artist")}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Join as Artist</h3>
                <p className="text-muted-foreground">
                  Share your music, compete for prizes, and build your career
                </p>
              </div>
            </Card>
            
            <Card 
              className={`p-8 cursor-pointer transition-all ${
                userType === "fan" 
                  ? "border-secondary bg-secondary/5" 
                  : "border-primary/10 hover:border-primary/30"
              }`}
              onClick={() => setUserType("fan")}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Join as Fan</h3>
                <p className="text-muted-foreground">
                  Discover talent, vote on competitions, and support artists
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-12 bg-card/50 backdrop-blur-sm border-primary/10">
            <h2 className="text-3xl font-bold text-center mb-8">
              What You Get as {userType === "artist" ? "an Artist" : "a Fan"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(userType === "artist" ? artistBenefits : fanBenefits).map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Sign Up Form */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="text-center space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Get Early Access</h2>
                <p className="text-muted-foreground">
                  Join the waitlist for {userType === "artist" ? "founding artist status" : "early fan access"}
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-background/50 border-primary/20 focus:border-primary"
                />
                
                <Button type="submit" variant="hero" size="xl" className="w-full">
                  Join as {userType === "artist" ? "Artist" : "Fan"}
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  No credit card required · Launching Q1 2026 · 100% free during beta
                </p>
              </form>
              
              {userType === "artist" && (
                <div className="pt-8 border-t border-primary/10">
                  <p className="text-sm text-muted-foreground mb-4">
                    <strong>Founding Artist Benefits:</strong>
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                      Lifetime status badge
                    </div>
                    <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                      Priority support
                    </div>
                    <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                      Early AI access
                    </div>
                    <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                      Bonus BAKCoins
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Join;

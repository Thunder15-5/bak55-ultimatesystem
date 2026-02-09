import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Music, Users, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

const MAX_ARTISTS = 100;

const Join = () => {
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<"artist" | "fan">("artist");
  const [artistCount, setArtistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtistCount = async () => {
      const { count } = await supabase
        .from('early_access_signups')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'artist');
      setArtistCount(count || 0);
      setLoading(false);
    };
    fetchArtistCount();
  }, []);

  const isArtistSpotsClosed = artistCount >= MAX_ARTISTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (userType === 'artist' && isArtistSpotsClosed) {
      toast.error("Artist spots are full! Join as a fan or check back later.");
      return;
    }

    try {
      // Save to database
      const { error: dbError } = await supabase
        .from('early_access_signups')
        .insert({
          email: email.trim().toLowerCase(),
          source: 'join_page',
          user_type: userType,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        toast.error("Failed to save your signup. Please try again.");
        return;
      }

      // Send notification email to company
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'info@bak55talent.co.ke',
          subject: `New ${userType === 'artist' ? 'Artist' : 'Fan'} Signup - Join Page`,
          template: 'new_signup_admin',
          data: {
            email,
            user_type: userType === 'artist' ? 'Artist' : 'Fan',
            source: 'Join Page (100 Artist Alliance)',
          },
        },
      });

      if (emailError) {
        console.error('Email error:', emailError);
      }

      // Update count if artist
      if (userType === 'artist') {
        setArtistCount(prev => prev + 1);
        if (artistCount + 1 >= MAX_ARTISTS) {
          toast.success("🎉 You got the last spot! Redirecting...");
          setTimeout(() => navigate('/'), 2000);
          return;
        }
      }

      toast.success(`Thanks for your interest! We'll contact you soon about joining as ${userType === "artist" ? "an artist" : "a fan"}.`);
      setEmail("");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Something went wrong. Please try again.");
    }
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
          
          {/* Artist Counter */}
          {!loading && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-lg font-semibold text-primary">
                  {MAX_ARTISTS - artistCount} / {MAX_ARTISTS}
                </span>
                <span className="text-sm text-muted-foreground">Artist spots remaining</span>
              </div>
            </div>
          )}
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
                <h2 className="text-3xl font-bold mb-4">Get Started</h2>
                <p className="text-muted-foreground">
                  {userType === "artist" ? "Join as a founding artist" : "Join as an early fan"}
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
                  Get Early Access
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  🏆 Founders Season is live · Compete for prizes · Free to join
                </p>
              </form>

              {/* Continue to Full Registration */}
              <div className="pt-4 border-t border-primary/10">
                <p className="text-sm text-muted-foreground mb-4">
                  Ready to create your account?
                </p>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate(`/signup?role=${userType}&from=join`)}
                >
                  Continue to Registration →
                </Button>
              </div>
              
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
                      20 BAK welcome bonus
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

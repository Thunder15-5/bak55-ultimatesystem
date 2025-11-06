import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Mail, Lock, User, MapPin, Music2, Building2 } from "lucide-react";
import { toast } from "sonner";
import logoImage from "@/assets/bak55-logo.png";

export default function Signup() {
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"artist" | "fan" | "brand">("fan");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [stageName, setStageName] = useState("");
  const [genres, setGenres] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userData = {
      username,
      role,
      displayName: displayName || username,
      bio,
      location,
      ...(role === "artist" && {
        stageName: stageName || username,
        genres: genres ? genres.split(",").map((g) => g.trim()) : [],
      }),
      ...(role === "brand" && {
        companyName: companyName || username,
        industry,
      }),
    };

    const { error } = await signUp(email, password, userData);

    if (error) {
      toast.error(error.message || "Failed to create account");
      setLoading(false);
      return;
    }

    // Process referral after successful signup
    if (referralCode) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Find referrer by code
          const { data: codeData } = await supabase
            .from("referral_codes")
            .select("user_id")
            .eq("code", referralCode)
            .single();

          if (codeData) {
            // Create referral record
            await supabase.from("referrals").insert({
              referrer_id: codeData.user_id,
              referred_id: user.id,
              referral_code: referralCode,
            });

            // Update uses count
            await supabase.rpc("transfer_funds", {
              sender_id: '00000000-0000-0000-0000-000000000000',
              recipient_id: codeData.user_id,
              transfer_amount: 50
            });

            toast.success("Welcome! Your referrer earned 50 BAKCoins! 🎉");
          }
        }
      } catch (err) {
        console.error('Failed to process referral:', err);
      }
    }

    setLoading(false);
  };

  const roleCards = [
    { value: "fan", label: "Fan", icon: Sparkles, description: "Discover and support artists" },
    { value: "artist", label: "Artist", icon: Music2, description: "Build your music career" },
    { value: "brand", label: "Brand", icon: Building2, description: "Partner with talent" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 md:py-12">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-12 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-12 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-3xl relative z-10 border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl animate-scale-in">
        <CardHeader className="space-y-4 p-6 sm:p-8 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <img src={logoImage} alt="BAK55 Talent" className="h-20 w-auto" />
              <div className="absolute inset-0 blur-xl bg-primary/20 -z-10" />
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl md:text-4xl font-heading">
              <span className="text-gradient">Join BAK55</span>
            </CardTitle>
            <CardDescription className="text-base">
              Create your account and start your music journey
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 p-6 sm:p-8">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">I am a... *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roleCards.map((roleCard) => (
                  <button
                    key={roleCard.value}
                    type="button"
                    onClick={() => setRole(roleCard.value as any)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      role === roleCard.value
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-primary/20 hover:border-primary/40 bg-background/50'
                    }`}
                  >
                    <roleCard.icon className={`w-8 h-8 mb-2 mx-auto ${role === roleCard.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="font-semibold text-sm">{roleCard.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{roleCard.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-background/50 border-primary/20 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-background/50 border-primary/20 focus:border-primary"
                  required
                />
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Username *
                </Label>
                <Input
                  id="username"
                  placeholder="coolartist123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 bg-background/50 border-primary/20 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11 bg-background/50 border-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="Nairobi, Kenya"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 bg-background/50 border-primary/20 focus:border-primary"
              />
            </div>

            {/* Role-specific fields */}
            {role === "artist" && (
              <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="stageName" className="text-sm font-medium flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-primary" />
                    Stage Name
                  </Label>
                  <Input
                    id="stageName"
                    placeholder="DJ Cool"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    className="h-11 bg-background/50 border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genres" className="text-sm font-medium">
                    Genres (comma-separated)
                  </Label>
                  <Input
                    id="genres"
                    placeholder="Afrobeats, Hip Hop, R&B"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    className="h-11 bg-background/50 border-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}

            {role === "brand" && (
              <div className="space-y-4 p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-secondary" />
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Music Company Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-11 bg-background/50 border-secondary/20 focus:border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium">
                    Industry
                  </Label>
                  <Input
                    id="industry"
                    placeholder="Entertainment"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="h-11 bg-background/50 border-secondary/20 focus:border-secondary"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">
                Bio (Optional)
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="resize-none bg-background/50 border-primary/20 focus:border-primary"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 p-6 sm:p-8">
            <Button
              type="submit"
              variant="hero"
              className="w-full h-12 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <Sparkles className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Login instead
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

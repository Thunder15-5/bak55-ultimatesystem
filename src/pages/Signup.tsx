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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, Mail, Lock, User, MapPin, Music2, Building2, Globe, Headphones } from "lucide-react";
import { toast } from "sonner";
import logoImage from "@/assets/bak55-logo.png";
import { FEATURES } from "@/lib/featureFlags";

export default function Signup() {
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"artist" | "fan" | "brand" | "producer">("fan");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [stageName, setStageName] = useState("");
  const [genres, setGenres] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [producerName, setProducerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [confirmedKenya, setConfirmedKenya] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);

  const redirectUrl = searchParams.get("redirect");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const getErrorMessage = (error: any): string => {
    const msg = error?.message?.toLowerCase() || '';
    
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate')) {
      return 'This email is already registered. Please login instead.';
    }
    if (msg.includes('password') && msg.includes('weak')) {
      return 'Password is too weak. Please use at least 6 characters.';
    }
    if (msg.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('rate limit') || msg.includes('too many')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (msg.includes('database') || msg.includes('saving')) {
      return 'We encountered a temporary issue. Please try again.';
    }
    
    return error?.message || 'Failed to create account. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate inputs
    if (!email || !password || !username) {
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    // Kenya-only restriction
    if (FEATURES.KENYA_ONLY_SIGNUP && !confirmedKenya) {
      toast.error("Please confirm you are based in Kenya to continue");
      setLoading(false);
      return;
    }

    // Terms and age verification
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      setLoading(false);
      return;
    }

    if (!confirmedAge) {
      toast.error("Please confirm you are at least 16 years old");
      setLoading(false);
      return;
    }

    // Build userData with all required fields for the database trigger
    const userData = {
      username: username.trim(),
      role: role, // Ensure role is explicitly set
      displayName: (displayName || username).trim(),
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      // Artist-specific fields
      stageName: role === "artist" ? (stageName || username).trim() : undefined,
      genres: (role === "artist" || role === "producer") 
        ? (genres ? genres.split(",").map((g) => g.trim()).filter(Boolean) : [])
        : undefined,
      // Brand-specific fields  
      companyName: role === "brand" ? (companyName || username).trim() : undefined,
      industry: role === "brand" ? (industry.trim() || undefined) : undefined,
      // Producer-specific fields
      producerName: role === "producer" ? (producerName || username).trim() : undefined,
    };

    console.log('Signing up with role:', role, 'userData:', userData);

    try {
      const { error } = await signUp(email.trim(), password, userData, redirectUrl || undefined);

      if (error) {
        toast.error(getErrorMessage(error));
        setLoading(false);
        return;
      }

      // Process referral after successful signup using edge function
      if (referralCode) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Use the enhanced process-referral edge function
            const { data, error: refError } = await supabase.functions.invoke('process-referral', {
              body: {
                referral_code: referralCode,
                referred_user_id: user.id,
                reward_type: 'signup'
              }
            });

            if (!refError && data?.success) {
              toast.success(`Welcome! Your referrer earned ${data.referrer_reward} BAKCoins! ${data.referred_bonus > 0 ? `You got ${data.referred_bonus} BAK welcome bonus!` : ''} 🎉`);
            } else if (data?.flagged) {
              toast.info("Your referral is being reviewed");
            }
          }
        } catch (err) {
          console.error('Failed to process referral:', err);
        }
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const roleCards = [
    { value: "fan", label: "Fan", icon: Sparkles, description: "Discover & support artists" },
    { value: "artist", label: "Artist", icon: Music2, description: "Build your music career" },
    { value: "producer", label: "Producer", icon: Headphones, description: "Sell beats & collaborate" },
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
          <CardContent className="space-y-6 p-4 sm:p-6 md:p-8">
            {/* Role Selection - Mobile Optimized */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">I am a... *</Label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {roleCards.map((roleCard) => (
                  <button
                    key={roleCard.value}
                    type="button"
                    onClick={() => setRole(roleCard.value as any)}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center text-center min-h-[90px] sm:min-h-[100px] ${
                      role === roleCard.value
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-muted hover:border-primary/40 bg-background/50'
                    }`}
                  >
                    <roleCard.icon className={`w-6 h-6 sm:w-8 sm:h-8 mb-1.5 sm:mb-2 flex-shrink-0 ${role === roleCard.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="font-semibold text-xs sm:text-sm">{roleCard.label}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2 leading-tight">{roleCard.description}</div>
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

            {/* Country Confirmation - Kenya Only */}
            {FEATURES.KENYA_ONLY_SIGNUP && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">Country Availability</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  BAK55 Talent is currently available only in Kenya. We're expanding to more African countries soon!
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="kenyaConfirm" 
                    checked={confirmedKenya}
                    onCheckedChange={(checked) => setConfirmedKenya(checked as boolean)}
                  />
                  <label
                    htmlFor="kenyaConfirm"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I confirm I am based in Kenya
                  </label>
                </div>
              </div>
            )}

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

            {role === "producer" && (
              <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="producerName" className="text-sm font-medium flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-primary" />
                    Producer Name
                  </Label>
                  <Input
                    id="producerName"
                    placeholder="Beat Master"
                    value={producerName}
                    onChange={(e) => setProducerName(e.target.value)}
                    className="h-11 bg-background/50 border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="producerGenres" className="text-sm font-medium">
                    Genres (comma-separated)
                  </Label>
                  <Input
                    id="producerGenres"
                    placeholder="Hip Hop, Trap, Afrobeats"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    className="h-11 bg-background/50 border-primary/20 focus:border-primary"
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

            {/* Legal Compliance Checkboxes */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-primary/10">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="ageConfirm" 
                  checked={confirmedAge}
                  onCheckedChange={(checked) => setConfirmedAge(checked as boolean)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="ageConfirm"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I confirm I am at least <strong>16 years old</strong>
                </label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="termsConfirm" 
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="termsConfirm"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline font-medium" target="_blank">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline font-medium" target="_blank">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 p-6 sm:p-8">
            <Button
              type="submit"
              variant="hero"
              className="w-full h-12 text-base font-semibold"
              disabled={loading || !agreedToTerms || !confirmedAge}
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

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              <Link to={`/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`} className="text-primary hover:underline font-semibold">
                Login instead
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

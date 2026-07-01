import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Sparkles,
  Mail,
  Lock,
  User,
  Music2,
  Building2,
  Headphones,
  ArrowRight,
  ArrowLeft,
  Shield,
  Coins,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { FEATURES } from "@/lib/featureFlags";

const logoImage = "/bak55-logo.png";

const TOTAL_STEPS = 3;

const roleCards = [
  {
    value: "fan" as const,
    label: "Fan",
    icon: Sparkles,
    tagline: "Discover & support artists",
    bonus: "10 BAK bonus",
  },
  {
    value: "artist" as const,
    label: "Artist",
    icon: Music2,
    tagline: "Build your music career",
    bonus: "20 BAK bonus",
  },
  {
    value: "producer" as const,
    label: "Producer",
    icon: Headphones,
    tagline: "Sell beats & collaborate",
    bonus: "20 BAK bonus",
  },
  {
    value: "brand" as const,
    label: "Brand",
    icon: Building2,
    tagline: "Partner with talent",
    bonus: "10 BAK bonus",
  },
];

export default function Signup() {
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Role
  const [role, setRole] = useState<"artist" | "fan" | "brand" | "producer">("fan");

  // Step 2: Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // Step 3: Role-specific + legal
  const [stageName, setStageName] = useState("");
  const [genres, setGenres] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [producerName, setProducerName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);

  const [referralCode, setReferralCode] = useState("");
  const redirectUrl = searchParams.get("redirect");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);
    const roleParam = searchParams.get("role");
    if (roleParam && ["fan", "artist", "brand", "producer"].includes(roleParam)) {
      setRole(roleParam as any);
      // Skip step 1 if role pre-selected
      setStep(2);
    }
  }, [searchParams]);

  const getErrorMessage = (error: any): string => {
    const msg = error?.message?.toLowerCase() || "";
    if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("duplicate"))
      return "This email is already registered. Please login instead.";
    if (msg.includes("password") && msg.includes("weak"))
      return "Password is too weak. Use at least 6 characters with a mix of letters and numbers.";
    if (msg.includes("invalid email")) return "Please enter a valid email address.";
    if (msg.includes("rate limit") || msg.includes("too many"))
      return "Our server is busy. Please wait 2-3 minutes and try again.";
    if (msg.includes("network") || msg.includes("fetch"))
      return "Connection error. Please check your internet and try again.";
    return error?.message || "Failed to create account. Please try again.";
  };

  const canProceedStep2 = email && password && password.length >= 6 && username;
  const canSubmit = agreedToTerms && confirmedAge;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    const userData = {
      username: username.trim(),
      role,
      displayName: username.trim(),
      stageName: role === "artist" ? (stageName || username).trim() : undefined,
      genres:
        role === "artist" || role === "producer"
          ? genres
              .split(",")
              .map((g) => g.trim())
              .filter(Boolean)
          : undefined,
      companyName: role === "brand" ? (companyName || username).trim() : undefined,
      producerName: role === "producer" ? (producerName || username).trim() : undefined,
    };

    try {
      const { error } = await signUp(email.trim(), password, userData, redirectUrl || undefined);
      if (error) {
        toast.error(getErrorMessage(error));
        setLoading(false);
        return;
      }

      // Process referral in background
      if (referralCode) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data, error: refError } = await supabase.functions.invoke("process-referral", {
              body: { referral_code: referralCode, referred_user_id: user.id, reward_type: "signup" },
            });
            if (!refError && data?.success) {
              toast.success(
                `Your referrer earned ${data.referrer_reward} BAKCoins!${data.referred_bonus > 0 ? ` You got ${data.referred_bonus} BAK bonus!` : ""} 🎉`
              );
            }
          }
        } catch {
          // non-blocking
        }
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roleCards.find((r) => r.value === role)!;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-12 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-secondary/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Logo + Progress */}
        <div className="text-center space-y-4">
          <img src={logoImage} alt="BAK55 Talent" className="h-12 w-auto mx-auto" />
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s < step
                      ? "bg-primary text-primary-foreground"
                      : s === step
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < TOTAL_STEPS && (
                  <div className={`w-8 h-0.5 ${s < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* ========== STEP 1: Role Selection ========== */}
          {step === 1 && (
            <div className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-heading font-bold">
                  <span className="text-gradient">I want to join as...</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose how you'll use BAK55. You can always change later.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {roleCards.map((rc) => (
                  <button
                    key={rc.value}
                    type="button"
                    onClick={() => setRole(rc.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left space-y-2 ${
                      role === rc.value
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border/50 hover:border-primary/40 bg-background/30"
                    }`}
                  >
                    <rc.icon
                      className={`w-6 h-6 ${role === rc.value ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <div className="font-semibold text-sm">{rc.label}</div>
                      <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        {rc.tagline}
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <Coins className="w-3 h-3" />
                      {rc.bonus}
                    </div>
                  </button>
                ))}
              </div>

              <Button
                variant="hero"
                className="w-full h-12 text-base font-semibold"
                onClick={() => setStep(2)}
              >
                Continue as {selectedRole.label}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Log in
                </Link>
              </p>
            </div>
          )}

          {/* ========== STEP 2: Credentials ========== */}
          {step === 2 && (
            <div className="p-6 space-y-5">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-heading font-bold">
                  <span className="text-gradient">Create your account</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Joining as <span className="text-primary font-medium">{selectedRole.label}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 bg-background/50 border-border/50 focus:border-primary text-base"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="text"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-background/50 border-border/50 focus:border-primary text-base"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 bg-background/50 border-border/50 focus:border-primary"
                    required
                  />
                  {password && password.length < 6 && (
                    <p className="text-xs text-destructive">Password must be at least 6 characters</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="hero"
                  className="flex-1 h-11 text-base font-semibold"
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                >
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>

              {/* Trust bar */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Encrypted
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Free to join
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3" /> Welcome bonus
                </span>
              </div>
            </div>
          )}

          {/* ========== STEP 3: Profile + Legal ========== */}
          {step === 3 && (
            <div className="p-6 space-y-5">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-heading font-bold">
                  <span className="text-gradient">Almost there!</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  {role === "artist"
                    ? "Tell fans who you are"
                    : role === "producer"
                      ? "Set up your producer profile"
                      : role === "brand"
                        ? "Tell us about your company"
                        : "One last step to get started"}
                </p>
              </div>

              <div className="space-y-4">
                {/* Role-specific fields */}
                {role === "artist" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="stageName" className="text-sm font-medium flex items-center gap-2">
                        <Music2 className="w-3.5 h-3.5 text-primary" />
                        Stage Name
                      </Label>
                      <Input
                        id="stageName"
                        placeholder="Your artist name"
                        value={stageName}
                        onChange={(e) => setStageName(e.target.value)}
                        className="h-11 bg-background/50 border-border/50 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genres" className="text-sm font-medium">
                        Genres
                      </Label>
                      <Input
                        id="genres"
                        placeholder="Afrobeats, Hip Hop, R&B"
                        value={genres}
                        onChange={(e) => setGenres(e.target.value)}
                        className="h-11 bg-background/50 border-border/50 focus:border-primary"
                      />
                      <p className="text-[11px] text-muted-foreground">Separate with commas</p>
                    </div>
                  </>
                )}

                {role === "producer" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="producerName" className="text-sm font-medium flex items-center gap-2">
                        <Headphones className="w-3.5 h-3.5 text-primary" />
                        Producer Name
                      </Label>
                      <Input
                        id="producerName"
                        placeholder="Your producer name"
                        value={producerName}
                        onChange={(e) => setProducerName(e.target.value)}
                        className="h-11 bg-background/50 border-border/50 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="producerGenres" className="text-sm font-medium">
                        Genres
                      </Label>
                      <Input
                        id="producerGenres"
                        placeholder="Hip Hop, Trap, Afrobeats"
                        value={genres}
                        onChange={(e) => setGenres(e.target.value)}
                        className="h-11 bg-background/50 border-border/50 focus:border-primary"
                      />
                    </div>
                  </>
                )}

                {role === "brand" && (
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="Your company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-11 bg-background/50 border-border/50 focus:border-primary"
                    />
                  </div>
                )}

                {/* Welcome bonus teaser */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {selectedRole.bonus} welcome bonus
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Credited to your wallet after verification
                    </p>
                  </div>
                </div>

                {/* Legal */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/30">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="ageConfirm"
                      checked={confirmedAge}
                      onCheckedChange={(checked) => setConfirmedAge(checked as boolean)}
                      className="mt-0.5"
                    />
                    <label htmlFor="ageConfirm" className="text-sm leading-relaxed cursor-pointer">
                      I am at least <strong>16 years old</strong>
                    </label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="termsConfirm"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      className="mt-0.5"
                    />
                    <label htmlFor="termsConfirm" className="text-sm leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:underline font-medium" target="_blank">
                        Terms
                      </Link>{" "}
                      &{" "}
                      <Link to="/privacy" className="text-primary hover:underline font-medium" target="_blank">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="h-11" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="hero"
                  className="flex-1 h-12 text-base font-semibold"
                  disabled={loading || !canSubmit}
                  onClick={handleSubmit}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Account
                      <Sparkles className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom trust */}
        {step > 1 && (
          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              to={`/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
              className="text-primary hover:underline font-semibold"
            >
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

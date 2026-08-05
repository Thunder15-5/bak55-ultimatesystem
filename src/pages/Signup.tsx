import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
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
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { checkPassword } from "@/lib/authRules";

const logoImage = "/bak55-logo.png";

// Inline Google G mark (brand-accurate, no color-utility hack)
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.42-1.7 4.16-5.5 4.16-3.32 0-6.02-2.74-6.02-6.13S8.68 5.99 12 5.99c1.88 0 3.14.8 3.86 1.48l2.64-2.55C16.9 3.43 14.68 2.5 12 2.5 6.99 2.5 2.94 6.55 2.94 11.56S6.99 20.62 12 20.62c6.93 0 8.5-6.09 7.83-9.42H12z"/>
  </svg>
);

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

  // Quick vs full flow. Default = quick (social-first + magic link).
  const [useFullForm, setUseFullForm] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

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
      // Role pre-selected → skip to credentials in the full form
      setUseFullForm(true);
      setStep(2);
    }
    // Explicit escape hatch for users who want the classic wizard
    if (searchParams.get("mode") === "full") setUseFullForm(true);
  }, [searchParams]);

  // Cooldown ticker for magic-link resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Persist intent (role + redirect) so post-OAuth onboarding can consume it.
  const stashIntent = () => {
    try {
      const roleParam = searchParams.get("role");
      if (roleParam) sessionStorage.setItem("signupIntentRole", roleParam);
      else sessionStorage.setItem("signupIntentRole", role);
      if (redirectUrl) sessionStorage.setItem("signupIntentRedirect", redirectUrl);
      if (referralCode) sessionStorage.setItem("signupIntentReferral", referralCode);
    } catch {
      // storage unavailable — safe to ignore
    }
  };

  const mapAuthError = (err: any): string => {
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("rate") || msg.includes("too many"))
      return "Too many attempts. Please wait ~60 seconds and try again.";
    if (msg.includes("popup") || msg.includes("closed"))
      return "The sign-in window was closed before finishing. Try again.";
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch"))
      return "Network hiccup — check your connection and try again.";
    if (msg.includes("invalid email")) return "That email doesn't look right.";
    if (msg.includes("provider is not enabled"))
      return "Google sign-in isn't enabled yet. Use email instead.";
    if (msg.includes("expired"))
      return "This link has expired. Request a fresh one below.";
    return err?.message || "Something went wrong. Please try again.";
  };

  const handleGoogle = async () => {
    setOauthError(null);
    setOauthLoading(true);
    stashIntent();
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) {
        setOauthError(mapAuthError(result.error));
        setOauthLoading(false);
        return;
      }
      // If redirected, browser is navigating away; otherwise session is set — AuthCallback will route.
    } catch (err: any) {
      setOauthError(mapAuthError(err));
      setOauthLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail.trim()) return;
    setMagicError(null);
    setMagicLoading(true);
    stashIntent();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: referralCode ? { referral_code: referralCode } : undefined,
        },
      });
      if (error) {
        setMagicError(mapAuthError(error));
      } else {
        setMagicSent(true);
        setResendCooldown(30);
        toast.success("Check your email for the sign-in link");
      }
    } catch (err: any) {
      setMagicError(mapAuthError(err));
    } finally {
      setMagicLoading(false);
    }
  };

  const handleResendMagic = async () => {
    if (resendCooldown > 0 || !magicEmail.trim()) return;
    setMagicError(null);
    setMagicLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setMagicError(mapAuthError(error));
      else {
        setResendCooldown(30);
        toast.success("Sent another link");
      }
    } catch (err: any) {
      setMagicError(mapAuthError(err));
    } finally {
      setMagicLoading(false);
    }
  };

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

  const canProceedStep2 = Boolean(email && username && checkPassword(password).valid);
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
          {useFullForm && (
            <>
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
            </>
          )}
        </div>

        {/* ========== QUICK MODE (default): Social + Magic Link ========== */}
        {!useFullForm && (
          <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="p-6 space-y-5">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-heading font-bold">
                  <span className="text-gradient">Join BAK55</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  One tap to start. Pick your role after — no password needed.
                </p>
              </div>

              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-semibold bg-background/60 border-border/60 hover:bg-background/90"
                onClick={handleGoogle}
                disabled={oauthLoading || magicLoading}
              >
                {oauthLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <GoogleIcon />
                    <span className="ml-2">Continue with Google</span>
                  </>
                )}
              </Button>

              {oauthError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 flex items-start gap-2">
                  <p className="text-xs text-destructive flex-1 leading-relaxed">{oauthError}</p>
                  <button
                    type="button"
                    onClick={handleGoogle}
                    className="text-[11px] font-semibold text-destructive hover:underline shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-card px-3 text-muted-foreground">or magic link</span>
                </div>
              </div>

              {/* Magic link */}
              {magicSent ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">Check your inbox</p>
                  <p className="text-xs text-muted-foreground break-words">
                    We sent a sign-in link to <span className="text-foreground">{magicEmail}</span>. It expires in 60 minutes.
                  </p>
                  {magicError && (
                    <p className="text-[11px] text-destructive">{magicError}</p>
                  )}
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={handleResendMagic}
                      disabled={resendCooldown > 0 || magicLoading}
                      className="text-primary hover:underline font-medium disabled:text-muted-foreground disabled:no-underline"
                    >
                      {magicLoading
                        ? "Sending…"
                        : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : "Resend link"}
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMagicSent(false);
                        setMagicError(null);
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Use a different email
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-3">
                  {magicError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                      <p className="text-xs text-destructive leading-relaxed">{magicError}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="magicEmail" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      Email address
                    </Label>
                    <Input
                      id="magicEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={magicEmail}
                      onChange={(e) => setMagicEmail(e.target.value)}
                      className="h-12 bg-background/50 border-border/50 focus:border-primary text-base"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      inputMode="email"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full h-12 text-base font-semibold"
                    disabled={magicLoading || oauthLoading || !magicEmail.trim()}
                  >
                    {magicLoading ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Sending link…
                      </>
                    ) : (
                      <>
                        Email me a sign-in link
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Trust bar */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> No password
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3" /> 10 BAK bonus
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Free forever
                </span>
              </div>

              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                By continuing you agree to our{" "}
                <Link to="/terms" className="text-primary hover:underline">Terms</Link> &{" "}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. You must be 16+.
              </p>

              <div className="flex flex-col items-center gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setUseFullForm(true)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Prefer email + password? <span className="text-primary font-semibold">Use classic signup</span>
                </button>
                <Link
                  to={`/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Already have an account? <span className="text-primary font-semibold">Log in</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ========== FULL WIZARD (opt-in) ========== */}
        {useFullForm && (
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
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-background/50 border-border/50 focus:border-primary text-base"
                    autoComplete="new-password"
                    required
                  />
                  <PasswordStrengthMeter password={password} />

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
        )}

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

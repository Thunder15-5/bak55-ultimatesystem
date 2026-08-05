import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, ArrowRight, Shield, Sparkles, Coins, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { authErrorMessage, safeRedirectPath } from "@/lib/authRules";

const logoImage = "/bak55-logo.png";

export default function Login() {
  const { signIn, signInWithGoogle, signInWithMagicLink } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectUrl = safeRedirectPath(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password, redirectUrl || undefined);
    if (error) {
      const msg = authErrorMessage(error, "Login failed. Please try again.");
      setFormError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setFormError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle(redirectUrl || undefined);
    if (error) {
      setFormError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setFormError("Enter your email first");
      return;
    }
    setFormError(null);
    setMagicLoading(true);
    const { error } = await signInWithMagicLink(email.trim(), redirectUrl || undefined);
    if (error) {
      setFormError(error.message);
    } else {
      setMagicSent(true);
      toast.success("Check your email for the sign-in link");
    }
    setMagicLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-12 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-secondary/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <img src={logoImage} alt="BAK55 Talent" className="h-12 w-auto mx-auto" />
          <div>
            <h1 className="text-2xl font-heading font-bold">
              <span className="text-gradient">Welcome back</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Log in to continue your music journey
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl p-6 space-y-5">
          {formError && (
            <Alert variant="destructive" className="py-2.5">
              <AlertDescription className="text-xs">{formError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium gap-3"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14Z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
              <span className="bg-card px-2 text-muted-foreground">or use email</span>
            </div>
          </div>

          {mode === "password" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-background/50 border-border/50 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-background/50 border-border/50 focus:border-primary"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Log In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode("magic");
                  setFormError(null);
                }}
                className="w-full text-xs text-primary hover:underline font-medium"
              >
                Email me a one-tap sign-in link instead
              </button>
            </form>
          ) : magicSent ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Check your inbox</p>
                <p className="text-xs text-muted-foreground">
                  We sent a sign-in link to <span className="text-foreground">{email}</span>. It
                  expires in 60 minutes.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={() => {
                  setMagicSent(false);
                  setMode("password");
                }}
              >
                Use password instead
              </Button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email" className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="magic-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-background/50 border-border/50 focus:border-primary"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  No password needed — we'll email you a secure link.
                </p>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full h-12 text-base font-semibold"
                disabled={magicLoading}
              >
                {magicLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  "Send sign-in link"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setFormError(null);
                }}
                className="w-full text-xs text-primary hover:underline font-medium"
              >
                Log in with a password instead
              </button>
            </form>
          )}

          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-2 border-t border-border/30">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> Encrypted login
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3" /> M-Pesa payouts
            </span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            New to BAK55?{" "}
            <Link
              to={`/signup${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
              className="text-primary hover:underline font-semibold"
            >
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

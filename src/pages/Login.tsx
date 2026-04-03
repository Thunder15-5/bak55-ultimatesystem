import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, ArrowRight, Shield, Users, Coins } from "lucide-react";
import { toast } from "sonner";

const logoImage = "/bak55-logo.png";

export default function Login() {
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectUrl = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getLoginErrorMessage = (error: any): string => {
    const msg = (error?.message || "").toLowerCase();
    if (msg.includes("invalid login credentials"))
      return "Invalid email or password. If you recently signed up, check your email to verify your account first.";
    if (msg.includes("email not confirmed"))
      return "Please verify your email before logging in. Check your inbox for a confirmation link.";
    if (msg.includes("rate limit") || msg.includes("too many"))
      return "Too many attempts. Please wait a few minutes and try again.";
    if (msg.includes("network") || msg.includes("fetch"))
      return "Connection error. Check your internet and try again.";
    return error?.message || "Login failed. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password, redirectUrl || undefined);
    if (error) toast.error(getLoginErrorMessage(error));
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-12 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-secondary/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header */}
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

        {/* Form Card */}
        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
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
          </form>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-2 border-t border-border/30">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> Secure login
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> 10K+ users
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3" /> M-Pesa payouts
            </span>
          </div>
        </div>

        {/* Bottom */}
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

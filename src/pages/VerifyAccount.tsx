import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mail,
  Loader2,
  CheckCircle,
  Shield,
  Coins,
  Music,
  Users,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const logoImage = "/bak55-logo.png";

export default function VerifyAccount() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const getRoleInfo = () => {
    switch (userRole) {
      case "artist":
        return { bonus: 20, next: "Upload your first track", icon: Music, path: "/artist/dashboard" };
      case "producer":
        return { bonus: 20, next: "Upload your first beat", icon: Music, path: "/producer/dashboard" };
      case "brand":
        return { bonus: 10, next: "Discover artists", icon: TrendingUp, path: "/brand/dashboard" };
      default:
        return { bonus: 10, next: "Discover music & vote", icon: Users, path: "/fan/dashboard" };
    }
  };

  const info = getRoleInfo();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-activation-code", {
        body: { activation_code: code },
      });
      if (error) throw error;
      if (data.success) {
        const bonus = data.welcomeBonus || info.bonus;
        toast.success(`Account activated! You received ${bonus} BAKCoins! 🎉`);
        setTimeout(() => navigate(info.path), 1500);
      } else {
        toast.error(data.error || "Invalid code");
      }
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!user?.email) {
      toast.error("Please log in first");
      return;
    }
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke("resend-activation-code", { body: {} });
      if (error) {
        toast.error("Failed to resend code");
        return;
      }
      if (data.success) {
        if (data.code) {
          toast.success(`Your activation code is: ${data.code}`);
          setCode(data.code);
        } else {
          toast.success(data.message || "Code sent! Check your email.");
        }
      } else {
        toast.error(data.error || "Failed to resend");
      }
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-12 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-12 w-80 h-80 bg-secondary/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <img src={logoImage} alt="BAK55 Talent" className="h-12 w-auto mx-auto" />
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold">
            <span className="text-gradient">Verify your email</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="text-foreground font-medium">{user?.email}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl p-6 space-y-5">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                Activation Code
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-[0.3em] font-mono h-14 bg-background/50 border-border/50 focus:border-primary"
                required
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full h-12 text-base font-semibold"
              disabled={verifying || code.length !== 6}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Activate Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Bonus teaser */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{info.bonus} BAKCoins waiting</p>
              <p className="text-xs text-muted-foreground">{info.next}</p>
            </div>
          </div>

          <div className="text-center space-y-2 pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground">Didn't receive the code?</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResendCode}
              disabled={resending}
              className="text-primary hover:text-primary"
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-3.5 w-3.5" />
                  Resend Code
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

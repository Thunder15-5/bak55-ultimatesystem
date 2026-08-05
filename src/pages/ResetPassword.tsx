import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, CheckCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { authErrorMessage, checkPassword, MIN_PASSWORD_LENGTH } from "@/lib/authRules";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

const logoImage = "/bak55-logo.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [success, setSuccess] = useState(false);

  const strength = checkPassword(password);

  useEffect(() => {
    let cancelled = false;

    const establishRecoverySession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");
      const errorDescription = hashParams.get("error_description");

      if (errorDescription) {
        toast.error(authErrorMessage({ message: errorDescription }));
        navigate("/forgot-password", { replace: true });
        return;
      }

      if (accessToken && refreshToken && type === "recovery") {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // Strip the tokens out of the address bar immediately.
        window.history.replaceState(null, "", "/reset-password");
        if (error) {
          toast.error(authErrorMessage(error, "This reset link is no longer valid."));
          navigate("/forgot-password", { replace: true });
          return;
        }
        if (!cancelled) setChecking(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("This reset link is invalid or has expired. Request a new one.");
        navigate("/forgot-password", { replace: true });
        return;
      }
      if (!cancelled) setChecking(false);
    };

    establishRecoverySession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!strength.valid) {
      toast.error(strength.issues[0] || `Use at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(authErrorMessage(error, "Failed to reset password"));
        return;
      }

      setSuccess(true);
      toast.success("Password updated — signing you out of all devices");
      // Any session created from a stolen link is invalidated too.
      await supabase.auth.signOut({ scope: "global" });
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      toast.error(authErrorMessage(err, "An unexpected error occurred"));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-12 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 -right-12 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <Card className="w-full max-w-md relative z-10 border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl animate-scale-in">
        <CardHeader className="space-y-4 p-6 sm:p-8 text-center">
          <div className="flex items-center justify-center mb-2">
            <img src={logoImage} alt="BAK55 Talent" className="h-16 w-auto" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl md:text-3xl font-heading">
              <span className="text-gradient">{success ? "Password reset" : "Set a new password"}</span>
            </CardTitle>
            <CardDescription className="text-sm">
              {success
                ? "Your password has been updated and other sessions were signed out"
                : "Choose a strong password you haven't used before"}
            </CardDescription>
          </div>
        </CardHeader>

        {success ? (
          <CardContent className="space-y-6 p-6 sm:p-8 pt-0">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">Redirecting you to login...</p>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 p-6 sm:p-8 pt-0">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-background/50 border-primary/20 focus:border-primary"
                  required
                />
                <PasswordStrengthMeter password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 bg-background/50 border-primary/20 focus:border-primary"
                  required
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full h-12 text-base font-semibold"
                disabled={loading || !strength.valid || password !== confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 justify-center">
                <ShieldCheck className="w-3 h-3" />
                All other devices will be signed out
              </p>
            </CardContent>
          </form>
        )}
      </Card>
    </div>
  );
}

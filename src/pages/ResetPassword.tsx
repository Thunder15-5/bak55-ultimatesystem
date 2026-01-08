import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import logoImage from "@/assets/bak55-logo.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Get the access token from URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (token && type === 'recovery') {
      setAccessToken(token);
    } else {
      // Check if we have a session from the recovery link
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          toast.error("Invalid or expired reset link");
          navigate("/forgot-password");
        }
      });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
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
        toast.error(error.message || "Failed to reset password");
      } else {
        setSuccess(true);
        toast.success("Password reset successfully!");
        // Redirect to login after 2 seconds
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-12 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-12 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md relative z-10 border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl animate-scale-in">
        <CardHeader className="space-y-4 p-6 sm:p-8 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <img src={logoImage} alt="BAK55 Talent" className="h-20 w-auto" />
              <div className="absolute inset-0 blur-xl bg-primary/20 -z-10" />
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl md:text-4xl font-heading">
              <span className="text-gradient">
                {success ? "Password Reset!" : "New Password"}
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              {success 
                ? "Your password has been updated successfully" 
                : "Enter your new password below"
              }
            </CardDescription>
          </div>
        </CardHeader>

        {success ? (
          <CardContent className="space-y-6 p-6 sm:p-8 pt-0">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Redirecting you to login...
              </p>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 p-6 sm:p-8 pt-0">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-background/50 border-primary/20 focus:border-primary"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 bg-background/50 border-primary/20 focus:border-primary"
                  required
                  minLength={6}
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
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </CardContent>
          </form>
        )}
      </Card>
    </div>
  );
}

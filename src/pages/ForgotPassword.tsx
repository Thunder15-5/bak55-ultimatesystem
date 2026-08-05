import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail, CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const logoImage = "/bak55-logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: authRedirectUrl("/reset-password"),
      });
      if (error) {
        toast.error(authErrorMessage(error, "Failed to send reset email"));
      } else {
        // Always show the same confirmation so the form can't be used to
        // discover which emails have accounts.
        setEmailSent(true);
        toast.success("Reset link sent!");
      }
    } catch (err) {
      toast.error(authErrorMessage(err, "An unexpected error occurred"));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-12 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-secondary/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <img src={logoImage} alt="BAK55 Talent" className="h-12 w-auto mx-auto" />
          <h1 className="text-2xl font-heading font-bold">
            <span className="text-gradient">Reset password</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {emailSent
              ? "Check your inbox for a reset link"
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl p-6">
          {emailSent ? (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Reset link sent to:</p>
                <p className="font-semibold text-primary">{email}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Didn't get it? Check spam or try again.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="outline" onClick={() => setEmailSent(false)} className="w-full">
                  Try different email
                </Button>
                <Link to="/login" className="w-full">
                  <Button variant="hero" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
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

              <Button
                type="submit"
                variant="hero"
                className="w-full h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <Link
                to="/login"
                className="text-primary hover:underline text-sm font-medium flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

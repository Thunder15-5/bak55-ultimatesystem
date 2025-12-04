import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle, Shield } from "lucide-react";
import logoImage from "@/assets/bak55-logo.png";

export default function VerifyAccount() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-activation-code', {
        body: { activation_code: code }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Account activated successfully! 🎉");
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        toast.error(data.error || "Invalid activation code");
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || "Failed to verify code");
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
      const { data, error } = await supabase.functions.invoke('resend-activation-code', {
        body: {}
      });

      if (error) {
        console.error('Resend error:', error);
        toast.error("Failed to resend code. Please try again.");
        return;
      }

      if (data.success) {
        if (data.code) {
          // Email failed but we got the code directly
          toast.success(`Your activation code is: ${data.code}`);
          setCode(data.code);
        } else {
          toast.success(data.message || "Activation code sent! Check your email.");
        }
      } else {
        toast.error(data.error || "Failed to resend code");
      }
    } catch (error: any) {
      console.error('Resend error:', error);
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <Card className="w-full max-w-md border-primary/20 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={logoImage} alt="BAK55 Talent" className="h-20 w-auto" />
          </div>
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            <span className="text-gradient">Activate Your Account</span>
          </CardTitle>
          <CardDescription>
            We've sent a 6-digit activation code to <strong>{user?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Activation Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono h-14"
                required
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full h-12"
              disabled={verifying || code.length !== 6}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Activate Account
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendCode}
                disabled={resending}
                className="text-primary hover:text-primary-glow"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

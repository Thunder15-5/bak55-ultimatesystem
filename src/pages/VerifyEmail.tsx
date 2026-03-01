import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
const logoImage = "/bak55-logo.png";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    // Get current user email
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    });

    if (token && type === 'email') {
      verifyEmailToken(token);
    } else {
      setStatus('resend');
    }
  }, [searchParams]);

  const verifyEmailToken = async (token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) throw error;

      setStatus('success');
      toast.success('Email verified successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Email verification error:', error);
      setStatus('error');
      toast.error(error.message || 'Failed to verify email');
    }
  };

  const handleResendEmail = async () => {
    if (!userEmail) {
      toast.error('Please log in first');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) throw error;

      toast.success('Verification email sent! Please check your inbox.');
      setStatus('resend');
    } catch (error: any) {
      console.error('Resend email error:', error);
      toast.error(error.message || 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <img src={logoImage} alt="BAK55 Talent" className="h-20 w-auto" />
          </div>
          <CardTitle className="text-2xl md:text-3xl text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'verifying' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <CardDescription>Verifying your email address...</CardDescription>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <CardDescription className="text-green-600 dark:text-green-400">
                Email verified successfully! Redirecting to dashboard...
              </CardDescription>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <CardDescription className="text-destructive">
                Failed to verify email. The link may have expired.
              </CardDescription>
              <Button
                onClick={handleResendEmail}
                disabled={loading}
                variant="hero"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>
          )}

          {status === 'resend' && (
            <div className="text-center space-y-4">
              <Mail className="h-12 w-12 text-primary mx-auto" />
              <CardDescription>
                Please check your email ({userEmail}) for the verification link.
              </CardDescription>
              <Button
                onClick={handleResendEmail}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if user is verified or dismissed
  if (!user || user.email_confirmed_at || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      });

      if (error) throw error;

      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('Resend email error:', error);
      toast.error(error.message || 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Alert className="border-yellow-500/50 bg-yellow-500/10 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Mail className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div className="space-y-2 flex-1">
            <AlertDescription className="text-sm">
              Please verify your email address to access all features. Check your inbox for the verification link.
            </AlertDescription>
            <Button
              onClick={handleResend}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-yellow-500/50 hover:bg-yellow-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-3 w-3" />
                  Resend Email
                </>
              )}
            </Button>
          </div>
        </div>
        <Button
          onClick={() => setDismissed(true)}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

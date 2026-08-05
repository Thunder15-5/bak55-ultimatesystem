import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, LifeBuoy } from "lucide-react";

export default function AccountSuspended() {
  const { isSuspended, suspensionReason, signOut, user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && (!user || !isSuspended)) {
      navigate("/", { replace: true });
    }
  }, [ready, user, isSuspended, navigate]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-background to-destructive/5">
      <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card/95 backdrop-blur-xl shadow-2xl p-8 space-y-6 text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/15 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-heading font-bold">Your account is suspended</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Access to BAK55 has been paused while our Trust &amp; Safety team reviews activity on
            this account. Your balance and content are untouched.
          </p>
        </div>

        {suspensionReason && (
          <div className="rounded-xl border border-border/50 bg-background/40 p-4 text-left">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Reason given
            </p>
            <p className="text-sm">{suspensionReason}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="hero"
            className="w-full h-11"
            onClick={() => navigate("/support")}
          >
            <LifeBuoy className="w-4 h-4 mr-2" />
            Appeal or contact support
          </Button>
          <Button variant="outline" className="w-full h-11" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

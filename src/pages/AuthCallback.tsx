import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/components/PageLoader";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse hash fragment for tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const errorParam = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        if (errorParam) {
          console.error("Auth callback error:", errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Session error:", sessionError);
            setError(sessionError.message);
            setTimeout(() => navigate("/login"), 3000);
            return;
          }

          // Clean URL
          window.history.replaceState(null, "", "/auth/callback");

          // Get user role and redirect
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: roles } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", user.id);

            const allRoles = roles?.map((r: any) => r.role) ?? [];

            // Preserve any intended redirect (referral, ?redirect=, etc.)
            const intendedRedirect =
              sessionStorage.getItem("signupIntentRedirect") || "";
            const redirectSuffix = intendedRedirect
              ? `?redirect=${encodeURIComponent(intendedRedirect)}`
              : "";

            // New user with no role → onboarding
            if (allRoles.length === 0) {
              navigate(`/onboarding${redirectSuffix}`, { replace: true });
              return;
            }

            let redirectTo = intendedRedirect || "/fan/dashboard";
            if (!intendedRedirect) {
              if (allRoles.includes("admin")) redirectTo = "/admin";
              else if (allRoles.includes("brand")) redirectTo = "/brand/dashboard";
              else if (allRoles.includes("producer")) redirectTo = "/producer/dashboard";
              else if (allRoles.includes("artist")) redirectTo = "/artist/dashboard";
            }
            sessionStorage.removeItem("signupIntentRedirect");

            navigate(redirectTo, { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        } else {
          // No tokens — might be a simple redirect after email verification
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication failed");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    const lower = error.toLowerCase();
    const friendly = lower.includes("expired")
      ? "This sign-in link has expired. Request a new one from the login page."
      : lower.includes("access_denied") || lower.includes("cancelled")
      ? "Sign-in was cancelled. Please try again."
      : lower.includes("rate")
      ? "Too many attempts — wait a minute and try again."
      : error;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-5 p-8 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
          <h1 className="text-xl font-heading font-semibold text-destructive">
            We couldn't complete sign-in
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{friendly}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/signup")}
              className="px-4 h-11 rounded-lg border border-border/60 bg-background/40 text-sm font-medium hover:bg-background/70"
            >
              Back to sign up
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <PageLoader />;
}

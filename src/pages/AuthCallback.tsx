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
            let redirectTo = "/fan/dashboard";
            if (allRoles.includes("admin")) redirectTo = "/admin";
            else if (allRoles.includes("brand")) redirectTo = "/brand/dashboard";
            else if (allRoles.includes("producer")) redirectTo = "/producer/dashboard";
            else if (allRoles.includes("artist")) redirectTo = "/artist/dashboard";

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <PageLoader />;
}

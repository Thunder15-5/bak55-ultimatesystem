import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Music2, Headphones, Building2, ArrowRight, Coins } from "lucide-react";
import { toast } from "sonner";

const roleCards = [
  { value: "fan" as const, label: "Fan", icon: Sparkles, tagline: "Discover & support artists", bonus: "10 BAK" },
  { value: "artist" as const, label: "Artist", icon: Music2, tagline: "Build your music career", bonus: "20 BAK" },
  { value: "producer" as const, label: "Producer", icon: Headphones, tagline: "Sell beats & collaborate", bonus: "20 BAK" },
  { value: "brand" as const, label: "Brand", icon: Building2, tagline: "Partner with talent", bonus: "10 BAK" },
];

export default function Onboarding() {
  const { user, loading: authLoading, userRoles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<"fan" | "artist" | "producer" | "brand">("fan");
  const [saving, setSaving] = useState(false);

  // Pre-select from ?role= or stashed intent
  useEffect(() => {
    const intentRole =
      searchParams.get("role") || sessionStorage.getItem("signupIntentRole");
    if (intentRole && ["fan", "artist", "producer", "brand"].includes(intentRole)) {
      setRole(intentRole as any);
    }
  }, [searchParams]);

  const redirectTarget =
    searchParams.get("redirect") ||
    sessionStorage.getItem("signupIntentRedirect") ||
    undefined;

  // If user already has a role, bounce them out
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (userRoles && userRoles.length > 0) {
      const dest = redirectTarget || `/${userRoles[0]}/dashboard`;
      navigate(dest, { replace: true });
    }
  }, [authLoading, user, userRoles, navigate, redirectTarget]);

  const handleContinue = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role });
      if (roleErr && !String(roleErr.message).toLowerCase().includes("duplicate")) {
        throw roleErr;
      }

      sessionStorage.removeItem("signupIntentRole");
      sessionStorage.removeItem("signupIntentRedirect");

      toast.success("You're all set!");
      const dest = redirectTarget || `/${role}/dashboard`;
      navigate(dest, { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Could not save your role. Please try again.");
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold">
            <span className="text-gradient">Welcome to BAK55</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            One quick question — how will you use BAK55? You can change this later.
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {roleCards.map((rc) => (
              <button
                key={rc.value}
                type="button"
                onClick={() => setRole(rc.value)}
                className={`p-4 rounded-xl border-2 transition-all text-left space-y-2 ${
                  role === rc.value
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                    : "border-border/50 hover:border-primary/40 bg-background/30"
                }`}
              >
                <rc.icon
                  className={`w-6 h-6 ${role === rc.value ? "text-primary" : "text-muted-foreground"}`}
                />
                <div>
                  <div className="font-semibold text-sm">{rc.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {rc.tagline}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Coins className="w-3 h-3" />
                  {rc.bonus} bonus
                </div>
              </button>
            ))}
          </div>

          <Button
            variant="hero"
            className="w-full h-12 text-base font-semibold"
            disabled={saving}
            onClick={handleContinue}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue as {roleCards.find((r) => r.value === role)!.label}
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>

          {role === "artist" && (
            <p className="text-[11px] text-center text-muted-foreground">
              Withdrawals require KYC verification at Level 3. You can complete it later from your dashboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

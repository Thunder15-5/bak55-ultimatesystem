import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { actionToast } from "@/lib/actionToast";
import { PressableButton } from "@/components/PressableButton";
import { Crown, Star, Heart, Loader2, CheckCircle2, Lock } from "lucide-react";

interface FanClubTier {
  id: string;
  artist_id: string;
  tier_name: string;
  tier_level: number;
  price_bak: number;
  description: string;
  perks: string[];
  is_active: boolean;
}

interface FanClubSectionProps {
  artistId: string;
  isOwner?: boolean;
}

export function FanClubSection({ artistId, isOwner = false }: FanClubSectionProps) {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<FanClubTier[]>([]);
  const [memberships, setMemberships] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchTiers();
    if (user) fetchMemberships();
  }, [artistId, user]);

  const fetchTiers = async () => {
    const { data, error } = await supabase
      .from('fan_club_tiers')
      .select('*')
      .eq('artist_id', artistId)
      .eq('is_active', true)
      .order('tier_level');
    if (error) actionToast.error("Couldn't load fan club tiers");
    setTiers((data as any[]) || []);
    setLoading(false);
  };

  const fetchMemberships = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('fan_club_memberships')
      .select('tier_id')
      .eq('fan_id', user.id)
      .eq('artist_id', artistId)
      .eq('status', 'active');
    setMemberships((data || []).map((m: any) => m.tier_id));
  };

  const handleSubscribe = async (tier: FanClubTier) => {
    if (!user) {
      actionToast.error("Please log in to subscribe");
      return;
    }

    setSubscribing(tier.id);
    try {
      const { data, error } = await supabase.rpc('subscribe_fan_club', { p_tier_id: tier.id });
      const result = data as { success?: boolean; error?: string } | null;
      if (error || !result?.success) throw new Error(result?.error || error?.message || "Payment failed");
      setMemberships((current) => current.includes(tier.id) ? current : [...current, tier.id]);
      actionToast.success(`Subscribed to ${tier.tier_name}`);
    } catch (err) {
      actionToast.error(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setSubscribing(null);
    }
  };

  const tierIcons = [Heart, Star, Crown];

  if (loading) return null;
  if (tiers.length === 0 && !isOwner) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown className="w-5 h-5 text-primary" />
          Fan Club
        </CardTitle>
        <CardDescription>
          {isOwner ? "Manage your fan club tiers" : "Support this artist with a monthly subscription"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tiers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isOwner ? "Create tiers from your profile settings" : "No fan club tiers available yet"}
          </p>
        ) : (
          <div className="grid gap-3">
            {tiers.map((tier, idx) => {
              const Icon = tierIcons[Math.min(idx, tierIcons.length - 1)];
              const isMember = memberships.includes(tier.id);

              return (
                <div
                  key={tier.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isMember ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{tier.tier_name}</span>
                    </div>
                    <Badge variant={isMember ? "default" : "outline"}>
                      {tier.price_bak} BAK/mo
                    </Badge>
                  </div>
                  {tier.description && (
                    <p className="text-xs text-muted-foreground mb-2">{tier.description}</p>
                  )}
                  {tier.perks && tier.perks.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {tier.perks.map((perk, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!isOwner && (
                    <PressableButton
                      size="sm"
                      className="w-full"
                      variant={isMember ? "outline" : "default"}
                      disabled={isMember || subscribing === tier.id}
                      onClick={() => handleSubscribe(tier)}
                      hapticPattern="success"
                    >
                      {subscribing === tier.id ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing...</>
                      ) : isMember ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Subscribed</>
                      ) : (
                        `Subscribe — ${tier.price_bak} BAK`
                      )}
                    </PressableButton>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

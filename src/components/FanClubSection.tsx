import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
    const { data } = await supabase
      .from('fan_club_tiers')
      .select('*')
      .eq('artist_id', artistId)
      .eq('is_active', true)
      .order('tier_level');
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
      toast.error("Please log in to subscribe");
      return;
    }

    setSubscribing(tier.id);
    try {
      // Check wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!wallet || wallet.balance < tier.price_bak) {
        toast.error(`Insufficient balance. You need ${tier.price_bak} BAK.`);
        return;
      }

      // Deduct from wallet
      const { data: deductResult } = await supabase.rpc('deduct_wallet', {
        p_user_id: user.id,
        p_amount: tier.price_bak,
        p_description: `Fan Club: ${tier.tier_name} subscription`,
      });

      if (!(deductResult as any)?.success) {
        toast.error((deductResult as any)?.error || 'Payment failed');
        return;
      }

      // Credit artist (90% of subscription)
      const artistShare = tier.price_bak * 0.9;
      const { data: artistWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', artistId)
        .maybeSingle();

      if (artistWallet) {
        await supabase
          .from('wallets')
          .update({ balance: artistShare })
          .eq('user_id', artistId);
      }

      // Create membership
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await supabase.from('fan_club_memberships').insert({
        fan_id: user.id,
        tier_id: tier.id,
        artist_id: artistId,
        expires_at: expiresAt.toISOString(),
      });

      toast.success(`Subscribed to ${tier.tier_name}!`);
      fetchMemberships();
    } catch (err) {
      toast.error("Failed to subscribe");
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
                    <Button
                      size="sm"
                      className="w-full"
                      variant={isMember ? "outline" : "default"}
                      disabled={isMember || subscribing === tier.id}
                      onClick={() => handleSubscribe(tier)}
                    >
                      {subscribing === tier.id ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing...</>
                      ) : isMember ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Subscribed</>
                      ) : (
                        `Subscribe — ${tier.price_bak} BAK`
                      )}
                    </Button>
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

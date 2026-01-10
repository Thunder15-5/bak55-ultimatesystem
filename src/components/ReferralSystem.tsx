import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Share2, Gift, Users, CheckCircle2 } from "lucide-react";

interface ReferralData {
  code: string;
  usesCount: number;
  totalEarned: number;
  referrals: Array<{
    username: string;
    rewarded: boolean;
    created_at: string;
  }>;
}

export function ReferralSystem() {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    try {
      // Get or create referral code
      let { data: codeData, error: codeError } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (codeError && codeError.code !== 'PGRST116') throw codeError;

      if (!codeData) {
        // Generate new code
        const code = `BAK${user.id.substring(0, 8).toUpperCase()}`;
        const { data: newCode, error: insertError } = await supabase
          .from("referral_codes")
          .insert({ user_id: user.id, code })
          .select()
          .single();

        if (insertError) throw insertError;
        codeData = newCode;
      }

      // Get referral stats
      const { data: referrals, error: refError } = await supabase
        .from("referrals")
        .select(`
          referred_id,
          rewarded,
          created_at,
          profiles:referred_id (username)
        `)
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (refError) throw refError;

      // 2 BAK per premium referral (when referred user subscribes)
      const totalEarned = (referrals?.filter(r => r.rewarded).length || 0) * 2;

      setReferralData({
        code: codeData.code,
        usesCount: codeData.uses_count,
        totalEarned,
        referrals: referrals?.map(r => ({
          username: (r.profiles as any)?.username || 'Anonymous',
          rewarded: r.rewarded,
          created_at: r.created_at,
        })) || [],
      });
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralData) return;

    const referralLink = `${window.location.origin}/signup?ref=${referralData.code}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied to clipboard! 📋");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareReferralLink = async () => {
    if (!referralData) return;

    const referralLink = `${window.location.origin}/signup?ref=${referralData.code}`;
    const shareData = {
      title: "Join BAK55 Talent",
      text: `Join me on BAK55 Talent! When you subscribe to premium, we both benefit! 🎵`,
      url: referralLink,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success("Shared successfully! 🎉");
      } else {
        await copyReferralLink();
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        await copyReferralLink();
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!referralData) return null;

  const referralLink = `${window.location.origin}/signup?ref=${referralData.code}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Invite friends! When they subscribe to premium, you earn 2 BAKCoins!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">{referralData.usesCount}</div>
            <div className="text-xs text-muted-foreground">Referrals</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">{referralData.totalEarned}</div>
            <div className="text-xs text-muted-foreground">BAKCoins Earned</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">2</div>
            <div className="text-xs text-muted-foreground">BAK Per Premium</div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Link</label>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="flex-1" />
            <Button variant="outline" size="icon" onClick={copyReferralLink}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="default" size="icon" onClick={shareReferralLink}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this link with friends. When they subscribe to premium, you earn 2 BAKCoins!
          </p>
        </div>

        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Code</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-2 rounded-lg bg-muted font-mono text-lg font-bold">
              {referralData.code}
            </code>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(referralData.code);
                toast.success("Code copied!");
              }}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
        </div>

        {/* Recent Referrals */}
        {referralData.referrals.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recent Referrals
            </label>
            <div className="space-y-2">
              {referralData.referrals.slice(0, 5).map((ref, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">@{ref.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {ref.rewarded && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

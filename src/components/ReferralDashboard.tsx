import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Copy, Share2, Gift, Users, CheckCircle2, TrendingUp, 
  Clock, Coins, Trophy, Sparkles, ExternalLink 
} from "lucide-react";
import { format } from "date-fns";

interface ReferralData {
  code: string;
  usesCount: number;
  totalEarned: number;
  pendingRewards: number;
  referrals: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    rewarded: boolean;
    reward_amount: number;
    reward_type: string;
    status: string;
    created_at: string;
  }>;
}

interface RewardTier {
  reward_type: string;
  description: string;
  fan_reward: number;
  artist_reward: number;
}

export function ReferralDashboard() {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isArtist, setIsArtist] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      checkUserRole();
    }
  }, [user]);

  const checkUserRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['artist', 'brand', 'admin'])
      .maybeSingle();
    
    setIsArtist(!!data);
  };

  const fetchData = async () => {
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
        const code = `BAK${user.id.substring(0, 8).toUpperCase()}`;
        const { data: newCode, error: insertError } = await supabase
          .from("referral_codes")
          .insert({ user_id: user.id, code })
          .select()
          .single();

        if (insertError) throw insertError;
        codeData = newCode;
      }

      // Get detailed referral stats
      const { data: referrals, error: refError } = await supabase
        .from("referrals")
        .select(`
          id,
          referred_id,
          reward_amount,
          bonus_earned,
          reward_type,
          rewarded,
          status,
          created_at,
          profiles:referred_id (username, email),
          user_roles:referred_id (role)
        `)
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (refError) throw refError;

      const totalEarned = referrals?.filter(r => r.rewarded).reduce((sum, r) => sum + (parseFloat(r.reward_amount as any) || 0), 0) || 0;
      const pendingRewards = referrals?.filter(r => !r.rewarded && r.status === 'pending').length || 0;

      setReferralData({
        code: codeData.code,
        usesCount: codeData.uses_count,
        totalEarned,
        pendingRewards,
        referrals: referrals?.map(r => {
          const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          const roleData = Array.isArray(r.user_roles) ? r.user_roles[0] : r.user_roles;
          return {
            id: r.id,
            username: profile?.username || 'Anonymous',
            email: profile?.email || '',
            role: roleData?.role || 'fan',
            rewarded: r.rewarded,
            reward_amount: parseFloat(r.reward_amount as any) || 0,
            reward_type: r.reward_type || 'signup',
            status: r.status || 'pending',
            created_at: r.created_at,
          };
        }) || [],
      });

      // Get reward tiers
      const { data: tiers } = await supabase
        .from('referral_rewards_config')
        .select('*')
        .eq('is_active', true);

      setRewardTiers(tiers?.map(t => ({
        reward_type: t.reward_type,
        description: t.description,
        fan_reward: t.fan_referrer_reward,
        artist_reward: t.artist_referrer_reward,
      })) || []);

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
      toast.success("Referral link copied! 📋");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareReferralLink = async () => {
    if (!referralData) return;

    const referralLink = `${window.location.origin}/signup?ref=${referralData.code}`;
    const shareData = {
      title: "Join BAK55 Talent",
      text: `Join me on BAK55 Talent - Africa's music discovery platform! Use my referral link and we both earn rewards! 🎵🎤`,
      url: referralLink,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success("Shared! 🎉");
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
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-muted rounded" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!referralData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
            Reload Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  const referralLink = `${window.location.origin}/signup?ref=${referralData.code}`;
  const progressToNextMilestone = Math.min((referralData.usesCount % 10) * 10, 100);
  const nextMilestone = Math.ceil((referralData.usesCount + 1) / 10) * 10;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-primary/20 via-background to-secondary/20 border-primary/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Gift className="h-6 w-6 text-primary" />
                Referral Program
              </h2>
              <p className="text-muted-foreground mt-1">
                Invite friends and earn BAKCoins together! 
                {isArtist ? ' As an artist, you earn higher rewards!' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyReferralLink} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button onClick={shareReferralLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-3xl font-bold">{referralData.usesCount}</div>
            <div className="text-sm text-muted-foreground">Total Referrals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Coins className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-3xl font-bold">{referralData.totalEarned.toFixed(0)}</div>
            <div className="text-sm text-muted-foreground">BAK Earned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-3xl font-bold">{referralData.pendingRewards}</div>
            <div className="text-sm text-muted-foreground">Awaiting Deposit</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <div className="text-3xl font-bold">{nextMilestone}</div>
            <div className="text-sm text-muted-foreground">Next Milestone</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress to Milestone */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress to {nextMilestone} referrals</span>
            <span className="text-sm text-muted-foreground">{referralData.usesCount}/{nextMilestone}</span>
          </div>
          <Progress value={progressToNextMilestone} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            🎁 Reach {nextMilestone} referrals for a bonus reward!
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="link" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="link">Your Link</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="link">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Referral Link & Code</CardTitle>
              <CardDescription>
                Share with friends to start earning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Referral Link</label>
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly className="flex-1 font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={copyReferralLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Referral Code</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 rounded-lg bg-primary/10 font-mono text-xl font-bold text-center">
                    {referralData.code}
                  </code>
                  <Button 
                    variant="outline"
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

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button onClick={shareReferralLink} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`Join me on BAK55 Talent! 🎵 ${referralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Referrals
              </CardTitle>
              <CardDescription>
                Track everyone who joined through your link
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralData.referrals.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <h3 className="font-medium text-lg mb-1">No referrals yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your link to start earning rewards
                  </p>
                  <Button onClick={shareReferralLink}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {referralData.referrals.map((ref) => (
                    <div 
                      key={ref.id} 
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          ref.rewarded ? 'bg-green-500/20 text-green-500' : 'bg-muted-foreground/20 text-muted-foreground'
                        }`}>
                          {ref.rewarded ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Clock className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">@{ref.username}</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {ref.role}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(ref.created_at), 'MMM d, yyyy')} • {ref.reward_type === 'first_deposit' ? 'Deposit Reward' : ref.reward_type}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {ref.rewarded ? (
                          <div className="flex items-center gap-1 text-green-500">
                            <Coins className="h-4 w-4" />
                            <span className="font-bold">+{ref.reward_amount} BAK</span>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {ref.status === 'pending' ? 'Awaiting Deposit' : ref.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Reward Tiers
              </CardTitle>
              <CardDescription>
                Earn rewards for different referral milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rewardTiers.map((tier) => (
                  <div key={tier.reward_type} className="p-4 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">
                        {tier.reward_type.replace(/_/g, ' ')}
                      </h4>
                      <Badge>{isArtist ? tier.artist_reward : tier.fan_reward} BAK</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                    <div className="flex gap-4 text-xs">
                      <span className="text-muted-foreground">
                        Fan reward: <span className="text-foreground font-medium">{tier.fan_reward} BAK</span>
                      </span>
                      <span className="text-muted-foreground">
                        Artist reward: <span className="text-foreground font-medium">{tier.artist_reward} BAK</span>
                      </span>
                    </div>
                  </div>
                ))}

                <div className="p-4 rounded-lg bg-primary/10 border-primary/30 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Milestone Bonuses</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>🎯 10 referrals: +10 BAK bonus</li>
                    <li>🏆 25 referrals: +25 BAK bonus</li>
                    <li>👑 50 referrals: +50 BAK bonus + Special badge</li>
                    <li>💎 100 referrals: +100 BAK bonus + VIP status</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

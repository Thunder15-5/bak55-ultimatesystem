import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Users, Gift, AlertTriangle, Settings, TrendingUp, 
  CheckCircle, XCircle, Eye, RefreshCw, Search, Shield 
} from "lucide-react";
import { format } from "date-fns";

interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  flagged_referrals: number;
  total_rewards_paid: number;
  top_referrers: Array<{
    user_id: string;
    username: string;
    referral_count: number;
    total_earned: number;
  }>;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  reward_type: string;
  reward_amount: number;
  bonus_earned: number;
  status: string;
  rewarded: boolean;
  fraud_flagged: boolean;
  fraud_reason: string | null;
  created_at: string;
  referrer_profile?: { username: string; email: string } | null;
  referred_profile?: { username: string; email: string } | null;
}

interface RewardConfig {
  id: string;
  reward_type: string;
  description: string;
  fan_referrer_reward: number;
  artist_referrer_reward: number;
  referred_bonus: number;
  is_active: boolean;
}

export function ReferralPanel() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewardConfigs, setRewardConfigs] = useState<RewardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchReferrals(),
        fetchRewardConfigs()
      ]);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Get all referrals for stats
    const { data: allReferrals } = await supabase
      .from('referrals')
      .select('*');

    if (allReferrals) {
      const completed = allReferrals.filter(r => r.status === 'completed' || r.rewarded);
      const pending = allReferrals.filter(r => r.status === 'pending' && !r.rewarded);
      const flagged = allReferrals.filter(r => r.fraud_flagged);
      const totalRewards = completed.reduce((sum, r) => sum + (parseFloat(String(r.reward_amount)) || 0), 0);

      // Get top referrers
      const referrerCounts = allReferrals.reduce((acc: any, r) => {
        if (!acc[r.referrer_id]) {
          acc[r.referrer_id] = { count: 0, earned: 0 };
        }
        acc[r.referrer_id].count++;
        acc[r.referrer_id].earned += parseFloat(String(r.reward_amount)) || 0;
        return acc;
      }, {});

      const topReferrerIds = Object.entries(referrerCounts)
        .sort((a: any, b: any) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id, data]: any) => ({ user_id: id, ...data }));

      // Get usernames for top referrers
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', topReferrerIds.map(r => r.user_id));

      const topReferrers = topReferrerIds.map(r => ({
        ...r,
        username: profiles?.find(p => p.id === r.user_id)?.username || 'Unknown',
        referral_count: r.count,
        total_earned: r.earned
      }));

      setStats({
        total_referrals: allReferrals.length,
        completed_referrals: completed.length,
        pending_referrals: pending.length,
        flagged_referrals: flagged.length,
        total_rewards_paid: totalRewards,
        top_referrers: topReferrers
      });
    }
  };

  const fetchReferrals = async () => {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referrer_profile:referrer_id (username, email),
        referred_profile:referred_id (username, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    // Transform the data to match our interface
    const transformedData = data?.map(item => ({
      ...item,
      referrer_profile: Array.isArray(item.referrer_profile) 
        ? item.referrer_profile[0] 
        : item.referrer_profile,
      referred_profile: Array.isArray(item.referred_profile) 
        ? item.referred_profile[0] 
        : item.referred_profile
    })) || [];
    
    setReferrals(transformedData);
  };

  const fetchRewardConfigs = async () => {
    const { data, error } = await supabase
      .from('referral_rewards_config')
      .select('*')
      .order('reward_type');

    if (error) throw error;
    setRewardConfigs(data || []);
  };

  const handleApproveReferral = async (referral: Referral) => {
    try {
      // Process the referral via edge function
      const { data, error } = await supabase.functions.invoke('process-referral', {
        body: {
          referral_code: referral.referral_code,
          referred_user_id: referral.referred_id,
          reward_type: referral.reward_type
        }
      });

      if (error) throw error;

      // Update local state
      await supabase
        .from('referrals')
        .update({ 
          status: 'completed', 
          rewarded: true, 
          fraud_flagged: false,
          completed_at: new Date().toISOString()
        })
        .eq('id', referral.id);

      toast.success('Referral approved and rewards distributed');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve referral');
    }
  };

  const handleRejectReferral = async (referralId: string, reason: string) => {
    try {
      await supabase
        .from('referrals')
        .update({ 
          status: 'rejected', 
          fraud_reason: reason,
          rewarded: false
        })
        .eq('id', referralId);

      toast.success('Referral rejected');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to reject referral');
    }
  };

  const handleUpdateRewardConfig = async (config: RewardConfig) => {
    try {
      await supabase
        .from('referral_rewards_config')
        .update({
          fan_referrer_reward: config.fan_referrer_reward,
          artist_referrer_reward: config.artist_referrer_reward,
          referred_bonus: config.referred_bonus,
          is_active: config.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      toast.success('Reward configuration updated');
      fetchRewardConfigs();
    } catch (error: any) {
      toast.error('Failed to update configuration');
    }
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = !searchQuery || 
      r.referrer_profile?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referred_profile?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referral_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'flagged' && r.fraud_flagged) ||
      (statusFilter === 'completed' && r.status === 'completed') ||
      (statusFilter === 'pending' && r.status === 'pending');

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{stats?.total_referrals || 0}</div>
            <div className="text-xs text-muted-foreground">Total Referrals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.completed_referrals || 0}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.pending_referrals || 0}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.flagged_referrals || 0}</div>
            <div className="text-xs text-muted-foreground">Flagged</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.total_rewards_paid?.toFixed(0) || 0}</div>
            <div className="text-xs text-muted-foreground">BAK Paid</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="referrals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referrals">All Referrals</TabsTrigger>
          <TabsTrigger value="flagged" className="text-amber-500">
            Flagged ({stats?.flagged_referrals || 0})
          </TabsTrigger>
          <TabsTrigger value="leaderboard">Top Referrers</TabsTrigger>
          <TabsTrigger value="settings">Reward Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Referral Activity
              </CardTitle>
              <CardDescription>
                Monitor all referral activity across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="flagged">Flagged</option>
                </select>
                <Button variant="outline" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Referred</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No referrals found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReferrals.map((referral) => (
                        <TableRow key={referral.id} className={referral.fraud_flagged ? 'bg-amber-500/10' : ''}>
                          <TableCell>
                            <div>
                              <div className="font-medium">@{referral.referrer_profile?.username || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{referral.referrer_profile?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">@{referral.referred_profile?.username || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{referral.referred_profile?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{referral.referral_code}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{referral.reward_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{referral.reward_amount} BAK</span>
                          </TableCell>
                          <TableCell>
                            {referral.fraud_flagged ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Flagged
                              </Badge>
                            ) : referral.status === 'completed' || referral.rewarded ? (
                              <Badge className="bg-green-500">Completed</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(referral.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {referral.fraud_flagged && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-green-500"
                                  onClick={() => handleApproveReferral(referral)}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-red-500"
                                  onClick={() => handleRejectReferral(referral.id, 'Fraud confirmed')}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-500">
                <Shield className="h-5 w-5" />
                Flagged Referrals - Fraud Review
              </CardTitle>
              <CardDescription>
                Review referrals flagged by the fraud detection system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.filter(r => r.fraud_flagged).map((referral) => (
                  <Card key={referral.id} className="border-amber-500/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Fraud Alert</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Referrer:</span>{' '}
                            <span className="font-medium">@{referral.referrer_profile?.username}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Referred:</span>{' '}
                            <span className="font-medium">@{referral.referred_profile?.username}</span>
                          </div>
                          {referral.fraud_reason && (
                            <div className="text-sm text-amber-600 bg-amber-500/10 p-2 rounded">
                              {referral.fraud_reason}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-500"
                            onClick={() => handleApproveReferral(referral)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => handleRejectReferral(referral.id, 'Fraud confirmed by admin')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {referrals.filter(r => r.fraud_flagged).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No flagged referrals to review</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Referrers
              </CardTitle>
              <CardDescription>
                Users with the most successful referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.top_referrers.map((referrer, index) => (
                  <div
                    key={referrer.user_id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-yellow-950' :
                        index === 1 ? 'bg-gray-300 text-gray-800' :
                        index === 2 ? 'bg-amber-600 text-amber-950' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">@{referrer.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {referrer.referral_count} referrals
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{referrer.total_earned.toFixed(0)} BAK</div>
                      <div className="text-xs text-muted-foreground">Total earned</div>
                    </div>
                  </div>
                ))}
                {(!stats?.top_referrers || stats.top_referrers.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No referrers yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Reward Configuration
              </CardTitle>
              <CardDescription>
                Adjust referral rewards for different actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {rewardConfigs.map((config) => (
                  <div key={config.id} className="p-4 rounded-lg border space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium capitalize">{config.reward_type.replace('_', ' ')}</h4>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Fan Referrer Reward (BAK)</Label>
                        <Input
                          type="number"
                          value={config.fan_referrer_reward}
                          onChange={(e) => {
                            const updated = { ...config, fan_referrer_reward: parseFloat(e.target.value) || 0 };
                            setRewardConfigs(prev => prev.map(c => c.id === config.id ? updated : c));
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Artist Referrer Reward (BAK)</Label>
                        <Input
                          type="number"
                          value={config.artist_referrer_reward}
                          onChange={(e) => {
                            const updated = { ...config, artist_referrer_reward: parseFloat(e.target.value) || 0 };
                            setRewardConfigs(prev => prev.map(c => c.id === config.id ? updated : c));
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Referred User Bonus (BAK)</Label>
                        <Input
                          type="number"
                          value={config.referred_bonus}
                          onChange={(e) => {
                            const updated = { ...config, referred_bonus: parseFloat(e.target.value) || 0 };
                            setRewardConfigs(prev => prev.map(c => c.id === config.id ? updated : c));
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = { ...config, is_active: !config.is_active };
                          handleUpdateRewardConfig(updated);
                        }}
                      >
                        {config.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateRewardConfig(config)}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

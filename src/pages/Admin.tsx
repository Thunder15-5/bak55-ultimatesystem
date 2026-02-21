import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ModerationPanel } from "@/components/ModerationPanel";
import { MessagesPanel } from "@/components/MessagesPanel";
import { FraudDetection } from "@/components/FraudDetection";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import { ActivityLogPanel } from "@/components/admin/ActivityLogPanel";
import { SubscriptionsPanel } from "@/components/admin/SubscriptionsPanel";
import { EarlyAccessPanel } from "@/components/admin/EarlyAccessPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { CompetitionStageManager } from "@/components/admin/CompetitionStageManager";
import { BadgeManagementPanel } from "@/components/admin/BadgeManagementPanel";
import { FeaturedArtistsPanel } from "@/components/admin/FeaturedArtistsPanel";
import { ApplicationsPanel } from "@/components/admin/ApplicationsPanel";
import { ReferralPanel } from "@/components/admin/ReferralPanel";
import { EmailTemplatesPanel } from "@/components/admin/EmailTemplatesPanel";
import { ProducersPanel } from "@/components/admin/ProducersPanel";
import { SalesPanel } from "@/components/admin/SalesPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  DollarSign, Check, X, Loader2, Users, Trophy, 
  BarChart3, ShieldAlert, ShieldCheck, Edit, Trash2,
  TrendingUp, Music, Coins, Share2, Wallet, Bell, FileText, Mail,
  Award, Target, Star, UserPlus, Gift, Music2, ShoppingBag
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface WithdrawalRequest {
  id: string;
  wallet_id: string;
  amount: number;
  description: string;
  metadata: any;
  created_at: string;
  wallets?: any;
}

interface CoinPurchase {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  email: string;
  status: string;
  reference: string;
  payment_reference?: string;
  created_at: string;
  metadata: any;
  profiles?: any;
}

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  banned: boolean;
  user_roles: Array<{ role: string }>;
}

interface Competition {
  id: string;
  title: string;
  prize_amount: number;
  status: string;
  start_date: string;
  end_date: string;
  voting_start_date: string;
  voting_end_date: string;
  submissions: Array<{ id: string }>;
}

interface Metrics {
  totalUsers: number;
  totalArtists: number;
  totalBrands: number;
  totalProducers: number;
  totalTracks: number;
  totalBeats: number;
  totalCompetitions: number;
  activeCompetitions: number;
  totalRevenue: number;
  pendingWithdrawals: number;
}

export default function Admin() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [coinPurchases, setCoinPurchases] = useState<CoinPurchase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    totalArtists: 0,
    totalBrands: 0,
    totalProducers: 0,
    totalTracks: 0,
    totalBeats: 0,
    totalCompetitions: 0,
    activeCompetitions: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchAllData();
  }, [userRole]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchWithdrawalRequests(),
      fetchCoinPurchases(),
      fetchUsers(),
      fetchCompetitions(),
      fetchMetrics(),
    ]);
    setLoading(false);
  };

  const fetchWithdrawalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          wallets (
            user_id,
            balance,
            profiles:user_id (username, email, phone_number)
          )
        `)
        .eq("type", "withdrawal")
        .in("metadata->>status", ["pending", "processing"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWithdrawalRequests((data || []) as any);
    } catch (error: any) {
      console.error("Failed to load withdrawal requests:", error);
    }
  };

  const fetchCoinPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select(`
          *,
          profiles:user_id (username)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoinPurchases(data || []);
    } catch (error: any) {
      console.error("Failed to load coin purchases:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          email,
          created_at,
          banned,
          user_roles (role)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Failed to load users:", error);
    }
  };

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from("competitions")
        .select(`
          *,
          submissions (id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error: any) {
      console.error("Failed to load competitions:", error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const [
        usersCount, 
        artistsCount, 
        brandsCount,
        producersCount,
        fansCount,
        tracksCount,
        beatsCount,
        compsCount, 
        activeCompsCount, 
        withdrawalsSum,
        totalPlaysData,
        revenueData,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "artist"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "brand"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "producer"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "fan"),
        supabase.from("tracks").select("*", { count: "exact", head: true }),
        supabase.from("beats").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("transactions").select("amount, withdrawal_fee").eq("type", "withdrawal").in("metadata->>status", ["pending", "processing"]),
        supabase.from("tracks").select("plays"),
        supabase.from("payment_transactions").select("amount").eq("status", "success"),
      ]);

      const pendingWithdrawals = withdrawalsSum.data?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;
      const totalPlays = totalPlaysData.data?.reduce((sum, track) => sum + (track.plays || 0), 0) || 0;
      const totalRevenue = revenueData.data?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      setMetrics({
        totalUsers: usersCount.count || 0,
        totalArtists: artistsCount.count || 0,
        totalBrands: brandsCount.count || 0,
        totalProducers: producersCount.count || 0,
        totalTracks: tracksCount.count || 0,
        totalBeats: beatsCount.count || 0,
        totalCompetitions: compsCount.count || 0,
        activeCompetitions: activeCompsCount.count || 0,
        totalRevenue: totalRevenue,
        pendingWithdrawals,
      });
    } catch (error: any) {
      console.error("Failed to load metrics:", error);
    }
  };

  const handleApproveWithdrawal = async (request: WithdrawalRequest) => {
    setProcessing(request.id);

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          metadata: {
            ...request.metadata,
            status: "approved",
            processed_at: new Date().toISOString(),
          },
        })
        .eq("id", request.id);

      if (error) throw error;

      // Notify user of approval
      const userId = request.wallets?.user_id || request.metadata?.user_id;
      if (userId) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'withdrawal_approved',
          title: '✅ Withdrawal Approved',
          message: `Your withdrawal of ${Math.abs(request.amount).toFixed(2)} BAK has been approved and is being processed.`,
          link: '/wallet',
          priority: 'high',
          category: 'payment',
        });
      }

      toast.success("Withdrawal approved! Process payment manually.");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve withdrawal");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectWithdrawal = async (request: WithdrawalRequest) => {
    setProcessing(request.id);

    try {
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance")
        .eq("id", request.wallet_id)
        .single();

      if (!walletData) throw new Error("Wallet not found");

      // Refund the full amount back to wallet
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: walletData.balance + Math.abs(request.amount) })
        .eq("id", request.wallet_id);

      if (updateError) throw updateError;

      // Also refund the withdrawal fee from platform wallet
      const PLATFORM_USER_ID = "b2a31558-e58a-466f-99b8-7ba636bcf6be";
      const feeAmount = request.metadata?.withdrawal_fee || (Math.abs(request.amount) * 0.05 / 0.95);
      const { data: platformWallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", PLATFORM_USER_ID)
        .single();

      if (platformWallet) {
        await supabase
          .from("wallets")
          .update({ balance: Math.max(0, platformWallet.balance - feeAmount) })
          .eq("id", platformWallet.id);
      }

      const { error } = await supabase
        .from("transactions")
        .update({
          metadata: {
            ...request.metadata,
            status: "rejected",
            processed_at: new Date().toISOString(),
          },
        })
        .eq("id", request.id);

      if (error) throw error;

      // Notify user of rejection
      const userId = request.wallets?.user_id || request.metadata?.user_id;
      if (userId) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'withdrawal_rejected',
          title: '❌ Withdrawal Rejected',
          message: `Your withdrawal of ${Math.abs(request.amount).toFixed(2)} BAK has been rejected. The amount has been refunded to your wallet.`,
          link: '/wallet',
          priority: 'high',
          category: 'payment',
        });
      }

      toast.success("Withdrawal rejected and amount refunded");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject withdrawal");
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveCoinPurchase = async (purchase: CoinPurchase) => {
    setProcessing(purchase.id);

    try {
      // Update transaction status
      const { error: txError } = await supabase
        .from("payment_transactions")
        .update({ status: "success" })
        .eq("id", purchase.id);

      if (txError) throw txError;

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", purchase.user_id)
        .single();

      if (walletError || !wallet) throw new Error("Wallet not found");

      // Update wallet balance
      const bakAmount = purchase.metadata.bak_amount;
      const newBalance = parseFloat(wallet.balance.toString()) + bakAmount;
      
      const { error: balanceError } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", wallet.id);

      if (balanceError) throw balanceError;

      // Create transaction record
      await supabase.from("transactions").insert({
        wallet_id: wallet.id,
        amount: bakAmount,
        type: "earning",
        description: `Purchased ${bakAmount} BAKCoins`,
        reference_id: purchase.id,
        metadata: {
          payment_method: "manual_approval",
          amount_paid_ksh: purchase.amount,
        },
      });

      toast.success("Coin purchase approved and credited!");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve purchase");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectCoinPurchase = async (purchase: CoinPurchase) => {
    setProcessing(purchase.id);

    try {
      const { error } = await supabase
        .from("payment_transactions")
        .update({ status: "failed" })
        .eq("id", purchase.id);

      if (error) throw error;

      toast.success("Coin purchase rejected");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject purchase");
    } finally {
      setProcessing(null);
    }
  };

  const handleEndCompetition = async (competitionId: string) => {
    setProcessing(competitionId);

    try {
      const { error } = await supabase
        .from("competitions")
        .update({ status: "completed" })
        .eq("id", competitionId);

      if (error) throw error;

      // Trigger winner selection
      await supabase.functions.invoke("select-competition-winners", {
        body: { competition_id: competitionId },
      });

      toast.success("Competition ended and winners selected!");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to end competition");
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteCompetition = async (competitionId: string) => {
    if (!confirm("Are you sure you want to delete this competition? This cannot be undone.")) {
      return;
    }

    setProcessing(competitionId);

    try {
      const { error } = await supabase
        .from("competitions")
        .delete()
        .eq("id", competitionId);

      if (error) throw error;

      toast.success("Competition deleted");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete competition");
    } finally {
      setProcessing(null);
    }
  };

  const handleBanUser = async (userId: string, currentBanStatus: boolean) => {
    setProcessing(userId);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ banned: !currentBanStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(currentBanStatus ? "User unbanned successfully" : "User banned successfully");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 animate-fade-in">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Administration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 animate-fade-in">
            Admin <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-lg text-muted-foreground animate-fade-in">Manage your platform</p>
        </div>

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="metrics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <Users className="h-4 w-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="early-access">
              <Mail className="h-4 w-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              <DollarSign className="h-4 w-4 mr-2" />
              Withdrawals
              {withdrawalRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">{withdrawalRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="purchases">
              <Coins className="h-4 w-4 mr-2" />
              Purchases
              {coinPurchases.length > 0 && (
                <Badge variant="destructive" className="ml-2">{coinPurchases.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
              <TabsTrigger value="competitions">
                <Trophy className="h-4 w-4 mr-2" />
                Competitions
              </TabsTrigger>
              <TabsTrigger value="stages">
                <Target className="h-4 w-4 mr-2" />
                Stages
              </TabsTrigger>
              <TabsTrigger value="badges">
                <Award className="h-4 w-4 mr-2" />
                Badges
              </TabsTrigger>
              <TabsTrigger value="featured">
                <Star className="h-4 w-4 mr-2" />
                Featured
              </TabsTrigger>
            <TabsTrigger value="moderation">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="messages">
              Messages
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="activity-log">
              <FileText className="h-4 w-4 mr-2" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger value="applications">
              <UserPlus className="h-4 w-4 mr-2" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <Gift className="h-4 w-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="emails">
              <Mail className="h-4 w-4 mr-2" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="producers">
              <Music2 className="h-4 w-4 mr-2" />
              Producers
            </TabsTrigger>
            <TabsTrigger value="sales">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Sales
            </TabsTrigger>
          </TabsList>

          {/* Platform Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.totalArtists} artists, {metrics.totalBrands} brands, {metrics.totalProducers} producers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalTracks}</div>
                  <p className="text-xs text-muted-foreground">Uploaded by artists</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Beats</CardTitle>
                  <Music2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalBeats}</div>
                  <p className="text-xs text-muted-foreground">Uploaded by producers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Competitions</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalCompetitions}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.activeCompetitions} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalRevenue.toFixed(0)} KES</div>
                  <p className="text-xs text-muted-foreground">
                    From coin purchases
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.pendingWithdrawals.toFixed(0)} BAK</div>
                  <p className="text-xs text-muted-foreground">
                    {withdrawalRequests.length} requests
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={() => navigate('/admin/cash-reserve')} variant="outline">
                <Wallet className="mr-2 h-4 w-4" />
                Cash Reserve
              </Button>
              <Button onClick={() => navigate('/admin/vouchers')} variant="outline">
                <Coins className="mr-2 h-4 w-4" />
                Vouchers
              </Button>
              <Button onClick={() => navigate('/admin/deposits')} variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Deposits
              </Button>
              <Button onClick={() => navigate('/admin/create-competition')} variant="outline">
                <Trophy className="mr-2 h-4 w-4" />
                New Competition
              </Button>
            </div>
          </TabsContent>

          {/* Withdrawal Requests Tab */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>Pending Withdrawal Requests</CardTitle>
                <CardDescription>Review and process artist withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawalRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending withdrawal requests
                  </p>
                ) : (
                  <div className="space-y-4">
                    {withdrawalRequests.map((request) => (
                      <Card key={request.id} className="border-2">
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-primary flex-shrink-0" />
                                <h3 className="text-lg sm:text-xl font-bold">
                                  {Math.abs(request.amount).toFixed(2)} BAK
                                </h3>
                              </div>
                              <p className="text-sm text-muted-foreground break-words">
                                <strong>Artist:</strong> {request.metadata?.username || request.wallets?.profiles?.username || 'Unknown'} ({request.metadata?.email || request.wallets?.profiles?.email || ''})
                              </p>
                              <p className="text-sm text-muted-foreground break-words">
                                <strong>Phone:</strong> {request.metadata?.phone_number || request.metadata?.account_number || 'N/A'}
                              </p>
                              <p className="text-sm text-muted-foreground break-words">
                                <strong>Net Amount:</strong> {(request.metadata?.net_amount || Math.abs(request.amount) * 0.95).toFixed(2)} BAK (after 5% fee)
                              </p>
                              <p className="text-sm text-muted-foreground break-words">
                                <strong>Balance Before:</strong> {request.metadata?.wallet_balance_before?.toFixed?.(2) || 'N/A'} BAK
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Requested: {new Date(request.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveWithdrawal(request)}
                                disabled={processing === request.id}
                                className="touch-manipulation min-h-[36px] flex-1 sm:flex-initial min-w-[80px]"
                              >
                                {processing === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectWithdrawal(request)}
                                disabled={processing === request.id}
                                className="touch-manipulation min-h-[36px] flex-1 sm:flex-initial min-w-[80px]"
                              >
                                {processing === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coin Purchase Requests Tab */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>Pending Coin Purchase Requests</CardTitle>
                <CardDescription>
                  Pesapal payments are processed automatically. Use manual verification only if needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Manual Verification Section */}
                <Card className="border-warning/50 bg-warning/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-warning" />
                      Manual Payment Verification
                    </CardTitle>
                    <CardDescription>
                      Verify stuck or pending payments manually using Transaction ID or OrderTrackingId
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter Transaction ID or OrderTrackingId"
                        id="verify-payment-id"
                        className="flex-1"
                      />
                      <Button
                        onClick={async () => {
                          const input = document.getElementById('verify-payment-id') as HTMLInputElement;
                          const id = input?.value?.trim();
                          if (!id) {
                            toast.error('Please enter a Transaction ID or OrderTrackingId');
                            return;
                          }
                          
                          setProcessing(id);
                          try {
                            const { data, error } = await supabase.functions.invoke('pesapal-verify', {
                              body: { 
                                transaction_id: id.length === 36 ? id : undefined,
                                order_tracking_id: id.length !== 36 ? id : undefined,
                              }
                            });

                            if (error) throw error;

                            if (data?.success) {
                              toast.success(data.message || 'Payment verified successfully');
                              fetchAllData();
                              if (input) input.value = '';
                            } else {
                              toast.error(data?.error || 'Verification failed');
                            }
                          } catch (error: any) {
                            toast.error(error.message || 'Failed to verify payment');
                          } finally {
                            setProcessing(null);
                          }
                        }}
                        disabled={!!processing}
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Verify Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Payments List */}
                {coinPurchases.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending coin purchase requests
                  </p>
                ) : (
                  <div className="space-y-4">
                    {coinPurchases.map((purchase) => (
                      <Card key={purchase.id} className="border-2">
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Coins className="h-5 w-5 text-primary flex-shrink-0" />
                                <h3 className="text-lg sm:text-xl font-bold">
                                  {(purchase.amount / 20).toFixed(2)} BAK
                                </h3>
                              </div>
                              <p className="text-sm text-muted-foreground break-words">
                                <strong>User:</strong> {purchase.profiles?.username} ({purchase.email})
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Amount Paid:</strong> {purchase.amount} {purchase.currency}
                              </p>
                              <p className="text-sm text-muted-foreground break-words">
                                <strong>Reference:</strong> {purchase.reference}
                              </p>
                              {purchase.payment_reference && (
                                <p className="text-sm text-muted-foreground break-words">
                                  <strong>OrderTrackingId:</strong> {purchase.payment_reference}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Requested: {new Date(purchase.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[120px]">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  setProcessing(purchase.id);
                                  try {
                                    const { data, error } = await supabase.functions.invoke('pesapal-verify', {
                                      body: { transaction_id: purchase.id }
                                    });

                                    if (error) throw error;

                                    if (data?.success) {
                                      toast.success(data.message || 'Payment verified successfully');
                                      fetchAllData();
                                    } else {
                                      toast.error(data?.error || 'Verification failed');
                                    }
                                  } catch (error: any) {
                                    toast.error(error.message || 'Failed to verify payment');
                                  } finally {
                                    setProcessing(null);
                                  }
                                }}
                                disabled={processing === purchase.id}
                                className="w-full touch-manipulation min-h-[36px]"
                              >
                                {processing === purchase.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Verify
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <UsersPanel />
          </TabsContent>

          {/* Competition Management Tab */}
          <TabsContent value="competitions">
            <Card>
              <CardHeader>
                <CardTitle>Competition Management</CardTitle>
                <CardDescription>Manage all platform competitions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitions.map((comp) => (
                    <div key={comp.id} className="space-y-4">
                      <Card className="border-2">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Trophy className="h-5 w-5 text-primary flex-shrink-0" />
                                <h3 className="text-lg sm:text-xl font-bold break-words leading-tight">{comp.title}</h3>
                                <Badge variant={comp.status === "active" ? "default" : "secondary"}>
                                  {comp.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground break-words">
                                <strong>Prize:</strong> {comp.prize_amount} BAK
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Submissions:</strong> {comp.submissions?.length || 0}
                              </p>
                              <p className="text-sm text-muted-foreground break-words">
                                <strong>Dates:</strong> {new Date(comp.start_date).toLocaleDateString()} - {new Date(comp.end_date).toLocaleDateString()}
                              </p>
                              {comp.voting_start_date && (
                                <p className="text-sm text-muted-foreground break-words">
                                  <strong>Voting:</strong> {new Date(comp.voting_start_date).toLocaleDateString()} - {new Date(comp.voting_end_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 lg:flex-col xl:flex-row xl:flex-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/edit-competition/${comp.id}`)}
                                className="touch-manipulation min-h-[36px] flex-1 sm:flex-initial min-w-[70px]"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate(`/competition/${comp.id}`)}
                                className="touch-manipulation min-h-[36px] flex-1 sm:flex-initial min-w-[70px]"
                              >
                                View
                              </Button>
                              {comp.status === "active" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleEndCompetition(comp.id)}
                                  disabled={processing === comp.id}
                                  className="touch-manipulation min-h-[36px] flex-1 sm:flex-initial min-w-[70px]"
                                >
                                  {processing === comp.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "End Early"
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCompetition(comp.id)}
                                disabled={processing === comp.id}
                                className="touch-manipulation min-h-[36px] flex-1 sm:flex-initial min-w-[70px]"
                              >
                                {processing === comp.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {(comp.status === "active" || comp.status === "voting") && (
                        <FraudDetection
                          competitionId={comp.id}
                          competitionTitle={comp.title}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competition Stages Tab */}
          <TabsContent value="stages">
            <CompetitionStageManager />
          </TabsContent>

          {/* Badge Management Tab */}
          <TabsContent value="badges">
            <BadgeManagementPanel />
          </TabsContent>

          {/* Featured Artists Tab */}
          <TabsContent value="featured">
            <FeaturedArtistsPanel />
          </TabsContent>

          {/* Content Moderation Tab */}
          <TabsContent value="moderation">
            <ModerationPanel />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <MessagesPanel />
          </TabsContent>

          {/* Admin Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity-log">
            <ActivityLogPanel />
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <SubscriptionsPanel />
          </TabsContent>

          {/* Early Access Leads Tab */}
          <TabsContent value="early-access">
            <EarlyAccessPanel />
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <ApplicationsPanel />
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <ReferralPanel />
          </TabsContent>

          {/* Emails Tab */}
          <TabsContent value="emails">
            <EmailTemplatesPanel />
          </TabsContent>

          {/* Producers Tab */}
          <TabsContent value="producers">
            <ProducersPanel />
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales">
            <SalesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

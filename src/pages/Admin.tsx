import { useEffect, useState } from "react";
import { CompetitionReportPanel } from "@/components/admin/CompetitionReportPanel";
import { MerchManagementPanel } from "@/components/admin/MerchManagementPanel";
import { MerchOrdersPanel } from "@/components/admin/MerchOrdersPanel";
import { SystemSettingsPanel } from "@/components/admin/SystemSettingsPanel";
import { BlogManagementPanel } from "@/components/admin/BlogManagementPanel";
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
import { VotingControlsPanel } from "@/components/admin/VotingControlsPanel";
import { WithdrawalConfigPanel } from "@/components/admin/WithdrawalConfigPanel";
import { ArtistLevelsPanel } from "@/components/admin/ArtistLevelsPanel";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DollarSign, Check, X, Loader2, Users, Trophy,
  ShieldAlert, ShieldCheck, Edit, Trash2,
  TrendingUp, Music, Coins, Wallet, Music2,
  ArrowRight, Clock, AlertTriangle, Activity, Zap,
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

interface ActivityItem {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  event_category: string;
}

export default function Admin() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("metrics");
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [coinPurchases, setCoinPurchases] = useState<CoinPurchase[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [pendingMerchOrders, setPendingMerchOrders] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0, totalArtists: 0, totalBrands: 0, totalProducers: 0,
    totalTracks: 0, totalBeats: 0, totalCompetitions: 0, activeCompetitions: 0,
    totalRevenue: 0, pendingWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchAllData();

    const paymentsChannel = supabase
      .channel('admin_payments_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_transactions' }, () => {
        fetchMetrics();
        fetchCoinPurchases();
      })
      .subscribe();

    const transactionsChannel = supabase
      .channel('admin_transactions_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchMetrics();
        fetchWithdrawalRequests();
      })
      .subscribe();

    const usersChannel = supabase
      .channel('admin_users_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
        fetchMetrics();
        fetchRecentActivity();
      })
      .subscribe();

    const merchChannel = supabase
      .channel('admin_merch_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'merch_orders' }, () => {
        fetchPendingMerchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(merchChannel);
    };
  }, [userRole]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchWithdrawalRequests(),
      fetchCoinPurchases(),
      fetchCompetitions(),
      fetchMetrics(),
      fetchPendingMerchOrders(),
      fetchRecentActivity(),
    ]);
    setLoading(false);
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from("admin_activity_log")
        .select("id, event_type, description, created_at, event_category")
        .order("created_at", { ascending: false })
        .limit(8);
      setRecentActivity(data || []);
    } catch {}
  };

  const fetchPendingMerchOrders = async () => {
    try {
      const { count } = await supabase.from("merch_orders").select("*", { count: "exact", head: true }).eq("status", "pending");
      setPendingMerchOrders(count || 0);
    } catch {}
  };

  const fetchWithdrawalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`*, wallets (user_id, balance, profiles:user_id (username, email, phone_number))`)
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
        .select(`*, profiles:user_id (username)`)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCoinPurchases(data || []);
    } catch (error: any) {
      console.error("Failed to load coin purchases:", error);
    }
  };

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from("competitions")
        .select(`*, submissions (id)`)
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
        usersCount, artistsCount, brandsCount, producersCount,
        tracksCount, beatsCount, compsCount, activeCompsCount,
        withdrawalsSum, revenueData,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "artist"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "brand"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "producer"),
        supabase.from("tracks").select("*", { count: "exact", head: true }),
        supabase.from("beats").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("transactions").select("amount, withdrawal_fee").eq("type", "withdrawal").in("metadata->>status", ["pending", "processing"]),
        supabase.from("payment_transactions").select("amount").eq("status", "success"),
      ]);

      const pendingWithdrawals = withdrawalsSum.data?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;
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
        totalRevenue,
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
        .update({ metadata: { ...request.metadata, status: "approved", processed_at: new Date().toISOString() } })
        .eq("id", request.id);
      if (error) throw error;
      const userId = request.wallets?.user_id || request.metadata?.user_id;
      if (userId) {
        await supabase.from('notifications').insert({
          user_id: userId, type: 'withdrawal_approved',
          title: '✅ Withdrawal Approved',
          message: `Your withdrawal of ${Math.abs(request.amount).toFixed(2)} BAK has been approved and is being processed.`,
          link: '/wallet', priority: 'high', category: 'payment',
        });
      }
      toast.success("Withdrawal approved!");
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
        .from("wallets").select("balance").eq("id", request.wallet_id).single();
      if (!walletData) throw new Error("Wallet not found");
      const { error: updateError } = await supabase
        .from("wallets").update({ balance: walletData.balance + Math.abs(request.amount) }).eq("id", request.wallet_id);
      if (updateError) throw updateError;
      const PLATFORM_USER_ID = "b2a31558-e58a-466f-99b8-7ba636bcf6be";
      const feeAmount = request.metadata?.withdrawal_fee || (Math.abs(request.amount) * 0.05 / 0.95);
      const { data: platformWallet } = await supabase
        .from("wallets").select("id, balance").eq("user_id", PLATFORM_USER_ID).single();
      if (platformWallet && platformWallet.balance >= feeAmount) {
        await supabase.from("wallets").update({ balance: platformWallet.balance - feeAmount }).eq("id", platformWallet.id);
      }
      const { error } = await supabase
        .from("transactions")
        .update({ metadata: { ...request.metadata, status: "rejected", processed_at: new Date().toISOString() } })
        .eq("id", request.id);
      if (error) throw error;
      const userId = request.wallets?.user_id || request.metadata?.user_id;
      if (userId) {
        await supabase.from('notifications').insert({
          user_id: userId, type: 'withdrawal_rejected',
          title: '❌ Withdrawal Rejected',
          message: `Your withdrawal of ${Math.abs(request.amount).toFixed(2)} BAK has been rejected. The amount has been refunded to your wallet.`,
          link: '/wallet', priority: 'high', category: 'payment',
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
      const { error: txError } = await supabase.from("payment_transactions").update({ status: "success" }).eq("id", purchase.id);
      if (txError) throw txError;
      const { data: wallet, error: walletError } = await supabase.from("wallets").select("*").eq("user_id", purchase.user_id).single();
      if (walletError || !wallet) throw new Error("Wallet not found");
      const bakAmount = purchase.metadata.bak_amount;
      const { error: balanceError } = await supabase.from("wallets").update({ balance: parseFloat(wallet.balance.toString()) + bakAmount }).eq("id", wallet.id);
      if (balanceError) throw balanceError;
      await supabase.from("transactions").insert({
        wallet_id: wallet.id, amount: bakAmount, type: "earning",
        description: `Purchased ${bakAmount} BAKCoins`, reference_id: purchase.id,
        metadata: { payment_method: "manual_approval", amount_paid_ksh: purchase.amount },
      });
      toast.success("Coin purchase approved and credited!");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve purchase");
    } finally {
      setProcessing(null);
    }
  };

  const handleEndCompetition = async (competitionId: string) => {
    setProcessing(competitionId);
    try {
      const { error } = await supabase.from("competitions").update({ status: "completed" }).eq("id", competitionId);
      if (error) throw error;
      await supabase.functions.invoke("select-competition-winners", { body: { competition_id: competitionId } });
      toast.success("Competition ended and winners selected!");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to end competition");
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteCompetition = async (competitionId: string) => {
    if (!confirm("Are you sure you want to delete this competition? This cannot be undone.")) return;
    setProcessing(competitionId);
    try {
      const { error } = await supabase.from("competitions").delete().eq("id", competitionId);
      if (error) throw error;
      toast.success("Competition deleted");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete competition");
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

  const renderContent = () => {
    switch (activeTab) {
      case "metrics":
        return (
          <MetricsPanel
            metrics={metrics}
            withdrawalRequests={withdrawalRequests}
            coinPurchases={coinPurchases}
            competitions={competitions}
            recentActivity={recentActivity}
            navigate={navigate}
            onTabChange={setActiveTab}
          />
        );
      case "withdrawals":
        return <WithdrawalsPanel requests={withdrawalRequests} processing={processing} onApprove={handleApproveWithdrawal} onReject={handleRejectWithdrawal} />;
      case "purchases":
        return <PurchasesPanel purchases={coinPurchases} processing={processing} onApprove={handleApproveCoinPurchase} setProcessing={setProcessing} fetchAllData={fetchAllData} />;
      case "users":
        return <UsersPanel />;
      case "competitions":
        return <CompetitionsPanel competitions={competitions} processing={processing} navigate={navigate} onEnd={handleEndCompetition} onDelete={handleDeleteCompetition} />;
      case "stages":
        return <CompetitionStageManager />;
      case "badges":
        return <BadgeManagementPanel />;
      case "featured":
        return <FeaturedArtistsPanel />;
      case "moderation":
        return <ModerationPanel />;
      case "messages":
        return <MessagesPanel />;
      case "notifications":
        return <NotificationCenter />;
      case "activity-log":
        return <ActivityLogPanel />;
      case "subscriptions":
        return <SubscriptionsPanel />;
      case "early-access":
        return <EarlyAccessPanel />;
      case "applications":
        return <ApplicationsPanel />;
      case "referrals":
        return <ReferralPanel />;
      case "emails":
        return <EmailTemplatesPanel />;
      case "producers":
        return <ProducersPanel />;
      case "sales":
        return <SalesPanel />;
      case "voting":
        return <VotingControlsPanel />;
      case "competition-report":
        return <CompetitionReportPanel />;
      case "merch-products":
        return <MerchManagementPanel />;
      case "merch-orders":
        return <MerchOrdersPanel />;
      case "system-settings":
        return <SystemSettingsPanel />;
      case "blog":
        return <BlogManagementPanel />;
      case "withdrawal-config":
        return <WithdrawalConfigPanel />;
      case "artist-levels":
        return <ArtistLevelsPanel />;
      default:
        return null;
    }
  };

  const totalPending = withdrawalRequests.length + coinPurchases.length + pendingMerchOrders;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SidebarProvider>
          <div className="min-h-[calc(100vh-4rem)] flex w-full">
            <AdminSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              pendingWithdrawals={withdrawalRequests.length}
              pendingPurchases={coinPurchases.length}
              pendingMerchOrders={pendingMerchOrders}
            />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-12 flex items-center justify-between gap-3 border-b border-border/50 px-4 bg-card/50 backdrop-blur-sm sticky top-16 z-10">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  <h1 className="text-sm font-heading font-bold capitalize">
                    {activeTab === "metrics" ? "Command Center" : activeTab.replace(/-/g, " ")}
                  </h1>
                </div>
                {totalPending > 0 && (
                  <Badge variant="destructive" className="text-[10px] animate-pulse">
                    {totalPending} pending
                  </Badge>
                )}
              </header>
              <main className="flex-1 p-4 md:p-6 overflow-auto">
                {renderContent()}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}

// ── Sub-panels ──

function MetricsPanel({
  metrics, withdrawalRequests, coinPurchases, competitions, recentActivity, navigate, onTabChange,
}: {
  metrics: Metrics;
  withdrawalRequests: WithdrawalRequest[];
  coinPurchases: CoinPurchase[];
  competitions: Competition[];
  recentActivity: ActivityItem[];
  navigate: any;
  onTabChange: (tab: string) => void;
}) {
  const urgentItems = [
    withdrawalRequests.length > 0 && { label: `${withdrawalRequests.length} withdrawals`, tab: "withdrawals", icon: Wallet },
    coinPurchases.length > 0 && { label: `${coinPurchases.length} purchases`, tab: "purchases", icon: Coins },
  ].filter(Boolean) as { label: string; tab: string; icon: any }[];

  const activeComps = competitions.filter(c => c.status === "active");

  return (
    <div className="space-y-6">
      {/* Urgent Action Banner */}
      {urgentItems.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">Requires Attention</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {urgentItems.map((item) => (
                <Button
                  key={item.tab}
                  size="sm"
                  variant="destructive"
                  onClick={() => onTabChange(item.tab)}
                  className="h-8 text-xs"
                >
                  <item.icon className="h-3 w-3 mr-1.5" />
                  {item.label}
                  <ArrowRight className="h-3 w-3 ml-1.5" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total Users"
          value={metrics.totalUsers}
          detail={`${metrics.totalArtists} artists · ${metrics.totalProducers} producers`}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <MetricCard
          icon={Trophy}
          label="Competitions"
          value={metrics.totalCompetitions}
          detail={`${metrics.activeCompetitions} active`}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
        />
        <MetricCard
          icon={TrendingUp}
          label="Revenue"
          value={`${(metrics.totalRevenue / 1000).toFixed(1)}K`}
          detail="KES total"
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
        <MetricCard
          icon={Music}
          label="Content"
          value={metrics.totalTracks + metrics.totalBeats}
          detail={`${metrics.totalTracks} tracks · ${metrics.totalBeats} beats`}
          color="text-violet-500"
          bgColor="bg-violet-500/10"
        />
      </div>

      {/* Two Column: Active Competitions + Activity Feed */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Active Competitions */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Active Competitions
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("competitions")}>
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeComps.length === 0 ? (
              <div className="text-center py-6">
                <Trophy className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No active competitions</p>
                <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={() => navigate('/admin/create-competition')}>
                  Create Competition
                </Button>
              </div>
            ) : (
              activeComps.slice(0, 3).map((comp) => {
                const daysLeft = Math.ceil((new Date(comp.end_date).getTime() - Date.now()) / 86400000);
                return (
                  <div key={comp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{comp.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground">{comp.submissions?.length || 0} entries</span>
                        <span className="text-[10px] text-muted-foreground">{comp.prize_amount} BAK</span>
                      </div>
                    </div>
                    <Badge variant={daysLeft <= 3 ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {daysLeft > 0 ? `${daysLeft}d left` : "Ending"}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("activity-log")}>
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No recent activity</p>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getCategoryColor(item.event_category)}`}>
                      {getCategoryIcon(item.event_category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-relaxed truncate">{item.description}</p>
                      <p className="text-[10px] text-muted-foreground">{getRelativeTime(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button onClick={() => navigate('/admin/create-competition')} variant="outline" className="h-auto py-3 flex-col gap-1.5 border-border/50">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-xs">New Competition</span>
            </Button>
            <Button onClick={() => navigate('/admin/cash-reserve')} variant="outline" className="h-auto py-3 flex-col gap-1.5 border-border/50">
              <Wallet className="h-5 w-5 text-emerald-500" />
              <span className="text-xs">Cash Reserve</span>
            </Button>
            <Button onClick={() => navigate('/admin/vouchers')} variant="outline" className="h-auto py-3 flex-col gap-1.5 border-border/50">
              <Coins className="h-5 w-5 text-violet-500" />
              <span className="text-xs">Vouchers</span>
            </Button>
            <Button onClick={() => navigate('/admin/deposits')} variant="outline" className="h-auto py-3 flex-col gap-1.5 border-border/50">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-xs">Deposits</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, color, bgColor }: {
  icon: any; label: string; value: string | number; detail: string; color: string; bgColor: string;
}) {
  return (
    <Card className="border-border/50 hover:border-border transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>
          </div>
          <div className={`h-9 w-9 rounded-lg ${bgColor} flex items-center justify-center`}>
            <Icon className={`h-4.5 w-4.5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "competition": return "bg-amber-500/10";
    case "payment": return "bg-emerald-500/10";
    case "artist": case "fan": return "bg-primary/10";
    case "moderation": case "content": return "bg-violet-500/10";
    default: return "bg-muted";
  }
}

function getCategoryIcon(category: string) {
  const cls = "h-3 w-3";
  switch (category) {
    case "competition": return <Trophy className={`${cls} text-amber-500`} />;
    case "payment": return <Coins className={`${cls} text-emerald-500`} />;
    case "artist": case "fan": return <Users className={`${cls} text-primary`} />;
    case "moderation": case "content": return <ShieldCheck className={`${cls} text-violet-500`} />;
    default: return <Activity className={`${cls} text-muted-foreground`} />;
  }
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function WithdrawalsPanel({ requests, processing, onApprove, onReject }: { requests: WithdrawalRequest[]; processing: string | null; onApprove: (r: WithdrawalRequest) => void; onReject: (r: WithdrawalRequest) => void }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pending Withdrawal Requests</CardTitle>
        <CardDescription className="text-xs">Review and process artist withdrawal requests</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Check className="h-10 w-10 mx-auto text-emerald-500/30 mb-3" />
            <p className="text-sm text-muted-foreground">All clear — no pending withdrawals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <Card key={request.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                        <h3 className="text-lg font-bold">{Math.abs(request.amount).toFixed(2)} BAK</h3>
                      </div>
                      <p className="text-xs text-muted-foreground"><strong>Artist:</strong> {request.metadata?.username || request.wallets?.profiles?.username || 'Unknown'} ({request.metadata?.email || request.wallets?.profiles?.email || ''})</p>
                      <p className="text-xs text-muted-foreground"><strong>Phone:</strong> {request.metadata?.phone_number || request.metadata?.account_number || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground"><strong>Net:</strong> {(request.metadata?.net_amount || Math.abs(request.amount) * 0.95).toFixed(2)} BAK</p>
                      <p className="text-[10px] text-muted-foreground">Requested: {new Date(request.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" onClick={() => onApprove(request)} disabled={processing === request.id}>
                        {processing === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-3 w-3" /> Approve</>}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onReject(request)} disabled={processing === request.id}>
                        {processing === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="mr-1 h-3 w-3" /> Reject</>}
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
  );
}

function PurchasesPanel({ purchases, processing, onApprove, setProcessing, fetchAllData }: { purchases: CoinPurchase[]; processing: string | null; onApprove: (p: CoinPurchase) => void; setProcessing: (id: string | null) => void; fetchAllData: () => void }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pending Coin Purchases</CardTitle>
        <CardDescription className="text-xs">Pesapal payments are processed automatically. Use manual verification only if needed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> Manual Verification
            </p>
            <div className="flex gap-2">
              <Input placeholder="Transaction ID or OrderTrackingId" id="verify-payment-id" className="flex-1 h-9 text-sm" />
              <Button size="sm" onClick={async () => {
                const input = document.getElementById('verify-payment-id') as HTMLInputElement;
                const id = input?.value?.trim();
                if (!id) { toast.error('Please enter a Transaction ID'); return; }
                setProcessing(id);
                try {
                  const { data, error } = await supabase.functions.invoke('pesapal-verify', {
                    body: { transaction_id: id.length === 36 ? id : undefined, order_tracking_id: id.length !== 36 ? id : undefined }
                  });
                  if (error) throw error;
                  if (data?.success) { toast.success(data.message || 'Payment verified'); fetchAllData(); if (input) input.value = ''; }
                  else toast.error(data?.error || 'Verification failed');
                } catch (error: any) { toast.error(error.message || 'Failed to verify'); }
                finally { setProcessing(null); }
              }} disabled={!!processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-3 w-3" /> Verify</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {purchases.length === 0 ? (
          <div className="text-center py-12">
            <Check className="h-10 w-10 mx-auto text-emerald-500/30 mb-3" />
            <p className="text-sm text-muted-foreground">All clear — no pending purchases</p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-primary flex-shrink-0" />
                        <h3 className="text-lg font-bold">{(purchase.amount / 20).toFixed(2)} BAK</h3>
                      </div>
                      <p className="text-xs text-muted-foreground"><strong>User:</strong> {purchase.profiles?.username} ({purchase.email})</p>
                      <p className="text-xs text-muted-foreground"><strong>Paid:</strong> {purchase.amount} {purchase.currency}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate"><strong>Ref:</strong> {purchase.reference}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(purchase.created_at).toLocaleString()}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={async () => {
                      setProcessing(purchase.id);
                      try {
                        const { data, error } = await supabase.functions.invoke('pesapal-verify', { body: { transaction_id: purchase.id } });
                        if (error) throw error;
                        if (data?.success) { toast.success(data.message || 'Verified'); fetchAllData(); }
                        else toast.error(data?.error || 'Failed');
                      } catch (error: any) { toast.error(error.message || 'Failed to verify'); }
                      finally { setProcessing(null); }
                    }} disabled={processing === purchase.id}>
                      {processing === purchase.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-3 w-3" /> Verify</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompetitionsPanel({ competitions, processing, navigate, onEnd, onDelete }: { competitions: Competition[]; processing: string | null; navigate: any; onEnd: (id: string) => void; onDelete: (id: string) => void }) {
  const statusOrder: Record<string, number> = { active: 0, voting: 1, upcoming: 2, completed: 3 };
  const sorted = [...competitions].sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Competition Management</CardTitle>
            <CardDescription className="text-xs">Manage all platform competitions</CardDescription>
          </div>
          <Button size="sm" onClick={() => navigate('/admin/create-competition')}>
            <Trophy className="h-3 w-3 mr-1.5" /> New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((comp) => {
            const daysLeft = Math.ceil((new Date(comp.end_date).getTime() - Date.now()) / 86400000);
            const isUrgent = comp.status === "active" && daysLeft <= 3;

            return (
              <div key={comp.id} className="space-y-3">
                <Card className={`border-border ${isUrgent ? "border-destructive/30 bg-destructive/5" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold break-words">{comp.title}</h3>
                          <Badge
                            variant={comp.status === "active" ? "default" : comp.status === "completed" ? "secondary" : "outline"}
                            className="text-[10px]"
                          >
                            {comp.status}
                          </Badge>
                          {isUrgent && (
                            <Badge variant="destructive" className="text-[10px]">
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              {daysLeft > 0 ? `${daysLeft}d left` : "Ending today"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Coins className="h-3 w-3" /> {comp.prize_amount} BAK
                          </span>
                          <span className="flex items-center gap-1">
                            <Music className="h-3 w-3" /> {comp.submissions?.length || 0} entries
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(comp.start_date).toLocaleDateString()} — {new Date(comp.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate(`/admin/edit-competition/${comp.id}`)}>
                          <Edit className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/competition/${comp.id}`)}>
                          View
                        </Button>
                        {comp.status === "active" && (
                          <Button variant="default" size="sm" className="h-7 text-xs" onClick={() => onEnd(comp.id)} disabled={processing === comp.id}>
                            {processing === comp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "End"}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => onDelete(comp.id)} disabled={processing === comp.id}>
                          {processing === comp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {(comp.status === "active" || comp.status === "voting") && (
                  <FraudDetection competitionId={comp.id} competitionTitle={comp.title} />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

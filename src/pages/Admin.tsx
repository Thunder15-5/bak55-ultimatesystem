import { useEffect, useState } from "react";
import { CompetitionReportPanel } from "@/components/admin/CompetitionReportPanel";
import { MerchManagementPanel } from "@/components/admin/MerchManagementPanel";
import { MerchOrdersPanel } from "@/components/admin/MerchOrdersPanel";
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
import { StatsCard } from "@/components/dashboard";
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
  TrendingUp, Music, Coins, Wallet, Music2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard";

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

export default function Admin() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("metrics");
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [coinPurchases, setCoinPurchases] = useState<CoinPurchase[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [pendingMerchOrders, setPendingMerchOrders] = useState(0);
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

    // Real-time subscriptions for admin metrics
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
      })
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [userRole]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchWithdrawalRequests(),
      fetchCoinPurchases(),
      fetchCompetitions(),
      fetchMetrics(),
    ]);
    setLoading(false);
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
        return <MetricsPanel metrics={metrics} withdrawalRequests={withdrawalRequests} navigate={navigate} />;
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
      case "withdrawal-config":
        return <WithdrawalConfigPanel />;
      case "artist-levels":
        return <ArtistLevelsPanel />;
      default:
        return null;
    }
  };

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
            />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-12 flex items-center gap-3 border-b border-border/50 px-4 bg-card/50 backdrop-blur-sm sticky top-16 z-10">
                <SidebarTrigger />
                <h1 className="text-sm font-heading font-bold capitalize">
                  {activeTab === "metrics" ? "Dashboard" : activeTab.replace("-", " ")}
                </h1>
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

function MetricsPanel({ metrics, withdrawalRequests, navigate }: { metrics: Metrics; withdrawalRequests: WithdrawalRequest[]; navigate: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard icon={Users} label="Total Users" value={metrics.totalUsers} subtitle={`${metrics.totalArtists} artists, ${metrics.totalBrands} brands, ${metrics.totalProducers} producers`} variant="primary" />
        <StatsCard icon={Music} label="Total Tracks" value={metrics.totalTracks} subtitle="Uploaded by artists" variant="secondary" />
        <StatsCard icon={Music2} label="Total Beats" value={metrics.totalBeats} subtitle="Uploaded by producers" variant="accent" />
        <StatsCard icon={Trophy} label="Competitions" value={metrics.totalCompetitions} subtitle={`${metrics.activeCompetitions} active`} variant="warning" />
        <StatsCard icon={Wallet} label="Total Revenue" value={`${metrics.totalRevenue.toFixed(0)} KES`} subtitle="From coin purchases" variant="success" />
        <StatsCard icon={TrendingUp} label="Pending Withdrawals" value={`${metrics.pendingWithdrawals.toFixed(0)} BAK`} subtitle={`${withdrawalRequests.length} requests`} variant="destructive" />
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button onClick={() => navigate('/admin/cash-reserve')} variant="outline" className="h-auto py-3 flex-col gap-1.5">
              <Wallet className="h-5 w-5" />
              <span className="text-xs">Cash Reserve</span>
            </Button>
            <Button onClick={() => navigate('/admin/vouchers')} variant="outline" className="h-auto py-3 flex-col gap-1.5">
              <Coins className="h-5 w-5" />
              <span className="text-xs">Vouchers</span>
            </Button>
            <Button onClick={() => navigate('/admin/deposits')} variant="outline" className="h-auto py-3 flex-col gap-1.5">
              <DollarSign className="h-5 w-5" />
              <span className="text-xs">Deposits</span>
            </Button>
            <Button onClick={() => navigate('/admin/create-competition')} variant="outline" className="h-auto py-3 flex-col gap-1.5">
              <Trophy className="h-5 w-5" />
              <span className="text-xs">New Competition</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
          <p className="text-center text-muted-foreground py-8 text-sm">No pending withdrawal requests</p>
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
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-warning mb-2 flex items-center gap-1.5">
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
          <p className="text-center text-muted-foreground py-8 text-sm">No pending purchases</p>
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
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Competition Management</CardTitle>
        <CardDescription className="text-xs">Manage all platform competitions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {competitions.map((comp) => (
            <div key={comp.id} className="space-y-3">
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
                        <h3 className="text-sm font-bold break-words">{comp.title}</h3>
                        <Badge variant={comp.status === "active" ? "default" : "secondary"} className="text-[10px]">{comp.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Prize: {comp.prize_amount} BAK • {comp.submissions?.length || 0} submissions</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(comp.start_date).toLocaleDateString()} - {new Date(comp.end_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/edit-competition/${comp.id}`)}><Edit className="mr-1 h-3 w-3" /> Edit</Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/competition/${comp.id}`)}>View</Button>
                      {comp.status === "active" && (
                        <Button variant="default" size="sm" onClick={() => onEnd(comp.id)} disabled={processing === comp.id}>
                          {processing === comp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "End"}
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => onDelete(comp.id)} disabled={processing === comp.id}>
                        {processing === comp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {(comp.status === "active" || comp.status === "voting") && (
                <FraudDetection competitionId={comp.id} competitionTitle={comp.title} />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

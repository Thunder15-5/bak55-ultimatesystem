import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ModerationPanel } from "@/components/ModerationPanel";
import { FraudDetection } from "@/components/FraudDetection";
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
  TrendingUp, Music, Coins, Share2, Wallet
} from "lucide-react";
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
  totalTracks: number;
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
    totalTracks: 0,
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
            profiles:user_id (username, email)
          )
        `)
        .gt("withdrawal_fee", 0)
        .eq("metadata->>status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const pendingRequests = (data as any[] | null)?.filter(
        (tx: any) => (tx.metadata as any)?.status === "pending"
      ) || [] as any[];

      setWithdrawalRequests(pendingRequests as any);
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
        tracksCount, 
        compsCount, 
        activeCompsCount, 
        withdrawalsSum,
        totalPlaysData,
        revenueData,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "artist"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "brand"),
        supabase.from("tracks").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("transactions").select("amount, withdrawal_fee").gt("withdrawal_fee", 0).eq("metadata->>status", "pending"),
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
        totalTracks: tracksCount.count || 0,
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

      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: walletData.balance + Math.abs(request.amount) })
        .eq("id", request.wallet_id);

      if (updateError) throw updateError;

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
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your platform</p>
        </div>

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="metrics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Metrics
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
            <TabsTrigger value="moderation">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Moderation
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
                    {metrics.totalArtists} artists, {metrics.totalBrands} brands
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
            <div className="flex gap-4">
              <Button onClick={() => navigate('/admin/cash-reserve')} variant="outline">
                <Wallet className="mr-2 h-4 w-4" />
                View Cash Reserve Dashboard
              </Button>
              <Button onClick={() => navigate('/admin/create-competition')} variant="outline">
                <Trophy className="mr-2 h-4 w-4" />
                Create Competition
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
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-primary" />
                                <h3 className="text-xl font-bold">
                                  {Math.abs(request.amount).toFixed(2)} BAK
                                </h3>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <strong>Artist:</strong> {request.wallets.profiles.username} ({request.wallets.profiles.email})
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Account Name:</strong> {request.metadata.account_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Account Number:</strong> {request.metadata.account_number}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Bank:</strong> {request.metadata.bank_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Requested: {new Date(request.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveWithdrawal(request)}
                                disabled={processing === request.id}
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
                <CardDescription>Approve manual BAKCoin purchases</CardDescription>
              </CardHeader>
              <CardContent>
                {coinPurchases.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending coin purchase requests
                  </p>
                ) : (
                  <div className="space-y-4">
                    {coinPurchases.map((purchase) => (
                      <Card key={purchase.id} className="border-2">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Coins className="h-5 w-5 text-primary" />
                                <h3 className="text-xl font-bold">
                                  {purchase.metadata.bak_amount} BAK
                                </h3>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <strong>User:</strong> {purchase.profiles?.username} ({purchase.email})
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Amount Paid:</strong> {purchase.amount} {purchase.currency}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Reference:</strong> {purchase.reference}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Requested: {new Date(purchase.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveCoinPurchase(purchase)}
                                disabled={processing === purchase.id}
                              >
                                {processing === purchase.id ? (
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
                                onClick={() => handleRejectCoinPurchase(purchase)}
                                disabled={processing === purchase.id}
                              >
                                {processing === purchase.id ? (
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

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{user.username}</h4>
                              {user.user_roles.map((role) => (
                                <Badge key={role.role} variant="secondary">
                                  {role.role}
                                </Badge>
                              ))}
                              {user.banned && (
                                <Badge variant="destructive">
                                  <ShieldAlert className="h-3 w-3 mr-1" />
                                  Banned
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant={user.banned ? "default" : "destructive"}
                            size="sm"
                            onClick={() => handleBanUser(user.id, user.banned)}
                            disabled={processing === user.id}
                          >
                            {processing === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.banned ? (
                              <>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Unban
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Ban
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-primary" />
                                <h3 className="text-xl font-bold">{comp.title}</h3>
                                <Badge variant={comp.status === "active" ? "default" : "secondary"}>
                                  {comp.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <strong>Prize:</strong> {comp.prize_amount} BAK
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Submissions:</strong> {comp.submissions?.length || 0}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Dates:</strong> {new Date(comp.start_date).toLocaleDateString()} - {new Date(comp.end_date).toLocaleDateString()}
                              </p>
                              {comp.voting_start_date && (
                                <p className="text-sm text-muted-foreground">
                                  <strong>Voting:</strong> {new Date(comp.voting_start_date).toLocaleDateString()} - {new Date(comp.voting_end_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/edit-competition/${comp.id}`)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate(`/competition/${comp.id}`)}
                              >
                                View
                              </Button>
                              {comp.status === "active" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleEndCompetition(comp.id)}
                                  disabled={processing === comp.id}
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
          {/* Content Moderation Tab */}
          <TabsContent value="moderation">
            <ModerationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

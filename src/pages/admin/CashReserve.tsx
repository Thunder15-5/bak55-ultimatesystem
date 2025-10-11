import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TrendingDown, Users, Wallet, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReserveData {
  totalBAKInCirculation: number;
  totalKshReserve: number;
  totalUsers: number;
  totalTransactions: number;
  totalWithdrawals: number;
  totalDeposits: number;
  platformFees: number;
}

export default function CashReserve() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reserveData, setReserveData] = useState<ReserveData | null>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);

  useEffect(() => {
    if (userRole !== "admin") {
      toast.error("Unauthorized access");
      navigate("/");
      return;
    }
    fetchReserveData();
    fetchPendingTasks();
  }, [userRole]);

  const fetchReserveData = async () => {
    try {
      // Get total BAK in circulation
      const { data: wallets, error: walletsError } = await supabase
        .from("wallets")
        .select("balance");

      if (walletsError) throw walletsError;

      const totalBAK = wallets.reduce((sum, w) => sum + parseFloat(w.balance.toString()), 0);

      // Get transaction stats
      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("amount, type, withdrawal_fee");

      if (txError) throw txError;

      const deposits = transactions
        .filter((t) => t.type === "deposit")
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      const withdrawals = transactions
        .filter((t) => t.type === "withdrawal")
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);

      const fees = transactions
        .filter((t) => t.withdrawal_fee)
        .reduce((sum, t) => sum + parseFloat(t.withdrawal_fee.toString()), 0);

      // Get user count
      const { count: userCount, error: userError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (userError) throw userError;

      setReserveData({
        totalBAKInCirculation: totalBAK,
        totalKshReserve: totalBAK * 20, // 1 BAK = 20 KSh
        totalUsers: userCount || 0,
        totalTransactions: transactions.length,
        totalWithdrawals: withdrawals,
        totalDeposits: deposits,
        platformFees: fees,
      });
    } catch (error: any) {
      toast.error("Failed to load reserve data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_tasks")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingTasks(data || []);
    } catch (error: any) {
      console.error("Failed to load pending tasks:", error);
    }
  };

  const handleApproveWithdrawal = async (taskId: string) => {
    try {
      const { error } = await supabase.functions.invoke("mpesa-withdraw", {
        body: { task_id: taskId, admin_id: user?.id },
      });

      if (error) throw error;

      toast.success("Withdrawal approved and processed!");
      fetchPendingTasks();
      fetchReserveData();
    } catch (error: any) {
      toast.error(error.message || "Failed to process withdrawal");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Cash Reserve Management</h1>
            <p className="text-muted-foreground">Platform financial overview</p>
          </div>
          <Button onClick={() => { fetchReserveData(); fetchPendingTasks(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {reserveData && (
          <>
            {/* Main Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total BAK in Circulation</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reserveData.totalBAKInCirculation.toFixed(2)} BAK</div>
                  <p className="text-xs text-muted-foreground">
                    ≈ {reserveData.totalKshReserve.toFixed(0)} KSh reserve needed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Fees Collected</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reserveData.platformFees.toFixed(2)} BAK</div>
                  <p className="text-xs text-muted-foreground">15% withdrawal fees</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reserveData.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">{reserveData.totalTransactions} transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-500">Deposits:</span>
                      <span className="font-medium">+{reserveData.totalDeposits.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-500">Withdrawals:</span>
                      <span className="font-medium">-{reserveData.totalWithdrawals.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Withdrawal Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Withdrawal Approvals</CardTitle>
                <CardDescription>{pendingTasks.length} withdrawal requests waiting for approval</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending withdrawals</p>
                ) : (
                  <div className="space-y-4">
                    {pendingTasks.map((task) => (
                      <Card key={task.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">
                                Amount: {task.metadata.amount} BAK
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Fee: {task.metadata.fee} BAK | Net: {task.metadata.net_amount} BAK
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {task.metadata.account_details?.bankName} - {task.metadata.account_details?.accountNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Requested: {new Date(task.created_at).toLocaleString()}
                              </p>
                            </div>
                            <Button onClick={() => handleApproveWithdrawal(task.id)}>
                              Approve & Process
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
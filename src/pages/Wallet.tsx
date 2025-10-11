import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Wallet as WalletIcon, TrendingUp, TrendingDown, ArrowUpRight, Plus, ArrowDownRight, Loader2, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function Wallet() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [accountDetails, setAccountDetails] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
  });

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", user?.id)
        .single();

      if (walletError) throw walletError;

      setBalance(walletData.balance);

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("wallet_id", walletData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (txError) throw txError;

      setTransactions(txData || []);
    } catch (error: any) {
      toast.error("Failed to load wallet data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    // Calculate 15% withdrawal fee
    const withdrawalFee = amount * 0.15;
    const netAmount = amount - withdrawalFee;

    setWithdrawing(true);

    try {
      // Get wallet ID
      const { data: walletData } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!walletData) throw new Error("Wallet not found");

      // Create withdrawal transaction
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          wallet_id: walletData.id,
          amount: -amount,
          type: "withdrawal",
          description: "Withdrawal request",
          withdrawal_fee: withdrawalFee,
          metadata: {
            status: "pending",
            account_name: accountDetails.accountName,
            account_number: accountDetails.accountNumber,
            bank_name: accountDetails.bankName,
            gross_amount: amount,
            fee_amount: withdrawalFee,
            net_amount: netAmount,
          },
        });

      if (txError) throw txError;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: balance - amount })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Create admin task for approval
      await supabase.from("admin_tasks").insert({
        task_type: "withdrawal_approval",
        related_id: walletData.id,
        metadata: {
          user_id: user.id,
          amount,
          fee: withdrawalFee,
          net_amount: netAmount,
          account_details: accountDetails,
        },
      });

      toast.success(`Withdrawal request submitted! You'll receive ${netAmount.toFixed(2)} BAK after 15% fee.`);
      setWithdrawAmount("");
      setAccountDetails({ accountName: "", accountNumber: "", bankName: "" });
      fetchWalletData();
    } catch (error: any) {
      toast.error(error.message || "Failed to process withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === "earning" || type === "tip" || type === "deposit" || type === "competition_prize" 
      ? <ArrowDownRight className="h-4 w-4 text-green-500" />
      : <ArrowUpRight className="h-4 w-4 text-red-500" />;
  };

  const getTransactionColor = (type: string) => {
    return type === "earning" || type === "tip" || type === "deposit" || type === "competition_prize"
      ? "text-green-500"
      : "text-red-500";
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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Wallet</h1>
          <p className="text-muted-foreground">Manage your BAKCoins</p>
        </div>

        {/* Balance Card */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <WalletIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              BAKCoins Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl sm:text-5xl font-bold text-primary mb-4">
              {balance.toFixed(2)} BAK
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate('/wallet/buy-coins')} variant="default" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Buy BAKCoins
              </Button>
              {userRole === "artist" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Request Withdrawal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4 sm:mx-auto">
                    <DialogHeader>
                      <DialogTitle>Withdraw BAKCoins</DialogTitle>
                      <DialogDescription>
                        Convert your BAKCoins to cash. Admin will process your request.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleWithdrawal} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (BAK)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          required
                        />
                        <div className="text-xs space-y-1">
                          <p className="text-muted-foreground">
                            Available: {balance.toFixed(2)} BAK
                          </p>
                          {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                            <div className="bg-muted p-2 rounded text-xs">
                              <p className="font-medium">Withdrawal Summary:</p>
                              <p>Gross Amount: {parseFloat(withdrawAmount).toFixed(2)} BAK</p>
                              <p>15% Fee: {(parseFloat(withdrawAmount) * 0.15).toFixed(2)} BAK</p>
                              <p className="font-bold text-primary">
                                You'll receive: {(parseFloat(withdrawAmount) * 0.85).toFixed(2)} BAK
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name</Label>
                        <Input
                          id="accountName"
                          value={accountDetails.accountName}
                          onChange={(e) => setAccountDetails({ ...accountDetails, accountName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={accountDetails.accountNumber}
                          onChange={(e) => setAccountDetails({ ...accountDetails, accountNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={accountDetails.bankName}
                          onChange={(e) => setAccountDetails({ ...accountDetails, bankName: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={withdrawing}>
                        {withdrawing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Submit Request"
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your recent BAKCoins activity</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <WalletIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No transactions yet</p>
                <Button onClick={() => navigate('/wallet/buy-coins')} variant="outline" size="sm">
                  Buy Your First BAKCoins
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold text-sm sm:text-base whitespace-nowrap ${getTransactionColor(tx.type)}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(2)} BAK
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

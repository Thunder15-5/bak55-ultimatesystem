import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Loader2, DollarSign } from "lucide-react";
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
          metadata: {
            status: "pending",
            account_name: accountDetails.accountName,
            account_number: accountDetails.accountNumber,
            bank_name: accountDetails.bankName,
          },
        });

      if (txError) throw txError;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: balance - amount })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("Withdrawal request submitted! Admin will process it soon.");
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
          <h1 className="text-4xl font-bold mb-2">My Wallet</h1>
          <p className="text-muted-foreground">Manage your BAKCoins</p>
        </div>

        {/* Balance Card */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-6 w-6" />
              BAKCoins Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-primary mb-4">
              {balance.toFixed(2)} BAK
            </div>
            {userRole === "artist" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="hero">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Request Withdrawal
                  </Button>
                </DialogTrigger>
                <DialogContent>
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
                      <p className="text-xs text-muted-foreground">
                        Available: {balance.toFixed(2)} BAK
                      </p>
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
              <p className="text-center text-muted-foreground py-8">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold ${getTransactionColor(tx.type)}`}>
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

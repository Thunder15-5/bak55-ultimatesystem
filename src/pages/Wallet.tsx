import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Wallet as WalletIcon, TrendingUp, TrendingDown, ArrowUpRight, Plus, ArrowDownRight, Loader2, DollarSign, ShoppingBag } from "lucide-react";
import { TransactionSkeleton } from "@/components/ui/skeleton-components";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExchangeRatesTable } from "@/components/ExchangeRatesTable";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function Wallet() {
  const { user, userRole } = useAuth();
  const { formatFromKES, formatBAK } = useCurrency();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
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
      
      // Set up realtime subscription for wallet and transactions
      const channel = supabase
        .channel('wallet_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Wallet updated');
            fetchWalletData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions'
          },
          () => {
            console.log('New transaction detected');
            fetchWalletData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (walletError) throw walletError;

      if (!walletData) {
        setBalance(0);
        setTransactions([]);
        setLoading(false);
        return;
      }

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

      // Fetch song sales stats for artists
      if (userRole === 'artist') {
        const { data: salesData, error: salesError } = await supabase
          .from('song_purchases')
          .select('amount_kes')
          .eq('artist_id', user?.id)
          .eq('status', 'completed');

        if (!salesError && salesData) {
          setTotalSalesCount(salesData.length);
          setTotalSales(salesData.reduce((sum, s) => sum + (s.amount_kes || 0), 0));
        }
      }
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

    // Minimum withdrawal check
    const MIN_WITHDRAWAL = 250;
    if (amount < MIN_WITHDRAWAL) {
      toast.error("Minimum withdrawal amount is 250 BAKCoins.");
      return;
    }

    // Validate required fields
    if (!accountDetails.accountNumber.trim()) {
      toast.error("Please enter your M-Pesa phone number or account number");
      return;
    }

    if (!accountDetails.accountName.trim()) {
      toast.error("Please enter your account name");
      return;
    }

    // Check for existing pending withdrawal
    const { data: walletData } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletData) {
      const { data: pendingTx } = await supabase
        .from("transactions")
        .select("id")
        .eq("wallet_id", walletData.id)
        .eq("type", "withdrawal")
        .limit(1);

      // Check metadata status via a broader query
      if (pendingTx && pendingTx.length > 0) {
        // We'll let backend handle the duplicate check more precisely
      }
    }

    // Calculate 5% withdrawal fee
    const withdrawalFee = amount * 0.05;
    const netAmount = amount - withdrawalFee;

    setWithdrawing(true);

    try {
      // Call process-withdrawal edge function
      const { data, error } = await supabase.functions.invoke("process-withdrawal", {
        body: {
          amount,
          phone_number: accountDetails.accountNumber || "254700000000",
          bank_details: accountDetails,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Create notification for user
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'withdrawal_submitted',
          title: 'Withdrawal Request Submitted',
          message: `Your withdrawal of ${netAmount.toFixed(2)} BAK has been submitted for processing. Reference: ${data.reference || 'Pending'}`,
          link: '/wallet',
          category: 'wallet',
        });

        toast.success(
          data.status === "pending_manual"
            ? `Withdrawal of ${netAmount.toFixed(2)} BAK submitted for admin review`
            : `Withdrawal of ${netAmount.toFixed(2)} BAK is being processed`,
          {
            description: `Reference: ${data.reference || 'Processing'}. Expected: 24-72 hours.`,
          }
        );
        setWithdrawAmount("");
        setAccountDetails({ accountName: "", accountNumber: "", bankName: "" });
        fetchWalletData();
      } else {
        throw new Error(data.error || "Withdrawal failed");
      }
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
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Wallet</h1>
            <p className="text-muted-foreground">Manage your BAKCoins</p>
          </div>
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <TransactionSkeleton key={i} />
                ))}
              </div>
            </CardContent>
          </Card>
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

        {/* Enhanced Balance Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl font-heading">
              <div className="p-2 rounded-xl bg-primary/20">
                <WalletIcon className="h-6 w-6 text-primary" />
              </div>
              BAKCoins Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="text-5xl sm:text-6xl font-bold text-gradient animate-fade-in">
                {balance.toFixed(2)}
              </div>
              <div className="text-lg text-muted-foreground font-medium">BAKCoins</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate('/wallet/buy-coins')} variant="hero" size="lg" className="w-full sm:w-auto">
                <Plus className="mr-2 h-5 w-5" />
                Buy BAKCoins
              </Button>
              {(userRole === "artist" || userRole === "producer") && (
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
                          <p className="text-yellow-500">Minimum withdrawal: 250 BAK</p>
                          {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                            <div className="bg-muted p-2 rounded text-xs">
                              <p className="font-medium">Withdrawal Summary:</p>
                              <p>Gross Amount: {parseFloat(withdrawAmount).toFixed(2)} BAK</p>
                              <p>5% Fee: {(parseFloat(withdrawAmount) * 0.05).toFixed(2)} BAK</p>
                              <p className="font-bold text-primary">
                                You'll receive: {(parseFloat(withdrawAmount) * 0.95).toFixed(2)} BAK
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

        {/* Song Sales Stats - Artists Only */}
        {userRole === 'artist' && totalSalesCount > 0 && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-xl bg-primary/20">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                Song Sales
              </CardTitle>
              <CardDescription>Revenue from direct song sales (0% commission)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">{totalSalesCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                 <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-primary">{formatFromKES(totalSales)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                💡 A 5% fee applies only when you withdraw earnings.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Exchange Rates */}
        <ExchangeRatesTable variant="compact" className="mb-8" />

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

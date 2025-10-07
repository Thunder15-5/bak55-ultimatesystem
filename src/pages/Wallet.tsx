import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Coins } from "lucide-react";

const Wallet = () => {
  const { user } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("wallet_id", wallet?.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!wallet,
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Wallet</h1>
          <p className="text-muted-foreground">Manage your BAKCoins</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletIcon className="w-5 h-5 text-primary" />
                Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary mb-4">
                {wallet?.balance || 0} <span className="text-2xl">BAK</span>
              </div>
              <p className="text-muted-foreground mb-6">
                BAKCoins • 1 BAK = 1 KSh
              </p>
              <Button className="gap-2">
                <Coins className="w-4 h-4" />
                Buy BAKCoins (Paystack integration pending)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-primary">0 BAK</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">0 BAK</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions?.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      (tx.type === "earning" || tx.type === "prize" || tx.type === "refund") ? "bg-primary/10" : "bg-destructive/10"
                    }`}
                  >
                    {(tx.type === "earning" || tx.type === "prize" || tx.type === "refund") ? (
                      <ArrowDownRight className="w-5 h-5 text-primary" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-destructive" />
                    )}
                    </div>
                    <div>
                      <p className="font-semibold">{tx.description || "Transaction"}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        (tx.type === "earning" || tx.type === "prize" || tx.type === "refund") ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {(tx.type === "earning" || tx.type === "prize" || tx.type === "refund") ? "+" : "-"}
                      {tx.amount} BAK
                    </p>
                  </div>
                </div>
              ))}

              {transactions?.length === 0 && (
                <div className="text-center py-12">
                  <WalletIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
                  <p className="text-muted-foreground">
                    Your transaction history will appear here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Info, AlertCircle } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const BuyCoins = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const kshAmount = parseFloat(amount) || 0;
  const bakAmount = kshAmount / 20; // 20 KSh = 1 BAK
  const MIN_AMOUNT = 100; // Minimum 20 KSh

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase BAKCoins",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (kshAmount < MIN_AMOUNT) {
      toast({
        title: "Invalid Amount",
        description: `Minimum purchase amount is ${MIN_AMOUNT} KSh`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get user profile for email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (!profile) {
        throw new Error("Profile not found");
      }

      // Create pending transaction record
      const reference = `BAK-${Date.now()}-${user.id.slice(0, 8)}`;
      
      const { data: transaction, error: transactionError } = await supabase
        .from("payment_transactions")
        .insert({
          user_id: user.id,
          amount: kshAmount,
          currency: "KES",
          email: profile.email,
          reference: reference,
          status: "pending",
          payment_provider: "pesapal",
          metadata: {
            bak_amount: bakAmount,
            type: "coin_purchase",
          },
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Initiate Pesapal payment
      const { data, error } = await supabase.functions.invoke("pesapal-initiate", {
        body: {
          amount: kshAmount,
          currency: "KES",
          description: `Purchase ${bakAmount} BAKCoins`,
          callback_url: `${window.location.origin}/payment/success`,
          notification_id: transaction.id,
          reference: reference,
          email: profile.email,
        },
      });

      if (error) throw error;

      if (data?.redirect_url) {
        // Redirect to Pesapal payment page
        window.location.href = data.redirect_url;
      } else if (!data?.success) {
        navigate("/payment/failed?error=" + encodeURIComponent(data?.error || "Payment initiation failed"));
      } else {
        throw new Error("Failed to initiate payment");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container max-w-2xl mx-auto px-4 py-8 pt-24">
        <Button
          variant="ghost"
          onClick={() => navigate("/wallet")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Wallet
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Buy BAKCoins</CardTitle>
            <CardDescription>
              Purchase BAKCoins to support artists, vote in competitions, and unlock exclusive features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePurchase} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KSh)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount in KSh"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={MIN_AMOUNT}
                  step="10"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Minimum: {MIN_AMOUNT} KSh
                </p>
              </div>

              {kshAmount >= MIN_AMOUNT && (
                <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">You pay:</span>
                    <span className="text-lg font-bold">{kshAmount} KSh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">You receive:</span>
                    <span className="text-lg font-bold text-primary">
                      {bakAmount.toFixed(2)} BAK
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Exchange rate: 20 KSh = 1 BAK
                  </div>
                </div>
              )}

              <div className="bg-muted/50 p-4 rounded-lg flex gap-3">
                <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium">Payment Information:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Secure payment powered by Pesapal</li>
                    <li>Currently supports M-Pesa payments</li>
                    <li>BAKCoins added instantly after successful payment</li>
                    <li>All transactions are encrypted and secure</li>
                  </ul>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Payment Method</AlertTitle>
                <AlertDescription>
                  Currently, only M-Pesa payments are active. Other payment methods will be available soon.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={isLoading || kshAmount < MIN_AMOUNT}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyCoins;

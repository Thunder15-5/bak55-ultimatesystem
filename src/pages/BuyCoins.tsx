import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Coins, ArrowLeft, AlertCircle, Loader2, Info, DollarSign } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const BuyCoins = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  const kshAmount = parseFloat(amount) || 0;
  const bakAmount = kshAmount / 20; // 20 KSh = 1 BAK

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase coins",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (kshAmount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum purchase amount is 100 KSh",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('pesapal-initiate', {
        body: {
          amount: kshAmount,
          email: user.email || '',
          phone_number: '',
        }
      });

      if (error) throw error;

      if (data?.success && data?.redirect_url) {
        // Redirect to Pesapal payment page
        window.location.href = data.redirect_url;
      } else {
        throw new Error('Failed to generate payment URL');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || 'Failed to initiate payment. Please try again.',
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
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
            <CardTitle className="text-2xl sm:text-3xl">Buy BAKCoins</CardTitle>
            <CardDescription>
              Purchase BAKCoins to support artists and vote in competitions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-primary/5 border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle>Pesapal Payment</AlertTitle>
              <AlertDescription>
                Pay securely using M-Pesa, Airtel Money, or Card via Pesapal
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KSh)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount in KSh"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={100}
                step="10"
                disabled={processing}
              />
              <p className="text-xs text-muted-foreground">
                Minimum: 100 KSh
              </p>
            </div>

            {kshAmount >= 100 && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">You pay:</span>
                  <span className="text-xl font-bold">{kshAmount} KSh</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm font-medium">You receive:</span>
                  <span className="text-xl font-bold text-primary">
                    {bakAmount.toFixed(2)} BAK
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <DollarSign className="h-3 w-3" />
                  Exchange rate: 20 KSh = 1 BAK
                </div>
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium">What you get:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Instant BAKCoin delivery</li>
                  <li>Support your favorite artists</li>
                  <li>Vote in competitions</li>
                  <li>Unlock premium features</li>
                </ul>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handlePurchase}
              disabled={kshAmount < 100 || processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-5 w-5" />
                  Buy {bakAmount.toFixed(2)} BAKCoins
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyCoins;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Info, Coins as CoinsIcon, DollarSign } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const BuyCoins = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");

  const kshAmount = parseFloat(amount) || 0;
  const bakAmount = kshAmount / 20; // 20 KSh = 1 BAK
  const MIN_AMOUNT = 100;

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

    // Payment integration removed - ready for new implementation
    toast({
      title: "Payment System",
      description: "Payment gateway integration is being updated. Please check back soon.",
      variant: "default",
    });
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

        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm shadow-elegant">
          <CardHeader className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <CoinsIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-heading">Buy BAKCoins</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Purchase BAKCoins to support artists, vote in competitions, and unlock exclusive features
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 pt-0">
            <form onSubmit={handlePurchase} className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Amount (KSh)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount in KSh"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={MIN_AMOUNT}
                  step="10"
                  className="h-11 md:h-12 text-base"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Minimum: {MIN_AMOUNT} KSh
                </p>
              </div>

              {kshAmount >= MIN_AMOUNT && (
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-xl border border-primary/20 space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">You pay:</span>
                    <span className="text-2xl font-bold">{kshAmount} KSh</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-primary/20">
                    <span className="text-sm font-medium text-muted-foreground">You receive:</span>
                    <span className="text-2xl font-bold text-gradient">
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
                  <p className="font-medium">Coming Soon:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Multiple payment methods</li>
                    <li>Instant BAKCoin delivery</li>
                    <li>Secure encrypted transactions</li>
                    <li>Email confirmations</li>
                  </ul>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Payment Gateway Integration</AlertTitle>
                <AlertDescription>
                  We're setting up a new payment system to provide you with the best experience. Check back soon for secure payments via M-Pesa, cards, and more.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                className="w-full h-12 md:h-14 text-base touch-manipulation"
                disabled
              >
                Coming Soon
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyCoins;

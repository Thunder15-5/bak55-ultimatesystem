import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Coins, ArrowLeft, Loader2, Info, Ticket, ExternalLink, CheckCircle } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// Selar product link for 100 KES BAKCoin package
const SELAR_PRODUCT_LINK = "https://selar.com/x6r5dgu5h5";
const PACKAGE_PRICE_KES = 100;
const BAK_RATE = 20; // 20 KES = 1 BAK
const BAK_AMOUNT = (PACKAGE_PRICE_KES / BAK_RATE).toFixed(2); // 5.00 BAK

const BuyCoins = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [voucherCode, setVoucherCode] = useState("");
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);

  // Check if user just completed a payment
  const paymentStatus = searchParams.get("status");
  const paymentReference = searchParams.get("reference");

  const handleRedeemVoucher = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to redeem vouchers",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!voucherCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter a voucher code",
        variant: "destructive",
      });
      return;
    }

    setRedeemingVoucher(true);

    try {
      const { data, error } = await supabase.functions.invoke('voucher-redeem', {
        body: { code: voucherCode.toUpperCase().trim() }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Voucher Redeemed!",
          description: data.message,
        });
        setVoucherCode("");
        navigate("/wallet");
      } else {
        throw new Error(data?.error || 'Failed to redeem voucher');
      }
    } catch (error: any) {
      console.error('Voucher redemption error:', error);
      toast({
        title: "Redemption Failed",
        description: error.message || 'Invalid or expired voucher code',
        variant: "destructive",
      });
    } finally {
      setRedeemingVoucher(false);
    }
  };

  const handleBuyWithSelar = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase BAKCoins",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Open Selar payment link with user email pre-filled if possible
    const selarUrl = new URL(SELAR_PRODUCT_LINK);
    if (user.email) {
      selarUrl.searchParams.set('email', user.email);
    }
    // Add user_id as metadata for callback tracking
    selarUrl.searchParams.set('metadata[user_id]', user.id);
    
    window.open(selarUrl.toString(), '_blank');
    
    toast({
      title: "Payment Window Opened",
      description: "Complete your payment in the new tab. Your BAKCoins will be credited automatically.",
    });
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

        {/* Payment Success Message */}
        {paymentStatus === "success" && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/30">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-600">Payment Successful!</AlertTitle>
            <AlertDescription>
              Your BAKCoins have been credited to your wallet.
              {paymentReference && <span className="block text-xs mt-1">Reference: {paymentReference}</span>}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Buy BAKCoins</CardTitle>
            <CardDescription>
              Purchase BAKCoins to support artists and vote in competitions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Main Purchase Section - Selar */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Coins className="h-6 w-6 text-primary" />
                  Buy BAKCoins Package
                </CardTitle>
                <CardDescription>
                  Quick and secure payment via Selar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-background/50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Package Price:</span>
                    <span className="text-xl font-bold">100 KES</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-sm font-medium">You Receive:</span>
                    <span className="text-2xl font-bold text-primary">
                      {BAK_AMOUNT} BAK
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Rate: 20 KES = 1 BAK
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleBuyWithSelar}
                >
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Buy Now - 100 KES
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  You'll be redirected to Selar to complete your payment securely
                </p>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            {/* Voucher Redemption Section */}
            <Card className="bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Have a Voucher Code?
                </CardTitle>
                <CardDescription>
                  Redeem your voucher code to instantly add BAKCoins to your wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voucher">Voucher Code</Label>
                  <Input
                    id="voucher"
                    type="text"
                    placeholder="Enter your voucher code"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    disabled={redeemingVoucher}
                    maxLength={20}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleRedeemVoucher}
                  disabled={!voucherCode.trim() || redeemingVoucher}
                  variant="secondary"
                >
                  {redeemingVoucher ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Ticket className="mr-2 h-4 w-4" />
                      Redeem Voucher
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="bg-muted/50 p-4 rounded-lg flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium">What you get with BAKCoins:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Support your favorite artists with tips</li>
                  <li>Vote in competitions</li>
                  <li>Unlock premium features</li>
                  <li>Enter exclusive contests</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyCoins;

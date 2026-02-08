import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Coins, ArrowLeft, Loader2, Info, Ticket, ExternalLink, CheckCircle, Sparkles } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Selar payment packages
const PAYMENT_PACKAGES = [
  { 
    id: 'pkg_100', 
    priceKES: 100, 
    bakAmount: 5, 
    selarLink: 'https://selar.com/x6r5dgu5h5',
    popular: false
  },
  { 
    id: 'pkg_250', 
    priceKES: 250, 
    bakAmount: 12.5, 
    selarLink: 'https://selar.com/5b14447v0n',
    popular: false
  },
  { 
    id: 'pkg_500', 
    priceKES: 500, 
    bakAmount: 25, 
    selarLink: 'https://selar.com/79r4616705',
    popular: false
  },
  { 
    id: 'pkg_1000', 
    priceKES: 1000, 
    bakAmount: 50, 
    selarLink: 'https://selar.com/22en2upr67',
    popular: true
  },
  { 
    id: 'pkg_2500', 
    priceKES: 2500, 
    bakAmount: 125, 
    selarLink: 'https://selar.com/f176d5q724',
    popular: false
  },
  { 
    id: 'pkg_5000', 
    priceKES: 5000, 
    bakAmount: 250, 
    selarLink: 'https://selar.com/7167167f11',
    popular: false
  },
];

const BAK_RATE = 20; // 20 KES = 1 BAK

const BuyCoins = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [voucherCode, setVoucherCode] = useState("");
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<typeof PAYMENT_PACKAGES[0] | null>(null);

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

  const handleBuyWithSelar = (pkg: typeof PAYMENT_PACKAGES[0]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase BAKCoins",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Open Selar payment link with user email pre-filled
    const selarUrl = new URL(pkg.selarLink);
    if (user.email) {
      selarUrl.searchParams.set('email', user.email);
    }
    // Add user_id as metadata for callback tracking
    selarUrl.searchParams.set('metadata[user_id]', user.id);
    selarUrl.searchParams.set('metadata[package_id]', pkg.id);
    selarUrl.searchParams.set('metadata[amount_kes]', pkg.priceKES.toString());
    selarUrl.searchParams.set('metadata[bak_amount]', pkg.bakAmount.toString());
    
    window.open(selarUrl.toString(), '_blank');
    
    toast({
      title: "Payment Window Opened",
      description: `Complete your payment of KES ${pkg.priceKES.toLocaleString()} in the new tab. Your ${pkg.bakAmount} BAKCoins will be credited automatically.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/wallet")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Wallet
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Buy BAKCoins</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Get <span className="text-gradient">BAKCoins</span>
          </h1>
          <p className="text-muted-foreground">
            Support artists, vote in competitions, and unlock premium features
          </p>
        </div>

        {/* Package Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Select Package
            </CardTitle>
            <CardDescription>
              Choose the amount of BAKCoins you want to purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PAYMENT_PACKAGES.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`cursor-pointer transition-all hover:border-primary/60 ${
                    selectedPackage?.id === pkg.id 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:shadow-md'
                  } ${pkg.popular ? 'relative' : ''}`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-secondary">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-4 pt-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {pkg.bakAmount}
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      BAKCoins
                    </div>
                    <div className="text-xl font-semibold">
                      KES {pkg.priceKES.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Rate: {BAK_RATE} KES = 1 BAK
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedPackage && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-muted-foreground">You selected:</p>
                    <p className="text-lg font-semibold">
                      {selectedPackage.bakAmount} BAKCoins for KES {selectedPackage.priceKES.toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    onClick={() => handleBuyWithSelar(selectedPackage)}
                    className="w-full sm:w-auto"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Pay Now
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* Voucher Redemption Section */}
        <Card>
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder="Enter your voucher code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                disabled={redeemingVoucher}
                maxLength={20}
                className="flex-1"
              />
              <Button 
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
                    Redeem
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Alert className="mt-6">
          <Info className="h-4 w-4" />
          <AlertTitle>What you can do with BAKCoins</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Support your favorite artists with tips</li>
              <li>Vote in competitions</li>
              <li>Unlock premium features</li>
              <li>Enter exclusive contests</li>
              <li>Purchase beat licenses</li>
            </ul>
          </AlertDescription>
        </Alert>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Payments are processed securely via Selar. BAKCoins are credited instantly after payment confirmation.
        </p>
      </div>
    </div>
  );
};

export default BuyCoins;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Coins, ArrowLeft, AlertCircle, Loader2, Info, DollarSign, Ticket, Receipt } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const BuyCoins = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [receiptCode, setReceiptCode] = useState("");
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  const kshAmount = parseFloat(amount) || 0;
  const bakAmount = kshAmount / 20; // 20 KSh = 1 BAK

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

  const handleSubmitDeposit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit deposits",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!amount || amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is 100 KSh",
        variant: "destructive",
      });
      return;
    }

    if (!receiptCode.trim()) {
      toast({
        title: "Receipt Required",
        description: "Please enter your M-Pesa receipt code",
        variant: "destructive",
      });
      return;
    }

    setSubmittingDeposit(true);

    try {
      const { data, error } = await supabase.functions.invoke('deposit-request', {
        body: {
          amount_kes: amount,
          receipt_code: receiptCode.trim()
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Deposit Submitted",
          description: data.message,
        });
        setDepositAmount("");
        setReceiptCode("");
        navigate("/wallet");
      } else {
        throw new Error(data?.error || 'Failed to submit deposit');
      }
    } catch (error: any) {
      console.error('Deposit submission error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || 'Failed to submit deposit request',
        variant: "destructive",
      });
    } finally {
      setSubmittingDeposit(false);
    }
  };

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
      const { data, error } = await supabase.functions.invoke('selar-initiate', {
        body: {
          amount: kshAmount,
          email: user.email || '',
          product_type: 'bakcoins',
          description: `Purchase ${bakAmount.toFixed(1)} BAKCoins`
        }
      });

      if (error) throw error;

      if (data?.success && data?.payment_url) {
        window.location.href = data.payment_url;
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

            <Separator className="my-6" />

            {/* Manual M-Pesa Deposit Section */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="mpesa">
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    Pay with M-Pesa (Manual)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <Alert className="bg-blue-500/5 border-blue-500/20">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertTitle>How it works</AlertTitle>
                    <AlertDescription className="space-y-2 mt-2">
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Send money via M-Pesa to: <strong>0712345678</strong></li>
                        <li>Note the M-Pesa receipt code (e.g., SH12ABC3XY)</li>
                        <li>Fill the form below with amount and receipt code</li>
                        <li>We'll verify and credit your wallet within 24 hours</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="deposit-amount">Amount (KSh)</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      placeholder="Enter amount sent via M-Pesa"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min={100}
                      step="10"
                      disabled={submittingDeposit}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum: 100 KSh • Rate: 20 KSh = 1 BAK
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt">M-Pesa Receipt Code</Label>
                    <Input
                      id="receipt"
                      type="text"
                      placeholder="e.g., SH12ABC3XY"
                      value={receiptCode}
                      onChange={(e) => setReceiptCode(e.target.value.toUpperCase())}
                      disabled={submittingDeposit}
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">
                      Find this in your M-Pesa confirmation SMS
                    </p>
                  </div>

                  {parseFloat(depositAmount) >= 100 && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">You will receive:</span>
                        <span className="text-xl font-bold text-primary">
                          {(parseFloat(depositAmount) / 20).toFixed(2)} BAK
                        </span>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={handleSubmitDeposit}
                    disabled={parseFloat(depositAmount) < 100 || !receiptCode.trim() || submittingDeposit}
                  >
                    {submittingDeposit ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Receipt className="mr-2 h-4 w-4" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Separator className="my-6" />

            {/* Online Payment Section (Selar - requires KYC) */}
            <div className="space-y-4 opacity-60">
              <Alert className="bg-primary/5 border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertTitle>Online Payment (Coming Soon)</AlertTitle>
                <AlertDescription>
                  Direct M-Pesa, Card & Bank payments will be available once merchant verification is complete
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
                  disabled={true}
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

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePurchase}
                disabled={true}
              >
                <Coins className="mr-2 h-5 w-5" />
                Pay Online (Unavailable)
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium">What you get:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Instant BAKCoin delivery (vouchers)</li>
                  <li>Support your favorite artists</li>
                  <li>Vote in competitions</li>
                  <li>Unlock premium features</li>
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

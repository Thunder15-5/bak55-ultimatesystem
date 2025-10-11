import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Wallet, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  const orderTrackingId = searchParams.get("OrderTrackingId");
  const isTestMode = searchParams.get("test") === "true";

  useEffect(() => {
    if (orderTrackingId && user) {
      fetchTransactionDetails();
    } else {
      setLoading(false);
    }
  }, [orderTrackingId, user]);

  const fetchTransactionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("payment_reference", orderTrackingId)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setTransactionDetails(data);
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const bakAmount = transactionDetails?.metadata?.bak_amount || 0;
  const kshAmount = transactionDetails?.amount || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-2xl mx-auto px-4 py-20">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-3xl">Payment Successful!</CardTitle>
            <CardDescription className="text-lg">
              {isTestMode && (
                <span className="text-yellow-500 font-medium block mb-2">
                  (Test Mode - No actual charge)
                </span>
              )}
              Your BAKCoins have been added to your wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-card p-6 rounded-lg space-y-3 border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="text-xl font-bold">{kshAmount} KSh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">BAKCoins Received:</span>
                <span className="text-2xl font-bold text-primary">
                  {bakAmount.toFixed(2)} BAK
                </span>
              </div>
              {transactionDetails?.reference && (
                <div className="flex justify-between items-center text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono text-xs">{transactionDetails.reference}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="default"
                className="flex-1"
                onClick={() => navigate("/wallet")}
              >
                <Wallet className="mr-2 h-4 w-4" />
                View Wallet
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/catalog")}
              >
                Explore Music
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              A confirmation email has been sent to your registered email address
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

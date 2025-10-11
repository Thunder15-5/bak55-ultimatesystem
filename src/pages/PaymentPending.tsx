import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Wallet } from "lucide-react";

export default function PaymentPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderRef = searchParams.get("ref");

  useEffect(() => {
    // Auto-refresh wallet after 5 seconds
    const timer = setTimeout(() => {
      navigate("/wallet");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-2xl mx-auto px-4 py-20">
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-yellow-500 animate-pulse" />
            </div>
            <CardTitle className="text-3xl">Payment Processing</CardTitle>
            <CardDescription className="text-lg">
              Your payment is being processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-card p-6 rounded-lg border space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Confirming payment with provider...
                </p>
              </div>

              {orderRef && (
                <div className="text-center pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Transaction Reference:</p>
                  <p className="font-mono text-xs">{orderRef}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-center">What happens next?</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">1.</span>
                  <span>Payment provider confirms your transaction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">2.</span>
                  <span>BAKCoins are automatically added to your wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">3.</span>
                  <span>You receive a confirmation email</span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Redirecting to your wallet in 5 seconds...
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/wallet")}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Go to Wallet Now
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">
                This usually takes less than a minute. If payment doesn't complete within 5 minutes, please contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

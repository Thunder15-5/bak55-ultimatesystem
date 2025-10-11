import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle, RefreshCw, ArrowLeft, HelpCircle } from "lucide-react";

export default function PaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const errorMessage = searchParams.get("error") || "Payment could not be completed";
  const orderRef = searchParams.get("ref");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-2xl mx-auto px-4 py-20">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <CardTitle className="text-3xl">Payment Failed</CardTitle>
            <CardDescription className="text-lg">
              We couldn't process your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>

            {orderRef && (
              <div className="bg-card p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Reference ID:</p>
                <p className="font-mono text-xs">{orderRef}</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold">Common Issues:</h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Insufficient funds in your payment account</li>
                <li>Incorrect payment details entered</li>
                <li>Payment timeout or network error</li>
                <li>Card or account restrictions</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="default"
                className="flex-1"
                onClick={() => navigate("/wallet/buy-coins")}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/wallet")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Wallet
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Need Help?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                If you continue experiencing issues, please contact our support team.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/support")}
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

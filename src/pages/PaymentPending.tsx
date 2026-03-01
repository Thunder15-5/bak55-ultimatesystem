import { useNavigate } from "react-router-dom";
import { Clock, Wallet, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SELAR_PRODUCT_LINK = "https://selar.com/x6r5dgu5h5";

const PaymentPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background-dark p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-warning/10 p-4">
            <Clock className="h-16 w-16 text-warning animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-warning">Payment Pending</h1>
          <p className="text-lg text-muted-foreground">
            Your payment is being processed
          </p>
          <p className="text-sm text-muted-foreground">
            Once Selar confirms your payment, BAKCoins will be automatically credited to your wallet.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Package:</span>
            <span className="font-bold">5.00 BAK</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Provider:</span>
            <span className="font-medium">Selar</span>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Button 
            onClick={() => navigate('/wallet')} 
            className="w-full"
            size="lg"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Check My Wallet
          </Button>

          <Button 
            onClick={() => window.open(SELAR_PRODUCT_LINK, '_blank')} 
            variant="outline"
            className="w-full"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Try Payment Again
          </Button>

          <p className="text-xs text-muted-foreground">
            You'll receive a notification once your payment is confirmed
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PaymentPending;
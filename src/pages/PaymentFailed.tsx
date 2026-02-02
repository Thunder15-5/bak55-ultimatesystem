import { useNavigate } from "react-router-dom";
import { XCircle, Wallet, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SELAR_PRODUCT_LINK = "https://selar.com/x6r5dgu5h5";

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background-dark p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-destructive">Payment Failed</h1>
          <p className="text-lg text-muted-foreground">
            Your payment could not be processed
          </p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 text-left text-sm space-y-2">
          <p className="font-semibold">Common reasons for payment failure:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Insufficient funds in your account</li>
            <li>Incorrect payment details</li>
            <li>Payment was cancelled</li>
            <li>Network timeout or connection issue</li>
          </ul>
        </div>

        <div className="space-y-3 pt-4">
          <Button 
            onClick={() => window.open(SELAR_PRODUCT_LINK, '_blank')} 
            className="w-full"
            size="lg"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Try Again via Selar
          </Button>

          <Button 
            onClick={() => navigate('/wallet')} 
            variant="outline"
            className="w-full"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Back to Wallet
          </Button>

          <Button 
            onClick={() => navigate('/support')} 
            variant="ghost"
            className="w-full"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Contact Support
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentFailed;
import { useNavigate, useLocation } from "react-router-dom";
import { XCircle, Wallet, RefreshCcw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderTrackingId, transactionId, error } = location.state || {};

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
          {error && (
            <p className="text-sm text-muted-foreground bg-destructive/5 p-3 rounded">
              {error}
            </p>
          )}
        </div>

        {orderTrackingId && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span className="font-mono text-xs">{transactionId?.substring(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference:</span>
              <span className="font-mono text-xs">{orderTrackingId.substring(0, 16)}...</span>
            </div>
          </div>
        )}

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
            onClick={() => navigate('/wallet/buy-coins')} 
            className="w-full"
            size="lg"
          >
            <RefreshCcw className="mr-2 h-5 w-5" />
            Try Again
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

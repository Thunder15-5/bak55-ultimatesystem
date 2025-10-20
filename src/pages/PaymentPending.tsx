import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentPending = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { orderTrackingId, transactionId } = location.state || {};
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('pesapal-callback', {
        body: { 
          OrderTrackingId: orderTrackingId,
          transaction_id: transactionId,
        }
      });

      if (error) throw error;

      const status = data?.status;
      
      if (status === 'success') {
        toast({
          title: "Payment Confirmed!",
          description: "Your payment has been verified successfully.",
        });
        navigate('/payment/success', { state: { orderTrackingId, transactionId } });
      } else if (status === 'failed') {
        toast({
          title: "Payment Failed",
          description: "Your payment could not be processed.",
          variant: "destructive",
        });
        navigate('/payment/failed', { state: { orderTrackingId, transactionId } });
      } else {
        toast({
          title: "Still Pending",
          description: "Your payment is still being processed. Please check again shortly.",
        });
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast({
        title: "Error",
        description: "Failed to check payment status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

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
            This usually takes a few minutes. Our team will verify your payment shortly.
          </p>
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

        <div className="space-y-3 pt-4">
          <Button 
            onClick={checkStatus} 
            variant="outline"
            className="w-full"
            disabled={checking}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check Status'}
          </Button>

          <Button 
            onClick={() => navigate('/wallet')} 
            className="w-full"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Back to Wallet
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

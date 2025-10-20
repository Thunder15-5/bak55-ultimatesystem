import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function PesapalCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "pending">("loading");
  const [message, setMessage] = useState("Processing your payment...");

  useEffect(() => {
    const handleCallback = async () => {
      const orderTrackingId = searchParams.get("OrderTrackingId");
      const merchantReference = searchParams.get("OrderMerchantReference");

      if (!orderTrackingId || !merchantReference) {
        setStatus("failed");
        setMessage("Invalid payment callback");
        return;
      }

      try {
        // Call the Supabase callback function
        const { data, error } = await supabase.functions.invoke("pesapal-callback", {
          body: {
            OrderTrackingId: orderTrackingId,
            OrderMerchantReference: merchantReference,
          },
        });

        if (error) throw error;

        if (data.status === "success") {
          setStatus("success");
          setMessage("Payment successful! Your BAKCoins have been credited.");
          toast.success("Payment completed successfully!");
          setTimeout(() => navigate("/wallet"), 3000);
        } else if (data.status === "failed") {
          setStatus("failed");
          setMessage("Payment failed. Please try again.");
          toast.error("Payment was not successful");
        } else {
          setStatus("pending");
          setMessage("Payment is still being processed. Please check your wallet later.");
        }
      } catch (error: any) {
        console.error("Payment callback error:", error);
        setStatus("failed");
        setMessage("An error occurred while processing your payment.");
        toast.error("Payment processing failed");
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
              <p className="text-lg">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <p className="text-lg font-semibold text-green-500">Payment Successful!</p>
                <p className="text-muted-foreground mt-2">{message}</p>
              </div>
              <Button onClick={() => navigate("/wallet")} variant="gradient" className="w-full">
                Go to Wallet
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-red-500" />
              <div>
                <p className="text-lg font-semibold text-red-500">Payment Failed</p>
                <p className="text-muted-foreground mt-2">{message}</p>
              </div>
              <div className="space-y-2">
                <Button onClick={() => navigate("/wallet/buy-coins")} variant="gradient" className="w-full">
                  Try Again
                </Button>
                <Button onClick={() => navigate("/wallet")} variant="outline" className="w-full">
                  Back to Wallet
                </Button>
              </div>
            </>
          )}

          {status === "pending" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-yellow-500" />
              <div>
                <p className="text-lg font-semibold text-yellow-500">Payment Pending</p>
                <p className="text-muted-foreground mt-2">{message}</p>
              </div>
              <Button onClick={() => navigate("/wallet")} variant="outline" className="w-full">
                Check Wallet
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

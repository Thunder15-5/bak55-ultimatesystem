import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle } from "lucide-react";

const PaymentCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Selar payments are processed via webhook automatically
    // This page just redirects back to wallet after showing confirmation
    const timer = setTimeout(() => {
      navigate('/wallet');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background-dark p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-primary animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Processing Payment</h1>
          <p className="text-lg text-muted-foreground">
            Your payment is being verified. BAKCoins will be credited automatically.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Redirecting to wallet...
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
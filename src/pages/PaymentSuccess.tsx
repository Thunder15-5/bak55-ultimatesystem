import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// @ts-ignore - canvas-confetti types
import confetti from "canvas-confetti";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      });
    }, 250);

    // Auto-redirect after 5 seconds
    const redirectTimer = setTimeout(() => {
      navigate('/wallet');
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background-dark p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="rounded-full bg-success/10 p-4">
            <CheckCircle2 className="h-16 w-16 text-success" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-success">Payment Successful!</h1>
          <p className="text-lg text-muted-foreground">
            5.00 BAKCoins have been credited to your wallet
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount Paid:</span>
            <span className="font-bold">100 KES</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">BAKCoins Received:</span>
            <span className="font-bold text-primary">5.00 BAK</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Method:</span>
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
            View My Wallet
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="text-xs text-muted-foreground">
            Redirecting automatically in 5 seconds...
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
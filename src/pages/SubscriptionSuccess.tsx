import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Upload, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#8B5CF6', '#7C3AED', '#6D28D9']
      });
      
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#8B5CF6', '#7C3AED', '#6D28D9']
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 mt-20">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/50 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <CheckCircle className="w-16 h-16 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Subscription Activated! 🎉</h1>
                <p className="text-lg text-muted-foreground">
                  Welcome to unlimited uploads and exclusive features
                </p>
              </div>

              <div className="bg-primary/5 rounded-lg p-6 space-y-3">
                <h3 className="font-semibold text-lg">What's Next?</h3>
                <ul className="space-y-2 text-left max-w-md mx-auto">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>Upload unlimited tracks to your catalog</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>Get priority moderation (24hr approval)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>Enjoy 50% off competition entry fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>Access advanced analytics dashboard</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" onClick={() => navigate('/upload')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Track
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/subscription/manage')}>
                  Manage Subscription
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground pt-6">
                Need help? Contact support at info@bak55talent.co.ke
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
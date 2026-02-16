import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, Crown, Sparkles, Star } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price_bak: number;
  price_usd: number;
  duration_days: number;
  features: string[];
  target_role: string;
}

export default function FanSubscribe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch fan plans, current subscription, and wallet in parallel
    const [plansRes, subRes, walletRes] = await Promise.all([
      supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .eq('target_role', 'fan')
        .order('price_bak', { ascending: true }),
      supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single(),
      supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single()
    ]);

    if (plansRes.data) {
      setPlans(plansRes.data.map(p => ({
        id: p.id,
        name: p.name,
        price_bak: p.price_bak,
        price_usd: p.price_usd || 0,
        duration_days: p.duration_days || 30,
        features: Array.isArray(p.features) ? p.features.map(f => String(f)) : [],
        target_role: p.target_role || 'fan'
      })));
    }

    if (!subRes.error && subRes.data) {
      setCurrentSubscription(subRes.data);
    }

    if (walletRes.data) {
      setWalletBalance(walletRes.data.balance);
    }

    setLoading(false);
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      navigate('/login');
      return;
    }

    if (walletBalance < plan.price_bak) {
      toast.error(`Insufficient balance. You need ${plan.price_bak} BAK but have ${walletBalance} BAK.`);
      navigate('/buy-coins');
      return;
    }

    setSubscribing(plan.id);

    try {
      // Get fresh session to ensure valid token (important for mobile)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.functions.invoke('subscribe-plan', {
        body: {
          plan_id: plan.id,
          payment_method: 'bakcoins',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(data?.message || 'Subscription activated!');
        navigate('/fan/dashboard');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      const errorMessage = error?.message || 'Failed to process subscription';
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSubscribing(null);
    }
  };

  const getPlanIcon = (name: string) => {
    if (name.includes('Daily')) return <Star className="h-6 w-6" />;
    if (name.includes('Monthly')) return <Sparkles className="h-6 w-6" />;
    if (name.includes('Yearly')) return <Crown className="h-6 w-6" />;
    return <Star className="h-6 w-6" />;
  };

  const getPlanColor = (name: string) => {
    if (name.includes('Daily')) return 'border-blue-500/50 bg-blue-500/5';
    if (name.includes('Monthly')) return 'border-purple-500/50 bg-purple-500/5';
    if (name.includes('Yearly')) return 'border-amber-500/50 bg-amber-500/5 ring-2 ring-amber-500/20';
    return 'border-primary/50';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background overflow-y-auto">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 mt-20 pb-24">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Fan Premium Plans</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock exclusive features, vote with bonus power, and enjoy an ad-free experience
            </p>
            <p className="text-sm text-muted-foreground">
              Your balance: <span className="font-bold text-primary">{walletBalance} BAK</span>
            </p>
          </div>

          {/* Current Subscription Alert */}
          {currentSubscription && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <p className="font-medium">
                You're currently on {currentSubscription.subscription_plans.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Expires: {new Date(currentSubscription.expires_at).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = currentSubscription?.plan_id === plan.id;
              const isBestValue = plan.name.includes('Yearly');
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all hover:scale-105 ${getPlanColor(plan.name)}`}
                >
                  {isBestValue && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white">
                      Best Value
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10 text-primary">
                      {getPlanIcon(plan.name)}
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.duration_days === 1 ? '24 hours' : 
                       plan.duration_days === 30 ? '30 days' : 
                       plan.duration_days === 365 ? '1 year' : `${plan.duration_days} days`}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Pricing */}
                    <div className="text-center">
                      <div className="text-3xl font-bold">{plan.price_bak} BAK</div>
                      <div className="text-sm text-muted-foreground">
                        ${plan.price_usd.toFixed(2)} USD
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isCurrentPlan || subscribing !== null}
                      className="w-full"
                      variant={isBestValue ? "hero" : "default"}
                    >
                      {subscribing === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {isCurrentPlan ? 'Current Plan' : 
                       subscribing === plan.id ? 'Processing...' : 'Subscribe Now'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Need more BAKCoins? */}
          <div className="text-center pt-8">
            <p className="text-muted-foreground mb-4">Need more BAKCoins?</p>
            <Button variant="outline" onClick={() => navigate('/buy-coins')}>
              Buy BAKCoins
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
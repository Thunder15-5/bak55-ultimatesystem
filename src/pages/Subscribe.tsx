import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { SubscriptionPlanCard } from "@/components/SubscriptionPlanCard";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Subscribe() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPlans();
    fetchCurrentSubscription();
  }, [user]);

  useEffect(() => {
    if (userRole && userRole !== 'artist' && userRole !== 'admin') {
      navigate('/dashboard');
      toast.error('Subscriptions are only for artist accounts. Upgrade to Artist to unlock Pro features!');
    }
  }, [userRole, navigate]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .eq('target_role', 'artist')  // Only show artist plans
      .order('price_bak', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  const fetchCurrentSubscription = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!error && data) {
      setCurrentSubscription(data);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      navigate('/login');
      return;
    }

    setSubscribing(true);

    try {
      const { data, error } = await supabase.functions.invoke('subscribe-plan', {
        body: {
          plan_id: planId,
          payment_method: 'bakcoins',
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message || 'Subscription activated!');
        navigate('/subscription/success');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to process subscription');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 mt-20">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock unlimited uploads and exclusive features to grow your music career
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
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <SubscriptionPlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={currentSubscription?.plan_id === plan.id}
                onSubscribe={handleSubscribe}
                loading={subscribing}
              />
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do BAKCoins work?</AccordionTrigger>
                <AccordionContent>
                  BAKCoins are our platform currency. You can buy them via M-Pesa ($0.20 = 1 BAK) and use them for subscriptions, competition entries, and tipping artists. They're stored in your wallet and can be withdrawn anytime.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Can I cancel my subscription?</AccordionTrigger>
                <AccordionContent>
                  Yes! You can cancel anytime from your subscription management page. You'll keep access until the end of your billing period. No refunds are provided for partial months.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>What happens if my subscription expires?</AccordionTrigger>
                <AccordionContent>
                  Your uploaded tracks remain live, but you won't be able to upload new tracks until you renew. Your analytics and other Pro/Premium features will also be paused.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Can I upgrade from Pro to Premium?</AccordionTrigger>
                <AccordionContent>
                  Yes! Contact support and we'll help you upgrade with a prorated credit for your remaining Pro subscription time.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>How fast is track moderation?</AccordionTrigger>
                <AccordionContent>
                  Free tier: Up to 72 hours. Pro: Within 24 hours. Premium: Within 12 hours (priority queue).
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}
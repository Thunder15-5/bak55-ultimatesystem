import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Crown, Calendar, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";

export default function SubscriptionManage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSubscription();
    fetchTransactions();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
    } else {
      setSubscription(data);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('subscription_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data || []);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    const confirmed = confirm('Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.');
    
    if (!confirmed) return;

    const { error } = await supabase
      .from('user_subscriptions')
      .update({ auto_renew: false })
      .eq('id', subscription.id);

    if (error) {
      toast.error('Failed to cancel subscription');
    } else {
      toast.success('Subscription will not auto-renew');
      fetchSubscription();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 py-12 mt-20">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-bold">No Active Subscription</h1>
            <p className="text-muted-foreground">
              You don't have an active subscription. Subscribe now to unlock unlimited uploads!
            </p>
            <Button onClick={() => navigate('/subscribe')} size="lg">
              View Plans
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const daysUntilExpiry = Math.ceil(
    (new Date(subscription.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 mt-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Subscription</h1>
            <p className="text-muted-foreground">View and manage your subscription details</p>
          </div>

          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {subscription.subscription_plans.name === 'Artist Premium' && <Crown className="w-5 h-5 text-primary" />}
                    Current Plan
                  </CardTitle>
                  <CardDescription>Your active subscription details</CardDescription>
                </div>
                <SubscriptionBadge planName={subscription.subscription_plans.name} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Started
                  </div>
                  <p className="font-medium">
                    {new Date(subscription.started_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Renews
                  </div>
                  <p className="font-medium">
                    {new Date(subscription.expires_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {daysUntilExpiry} days remaining
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="w-4 h-4" />
                    Payment Method
                  </div>
                  <p className="font-medium capitalize">
                    {subscription.payment_method}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Status
                  </div>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold">Features Included</h3>
                <ul className="grid md:grid-cols-2 gap-2">
                  {subscription.subscription_plans.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-6 flex gap-4">
                <Button variant="outline" onClick={() => navigate('/subscribe')}>
                  Change Plan
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelSubscription}
                  disabled={subscription.payment_method === 'promotional'}
                >
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your recent subscription payments</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No payment history yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">
                          {tx.amount} {tx.currency}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                        {tx.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
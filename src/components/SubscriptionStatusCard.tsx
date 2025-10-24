import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Crown, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function SubscriptionStatusCard() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    setSubscription(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-20 bg-muted/20 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Upgrade to Pro
          </CardTitle>
          <CardDescription>
            You're on the free tier. Upgrade for unlimited uploads!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/subscribe">
            <Button className="w-full">
              View Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const daysLeft = Math.ceil(
    (new Date(subscription.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const isPremium = subscription.subscription_plans.name === 'Artist Premium';

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isPremium ? (
              <Crown className="w-5 h-5 text-primary" />
            ) : (
              <Sparkles className="w-5 h-5 text-primary" />
            )}
            {subscription.subscription_plans.name}
          </CardTitle>
          <Badge variant="default">Active</Badge>
        </div>
        <CardDescription>Your subscription is active</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Renews: {new Date(subscription.expires_at).toLocaleDateString()}</span>
        </div>
        
        {daysLeft <= 7 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⏰ {daysLeft} days remaining
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Link to="/subscription/manage" className="flex-1">
            <Button variant="outline" className="w-full">
              Manage
            </Button>
          </Link>
          <Link to="/subscribe" className="flex-1">
            <Button variant="outline" className="w-full">
              Upgrade
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
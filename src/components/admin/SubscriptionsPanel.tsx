import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Crown, Sparkles, TrendingUp, DollarSign, Users, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  payment_method: string;
  profiles: {
    username: string;
    email: string;
  };
  subscription_plans: {
    name: string;
    price_bak: number;
  };
}

export function SubscriptionsPanel() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [metrics, setMetrics] = useState({
    totalActive: 0,
    totalRevenue: 0,
    proCount: 0,
    premiumCount: 0,
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchMetrics();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*, profiles(username, email), subscription_plans(name, price_bak)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } else {
      setSubscriptions(data || []);
    }
    setLoading(false);
  };

  const fetchMetrics = async () => {
    // Active subscriptions
    const { count: activeCount } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    // Revenue from subscription transactions
    const { data: transactions } = await supabase
      .from('subscription_transactions')
      .select('amount')
      .eq('status', 'completed');

    const totalRevenue = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

    // Pro and Premium counts
    const { data: subs } = await supabase
      .from('user_subscriptions')
      .select('subscription_plans(name)')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    const proCount = subs?.filter(s => s.subscription_plans?.name === 'Artist Pro').length || 0;
    const premiumCount = subs?.filter(s => s.subscription_plans?.name === 'Artist Premium').length || 0;

    setMetrics({
      totalActive: activeCount || 0,
      totalRevenue,
      proCount,
      premiumCount,
    });
  };

  const handleExtendSubscription = async (subscriptionId: string) => {
    const confirmed = confirm('Extend this subscription by 30 days?');
    if (!confirmed) return;

    const subscription = subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) return;

    const newExpiryDate = new Date(subscription.expires_at);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);

    const { error } = await supabase
      .from('user_subscriptions')
      .update({ expires_at: newExpiryDate.toISOString() })
      .eq('id', subscriptionId);

    if (error) {
      toast.error('Failed to extend subscription');
    } else {
      toast.success('Subscription extended by 30 days');
      fetchSubscriptions();
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    const confirmed = confirm('Cancel this subscription? User will lose access at end of billing period.');
    if (!confirmed) return;

    const { error } = await supabase
      .from('user_subscriptions')
      .update({ status: 'canceled', auto_renew: false })
      .eq('id', subscriptionId);

    if (error) {
      toast.error('Failed to cancel subscription');
    } else {
      toast.success('Subscription canceled');
      fetchSubscriptions();
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.profiles.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isActive = (sub: Subscription) => 
    sub.status === 'active' && new Date(sub.expires_at) > new Date();

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalActive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (BAK)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pro Subscribers</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.proCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Subscribers</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.premiumCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>Manage user subscriptions and billing</CardDescription>
          <Input
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading subscriptions...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sub.profiles.username}</div>
                            <div className="text-sm text-muted-foreground">{sub.profiles.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {sub.subscription_plans.name === 'Artist Premium' && <Crown className="w-4 h-4 text-primary" />}
                            {sub.subscription_plans.name === 'Artist Pro' && <Sparkles className="w-4 h-4 text-primary" />}
                            <span>{sub.subscription_plans.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActive(sub) ? 'default' : 'secondary'}>
                            {isActive(sub) ? 'Active' : sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(sub.started_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <div>{new Date(sub.expires_at).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.ceil((new Date(sub.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{sub.payment_method}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {isActive(sub) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExtendSubscription(sub.id)}
                                >
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Extend
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancelSubscription(sub.id)}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
// frontend/app/artist/subscription/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSubscriptionStore } from '@/store/subscription-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Zap, 
  Users, 
  TrendingUp, 
  Shield,
  Clock,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatBAKCoins, formatCurrency, cn } from '@/lib/utils';
import { SubscriptionStatus, BillingCycle } from '@/types/subscription';

export default function SubscriptionPage() {
  const {
    currentSubscription,
    billingHistory,
    plans,
    fetchCurrentSubscription,
    fetchBillingHistory,
    cancelSubscription,
    resumeSubscription,
    changeBillingCycle,
    getRemainingLimits,
    isLoading
  } = useSubscriptionStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchCurrentSubscription();
    fetchBillingHistory();
  }, [fetchCurrentSubscription, fetchBillingHistory]);

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      await cancelSubscription(true); // Cancel at period end
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResumeSubscription = async () => {
    await resumeSubscription();
  };

  const handleBillingCycleChange = async (cycle: string) => {
    await changeBillingCycle(cycle);
  };

  if (isLoading && !currentSubscription) {
    return <SubscriptionSkeleton />;
  }

  if (!currentSubscription) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="container mx-auto px-6">
          <Card variant="glass" className="text-center p-12 backdrop-blur-xl">
            <CardContent>
              <Crown className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Active Subscription</h2>
              <p className="text-gray-400 mb-6">
                Upgrade to a paid plan to unlock premium features and lower platform fees
              </p>
              <Button asChild size="lg">
                <a href="/pricing">View Plans</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === currentSubscription.planId);
  const remainingLimits = getRemainingLimits();
  const isCancelled = currentSubscription.status === SubscriptionStatus.CANCELLED;
  const isTrial = currentSubscription.status === SubscriptionStatus.TRIALING;

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                Subscription <span className="gradient-text">Management</span>
              </h1>
              <p className="text-xl text-gray-400">
                Manage your plan, billing, and premium features
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge 
                variant={isCancelled ? "danger" : isTrial ? "warning" : "success"}
                className="text-sm py-2 px-4"
              >
                {isCancelled && <XCircle className="h-4 w-4 mr-1" />}
                {isTrial && <Clock className="h-4 w-4 mr-1" />}
                {!isCancelled && !isTrial && <CheckCircle className="h-4 w-4 mr-1" />}
                {currentSubscription.status.toLowerCase().replace('_', ' ')}
              </Badge>

              {isTrial && currentSubscription.trialEndsAt && (
                <Badge variant="outline" className="text-sm py-2 px-4">
                  <Clock className="h-4 w-4 mr-1" />
                  Trial ends {new Date(currentSubscription.trialEndsAt).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Tab Navigation */}
          <TabsList className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-1 bg-dark-800/50 rounded-2xl backdrop-blur-xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2"
              >
                <CurrentPlanCard 
                  subscription={currentSubscription}
                  plan={currentPlan!}
                  onCancel={handleCancelSubscription}
                  onResume={handleResumeSubscription}
                  onBillingCycleChange={handleBillingCycleChange}
                  isCancelling={isCancelling}
                />
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                <StatCard
                  icon={<TrendingUp className="h-6 w-6 text-green-500" />}
                  title="Platform Fee"
                  value={`${currentPlan?.platformFee}%`}
                  description="From your earnings"
                  trend="down"
                />
                <StatCard
                  icon={<Shield className="h-6 w-6 text-blue-500" />}
                  title="AI Analysis"
                  value={currentPlan?.limits.aiAnalysis || 'Limited'}
                  description="Quality level"
                />
                <StatCard
                  icon={<Zap className="h-6 w-6 text-yellow-500" />}
                  title="Support"
                  value={currentPlan?.limits.supportLevel || 'Basic'}
                  description="Response time"
                />
              </motion.div>
            </div>

            {/* Limits Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <LimitsOverview 
                subscription={currentSubscription}
                plan={currentPlan!}
                remainingLimits={remainingLimits}
              />
            </motion.div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <BillingTab 
              subscription={currentSubscription}
              billingHistory={billingHistory}
            />
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage">
            <UsageTab subscription={currentSubscription} />
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <FeaturesTab plan={currentPlan!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Current Plan Card Component
function CurrentPlanCard({
  subscription,
  plan,
  onCancel,
  onResume,
  onBillingCycleChange,
  isCancelling
}: {
  subscription: any;
  plan: any;
  onCancel: () => void;
  onResume: () => void;
  onBillingCycleChange: (cycle: string) => void;
  isCancelling: boolean;
}) {
  const isCancelled = subscription.status === SubscriptionStatus.CANCELLED;
  const isTrial = subscription.status === SubscriptionStatus.TRIALING;
  const price = subscription.billingCycle === BillingCycle.MONTHLY ? plan.pricing.monthly : plan.pricing.yearly;

  return (
    <Card variant="premium" glow className="backdrop-blur-xl h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-yellow-500" />
          {plan.name}
          <Badge variant="outline" className="ml-2">
            {subscription.billingCycle.toLowerCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          {plan.type === 'ARTIST_ELITE' && 'Maximum exposure with minimum platform fees'}
          {plan.type === 'ARTIST_PRO' && 'Professional tools for growing artists'}
          {plan.type === 'FAN_PREMIUM' && 'Enhanced listening experience'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {plan.type === 'FREE' ? 'Free' : formatBAKCoins(price)}
          </span>
          <span className="text-gray-400">
            /{subscription.billingCycle === BillingCycle.MONTHLY ? 'month' : 'year'}
          </span>
        </div>

        {/* Next Billing */}
        {!isCancelled && (
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">Next billing:</span>
            <span className="text-white">
              {subscription.nextBillingDate 
                ? new Date(subscription.nextBillingDate).toLocaleDateString()
                : 'N/A'
              }
            </span>
          </div>
        )}

        {/* Cancellation Notice */}
        {subscription.cancelAtPeriodEnd && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-semibold text-yellow-500">Subscription Cancelled</div>
                <div className="text-yellow-400 text-sm">
                  Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trial Notice */}
        {isTrial && subscription.trialEndsAt && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-semibold text-blue-500">Free Trial Active</div>
                <div className="text-blue-400 text-sm">
                  {Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {!isCancelled ? (
            <>
              <Button 
                variant="outline"
                onClick={onCancel}
                disabled={isCancelling}
                isLoading={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
              
              <Button asChild>
                <a href="/pricing">Change Plan</a>
              </Button>

              {/* Billing Cycle Toggle */}
              {plan.type !== 'FREE' && (
                <Button
                  variant="ghost"
                  onClick={() => onBillingCycleChange(
                    subscription.billingCycle === BillingCycle.MONTHLY 
                      ? BillingCycle.YEARLY 
                      : BillingCycle.MONTHLY
                  )}
                >
                  Switch to {subscription.billingCycle === BillingCycle.MONTHLY ? 'Yearly' : 'Monthly'}
                </Button>
              )}
            </>
          ) : (
            <Button onClick={onResume}>
              Resume Subscription
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Additional components would be implemented similarly...
// StatCard, LimitsOverview, BillingTab, UsageTab, FeaturesTab, SubscriptionSkeleton

function StatCard({ icon, title, value, description, trend }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  trend?: 'up' | 'down';
}) {
  return (
    <Card variant="glass" className="backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-dark-700">
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-400">{title}</div>
            <div className="text-lg font-semibold text-white">{value}</div>
            <div className="text-xs text-gray-400">{description}</div>
          </div>
          {trend && (
            <div className={cn(
              "p-1 rounded",
              trend === 'up' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
            )}>
              {trend === 'up' ? '↗' : '↘'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="min-h-screen bg-dark-900 py-8 animate-pulse">
      <div className="container mx-auto px-6 space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-12 bg-dark-700 rounded w-1/3"></div>
          <div className="h-6 bg-dark-700 rounded w-1/2"></div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-dark-700 rounded-xl"></div>
          <div className="space-y-6">
            <div className="h-24 bg-dark-700 rounded-xl"></div>
            <div className="h-24 bg-dark-700 rounded-xl"></div>
            <div className="h-24 bg-dark-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

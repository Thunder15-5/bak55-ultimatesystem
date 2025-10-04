// frontend/app/pricing/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscriptionStore } from '@/store/subscription-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, 
  Star, 
  Crown, 
  Zap, 
  Users, 
  TrendingUp, 
  Shield,
  Rocket,
  Target,
  Award,
  Clock
} from 'lucide-react';
import { formatBAKCoins, cn } from '@/lib/utils';
import { SubscriptionPlan, BillingCycle } from '@/types/subscription';

export default function PricingPage() {
  const {
    plans,
    currentSubscription,
    fetchPlans,
    subscribeToPlan,
    upgradePlan,
    isLoading,
    calculateSavings
  } = useSubscriptionStore();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSubscribe = async (planId: string) => {
    if (!currentSubscription) {
      // New subscription
      await subscribeToPlan(planId, billingCycle);
    } else if (currentSubscription.planId !== planId) {
      // Upgrade/downgrade
      setIsSwitching(true);
      try {
        await upgradePlan(planId);
      } finally {
        setIsSwitching(false);
      }
    }
    // If same plan, do nothing
  };

  const getCurrentPlan = () => {
    if (!currentSubscription) return null;
    return plans.find(p => p.id === currentSubscription.planId);
  };

  const sortedPlans = plans.sort((a, b) => a.tier - b.tier);
  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Choose Your <span className="gradient-text">Growth Path</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Scale your music career with powerful tools, lower platform fees, and exclusive features. 
            Join thousands of African artists building their legacy on BAK55.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Tabs 
              value={billingCycle} 
              onValueChange={(value) => setBillingCycle(value as BillingCycle)}
              className="w-auto"
            >
              <TabsList className="grid w-full grid-cols-2 bg-dark-800/50 p-1 rounded-2xl backdrop-blur-xl">
                <TabsTrigger 
                  value={BillingCycle.MONTHLY}
                  className="rounded-xl data-[state=active]:bg-primary-500 data-[state=active]:text-white"
                >
                  Monthly
                </TabsTrigger>
                <TabsTrigger 
                  value={BillingCycle.YEARLY}
                  className="rounded-xl data-[state=active]:bg-primary-500 data-[state=active]:text-white"
                >
                  Yearly <span className="ml-2 text-green-500">Save up to 20%</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto"
        >
          {sortedPlans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              currentPlan={currentPlan}
              isPopular={plan.isPopular}
              onSelect={handleSubscribe}
              isLoading={isLoading && selectedPlan === plan.id}
              index={index}
            />
          ))}
        </motion.div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20"
        >
          <FeatureComparison plans={sortedPlans} currentPlan={currentPlan} />
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <FAQSection />
        </motion.div>
      </div>
    </div>
  );
}

// Pricing Card Component
function PricingCard({ 
  plan, 
  billingCycle, 
  currentPlan, 
  isPopular, 
  onSelect, 
  isLoading,
  index 
}: {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  currentPlan: SubscriptionPlan | null;
  isPopular?: boolean;
  onSelect: (planId: string) => void;
  isLoading: boolean;
  index: number;
}) {
  const price = billingCycle === BillingCycle.MONTHLY ? plan.pricing.monthly : plan.pricing.yearly;
  const isCurrentPlan = currentPlan?.id === plan.id;
  const savings = billingCycle === BillingCycle.YEARLY ? plan.pricing.savings : 0;

  const getPlanColor = (type: string) => {
    switch (type) {
      case 'FREE': return 'from-gray-500 to-gray-600';
      case 'ARTIST_PRO': return 'from-primary-500 to-purple-600';
      case 'ARTIST_ELITE': return 'from-yellow-500 to-orange-500';
      case 'FAN_PREMIUM': return 'from-green-500 to-emerald-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'FREE': return <Users className="h-6 w-6" />;
      case 'ARTIST_PRO': return <Zap className="h-6 w-6" />;
      case 'ARTIST_ELITE': return <Crown className="h-6 w-6" />;
      case 'FAN_PREMIUM': return <Star className="h-6 w-6" />;
      default: return <Rocket className="h-6 w-6" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge variant="primary" className="flex items-center gap-1 px-4 py-2">
            <TrendingUp className="h-4 w-4" />
            Most Popular
          </Badge>
        </div>
      )}

      <Card 
        variant={isPopular ? "premium" : "glass"} 
        glow={isPopular}
        className={cn(
          "h-full backdrop-blur-xl transition-all duration-300",
          isPopular && "border-primary-500/30 scale-105",
          isCurrentPlan && "ring-2 ring-primary-500"
        )}
      >
        <CardHeader className={cn(
          "pb-4 border-b",
          isPopular ? "border-primary-500/20" : "border-gray-700"
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-r",
              getPlanColor(plan.type)
            )}>
              {getPlanIcon(plan.type)}
            </div>
            {isCurrentPlan && (
              <Badge variant="outline" className="text-green-500 border-green-500">
                Current Plan
              </Badge>
            )}
          </div>

          <CardTitle className="text-2xl flex items-center gap-2">
            {plan.name}
            {plan.recommended && <Target className="h-5 w-5 text-yellow-500" />}
          </CardTitle>
          
          <CardDescription className="text-gray-300 text-lg">
            {plan.type === 'FREE' && 'Perfect for getting started'}
            {plan.type === 'ARTIST_PRO' && 'For serious artists building their career'}
            {plan.type === 'ARTIST_ELITE' && 'Maximum exposure and minimum fees'}
            {plan.type === 'FAN_PREMIUM' && 'Ultimate fan experience'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Pricing */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-white">
                {plan.type === 'FREE' ? 'Free' : formatBAKCoins(price)}
              </span>
              {plan.type !== 'FREE' && (
                <span className="text-gray-400">
                  /{billingCycle === BillingCycle.MONTHLY ? 'month' : 'year'}
                </span>
              )}
            </div>
            
            {savings && savings > 0 && (
              <div className="text-green-500 text-sm font-semibold">
                Save {savings}% with yearly billing
              </div>
            )}

            {/* Platform Fee */}
            {plan.type !== 'FREE' && (
              <div className="text-sm text-gray-400 mt-2">
                Platform fee: {plan.platformFee}%
              </div>
            )}
          </div>

          {/* Key Features */}
          <div className="space-y-3 mb-6">
            {plan.benefits.slice(0, 3).map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Limits */}
          <div className="bg-dark-800/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Tracks</span>
              <span className="text-white">{plan.limits.maxTracks}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Upload Size</span>
              <span className="text-white">{plan.limits.maxUploadSize}MB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">AI Analysis</span>
              <span className="text-white capitalize">{plan.limits.aiAnalysis.toLowerCase()}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={() => onSelect(plan.id)}
            disabled={isLoading || isCurrentPlan}
            isLoading={isLoading}
            variant={isPopular ? "primary" : "outline"}
            size="lg"
            className="w-full"
          >
            {isCurrentPlan ? 'Current Plan' : 
             plan.type === 'FREE' ? 'Get Started' : 'Upgrade Now'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Feature Comparison Table
function FeatureComparison({ plans, currentPlan }: { plans: SubscriptionPlan[], currentPlan: SubscriptionPlan | null }) {
  const features = [
    { id: 'platform_fee', name: 'Platform Fee', category: 'REVENUE' },
    { id: 'ai_analysis', name: 'AI Talent Analysis', category: 'AI' },
    { id: 'advanced_analytics', name: 'Advanced Analytics', category: 'ANALYTICS' },
    { id: 'priority_support', name: 'Priority Support', category: 'SUPPORT' },
    { id: 'promotion_credits', name: 'Promotion Credits', category: 'PROMOTION' },
    { id: 'custom_domains', name: 'Custom Domains', category: 'TOOLS' },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-12">Compare Plans</h2>
      
      <div className="bg-dark-800/30 rounded-2xl backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border-b border-gray-700">
          <div className="p-6 lg:p-8 bg-dark-900/50">
            <h3 className="font-semibold text-white">Features</h3>
          </div>
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={cn(
                "p-6 lg:p-8 text-center border-l border-gray-700",
                currentPlan?.id === plan.id && "bg-primary-500/10"
              )}
            >
              <div className="font-bold text-white mb-2">{plan.name}</div>
              <div className="text-sm text-gray-400">
                {plan.type === 'FREE' ? 'Free' : formatBAKCoins(plan.pricing.monthly)}/mo
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        {features.map((feature, index) => (
          <div 
            key={feature.id}
            className={cn(
              "grid grid-cols-1 lg:grid-cols-5 gap-0 border-b border-gray-700",
              index % 2 === 0 && "bg-dark-800/20"
            )}
          >
            <div className="p-4 lg:p-6">
              <div className="font-medium text-white">{feature.name}</div>
            </div>
            
            {plans.map((plan) => {
              const planFeature = plan.features.find(f => f.id === feature.id);
              const isEnabled = planFeature?.enabled ?? false;
              const value = planFeature?.limit ?? (isEnabled ? 'Yes' : 'No');
              
              return (
                <div 
                  key={plan.id}
                  className="p-4 lg:p-6 text-center border-l border-gray-700 flex items-center justify-center"
                >
                  {typeof value === 'number' ? (
                    <span className="font-semibold text-white">{value}</span>
                  ) : (
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      isEnabled 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-600 text-gray-400"
                    )}>
                      {isEnabled ? <Check className="h-4 w-4" /> : '×'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQ Section
function FAQSection() {
  const faqs = [
    {
      question: "Can I change my plan at any time?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept BAKCoins, credit/debit cards, mobile money (M-Pesa, Airtel Money), and bank transfers for subscription payments."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! All paid plans come with a 14-day free trial. You can cancel anytime during the trial period without being charged."
    },
    {
      question: "How do platform fees work?",
      answer: "Platform fees are deducted from your earnings. Free plan has 15% fee, Artist Pro has 10%, and Artist Elite has only 5%. Lower fees mean you keep more of your earnings."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel anytime. If you cancel, you'll retain access to premium features until the end of your current billing period."
    }
  ];

  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{ backgroundColor: openItems.includes(index) ? 'rgba(255,255,255,0.05)' : 'transparent' }}
            className="rounded-xl border border-gray-700 overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="font-semibold text-white text-lg">{faq.question}</span>
              <motion.div
                animate={{ rotate: openItems.includes(index) ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {openItems.includes(index) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 text-gray-300">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Helper icon component
function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

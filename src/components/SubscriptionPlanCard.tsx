import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";

interface SubscriptionPlanCardProps {
  plan: {
    id: string;
    name: string;
    price_bak: number;
    price_kes: number;
    price_usd?: number;
    features: string[];
    upload_limit: number | null;
  };
  isCurrentPlan?: boolean;
  onSubscribe: (planId: string) => void;
  loading?: boolean;
}

export function SubscriptionPlanCard({ plan, isCurrentPlan, onSubscribe, loading }: SubscriptionPlanCardProps) {
  const isPremium = plan.name === 'Artist Premium';
  const isPro = plan.name === 'Artist Pro';
  const isFree = plan.name === 'Artist Free';
  const { formatFromKES } = useCurrency();

  return (
    <Card className={`relative ${isPremium ? 'border-primary shadow-lg' : ''}`}>
      {isPremium && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-primary to-primary/80">
            <Crown className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isPremium && <Crown className="w-5 h-5 text-primary" />}
            {isPro && <Sparkles className="w-5 h-5 text-primary" />}
            {plan.name}
          </CardTitle>
          {isCurrentPlan && (
            <Badge variant="secondary">Current</Badge>
          )}
        </div>
        <CardDescription>
          {isFree && "Perfect to get started"}
          {isPro && "For serious artists"}
          {isPremium && "Maximum exposure & benefits"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{formatFromKES(plan.price_kes)}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            or {plan.price_bak} BAK/month
          </p>
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isFree ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Active Subscription
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isPremium ? "default" : "outline"}
            onClick={() => onSubscribe(plan.id)}
            disabled={loading}
          >
            {loading ? "Processing..." : "Subscribe Now"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
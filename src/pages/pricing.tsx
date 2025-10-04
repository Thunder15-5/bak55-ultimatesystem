import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: ['Basic profile', 'Browse competitions', 'Limited submissions', 'Community access'],
    },
    {
      name: 'Artist Pro',
      price: '$9.99',
      features: ['Unlimited submissions', 'Priority support', 'Analytics dashboard', 'Exclusive competitions'],
    },
    {
      name: 'Brand',
      price: '$99',
      features: ['Create competitions', 'AI talent matching', 'Campaign analytics', 'Dedicated support'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">Select the perfect plan for your needs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className="p-8 space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold text-primary">{plan.price}<span className="text-lg text-muted-foreground">/mo</span></p>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full">Get Started</Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

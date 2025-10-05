import { Button } from '@/components/ui/button';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/forever',
      description: 'Perfect to get started',
      features: ['Basic profile', 'Browse competitions', 'Limited submissions', 'Community access'],
      icon: Star,
      color: 'dark',
      popular: false,
    },
    {
      name: 'Artist Pro',
      price: '$9.99',
      period: '/mo',
      description: 'For serious artists',
      features: ['Unlimited submissions', 'Priority support', 'Analytics dashboard', 'Exclusive competitions', 'AI talent score', 'Featured profile'],
      icon: Zap,
      color: 'primary',
      popular: true,
    },
    {
      name: 'Brand',
      price: '$99',
      period: '/mo',
      description: 'For brands & agencies',
      features: ['Create competitions', 'AI talent matching', 'Campaign analytics', 'Dedicated support', 'Custom branding', 'Priority listing'],
      icon: Crown,
      color: 'accent',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">Choose Your Plan</span>
          </h1>
          <p className="text-xl text-dark-200 max-w-2xl mx-auto">
            Select the perfect plan for your needs and unlock your potential
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                  plan.popular
                    ? 'glass border-primary-500 shadow-2xl shadow-primary-500/30'
                    : 'glass border-dark-600 hover:border-primary-500/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-bold shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                      plan.color === 'primary' ? 'bg-primary-500/20' :
                      plan.color === 'accent' ? 'bg-accent-500/20' :
                      'bg-dark-700'
                    }`}>
                      <Icon className={`h-7 w-7 ${
                        plan.color === 'primary' ? 'text-primary-400' :
                        plan.color === 'accent' ? 'text-accent-400' :
                        'text-dark-300'
                      }`} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-dark-300 text-sm">{plan.description}</p>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-5xl font-bold ${
                        plan.popular ? 'gradient-text' : 'text-white'
                      }`}>
                        {plan.price}
                      </span>
                      <span className="text-dark-300 text-lg">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={`mt-0.5 ${
                          plan.popular ? 'text-primary-400' : 'text-secondary-400'
                        }`}>
                          <Check className="h-5 w-5" />
                        </div>
                        <span className="text-dark-100 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg shadow-primary-500/30'
                        : 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600'
                    }`}
                    asChild
                  >
                    <Link to="/register">Get Started</Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-dark-300">
            Need a custom plan?{' '}
            <a href="#contact" className="text-primary-400 hover:text-primary-300 font-medium underline">
              Contact us
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

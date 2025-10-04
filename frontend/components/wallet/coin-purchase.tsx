// frontend/components/wallet/coin-purchase.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletStore } from '@/store/wallet-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, CreditCard, Smartphone, Building, Zap, Check, AlertCircle } from 'lucide-react';
import { formatBAKCoins, formatCurrency, cn } from '@/lib/utils';
import { PaymentMethod, PaymentGateway } from '@/types/wallet';

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];

export function CoinPurchase() {
  const {
    purchaseCoins,
    paymentMethods,
    fetchPaymentMethods,
    calculateFees,
    getExchangeRate,
    isLoading
  } = useWalletStore();

  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // Calculate fees and totals
  const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const fees = calculateFees(amount, 'DEPOSIT');
  const exchangeRate = getExchangeRate('KES', 'BAK');
  const estimatedCoins = Math.floor(fees.netAmount * exchangeRate);

  const paymentOptions = [
    {
      type: 'CARD' as const,
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Instant processing with PayStack',
      supported: true
    },
    {
      type: 'MOBILE_MONEY' as const,
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'M-Pesa, Airtel Money, and more',
      supported: true
    },
    {
      type: 'BANK_TRANSFER' as const,
      name: 'Bank Transfer',
      icon: Building,
      description: 'Direct bank transfer',
      supported: true
    }
  ];

  const handlePurchase = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    if (amount < 100) {
      setError('Minimum purchase amount is 100 KES');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await purchaseCoins(estimatedCoins, selectedMethod.id, 'KES');
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setSuccess(false);
        setSelectedAmount(1000);
        setCustomAmount('');
      }, 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Card variant="glass" className="backdrop-blur-xl">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Purchase Successful!</h3>
            <p className="text-gray-400 mb-6">
              {formatBAKCoins(estimatedCoins)} have been added to your wallet
            </p>
            <Button onClick={() => setSuccess(false)} variant="outline">
              Make Another Purchase
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Amount Selection */}
      <Card variant="glass" className="backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-yellow-500" />
            Select Amount
          </CardTitle>
          <CardDescription>
            Choose how many BAKCoins you want to purchase
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Amounts */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <motion.button
                key={quickAmount}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedAmount(quickAmount);
                  setCustomAmount('');
                }}
                className={cn(
                  "p-4 rounded-xl border-2 text-center transition-all",
                  (customAmount ? false : selectedAmount === quickAmount)
                    ? "border-primary-500 bg-primary-500/20 text-primary-500"
                    : "border-dark-600 bg-dark-800/50 text-gray-400 hover:border-primary-500/50 hover:text-white"
                )}
              >
                <div className="text-lg font-semibold">{formatCurrency(quickAmount, 'KES')}</div>
                <div className="text-sm opacity-75">
                  {formatBAKCoins(Math.floor(quickAmount * exchangeRate))}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Or enter custom amount</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="Enter amount in KES"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(0);
                }}
                className="pr-20 text-lg bg-dark-800/50 border-dark-600"
                min="100"
                step="100"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                KES
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-dark-800/30 rounded-lg p-4 space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white">{formatCurrency(amount, 'KES')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Processing Fee ({fees.processingFee / amount * 100}%):</span>
              <span className="text-red-500">-{formatCurrency(fees.processingFee, 'KES')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Exchange Rate:</span>
              <span className="text-white">1 KES = {exchangeRate} BAK</span>
            </div>
            <div className="border-t border-gray-700 pt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-300">You'll receive:</span>
                <span className="text-yellow-500 text-lg">
                  {formatBAKCoins(estimatedCoins)}
                </span>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card variant="glass" className="backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Choose how you want to pay
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {paymentOptions.map((option) => (
            <motion.button
              key={option.type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMethod({
                id: option.type,
                userId: '',
                type: option.type,
                provider: 'PAYSTACK',
                details: {},
                isDefault: false,
                isVerified: true,
                createdAt: new Date()
              })}
              disabled={!option.supported}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all",
                selectedMethod?.type === option.type
                  ? "border-primary-500 bg-primary-500/20"
                  : "border-dark-600 bg-dark-800/50 hover:border-primary-500/50",
                !option.supported && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  selectedMethod?.type === option.type
                    ? "bg-primary-500/20"
                    : "bg-dark-700"
                )}>
                  <option.icon className={cn(
                    "h-6 w-6",
                    selectedMethod?.type === option.type
                      ? "text-primary-500"
                      : "text-gray-400"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-semibold",
                      selectedMethod?.type === option.type
                        ? "text-primary-500"
                        : "text-white"
                    )}>
                      {option.name}
                    </span>
                    {option.supported && (
                      <Badge variant="outline" className="text-xs">
                        Available
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {option.description}
                  </p>
                </div>
                {selectedMethod?.type === option.type && (
                  <Check className="h-5 w-5 text-primary-500" />
                )}
              </div>
            </motion.button>
          ))}
        </CardContent>
      </Card>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-500 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={handlePurchase}
          disabled={!selectedMethod || amount < 100 || isProcessing || isLoading}
          isLoading={isProcessing}
          size="lg"
          className="w-full h-14 text-lg"
        >
          {isProcessing ? (
            'Processing...'
          ) : (
            <>
              <Zap className="h-5 w-5 mr-2" />
              Purchase {formatBAKCoins(estimatedCoins)} for {formatCurrency(amount, 'KES')}
            </>
          )}
        </Button>
        
        <p className="text-center text-sm text-gray-400 mt-3">
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>

      {/* Security Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-6 text-sm text-gray-400"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-500" />
          <span>SSL Secured</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" />
          <span>Instant Processing</span>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span>No Hidden Fees</span>
        </div>
      </motion.div>
    </div>
  );
}

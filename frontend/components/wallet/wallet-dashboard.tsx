// frontend/components/wallet/wallet-dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletStore } from '@/store/wallet-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, TrendingDown, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { formatBAKCoins, formatCurrency, cn } from '@/lib/utils';
import { TransactionType, TransactionStatus, KYCStatus } from '@/types/wallet';
import Link from 'next/link';

export function WalletDashboard() {
  const { 
    wallet, 
    transactions, 
    liveBalance, 
    fetchWallet, 
    fetchTransactions,
    refreshBalance,
    isLoading 
  } = useWalletStore();
  
  const [showBalance, setShowBalance] = useState(true);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  // Calculate quick stats
  const recentTransactions = transactions.slice(0, 5);
  const totalEarned = wallet?.totalEarned || 0;
  const totalSpent = wallet?.totalSpent || 0;
  const netFlow = totalEarned - totalSpent;

  const pendingWithdrawals = transactions.filter(
    t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING
  ).length;

  const getStatusVariant = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED: return 'success';
      case TransactionStatus.PENDING: return 'warning';
      case TransactionStatus.FAILED: return 'error';
      default: return 'outline';
    }
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT: return <TrendingUp className="h-4 w-4 text-green-500" />;
      case TransactionType.WITHDRAWAL: return <TrendingDown className="h-4 w-4 text-red-500" />;
      case TransactionType.TIP: return <Coins className="h-4 w-4 text-yellow-500" />;
      case TransactionType.PRIZE: return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default: return <Coins className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading && !wallet) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-dark-700 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-dark-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="premium" glow className="backdrop-blur-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Coins className="h-8 w-8 text-yellow-500" />
                  BAKCoins Wallet
                </CardTitle>
                <CardDescription>
                  Your digital currency for the BAK55 ecosystem
                </CardDescription>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="flex items-center gap-2"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showBalance ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="text-sm text-gray-400 mb-2">Available Balance</div>
                <div className="text-4xl lg:text-5xl font-bold gradient-text">
                  {showBalance ? formatBAKCoins(liveBalance) : '••••••'}
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  ≈ {showBalance ? formatCurrency(liveBalance * 0.2, 'KES') : '••••••'}
                </div>
              </div>

              <div className="text-right space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Earned: {formatBAKCoins(totalEarned)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-red-500">Spent: {formatBAKCoins(totalSpent)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Button asChild variant="primary" className="h-12">
                <Link href="/wallet/buy-coins">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Buy Coins
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-12">
                <Link href="/wallet/withdraw">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Withdraw
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-12">
                <Link href="/wallet/transfer">
                  <Coins className="h-4 w-4 mr-2" />
                  Transfer
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-12"
                onClick={refreshBalance}
              >
                <Shield className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Net Flow */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Net Flow</div>
                <div className={cn(
                  "text-2xl font-bold",
                  netFlow >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {netFlow >= 0 ? '+' : ''}{formatBAKCoins(netFlow)}
                </div>
              </div>
              <div className={cn(
                "p-2 rounded-lg",
                netFlow >= 0 ? "bg-green-500/20" : "bg-red-500/20"
              )}>
                {netFlow >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-500" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Pending</div>
                <div className="text-2xl font-bold text-yellow-500">
                  {pendingWithdrawals}
                </div>
                <div className="text-xs text-gray-400">Withdrawals</div>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Security</div>
                <div className="text-lg font-bold text-white capitalize">
                  {wallet?.kycStatus?.toLowerCase() || 'pending'}
                </div>
                <div className="text-xs text-gray-400">KYC Status</div>
              </div>
              <div className={cn(
                "p-2 rounded-lg",
                wallet?.kycStatus === KYCStatus.VERIFIED 
                  ? "bg-green-500/20" 
                  : "bg-yellow-500/20"
              )}>
                <Shield className={cn(
                  "h-6 w-6",
                  wallet?.kycStatus === KYCStatus.VERIFIED 
                    ? "text-green-500" 
                    : "text-yellow-500"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Your latest financial activities
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/wallet/transactions">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <AnimatePresence>
              {recentTransactions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <Coins className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No transactions yet</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href="/wallet/buy-coins">
                      Make Your First Purchase
                    </Link>
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg hover:bg-dark-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="font-medium text-white">
                            {transaction.description}
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={cn(
                          "font-semibold",
                          transaction.type === TransactionType.DEPOSIT || 
                          transaction.type === TransactionType.PRIZE
                            ? "text-green-500"
                            : "text-red-500"
                        )}>
                          {transaction.type === TransactionType.DEPOSIT || 
                           transaction.type === TransactionType.PRIZE ? '+' : '-'}
                          {formatBAKCoins(Math.abs(transaction.amount))}
                        </div>
                        <Badge 
                          variant={getStatusVariant(transaction.status)} 
                          className="text-xs capitalize"
                        >
                          {transaction.status.toLowerCase()}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Recommendations */}
      {wallet?.kycStatus !== KYCStatus.VERIFIED && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="outline" className="border-yellow-500/30 bg-yellow-500/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-500 mb-2">
                    Complete Your Verification
                  </h3>
                  <p className="text-yellow-400 text-sm mb-4">
                    Verify your identity to unlock higher transaction limits and full platform features.
                  </p>
                  <Button asChild variant="outline" size="sm" className="border-yellow-500 text-yellow-500">
                    <Link href="/wallet/verify">
                      Start Verification
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

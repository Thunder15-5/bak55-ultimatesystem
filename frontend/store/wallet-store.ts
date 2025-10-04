// frontend/store/wallet-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wallet, Transaction, PaymentMethod, WithdrawalRequest, ExchangeRate } from '@/types/wallet';

interface WalletState {
  // Core State
  wallet: Wallet | null;
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  withdrawalRequests: WithdrawalRequest[];
  exchangeRates: ExchangeRate[];
  isLoading: boolean;
  
  // Real-time Data
  liveBalance: number;
  pendingTransactions: number;
  
  // Actions - Core Operations
  fetchWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  fetchPaymentMethods: () => Promise<void>;
  
  // Financial Operations
  purchaseCoins: (amount: number, paymentMethod: string, currency?: string) => Promise<Transaction>;
  withdrawFunds: (amount: number, paymentMethodId: string, currency?: string) => Promise<WithdrawalRequest>;
  transferCoins: (toUserId: string, amount: number, description: string, relatedId?: string) => Promise<Transaction>;
  tipArtist: (artistId: string, amount: number, trackId?: string, message?: string) => Promise<Transaction>;
  
  // Payment Method Management
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'createdAt'>) => Promise<PaymentMethod>;
  removePaymentMethod: (methodId: string) => Promise<void>;
  setDefaultPaymentMethod: (methodId: string) => Promise<void>;
  
  // Advanced Features
  calculateFees: (amount: number, type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER') => FeeCalculation;
  getExchangeRate: (from: string, to: string) => number;
  validateTransaction: (transaction: Partial<Transaction>) => ValidationResult;
  
  // Security & Compliance
  setSpendingLimit: (dailyLimit: number) => Promise<void>;
  enableTwoFactor: (enabled: boolean) => Promise<void>;
  verifyTransaction: (transactionId: string, pin: string) => Promise<void>;
  
  // Analytics
  getRevenueAnalytics: (period: '7d' | '30d' | '90d' | '1y') => Promise<any>;
  getSpendingPatterns: () => Promise<any>;
}

interface TransactionFilters {
  type?: string;
  status?: string;
  dateRange?: { start: Date; end: Date };
  minAmount?: number;
  maxAmount?: number;
}

interface FeeCalculation {
  amount: number;
  platformFee: number;
  processingFee: number;
  netAmount: number;
  totalFees: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial State
      wallet: null,
      transactions: [],
      paymentMethods: [],
      withdrawalRequests: [],
      exchangeRates: [],
      isLoading: false,
      liveBalance: 0,
      pendingTransactions: 0,

      // Fetch Wallet Data
      fetchWallet: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/wallet');
          if (!response.ok) throw new Error('Failed to fetch wallet');
          
          const walletData = await response.json();
          set({ 
            wallet: walletData,
            liveBalance: walletData.bakCoins,
            isLoading: false 
          });
        } catch (error) {
          console.error('Error fetching wallet:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Refresh Balance (Lightweight)
      refreshBalance: async () => {
        try {
          const response = await fetch('/api/wallet/balance');
          if (!response.ok) throw new Error('Failed to refresh balance');
          
          const { balance } = await response.json();
          set({ liveBalance: balance });
        } catch (error) {
          console.error('Error refreshing balance:', error);
        }
      },

      // Fetch Transactions with Filters
      fetchTransactions: async (filters?: TransactionFilters) => {
        set({ isLoading: true });
        try {
          const queryParams = new URLSearchParams();
          if (filters?.type) queryParams.append('type', filters.type);
          if (filters?.status) queryParams.append('status', filters.status);
          if (filters?.minAmount) queryParams.append('minAmount', filters.minAmount.toString());
          if (filters?.maxAmount) queryParams.append('maxAmount', filters.maxAmount.toString());
          if (filters?.dateRange) {
            queryParams.append('startDate', filters.dateRange.start.toISOString());
            queryParams.append('endDate', filters.dateRange.end.toISOString());
          }

          const response = await fetch(`/api/wallet/transactions?${queryParams}`);
          if (!response.ok) throw new Error('Failed to fetch transactions');
          
          const transactions = await response.json();
          set({ transactions, isLoading: false });
        } catch (error) {
          console.error('Error fetching transactions:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Fetch Payment Methods
      fetchPaymentMethods: async () => {
        try {
          const response = await fetch('/api/wallet/payment-methods');
          if (!response.ok) throw new Error('Failed to fetch payment methods');
          
          const paymentMethods = await response.json();
          set({ paymentMethods });
        } catch (error) {
          console.error('Error fetching payment methods:', error);
          throw error;
        }
      },

      // Purchase BAKCoins
      purchaseCoins: async (amount: number, paymentMethod: string, currency: string = 'KES'): Promise<Transaction> => {
        const { validateTransaction } = get();
        const validation = validateTransaction({
          type: 'DEPOSIT',
          amount,
          currency
        });

        if (!validation.isValid) {
          throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
        }

        try {
          const response = await fetch('/api/wallet/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              paymentMethod,
              currency,
              riskScore: validation.riskLevel
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          const transaction = await response.json();
          
          // Update local state
          set(state => ({
            transactions: [transaction, ...state.transactions],
            liveBalance: state.liveBalance + transaction.netAmount
          }));

          return transaction;
        } catch (error) {
          console.error('Error purchasing coins:', error);
          throw error;
        }
      },

      // Withdraw Funds
      withdrawFunds: async (amount: number, paymentMethodId: string, currency: string = 'KES'): Promise<WithdrawalRequest> => {
        const { wallet, validateTransaction } = get();
        
        if (!wallet || wallet.bakCoins < amount) {
          throw new Error('Insufficient BAKCoins for withdrawal');
        }

        const validation = validateTransaction({
          type: 'WITHDRAWAL',
          amount,
          currency
        });

        if (!validation.isValid) {
          throw new Error(`Withdrawal validation failed: ${validation.errors.join(', ')}`);
        }

        try {
          const response = await fetch('/api/wallet/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              paymentMethodId,
              currency,
              riskScore: validation.riskLevel
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          const withdrawalRequest = await response.json();
          
          // Update local state
          set(state => ({
            withdrawalRequests: [withdrawalRequest, ...state.withdrawalRequests],
            liveBalance: state.liveBalance - amount,
            pendingTransactions: state.pendingTransactions + 1
          }));

          return withdrawalRequest;
        } catch (error) {
          console.error('Error withdrawing funds:', error);
          throw error;
        }
      },

      // Transfer Coins to Another User
      transferCoins: async (toUserId: string, amount: number, description: string, relatedId?: string): Promise<Transaction> => {
        const { wallet, validateTransaction } = get();
        
        if (!wallet || wallet.bakCoins < amount) {
          throw new Error('Insufficient BAKCoins for transfer');
        }

        const validation = validateTransaction({
          type: 'TIP',
          amount,
          description
        });

        if (!validation.isValid) {
          throw new Error(`Transfer validation failed: ${validation.errors.join(', ')}`);
        }

        try {
          const response = await fetch('/api/wallet/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toUserId,
              amount,
              description,
              relatedId,
              riskScore: validation.riskLevel
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          const transaction = await response.json();
          
          // Update local state
          set(state => ({
            transactions: [transaction, ...state.transactions],
            liveBalance: state.liveBalance - amount
          }));

          return transaction;
        } catch (error) {
          console.error('Error transferring coins:', error);
          throw error;
        }
      },

      // Tip Artist (Specialized Transfer)
      tipArtist: async (artistId: string, amount: number, trackId?: string, message?: string): Promise<Transaction> => {
        const description = message 
          ? `Tip: ${message}`
          : `Tip to artist`;
        
        return get().transferCoins(artistId, amount, description, trackId);
      },

      // Payment Method Management
      addPaymentMethod: async (method: Omit<PaymentMethod, 'id' | 'createdAt'>): Promise<PaymentMethod> => {
        try {
          const response = await fetch('/api/wallet/payment-methods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(method),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          const newMethod = await response.json();
          
          // Update local state
          set(state => ({
            paymentMethods: [...state.paymentMethods, newMethod]
          }));

          return newMethod;
        } catch (error) {
          console.error('Error adding payment method:', error);
          throw error;
        }
      },

      removePaymentMethod: async (methodId: string) => {
        try {
          const response = await fetch(`/api/wallet/payment-methods/${methodId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          // Update local state
          set(state => ({
            paymentMethods: state.paymentMethods.filter(method => method.id !== methodId)
          }));
        } catch (error) {
          console.error('Error removing payment method:', error);
          throw error;
        }
      },

      setDefaultPaymentMethod: async (methodId: string) => {
        try {
          const response = await fetch(`/api/wallet/payment-methods/${methodId}/default`, {
            method: 'PATCH',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          // Update local state
          set(state => ({
            paymentMethods: state.paymentMethods.map(method => ({
              ...method,
              isDefault: method.id === methodId
            }))
          }));
        } catch (error) {
          console.error('Error setting default payment method:', error);
          throw error;
        }
      },

      // Advanced Financial Calculations
      calculateFees: (amount: number, type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'): FeeCalculation => {
        let platformFee = 0;
        let processingFee = 0;

        switch (type) {
          case 'DEPOSIT':
            platformFee = 0; // No platform fee for deposits
            processingFee = amount * 0.015; // 1.5% processing fee
            break;
          case 'WITHDRAWAL':
            platformFee = amount * 0.02; // 2% platform fee
            processingFee = amount * 0.01; // 1% processing fee
            break;
          case 'TRANSFER':
            platformFee = amount * 0.01; // 1% platform fee for transfers
            processingFee = 0;
            break;
        }

        const totalFees = platformFee + processingFee;
        const netAmount = type === 'WITHDRAWAL' ? amount - totalFees : amount - processingFee;

        return {
          amount,
          platformFee,
          processingFee,
          netAmount,
          totalFees
        };
      },

      getExchangeRate: (from: string, to: string): number => {
        const { exchangeRates } = get();
        const rate = exchangeRates.find(r => r.from === from && r.to === to);
        return rate ? rate.rate : 1; // Default to 1 if not found
      },

      // Advanced Transaction Validation
      validateTransaction: (transaction: Partial<Transaction>): ValidationResult => {
        const { wallet } = get();
        const errors: string[] = [];
        const warnings: string[] = [];
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

        // Basic validation
        if (!transaction.amount || transaction.amount <= 0) {
          errors.push('Amount must be greater than 0');
        }

        if (transaction.amount && transaction.amount > 1000000) {
          warnings.push('Large transaction amount detected');
          riskLevel = 'MEDIUM';
        }

        // Balance check for outgoing transactions
        if (transaction.type && ['WITHDRAWAL', 'TIP', 'TRANSFER'].includes(transaction.type)) {
          if (wallet && transaction.amount && transaction.amount > wallet.bakCoins) {
            errors.push('Insufficient balance');
          }
        }

        // Velocity checking (simplified)
        const recentTransactions = get().transactions.filter(t => 
          new Date(t.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        if (recentTransactions.length > 10) {
          warnings.push('High transaction frequency detected');
          riskLevel = 'HIGH';
        }

        // Large amount check
        if (transaction.amount && transaction.amount > 50000) {
          warnings.push('Very large transaction amount');
          riskLevel = 'HIGH';
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
          riskLevel
        };
      },

      // Security Features
      setSpendingLimit: async (dailyLimit: number) => {
        try {
          const response = await fetch('/api/wallet/limits', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dailySpendingLimit: dailyLimit }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          // Update local state
          set(state => ({
            wallet: state.wallet ? { ...state.wallet, dailySpendingLimit: dailyLimit } : null
          }));
        } catch (error) {
          console.error('Error setting spending limit:', error);
          throw error;
        }
      },

      enableTwoFactor: async (enabled: boolean) => {
        try {
          const response = await fetch('/api/wallet/security/2fa', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          // Update local state
          set(state => ({
            wallet: state.wallet ? { ...state.wallet, twoFactorEnabled: enabled } : null
          }));
        } catch (error) {
          console.error('Error updating 2FA:', error);
          throw error;
        }
      },

      verifyTransaction: async (transactionId: string, pin: string) => {
        try {
          const response = await fetch(`/api/wallet/transactions/${transactionId}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }
        } catch (error) {
          console.error('Error verifying transaction:', error);
          throw error;
        }
      },

      // Analytics
      getRevenueAnalytics: async (period: '7d' | '30d' | '90d' | '1y') => {
        try {
          const response = await fetch(`/api/wallet/analytics/revenue?period=${period}`);
          if (!response.ok) throw new Error('Failed to fetch revenue analytics');
          
          return await response.json();
        } catch (error) {
          console.error('Error fetching revenue analytics:', error);
          throw error;
        }
      },

      getSpendingPatterns: async () => {
        try {
          const response = await fetch('/api/wallet/analytics/spending-patterns');
          if (!response.ok) throw new Error('Failed to fetch spending patterns');
          
          return await response.json();
        } catch (error) {
          console.error('Error fetching spending patterns:', error);
          throw error;
        }
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        wallet: state.wallet,
        paymentMethods: state.paymentMethods,
        exchangeRates: state.exchangeRates,
      }),
    }
  )
);

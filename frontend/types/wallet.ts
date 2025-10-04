// frontend/types/wallet.ts
export interface Wallet {
  id: string;
  userId: string;
  user: User;
  
  // Core Balances
  bakCoins: number;           // Platform currency
  totalEarned: number;        // Lifetime earnings
  totalSpent: number;         // Lifetime spending
  pendingBalance: number;     // Funds in clearance
  
  // Advanced Metrics
  dailySpendingLimit: number;
  monthlyWithdrawalLimit: number;
  kycStatus: KYCStatus;
  riskLevel: RiskLevel;
  
  // Security
  twoFactorEnabled: boolean;
  withdrawalWhitelist: string[]; // Approved withdrawal addresses
  transactionPin?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastTransactionAt: Date;
}

export interface Transaction {
  id: string;
  walletId: string;
  wallet: Wallet;
  
  // Core Details
  type: TransactionType;
  amount: number;
  description: string;
  status: TransactionStatus;
  
  // References
  relatedId?: string;        // trackId, competitionId, etc.
  relatedType?: RelatedType;
  
  // Payment Details
  paymentReference: string;
  paymentMethod: PaymentMethod;
  paymentGateway: PaymentGateway;
  gatewayReference?: string;
  
  // Fees & Calculations
  platformFee: number;
  processingFee: number;
  netAmount: number;
  currency: string;
  exchangeRate: number;      // For currency conversion
  
  // Security & Compliance
  riskScore?: number;
  flagged: boolean;
  reviewed: boolean;
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'BANK' | 'MOBILE_MONEY' | 'CRYPTO' | 'CARD';
  provider: string;          // 'PayStack', 'M-Pesa', 'Airtel Money', etc.
  details: Record<string, any>;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export interface ExchangeRate {
  from: string;    // BAK
  to: string;      // KES, USD, etc.
  rate: number;
  lastUpdated: Date;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  status: WithdrawalStatus;
  fees: {
    platform: number;
    processing: number;
    total: number;
  };
  netAmount: number;
  estimatedArrival: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

// Enums
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',           // Buying BAKCoins
  WITHDRAWAL = 'WITHDRAWAL',     // Cashing out
  TIP = 'TIP',                   // Tipping artists
  PURCHASE = 'PURCHASE',         // Buying goods/services
  PRIZE = 'PRIZE',               // Competition winnings
  REFUND = 'REFUND',             // Transaction reversal
  FEE = 'FEE',                   // Platform fees
  ROYALTY = 'ROYALTY',           // Streaming royalties
  BONUS = 'BONUS',               // Platform bonuses
  PENALTY = 'PENALTY'            // Penalties/fines
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  HELD = 'HELD',           // For review
  REVERSED = 'REVERSED'
}

export enum PaymentMethod {
  PAYSTACK = 'PAYSTACK',
  MPESA = 'MPESA',
  AIRTEL_MONEY = 'AIRTEL_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CRYPTO = 'CRYPTO',
  CARD = 'CARD'
}

export enum PaymentGateway {
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
  STRIPE = 'STRIPE',
  MPESA = 'MPESA',
  AIRTEL_MONEY = 'AIRTEL_MONEY'
}

export enum KYCStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  LIMITED = 'LIMITED'  // Basic verification only
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REJECTED = 'REJECTED'
}

export enum RelatedType {
  TRACK = 'TRACK',
  COMPETITION = 'COMPETITION',
  USER = 'USER',
  SUBSCRIPTION = 'SUBSCRIPTION'
}

// Business Intelligence Types
export interface RevenueAnalytics {
  totalRevenue: number;
  revenueBySource: {
    source: string;
    amount: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    revenue: number;
    transactions: number;
  }[];
  topEarningArtists: {
    artist: Artist;
    revenue: number;
    tracks: number;
  }[];
}

export interface FraudDetectionRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: 'FLAG' | 'HOLD' | 'BLOCK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  isActive: boolean;
}

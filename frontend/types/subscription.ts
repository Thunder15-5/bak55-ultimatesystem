// frontend/types/subscription.ts
export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'FREE' | 'ARTIST_PRO' | 'ARTIST_ELITE' | 'FAN_PREMIUM' | 'ENTERPRISE';
  tier: number;
  
  // Pricing
  pricing: {
    monthly: number; // in BAKCoins
    yearly: number; // in BAKCoins (with discount)
    currency: string;
    savings?: number; // percentage saved with yearly
  };
  
  // Features
  features: SubscriptionFeature[];
  limitations: SubscriptionLimitation[];
  benefits: string[];
  
  // Platform Fees
  platformFee: number; // percentage (0-100)
  withdrawalFee: number; // percentage (0-100)
  
  // Usage Limits
  limits: {
    maxTracks: number;
    maxUploadSize: number; // in MB
    maxCompetitions: number;
    analyticsDepth: 'BASIC' | 'ADVANCED' | 'ENTERPRISE';
    supportLevel: 'COMMUNITY' | 'EMAIL' | 'PRIORITY' | 'DEDICATED';
    aiAnalysis: 'LIMITED' | 'STANDARD' | 'PREMIUM' | 'UNLIMITED';
  };
  
  // Metadata
  isActive: boolean;
  isPopular?: boolean;
  recommended?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'REVENUE' | 'ANALYTICS' | 'AI' | 'SUPPORT' | 'PROMOTION' | 'TOOLS';
  enabled: boolean;
  limit?: number;
  usage?: number;
}

export interface SubscriptionLimitation {
  id: string;
  name: string;
  description: string;
  current: number;
  max: number;
  unit: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  
  // Billing Details
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  
  // Payment Method
  paymentMethodId?: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  nextBillingDate?: Date;
  
  // Usage Tracking
  usage: {
    tracksUploaded: number;
    aiAnalyses: number;
    competitionsEntered: number;
    revenueGenerated: number;
    storageUsed: number; // in MB
  };
  
  // Revenue Tracking
  revenue: {
    totalEarned: number;
    platformFees: number;
    netEarnings: number;
    projectedMonthly: number;
  };
  
  // Metadata
  trialEndsAt?: Date;
  upgradedAt?: Date;
  downgradedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingHistory {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  description: string;
  billingDate: Date;
  dueDate?: Date;
  paidAt?: Date;
  invoiceUrl?: string;
  receiptUrl?: string;
}

export interface UpgradePath {
  fromPlan: string;
  toPlan: string;
  immediate: boolean;
  prorated: boolean;
  cost: number;
  savings: number;
  featuresGained: string[];
  limitationsRemoved: string[];
}

// Enums
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED'
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export enum FeatureCategory {
  REVENUE = 'REVENUE',
  ANALYTICS = 'ANALYTICS',
  AI = 'AI',
  SUPPORT = 'SUPPORT',
  PROMOTION = 'PROMOTION',
  TOOLS = 'TOOLS'
}

// Business Intelligence
export interface SubscriptionAnalytics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churnRate: number;
  ltv: number; // Lifetime Value
  cac: number; // Customer Acquisition Cost
  arpu: number; // Average Revenue Per User
  growthRate: number;
  
  // Cohort Analysis
  cohorts: CohortAnalysis[];
  retention: RetentionAnalysis[];
  
  // Subscription Metrics
  plans: PlanPerformance[];
  upgrades: number;
  downgrades: number;
  trialConversions: number;
}

export interface CohortAnalysis {
  cohort: string; // e.g., "2024-01"
  size: number;
  retention: number[]; // retention rates for each period
  revenue: number[];
}

export interface RetentionAnalysis {
  period: string;
  retained: number;
  churned: number;
  retentionRate: number;
}

export interface PlanPerformance {
  plan: string;
  subscribers: number;
  mrr: number;
  churn: number;
  growth: number;
}

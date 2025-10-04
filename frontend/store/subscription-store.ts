// frontend/store/subscription-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SubscriptionPlan,
  UserSubscription,
  BillingHistory,
  UpgradePath,
  SubscriptionAnalytics,
  SubscriptionStatus
} from '@/types/subscription';

interface SubscriptionState {
  // State
  plans: SubscriptionPlan[];
  currentSubscription: UserSubscription | null;
  billingHistory: BillingHistory[];
  upgradePaths: UpgradePath[];
  analytics: SubscriptionAnalytics | null;
  
  // UI State
  isLoading: boolean;
  isUpgrading: boolean;
  activeFeature: string | null;
  
  // Actions
  fetchPlans: () => Promise<void>;
  fetchCurrentSubscription: () => Promise<void>;
  fetchBillingHistory: () => Promise<void>;
  subscribeToPlan: (planId: string, billingCycle: string, paymentMethodId?: string) => Promise<UserSubscription>;
  upgradePlan: (newPlanId: string, immediate?: boolean) => Promise<UserSubscription>;
  downgradePlan: (newPlanId: string) => Promise<UserSubscription>;
  cancelSubscription: (cancelAtPeriodEnd?: boolean) => Promise<void>;
  resumeSubscription: () => Promise<void>;
  
  // Feature Management
  checkFeatureAccess: (featureId: string) => boolean;
  getUsage: (featureId: string) => { used: number; total: number };
  getRemainingLimits: () => Record<string, number>;
  
  // Billing Management
  updatePaymentMethod: (paymentMethodId: string) => Promise<void>;
  changeBillingCycle: (billingCycle: string) => Promise<void>;
  fetchInvoice: (invoiceId: string) => Promise<string>; // Returns invoice URL
  
  // Analytics
  fetchSubscriptionAnalytics: () => Promise<void>;
  calculateSavings: (planId: string, billingCycle: string) => number;
  getRecommendedPlan: () => SubscriptionPlan | null;
  
  // Trial Management
  startTrial: (planId: string) => Promise<UserSubscription>;
  extendTrial: (days: number) => Promise<UserSubscription>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial State
  plans: [],
  currentSubscription: null,
  billingHistory: [],
  upgradePaths: [],
  analytics: null,
  isLoading: false,
  isUpgrading: false,
  activeFeature: null,

  // Fetch Available Plans
  fetchPlans: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/subscriptions/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      
      const plans = await response.json();
      set({ plans, isLoading: false });
    } catch (error) {
      console.error('Error fetching plans:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Fetch Current User Subscription
  fetchCurrentSubscription: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/subscriptions/current');
      if (!response.ok) throw new Error('Failed to fetch subscription');
      
      const subscription = await response.json();
      set({ currentSubscription: subscription, isLoading: false });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Fetch Billing History
  fetchBillingHistory: async () => {
    try {
      const response = await fetch('/api/subscriptions/billing-history');
      if (!response.ok) throw new Error('Failed to fetch billing history');
      
      const billingHistory = await response.json();
      set({ billingHistory });
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw error;
    }
  },

  // Subscribe to a Plan
  subscribeToPlan: async (planId: string, billingCycle: string, paymentMethodId?: string): Promise<UserSubscription> => {
    set({ isUpgrading: true });
    try {
      const response = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle,
          paymentMethodId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const subscription = await response.json();
      set({ 
        currentSubscription: subscription,
        isUpgrading: false 
      });

      return subscription;
    } catch (error) {
      set({ isUpgrading: false });
      throw error;
    }
  },

  // Upgrade Plan
  upgradePlan: async (newPlanId: string, immediate: boolean = false): Promise<UserSubscription> => {
    set({ isUpgrading: true });
    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId,
          immediate
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const subscription = await response.json();
      set({ 
        currentSubscription: subscription,
        isUpgrading: false 
      });

      return subscription;
    } catch (error) {
      set({ isUpgrading: false });
      throw error;
    }
  },

  // Downgrade Plan
  downgradePlan: async (newPlanId: string): Promise<UserSubscription> => {
    set({ isUpgrading: true });
    try {
      const response = await fetch('/api/subscriptions/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlanId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const subscription = await response.json();
      set({ 
        currentSubscription: subscription,
        isUpgrading: false 
      });

      return subscription;
    } catch (error) {
      set({ isUpgrading: false });
      throw error;
    }
  },

  // Cancel Subscription
  cancelSubscription: async (cancelAtPeriodEnd: boolean = true) => {
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelAtPeriodEnd }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const subscription = await response.json();
      set({ currentSubscription: subscription });
    } catch (error) {
      throw error;
    }
  },

  // Resume Subscription
  resumeSubscription: async () => {
    try {
      const response = await fetch('/api/subscriptions/resume', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const subscription = await response.json();
      set({ currentSubscription: subscription });
    } catch (error) {
      throw error;
    }
  },

  // Feature Access Control
  checkFeatureAccess: (featureId: string): boolean => {
    const { currentSubscription, plans } = get();
    
    if (!currentSubscription) return false;

    const plan = plans.find(p => p.id === currentSubscription.planId);
    if (!plan) return false;

    const feature = plan.features.find(f => f.id === featureId);
    return feature ? feature.enabled : false;
  },

  // Get Feature Usage
  getUsage: (featureId: string): { used: number; total: number } => {
    const { currentSubscription } = get();
    
    if (!currentSubscription) return { used: 0, total: 0 };

    // This would check against the subscription's usage tracking
    // For now, return mock data
    return { used: 0, total: 100 };
  },

  // Get Remaining Limits
  getRemainingLimits: (): Record<string, number> => {
    const { currentSubscription } = get();
    
    if (!currentSubscription) return {};

    // Calculate remaining limits based on usage
    const limits: Record<string, number> = {};
    
    // Mock implementation - in real app, this would calculate from usage data
    limits.tracks = Math.max(0, 10 - currentSubscription.usage.tracksUploaded);
    limits.storage = Math.max(0, 1000 - currentSubscription.usage.storageUsed);
    limits.competitions = Math.max(0, 5 - currentSubscription.usage.competitionsEntered);

    return limits;
  },

  // Update Payment Method
  updatePaymentMethod: async (paymentMethodId: string) => {
    try {
      const response = await fetch('/api/subscriptions/payment-method', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const subscription = await response.json();
      set({ currentSubscription: subscription });
    } catch (error) {
      throw error;
    }
  },

  // Change Billing Cycle
  changeBillingCycle: async (billingCycle: string) => {
    try {
      const response = await fetch('/api/subscriptions/billing-cycle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const subscription = await response.json();
      set({ currentSubscription: subscription });
    } catch (error) {
      throw error;
    }
  },

  // Fetch Invoice
  fetchInvoice: async (invoiceId: string): Promise<string> => {
    try {
      const response = await fetch(`/api/subscriptions/invoices/${invoiceId}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      
      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  },

  // Fetch Subscription Analytics
  fetchSubscriptionAnalytics: async () => {
    try {
      const response = await fetch('/api/subscriptions/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const analytics = await response.json();
      set({ analytics });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // Calculate Potential Savings
  calculateSavings: (planId: string, billingCycle: string): number => {
    const { plans, currentSubscription } = get();
    
    const targetPlan = plans.find(p => p.id === planId);
    if (!targetPlan || !currentSubscription) return 0;

    if (billingCycle === 'YEARLY') {
      const monthlyCost = targetPlan.pricing.monthly * 12;
      const yearlyCost = targetPlan.pricing.yearly;
      return monthlyCost - yearlyCost;
    }

    return 0;
  },

  // Get Recommended Plan Based on Usage
  getRecommendedPlan: (): SubscriptionPlan | null => {
    const { plans, currentSubscription } = get();
    
    if (!currentSubscription) return plans.find(p => p.type === 'FREE') || null;

    const currentUsage = currentSubscription.usage;
    const currentPlan = plans.find(p => p.id === currentSubscription.planId);
    
    if (!currentPlan) return null;

    // Check if user is hitting limits
    const isHittingLimits = 
      currentUsage.tracksUploaded >= currentPlan.limits.maxTracks * 0.8 ||
      currentUsage.storageUsed >= currentPlan.limits.maxUploadSize * 0.8 ||
      currentUsage.competitionsEntered >= currentPlan.limits.maxCompetitions * 0.8;

    if (isHittingLimits) {
      // Recommend next tier
      const nextTier = currentPlan.tier + 1;
      return plans.find(p => p.tier === nextTier) || null;
    }

    return null;
  },

  // Start Trial
  startTrial: async (planId: string): Promise<UserSubscription> => {
    try {
      const response = await fetch('/api/subscriptions/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const subscription = await response.json();
      set({ currentSubscription: subscription });
      return subscription;
    } catch (error) {
      throw error;
    }
  },

  // Extend Trial
  extendTrial: async (days: number): Promise<UserSubscription> => {
    try {
      const response = await fetch('/api/subscriptions/trial/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const subscription = await response.json();
      set({ currentSubscription: subscription });
      return subscription;
    } catch (error) {
      throw error;
    }
  },
}));

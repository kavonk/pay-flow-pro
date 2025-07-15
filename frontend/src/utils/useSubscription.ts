import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import brain from 'brain';
import { toast } from 'sonner';

export interface FeatureAccess {
  has_access: boolean;
  plan_name?: string;
  plan_slug?: string;
  can_create_invoices: boolean;
  can_use_custom_branding: boolean;
  can_use_recurring_billing: boolean;
  has_priority_support: boolean;
  max_invoices_per_month?: number | null;
  max_customers?: number | null;
  transaction_fee_percentage: number;
  is_trial: boolean;
  trial_days_remaining: number;
  requires_upgrade_prompt: boolean;
  
  // New auto-trial flags
  auto_trial_temporary?: boolean;  // Indicates temporary access when DB enrollment failed
  auto_enrolled?: boolean;         // Indicates user was auto-enrolled vs manually signed up
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  features: string[];
  transaction_fee_percentage: number;
  max_invoices_per_month?: number;
  max_customers?: number;
  has_custom_branding: boolean;
  has_priority_support: boolean;
  has_recurring_billing: boolean;
  yearly_discount_percentage: number;
  is_trial: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  status: string;
  trial_start_date?: string;
  trial_end_date?: string;
  current_period_start?: string;
  current_period_end?: string;
  card_last_four?: string;
  card_brand?: string;
  canceled_at?: string;
  cancel_at_period_end: boolean;
  plan?: SubscriptionPlan;
  trial_days_remaining: number;
  is_trial: boolean;
  is_active: boolean;
  requires_upgrade_prompt: boolean;
  created_at: string;
  updated_at: string;
}

// Centralized query keys for subscription data
export const subscriptionQueryKeys = {
  all: ['subscription'] as const,
  current: ['subscription', 'current'] as const,
  plans: ['subscription', 'plans'] as const,
  featureAccess: ['subscription', 'feature-access'] as const,
};

// Hook for current user subscription with caching
export const useCurrentSubscription = (enabled: boolean = true) => {
  return useQuery({
    queryKey: subscriptionQueryKeys.current,
    queryFn: async (): Promise<UserSubscription | null> => {
      const response = await brain.get_current_subscription();
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch subscription: ${response.status}`);
      }
      return response.json();
    },
    enabled, // Control query execution
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Hook for subscription plans with aggressive caching
export const useSubscriptionPlans = (enabled: boolean = true) => {
  return useQuery({
    queryKey: subscriptionQueryKeys.plans,
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const response = await brain.get_subscription_plans();
      if (!response.ok) {
        throw new Error(`Failed to fetch subscription plans: ${response.status}`);
      }
      return response.json();
    },
    enabled, // Control query execution
    staleTime: 30 * 60 * 1000, // 30 minutes (plans rarely change)
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });
};

// Hook for feature access with caching
export const useFeatureAccess = (enabled: boolean = true) => {
  return useQuery({
    queryKey: subscriptionQueryKeys.featureAccess,
    queryFn: async (): Promise<FeatureAccess | null> => {
      const response = await brain.get_feature_access();
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch feature access: ${response.status}`);
      }
      return response.json();
    },
    enabled, // Control query execution
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Combined hook that uses all subscription data efficiently
export const useSubscription = (enabled: boolean = true) => {
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useCurrentSubscription(enabled);

  const {
    data: plans = [],
    isLoading: plansLoading,
    error: plansError,
  } = useSubscriptionPlans(enabled);

  const {
    data: featureAccess,
    isLoading: featureAccessLoading,
    error: featureAccessError,
  } = useFeatureAccess(enabled);

  const queryClient = useQueryClient();

  // Mutation for starting trial
  const startTrialMutation = useMutation({
    mutationFn: async (cardData?: { customer_id?: string; last_four?: string; brand?: string }) => {
      const response = await brain.start_trial({
        stripe_customer_id: cardData?.customer_id,
        card_last_four: cardData?.last_four,
        card_brand: cardData?.brand
      });

      if (!response.ok) {
        throw new Error('Failed to start trial');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
      toast.success('Trial started successfully');
    },
    onError: (error) => {
      console.error('Error starting trial:', error);
      toast.error('Failed to start trial');
    },
  });

  // Mutation for upgrading subscription
  const upgradeSubscriptionMutation = useMutation({
    mutationFn: async ({ planSlug, billingCycle }: { planSlug: string; billingCycle: 'monthly' | 'yearly' }) => {
      const response = await brain.upgrade_subscription({
        plan_slug: planSlug,
        billing_cycle: billingCycle
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade subscription');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
      toast.success('Subscription upgraded successfully');
    },
    onError: (error) => {
      console.error('Error upgrading subscription:', error);
      toast.error('Failed to upgrade subscription');
    },
  });

  // Mutation for canceling subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (cancelAtPeriodEnd: boolean = true) => {
      const response = await brain.cancel_subscription({
        cancel_at_period_end: cancelAtPeriodEnd
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
      toast.success('Subscription canceled successfully');
    },
    onError: (error) => {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    },
  });

  const loading = subscriptionLoading || plansLoading || featureAccessLoading;
  const error = subscriptionError || plansError || featureAccessError;

  // Manual refresh function
  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
  };

  const startTrial = async (cardData?: { customer_id?: string; last_four?: string; brand?: string }) => {
    return startTrialMutation.mutateAsync(cardData);
  };

  const upgradeSubscription = async (planSlug: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    return upgradeSubscriptionMutation.mutateAsync({ planSlug, billingCycle });
  };

  const cancelSubscription = async (cancelAtPeriodEnd: boolean = true) => {
    return cancelSubscriptionMutation.mutateAsync(cancelAtPeriodEnd);
  };

  return {
    subscription,
    plans,
    featureAccess,
    loading,
    error,
    startTrial,
    upgradeSubscription,
    cancelSubscription,
    refreshSubscription,
    
    // Helper functions for feature gating
    canCreateInvoices: featureAccess?.can_create_invoices ?? false,
    canUseCustomBranding: featureAccess?.can_use_custom_branding ?? false,
    canUseRecurringBilling: featureAccess?.can_use_recurring_billing ?? false,
    hasPrioritySupport: featureAccess?.has_priority_support ?? false,
    isTrialUser: featureAccess?.is_trial ?? false,
    trialDaysRemaining: featureAccess?.trial_days_remaining ?? 0,
    requiresUpgradePrompt: featureAccess?.requires_upgrade_prompt ?? false,
    maxInvoicesPerMonth: featureAccess?.max_invoices_per_month,
    maxCustomers: featureAccess?.max_customers,
    transactionFeePercentage: featureAccess?.transaction_fee_percentage ?? 0.029,
    
    // Auto-trial specific helpers
    isAutoTrialTemporary: featureAccess?.auto_trial_temporary ?? false,
    isAutoEnrolled: featureAccess?.auto_enrolled ?? false
  };
};

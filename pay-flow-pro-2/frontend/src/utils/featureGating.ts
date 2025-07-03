import { useSubscription } from './useSubscription';

// Feature definitions
export const PREMIUM_FEATURES = {
  RECURRING_BILLING: 'recurring_billing',
  QR_CODES: 'qr_codes',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CUSTOM_BRANDING: 'custom_branding',
  AUTOMATED_REMINDERS: 'automated_reminders',
  DUNNING_AUTOMATION: 'automated_reminders', // Alias for dunning rules
  BULK_OPERATIONS: 'bulk_operations',
  API_ACCESS: 'api_access',
  PRIORITY_SUPPORT: 'priority_support'
} as const;

export type PremiumFeature = typeof PREMIUM_FEATURES[keyof typeof PREMIUM_FEATURES];

// Feature metadata for display
export const FEATURE_METADATA = {
  [PREMIUM_FEATURES.RECURRING_BILLING]: {
    name: 'Recurring Billing',
    description: 'Set up automatic recurring invoices for subscription customers',
    benefit: 'Save time with automated billing cycles'
  },
  [PREMIUM_FEATURES.QR_CODES]: {
    name: 'QR Code Payments',
    description: 'Generate QR codes for instant payment processing',
    benefit: 'Enable contactless payments and faster checkout'
  },
  [PREMIUM_FEATURES.ADVANCED_ANALYTICS]: {
    name: 'Advanced Analytics',
    description: 'Detailed reporting and revenue insights',
    benefit: 'Make data-driven decisions with comprehensive analytics'
  },
  [PREMIUM_FEATURES.CUSTOM_BRANDING]: {
    name: 'Custom Branding',
    description: 'White-label invoices with your company branding',
    benefit: 'Maintain professional brand consistency'
  },
  [PREMIUM_FEATURES.AUTOMATED_REMINDERS]: {
    name: 'Automated Reminders',
    description: 'Smart dunning rules and automated follow-ups',
    benefit: 'Reduce manual work and improve payment collection'
  },
  [PREMIUM_FEATURES.DUNNING_AUTOMATION]: {
    name: 'Dunning Automation',
    description: 'Automated payment reminder rules and follow-ups',
    benefit: 'Improve collection rates with smart automation'
  },
  [PREMIUM_FEATURES.BULK_OPERATIONS]: {
    name: 'Bulk Operations',
    description: 'Process multiple invoices and customers at once',
    benefit: 'Scale your operations efficiently'
  },
  [PREMIUM_FEATURES.API_ACCESS]: {
    name: 'API Access',
    description: 'Full REST API access for custom integrations',
    benefit: 'Integrate with your existing business tools'
  },
  [PREMIUM_FEATURES.PRIORITY_SUPPORT]: {
    name: 'Priority Support',
    description: '24/7 priority customer support',
    benefit: 'Get help when you need it most'
  }
} as const;

// Hook for feature access checking
export const useFeatureAccess = () => {
  const { featureAccess, subscription } = useSubscription();

  const hasFeature = (feature: PremiumFeature): boolean => {
    // Always allow access if no feature access data (graceful degradation)
    if (!featureAccess) return true;
    
    // Check if user has premium plan
    const hasPremiumPlan = subscription?.plan?.slug === 'premium' || subscription?.plan?.slug === 'enterprise';
    
    // Allow all features for premium/enterprise users
    if (hasPremiumPlan) return true;
    
    // Check specific feature access from backend
    switch (feature) {
      case PREMIUM_FEATURES.RECURRING_BILLING:
        return featureAccess.can_create_recurring_invoices ?? false;
      case PREMIUM_FEATURES.QR_CODES:
        return featureAccess.can_use_qr_codes ?? false;
      case PREMIUM_FEATURES.ADVANCED_ANALYTICS:
        return featureAccess.can_access_advanced_analytics ?? false;
      case PREMIUM_FEATURES.CUSTOM_BRANDING:
        return featureAccess.can_use_custom_branding ?? false;
      case PREMIUM_FEATURES.AUTOMATED_REMINDERS:
        return featureAccess.can_use_automated_reminders ?? false;
      case PREMIUM_FEATURES.DUNNING_AUTOMATION:
        return featureAccess.can_use_automated_reminders ?? false;
      case PREMIUM_FEATURES.BULK_OPERATIONS:
        return featureAccess.can_use_bulk_operations ?? false;
      case PREMIUM_FEATURES.API_ACCESS:
        return featureAccess.can_use_api ?? false;
      case PREMIUM_FEATURES.PRIORITY_SUPPORT:
        return featureAccess.can_use_priority_support ?? false;
      default:
        return false;
    }
  };

  const isBasicUser = subscription?.plan?.slug === 'basic' || subscription?.is_trial;
  const isPremiumUser = subscription?.plan?.slug === 'premium' || subscription?.plan?.slug === 'enterprise';

  return {
    hasFeature,
    isBasicUser,
    isPremiumUser,
    subscription,
    featureAccess
  };
};

// Utility function to get upgrade URL
export const getUpgradeUrl = (): string => {
  return '/settings?tab=billing';
};

// Utility function to check if feature should show upgrade prompt
export const shouldShowUpgrade = (feature: PremiumFeature, hasAccess: boolean): boolean => {
  return !hasAccess;
};
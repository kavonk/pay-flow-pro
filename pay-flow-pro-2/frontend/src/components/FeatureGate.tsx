import React from 'react';
import { useSubscription } from 'utils/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown, Zap } from 'lucide-react';

type FeatureKey = 
  | 'invoices'
  | 'customers'
  | 'dunning_rules'
  | 'recurring_billing'
  | 'custom_branding'
  | 'advanced_reporting'
  | 'priority_support'
  | 'api_access';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  className = ''
}) => {
  const { featureAccess, subscription, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={`animate-pulse bg-muted rounded-lg h-32 ${className}`} />
    );
  }

  const hasAccess = featureAccess?.[feature] ?? false;
  
  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const getFeatureInfo = (feature: string) => {
    const featureMap: Record<string, any> = {
      // Basic features - available to all plans
      invoices: {
        name: 'Invoice Management',
        description: 'Create and manage unlimited invoices',
        requiredPlan: 'Basic',
        icon: <Zap className="w-5 h-5 text-amber-500" />
      },
      customers: {
        name: 'Customer Management',
        description: 'Manage unlimited customers',
        requiredPlan: 'Basic',
        icon: <Zap className="w-5 h-5 text-amber-500" />
      },
      can_create_invoices: {
        name: 'Invoice Creation',
        description: 'Create and send invoices to customers',
        requiredPlan: 'Basic',
        icon: <Zap className="w-5 h-5 text-amber-500" />
      },
      
      // Premium features - require premium plan
      dunning_rules: {
        name: 'Automated Reminders',
        description: 'Set up automated payment reminders',
        requiredPlan: 'Premium',
        icon: <Crown className="w-5 h-5 text-purple-500" />
      },
      automated_reminders: {
        name: 'Automated Reminders',
        description: 'Set up automated payment reminders',
        requiredPlan: 'Premium',
        icon: <Crown className="w-5 h-5 text-purple-500" />
      },
      can_use_recurring_billing: {
        name: 'Recurring Billing',
        description: 'Set up subscription billing and recurring invoices',
        requiredPlan: 'Premium',
        icon: <Crown className="w-5 h-5 text-purple-500" />
      },
      recurring_billing: {
        name: 'Recurring Billing',
        description: 'Set up subscription billing and recurring invoices',
        requiredPlan: 'Premium',
        icon: <Crown className="w-5 h-5 text-purple-500" />
      },
      can_use_custom_branding: {
        name: 'Custom Branding',
        description: 'Add your logo and customize invoice templates',
        requiredPlan: 'Premium',
        icon: <Crown className="w-5 h-5 text-purple-500" />
      },
      custom_branding: {
        name: 'Custom Branding',
        description: 'Add your logo and customize invoice templates',
        requiredPlan: 'Premium',
        icon: <Crown className="w-5 h-5 text-purple-500" />
      },
      advanced_reporting: {
        name: 'Advanced Reporting',
        description: 'Access detailed analytics and custom reports',
        requiredPlan: 'Premium',
        icon: <Crown className="w-5 h-5 text-purple-500" />
      },
      advanced_analytics: {
        name: 'Advanced Analytics',
        description: 'Access detailed analytics and custom reports',
        requiredPlan: 'Premium',
        icon: <Crown className="w-5 h-5 text-purple-500" />
      },
      has_priority_support: {
        name: 'Priority Support',
        description: 'Get priority email and chat support',
        requiredPlan: 'Premium',
        icon: <Crown className="w-5 h-5 text-purple-500" />
      },
      priority_support: {
        name: 'Priority Support',
        description: 'Get priority email and chat support',
        requiredPlan: 'Premium',
        icon: <Crown className="w-5 h-5 text-purple-500" />
      },
      api_access: {
        name: 'API Access',
        description: 'Integrate with our REST API',
        requiredPlan: 'Enterprise',
        icon: <Crown className="w-5 h-5 text-emerald-500" />
      }
    };
    
    return featureMap[feature] || {
      name: 'Premium Feature',
      description: 'This feature requires a subscription',
      requiredPlan: 'Premium',
      icon: <Lock className="w-5 h-5 text-muted-foreground" />
    };
  };

  const featureInfo = getFeatureInfo(feature);
  const isTrialUser = subscription?.is_trial ?? false;
  const hasAnySubscription = subscription !== null;
  const trialDaysRemaining = subscription?.trial_days_remaining || 0;

  return (
    <Card className={`border-dashed border-2 border-muted-foreground/20 ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          {featureInfo.icon}
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          {featureInfo.name}
        </CardTitle>
        <CardDescription>{featureInfo.description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {!hasAnySubscription ? (
              `Start your free trial to access ${featureInfo.name} and other premium features.`
            ) : isTrialUser ? (
              trialDaysRemaining > 0 ? (
                `Your trial has ${trialDaysRemaining} days remaining. Upgrade to continue using this feature after your trial.`
              ) : (
                'Your trial has expired. Upgrade to access this feature.'
              )
            ) : (
              `This feature requires a ${featureInfo.requiredPlan} plan or higher.`
            )}
          </p>
          
          <Badge variant="outline" className="text-xs">
            Requires {featureInfo.requiredPlan} Plan
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={() => navigate('/subscription')}
            className="w-full"
            size="sm"
          >
            {!hasAnySubscription ? 'Start Free Trial' : isTrialUser ? 'View Plans' : 'View Plans'}
          </Button>
          
          {hasAnySubscription && !isTrialUser && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/subscription')}
              size="sm"
              className="w-full"
            >
              View All Plans
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureGate;
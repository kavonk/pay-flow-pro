import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Crown, CreditCard, Star, Zap, AlertTriangle, Settings, Edit3 } from 'lucide-react';
import { UserSubscriptionResponse } from 'types';

export interface CurrentPlanCardProps {
  subscription: UserSubscriptionResponse;
  onCancel?: () => void;
  onManageBilling?: () => void;
  isCanceling?: boolean;
}

const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
  subscription,
  onCancel,
  onManageBilling,
  isCanceling = false
}) => {
  const isTrialExpiringSoon = subscription.is_trial && subscription.trial_days_remaining <= 7;
  const currentPlan = subscription.plan;

  const getPlanIcon = (slug?: string) => {
    switch (slug) {
      case 'trial': return <Zap className="w-6 h-6 text-amber-500" />;
      case 'basic': return <CreditCard className="w-6 h-6 text-blue-500" />;
      case 'premium': return <Crown className="w-6 h-6 text-purple-500" />;
      case 'enterprise': return <Star className="w-6 h-6 text-emerald-500" />;
      default: return <CreditCard className="w-6 h-6" />;
    }
  };

  const getStatusBadge = () => {
    if (subscription.is_trial) {
      return (
        <Badge variant={isTrialExpiringSoon ? 'destructive' : 'secondary'}>
          {isTrialExpiringSoon ? 'Trial Ending Soon' : 'Trial Active'}
        </Badge>
      );
    }
    
    switch (subscription.status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Canceled</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>;
      default:
        return <Badge variant="secondary">{subscription.status.replace('_', ' ')}</Badge>;
    }
  };

  const getCardClassName = () => {
    let baseClass = 'transition-all duration-200';
    
    if (isTrialExpiringSoon) {
      return `${baseClass} border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800`;
    }
    
    if (subscription.is_trial) {
      return `${baseClass} border-blue-200 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/20 dark:border-blue-800`;
    }
    
    return baseClass;
  };

  const formatNextBilling = () => {
    if (subscription.is_trial && subscription.trial_days_remaining > 0) {
      return (
        <span className={`flex items-center gap-1 ${
          isTrialExpiringSoon ? 'text-amber-600 font-medium dark:text-amber-400' : 'text-muted-foreground'
        }`}>
          <Calendar className="w-4 h-4" />
          {subscription.trial_days_remaining} days remaining in trial
        </span>
      );
    }
    
    if (subscription.canceled_at && subscription.cancel_at_period_end) {
      return (
        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
          <AlertTriangle className="w-4 h-4" />
          Cancels on {new Date(subscription.current_period_end || '').toLocaleDateString()}
        </span>
      );
    }
    
    if (subscription.current_period_end) {
      return (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
        </span>
      );
    }
    
    return 'Active subscription';
  };

  const showCancelButton = subscription.status === 'active' && !subscription.is_trial && !subscription.canceled_at;
  const showManageBillingButton = subscription.is_trial || subscription.status === 'active';

  return (
    <Card className={getCardClassName()}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentPlan && getPlanIcon(currentPlan.slug)}
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentPlan?.name || 'Unknown Plan'}
                {getStatusBadge()}
              </CardTitle>
              <CardDescription>
                {formatNextBilling()}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {showManageBillingButton && onManageBilling && (
              <Button variant="outline" size="sm" onClick={onManageBilling}>
                <Settings className="w-4 h-4 mr-2" />
                {subscription.is_trial ? 'Manage Payment' : 'Billing Portal'}
              </Button>
            )}
            
            {showCancelButton && onCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your subscription? You'll continue to have access until your current billing period ends on {new Date(subscription.current_period_end || '').toLocaleDateString()}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction onClick={onCancel} disabled={isCanceling}>
                      {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Warning Messages */}
      {isTrialExpiringSoon && (
        <CardContent>
          <div className="flex items-start space-x-3 p-4 bg-amber-100 rounded-lg border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Trial ending soon</p>
              <p className="text-sm text-amber-700 mt-1 dark:text-amber-300">
                Your trial will end in {subscription.trial_days_remaining} days. Upgrade now to continue using PayFlow Pro.
              </p>
            </div>
          </div>
        </CardContent>
      )}
      
      {subscription.is_trial && !isTrialExpiringSoon && (
        <CardContent>
          <div className="flex items-start space-x-3 p-4 bg-blue-100 rounded-lg border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
            <Zap className="w-5 h-5 text-blue-600 mt-0.5 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Trial Active</p>
              <p className="text-sm text-blue-700 mt-1 dark:text-blue-300">
                You have {subscription.trial_days_remaining} days remaining in your trial. Upgrade anytime to unlock all features.
              </p>
            </div>
          </div>
        </CardContent>
      )}
      
      {subscription.canceled_at && subscription.cancel_at_period_end && (
        <CardContent>
          <div className="flex items-start space-x-3 p-4 bg-orange-100 rounded-lg border border-orange-200 dark:bg-orange-950/30 dark:border-orange-800">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 dark:text-orange-400" />
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Subscription Canceled</p>
              <p className="text-sm text-orange-700 mt-1 dark:text-orange-300">
                Your subscription will end on {new Date(subscription.current_period_end || '').toLocaleDateString()}. You can reactivate anytime before then.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CurrentPlanCard;
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CreditCard, Crown, AlertTriangle } from 'lucide-react';
import { useSubscription } from '../utils/useSubscription';

interface TrialStatusProps {
  variant?: 'badge' | 'card' | 'inline';
  showUpgradeButton?: boolean;
}

const TrialStatus: React.FC<TrialStatusProps> = ({ 
  variant = 'badge',
  showUpgradeButton = false 
}) => {
  const { subscription, loading } = useSubscription();

  if (loading || !subscription || !subscription.is_trial) {
    return null;
  }

  const daysRemaining = subscription.trial_days_remaining;
  const isExpiringSoon = daysRemaining <= 3;
  const isExpired = daysRemaining <= 0;

  // Badge variant - simple status indicator
  if (variant === 'badge') {
    return (
      <Badge 
        variant={isExpiringSoon ? 'destructive' : 'secondary'}
        className="flex items-center gap-1"
      >
        <Clock className="w-3 h-3" />
        {isExpired ? 'Trial Expired' : `${daysRemaining} days left`}
      </Badge>
    );
  }

  // Inline variant - compact text display
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Crown className="w-4 h-4" />
        <span>
          {isExpired 
            ? 'Trial expired - Auto-charged €35/month'
            : `Trial: ${daysRemaining} days → Auto-billing €35/month`
          }
        </span>
      </div>
    );
  }

  // Card variant - full information display
  return (
    <Card className={`${isExpiringSoon ? 'border-orange-500' : 'border-blue-500'} ${isExpired ? 'border-red-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isExpired ? 'bg-red-100 text-red-600' :
              isExpiringSoon ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <Crown className="w-5 h-5" />
            </div>
        
        {isExpiringSoon && !isExpired && (
          <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-200">
                  Auto-billing starts in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                </p>
                <p className="text-xs text-orange-300 mt-1">
                  Your payment method will be automatically charged €35/month. Cancel anytime to avoid charges.
                </p>
              </div>
            </div>
          </div>
        )}
            <div>
              <h3 className="font-semibold text-lg">
                {isExpired ? 'Trial Expired' : 'Free Trial Active'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isExpired 
                  ? 'Your payment method has been automatically charged €35/month'
                  : `${daysRemaining} days remaining - Auto-billing €35/month when trial ends`
                }
              </p>
            </div>
          </div>
          {showUpgradeButton && !isExpired && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-orange-500/10 border-orange-500 text-orange-200">
                Auto-charge: €35/month
              </Badge>
            </div>
          )}
        </div>
        
        {!isExpired && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isExpiringSoon ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.max(0, (daysRemaining / 14) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Trial progress: {14 - daysRemaining} of 14 days used
            </p>
          </div>
        )}
        
        <div className="mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            <span>
              {isExpired 
                ? 'Payment method charged • Subscription active'
                : 'Payment method ready for auto-billing • Cancel anytime'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialStatus;
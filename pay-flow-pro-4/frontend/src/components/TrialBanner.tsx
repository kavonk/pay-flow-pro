import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Crown, Clock, Loader2 } from 'lucide-react';
import { useSubscription } from '../utils/useSubscription';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import brain from 'brain';
import { toast } from 'sonner';
import TrialStatus from './TrialStatus';

interface TrialBannerProps {
  className?: string;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ className = '' }) => {
  const { subscription, loading } = useSubscription();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const queryClient = useQueryClient();

  // Mutation for canceling subscription
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await brain.cancel_subscription({
        cancel_at_period_end: true,
        cancellation_reason: 'User requested cancellation during trial'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to cancel subscription');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Subscription cancelled successfully. You can continue using PayFlow Pro until your trial ends.');
      // Invalidate subscription data to refresh UI
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['feature-access'] });
      setShowCancelDialog(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel subscription: ${error.message}`);
      console.error('Cancellation error:', error);
    }
  });

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    cancelMutation.mutate();
  };

  if (loading || !subscription || !subscription.is_trial) {
    return null;
  }

  const daysRemaining = subscription.trial_days_remaining;
  const isExpiringSoon = daysRemaining <= 3;
  const isExpired = daysRemaining <= 0;

  if (isExpired) {
    return (
      <Alert className={`border-red-500 bg-red-50 ${className}`}>
        <Crown className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Trial Expired</strong> - Your account is being upgraded to Premium Plan (€35/month). 
          You'll continue to have full access to all features.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`${isExpiringSoon ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'} ${className}`}>
      <Clock className={`h-4 w-4 ${isExpiringSoon ? 'text-orange-600' : 'text-blue-600'}`} />
      <AlertDescription className={isExpiringSoon ? 'text-orange-800' : 'text-blue-800'}>
        <strong>{daysRemaining} days left</strong> in your free trial. 
        After trial ends, you'll be automatically upgraded to Premium Plan (€35/month).
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogTrigger asChild>
            <button 
              onClick={handleCancelClick}
              className="underline cursor-pointer hover:no-underline transition-all duration-200 ml-1"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="inline w-3 h-3 mr-1 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel anytime'
              )}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Your Subscription?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Are you sure you want to cancel your subscription? Here's what will happen:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>You'll continue to have full access until your trial ends ({daysRemaining} days remaining)</li>
                  <li>No automatic upgrade to the Premium Plan will occur</li>
                  <li>You can reactivate your subscription anytime before the trial ends</li>
                  <li>After the trial, your account will be downgraded to the free plan with limited features</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelMutation.isPending}>
                Keep My Trial
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Subscription'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AlertDescription>
    </Alert>
  );
};

export default TrialBanner;
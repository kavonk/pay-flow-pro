import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Shield, Zap, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useUser } from '@stackframe/react';
import { usePayoutAccount } from 'utils/queryHooks';
import brain from 'brain';
import { toast } from 'sonner';
import { API_URL } from 'app';

interface FirstLoginOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FirstLoginOnboardingModal: React.FC<FirstLoginOnboardingModalProps> = ({
  open,
  onOpenChange,
}) => {
  const user = useUser();
  const { refetch: refetchPayoutAccount } = usePayoutAccount();
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [onboardingWindow, setOnboardingWindow] = useState<Window | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Listen for messages from popup window and monitor closure
  useEffect(() => {
    if (!onboardingWindow) return;

    // Listen for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'stripe-onboarding-complete') {
        console.log('Received onboarding completion message:', event.data);
        
        // Close popup if still open
        if (!onboardingWindow.closed) {
          onboardingWindow.close();
        }
        
        setOnboardingWindow(null);
        
        // Check final status
        handleCheckOnboardingStatus();
      }
    };

    // Also monitor popup closure as fallback
    const checkWindow = setInterval(() => {
      try {
        if (onboardingWindow.closed) {
          clearInterval(checkWindow);
          setOnboardingWindow(null);
          // Only check status if we didn't already handle via message
          setTimeout(() => handleCheckOnboardingStatus(), 500);
        }
      } catch (error) {
        // Popup might be on different domain, ignore cross-origin errors
      }
    }, 1000);

    window.addEventListener('message', handleMessage);

    return () => {
      clearInterval(checkWindow);
      window.removeEventListener('message', handleMessage);
      if (onboardingWindow && !onboardingWindow.closed) {
        onboardingWindow.close();
      }
    };
  }, [onboardingWindow]);

  const handleStartOnboarding = async () => {
    console.log('First login modal - user object:', user);
    console.log('User keys:', user ? Object.keys(user) : 'user is null/undefined');
    
    // Try different user ID fields
    const userId = user?.sub || user?.id || user?.user_id;
    console.log('Resolved user ID:', userId);
    
    if (!userId) {
      console.error('User object missing or no valid ID field:', user);
      toast.error('User not authenticated');
      return;
    }

    setIsCreatingLink(true);
    
    try {
      // Call public endpoint directly with fetch (no authentication required)
      const response = await fetch(`${API_URL}/public/create-account-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Required for dev environment
        body: JSON.stringify({
          user_id: userId,
          email: user.primaryEmail || user.email || undefined,
          country: 'IE',
          business_type: 'individual'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create onboarding link');
      }

      const data = await response.json();
      
      // Use same window redirect to avoid CORS data layer issues
      console.log('Redirecting to Stripe onboarding:', data.account_link_url);
      window.location.href = data.account_link_url;
      
    } catch (error: any) {
      console.error('Failed to start onboarding:', error);
      toast.error(error.message || 'Failed to start onboarding. Please try again.');
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCheckOnboardingStatus = async () => {
    setCheckingStatus(true);
    try {
      // Refetch payout account to see if status updated
      const result = await refetchPayoutAccount();
      
      if (result.data?.account_status === 'active') {
        toast.success('Onboarding completed successfully! You can now receive payments.');
        onOpenChange(false);
      } else {
        toast.info('Onboarding not yet complete. You can continue later from Settings.');
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-purple-600" />
            Complete Your Account Setup
          </DialogTitle>
          <DialogDescription className="sr-only">
            Set up payments with Stripe to start invoicing customers and receiving payments securely.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">
              Set up payments to start invoicing customers
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Complete a quick 2-minute setup with Stripe to securely receive payments from your invoices.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <Zap className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                <h4 className="font-medium mb-2">Fast Setup</h4>
                <p className="text-sm text-muted-foreground">
                  Stripe's guided flow takes just 2 minutes
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <Shield className="h-8 w-8 mx-auto mb-3 text-green-500" />
                <h4 className="font-medium mb-2">Secure & Trusted</h4>
                <p className="text-sm text-muted-foreground">
                  Bank-level security with Stripe Connect
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                <h4 className="font-medium mb-2">Start Invoicing</h4>
                <p className="text-sm text-muted-foreground">
                  Begin creating invoices immediately after
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleStartOnboarding}
              disabled={isCreatingLink}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {isCreatingLink ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Complete Setup Now
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreatingLink}
              size="lg"
            >
              I'll do this later
            </Button>
          </div>

          {checkingStatus && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking onboarding status...
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <p>
              This will open Stripe's secure onboarding in a popup window. 
              Your information is processed directly by Stripe and not stored by PayFlow Pro.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirstLoginOnboardingModal;

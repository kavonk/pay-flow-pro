import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, Settings, Info, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePayoutAccount } from 'utils/queryHooks';
import { toast } from 'sonner';
import brain from 'brain';
import { PayoutAccountWizard } from 'components/PayoutAccountWizard';
import { useQueryClient } from '@tanstack/react-query';

interface PayoutAccountStatusNotificationProps {
  className?: string;
  showOnDashboard?: boolean;
}

const PayoutAccountStatusNotification: React.FC<PayoutAccountStatusNotificationProps> = ({ 
  className = '', 
  showOnDashboard = false 
}) => {
  const navigate = useNavigate();
  const { data: payoutAccount, isLoading: loading } = usePayoutAccount();
  const [showWizard, setShowWizard] = useState(false);
  const [isCreatingOnboardingLink, setIsCreatingOnboardingLink] = useState(false);
  const queryClient = useQueryClient();
  const isActive = payoutAccount?.account_status === 'active';
  const hasPayoutAccount = !!payoutAccount;

  // Don't show while loading
  if (loading) return null;

  // Don't show if account is fully active
  if (isActive) return null;

  // Special handling for users with no payout account at all
  if (!hasPayoutAccount || !payoutAccount) {
    return (
      <>
      <Alert className={`border-blue-500 bg-blue-50 dark:bg-blue-900/20 ${className}`}>
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <strong>Set Up Payouts</strong> - Create your payout account to start receiving payments from invoices.
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowWizard(true)}
              className="ml-4 shrink-0"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Create Payout Account
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      
      {/* Payout Account Wizard */}
      {showWizard && (
        <PayoutAccountWizard
          onSuccess={handleWizardSuccess}
          onCancel={() => setShowWizard(false)}
        />
      )}
      </>
    );
  }

  // Check if this is a newly created simple account (basic setup)
  const isSimpleAccount = payoutAccount.business_type === 'individual' && 
    payoutAccount.country === 'IE' &&
    payoutAccount.account_status !== 'ACTIVE';

  // Show different messages based on account status
  const getNotificationContent = () => {
    if (isSimpleAccount) {
      return {
        type: 'info' as const,
        icon: Info,
        title: 'Ready to Create Invoices!',
        message: showOnDashboard 
          ? 'Your account is set up for invoice creation. Complete your payout setup when you\'re ready to receive payments.'
          : 'Your payout account is set up for invoices. Complete additional setup to receive payments.',
        buttonText: 'Complete Payout Setup',
        showButton: true
      };
    }

    // Account exists but has requirements
    const hasRequirements = (payoutAccount.requirements_currently_due?.length || 0) > 0 ||
      (payoutAccount.requirements_past_due?.length || 0) > 0;

    if (hasRequirements) {
      return {
        type: 'warning' as const,
        icon: Settings,
        title: 'Payout Setup Incomplete',
        message: 'Complete your payout account setup to receive payments from invoices.',
        buttonText: 'Complete Setup',
        showButton: true
      };
    }

    return null;
  };

  const content = getNotificationContent();
  if (!content) return null;

  const handleSetupClick = async () => {
    // If no payout account exists, show the wizard
    if (!hasPayoutAccount || !payoutAccount) {
      setShowWizard(true);
      return;
    }

    // If account exists but needs onboarding, create onboarding link
    if (payoutAccount.account_status !== 'active') {
      try {
        setIsCreatingOnboardingLink(true);
        const response = await brain.create_onboarding_link();
        
        if (response.ok) {
          const { url } = await response.json();
          window.open(url, '_blank');
          toast.success('Opening Stripe onboarding. Complete the process to activate your payout account.');
        } else {
          console.error('Failed to create onboarding link:', response.status);
          toast.error('Failed to create onboarding link. Please try again.');
        }
      } catch (error) {
        console.error('Error creating onboarding link:', error);
        toast.error('Failed to create onboarding link. Please try again.');
      } finally {
        setIsCreatingOnboardingLink(false);
      }
    } else {
      // Account is active, go to settings
      navigate('/settings?tab=payouts');
    }
  };

  const handleWizardSuccess = async () => {
    setShowWizard(false);
    // Refresh payout account data
    queryClient.invalidateQueries({ queryKey: ['payout-account'] });
    toast.success('Payout account created successfully!');
  };

  const alertVariant = content.type === 'warning' ? 'destructive' : 'default';
  const iconColor = content.type === 'warning' ? 'text-orange-600' : 'text-blue-600';

  return (
    <>
    <Alert className={`${alertVariant === 'destructive' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'} ${className}`}>
      <content.icon className={`h-4 w-4 ${iconColor}`} />
      <AlertDescription className={`${content.type === 'warning' ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <strong>{content.title}</strong> - {content.message}
          </div>
          {content.showButton && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSetupClick}
              disabled={isCreatingOnboardingLink}
              className="ml-4 shrink-0"
            >
              {isCreatingOnboardingLink ? (
                <>
                  <ExternalLink className="w-3 h-3 mr-1 animate-pulse" />
                  Creating...
                </>
              ) : (
                <>
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {content.buttonText}
                </>
              )}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
    
    {/* Payout Account Wizard */}
    {showWizard && (
      <PayoutAccountWizard
        onSuccess={handleWizardSuccess}
        onCancel={() => setShowWizard(false)}
      />
    )}
    </>
  );
};

export default PayoutAccountStatusNotification;
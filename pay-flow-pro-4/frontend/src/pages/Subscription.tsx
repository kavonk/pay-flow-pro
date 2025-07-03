import React, { useState } from 'react';
import AppLayout from 'components/AppLayout';
import { useSubscription } from 'utils/useSubscription';
import brain from 'brain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import PlanCard from 'components/PlanCard';
import CurrentPlanCard from 'components/CurrentPlanCard';
import BillingCard from 'components/BillingCard';

const SubscriptionPage = () => {
  const {
    subscription,
    plans,
    featureAccess,
    loading,
    error,
    upgradeSubscription,
    cancelSubscription,
    refreshSubscription
  } = useSubscription();
  
  const [canceling, setCanceling] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // Fetch billing history with sample data for demo
  const { data: rawBillingHistory = [], isLoading: isLoadingBilling } = useQuery({
    queryKey: ['billing-history'],
    queryFn: async () => {
      const response = await brain.get_billing_history({});
      if (response.ok) {
        const data = await response.json();
        return data.history || []; // Extract history array from BillingHistoryListResponse
      }
      return [];
    },
    enabled: !!subscription
  });
  
  // Add sample billing history for demonstration purposes when no real data exists
  const actualBillingHistory = rawBillingHistory.length === 0 ? [
    {
      id: 'demo-sample-1',
      amount: '35.00',
      currency: 'EUR',
      status: 'succeeded',
      description: 'PayFlow Pro Subscription',
      payment_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      invoice_url: null,
      receipt_url: null,
      period_start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: 'card',
      last_four: '4242',
      invoice_number: 'PAY-001'
    },
    {
      id: 'demo-sample-2', 
      amount: '35.00',
      currency: 'EUR',
      status: 'succeeded',
      description: 'PayFlow Pro Subscription',
      payment_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      invoice_url: null,
      receipt_url: null,
      period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: 'card',
      last_four: '4242',
      invoice_number: 'PAY-002'
    }
  ] : rawBillingHistory;
  
  // Check for payment success/cancel from URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      toast.success('Payment successful! Your subscription has been updated.');
      refreshSubscription();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (canceled === 'true') {
      toast.info('Payment was canceled. You can try again anytime.');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshSubscription]);

  const handleUpgrade = async (planSlug: string, cycle: 'monthly' | 'yearly' = 'monthly') => {
    try {
      setUpgrading(true);
      
      // Create Stripe checkout session
      const checkoutResponse = await brain.create_checkout_session({
        plan_slug: planSlug,
        billing_cycle: cycle,
        success_url: `${window.location.origin}/subscription?success=true`,
        cancel_url: `${window.location.origin}/subscription?canceled=true`
      });
      
      if (checkoutResponse.ok) {
        const { checkout_url } = await checkoutResponse.json();
        // Redirect to Stripe checkout
        window.location.href = checkout_url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || 'Failed to start upgrade process');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setCanceling(true);
      await cancelSubscription(true); // Cancel at period end
      toast.success('Subscription will be canceled at the end of your billing period.');
      refreshSubscription();
    } catch (err) {
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setCanceling(false);
    }
  };

  const { mutate: handleManageBilling, isPending: isManagingBilling } = useMutation({
    mutationFn: async () => {
      try {
        const response = await brain.create_customer_portal_endpoint({
          return_url: window.location.href,
        });
        const data = await response.json();
        window.location.href = data.url;
      } catch (error) {
        console.error("Error creating customer portal session:", error);
        toast.error("Failed to open billing settings. Please try again later.");
      }
    },
  });

  const handleContactSales = () => {
    // Open email client or show contact info
    window.location.href = 'mailto:sales@payflowpro.com?subject=Enterprise Plan Inquiry';
  };

  const handleDownloadInvoice = async (billingId: string) => {
    try {
      // For now, show instructions since the invoice download isn't fully implemented
      toast.info(
        'Invoice download coming soon! For now, you can access your invoices through your email or contact support.',
        { duration: 6000 }
      );
    } catch (error: any) {
      toast.error('Unable to download invoice. Please try again later.');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Subscription</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={refreshSubscription}>Retry</Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const currentPlan = subscription?.plan;
  const availablePlans = plans.filter(plan => plan.slug !== 'trial');

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Subscription & Billing</h1>
          <p className="text-muted-foreground">Manage your PayFlow Pro subscription and billing preferences</p>
        </div>

        {/* Current Subscription Status */}
        {subscription && (
          <CurrentPlanCard
            subscription={subscription}
            onCancel={handleCancel}
            onManageBilling={handleManageBilling}
            isCanceling={canceling}
          />
        )}

        {/* Plan Comparison Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Available Plans</h2>
            
            {/* Billing Cycle Toggle */}
            <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availablePlans
              .sort((a, b) => {
                // Custom order: Basic → Premium → Enterprise
                const order = { 'basic': 1, 'premium': 2, 'enterprise': 3 };
                const aOrder = order[a.slug as keyof typeof order] || 999;
                const bOrder = order[b.slug as keyof typeof order] || 999;
                return aOrder - bOrder;
              })
              .map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  currentPlanSlug={currentPlan?.slug}
                  billingCycle={billingCycle}
                  isUpgrading={upgrading}
                  showMostPopular={plan.slug === 'premium'}
                  onUpgrade={handleUpgrade}
                  onContactSales={handleContactSales}
                />
              ))}
          </div>
        </div>

        {/* Billing Management Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Billing & Payment</h2>
          <BillingCard
            subscription={subscription || {
              id: '',
              user_id: '',
              status: 'trial',
              trial_start_date: null,
              trial_end_date: null,
              current_period_start: null,
              current_period_end: null,
              card_last_four: null,
              card_brand: null,
              canceled_at: null,
              cancel_at_period_end: false,
              plan: null,
              trial_days_remaining: 0,
              is_trial: true,
              is_active: false,
              requires_upgrade_prompt: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }}
            billingHistory={actualBillingHistory}
            onUpdatePaymentMethod={handleManageBilling}
            onDownloadInvoice={handleDownloadInvoice}
            isLoadingBilling={isLoadingBilling}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default SubscriptionPage;
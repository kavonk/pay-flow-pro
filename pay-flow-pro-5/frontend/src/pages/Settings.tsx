import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw,
  Building,
  Mail,
  MapPin,
  Crown,
  Zap,
  Star,
  Calendar,
  CheckCircle2,
  Settings as SettingsIcon,
  Banknote,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Clock,
  X,
  DollarSign,
  Download,
  Palette
} from "lucide-react";
import brain from "brain";
import { API_URL } from "app";
import { useSubscription } from "utils/useSubscription";
import type { PayoutAccountResponse, BillingHistoryListResponse } from "types";
import { usePayoutAccount, useRefreshPayoutAccount, useTeamData, useInviteUser, useRemoveTeamMember, useRevokeInvitation, useUpdateMemberRole } from "utils/queryHooks";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@stackframe/react";

// Team management types
interface TeamMember {
  user_id: string;
  role: string;
  created_at: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
  is_expired: boolean;
}

interface UserRole {
  user_id: string;
  role: string;
  can_manage_users: boolean;
  can_manage_billing: boolean;
  account_id: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const user = useUser();
  const [showWizard, setShowWizard] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [canceling, setCanceling] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);
  const [onboardingWindow, setOnboardingWindow] = useState<Window | null>(null);

  // Use optimized React Query hooks for all data fetching
  const { subscription, plans, featureAccess, loading: subscriptionLoading, error: subscriptionError, cancelSubscription, refreshSubscription } = useSubscription();
  const { data: payoutAccount, isLoading: payoutLoading, error: payoutError } = usePayoutAccount();
  const refreshPayoutMutation = useRefreshPayoutAccount();
  const { members: teamMembers, invitations: teamInvitations, userRole, loading: teamLoading, error: teamError } = useTeamData();
  const inviteUserMutation = useInviteUser();
  const removeTeamMemberMutation = useRemoveTeamMember();
  const revokeInvitationMutation = useRevokeInvitation();
  const updateMemberRoleMutation = useUpdateMemberRole();

  // Fetch billing history
  const { data: billingHistoryData, isLoading: isLoadingBilling } = useQuery({
    queryKey: ['billing-history'],
    queryFn: async (): Promise<BillingHistoryListResponse> => {
      const response = await brain.get_billing_history({ limit: 20 });
      if (response.ok) {
        return await response.json();
      }
      return { history: [], has_more: false, total_count: 0 };
    },
    enabled: !!subscription
  });

  // Extract history from response, with fallback demo data for empty results
  const billingHistory = billingHistoryData?.history || [];

  useEffect(() => {
    // Check for success/refresh parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      const type = urlParams.get('type');
      if (type === 'subscription') {
        toast.success('Payment successful! Your subscription has been updated.');
        refreshSubscription();
      } else {
        toast.success('Payout account setup completed successfully!');
        setTimeout(() => refreshPayoutMutation.mutate(), 1000);
      }
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('refresh') === 'true') {
      toast.info('Please complete your payout account setup.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      toast.info('Payment was canceled. You can try again anytime.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshSubscription, refreshPayoutMutation]);

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
        
        // Refresh payout account status
        refreshPayoutMutation.mutate();
      }
    };

    // Also monitor popup closure as fallback
    const checkWindow = setInterval(() => {
      try {
        if (onboardingWindow.closed) {
          clearInterval(checkWindow);
          setOnboardingWindow(null);
          // Check status after popup closes
          setTimeout(() => refreshPayoutMutation.mutate(), 500);
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
  }, [onboardingWindow, refreshPayoutMutation]);



  const handleUpgrade = async (planSlug: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    try {
      setUpgrading(true);
      const response = await brain.upgrade_subscription({
        plan_slug: planSlug,
        billing_cycle: billingCycle
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          toast.success('Subscription upgraded successfully!');
          refreshSubscription();
        }
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to upgrade subscription');
      }
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      toast.error('Failed to upgrade subscription');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCanceling(true);
      await cancelSubscription();
      toast.success('Subscription canceled successfully');
    } catch (err) {
      console.error('Error canceling subscription:', err);
      toast.error('Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setManagingBilling(true);
      const response = await brain.create_customer_portal({
        return_url: window.location.href,
      });
      
      if (response.ok) {
        const { portal_url } = await response.json();
        window.open(portal_url, '_blank');
      } else {
        const error = await response.json();
        
        // Handle specific error cases
        if (response.status === 404 && error.detail?.includes('No subscription found')) {
          toast.error('Please subscribe to a plan first to access billing management.');
        } else if (response.status === 400 && error.detail?.includes('Payment method not set up')) {
          toast.error('Payment method not set up. Please upgrade to a paid plan to access billing management.');
        } else {
          toast.error(error.detail || 'Unable to access billing portal. Please contact support.');
        }
      }
    } catch (err) {
      console.error('Error accessing billing portal:', err);
      if (err instanceof Error) {
        toast.error(`Billing portal error: ${err.message}`);
      } else {
        toast.error('Unable to access billing portal. Please contact support.');
      }
    } finally {
      setManagingBilling(false);
    }
  };

  const handleDownloadInvoice = (invoiceUrl?: string, receiptUrl?: string) => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    } else if (receiptUrl) {
      window.open(receiptUrl, '_blank');
    } else {
      toast.info('Invoice PDF not available for this transaction.');
    }
  };

  const formatAmount = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(numAmount);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'paid':
      case 'succeeded':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'pending':
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'failed':
      case 'payment_failed':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'open':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Open</Badge>;
      case 'past_due':
        return <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-200">Past Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleInviteUser = async () => {
    try {
      await inviteUserMutation.mutateAsync({ email: inviteEmail, role: inviteRole });
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (err) {
      console.error('Failed to send invitation:', err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeTeamMemberMutation.mutateAsync(userId);
    } catch (err) {
      console.error('Failed to remove team member:', err);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      await revokeInvitationMutation.mutateAsync(invitationId);
    } catch (err) {
      console.error('Failed to revoke invitation:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'restricted':
      case 'restricted_soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4" />;
      case 'restricted':
      case 'restricted_soon':
        return <AlertTriangle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Only show loading for the entire page if there's a critical error, not just loading states
  const hasError = payoutError || subscriptionError || teamError;
  
  if (hasError) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {payoutError instanceof Error ? payoutError.message : 
               subscriptionError instanceof Error ? subscriptionError.message :
               teamError instanceof Error ? teamError.message :
               'An error occurred loading settings data'}
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="payouts">Payout Account</TabsTrigger>
            <TabsTrigger value="billing">Billing History</TabsTrigger>
            <TabsTrigger value="team">Team Management</TabsTrigger>
          </TabsList>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <span>Subscription Plan</span>
                </CardTitle>
                <CardDescription>
                  Manage your subscription plan and billing cycle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscriptionLoading ? (
                  <div className="text-center py-8">
                    <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Subscription</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Please wait while we load your subscription details...</p>
                    <div className="animate-pulse flex justify-center">
                      <div className="h-10 w-32 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ) : subscription ? (
                  <div className="space-y-6">
                    {/* Current Subscription Status */}
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            subscription.status === 'active' ? 'bg-green-500' :
                            subscription.status === 'trialing' ? 'bg-blue-500' :
                            subscription.status === 'canceled' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />
                          <h3 className="text-lg font-semibold">Current Plan</h3>
                        </div>
                        <Badge className={`${
                          subscription.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                          subscription.status === 'trialing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          subscription.status === 'canceled' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                          {subscription.status === 'trialing' && subscription.is_trial ? (
                            <><Zap className="w-3 h-3 mr-1" />Free Trial</>
                          ) : (
                            <><Crown className="w-3 h-3 mr-1" />{subscription.status === 'canceled' ? 'Cancelled' : subscription.plan_name || 'Premium'}</>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Plan</label>
                          <p className="flex items-center space-x-2">
                            <span className="font-medium">{subscription.plan_name || 'Premium Plan'}</span>
                            {subscription.is_trial && (
                              <Badge variant="outline" className="text-xs">Trial</Badge>
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Billing Cycle</label>
                          <p className="capitalize">{subscription.billing_cycle || 'Monthly'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Amount</label>
                          <p className="font-medium">€{subscription.plan_price || '35'}/{subscription.billing_cycle === 'yearly' ? 'year' : 'month'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <p className="capitalize font-medium">{subscription.status}</p>
                        </div>
                      </div>
                      
                      {/* Plan Management Actions */}
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                        <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Plan Management</h4>
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            onClick={() => navigate('/subscription')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {subscription.is_trial ? 'Choose Plan' : 'Change Plan'}
                          </Button>
                          
                          {!subscription.is_trial && (
                            <Button 
                              variant="outline"
                              onClick={handleManageBilling}
                              disabled={managingBilling}
                            >
                              {managingBilling ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <ExternalLink className="w-4 h-4 mr-2" />
                              )}
                              Manage Billing
                            </Button>
                          )}
                          
                          {subscription.status !== 'canceled' && !subscription.is_trial && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" disabled={canceling}>
                                  {canceling ? 'Canceling...' : 'Cancel Plan'}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleCancelSubscription}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Yes, Cancel
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          <Button 
                            variant="outline"
                            onClick={() => refreshSubscription()}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                          </Button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {subscription.is_trial 
                            ? 'View all available plans and pricing options'
                            : 'Change to a different plan or manage your billing settings'
                          }
                        </p>
                      </div>

                      
                      {/* Current Billing Period - Only show when not on trial */}
                      {!subscription.is_trial && subscription.current_period_start && subscription.current_period_end && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-800 dark:text-green-200">Current Billing Period</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Period Start:</span>
                              <span className="ml-1">{formatDate(subscription.current_period_start)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Period End:</span>
                              <span className="ml-1">{formatDate(subscription.current_period_end)}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                            Next payment will be processed automatically on the period end date.
                          </div>
                        </div>
                      )}
                      
                      {/* Trial Period Information */}
                      {subscription.is_trial && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <Zap className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-800 dark:text-blue-200">Free Trial Period</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Started:</span>
                              <span className="ml-1">{subscription.trial_start_date ? formatDate(subscription.trial_start_date) : 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ends:</span>
                              <span className="ml-1">{subscription.trial_end_date ? formatDate(subscription.trial_end_date) : 'N/A'}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                            After your trial ends, you'll be automatically upgraded to the Basic plan (€35/month).
                          </div>
                        </div>
                      )}
                      
                      {/* Cancellation Info */}
                      {subscription.status === 'canceled' && subscription.current_period_end && (
                        <Alert className="mb-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Your subscription has been cancelled and will end on {formatDate(subscription.current_period_end)}. 
                            You'll continue to have access until then.
                          </AlertDescription>
                        </Alert>
                      )}
                      

                    </div>
                    
                    {/* Plan Features */}
                    {featureAccess && (
                      <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Plan Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            {featureAccess.can_create_invoices ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            <span>Create Invoices</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {featureAccess.can_export_data ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            <span>Export Data</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {featureAccess.has_team_access ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            <span>Team Management</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {featureAccess.has_premium_support ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            <span>Premium Support</span>
                          </div>
                        </div>
                        
                        {featureAccess.invoice_limit && (
                          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Invoice Limit:</span>
                              <span className="ml-1 font-medium">
                                {featureAccess.invoice_limit === -1 ? 'Unlimited' : featureAccess.invoice_limit}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Subscription Found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Get started with a free trial to access PayFlow Pro features</p>
                    <Button onClick={handleManageBilling} disabled={startingTrial}>
                      {startingTrial ? 'Setting up...' : 'Start Free Trial'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payout Account Tab */}
          <TabsContent value="payouts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Banknote className="w-5 h-5 text-green-500" />
                  <span>Payout Account</span>
                </CardTitle>
                <CardDescription>
                  Manage your payout account for receiving payments from invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payoutLoading ? (
                  <div className="text-center py-8">
                    <Banknote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Payout Account</h3>
                    <p className="text-gray-600 dark:text-gray-400">Please wait while we load your payout account details...</p>
                  </div>
                ) : payoutAccount ? (
                  <div className="space-y-6">
                    {/* Account Status and Info */}
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            payoutAccount.account_status === 'active' ? 'bg-green-500' :
                            payoutAccount.account_status === 'restricted' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />
                          <h3 className="text-lg font-semibold">Account Status</h3>
                        </div>
                        <Badge className={getStatusColor(payoutAccount.account_status)}>
                          {getStatusIcon(payoutAccount.account_status)}
                          <span className="ml-1 capitalize">{payoutAccount.account_status}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                          <p className="capitalize">{payoutAccount.business_type || 'Individual'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Country</label>
                          <p>{payoutAccount.country}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Charges Enabled</label>
                          <p className="flex items-center space-x-1">
                            {payoutAccount.charges_enabled ? (
                              <><CheckCircle className="w-4 h-4 text-green-500" /><span>Yes</span></>
                            ) : (
                              <><X className="w-4 h-4 text-red-500" /><span>No</span></>
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Payouts Enabled</label>
                          <p className="flex items-center space-x-1">
                            {payoutAccount.payouts_enabled ? (
                              <><CheckCircle className="w-4 h-4 text-green-500" /><span>Yes</span></>
                            ) : (
                              <><X className="w-4 h-4 text-red-500" /><span>No</span></>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* Requirements */}
                      {(payoutAccount.requirements_currently_due?.length > 0 || payoutAccount.requirements_past_due?.length > 0) && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 text-orange-600">Requirements Needed:</h4>
                          <div className="space-y-1">
                            {payoutAccount.requirements_past_due?.map((req, idx) => (
                              <p key={idx} className="text-sm text-red-600 flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="capitalize">{req.replace(/_/g, ' ')} (Past Due)</span>
                              </p>
                            ))}
                            {payoutAccount.requirements_currently_due?.map((req, idx) => (
                              <p key={idx} className="text-sm text-orange-600 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span className="capitalize">{req.replace(/_/g, ' ')}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        {payoutAccount.account_status !== 'active' && (
                          <Button 
                            onClick={async () => {
                              try {
                                console.log('Starting Express onboarding for user:', user?.sub);
                                console.log('Full user object:', user);
                                console.log('User keys:', user ? Object.keys(user) : 'user is null/undefined');
                                
                                // Try different user ID fields
                                const userId = user?.sub || user?.id || user?.user_id;
                                console.log('Resolved user ID:', userId);
                                
                                if (!userId) {
                                  console.error('User object missing or no valid ID field:', user);
                                  throw new Error('User not authenticated');
                                }
                                
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
                                
                                // Open in popup window with proper dimensions and focus
                                const popup = window.open(
                                  data.account_link_url,
                                  'stripe-onboarding',
                                  'width=800,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,menubar=no,toolbar=no'
                                );
                                
                                if (popup) {
                                  setOnboardingWindow(popup);
                                  popup.focus();
                                  console.log('Opened Stripe onboarding popup from Settings:', data.account_link_url);
                                } else {
                                  // Popup blocked - fallback to same window
                                  toast.error('Popup blocked. Please allow popups and try again, or we\'ll redirect you directly.');
                                  window.location.href = data.account_link_url;
                                }
                              } catch (error: any) {
                                console.error('Failed to start onboarding:', error);
                                toast.error(error.message || 'Failed to start onboarding. Please try again.');
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Continue Setup
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline"
                          onClick={() => refreshPayoutMutation.mutate()}
                          disabled={refreshPayoutMutation.isPending}
                        >
                          {refreshPayoutMutation.isPending ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Refresh Status
                        </Button>
                        
                        {payoutAccount.account_status === 'active' && payoutAccount.dashboard_url && (
                          <Button 
                            variant="outline"
                            onClick={() => window.open(payoutAccount.dashboard_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Dashboard
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Account Details */}
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Account ID</label>
                          <p className="font-mono text-sm">{payoutAccount.stripe_account_id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Created</label>
                          <p>{formatDate(payoutAccount.created_at)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                          <p>{formatDate(payoutAccount.updated_at)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Details Submitted</label>
                          <p className="flex items-center space-x-1">
                            {payoutAccount.details_submitted ? (
                              <><CheckCircle className="w-4 h-4 text-green-500" /><span>Yes</span></>
                            ) : (
                              <><X className="w-4 h-4 text-red-500" /><span>No</span></>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Banknote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Payout Account</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Set up your payout account to start receiving payments from invoices</p>
                    <Button 
                      onClick={async () => {
                        try {
                          // Get user ID with fallbacks
                          const userId = user?.sub || user?.id || user?.user_id;
                          if (!userId) {
                            throw new Error('User not authenticated');
                          }

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
                          
                          // Open in same window since we're in settings
                          window.location.href = data.account_link_url;
                        } catch (error: any) {
                          console.error('Failed to start onboarding:', error);
                          toast.error(error.message || 'Failed to start onboarding. Please try again.');
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Complete Payout Setup
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">
                      This will open Stripe's secure onboarding flow to set up your payout account.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span>Billing History</span>
                </CardTitle>
                <CardDescription>
                  View your subscription billing history and download invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBilling ? (
                  <div className="flex items-center space-x-2 py-8 justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading billing history...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {billingHistory.map((billing) => (
                      <div key={billing.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-950">
                            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {formatAmount(billing.amount, billing.currency)}
                              </span>
                              <div className="flex-shrink-0">
                                {getStatusBadge(billing.status)}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {billing.description}
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {new Date(billing.payment_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {billing.period_start && billing.period_end && (
                              <div className="text-xs text-muted-foreground">
                                Service period: {new Date(billing.period_start).toLocaleDateString()} - {new Date(billing.period_end).toLocaleDateString()}
                              </div>
                            )}
                            {billing.payment_method && (
                              <div className="text-xs text-muted-foreground">
                                {billing.payment_method}{billing.last_four && ` ending in ${billing.last_four}`}
                              </div>
                            )}
                            {billing.invoice_number && (
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                Invoice #{billing.invoice_number}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {(billing.invoice_url || billing.receipt_url) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadInvoice(billing.invoice_url, billing.receipt_url)}
                              title={billing.invoice_url ? 'Download Invoice' : 'Download Receipt'}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {billingHistory.length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Billing History</h3>
                        <p className="text-gray-600 dark:text-gray-400">Your billing history will appear here once you have subscription charges</p>
                      </div>
                    )}
                    
                    {billingHistory.length > 0 && (
                      <div className="text-center pt-4 border-t">
                        <Button variant="outline" size="sm" onClick={handleManageBilling}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View in Billing Portal
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Management Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span>Team Members</span>
                </CardTitle>
                <CardDescription>
                  Manage team members and their access permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamLoading ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Team Data</h3>
                    <p className="text-gray-600 dark:text-gray-400">Please wait while we load your team information...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Team Members Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Team Members ({teamMembers?.length || 0})</h3>
                        {userRole?.can_manage_users && (
                          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Invite Member
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Invite Team Member</DialogTitle>
                                <DialogDescription>
                                  Send an invitation to add a new member to your team.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="email">Email Address</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter email address"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="role">Role</Label>
                                  <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="member">
                                        <div className="flex items-center space-x-2">
                                          <Users className="w-4 h-4" />
                                          <div>
                                            <div className="font-medium">Member</div>
                                            <div className="text-xs text-muted-foreground">Can view and manage customers and invoices</div>
                                          </div>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="admin">
                                        <div className="flex items-center space-x-2">
                                          <Shield className="w-4 h-4" />
                                          <div>
                                            <div className="font-medium">Admin</div>
                                            <div className="text-xs text-muted-foreground">Full access including team and billing management</div>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleInviteUser}
                                  disabled={!inviteEmail || inviteUserMutation.isPending}
                                >
                                  {inviteUserMutation.isPending ? 'Sending...' : 'Send Invitation'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                      
                      {teamMembers && teamMembers.length > 0 ? (
                        <div className="space-y-3">
                          {teamMembers.map((member) => (
                            <div key={member.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-950">
                                  {member.role === 'admin' ? (
                                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                  ) : (
                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{member.user_id.substring(0, 8)}...</div>
                                  <div className="text-sm text-muted-foreground capitalize">{member.role}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Joined {formatDate(member.created_at)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                                  {member.role}
                                </Badge>
                                {userRole?.can_manage_users && member.user_id !== userRole.user_id && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to remove this team member? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleRemoveMember(member.user_id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Remove Member
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Team Members</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">Start building your team by inviting members</p>
                          {userRole?.can_manage_users && (
                            <Button onClick={() => setInviteDialogOpen(true)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Invite First Member
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pending Invitations Section */}
                    {userRole?.can_manage_users && teamInvitations && teamInvitations.length > 0 && (
                      <div className="space-y-4">
                        <Separator />
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Pending Invitations ({teamInvitations.length})</h3>
                          <div className="space-y-3">
                            {teamInvitations.map((invitation) => (
                              <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center dark:bg-yellow-950">
                                    <Mail className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{invitation.email}</div>
                                    <div className="text-sm text-muted-foreground capitalize">{invitation.role}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {invitation.is_expired ? (
                                        <span className="text-red-600">Expired {formatDate(invitation.expires_at)}</span>
                                      ) : (
                                        `Expires ${formatDate(invitation.expires_at)}`
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={invitation.is_expired ? 'destructive' : 'secondary'}>
                                    {invitation.is_expired ? 'Expired' : 'Pending'}
                                  </Badge>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <X className="w-4 h-4 text-red-500" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to revoke this invitation to {invitation.email}?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleRevokeInvitation(invitation.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Revoke
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* User Role Information */}
                    {userRole && (
                      <div className="space-y-4">
                        <Separator />
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Your Role</h4>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-950">
                              {userRole.role === 'admin' ? (
                                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium capitalize">{userRole.role}</div>
                              <div className="text-sm text-muted-foreground">
                                {userRole.can_manage_users ? 'Can manage team members' : 'Limited to viewing and managing data'}
                                {userRole.can_manage_billing && ', Can manage billing'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payout Account Wizard */}
        {showWizard && (
          <PayoutAccountWizard
            onSuccess={handleWizardSuccess}
            onCancel={() => setShowWizard(false)}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Settings;
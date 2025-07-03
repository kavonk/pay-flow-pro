import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Shield, Edit3, Download, Calendar, DollarSign } from 'lucide-react';
import { UserSubscriptionResponse, StripeBillingHistoryResponse } from 'types';

export interface BillingCardProps {
  subscription: UserSubscriptionResponse;
  billingHistory?: StripeBillingHistoryResponse[];
  onUpdatePaymentMethod?: () => void;
  onDownloadInvoice?: (billingId: string) => void;
  isLoadingBilling?: boolean;
}

const BillingCard: React.FC<BillingCardProps> = ({
  subscription,
  billingHistory = [],
  onUpdatePaymentMethod,
  onDownloadInvoice,
  isLoadingBilling = false
}) => {
  const hasPaymentMethod = subscription.card_last_four && subscription.card_brand;
  
  // Debug logging to understand what we're getting
  console.log('BillingCard received:', {
    billingHistory,
    billingHistoryType: typeof billingHistory,
    isArray: Array.isArray(billingHistory),
    length: billingHistory?.length
  });
  
  // Ensure billingHistory is always an array
  const safeBillingHistory = Array.isArray(billingHistory) ? billingHistory : [];
  
  const formatAmount = (amount: number | string, currency: string = 'EUR') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `€${numAmount.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'succeeded':
        return <Badge variant="default" className="bg-emerald-500">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAutoChargeInfo = () => {
    if (subscription.is_trial && subscription.trial_days_remaining > 0) {
      return (
        <div className="text-right">
          <p className="text-sm font-medium text-orange-400">€35/month</p>
          <p className="text-xs text-muted-foreground">Auto-charge amount</p>
        </div>
      );
    }
    return null;
  };

  const getPaymentMethodDescription = () => {
    if (subscription.is_trial) {
      return `Will be charged automatically when trial ends in ${subscription.trial_days_remaining} days`;
    }
    return 'Used for your subscription billing';
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Section */}
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Payment Method
              </CardTitle>
              {onUpdatePaymentMethod && (
                <Button variant="outline" size="sm" onClick={onUpdatePaymentMethod}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Update Method
                </Button>
              )}
            </div>
            <CardDescription>
              {getPaymentMethodDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPaymentMethod ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">
                      {subscription.card_brand?.toUpperCase()} ending in {subscription.card_last_four}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Secured by Stripe SSL encryption
                    </p>
                  </div>
                </div>
                {getAutoChargeInfo()}
              </div>
            ) : (
              <div className="text-center py-6">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No payment method on file</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscription.is_trial 
                    ? 'Add a payment method to ensure seamless transition when your trial ends'
                    : 'Add a payment method to manage your subscription'
                  }
                </p>
                {onUpdatePaymentMethod && (
                  <Button className="mt-3" onClick={onUpdatePaymentMethod}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Billing History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-500" />
            Billing History
          </CardTitle>
          <CardDescription>
            View and download your billing history and invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBilling ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {safeBillingHistory.slice(0, 5).map((billing, index) => (
                <div key={billing.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-950">
                      <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatAmount(billing.amount, billing.currency)}
                        </span>
                        {getStatusBadge(billing.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date(billing.payment_date).toLocaleDateString()}</span>
                        {billing.description && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{billing.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {billing.status.toLowerCase() === 'paid' && onDownloadInvoice && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDownloadInvoice(billing.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Invoice
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {safeBillingHistory.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
                    View All History
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingCard;
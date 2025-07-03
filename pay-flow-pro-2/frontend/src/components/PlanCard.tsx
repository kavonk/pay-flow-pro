import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, CreditCard, Crown, Star, Zap } from 'lucide-react';
import { SubscriptionPlanResponse } from 'types';

export interface PlanCardProps {
  plan: SubscriptionPlanResponse;
  currentPlanSlug?: string;
  billingCycle: 'monthly' | 'yearly';
  isUpgrading?: boolean;
  showMostPopular?: boolean;
  onUpgrade?: (planSlug: string, billingCycle: 'monthly' | 'yearly') => void;
  onContactSales?: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentPlanSlug,
  billingCycle,
  isUpgrading = false,
  showMostPopular = false,
  onUpgrade,
  onContactSales
}) => {
  const isCurrent = currentPlanSlug === plan.slug;
  const isHigherTier = currentPlanSlug && (
    (currentPlanSlug === 'trial' && plan.slug !== 'trial') ||
    (currentPlanSlug === 'basic' && ['premium', 'enterprise'].includes(plan.slug)) ||
    (currentPlanSlug === 'premium' && plan.slug === 'enterprise')
  );
  const isLowerTier = currentPlanSlug && (
    (currentPlanSlug === 'premium' && plan.slug === 'basic') ||
    (currentPlanSlug === 'enterprise' && ['basic', 'premium'].includes(plan.slug))
  );

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'trial': return <Zap className="w-6 h-6 text-amber-500" />;
      case 'basic': return <CreditCard className="w-6 h-6 text-blue-500" />;
      case 'premium': return <Crown className="w-6 h-6 text-purple-500" />;
      case 'enterprise': return <Star className="w-6 h-6 text-emerald-500" />;
      default: return <CreditCard className="w-6 h-6" />;
    }
  };

  const formatPrice = () => {
    const monthlyPrice = typeof plan.price_monthly === 'string' ? parseFloat(plan.price_monthly) : plan.price_monthly;
    
    if (monthlyPrice === 0 || isNaN(monthlyPrice)) {
      return <div className="text-2xl font-bold">Free</div>;
    }

    if (billingCycle === 'yearly' && plan.price_yearly && plan.price_yearly > 0) {
      const yearlyPrice = typeof plan.price_yearly === 'string' ? parseFloat(plan.price_yearly) : plan.price_yearly;
      const monthlyEquivalent = yearlyPrice / 12;
      return (
        <div className="space-y-1">
          <div className="text-2xl font-bold">
            €{monthlyEquivalent.toFixed(0)}
            <span className="text-sm font-normal text-muted-foreground">/month</span>
          </div>
          <div className="text-sm text-emerald-600">
            Billed yearly (€{yearlyPrice.toFixed(0)})
          </div>
          <div className="text-xs text-emerald-600">
            Save {plan.yearly_discount_percentage.toFixed(0)}%
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-2xl font-bold">
        €{monthlyPrice.toFixed(0)}
        <span className="text-sm font-normal text-muted-foreground">/month</span>
      </div>
    );
  };

  const getCardClassName = () => {
    let baseClass = 'relative transition-all duration-200 hover:shadow-lg';
    
    if (isCurrent) {
      baseClass += ' ring-2 ring-primary';
    }
    
    switch (plan.slug) {
      case 'basic':
        return `${baseClass} border-blue-200 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:border-blue-800`;
      case 'premium':
        return `${baseClass} border-purple-200 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 dark:border-purple-800`;
      case 'enterprise':
        return `${baseClass} border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:border-emerald-800`;
      default:
        return baseClass;
    }
  };

  const handleActionClick = () => {
    if (plan.slug === 'enterprise' && onContactSales) {
      onContactSales();
    } else if (onUpgrade && !isCurrent) {
      onUpgrade(plan.slug, billingCycle);
    }
  };

  const getActionButton = () => {
    if (isCurrent) {
      return (
        <Button disabled className="w-full">
          Current Plan
        </Button>
      );
    }

    if (plan.slug === 'enterprise') {
      return (
        <Button variant="outline" className="w-full" onClick={handleActionClick}>
          Contact Sales
        </Button>
      );
    }

    if (isHigherTier) {
      return (
        <Button 
          onClick={handleActionClick}
          disabled={isUpgrading}
          className="w-full"
        >
          {isUpgrading ? 'Processing...' : `Upgrade to ${plan.name}`}
        </Button>
      );
    }

    if (isLowerTier) {
      return (
        <Button 
          variant="outline" 
          className="w-full" 
          disabled
        >
          Contact Support to Downgrade
        </Button>
      );
    }

    return (
      <Button 
        onClick={handleActionClick}
        disabled={isUpgrading}
        variant="outline"
        className="w-full"
      >
        {isUpgrading ? 'Processing...' : `Select ${plan.name}`}
      </Button>
    );
  };

  return (
    <Card className={getCardClassName()}>
      {showMostPopular && plan.slug === 'premium' && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-purple-600 text-white">Most Popular</Badge>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          {getPlanIcon(plan.slug)}
          <div>
            <CardTitle className="flex items-center gap-2">
              {plan.name}
              {isCurrent && <Badge variant="secondary">Current</Badge>}
            </CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          {formatPrice()}
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h4 className="font-medium">Features included:</h4>
          <ul className="space-y-1.5">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          {plan.max_invoices_per_month && (
            <p className="text-sm text-muted-foreground mt-2">
              Up to {plan.max_invoices_per_month} invoices per month
            </p>
          )}
          
          {plan.max_customers && (
            <p className="text-sm text-muted-foreground">
              Up to {plan.max_customers} customers
            </p>
          )}
          
          <p className="text-sm text-muted-foreground">
            {plan.transaction_fee_percentage}% transaction fee
          </p>
        </div>
        
        <div className="pt-4">
          {getActionButton()}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanCard;
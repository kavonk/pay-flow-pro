import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUserGuardContext } from 'app/auth';
import { toast } from 'sonner';
import EnterpriseContactDialog from 'components/EnterpriseContactDialog';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useUserGuardContext();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleChoosePlan = (planSlug: string) => {
    if (planSlug === 'enterprise') {
      // Enterprise contact dialog will handle this
      return;
    }
    
    // Redirect to subscription page with selected plan
    navigate(`/subscription?plan=${planSlug}&billing=${billingPeriod}`);
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Perfect for getting started with basic invoicing',
      features: [
        'Up to 10 invoices/month',
        '1 seat included',
        'Basic email reminders',
        'Pay Now QR codes',
        'Stripe integration',
        '3.7% transaction fee'
      ],
      limits: {
        invoices: '10/month',
        seats: '1',
        customers: 'Unlimited',
        storage: '1GB'
      },
      cta: 'Get Started Free',
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 15,
      yearlyPrice: 150, // 16.7% discount
      description: 'Everything Free, plus mobile payments and bulk operations',
      features: [
        'Up to 100 invoices/month',
        '3 seats included',
        'Mobile app payments',
        'Bulk-send up to 10 invoices',
        'Advanced email templates',
        'Priority email support',
        '3.4% transaction fee'
      ],
      limits: {
        invoices: '100/month',
        seats: '3',
        customers: 'Unlimited',
        storage: '5GB'
      },
      cta: 'Start Free Trial',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 35,
      yearlyPrice: 350, // 16.7% discount
      description: 'All Starter features, plus recurring billing and custom branding',
      features: [
        'Unlimited invoices',
        '10 seats included',
        'True recurring billing',
        'Custom branding (emails/PDFs)',
        'Advanced analytics & reporting',
        'API access',
        'Priority support',
        '3.2% transaction fee'
      ],
      limits: {
        invoices: 'Unlimited',
        seats: '10',
        customers: 'Unlimited',
        storage: '25GB'
      },
      cta: 'Start Free Trial',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: null,
      yearlyPrice: null,
      description: 'All Pro features, plus dedicated support and white-label options',
      features: [
        'Everything in Pro, plus',
        'Unlimited seats',
        'Dedicated account manager',
        'White-label & custom domain',
        'Premium API & integrations',
        'SLA guarantees',
        'Custom contracts',
        '3.0-3.1% transaction fee'
      ],
      limits: {
        invoices: 'Unlimited',
        seats: 'Unlimited',
        customers: 'Unlimited',
        storage: 'Unlimited'
      },
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const comparisonFeatures = [
    {
      category: 'Invoicing',
      features: [
        { name: 'Invoice creation & sending', free: true, starter: true, pro: true, enterprise: true },
        { name: 'Stripe payment links', free: true, starter: true, pro: true, enterprise: true },
        { name: 'Pay Now QR codes', free: true, starter: true, pro: true, enterprise: true },
        { name: 'Mobile app payments', free: false, starter: true, pro: true, enterprise: true },
        { name: 'Recurring billing', free: false, starter: false, pro: true, enterprise: true },
        { name: 'Bulk invoice sending', free: false, starter: '10 at once', pro: 'Unlimited', enterprise: 'Unlimited' }
      ]
    },
    {
      category: 'Branding & Customization',
      features: [
        { name: 'Default email templates', free: true, starter: true, pro: true, enterprise: true },
        { name: 'Custom branding', free: false, starter: false, pro: true, enterprise: true },
        { name: 'White-label option', free: false, starter: false, pro: false, enterprise: true },
        { name: 'Custom domain', free: false, starter: false, pro: false, enterprise: true }
      ]
    },
    {
      category: 'Analytics & Reporting',
      features: [
        { name: 'Basic dashboard', free: true, starter: true, pro: true, enterprise: true },
        { name: 'Advanced analytics', free: false, starter: false, pro: true, enterprise: true },
        { name: 'Custom reports', free: false, starter: false, pro: false, enterprise: true },
        { name: 'Data export', free: 'CSV', starter: 'CSV', pro: 'CSV + Excel', enterprise: 'All formats' }
      ]
    },
    {
      category: 'Support & Integration',
      features: [
        { name: 'Email support', free: 'Standard', starter: 'Priority', pro: 'Priority', enterprise: 'Dedicated' },
        { name: 'API access', free: false, starter: false, pro: 'Standard', enterprise: 'Premium' },
        { name: 'Webhooks', free: false, starter: false, pro: true, enterprise: true },
        { name: 'SLA guarantee', free: false, starter: false, pro: false, enterprise: '99.9%' }
      ]
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    if (!plan.monthlyPrice) return 'Custom';
    if (billingPeriod === 'yearly' && plan.yearlyPrice) {
      return `€${(plan.yearlyPrice / 12).toFixed(0)}`;
    }
    return `€${plan.monthlyPrice}`;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (!plan.monthlyPrice || !plan.yearlyPrice) return 0;
    return Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Pricing Plans</h1>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your business. Start free, upgrade as you grow.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <Tabs value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as 'monthly' | 'yearly')} className="w-auto">
              <TabsList className="bg-gray-800 border border-gray-700">
                <TabsTrigger value="monthly" className="data-[state=active]:bg-purple-600">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="data-[state=active]:bg-purple-600">
                  Yearly 
                  <Badge variant="secondary" className="ml-2 bg-green-600 text-white text-xs">
                    Save 17%
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
          {plans.map((plan) => {
            const savings = getSavings(plan);
            return (
              <Card
                key={plan.id}
                className={`relative transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? "border-2 border-purple-500 bg-gray-800/50 shadow-2xl shadow-purple-500/20"
                    : "border border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2">
                      MOST POPULAR
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                  
                  <div className="text-center">
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-4xl font-bold">{getPrice(plan)}</span>
                      {plan.monthlyPrice !== null && (
                        <span className="text-gray-400 text-lg ml-1">/{billingPeriod === 'yearly' ? 'month' : 'month'}</span>
                      )}
                    </div>
                    {billingPeriod === 'yearly' && savings > 0 && (
                      <div className="text-sm text-green-400">
                        Save {savings}% annually
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="px-6 pb-8">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={16} />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.id === 'enterprise' ? (
                    <EnterpriseContactDialog>
                      <Button
                        className={`w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300 ${
                          plan.popular
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                            : "bg-white text-gray-900 hover:bg-gray-200"
                        }`}
                      >
                        {plan.cta}
                      </Button>
                    </EnterpriseContactDialog>
                  ) : (
                    <Button
                      className={`w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300 ${
                        plan.popular
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                          : "bg-white text-gray-900 hover:bg-gray-200"
                      }`}
                      onClick={() => handleChoosePlan(plan.id)}
                    >
                      {plan.cta}
                    </Button>
                  )}
                  
                  {plan.id !== 'enterprise' && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                      14-day free trial • Cancel anytime
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">Feature Comparison</h3>
          
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-6 font-semibold">Features</th>
                    <th className="text-center p-6 font-semibold">Free</th>
                    <th className="text-center p-6 font-semibold">Starter</th>
                    <th className="text-center p-6 font-semibold bg-purple-600/20">Pro</th>
                    <th className="text-center p-6 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category) => (
                    <React.Fragment key={category.category}>
                      <tr className="border-b border-gray-700">
                        <td colSpan={5} className="p-4 bg-gray-900 font-semibold text-purple-400">
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-4 text-gray-300">{feature.name}</td>
                          <td className="p-4 text-center">
                            {typeof feature.free === 'boolean' ? (
                              feature.free ? (
                                <CheckCircle className="text-green-500 mx-auto" size={20} />
                              ) : (
                                <X className="text-gray-500 mx-auto" size={20} />
                              )
                            ) : (
                              <span className="text-sm text-gray-400">{feature.free}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {typeof feature.starter === 'boolean' ? (
                              feature.starter ? (
                                <CheckCircle className="text-green-500 mx-auto" size={20} />
                              ) : (
                                <X className="text-gray-500 mx-auto" size={20} />
                              )
                            ) : (
                              <span className="text-sm text-gray-400">{feature.starter}</span>
                            )}
                          </td>
                          <td className="p-4 text-center bg-purple-600/10">
                            {typeof feature.pro === 'boolean' ? (
                              feature.pro ? (
                                <CheckCircle className="text-green-500 mx-auto" size={20} />
                              ) : (
                                <X className="text-gray-500 mx-auto" size={20} />
                              )
                            ) : (
                              <span className="text-sm text-gray-400">{feature.pro}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {typeof feature.enterprise === 'boolean' ? (
                              feature.enterprise ? (
                                <CheckCircle className="text-green-500 mx-auto" size={20} />
                              ) : (
                                <X className="text-gray-500 mx-auto" size={20} />
                              )
                            ) : (
                              <span className="text-sm text-gray-400">{feature.enterprise}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Transaction Fee Structure */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-8 text-purple-400">Transaction Fee Structure</h3>
          <p className="text-center text-gray-400 mb-12 max-w-4xl mx-auto">
            Our transaction fees cover Stripe's payment processing costs plus our service fee. 
            Fees are calculated per transaction and billed monthly. Higher plans enjoy lower rates.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="text-center">
                <Badge className="bg-gray-700 text-gray-300 mb-2">FREE</Badge>
                <CardTitle className="text-lg">3.7% per transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Stripe fee:</span>
                    <span>2.9% + €0.30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Our markup:</span>
                    <span>+0.8%</span>
                  </div>
                  <div className="flex justify-between font-medium text-white border-t border-gray-700 pt-2">
                    <span>Total rate:</span>
                    <span>3.7% + €0.30</span>
                  </div>
                  <div className="text-center mt-4 p-2 bg-gray-700 rounded">
                    <div className="text-xs text-gray-400">Example: €100 payment</div>
                    <div className="font-medium text-white">€4.00 total fee</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="text-center">
                <Badge className="bg-blue-600 text-white mb-2">STARTER</Badge>
                <CardTitle className="text-lg">3.4% per transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Stripe fee:</span>
                    <span>2.9% + €0.30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Our markup:</span>
                    <span>+0.5%</span>
                  </div>
                  <div className="flex justify-between font-medium text-white border-t border-gray-700 pt-2">
                    <span>Total rate:</span>
                    <span>3.4% + €0.30</span>
                  </div>
                  <div className="text-center mt-4 p-2 bg-gray-700 rounded">
                    <div className="text-xs text-gray-400">Example: €100 payment</div>
                    <div className="font-medium text-white">€3.70 total fee</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-purple-500 border-2">
              <CardHeader className="text-center">
                <Badge className="bg-purple-600 text-white mb-2">PRO</Badge>
                <CardTitle className="text-lg">3.2% per transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Stripe fee:</span>
                    <span>2.9% + €0.30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Our markup:</span>
                    <span>+0.3%</span>
                  </div>
                  <div className="flex justify-between font-medium text-white border-t border-gray-700 pt-2">
                    <span>Total rate:</span>
                    <span>3.2% + €0.30</span>
                  </div>
                  <div className="text-center mt-4 p-2 bg-purple-600/20 rounded">
                    <div className="text-xs text-purple-300">Example: €100 payment</div>
                    <div className="font-medium text-white">€3.50 total fee</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="text-center">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white mb-2">ENTERPRISE</Badge>
                <CardTitle className="text-lg">3.0-3.1% per transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Stripe fee:</span>
                    <span>2.9% + €0.30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Our markup:</span>
                    <span>+0.1-0.2%</span>
                  </div>
                  <div className="flex justify-between font-medium text-white border-t border-gray-700 pt-2">
                    <span>Total rate:</span>
                    <span>3.0-3.1% + €0.30</span>
                  </div>
                  <div className="text-center mt-4 p-2 bg-gray-700 rounded">
                    <div className="text-xs text-gray-400">Example: €100 payment</div>
                    <div className="font-medium text-white">€3.30 total fee</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 p-6 bg-blue-950/30 border border-blue-800 rounded-xl max-w-4xl mx-auto">
            <h4 className="text-lg font-semibold text-blue-300 mb-3">How Transaction Fees Work</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-200">
              <div>
                <strong>• Monthly Billing:</strong> Fees are calculated for each successful payment and billed monthly on the 1st
              </div>
              <div>
                <strong>• Transparent Pricing:</strong> See exact fees before creating each invoice
              </div>
              <div>
                <strong>• No Hidden Costs:</strong> What you see is what you pay - no surprise fees
              </div>
              <div>
                <strong>• Lower Rates:</strong> Higher-tier plans get preferential transaction rates
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-8">Frequently Asked Questions</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="text-left">
              <h4 className="text-xl font-semibold mb-3 text-purple-400">Can I change plans anytime?</h4>
              <p className="text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.
              </p>
            </div>
            
            <div className="text-left">
              <h4 className="text-xl font-semibold mb-3 text-purple-400">What payment methods do you accept?</h4>
              <p className="text-gray-400">
                We accept all major credit cards, SEPA Direct Debit, and ACH transfers through our secure Stripe integration.
              </p>
            </div>
            
            <div className="text-left">
              <h4 className="text-xl font-semibold mb-3 text-purple-400">Is there a free trial?</h4>
              <p className="text-gray-400">
                All paid plans come with a 14-day free trial. No credit card required to start, and you can cancel anytime.
              </p>
            </div>
            
            <div className="text-left">
              <h4 className="text-xl font-semibold mb-3 text-purple-400">What about transaction fees?</h4>
              <p className="text-gray-400">
                Transaction fees vary by plan and decrease as you upgrade. These cover payment processing costs and are clearly shown before checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, ArrowLeft, Building2, Calendar, Crown, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useUser } from '@stackframe/react';
import { toast } from 'sonner';
import EnterpriseContactDialog from 'components/EnterpriseContactDialog';
import { useSubscription } from 'utils/useSubscription';

const Pricing = () => {
  const navigate = useNavigate();
  const user = useUser(); // Can be null for non-authenticated users
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { subscription } = useSubscription();
  
  // Get current plan slug for comparison (only if user is authenticated)
  const currentPlanSlug = user ? subscription?.plan?.slug : null;

  const handleChoosePlan = (planSlug: string) => {
    if (planSlug === 'enterprise') {
      // Enterprise contact dialog will handle this
      return;
    }
    
    // If user is not authenticated, redirect to signup/login first
    if (!user) {
      navigate(`/signup?plan=${planSlug}&billing=${billingPeriod}`);
      return;
    }
    
    // Redirect to subscription page with selected plan
    navigate(`/subscription?plan=${planSlug}&billing=${billingPeriod}`);
  };

  // 4 self-serve tiers only (Enterprise handled separately below)
  const plans = [
    {
      id: 'free',
      name: 'Free Trial',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Perfect for getting started with full feature access',
      features: [
        'Full access to all features',
        'Unlimited invoices',
        'Custom branding',
        'Recurring billing',
        'Automated reminders',
        'Priority support',
        '14-day trial period'
      ],
      limits: {
        invoices: 'Unlimited (trial)',
        seats: 'Unlimited (trial)',
        customers: 'Unlimited',
        storage: 'Unlimited (trial)'
      },
      cta: 'Start Free Trial',
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 15,
      yearlyPrice: 150, // 16.7% discount
      description: 'Perfect for small businesses just getting started',
      features: [
        'Up to 100 invoices/month',
        '3 seats included',
        'Mobile-optimized payments',
        'Basic CRM features',
        'Email reminders',
        'Standard support',
        '2.9% + €0.30 transaction fee'
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
      description: 'Perfect for growing businesses that need more features',
      features: [
        'Unlimited invoices',
        '10 seats included',
        'Recurring billing',
        'Custom branding (logo, colors)',
        'Advanced analytics',
        'Priority email support',
        '2.7% + €0.30 transaction fee'
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
      id: 'business',
      name: 'Business',
      monthlyPrice: 59,
      yearlyPrice: 590, // 16.7% discount
      description: 'Perfect for scaling businesses that need API access',
      features: [
        'Everything in Pro, plus',
        '20 seats included',
        'API access & webhooks',
        'Bulk operations',
        'Advanced integrations',
        'Priority support (4hr SLA)',
        '2.5% + €0.30 transaction fee'
      ],
      limits: {
        invoices: 'Unlimited',
        seats: '20',
        customers: 'Unlimited',
        storage: '100GB'
      },
      cta: 'Start Free Trial',
      popular: false
    }
  ];

  // Enterprise plan data for separate section
  const enterprisePlan = {
    features: [
      'Everything in Business, plus',
      'Unlimited seats',
      'Dedicated account manager',
      'White-label & custom domain',
      'Premium API & integrations',
      'SLA guarantees',
      'Custom contracts',
      'Volume pricing negotiations'
    ]
  };

  const comparisonFeatures = [
    {
      category: 'Invoicing',
      features: [
        { name: 'Invoice creation & sending', free: true, starter: true, pro: true, business: true },
        { name: 'Stripe payment links', free: true, starter: true, pro: true, business: true },
        { name: 'Pay Now QR codes', free: true, starter: true, pro: true, business: true },
        { name: 'Mobile payments (mobile-optimized)', free: false, starter: true, pro: true, business: true },
        { name: 'Recurring billing', free: false, starter: false, pro: true, business: true },
        { name: 'Bulk invoice sending', free: false, starter: false, pro: false, business: 'Unlimited' },
        { name: 'Invoice limits', free: 'Unlimited (trial)', starter: '100/month', pro: 'Unlimited', business: 'Unlimited' }
      ]
    },
    {
      category: 'Branding & Customization',
      features: [
        { name: 'Default email templates', free: true, starter: true, pro: true, business: true },
        { name: 'Custom branding (logo, colors)', free: false, starter: false, pro: true, business: true },
        { name: 'Custom email templates', free: false, starter: false, pro: true, business: true },
        { name: 'PDF customization', free: false, starter: false, pro: true, business: true }
      ]
    },
    {
      category: 'Team & Access',
      features: [
        { name: 'User seats included', free: 'Unlimited (trial)', starter: '3 seats', pro: '10 seats', business: '20 seats' },
        { name: 'Role-based permissions', free: true, starter: true, pro: true, business: true },
        { name: 'Team collaboration', free: true, starter: true, pro: true, business: true }
      ]
    },
    {
      category: 'Analytics & Reporting',
      features: [
        { name: 'Basic dashboard', free: true, starter: true, pro: true, business: true },
        { name: 'Advanced analytics', free: false, starter: false, pro: true, business: true },
        { name: 'Customer insights', free: false, starter: false, pro: true, business: true },
        { name: 'Revenue reports', free: false, starter: false, pro: true, business: true }
      ]
    },
    {
      category: 'Support & Integration',
      features: [
        { name: 'Email support', free: 'Standard', starter: 'Standard', pro: 'Priority', business: 'Priority (4hr SLA)' },
        { name: 'API access', free: false, starter: false, pro: false, business: true },
        { name: 'Webhooks', free: false, starter: false, pro: false, business: true },
        { name: 'Advanced integrations', free: false, starter: false, pro: false, business: true }
      ]
    },
    {
      category: 'Transaction Fees',
      features: [
        { name: 'Processing fee rate', free: '2.9% + €0.30', starter: '2.9% + €0.30', pro: '2.7% + €0.30', business: '2.5% + €0.30' },
        { name: 'No setup fees', free: true, starter: true, pro: true, business: true },
        { name: 'No hidden costs', free: true, starter: true, pro: true, business: true }
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
    <div data-stack-public-page className="min-h-screen bg-gray-900 text-white">
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
                  
                  <Button
                    className={`w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300 ${
                      plan.popular
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                        : "bg-white text-gray-900 hover:bg-gray-200"
                    }`}
                    onClick={() => handleChoosePlan(plan.id)}
                    disabled={currentPlanSlug === plan.id || (currentPlanSlug === 'free' && plan.id === 'free')}
                  >
                    {currentPlanSlug === plan.id || (currentPlanSlug === 'free' && plan.id === 'free') ? 'Current Plan' : plan.cta}
                  </Button>
                  
                  {plan.id === 'free' && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                      14-day free trial • All features included
                    </p>
                  )}
                  {plan.id !== 'free' && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                      14-day free trial • Cancel anytime
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enterprise Section - Sales Only */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Need more than Business?</h3>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Enterprise solutions with custom pricing, white-labeling, and dedicated support.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500/30 shadow-2xl">
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-center mb-4">
                      <Crown className="w-8 h-8 text-purple-400 mr-3" />
                      <h4 className="text-2xl font-bold text-white">Enterprise</h4>
                    </div>
                    
                    <p className="text-gray-300 mb-6">
                      Custom pricing, white-labeling, dedicated support, and enterprise features 
                      tailored to your business needs.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {enterprisePlan.features.map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <EnterpriseContactDialog>
                        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg">
                          <Building2 className="w-5 h-5 mr-2" />
                          Contact Sales
                        </Button>
                      </EnterpriseContactDialog>
                      
                      <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10 px-8 py-3 rounded-xl">
                        <Calendar className="w-5 h-5 mr-2" />
                        Schedule Demo
                      </Button>
                    </div>
                  </div>
                  
                  <div className="lg:text-center">
                    <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-6 border border-purple-500/30">
                      <h5 className="text-lg font-semibold text-white mb-4">Perfect for:</h5>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-center">
                          <Users className="w-4 h-4 text-purple-400 mr-2" />
                          Companies with 200+ employees
                        </li>
                        <li className="flex items-center">
                          <TrendingUp className="w-4 h-4 text-purple-400 mr-2" />
                          High-volume invoice processing
                        </li>
                        <li className="flex items-center">
                          <Shield className="w-4 h-4 text-purple-400 mr-2" />
                          Custom compliance requirements
                        </li>
                        <li className="flex items-center">
                          <Zap className="w-4 h-4 text-purple-400 mr-2" />
                          Complex integration needs
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                    <th className="text-center p-6 font-semibold">Free Trial</th>
                    <th className="text-center p-6 font-semibold">Starter</th>
                    <th className="text-center p-6 font-semibold bg-purple-600/20">Pro</th>
                    <th className="text-center p-6 font-semibold">Business</th>
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
                            {typeof feature.business === 'boolean' ? (
                              feature.business ? (
                                <CheckCircle className="text-green-500 mx-auto" size={20} />
                              ) : (
                                <X className="text-gray-500 mx-auto" size={20} />
                              )
                            ) : (
                              <span className="text-sm text-gray-400">{feature.business}</span>
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
                <Badge className="bg-gray-700 text-gray-300 mb-2">FREE TRIAL</Badge>
                <CardTitle className="text-lg">2.9% per transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Stripe fee:</span>
                    <span>2.9% + €0.30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Our markup:</span>
                    <span>€0.00</span>
                  </div>
                  <div className="flex justify-between font-medium text-white border-t border-gray-700 pt-2">
                    <span>Total rate:</span>
                    <span>2.9% + €0.30</span>
                  </div>
                  <div className="text-center mt-4 p-2 bg-gray-700 rounded">
                    <div className="text-xs text-gray-400">Example: €100 payment</div>
                    <div className="font-medium text-white">€3.20 total fee</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="text-center">
                <Badge className="bg-blue-600 text-white mb-2">STARTER</Badge>
                <CardTitle className="text-lg">2.9% per transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Stripe fee:</span>
                    <span>2.9% + €0.30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Our markup:</span>
                    <span>€0.00</span>
                  </div>
                  <div className="flex justify-between font-medium text-white border-t border-gray-700 pt-2">
                    <span>Total rate:</span>
                    <span>2.9% + €0.30</span>
                  </div>
                  <div className="text-center mt-4 p-2 bg-gray-700 rounded">
                    <div className="text-xs text-gray-400">Example: €100 payment</div>
                    <div className="font-medium text-white">€3.20 total fee</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-purple-500 border-2">
              <CardHeader className="text-center">
                <Badge className="bg-purple-600 text-white mb-2">PRO</Badge>
                <CardTitle className="text-lg">2.7% per transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Stripe fee:</span>
                    <span>2.9% + €0.30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Our markup:</span>
                    <span>-0.2% (discount)</span>
                  </div>
                  <div className="flex justify-between font-medium text-white border-t border-gray-700 pt-2">
                    <span>Total rate:</span>
                    <span>2.7% + €0.30</span>
                  </div>
                  <div className="text-center mt-4 p-2 bg-purple-600/20 rounded">
                    <div className="text-xs text-purple-300">Example: €100 payment</div>
                    <div className="font-medium text-white">€3.00 total fee</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="text-center">
                <Badge className="bg-green-600 text-white mb-2">BUSINESS</Badge>
                <CardTitle className="text-lg">2.5% per transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Stripe fee:</span>
                    <span>2.9% + €0.30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Our markup:</span>
                    <span>-0.4% (discount)</span>
                  </div>
                  <div className="flex justify-between font-medium text-white border-t border-gray-700 pt-2">
                    <span>Total rate:</span>
                    <span>2.5% + €0.30</span>
                  </div>
                  <div className="text-center mt-4 p-2 bg-green-600/20 rounded">
                    <div className="text-xs text-green-300">Example: €100 payment</div>
                    <div className="font-medium text-white">€2.80 total fee</div>
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
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Get answers to common questions about PayFlow Pro
            </p>
          </div>
          
          <Tabs defaultValue="billing" className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="billing">Billing & Pricing</TabsTrigger>
              <TabsTrigger value="features">Features & Trial</TabsTrigger>
              <TabsTrigger value="technical">Technical & Security</TabsTrigger>
              <TabsTrigger value="support">Support & Policies</TabsTrigger>
            </TabsList>
            
            <TabsContent value="billing">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="trial-details">
                  <AccordionTrigger>How does the 14-day free trial work?</AccordionTrigger>
                  <AccordionContent>
                    <p>Your 14-day free trial gives you full access to all Professional plan features with no limitations. You can create unlimited invoices, customers, and dunning rules. No credit card is required to start your trial. After 14 days, you'll need to choose a paid plan to continue using PayFlow Pro.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="trial-expiry">
                  <AccordionTrigger>What happens when my trial expires?</AccordionTrigger>
                  <AccordionContent>
                    <p>When your trial expires, your account will be restricted to read-only access. You'll still be able to view your data, but you won't be able to create new invoices, send reminders, or process payments until you upgrade to a paid plan. Your data is safely preserved and immediately accessible once you upgrade.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="payment-fees">
                  <AccordionTrigger>What are the payment processing fees?</AccordionTrigger>
                  <AccordionContent>
                    <p>PayFlow Pro uses Stripe for payment processing. Standard Stripe fees apply: 2.9% + 30¢ for card payments in the US, with similar rates globally. SEPA Direct Debit is 0.8% (capped at €5). These fees are collected directly by Stripe, not by PayFlow Pro. You keep 100% of your revenue minus only the payment processor fees.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="billing-cycle">
                  <AccordionTrigger>When am I billed and can I change my plan?</AccordionTrigger>
                  <AccordionContent>
                    <p>You're billed monthly or annually based on your chosen plan. You can upgrade, downgrade, or cancel your subscription at any time from your account settings. Changes take effect at the next billing cycle, and we provide prorated refunds for downgrades.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="enterprise-pricing">
                  <AccordionTrigger>How does Enterprise pricing work?</AccordionTrigger>
                  <AccordionContent>
                    <p>Enterprise pricing is custom-tailored based on your specific needs, transaction volume, and required features like white-labeling, dedicated support, and custom integrations. Contact our sales team for a personalized quote. Most Enterprise customers see significant cost savings at scale.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="features">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="invoice-limits">
                  <AccordionTrigger>Are there any limits on invoices or customers?</AccordionTrigger>
                  <AccordionContent>
                    <p>Professional and Enterprise plans have no limits on the number of invoices, customers, or transactions you can process. The Free Trial also has no limits during the 14-day period. You can scale your business without worrying about hitting usage caps.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="dunning-automation">
                  <AccordionTrigger>How does automated dunning work?</AccordionTrigger>
                  <AccordionContent>
                    <p>Our dunning system automatically sends payment reminders based on rules you configure. Set up multiple reminder sequences (e.g., due date, +3 days, +7 days, +14 days) via email and SMS. Reminders automatically stop when payment is received. You can customize message templates and timing for your brand.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="payment-methods">
                  <AccordionTrigger>What payment methods are supported?</AccordionTrigger>
                  <AccordionContent>
                    <p>We support all major credit and debit cards (Visa, Mastercard, American Express), SEPA Direct Debit for European customers, ACH transfers for US customers, and digital wallets like Apple Pay and Google Pay. All payments are processed securely through Stripe.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="branding-customization">
                  <AccordionTrigger>Can I customize invoices with my branding?</AccordionTrigger>
                  <AccordionContent>
                    <p>Yes! Upload your company logo, customize color themes, and add your business information to all invoices and payment pages. Professional plan includes basic branding, while Enterprise offers full white-labeling including custom domains and removing PayFlow Pro branding entirely.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="multi-currency">
                  <AccordionTrigger>Do you support multiple currencies?</AccordionTrigger>
                  <AccordionContent>
                    <p>Yes, we support over 135 currencies through Stripe. You can create invoices in your local currency and accept payments in the same currency. Currency conversion is handled automatically for international customers when needed.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="recurring-billing">
                  <AccordionTrigger>Can I set up recurring invoices and subscriptions?</AccordionTrigger>
                  <AccordionContent>
                    <p>Yes! Professional and Enterprise plans support recurring billing. Set up weekly, monthly, quarterly, or annual invoices that are automatically generated and sent to your customers. Perfect for subscription businesses, retainers, or regular service billing.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="technical">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="data-security">
                  <AccordionTrigger>How secure is my data?</AccordionTrigger>
                  <AccordionContent>
                    <p>We employ bank-level security with AES-256 encryption at rest and TLS 1.3 in transit. All payment data is processed through PCI DSS Level 1 certified Stripe infrastructure. We never store sensitive payment information on our servers. Regular security audits and penetration testing ensure your data stays protected.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="gdpr-compliance">
                  <AccordionTrigger>Are you GDPR compliant?</AccordionTrigger>
                  <AccordionContent>
                    <p>Yes, PayFlow Pro is fully GDPR compliant. We provide data processing agreements, support data portability requests, and offer tools for data deletion. You maintain full control over your customer data with built-in privacy controls and audit logs.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="data-export">
                  <AccordionTrigger>Can I export my data?</AccordionTrigger>
                  <AccordionContent>
                    <p>Absolutely! Export your customers, invoices, payments, and audit logs in CSV format at any time. We believe in data portability - your data belongs to you. Enterprise customers also get access to our API for automated data synchronization.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="api-access">
                  <AccordionTrigger>Do you provide API access?</AccordionTrigger>
                  <AccordionContent>
                    <p>API access is available for Enterprise customers, allowing you to integrate PayFlow Pro with your existing systems. Our REST API supports all major operations including invoice creation, payment tracking, and customer management. Rate limits and documentation are provided.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="uptime-reliability">
                  <AccordionTrigger>What's your uptime guarantee?</AccordionTrigger>
                  <AccordionContent>
                    <p>We maintain 99.9% uptime with redundant infrastructure and automated failover systems. Our status page provides real-time monitoring, and we offer SLA guarantees for Enterprise customers. All critical systems are monitored 24/7.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="integrations">
                  <AccordionTrigger>What integrations do you offer?</AccordionTrigger>
                  <AccordionContent>
                    <p>PayFlow Pro integrates with Stripe for payments, supports webhook notifications for real-time updates, and offers API access for Enterprise customers. We also provide export capabilities for popular accounting software like QuickBooks and Xero. Custom integrations are available for Enterprise plans.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="support">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="support-response">
                  <AccordionTrigger>How quickly do you respond to support requests?</AccordionTrigger>
                  <AccordionContent>
                    <p>Professional plan customers receive email support with response times within 24 hours for general inquiries and 4 hours for critical issues. Enterprise customers get priority support with 1-hour response times and optional phone support. Our support team operates across multiple time zones.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="setup-assistance">
                  <AccordionTrigger>Do you help with setup and onboarding?</AccordionTrigger>
                  <AccordionContent>
                    <p>Yes! We provide guided onboarding for all new users, including setup assistance for Stripe integration, invoice templates, and dunning rules. Enterprise customers receive dedicated onboarding support and training sessions for their team.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="custom-domain">
                  <AccordionTrigger>Can I use my own domain for payment pages?</AccordionTrigger>
                  <AccordionContent>
                    <p>Custom domains are available for Enterprise customers, allowing you to host payment pages on your own subdomain (e.g., pay.yourcompany.com). This provides a seamless branded experience for your customers and can improve conversion rates.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="cancellation-policy">
                  <AccordionTrigger>What's your cancellation policy?</AccordionTrigger>
                  <AccordionContent>
                    <p>You can cancel your subscription at any time with no penalties or fees. Your service continues until the end of your current billing period. We provide full data export capabilities so you can take your data with you. No questions asked, though we'd love to hear how we can improve.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="migration-help">
                  <AccordionTrigger>Can you help migrate from my current invoicing system?</AccordionTrigger>
                  <AccordionContent>
                    <p>Absolutely! We offer migration assistance for customers switching from other invoicing platforms. Our team can help import your customer data, invoice history, and set up your account to match your current workflows. Enterprise customers receive white-glove migration support.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="white-label">
                  <AccordionTrigger>What does white-labeling include?</AccordionTrigger>
                  <AccordionContent>
                    <p>Enterprise white-labeling removes all PayFlow Pro branding from invoices, payment pages, and emails. You can use your own domain, customize all templates, and present the solution as your own. Perfect for agencies, resellers, or businesses wanting a seamless brand experience.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="team-management">
                  <AccordionTrigger>Can I add team members to my account?</AccordionTrigger>
                  <AccordionContent>
                    <p>Yes! Professional and Enterprise plans support team collaboration. Add team members with different permission levels - from view-only access to full administrative rights. Track who made changes with our comprehensive audit logs.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
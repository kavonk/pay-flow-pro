import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { stackClientApp } from 'app/auth';
import brain from 'brain';
import { StartTrialRequest } from 'types';
import { API_URL } from 'app';
import { useQueryClient } from '@tanstack/react-query';
import { subscriptionQueryKeys } from 'utils/useSubscription';
import { preloadStripe, stripePreloadPromise } from 'utils/performance';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, CheckCircle, ArrowLeft, Users, Clock, Info, Shield, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Use preloaded Stripe instead of loading on-demand
const getStripePromise = async () => {
  // First try to use preloaded Stripe
  if (stripePreloadPromise) {
    try {
      return await stripePreloadPromise;
    } catch (error) {
      console.warn('Preloaded Stripe failed, falling back to on-demand loading:', error);
    }
  }
  
  // Fallback to on-demand loading if preloading failed
  return preloadStripe();
};

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  termsConsent: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSignupComplete: (user: any, cardData: any) => void;
  isAdminFlow: boolean;
  invitationToken?: string;
  stripeLoading?: boolean;
  loadingInvitation?: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSignupComplete, isAdminFlow, invitationToken, stripeLoading = false, loadingInvitation = false }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [cardDetails, setCardDetails] = useState<{brand?: string, last4?: string} | null>(null);
  // Show subtle loading indicator for Stripe instead of blocking
  const isStripeReady = stripe && elements && !stripeLoading;

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });

  // Testing function to auto-fill form
  const fillTestData = () => {
    const testData = {
      firstName: 'John',
      lastName: 'Doe', 
      email: `test${Math.floor(Math.random() * 10000)}@example.com`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };
    
    form.setValue('firstName', testData.firstName);
    form.setValue('lastName', testData.lastName);
    form.setValue('email', testData.email);
    form.setValue('password', testData.password);
    form.setValue('confirmPassword', testData.confirmPassword);
    setTermsConsent(true);
    
    toast.success('Form filled with test data! Use card: 4242 4242 4242 4242');
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!stripe || !elements) {
      toast.error('Payment system is still loading. Please wait a moment and try again.');
      return;
    }

    if (!cardComplete && isStripeReady) {
      toast.error('Please complete your card information.');
      return;
    }

    if (!termsConsent) {
      toast.error('Please accept the terms of service and privacy policy.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create account with Stack Auth
      const result = await stackClientApp.signUpWithCredential({
        email: data.email,
        password: data.password,
      });

      if (!result.user) {
        throw new Error('Failed to create account');
      }

      let cardData = null;

      // Step 2: Handle payment method (required for all signups)
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email: data.email,
        },
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message || 'Failed to process card information');
      }

      if (!paymentMethod) {
        throw new Error('No payment method created');
      }

      // Extract card information for the backend
      cardData = {
        stripe_customer_id: null, // Will be created on backend
        payment_method_id: paymentMethod.id,
        card_last_four: paymentMethod.card?.last4 || '',
        card_brand: paymentMethod.card?.brand || '',
      };

      onSignupComplete(result.user, cardData);

    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937', // Dark text that works on light backgrounds
        backgroundColor: 'transparent',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        '::placeholder': {
          color: '#6b7280', // Gray for placeholders
        },
        ':-webkit-autofill': {
          color: '#1f2937',
        },
      },
      invalid: {
        color: '#ef4444', // Red for errors
        iconColor: '#ef4444',
      },
      complete: {
        color: '#059669', // Green when complete
        iconColor: '#059669',
      },
    },
    hidePostalCode: true,
  };

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('');
      return true;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]/)) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { text: 'Weak', color: 'text-red-500', bg: 'bg-red-500' };
      case 2: return { text: 'Fair', color: 'text-orange-500', bg: 'bg-orange-500' };
      case 3: return { text: 'Good', color: 'text-purple-500', bg: 'bg-purple-500' };
      case 4: return { text: 'Strong', color: 'text-purple-600', bg: 'bg-purple-600' };
      case 5: return { text: 'Excellent', color: 'text-purple-700', bg: 'bg-purple-700' };
      default: return { text: '', color: '', bg: '' };
    }
  };
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 200;
      setShowStickyBar(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="space-y-6">
      {/* Sticky Pricing Bar */}
      {showStickyBar && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 text-sm font-medium">
            <Lock className="h-4 w-4" />
            <span>Start your 14-day free trial — €35/mo after</span>
            <Clock className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Pricing Summary Header */}
      <div className="text-center space-y-3 mb-6">
        <Badge className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 text-lg font-semibold shadow-lg">
          <Clock className="h-5 w-5 mr-2" />
          14-Day Free Trial → €35/mo thereafter
        </Badge>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          No setup fees • Cancel anytime • Full access during trial
        </p>
      </div>
      <Form {...form}>
        {/* Testing Button - Remove in production */}
        <div className="mb-4">
          <Button 
            type="button"
            variant="outline"
            size="sm"
            onClick={fillTestData}
            className="w-full text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700 dark:hover:bg-yellow-800"
          >
            🧪 Fill Test Data (Use card: 4242 4242 4242 4242)
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John" 
                      {...field} 
                      className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Doe" 
                      {...field} 
                      className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="john@company.com" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      validateEmail(e.target.value);
                    }}
                    className={`bg-white dark:bg-gray-800 border-2 ${
                      emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
                    } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 h-11`}
                  />
                </FormControl>
                {emailError && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      const strength = calculatePasswordStrength(e.target.value);
                      setPasswordStrength(strength);
                    }}
                    className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 h-11"
                  />
                </FormControl>
                {field.value && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${getPasswordStrengthText(passwordStrength).bg}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${getPasswordStrengthText(passwordStrength).color}`}>
                        {getPasswordStrengthText(passwordStrength).text}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Use 8+ characters with mix of letters, numbers & symbols
                    </p>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field} 
                    className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Card Information - Required for all signups */}
          <div className="space-y-4">
            <FormLabel className="text-base font-semibold">Payment Information *</FormLabel>
            
            {/* Security Badge */}
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">SSL Secured</span>
                </div>
                <div className="h-4 w-px bg-purple-300"></div>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">PCI Compliant</span>
              </div>
              <a href="#" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Privacy Policy →
              </a>
            </div>
            
            {/* Apple Pay / Google Pay / Card Elements */}
            <div className="space-y-4">
              {/* Apple Pay / Google Pay Button */}
              {paymentRequest && (
                <div className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-950/50">
                  <PaymentRequestButtonElement 
                    options={{
                      paymentRequest,
                      style: {
                        paymentRequestButton: {
                          type: 'default',
                          theme: 'dark',
                          height: '48px',
                        },
                      },
                    }}
                  />
                  <div className="flex items-center my-3">
                    <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                    <span className="px-3 text-sm text-gray-500 dark:text-gray-400">or pay with card</span>
                    <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                </div>
              )}
              
              {/* Card Input with Enhanced Visibility */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  💳 Payment Method *
                  {stripeLoading && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                      (Loading...)
                    </span>
                  )}
                </label>
                <div className="p-4 border-2 border-gray-800 dark:border-gray-300 rounded-lg bg-white dark:bg-gray-800 focus-within:border-purple-600 dark:focus-within:border-purple-400 transition-all duration-200 min-h-[48px] flex items-center">
                  <div className="w-full">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#000000', // Black text for maximum visibility
                            backgroundColor: 'transparent',
                            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                            '::placeholder': {
                              color: '#9ca3af', // Lighter placeholder for dark theme
                            },
                          },
                          invalid: {
                            color: '#ef4444',
                          },
                          complete: {
                            color: '#059669',
                          },
                        }
                      }}
                      onChange={(event) => {
                        setCardComplete(event.complete);
                        // Store card details when complete for preview
                        if (event.complete && event.brand && event.last4) {
                          setCardDetails({
                            brand: event.brand,
                            last4: event.last4
                          });
                        } else {
                          setCardDetails(null);
                        }
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Secured by{' '}
                  <a 
                    href="https://stripe.com/docs/security" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 underline"
                  >
                    Stripe
                  </a>
                </p>
              </div>
            </div>
            
            {/* Payment Method Summary */}
            {cardComplete && cardDetails && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-purple-800 dark:text-purple-200">
                    Payment Method: {cardDetails.brand?.toUpperCase()} ending in {cardDetails.last4}
                  </span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  This card will be charged €35/month after your 14-day trial ends
                </p>
              </div>
            )}
            
            {/* Consent Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms-consent"
                  checked={termsConsent}
                  onCheckedChange={(checked) => setTermsConsent(checked === true)}
                  className="mt-1"
                />
                <label
                  htmlFor="terms-consent"
                  className="text-sm leading-5 cursor-pointer"
                >
                  I agree to the{' '}
                  <a 
                    href="https://stripe.com/legal/ssa" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 underline"
                  >
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a 
                    href="https://stripe.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 underline"
                  >
                    Privacy Policy
                  </a>
                  , including automatic billing of €35/month after the trial period
                </label>
              </div>
            </div>

          </div>

          {/* Member Invitation Info */}
          {!isAdminFlow && invitationToken && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                You're creating an account to join an existing PayFlow Pro team.
                Payment information is required for auto-billing when trial ends.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-200" 
            disabled={loading || (!cardComplete && isStripeReady) || !termsConsent || stripeLoading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Account...
              </div>
            ) : isAdminFlow ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {cardComplete && cardDetails ? 
                  `Start Trial with ${cardDetails.brand?.toUpperCase()} ••••${cardDetails.last4}` : 
                  'Create Account & Start Free Trial'
                }
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Create Account & Join Team
              </div>
            )}
          </Button>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            By creating an account, you'll have immediate access to all PayFlow Pro features for 14 days.
          </p>
        </form>
      </Form>
    </div>
  );
};

interface SignupProps {}

const Signup: React.FC<SignupProps> = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [signupComplete, setSignupComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);
  
  // Check for invitation token
  const invitationToken = searchParams.get('token');
  const isAdminFlow = !invitationToken;

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        // Use preloaded Stripe for instant availability
        const promise = await getStripePromise();
        setStripePromise(promise);
        
        // Initialize Payment Request for Apple Pay / Google Pay
        const stripe = await promise;
        if (stripe) {
          try {
            const pr = stripe.paymentRequest({
              country: 'US', // Changed from 'EU' to valid country code
              currency: 'eur',
              total: {
                label: 'PayFlow Pro Trial',
                amount: 0, // Trial is free
              },
              requestPayerName: true,
              requestPayerEmail: true,
            });
            
            // Check if Payment Request is available
            const result = await pr.canMakePayment();
            if (result) {
              setPaymentRequest(pr);
              console.log('Payment Request API is available:', result);
            } else {
              console.log('Payment Request API not available on this device/browser');
            }
          } catch (prError) {
            console.log('Payment Request initialization failed:', prError);
            // This is expected on unsupported devices/browsers
          }
        }
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        toast.error('Failed to load payment system. Please refresh and try again.');
        // Block signup if Stripe fails to load since card is mandatory
        setStripePromise(null);
      } finally {
        setStripeLoading(false);
      }
    };

    initializeStripe();
  }, []);

  // Load invitation data if token is present
  useEffect(() => {
    const loadInvitationData = async () => {
      if (!invitationToken) return;
      
      setLoadingInvitation(true);
      try {
        // For now, we'll just store the token
        // In a real implementation, you might validate the token first
        setInvitationData({ token: invitationToken, valid: true });
      } catch (error) {
        console.error('Failed to load invitation:', error);
        toast.error('Invalid invitation link');
        navigate('/');
      } finally {
        setLoadingInvitation(false);
      }
    };

    loadInvitationData();
  }, [invitationToken, navigate]);

  const handleSignupComplete = async (user: any, cardData: any) => {
    setLoading(true);
    
    try {
      // All signups now require card data and trial setup
      if (!cardData || !cardData.payment_method_id) {
        throw new Error('Payment method is required for all signups');
      }
      
      const trialRequest: StartTrialRequest = {
        payment_method_id: cardData.payment_method_id,
        card_last_four: cardData.card_last_four,
        card_brand: cardData.card_brand,
        plan_slug: searchParams.get('plan') || undefined,
      };

      // Wait for Stack Auth session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retry trial creation with exponential backoff
      let attempts = 0;
      const maxAttempts = 3;
      let trialCreated = false;
      
      while (attempts < maxAttempts && !trialCreated) {
        try {
          await brain.start_trial(trialRequest);
          trialCreated = true;
          
          // Invalidate subscription cache to ensure fresh data is loaded
          queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
          console.log('Trial created successfully, subscription cache invalidated');
          
          toast.success('Account created and trial started!');
          
          // Brief delay to ensure cache refresh completes
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (trialError: any) {
          attempts++;
          console.log(`Trial creation attempt ${attempts} failed:`, trialError);
          
          if (attempts < maxAttempts) {
            // Wait before retrying (exponential backoff: 1s, 2s, 4s)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
          } else {
            // All attempts failed - this is now a critical error for ALL users
            console.error('Failed to start trial after all attempts:', trialError);
            throw new Error('Failed to start trial. Please try again or contact support.');
          }
        }
      }

      // Handle team invitation if present (after trial is set up)
      if (!isAdminFlow && invitationToken) {
        try {
          const response = await brain.accept_invitation({
            token: invitationToken
          });
          
          if (response.ok) {
            toast.success('Successfully joined the team!');
          } else {
            const error = await response.json();
            console.error('Failed to accept invitation:', error);
            // Don't fail the whole flow for this
          }
        } catch (inviteError) {
          console.error('Failed to accept invitation:', inviteError);
          // Don't fail the whole flow for this
        }
      }
      
      setSignupComplete(true);
      
      // Redirect to dashboard after a brief success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error: any) {
      console.error('Signup completion error:', error);
      toast.error('Account created but failed to complete setup. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (signupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-gray-800/50 border-gray-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">
              {isAdminFlow ? 'Welcome to PayFlow Pro!' : 'Welcome to the Team!'}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {isAdminFlow 
                ? 'Your account has been created and your 14-day free trial has started.'
                : 'Your account has been created and you\'ve joined the team.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {isAdminFlow ? (
              <div className="space-y-2">
                <Badge variant="secondary" className="bg-green-600 text-white">
                  14-Day Free Trial Active
                </Badge>
                <p className="text-sm text-gray-400">
                  You have full access to all features. Cancel anytime during your trial.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  Team Member
                </Badge>
                <p className="text-sm text-gray-400">
                  You now have access to your team's PayFlow Pro workspace.
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }





  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={handleBackToHome}
            className="absolute top-6 left-6 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">PayFlow Pro</h1>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            {isAdminFlow ? 'Start Your 14-Day Free Trial' : 'Start Your 14-Day Free Trial'}
          </h2>
          <p className="text-gray-400 mb-4">
            {isAdminFlow 
              ? 'Full access to all Premium features. Auto-converts to Premium Plan (€35/month) after trial.'
              : 'Join your team and get full access to all Premium features. Auto-converts to Premium Plan (€35/month) after trial.'
            }
          </p>
          
          {/* Admin Flow Info */}
          {isAdminFlow && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-blue-200 text-sm">
                <Clock className="w-4 h-4" />
                <span className="font-medium">What happens after 14 days:</span>
              </div>
              <ul className="mt-2 space-y-1 text-blue-100 text-sm">
                <li>• Automatically converts to Premium Plan (€35/month)</li>
                <li>• Same card on file will be charged monthly</li>
                <li>• Cancel anytime with 1-click</li>
                <li>• No interruption to your service</li>
              </ul>
            </div>
          )}
          
          {/* Member Flow Info */}
          {!isAdminFlow && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-green-200 text-sm">
                <Users className="w-4 h-4" />
                <span className="font-medium">Team Member Signup:</span>
              </div>
              <ul className="mt-2 space-y-1 text-green-100 text-sm">
                <li>• Payment information required for auto-billing</li>
                <li>• Join existing team workspace</li>
                <li>• Access shared customers and invoices</li>
                <li>• Start collaborating immediately</li>
                <li>• Auto-converts to Premium Plan (€35/month) after trial</li>
              </ul>
            </div>
          )}
        </div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Create Your Account</CardTitle>
            <CardDescription className="text-center text-gray-300">
              Enter your details and payment information to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Show form immediately, handle Stripe loading in background */}
            <Elements stripe={stripePromise}>
              <SignupForm 
                onSignupComplete={handleSignupComplete} 
                isAdminFlow={isAdminFlow}
                invitationToken={invitationToken}
                stripeLoading={stripeLoading}
                loadingInvitation={loadingInvitation}
              />
            </Elements>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-400">
            ✓ No charges during 14-day trial
            <br />
            ✓ Auto-converts to Premium Plan (€35/month) after trial
            <br />
            ✓ Cancel anytime, no questions asked
            <br />
            ✓ All premium features included from day 1
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

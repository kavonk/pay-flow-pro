import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Building2, User, CreditCard, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import type { CreatePayoutAccountRequest, Representative, BusinessProfile, BankAccount } from 'types';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

interface WizardData {
  businessType: string;
  country: string;
  representative: Partial<Representative>;
  businessProfile: Partial<BusinessProfile>;
  bankAccount: Partial<BankAccount>;
}

const MERCHANT_CATEGORIES = [
  { value: '5969', label: 'E-commerce / Online Retail' },
  { value: '5734', label: 'Software / SaaS' },
  { value: '7392', label: 'Consulting Services' },
  { value: '7399', label: 'Business Services' },
  { value: '8931', label: 'Accounting / Bookkeeping' },
  { value: '7372', label: 'IT Services / Development' },
  { value: '5999', label: 'Other Retail' },
];

const COUNTRIES = [
  { value: 'IE', label: 'Ireland' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
];

const CURRENCIES = {
  'IE': 'eur',
  'US': 'usd',
  'GB': 'gbp',
  'DE': 'eur',
  'FR': 'eur',
};

export const PayoutAccountWizard: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessType: 'individual',
    country: 'IE',
    representative: {},
    businessProfile: {},
    bankAccount: {},
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const updateData = (section: keyof WizardData, updates: any) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(data.businessType && data.country);
      case 2:
        const rep = data.representative;
        return !!(rep.first_name && rep.last_name && rep.email && rep.phone &&
                 rep.address_line1 && rep.address_city && rep.address_postal_code &&
                 rep.address_country && rep.dob_day && rep.dob_month && rep.dob_year);
      case 3:
        const biz = data.businessProfile;
        return !!(biz.name && biz.mcc && biz.product_description);
      case 4:
        const bank = data.bankAccount;
        return !!(bank.account_number && bank.routing_number && bank.account_holder_name);
      default:
        return false;
    }
  };

  const getStepErrors = (step: number): string[] => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!data.businessType) errors.push('Business type is required');
        if (!data.country) errors.push('Country is required');
        break;
      case 2:
        const rep = data.representative;
        if (!rep.first_name) errors.push('First name is required');
        if (!rep.last_name) errors.push('Last name is required');
        if (!rep.email) errors.push('Email is required');
        if (rep.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rep.email)) errors.push('Valid email is required');
        if (!rep.phone) errors.push('Phone number is required');
        if (!rep.address_line1) errors.push('Address is required');
        if (!rep.address_city) errors.push('City is required');
        if (!rep.address_postal_code) errors.push('Postal code is required');
        if (!rep.address_country) errors.push('Address country is required');
        if (!rep.dob_day || isNaN(rep.dob_day) || rep.dob_day < 1 || rep.dob_day > 31) errors.push('Valid birth day (1-31) is required');
        if (!rep.dob_month || isNaN(rep.dob_month) || rep.dob_month < 1 || rep.dob_month > 12) errors.push('Valid birth month (1-12) is required');
        if (!rep.dob_year || isNaN(rep.dob_year) || rep.dob_year < 1900 || rep.dob_year > new Date().getFullYear() - 18) errors.push('You must be at least 18 years old');
        break;
      case 3:
        const biz = data.businessProfile;
        if (!biz.name) errors.push('Business name is required');
        if (!biz.mcc) errors.push('Business category is required');
        if (!biz.product_description) errors.push('Product description is required');
        // URL validation - if provided, must be valid
        if (biz.url && biz.url.trim() !== '') {
          try {
            new URL(biz.url);
          } catch {
            errors.push('Please enter a valid URL (e.g., https://example.com) or leave empty');
          }
        }
        break;
      case 4:
        const bank = data.bankAccount;
        if (!bank.account_holder_name) errors.push('Account holder name is required');
        if (!bank.account_number) errors.push('Account number is required');
        if (!bank.routing_number) errors.push('Routing/sort code is required');
        break;
    }
    
    return errors;
  };

  const nextStep = () => {
    const errors = getStepErrors(currentStep);
    if (errors.length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      errors.forEach(error => toast.error(error));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Safe data validation and construction
  const validateAndBuildRequestData = (): CreatePayoutAccountRequest | null => {
    const rep = data.representative;
    const biz = data.businessProfile;
    const bank = data.bankAccount;

    // Validate representative data
    if (!rep.first_name || !rep.last_name || !rep.email || !rep.phone ||
        !rep.address_line1 || !rep.address_city || !rep.address_postal_code ||
        !rep.dob_day || !rep.dob_month || !rep.dob_year) {
      toast.error('Missing required representative information');
      return null;
    }

    // Validate business profile data
    if (!biz.name || !biz.mcc || !biz.product_description) {
      toast.error('Missing required business information');
      return null;
    }

    // Validate bank account data
    if (!bank.account_number || !bank.routing_number || !bank.account_holder_name) {
      toast.error('Missing required bank account information');
      return null;
    }

    // Safely construct the request data
    return {
      business_type: data.businessType,
      country: data.country,
      representative: {
        first_name: rep.first_name,
        last_name: rep.last_name,
        email: rep.email,
        phone: rep.phone,
        address_line1: rep.address_line1,
        address_city: rep.address_city,
        address_postal_code: rep.address_postal_code,
        address_country: data.country,
        address_state: rep.address_state || undefined,
        dob_day: rep.dob_day,
        dob_month: rep.dob_month,
        dob_year: rep.dob_year,
      },
      business_profile: {
        name: biz.name,
        mcc: biz.mcc,
        product_description: biz.product_description,
        url: biz.url || undefined,
      },
      bank_account: {
        account_number: bank.account_number,
        routing_number: bank.routing_number,
        account_holder_name: bank.account_holder_name,
        country: data.country,
        currency: CURRENCIES[data.country as keyof typeof CURRENCIES],
      },
    };
  };

  const handleSubmit = async () => {
    const errors = getStepErrors(4);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      // Safely validate and build request data
      const requestData = validateAndBuildRequestData();
      if (!requestData) {
        setLoading(false);
        return;
      }

      // Log the validated data for debugging
      console.log('Creating payout account with validated data:', {
        business_type: requestData.business_type,
        country: requestData.country,
        representative_fields: Object.keys(requestData.representative),
        business_profile_fields: Object.keys(requestData.business_profile),
        bank_account_fields: Object.keys(requestData.bank_account),
      });
      
      // Make API call - let errors propagate to main error handler
      const response = await brain.create_payout_account(requestData);
      
      if (response.ok) {
        try {
          const successData = await response.json();
          console.log('Payout account created successfully:', successData);
          toast.success('Payout account created successfully! You can now receive payouts.');
          onSuccess();
        } catch (jsonError) {
          console.error('Error parsing success response:', jsonError);
          toast.success('Payout account created successfully!');
          onSuccess();
        }
      } else {
        console.error('Payout account creation failed:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        
        let errorMessage = 'Failed to create payout account';
        let errorDetails = null;
        
        try {
          errorDetails = await response.json();
          console.error('Detailed error response:', errorDetails);
          
          // Handle different types of errors with enhanced logging
          if (response.status === 422 && errorDetails?.detail) {
            console.error('Validation errors detected:', errorDetails.detail);
            
            if (Array.isArray(errorDetails.detail)) {
              // Log each validation error for debugging
              errorDetails.detail.forEach((err: any, index: number) => {
                console.error(`Validation error ${index + 1}:`, {
                  field: err.loc,
                  message: err.msg,
                  input_value: err.input,
                });
              });
              
              // Show user-friendly validation errors
              const fieldErrors = errorDetails.detail.map((err: any) => {
                const field = err.loc?.slice(1).join('.') || 'Unknown field';
                const friendlyField = field.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
                return `${friendlyField}: ${err.msg}`;
              });
              
              fieldErrors.forEach(error => {
                console.error('Showing validation error to user:', error);
                toast.error(error);
              });
              return;
            } else {
              errorMessage = errorDetails.detail;
            }
          } else if (response.status === 400) {
            console.error('Bad request error:', errorDetails);
            errorMessage = errorDetails?.detail || 'Invalid account information provided';
          } else if (response.status === 409) {
            console.error('Conflict error - account exists:', errorDetails);
            errorMessage = 'A payout account already exists for this business';
          } else if (response.status === 500) {
            console.error('Server error:', errorDetails);
            errorMessage = 'Server error occurred. Please try again later';
          } else {
            console.error('Unexpected error status:', response.status, errorDetails);
            errorMessage = errorDetails?.detail || errorDetails?.message || 'Unexpected error occurred';
          }
        } catch (parseError) {
          console.error('Error parsing error response:', {
            parseError,
            status: response.status,
            statusText: response.statusText,
          });
          errorMessage = `Request failed with status ${response.status}. Please try again.`;
        }
        
        console.error('Showing error message to user:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      // Handle both Response objects from brain client and regular errors
      console.error('Unexpected error during payout account creation:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
      });
      
      // Check if this is a Response object from the brain client
      if (error && typeof error === 'object' && 'status' in error && 'json' in error) {
        console.log('Handling Response object error from brain client');
        const response = error as Response;
        
        let errorMessage = 'Failed to create payout account';
        try {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          
          if (response.status === 400) {
            errorMessage = errorData?.detail || 'Invalid account information provided';
          } else if (response.status === 422 && errorData?.detail) {
            if (Array.isArray(errorData.detail)) {
              // Show validation errors
              errorData.detail.forEach((err: any) => {
                const field = err.loc?.slice(1).join('.') || 'Unknown field';
                const friendlyField = field.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
                toast.error(`${friendlyField}: ${err.msg}`);
              });
              return;
            } else {
              errorMessage = errorData.detail;
            }
          } else if (response.status === 409) {
            errorMessage = 'A payout account already exists for this business';
          } else if (response.status === 500) {
            errorMessage = 'Server error occurred. Please try again later';
          } else {
            errorMessage = errorData?.detail || errorData?.message || 'Unexpected error occurred';
          }
        } catch (parseError) {
          console.error('Error parsing Response object:', parseError);
          errorMessage = `Request failed with status ${response.status}. Please try again.`;
        }
        
        console.error('Showing API error to user:', errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      // Handle regular Error objects
      let userMessage = 'An unexpected error occurred. Please try again.';
      
      try {
        if (error instanceof Error) {
          if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('connection')) {
            userMessage = 'Network error. Please check your connection and try again.';
          } else if (error.message.includes('JSON') || error.message.includes('parse')) {
            userMessage = 'Data processing error. Please try again.';
          } else if (error.message.includes('timeout')) {
            userMessage = 'Request timed out. Please try again.';
          } else if (error.message.length > 0 && error.message.length < 200) {
            // Only use the error message if it's reasonable length and not too technical
            const cleanMessage = error.message.replace(/^Error:\s*/, '').trim();
            if (!cleanMessage.includes('stack') && !cleanMessage.includes('undefined')) {
              userMessage = cleanMessage;
            }
          }
        }
      } catch (messageError) {
        console.error('Error while processing error message:', messageError);
        // Fall back to default message
      }
      
      console.error('Showing generic error to user:', userMessage);
      toast.error(userMessage);
    } finally {
      // Ensure loading state is always reset
      try {
        setLoading(false);
      } catch (finallyError) {
        console.error('Error in finally block:', finallyError);
        // Component state might be corrupted, but don't throw
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Business Information</h3>
                <p className="text-sm text-muted-foreground">Tell us about your business</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={data.businessType} onValueChange={(value) => updateData('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual / Sole Proprietor</SelectItem>
                    <SelectItem value="company">Company / Corporation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={data.country} onValueChange={(value) => updateData('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Representative Details</h3>
                <p className="text-sm text-muted-foreground">Information about the business representative</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={data.representative.first_name || ''}
                  onChange={(e) => updateData('representative', { first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={data.representative.last_name || ''}
                  onChange={(e) => updateData('representative', { last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.representative.email || ''}
                  onChange={(e) => updateData('representative', { email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={data.representative.phone || ''}
                  onChange={(e) => updateData('representative', { phone: e.target.value })}
                  placeholder="+353 1 234 5678"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Address Line 1 *</Label>
              <Input
                id="address"
                value={data.representative.address_line1 || ''}
                onChange={(e) => updateData('representative', { address_line1: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={data.representative.address_city || ''}
                  onChange={(e) => updateData('representative', { address_city: e.target.value })}
                  placeholder="Dublin"
                />
              </div>
              
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={data.representative.address_state || ''}
                  onChange={(e) => updateData('representative', { address_state: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              
              <div>
                <Label htmlFor="postal">Postal Code *</Label>
                <Input
                  id="postal"
                  value={data.representative.address_postal_code || ''}
                  onChange={(e) => updateData('representative', { address_postal_code: e.target.value })}
                  placeholder="D01 F5P2"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="addressCountry">Address Country *</Label>
              <Select 
                value={data.representative.address_country || data.country} 
                onValueChange={(value) => updateData('representative', { address_country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select address country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(country => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Date of Birth *</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Day"
                    min="1"
                    max="31"
                    value={data.representative.dob_day || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateData('representative', { dob_day: value ? parseInt(value) || undefined : undefined });
                    }}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Month"
                    min="1"
                    max="12"
                    value={data.representative.dob_month || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateData('representative', { dob_month: value ? parseInt(value) || undefined : undefined });
                    }}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Year"
                    min="1900"
                    max="2010"
                    value={data.representative.dob_year || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateData('representative', { dob_year: value ? parseInt(value) || undefined : undefined });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Business Profile</h3>
                <p className="text-sm text-muted-foreground">Details about your business operations</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={data.businessProfile.name || ''}
                onChange={(e) => updateData('businessProfile', { name: e.target.value })}
                placeholder="Your Business Name"
              />
            </div>
            
            <div>
              <Label htmlFor="mcc">Business Category *</Label>
              <Select value={data.businessProfile.mcc} onValueChange={(value) => updateData('businessProfile', { mcc: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your business category" />
                </SelectTrigger>
                <SelectContent>
                  {MERCHANT_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="website">Business Website</Label>
              <Input
                id="website"
                type="url"
                value={data.businessProfile.url || ''}
                onChange={(e) => updateData('businessProfile', { url: e.target.value })}
                placeholder="https://yourbusiness.com"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Product Description *</Label>
              <Textarea
                id="description"
                value={data.businessProfile.product_description || ''}
                onChange={(e) => updateData('businessProfile', { product_description: e.target.value })}
                placeholder="Describe what your business sells or the services you provide..."
                rows={4}
              />
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Bank Account</h3>
                <p className="text-sm text-muted-foreground">Where you'll receive your payouts</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="accountHolder">Account Holder Name *</Label>
              <Input
                id="accountHolder"
                value={data.bankAccount.account_holder_name || ''}
                onChange={(e) => updateData('bankAccount', { account_holder_name: e.target.value })}
                placeholder="Account holder name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountNumber">
                  {data.country === 'US' ? 'Account Number' : 
                   data.country === 'GB' ? 'Account Number (8 digits)' : 
                   'IBAN'} *
                </Label>
                <Input
                  id="accountNumber"
                  value={data.bankAccount.account_number || ''}
                  onChange={(e) => updateData('bankAccount', { account_number: e.target.value })}
                  placeholder={
                    data.country === 'US' ? '123456789' :
                    data.country === 'GB' ? '12345678' :
                    'IE29 AIBK 9311 5212 3456 78'
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="routingNumber">
                  {data.country === 'US' ? 'Routing Number (9 digits)' : 
                   data.country === 'GB' ? 'Sort Code (XX-XX-XX)' : 
                   'BIC/SWIFT Code'} *
                </Label>
                <Input
                  id="routingNumber"
                  value={data.bankAccount.routing_number || ''}
                  onChange={(e) => updateData('bankAccount', { routing_number: e.target.value })}
                  placeholder={
                    data.country === 'US' ? '123456789' :
                    data.country === 'GB' ? '12-34-56' :
                    'AIBKIE2D'
                  }
                />
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <FileCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Important Note</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    After creating your account, you'll be guided through Stripe's secure onboarding process to verify your identity and accept their Terms of Service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Set Up Payout Account</span>
          <span className="text-sm font-normal text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
        </CardTitle>
        <CardDescription>
          Complete your payout account setup to start receiving payments
        </CardDescription>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderStep()}
        
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : prevStep}
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>
          
          {currentStep < totalSteps ? (
            <Button onClick={nextStep} disabled={loading}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
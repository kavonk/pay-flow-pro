import AppLayout from "components/AppLayout";
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, FileText, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import brain from 'brain';
import { UpdateCustomerRequest, CustomerResponse } from 'types';
import { useUserGuardContext } from 'app/auth';
import { useCustomer } from 'utils/queryHooks';

const EditCustomerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('id');
  const { user } = useUserGuardContext();
  
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [formData, setFormData] = useState<UpdateCustomerRequest>({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Use React Query hook for customer data
  const { data: customerData, isLoading: customerLoading, error: customerError } = useCustomer(customerId || '');
  
  // Load customer data on component mount
  useEffect(() => {
    if (!customerId) {
      toast.error('Customer ID is required');
      navigate('/customers');
      return;
    }
  }, [customerId]);

  // Update form data when customer data loads
  useEffect(() => {
    if (customerData) {
      setCustomer(customerData);
      setFormData({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone || '',
        notes: customerData.notes || ''
      });
    }
  }, [customerData]);

  // Handle customer loading error
  useEffect(() => {
    if (customerError) {
      console.error('Failed to load customer:', customerError);
      toast.error('Failed to load customer');
      navigate('/customers');
    }
  }, [customerError, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Customer name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Customer name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email?.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    // Notes validation (optional but limit length)
    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = 'Notes must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare the request data
      const requestData: UpdateCustomerRequest = {
        name: formData.name?.trim(),
        email: formData.email?.trim(),
        phone: formData.phone?.trim() || undefined,
        notes: formData.notes?.trim() || undefined
      };

      const response = await brain.update_customer_endpoint(
        { customerId: customerId! },
        requestData
      );
      
      if (response.ok) {
        const updatedCustomer = await response.json();
        toast.success('Customer updated successfully!');
        navigate('/customers');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdateCustomerRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (customerLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Form Skeleton */}
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/customers')}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Edit Customer</h1>
          <p className="text-zinc-400 mt-2">
            Update {customer?.name}'s information and preferences
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="h-5 w-5 mr-2" />
            Customer Information
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Update the customer details below. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-300">
                    Customer Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter customer name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                    disabled={saving}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="customer@example.com"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 ${
                        errors.email ? 'border-red-500' : ''
                      }`}
                      disabled={saving}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-400">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-300">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4 w-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 ${
                      errors.phone ? 'border-red-500' : ''
                    }`}
                    disabled={saving}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-400">{errors.phone}</p>
                )}
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            {/* Notes Section */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-zinc-300 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any additional information about this customer..."
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className={`bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 resize-none ${
                  errors.notes ? 'border-red-500' : ''
                }`}
                disabled={saving}
              />
              <div className="flex justify-between items-center">
                {errors.notes && (
                  <p className="text-sm text-red-400">{errors.notes}</p>
                )}
                <p className="text-sm text-zinc-500 ml-auto">
                  {(formData.notes?.length || 0)}/1000 characters
                </p>
              </div>
            </div>

            {/* Customer Metadata */}
            {customer && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Customer Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Created:</span>
                    <span className="text-zinc-300 ml-2">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Last Updated:</span>
                    <span className="text-zinc-300 ml-2">
                      {new Date(customer.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/customers')}
                disabled={saving}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  );
};

export default EditCustomerPage;
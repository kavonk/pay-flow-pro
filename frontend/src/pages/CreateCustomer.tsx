import AppLayout from "components/AppLayout";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { useCreateCustomer } from 'utils/queryHooks';
import { CreateCustomerRequest } from 'types';
import { useUserGuardContext } from 'app/auth';

const CreateCustomerPage = () => {
  const navigate = useNavigate();
  const { user } = useUserGuardContext();
  const createCustomerMutation = useCreateCustomer();
  
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Customer name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
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

    // Prepare the request data
    const requestData: CreateCustomerRequest = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone?.trim() || undefined,
      notes: formData.notes?.trim() || undefined
    };

    createCustomerMutation.mutate(requestData, {
      onSuccess: () => {
        // Navigate immediately due to optimistic update
        navigate('/customers');
      }
    });
  };

  const handleInputChange = (field: keyof CreateCustomerRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight text-white">Add New Customer</h1>
            <p className="text-zinc-400 mt-2">
              Create a new customer profile to start managing invoices and payments
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
              Enter the customer details below. All fields marked with * are required.
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
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 ${
                        errors.name ? 'border-red-500' : ''
                      }`}
                      disabled={createCustomerMutation.isPending}
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
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 ${
                          errors.email ? 'border-red-500' : ''
                        }`}
                        disabled={createCustomerMutation.isPending}
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
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 ${
                        errors.phone ? 'border-red-500' : ''
                      }`}
                      disabled={createCustomerMutation.isPending}
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
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className={`bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 resize-none ${
                    errors.notes ? 'border-red-500' : ''
                  }`}
                  disabled={createCustomerMutation.isPending}
                />
                <div className="flex justify-between items-center">
                  {errors.notes && (
                    <p className="text-sm text-red-400">{errors.notes}</p>
                  )}
                  <p className="text-sm text-zinc-500 ml-auto">
                    {formData.notes?.length || 0}/1000 characters
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/customers')}
                  disabled={createCustomerMutation.isPending}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  {createCustomerMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Customer
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

export default CreateCustomerPage;
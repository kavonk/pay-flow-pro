import AppLayout from "components/AppLayout";
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@stackframe/react';
import { useCreateInvoice } from 'utils/queryHooks';
import brain from 'brain';
import {
  CustomersListResponse,
  CustomerResponse,
  CreateInvoiceRequest,
  FeePreviewResponse,
  InvoiceResponse
} from 'types';
import InvoiceActionsDrawer from 'components/InvoiceActionsDrawer';
import { usePayoutAccount, useUserRole } from 'utils/queryHooks';
import PayoutAccountRequiredModal from 'components/PayoutAccountRequiredModal';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { CustomerCombobox } from 'components/CustomerCombobox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Save, Info, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import LineItemTable from 'components/LineItemTable';
import InvoiceTotals from 'components/InvoiceTotals';
import InvoiceMetadata from 'components/InvoiceMetadata';
import { InvoiceFormData, createEmptyLineItem, calculateInvoiceTotals, COMMON_TAX_RATES } from 'utils/invoiceTypes';

const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0').max(999999, 'Quantity is too large'),
  unit_price: z.number().min(0, 'Unit price cannot be negative').max(999999.99, 'Unit price is too large'),
  tax_rate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%'),
  line_total: z.number(),
});

const formSchema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  invoice_number: z.string().min(1, 'Invoice number is required').max(50, 'Invoice number must be 50 characters or less'),
  currency: z.enum(['EUR', 'USD'], {
    required_error: 'Please select a currency',
  }),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  terms: z.string().max(2000, 'Terms must be 2000 characters or less').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  line_items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  invoice_wide_tax_rate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional(),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_value: z.number().min(0, 'Discount cannot be negative').optional(),
}).refine(
  (data) => new Date(data.due_date) >= new Date(data.issue_date),
  {
    message: 'Due date must be on or after issue date',
    path: ['due_date'],
  }
).refine(
  (data) => {
    // Validate line items have valid totals
    const hasValidLineItems = data.line_items.some(item => 
      item.quantity > 0 && item.unit_price >= 0 && item.description.trim().length > 0
    );
    return hasValidLineItems;
  },
  {
    message: 'At least one line item must have a description, quantity greater than 0, and valid pricing',
    path: ['line_items'],
  }
).refine(
  (data) => {
    // Validate discount value based on type
    if (data.discount_type && data.discount_value !== undefined) {
      if (data.discount_type === 'percentage' && data.discount_value > 100) {
        return false;
      }
      if (data.discount_type === 'fixed' && data.discount_value > 999999.99) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'Discount value is invalid for the selected discount type',
    path: ['discount_value'],
  }
);

type FormData = InvoiceFormData;

interface CreateInvoiceProps {}

const CreateInvoice: React.FC<CreateInvoiceProps> = () => {
  const { user } = useUser();
  
  if (!user) {
    return (
      <AppLayout>
        <div className="p-8">Loading...</div>
      </AppLayout>
    );
  }
  const navigate = useNavigate();
  const createInvoiceMutation = useCreateInvoice();
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [feePreview, setFeePreview] = useState<FeePreviewResponse | null>(null);
  const [lastAutosave, setLastAutosave] = useState<Date | null>(null);
  const [showActionsDrawer, setShowActionsDrawer] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<InvoiceResponse | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  
  // Payout account validation and user role
  const { data: payoutAccount, isLoading: payoutLoading } = usePayoutAccount();
  const { data: userRole } = useUserRole();
  const isPayoutActive = payoutAccount?.account_status === 'active';
  const isAdmin = userRole?.role === 'admin';
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      customer_id: '',
      invoice_number: '',
      currency: 'EUR',
      issue_date: new Date().toISOString().split('T')[0], // Today's date
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      description: '',
      terms: '',
      notes: '',
      line_items: [createEmptyLineItem()],
      invoice_wide_tax_rate: undefined,
      discount_type: undefined,
      discount_value: 0,
    },
  })

  // Watch form values for autosave and validation
  const watchedValues = form.watch();
  const { isValid, errors } = form.formState;
  
  // Calculate if form has meaningful content for button enabling
  const hasValidLineItems = watchedValues.line_items?.some(item => 
    item.description.trim().length > 0 && item.quantity > 0 && item.unit_price >= 0
  ) || false;
  
  const invoiceTotal = calculateInvoiceTotals(
    watchedValues.line_items || [],
    watchedValues.discount_type,
    watchedValues.discount_value,
    watchedValues.invoice_wide_tax_rate
  ).total;
  
  const isFormReadyForSubmit = isValid && hasValidLineItems && invoiceTotal > 0;
  
  // Autosave functionality
  const saveFormDraft = useCallback(async () => {
    if (isAutosaving) return;
    
    try {
      setIsAutosaving(true);
      const draftKey = `invoice_draft_${user.id}`;
      const draftData = {
        ...watchedValues,
        lastSaved: new Date().toISOString(),
      };
      
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setLastAutosave(new Date());
      
      toast.success('Draft saved automatically', {
        duration: 2000,
        position: 'bottom-right',
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsAutosaving(false);
    }
  }, [watchedValues, user.id, isAutosaving]);
  
  // Load draft on component mount
  useEffect(() => {
    const draftKey = `invoice_draft_${user.id}`;
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        const lastSaved = new Date(draftData.lastSaved);
        const now = new Date();
        const hoursSinceLastSave = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60);
        
        // Only restore if saved within last 24 hours
        if (hoursSinceLastSave < 24) {
          // Remove lastSaved before setting form values
          const { lastSaved: _, ...formData } = draftData;
          form.reset(formData);
          setLastAutosave(lastSaved);
          
          toast.info('Draft restored', {
            duration: 3000,
            position: 'bottom-right',
          });
        } else {
          // Remove old draft
          localStorage.removeItem(draftKey);
        }
      } catch (error) {
        console.error('Failed to restore draft:', error);
        localStorage.removeItem(draftKey);
      }
    }
  }, [user.id, form]);
  
  // Autosave timer - save every 15 seconds when form has changes
  useEffect(() => {
    const timer = setInterval(() => {
      if (form.formState.isDirty && !isAutosaving) {
        saveFormDraft();
      }
    }, 15000); // 15 seconds
    
    return () => clearInterval(timer);
  }, [saveFormDraft, form.formState.isDirty, isAutosaving]);


  useEffect(() => {
    const lineItems = form.watch('line_items') || [];
    const discountType = form.watch('discount_type');
    const discountValue = form.watch('discount_value');
    const invoiceWideTaxRate = form.watch('invoice_wide_tax_rate');
    const calculations = calculateInvoiceTotals(lineItems, discountType, discountValue, invoiceWideTaxRate);
    if (calculations.total > 0) {
      updateFeePreview(calculations.total);
    } else {
      setFeePreview(null);
    }
  }, [form.watch('line_items'), form.watch('discount_type'), form.watch('discount_value'), form.watch('invoice_wide_tax_rate')]);

  const updateFeePreview = async (amount: number) => {
    try {
      const response = await brain.get_fee_preview({ payment_amount: amount });
      if (response.ok) {
        const preview = await response.json();
        setFeePreview(preview);
      }
    } catch (error) {
      console.error('Failed to get fee preview:', error);
    }
  };

  // Check payout account on component mount
  useEffect(() => {
    if (!payoutLoading && !isPayoutActive) {
      setShowPayoutModal(true);
    }
  }, [payoutLoading, isPayoutActive]);

  const onSubmit = async (data: FormData) => {
    // Double-check payout account before submission
    if (!isPayoutActive) {
      setShowPayoutModal(true);
      return;
    }

    // Calculate total from line items
    const calculations = calculateInvoiceTotals(data.line_items, data.discount_type, data.discount_value, data.invoice_wide_tax_rate);

    const requestData: CreateInvoiceRequest = {
      customer_id: data.customer_id,
      amount: calculations.total,
      currency: data.currency,
      issue_date: data.issue_date,
      due_date: data.due_date,
      description: data.description || undefined,
      invoice_number: data.invoice_number || undefined,
      terms: data.terms || undefined,
      notes: data.notes || undefined,
    };

    createInvoiceMutation.mutate(requestData, {
      onSuccess: (invoice) => {
        // Clear the draft on successful submission
        const draftKey = `invoice_draft_${user.id}`;
        localStorage.removeItem(draftKey);
        setLastAutosave(null);
        
        // Store the created invoice and show actions drawer
        setCreatedInvoice(invoice);
        setShowActionsDrawer(true);
        
        toast.success('Invoice created successfully!');
      },
      onError: (error) => {
        console.error('Error creating invoice:', error);
        toast.error('Failed to create invoice. Please try again.');
      }
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/Invoices')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Invoice</CardTitle>
            <CardDescription>
              Create a new invoice with automatic Stripe payment link generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Selection */}
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <CustomerCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search or create a customer..."
                        disabled={payoutLoading}
                      />
                      <FormDescription>
                        Search for existing customers or create a new one inline.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Invoice Metadata */}
                <InvoiceMetadata form={form} />

                {/* Line Items */}
                <LineItemTable form={form} currency={form.watch('currency')} />

                {/* Invoice Totals */}
                <InvoiceTotals form={form} currency={form.watch('currency')} />

                {/* Currency Selection */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Issue Date and Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          The date when the invoice is issued
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          When payment is due
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Optional Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a brief description for this invoice (will appear on the invoice)"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description that will appear on the invoice for the customer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Terms */}
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms & Conditions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Payment is due within 30 days of invoice date. Thank you for your business!"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Standard terms and conditions that will appear on the invoice
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Internal Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any internal notes or special instructions (not visible to customer)"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Private notes for internal use only - will not appear on the customer invoice
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Configuration */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h3 className="text-sm font-medium">Tax & Discount Configuration</h3>
                  
                  <FormField
                    control={form.control}
                    name="invoice_wide_tax_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice-wide Tax Rate (optional)</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value === 'none' ? undefined : parseFloat(value));
                          }}
                          value={field.value !== undefined ? field.value.toString() : 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tax rate or use per-item rates" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Use per-item tax rates</SelectItem>
                            {COMMON_TAX_RATES.map((rate) => (
                              <SelectItem key={rate.value} value={rate.value.toString()}>
                                {rate.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Override per-item tax rates with a single rate for the entire invoice
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Discount Configuration */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="discount_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Type</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value === 'none' ? undefined : value);
                            }}
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="No discount" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No discount</SelectItem>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="fixed">Fixed amount</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discount_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Value</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={form.watch('discount_type') === 'percentage' ? '10' : '50.00'}
                              disabled={!form.watch('discount_type') || form.watch('discount_type') === 'none'}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            {form.watch('discount_type') === 'percentage' 
                              ? 'Enter percentage (e.g., 10 for 10%)' 
                              : `Enter fixed amount in ${form.watch('currency')}`
                            }
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>





                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/Invoices')}
                    disabled={createInvoiceMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createInvoiceMutation.isPending || 
                      !isPayoutActive || 
                      !isFormReadyForSubmit
                    }
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {createInvoiceMutation.isPending ? 'Creating Invoice...' : 'Create Invoice'}
                  </Button>
                  
                  {/* Form validation status indicator */}
                  {!isFormReadyForSubmit && (
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      {!isPayoutActive && payoutAccount && (
                        <p>• Complete payout account setup to create invoices</p>
                      )}
                      {!hasValidLineItems && (
                        <p>• Add at least one line item with description and quantity &gt; 0</p>
                      )}
                      {hasValidLineItems && invoiceTotal <= 0 && (
                        <p>• Invoice total must be greater than zero</p>
                      )}
                      {Object.keys(errors).length > 0 && (
                        <p>• Please fix the validation errors shown above</p>
                      )}
                    </div>
                  )}
                  
                  {/* Autosave indicator */}
                  {lastAutosave && (
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      {isAutosaving ? (
                        <>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          Saving draft...
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Last saved {lastAutosave.toLocaleTimeString()}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Simplified Fee Display */}
                {feePreview && (
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Simplified inline fee text */}
                    <p className="text-sm text-muted-foreground">
                      Processing Fee: {feePreview.effective_rate} of invoice total
                    </p>
                    
                    {/* Role-based accordion for admin users only */}
                    {isAdmin && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="fee-details" className="border-none">
                          <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-2">
                            Show Processing Fee Details
                          </AccordionTrigger>
                          <AccordionContent className="pt-2">
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="space-y-2 flex-1">
                                  <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                                    Transaction Fee Breakdown
                                  </h4>
                                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <div className="flex justify-between">
                                      <span>Stripe Processing Fee:</span>
                                      <span>{feePreview.stripe_fee}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Our Service Fee:</span>
                                      <span>{feePreview.our_markup_amount}</span>
                                    </div>
                                    <div className="flex justify-between font-medium border-t border-blue-200 dark:border-blue-700 pt-1">
                                      <span>Total Processing Fee:</span>
                                      <span>{feePreview.total_fee}</span>
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                      Effective rate: {feePreview.effective_rate}
                                    </div>
                                  </div>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 pt-2 border-t border-blue-200 dark:border-blue-700">
                                    These fees are collected and invoiced to you once per month.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Payout Account Required Modal */}
        <PayoutAccountRequiredModal 
          open={showPayoutModal}
          onOpenChange={setShowPayoutModal}
        />
        
        {/* Invoice Actions Drawer */}
        {createdInvoice && (
          <InvoiceActionsDrawer
            open={showActionsDrawer}
            onClose={() => {
              setShowActionsDrawer(false);
              // Navigate to invoice detail page after closing drawer
              navigate(`/invoice-detail?id=${createdInvoice.id}`);
            }}
            invoice={createdInvoice}
            onActionComplete={(action) => {
              console.log(`Action completed: ${action}`);
              // Could add analytics or additional logic here
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default CreateInvoice;
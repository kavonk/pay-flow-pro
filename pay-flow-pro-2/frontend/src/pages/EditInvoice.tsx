import AppLayout from "components/AppLayout";
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@stackframe/react';
import { useUpdateInvoice, useInvoice } from 'utils/queryHooks';
import brain from 'brain';
import {
  CustomersListResponse,
  CustomerResponse,
  UpdateInvoiceRequest,
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
import { ArrowLeft, Save, Info, ChevronDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import LineItemTable from 'components/LineItemTable';
import InvoiceTotals from 'components/InvoiceTotals';
import { InvoiceFormData, createEmptyLineItem, calculateInvoiceTotals, COMMON_TAX_RATES, LineItem } from 'utils/invoiceTypes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

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
);

type FormData = z.infer<typeof formSchema>;

const EditInvoice: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('id');
  const { user } = useUser();
  
  if (!user) {
    return (
      <AppLayout>
        <div className="p-8">Loading...</div>
      </AppLayout>
    );
  }
  const [showActionsDrawer, setShowActionsDrawer] = useState(false);
  const [updatedInvoice, setUpdatedInvoice] = useState<InvoiceResponse | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feePreview, setFeePreview] = useState<FeePreviewResponse | null>(null);
  const [isLoadingFeePreview, setIsLoadingFeePreview] = useState(false);

  // Hooks
  const { data: payoutAccount } = usePayoutAccount();
  const { data: userRole } = useUserRole();
  const { data: invoice, isLoading: isLoadingInvoice, error: invoiceError } = useInvoice(invoiceId || '');
  const { mutateAsync: updateInvoice } = useUpdateInvoice();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: '',
      invoice_number: '',
      currency: 'EUR',
      issue_date: '',
      due_date: '',
      description: '',
      terms: '',
      notes: '',
      line_items: [createEmptyLineItem()],
      invoice_wide_tax_rate: 0,
      discount_type: 'percentage',
      discount_value: 0,
    },
  });

  // Load invoice data into form when available
  useEffect(() => {
    if (invoice) {
      // Parse line items if they exist
      let lineItems: LineItem[] = [];
      try {
        if (invoice.line_items) {
          if (typeof invoice.line_items === 'string') {
            lineItems = JSON.parse(invoice.line_items);
          } else {
            lineItems = invoice.line_items as LineItem[];
          }
        }
      } catch (error) {
        console.error('Error parsing line items:', error);
        lineItems = [createEmptyLineItem()];
      }

      if (lineItems.length === 0) {
        lineItems = [createEmptyLineItem()];
      }

      // Format dates for form inputs
      const issueDate = invoice.issue_date ? new Date(invoice.issue_date).toISOString().split('T')[0] : '';
      const dueDate = invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '';

      form.reset({
        customer_id: invoice.customer_id,
        invoice_number: invoice.invoice_number || '',
        currency: (invoice.currency as 'EUR' | 'USD') || 'EUR',
        issue_date: issueDate,
        due_date: dueDate,
        description: invoice.description || '',
        terms: invoice.terms || '',
        notes: invoice.notes || '',
        line_items: lineItems,
        invoice_wide_tax_rate: invoice.invoice_wide_tax_rate || 0,
        discount_type: (invoice.discount_type as 'percentage' | 'fixed') || 'percentage',
        discount_value: invoice.discount_value || 0,
      });
    }
  }, [invoice, form]);

  // Check if invoice can be edited
  const canEditInvoice = invoice && invoice.status !== 'paid' && invoice.status !== 'sent';

  const watchedCurrency = form.watch('currency');
  const watchedAmount = form.watch('line_items');

  // Calculate total amount when line items change
  const calculatedTotals = calculateInvoiceTotals(
    watchedAmount || [],
    form.watch('discount_type'),
    form.watch('discount_value'),
    form.watch('invoice_wide_tax_rate')
  );

  // Load fee preview when amount or currency changes
  const loadFeePreview = useCallback(async () => {
    if (calculatedTotals.grandTotal > 0) {
      setIsLoadingFeePreview(true);
      try {
        const response = await brain.get_fee_preview({
          payment_amount: calculatedTotals.grandTotal
        });
        if (response.ok) {
          const data = await response.json();
          setFeePreview(data);
        }
      } catch (error) {
        console.error('Error loading fee preview:', error);
      } finally {
        setIsLoadingFeePreview(false);
      }
    }
  }, [calculatedTotals.grandTotal]);

  useEffect(() => {
    loadFeePreview();
  }, [loadFeePreview]);

  const onSubmit = async (data: FormData) => {
    if (!invoiceId) {
      toast.error('Invoice ID is missing');
      return;
    }

    if (!canEditInvoice) {
      toast.error('This invoice cannot be edited');
      return;
    }

    // Check if payout account is required and missing
    if (!payoutAccount?.account_id && userRole?.role === 'admin') {
      setShowPayoutModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert line items with calculated totals
      const processedLineItems = data.line_items.map(item => ({
        ...item,
        line_total: item.quantity * item.unit_price
      }));

      const updateData: UpdateInvoiceRequest = {
        customer_id: data.customer_id,
        invoice_number: data.invoice_number,
        amount: calculatedTotals.grandTotal,
        currency: data.currency,
        issue_date: data.issue_date,
        due_date: data.due_date,
        description: data.description || null,
        terms: data.terms || null,
        notes: data.notes || null,
        line_items: JSON.stringify(processedLineItems),
        invoice_wide_tax_rate: data.invoice_wide_tax_rate || null,
        discount_type: data.discount_type || null,
        discount_value: data.discount_value || null,
      };

      const result = await updateInvoice({ invoiceId, updateData });
      setUpdatedInvoice(result);
      toast.success('Invoice updated successfully!');
      
      // Redirect to invoice detail page
      navigate(`/invoice-detail?id=${invoiceId}`);
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle loading state
  if (isLoadingInvoice) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Handle error state
  if (invoiceError || !invoice) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto p-6">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {invoiceError ? 'Failed to load invoice. Please try again.' : 'Invoice not found.'}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={() => navigate('/invoices')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Handle non-editable invoice
  if (!canEditInvoice) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto p-6">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This invoice cannot be edited because it has been {invoice.status === 'paid' ? 'paid' : 'sent'}.
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/invoice-detail?id=${invoiceId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoice Details
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/invoice-detail?id=${invoiceId}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Edit Invoice</h1>
              <p className="text-muted-foreground">Update invoice details and line items</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                    <CardDescription>
                      Select the customer for this invoice
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customer_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer *</FormLabel>
                          <FormControl>
                            <CustomerCombobox
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Search and select a customer..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Invoice Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>
                      Configure invoice metadata and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Invoice Number and Currency */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="invoice_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="INV-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
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
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="issue_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
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
                  </CardContent>
                </Card>

                {/* Line Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                    <CardDescription>
                      Add products or services to this invoice
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LineItemTable form={form} currency={watchedCurrency} />
                  </CardContent>
                </Card>

                {/* Tax and Discount Configuration */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tax-discount">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        Tax & Discount Settings
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-6">
                            {/* Invoice-wide Tax */}
                            <div>
                              <h4 className="text-sm font-medium mb-3">Invoice-wide Tax Rate (Optional)</h4>
                              <FormField
                                control={form.control}
                                name="invoice_wide_tax_rate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Select 
                                        onValueChange={(value) => field.onChange(parseFloat(value))} 
                                        value={field.value?.toString() || '0'}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select tax rate" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {COMMON_TAX_RATES.map((rate) => (
                                            <SelectItem key={rate.value} value={rate.value.toString()}>
                                              {rate.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormDescription>
                                      This will override individual line item tax rates
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Discount Configuration */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Discount (Optional)</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="discount_type"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Discount Type</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select discount type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                                          <SelectItem value="fixed">Fixed Amount ({watchedCurrency === 'EUR' ? '€' : '$'})</SelectItem>
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
                                          placeholder="0.00"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Invoice Totals */}
                <InvoiceTotals form={form} currency={watchedCurrency} />

                {/* Fee Preview */}
                {feePreview && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Transaction Fees</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stripe Fee:</span>
                          <span>{feePreview.stripe_fee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fee:</span>
                          <span>{feePreview.our_markup_amount}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>Total Fees:</span>
                          <span>{feePreview.total_fee}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Effective rate: {feePreview.effective_rate} • {feePreview.plan_name}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Button 
                        type="submit" 
                        className="w-full gap-2" 
                        disabled={isSubmitting}
                      >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Updating...' : 'Update Invoice'}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate(`/invoice-detail?id=${invoiceId}`)}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Info className="h-3 w-3" />
                        <span>Changes will update the existing invoice</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>

        {/* Payout Account Required Modal */}
        <PayoutAccountRequiredModal 
          open={showPayoutModal} 
          onOpenChange={setShowPayoutModal} 
        />

        {/* Invoice Actions Drawer */}
        {updatedInvoice && (
          <InvoiceActionsDrawer
            open={showActionsDrawer}
            onClose={() => setShowActionsDrawer(false)}
            invoice={updatedInvoice}
            onActionComplete={() => {
              setShowActionsDrawer(false);
              navigate('/invoices');
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default EditInvoice;
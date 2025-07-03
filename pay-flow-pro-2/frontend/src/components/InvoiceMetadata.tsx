import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Hash, FileText, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import brain from 'brain';
import { toast } from 'sonner';

interface InvoiceMetadataProps {
  form: UseFormReturn<any>;
  className?: string;
}

const InvoiceMetadata: React.FC<InvoiceMetadataProps> = ({ form, className }) => {
  const [isLoadingInvoiceNumber, setIsLoadingInvoiceNumber] = useState(false);
  const [invoiceNumberGenerated, setInvoiceNumberGenerated] = useState(false);

  const watchedIssueDate = form.watch('issue_date');
  const watchedInvoiceNumber = form.watch('invoice_number');

  // Auto-generate invoice number on component mount
  useEffect(() => {
    if (!watchedInvoiceNumber && !invoiceNumberGenerated) {
      generateInvoiceNumber();
    }
  }, []);

  // Auto-calculate due date when issue date changes
  useEffect(() => {
    if (watchedIssueDate) {
      const issueDate = new Date(watchedIssueDate);
      const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days
      const dueDateString = dueDate.toISOString().split('T')[0];
      
      // Only update if due date is not manually set or is the default
      const currentDueDate = form.getValues('due_date');
      if (!currentDueDate || new Date(currentDueDate) <= new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        form.setValue('due_date', dueDateString);
      }
    }
  }, [watchedIssueDate, form]);

  const generateInvoiceNumber = async () => {
    setIsLoadingInvoiceNumber(true);
    try {
      const response = await brain.get_next_invoice_number();
      const data = await response.json();
      
      form.setValue('invoice_number', data.invoice_number);
      setInvoiceNumberGenerated(true);
      
      toast.success(`Invoice number ${data.invoice_number} generated`);
    } catch (error) {
      console.error('Failed to generate invoice number:', error);
      toast.error('Failed to generate invoice number');
    } finally {
      setIsLoadingInvoiceNumber(false);
    }
  };

  const calculateNetDays = (issueDate: string, dueDate: string): number => {
    if (!issueDate || !dueDate) return 30;
    const issue = new Date(issueDate);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - issue.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const applyNetTerms = (days: number) => {
    const issueDate = form.getValues('issue_date');
    if (issueDate) {
      const newDueDate = new Date(new Date(issueDate).getTime() + days * 24 * 60 * 60 * 1000);
      form.setValue('due_date', newDueDate.toISOString().split('T')[0]);
    }
  };

  const netDays = calculateNetDays(watchedIssueDate, form.watch('due_date'));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoice Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Number Section */}
        <div className="space-y-2">
          <Label htmlFor="invoice_number" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Invoice Number
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="invoice_number"
                {...form.register('invoice_number')}
                placeholder="INV-001"
                className="font-mono"
              />
              {form.formState.errors.invoice_number && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.invoice_number.message as string}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={generateInvoiceNumber}
              disabled={isLoadingInvoiceNumber}
              className="shrink-0"
            >
              {isLoadingInvoiceNumber ? 'Generating...' : 'Generate'}
            </Button>
          </div>
          {invoiceNumberGenerated && (
            <p className="text-sm text-muted-foreground">
              ✓ Auto-generated sequential number
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceMetadata;
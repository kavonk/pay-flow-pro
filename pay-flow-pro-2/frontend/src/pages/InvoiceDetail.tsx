import AppLayout from "components/AppLayout";
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@stackframe/react';
import { useInvoice } from 'utils/queryHooks';
import brain from 'brain';
import { InvoiceResponse } from 'types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Copy,
  Edit,
  ExternalLink,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceDetailProps {}

const InvoiceDetail: React.FC<InvoiceDetailProps> = () => {
  const { user } = useUser();
  
  if (!user) {
    return (
      <AppLayout>
        <div className="p-8">Loading...</div>
      </AppLayout>
    );
  }
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('id');
  
  // Use React Query hook for invoice data
  const { data: invoice, isLoading, error } = useInvoice(invoiceId || '');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [showSendDialog, setShowSendDialog] = useState(false);

  // Handle navigation if no invoice ID
  useEffect(() => {
    if (!invoiceId) {
      toast.error('Invoice ID is required');
      navigate('/invoices');
    }
  }, [invoiceId, navigate]);

  // Handle invoice loading error
  useEffect(() => {
    if (error) {
      console.error('Error loading invoice:', error);
      toast.error('Failed to load invoice');
      navigate('/invoices');
    }
  }, [error, navigate]);

  const handleCopyPaymentLink = () => {
    if (!invoice?.stripe_payment_link_url) return;
    
    navigator.clipboard.writeText(invoice.stripe_payment_link_url);
    toast.success('Payment link copied to clipboard');
  };

  const handleSendInvoice = async () => {
    if (!invoice) return;
    
    try {
      setSendingEmail(true);
      const response = await brain.send_invoice_endpoint({
        invoice_id: invoice.id,
        email_message: emailMessage || undefined,
      });
      const result = await response.json();
      toast.success(result.message || 'Invoice sent successfully');
      
      // Close dialog and reset form
      setShowSendDialog(false);
      setEmailMessage('');
    } catch (err) {
      console.error('Error sending invoice:', err);
      toast.error('Failed to send invoice');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice) return;
    
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      await brain.delete_invoice_endpoint({ invoiceId: invoice.id });
      toast.success('Invoice deleted successfully');
      navigate('/invoices');
    } catch (err) {
      console.error('Error deleting invoice:', err);
      toast.error('Failed to delete invoice');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: 'bg-gray-500',
      sent: 'bg-blue-500',
      paid: 'bg-green-500',
      overdue: 'bg-red-500',
      cancelled: 'bg-gray-400'
    };

    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading invoice...</div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">{error || 'Invoice not found'}</div>
            <div className="text-center mt-4">
              <Button onClick={() => navigate('/invoices')}>Back to Invoices</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/invoices')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Button>
      </div>

      {/* Invoice Header */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Invoice #{invoice.id.substring(0, 8)}
                  </CardTitle>
                  <CardDescription>
                    Created on {formatDate(invoice.created_at)}
                  </CardDescription>
                </div>
                {getStatusBadge(invoice.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-2">Bill To:</h3>
                <div className="text-sm space-y-1">
                  <div className="font-medium">{invoice.customer_name || 'Unknown Customer'}</div>
                  <div className="text-muted-foreground">{invoice.customer_email || 'No email available'}</div>
                </div>
              </div>

              <Separator />

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Issue Date</div>
                  <div>{formatDate(invoice.issue_date)}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Due Date</div>
                  <div>{formatDate(invoice.due_date)}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Amount</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Currency</div>
                  <div>{invoice.currency}</div>
                </div>
              </div>

              {invoice.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{invoice.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Payment Link */}
              {invoice.stripe_payment_link_url && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Link</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPaymentLink}
                      className="gap-2 flex-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(invoice.stripe_payment_link_url, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Send Invoice */}
              <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full gap-2" 
                    disabled={!invoice.stripe_payment_link_url}
                  >
                    <Send className="h-4 w-4" />
                    {invoice.status === 'sent' || invoice.status === 'paid' ? 'Resend Invoice' : 'Send Invoice'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{invoice.status === 'sent' || invoice.status === 'paid' ? 'Resend Invoice' : 'Send Invoice'}</DialogTitle>
                    <DialogDescription>
                      {invoice.status === 'sent' || invoice.status === 'paid' ? 'Resend' : 'Send'} this invoice to {invoice.customer_name || 'Unknown Customer'} at {invoice.customer_email || 'no email available'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email-message">Custom Message (Optional)</Label>
                      <Textarea
                        id="email-message"
                        placeholder="Add a personal message to include with the invoice..."
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowSendDialog(false)}
                      disabled={sendingEmail}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSendInvoice} disabled={sendingEmail}>
                      {sendingEmail ? 'Sending...' : (invoice.status === 'sent' || invoice.status === 'paid' ? 'Resend Invoice' : 'Send Invoice')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Separator />

              {/* Edit Invoice */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate(`/EditInvoice?id=${invoice.id}`)}
                disabled={invoice.status === 'sent' || invoice.status === 'paid'}
              >
                <Edit className="h-4 w-4" />
                {invoice.status === 'sent' || invoice.status === 'paid' ? 'Cannot Edit (Sent)' : 'Edit Invoice'}
              </Button>

              {/* Delete Invoice */}
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleDeleteInvoice}
              >
                <Trash2 className="h-4 w-4" />
                Delete Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </AppLayout>
  );
};

export default InvoiceDetail;
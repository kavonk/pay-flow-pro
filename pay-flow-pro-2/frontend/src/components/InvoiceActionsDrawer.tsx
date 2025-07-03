import React, { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  Download,
  Copy,
  Save,
  Check,
  ExternalLink,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { useBrandingSettings } from 'utils/queryHooks';
import { InvoiceResponse } from 'types';
import { generateInvoicePDFWithProgress } from 'utils/invoiceToHtmlPdf';

export interface InvoiceActionsDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Function to close the drawer */
  onClose: () => void;
  /** The created invoice data */
  invoice: InvoiceResponse;
  /** Optional callback when action is completed */
  onActionComplete?: (action: string) => void;
}

const InvoiceActionsDrawer: React.FC<InvoiceActionsDrawerProps> = ({
  open,
  onClose,
  invoice,
  onActionComplete,
}) => {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load branding settings for PDF generation
  const { data: brandingSettings } = useBrandingSettings();

  // Format currency amount
  const formatAmount = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(numAmount);
  };

  // Handle sending invoice via email
  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const response = await brain.send_invoice_endpoint({
        invoice_id: invoice.id,
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success('Invoice sent via email successfully!');
        onActionComplete?.('send_email');
      } else {
        toast.error('Failed to send invoice via email');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice via email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Handle sending invoice via SMS
  const handleSendSMS = async () => {
    setSendingSMS(true);
    try {
      // For now, this will be a placeholder since SMS functionality might not be implemented
      toast.info('SMS functionality coming soon!');
      onActionComplete?.('send_sms');
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send invoice via SMS');
    } finally {
      setSendingSMS(false);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      // Generate PDF using HTML-to-PDF conversion for perfect visual consistency
      if (brandingSettings) {
        await generateInvoicePDFWithProgress(
          invoice,
          brandingSettings,
          (progress) => {
            // Could show progress to user if needed
            console.log('PDF Generation:', progress);
          }
        );
        toast.success('Invoice PDF downloaded successfully!');
      } else {
        toast.error('Branding settings not loaded. Please try again.');
      }
      
      onActionComplete?.('download_pdf');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Handle copying payment link
  const handleCopyPaymentLink = async () => {
    setCopyingLink(true);
    try {
      if (invoice.stripe_payment_link_url) {
        await navigator.clipboard.writeText(invoice.stripe_payment_link_url);
        setCopiedLink(true);
        toast.success('Payment link copied to clipboard!');
        
        // Reset the copied state after 3 seconds
        setTimeout(() => setCopiedLink(false), 3000);
        
        onActionComplete?.('copy_link');
      } else {
        toast.error('No payment link available');
      }
    } catch (error) {
      console.error('Error copying payment link:', error);
      toast.error('Failed to copy payment link');
    } finally {
      setCopyingLink(false);
    }
  };

  // Handle saving as template
  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      // Save invoice data as template in localStorage for now
      const templateData = {
        id: `template-${Date.now()}`,
        name: `Template from Invoice ${invoice.invoice_number || invoice.id.slice(0, 8)}`,
        description: invoice.description,
        currency: invoice.currency,
        created_at: new Date().toISOString(),
        // Note: In a real implementation, this would be saved to the backend
      };
      
      // Get existing templates
      const existingTemplates = JSON.parse(localStorage.getItem('invoice_templates') || '[]');
      existingTemplates.push(templateData);
      localStorage.setItem('invoice_templates', JSON.stringify(existingTemplates));
      
      toast.success('Invoice saved as template!');
      onActionComplete?.('save_template');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Handle opening payment link in new tab
  const handleOpenPaymentLink = () => {
    if (invoice.stripe_payment_link_url) {
      window.open(invoice.stripe_payment_link_url, '_blank');
      onActionComplete?.('open_link');
    } else {
      toast.error('No payment link available');
    }
  };



  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="mx-auto w-full max-w-lg bg-zinc-900 border-zinc-800">
        <DrawerHeader className="text-center border-b border-zinc-800 pb-4">
          <DrawerTitle className="text-xl font-semibold text-white">
            Invoice Created Successfully! 🎉
          </DrawerTitle>
          <DrawerDescription className="text-zinc-400 mt-2">
            Your invoice is ready. Choose what you'd like to do next.
          </DrawerDescription>
          
          {/* Invoice Summary */}
          <div className="bg-zinc-800/50 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-zinc-400">Invoice #{invoice.invoice_number || invoice.id.slice(0, 8)}</p>
                <p className="text-lg font-semibold text-white">{formatAmount(invoice.amount, invoice.currency)}</p>
                <p className="text-sm text-zinc-400">{invoice.customer_name}</p>
              </div>
              <Badge variant="secondary" className="bg-green-900/30 text-green-400 border-green-700">
                {invoice.status}
              </Badge>
            </div>
          </div>
        </DrawerHeader>

        <div className="p-6 space-y-4">
          {/* Primary Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">Send Invoice</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                {sendingEmail ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {sendingEmail ? 'Sending...' : 'Email'}
              </Button>
              
              <Button
                onClick={handleSendSMS}
                disabled={sendingSMS}
                variant="outline"
                className="flex items-center gap-2 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                size="sm"
              >
                {sendingSMS ? (
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                {sendingSMS ? 'Sending...' : 'SMS'}
              </Button>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Secondary Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">Quick Actions</h3>
            
            <div className="space-y-2">
              <Button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                variant="outline"
                className="w-full flex items-center gap-2 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                size="sm"
              >
                {downloadingPDF ? (
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloadingPDF ? 'Generating...' : 'Download PDF'}
              </Button>
              
              <Button
                onClick={handleCopyPaymentLink}
                disabled={copyingLink || !invoice.stripe_payment_link_url}
                variant="outline"
                className="w-full flex items-center gap-2 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                size="sm"
              >
                {copyingLink ? (
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : copiedLink ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copyingLink ? 'Copying...' : copiedLink ? 'Copied!' : 'Copy Payment Link'}
              </Button>
              
              {invoice.stripe_payment_link_url && (
                <Button
                  onClick={handleOpenPaymentLink}
                  variant="outline"
                  className="w-full flex items-center gap-2 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                  size="sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Payment Page
                </Button>
              )}
              
              <Button
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                variant="outline"
                className="w-full flex items-center gap-2 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                size="sm"
              >
                {savingTemplate ? (
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {savingTemplate ? 'Saving...' : 'Save as Template'}
              </Button>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Close Action */}
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            size="sm"
          >
            Done
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default InvoiceActionsDrawer;
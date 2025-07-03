import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import InvoiceRenderer, { InvoiceData, BrandingData } from 'components/InvoiceRenderer';

type PreviewMode = 'invoice' | 'email' | 'payment';
type BreakpointMode = 'desktop' | 'tablet' | 'mobile';



interface PreviewPanelProps {
  previewMode: PreviewMode;
  breakpointMode: BreakpointMode;
  formData: BrandingData;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  previewMode, 
  breakpointMode, 
  formData
}) => {
  const getPreviewWidth = () => {
    switch (breakpointMode) {
      case 'mobile': return 'max-w-sm';
      case 'tablet': return 'max-w-2xl';
      default: return 'max-w-4xl';
    }
  };

  // Sample invoice data for preview
  const sampleInvoiceData: InvoiceData = {
    id: 'preview-invoice',
    invoice_number: 'INV-2024-001',
    issue_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    amount: '3932.50',
    currency: 'EUR',
    description: 'Professional services rendered',
    customer_name: 'Acme Corporation',
    customer_email: 'john@acme.com',
    customer_phone: '+1 (555) 987-6543',
    line_items: [
      { description: 'Website Development & Design', quantity: 1, rate: 2500, amount: 2500 },
      { description: 'SEO Optimization Package', quantity: 1, rate: 750, amount: 750 },
      { description: 'Content Management Training', quantity: 2, rate: 200, amount: 400 }
    ],
    invoice_wide_tax_rate: 21,
    discount_type: 'percentage',
    discount_value: 5,
    terms: 'Payment is due within 30 days of invoice date. Late payments may incur additional fees.',
    notes: 'Thank you for choosing our services. We appreciate your business!'
  };

  const renderInvoicePreview = () => (
    <div className="w-full">
      <InvoiceRenderer 
        invoice={sampleInvoiceData}
        branding={formData}
        isPreview={true}
        className={breakpointMode === 'mobile' ? 'scale-50' : breakpointMode === 'tablet' ? 'scale-75' : 'scale-90'}
      />
    </div>
  );

  const renderEmailPreview = () => (
    <div className="bg-white rounded-lg shadow-lg border">
      <div className="text-center py-6 px-4 rounded-t-lg" style={{ backgroundColor: formData.primary_color || '#3B82F6' }}>
        <h2 className="text-white text-xl font-bold">{formData.company_name || 'Your Company'}</h2>
        <p className="text-white opacity-90 text-sm mt-1">Invoice Ready for Payment</p>
      </div>
      <div className="p-6 border-l-4" style={{ borderLeftColor: formData.accent_color || '#10B981' }}>
        <p className="text-gray-700 mb-4">Dear Customer,</p>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Your invoice #INV-2024-001 for €3,025.00 is ready for payment. 
          Please review the details and pay securely using the button below.
        </p>
        <div className="text-center mb-6">
          <div className="inline-block px-8 py-3 rounded-lg text-white font-semibold" 
               style={{ backgroundColor: formData.accent_color || '#10B981' }}>
            Pay Now - €3,025.00
          </div>
        </div>
        {formData.email_signature && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="whitespace-pre-line text-sm text-gray-600">
              {formData.email_signature}
            </div>
          </div>
        )}
        <p className="text-gray-500 text-sm mt-4">
          Questions? Reply to this email or contact us at {formData.business_email || 'support@company.com'}
        </p>
      </div>
    </div>
  );

  const renderPaymentPreview = () => (
    <div className="bg-white rounded-lg shadow-lg border">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b">
        <div className="flex items-center justify-between">
          {formData.logo_url ? (
            <img src={formData.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
          ) : (
            <div className="h-12 w-16 rounded flex items-center justify-center text-white font-bold text-sm" 
                 style={{ backgroundColor: formData.primary_color || '#3B82F6' }}>
              {formData.company_name?.charAt(0) || 'C'}
            </div>
          )}
          <div className="text-right">
            <p className="text-sm text-gray-600">Secure Payment</p>
            <p className="font-semibold" style={{ color: formData.primary_color || '#3B82F6' }}>PayFlow Pro</p>
          </div>
        </div>
      </div>
      
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: formData.primary_color || '#3B82F6' }}>
            Complete Your Payment
          </h2>
          <p className="text-gray-600">Invoice #INV-2024-001 from {formData.company_name || 'Your Company'}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total Amount:</span>
            <span className="text-3xl font-bold" style={{ color: formData.primary_color || '#3B82F6' }}>€3,025.00</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">Card Number</label>
            <div className="bg-gray-100 p-3 rounded text-gray-500">•••• •••• •••• 4242</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">Expiry</label>
              <div className="bg-gray-100 p-3 rounded text-gray-500">12/25</div>
            </div>
            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">CVC</label>
              <div className="bg-gray-100 p-3 rounded text-gray-500">•••</div>
            </div>
          </div>
          
          <div className="pt-4">
            <div className="w-full py-4 rounded-lg text-white font-semibold text-center text-lg" 
                 style={{ backgroundColor: formData.accent_color || '#10B981' }}>
              Pay €3,025.00 Securely
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreviewContent = () => {
    switch (previewMode) {
      case 'invoice': return renderInvoicePreview();
      case 'email': return renderEmailPreview();
      case 'payment': return renderPaymentPreview();
      default: return renderInvoicePreview();
    }
  };

  return (
    <Card className="bg-gray-50 border-2 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <span>Live Preview Canvas</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className={`mx-auto transition-all duration-300 ${getPreviewWidth()}`}>
          {renderPreviewContent()}
        </div>
      </CardContent>
    </Card>
  );
};
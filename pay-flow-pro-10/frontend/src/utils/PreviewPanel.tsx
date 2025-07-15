import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';

type PreviewMode = 'invoice' | 'email' | 'payment';
type BreakpointMode = 'desktop' | 'tablet' | 'mobile';

interface BrandingData {
  company_name?: string;
  primary_color?: string;
  accent_color?: string;
  logo_url?: string;
  business_email?: string;
  business_phone?: string;
  website_url?: string;
  payment_terms?: string;
  email_signature?: string;
  email_footer_text?: string;
}

interface PreviewPanelProps {
  previewMode: PreviewMode;
  breakpointMode: BreakpointMode;
  formData: BrandingData;
  refreshKey: number;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  previewMode, 
  breakpointMode, 
  formData, 
  refreshKey 
}) => {
  const getPreviewWidth = () => {
    switch (breakpointMode) {
      case 'mobile': return 'max-w-sm';
      case 'tablet': return 'max-w-2xl';
      default: return 'max-w-4xl';
    }
  };

  const renderInvoicePreview = () => (
    <div className="bg-white rounded-lg shadow-lg p-8 border" key={`invoice-${refreshKey}`}>
      {/* Professional Invoice Preview */}
      <div className="border-b-2 pb-6 mb-6" style={{ borderColor: formData.primary_color || '#3B82F6' }}>
        <div className="flex justify-between items-start">
          {formData.logo_url ? (
            <img src={formData.logo_url} alt="Logo" className="h-16 w-auto object-contain" />
          ) : (
            <div className="h-16 w-24 rounded-lg flex items-center justify-center text-white font-bold" 
                 style={{ backgroundColor: formData.primary_color || '#3B82F6' }}>
              {formData.company_name?.charAt(0) || 'C'}
            </div>
          )}
          <div className="text-right">
            <h2 className="text-3xl font-bold mb-2" style={{ color: formData.primary_color || '#3B82F6' }}>INVOICE</h2>
            <p className="text-gray-600 text-lg">#INV-2024-001</p>
            <p className="text-sm text-gray-500">Due: January 30, 2024</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold text-lg mb-3" style={{ color: formData.primary_color || '#3B82F6' }}>From:</h3>
          <div className="text-gray-700">
            <p className="font-semibold text-lg">{formData.company_name || 'Your Company Name'}</p>
            {formData.business_email && <p className="text-sm">{formData.business_email}</p>}
            {formData.business_phone && <p className="text-sm">{formData.business_phone}</p>}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-3" style={{ color: formData.primary_color || '#3B82F6' }}>To:</h3>
          <div className="text-gray-700">
            <p className="font-semibold">Acme Corporation</p>
            <p className="text-sm">contact@acme.com</p>
            <p className="text-sm">+1 (555) 123-4567</p>
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-gray-700">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-12 gap-4 text-sm">
            <div className="col-span-6">Professional Website Design</div>
            <div className="col-span-2 text-center">1</div>
            <div className="col-span-2 text-right">€2,500.00</div>
            <div className="col-span-2 text-right font-semibold">€2,500.00</div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">€2,500.00</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Tax (21%):</span>
            <span className="font-semibold">€525.00</span>
          </div>
          <div className="flex justify-between py-3 text-lg font-bold" style={{ color: formData.primary_color || '#3B82F6' }}>
            <span>Total:</span>
            <span>€3,025.00</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailPreview = () => (
    <div className="bg-white rounded-lg shadow-lg border" key={`email-${refreshKey}`}>
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
    <div className="bg-white rounded-lg shadow-lg border" key={`payment-${refreshKey}`}>
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
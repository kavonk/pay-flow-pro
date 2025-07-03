import React from 'react';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: string;
  currency: string;
  description?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  line_items?: InvoiceLineItem[];
  invoice_wide_tax_rate?: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  terms?: string;
  notes?: string;
}

export interface BrandingData {
  company_name?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  logo_url?: string;
  business_email?: string;
  business_phone?: string;
  website_url?: string;
  payment_terms?: string;
  email_signature?: string;
  email_footer_text?: string;
}

export interface InvoiceRendererProps {
  invoice: InvoiceData;
  branding: BrandingData;
  className?: string;
  isPreview?: boolean;
}

const InvoiceRenderer: React.FC<InvoiceRendererProps> = ({
  invoice,
  branding,
  className = '',
  isPreview = false
}) => {
  // Helper function to convert hex to rgba with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(59, 130, 246, ${opacity})`; // fallback blue
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate totals from line items or use provided amounts
  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;
    let total = 0;

    if (invoice.line_items && invoice.line_items.length > 0) {
      // Calculate from line items
      subtotal = invoice.line_items.reduce((sum, item) => sum + item.amount, 0);
      
      if (invoice.invoice_wide_tax_rate) {
        taxAmount = subtotal * (invoice.invoice_wide_tax_rate / 100);
      }
      
      if (invoice.discount_value) {
        if (invoice.discount_type === 'percentage') {
          discountAmount = subtotal * (invoice.discount_value / 100);
        } else {
          discountAmount = invoice.discount_value;
        }
      }
      
      total = subtotal + taxAmount - discountAmount;
    } else {
      // Use provided amount as total
      total = parseFloat(invoice.amount || '0');
      subtotal = total * 0.85; // Estimate subtotal (assuming ~15% tax)
      taxAmount = total * 0.15;
    }

    return { subtotal, taxAmount, discountAmount, total };
  };

  const totals = calculateTotals();
  const primaryColor = branding.primary_color || '#3B82F6';
  const accentColor = branding.accent_color || '#10B981';
  const headerBgColor = hexToRgba(primaryColor, 0.2);

  // Default line items for preview
  const defaultLineItems: InvoiceLineItem[] = [
    { description: 'Website Development & Design', quantity: 1, rate: 2500, amount: 2500 },
    { description: 'SEO Optimization Package', quantity: 1, rate: 750, amount: 750 },
    { description: 'Content Management Training', quantity: 2, rate: 200, amount: 400 }
  ];

  const displayLineItems = invoice.line_items?.length ? invoice.line_items : defaultLineItems;

  return (
    <div className={`bg-white shadow-lg border overflow-hidden ${className}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header with lighter accent strip - 20% opacity */}
      <div 
        className="px-8 py-6 border-b border-gray-200" 
        style={{ backgroundColor: headerBgColor }}
      >
        <div className="flex justify-between items-start">
          {/* Left side: Logo + Company Info */}
          <div className="flex items-center space-x-4">
            {branding.logo_url ? (
              <img 
                src={branding.logo_url} 
                alt="Company Logo" 
                className="object-contain"
                style={{ width: '150px', height: '50px' }}
              />
            ) : (
              <div 
                className="flex items-center justify-center text-white font-bold text-sm"
                style={{ 
                  width: '150px', 
                  height: '50px', 
                  backgroundColor: primaryColor,
                  borderRadius: '4px'
                }}
              >
                LOGO
              </div>
            )}
            <div className="space-y-1">
              <div className="font-semibold text-lg text-gray-900">
                {branding.company_name || 'PayFlow Pro'}
              </div>
              <div className="text-sm text-gray-600 space-y-0.5">
                {branding.business_email && <div>{branding.business_email}</div>}
                {branding.business_phone && <div>{branding.business_phone}</div>}
              </div>
            </div>
          </div>
          
          {/* Right side: INVOICE title + metadata box */}
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">INVOICE</h1>
            <div className="bg-white border border-gray-300 rounded-lg p-3 text-left" style={{ minWidth: '200px' }}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Number:</span>
                  <span className="text-gray-900">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Issue Date:</span>
                  <span className="text-gray-900">{new Date(invoice.issue_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Due Date:</span>
                  <span className="text-gray-900">{new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8" style={{ margin: isPreview ? '0' : '1in', marginTop: '0', marginBottom: '0' }}>
        {/* From / Bill To Blocks */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4" style={{ backgroundColor: '#F7F7F7', padding: '12px', borderRadius: '8px' }}>
            <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">FROM:</h3>
            <div className="space-y-1">
              <div className="font-semibold text-sm text-gray-900">{branding.company_name || 'PayFlow Pro'}</div>
              {branding.business_email && <div className="text-xs text-gray-600">{branding.business_email}</div>}
              {branding.business_phone && <div className="text-xs text-gray-600">{branding.business_phone}</div>}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4" style={{ backgroundColor: '#F7F7F7', padding: '12px', borderRadius: '8px' }}>
            <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">BILL TO:</h3>
            <div className="space-y-1">
              <div className="font-semibold text-sm text-gray-900">{invoice.customer_name || 'Acme Corporation'}</div>
              {invoice.customer_email && <div className="text-xs text-gray-600">{invoice.customer_email}</div>}
              {invoice.customer_phone && <div className="text-xs text-gray-600">{invoice.customer_phone}</div>}
            </div>
          </div>
        </div>

        {/* Line-Item Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
          {/* Table Header */}
          <div 
            className="px-4 py-2 text-white text-xs uppercase font-semibold"
            style={{ backgroundColor: accentColor, padding: '6px 8px' }}
          >
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6">DESCRIPTION</div>
              <div className="col-span-2 text-center">QTY</div>
              <div className="col-span-2 text-right">RATE</div>
              <div className="col-span-2 text-right">AMOUNT</div>
            </div>
          </div>
          
          {/* Table Rows */}
          {displayLineItems.map((item, index) => (
            <div 
              key={index}
              className={`px-4 py-2 text-sm ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
              style={{ 
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FCFCFC',
                padding: '8px'
              }}
            >
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 text-gray-900">{item.description}</div>
                <div className="col-span-2 text-center text-gray-900">{item.quantity}</div>
                <div className="col-span-2 text-right text-gray-900">
                  {formatCurrency(item.rate, invoice.currency)}
                </div>
                <div className="col-span-2 text-right font-semibold text-gray-900">
                  {formatCurrency(item.amount, invoice.currency)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Summary Box */}
        <div className="flex justify-end mb-8">
          <div className="w-80 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(totals.subtotal, invoice.currency)}
                  </span>
                </div>
                {totals.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({invoice.invoice_wide_tax_rate || 21}%):</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(totals.taxAmount, invoice.currency)}
                    </span>
                  </div>
                )}
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-gray-900">
                      -{formatCurrency(totals.discountAmount, invoice.currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Total row with accent background */}
            <div 
              className="px-4 py-3 text-white font-bold text-base"
              style={{ backgroundColor: accentColor }}
            >
              <div className="flex justify-between">
                <span>TOTAL:</span>
                <span>{formatCurrency(totals.total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Rule */}
        <div className="border-t border-gray-300 mb-6"></div>

        {/* Payment Information & Terms */}
        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-base text-gray-900">Payment Information</h3>
          <div className="text-xs text-gray-600 leading-relaxed">
            <p>
              Payment is due within {branding.payment_terms || '30 days'} of invoice date. 
              Late payments may incur additional fees. Please reference invoice number {invoice.invoice_number} 
              when making payment.
            </p>
            {invoice.terms && (
              <p className="mt-2">{invoice.terms}</p>
            )}
          </div>
          {invoice.notes && (
            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
              <strong>Notes:</strong> {invoice.notes}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 px-8 py-4 bg-gray-50" style={{ borderTopColor: '#E0E0E0' }}>
        <div className="flex justify-between items-center text-xs">
          <div className="italic text-gray-600">
            Thank you for your business
          </div>
          <div className="text-gray-600 space-x-4">
            <span>Page 1 of 1</span>
            {branding.business_email && (
              <span>Support: {branding.business_email}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceRenderer;
// Invoice line item types for dynamic invoice creation

export interface LineItem {
  id: string; // Temporary ID for form management
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number; // Percentage (e.g., 21 for 21%)
  line_total: number; // Calculated: quantity * unit_price
}

export interface InvoiceCalculations {
  subtotal: number;
  total_tax: number;
  discount_amount: number;
  total: number;
}

export interface InvoiceFormData {
  customer_id: string;
  currency: 'EUR' | 'USD';
  issue_date: string;
  due_date: string;
  description?: string;
  line_items: LineItem[];
  invoice_wide_tax_rate?: number; // Optional invoice-wide tax
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
}

// Helper functions for calculations
export const calculateLineTotal = (item: LineItem): number => {
  const subtotal = item.quantity * item.unit_price;
  const taxAmount = subtotal * (item.tax_rate / 100);
  return subtotal + taxAmount;
};

export const calculateInvoiceTotals = (
  lineItems: LineItem[],
  discountType?: 'percentage' | 'fixed',
  discountValue?: number,
  invoiceWideTaxRate?: number
): InvoiceCalculations => {
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  let totalTax = 0;
  
  if (invoiceWideTaxRate !== undefined && invoiceWideTaxRate > 0) {
    // Use invoice-wide tax rate
    totalTax = subtotal * (invoiceWideTaxRate / 100);
  } else {
    // Use per-line-item tax rates
    totalTax = lineItems.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      return sum + (itemSubtotal * (item.tax_rate / 100));
    }, 0);
  }

  let discountAmount = 0;
  if (discountValue && discountValue > 0) {
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }
  }

  const total = subtotal + totalTax - discountAmount;

  return {
    subtotal,
    total_tax: totalTax,
    discount_amount: discountAmount,
    total: Math.max(0, total), // Ensure total is never negative
  };
};

// Common tax rates for dropdown
export const COMMON_TAX_RATES = [
  { value: 0, label: '0% (No Tax)' },
  { value: 5, label: '5%' },
  { value: 10, label: '10%' },
  { value: 15, label: '15%' },
  { value: 19, label: '19% (Germany)' },
  { value: 20, label: '20% (UK)' },
  { value: 21, label: '21% (Netherlands)' },
  { value: 22, label: '22%' },
  { value: 25, label: '25%' },
];

// Helper to determine if invoice uses invoice-wide tax
export const usesInvoiceWideTax = (
  invoiceWideTaxRate?: number,
  lineItems?: LineItem[]
): boolean => {
  return invoiceWideTaxRate !== undefined && invoiceWideTaxRate >= 0;
};

// Helper to get effective tax rate for display
export const getEffectiveTaxRate = (
  invoiceWideTaxRate?: number,
  lineItems?: LineItem[]
): number => {
  if (usesInvoiceWideTax(invoiceWideTaxRate)) {
    return invoiceWideTaxRate || 0;
  }
  
  if (!lineItems || lineItems.length === 0) return 0;
  
  // Calculate average tax rate from line items
  const totalSubtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  if (totalSubtotal === 0) return 0;
  
  const weightedTaxSum = lineItems.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    return sum + (itemSubtotal * item.tax_rate);
  }, 0);
  
  return weightedTaxSum / totalSubtotal;
};
export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Default empty line item
export const createEmptyLineItem = (): LineItem => ({
  id: generateTempId(),
  description: '',
  quantity: 1,
  unit_price: 0,
  tax_rate: 0,
  line_total: 0,
});

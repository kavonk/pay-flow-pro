import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { calculateInvoiceTotals, usesInvoiceWideTax, getEffectiveTaxRate } from 'utils/invoiceTypes';
import { InvoiceFormData } from 'utils/invoiceTypes';

interface InvoiceTotalsProps {
  form: UseFormReturn<InvoiceFormData>;
  currency: 'EUR' | 'USD';
}

const InvoiceTotals: React.FC<InvoiceTotalsProps> = ({ form, currency }) => {
  const currencySymbol = currency === 'EUR' ? '€' : '$';
  
  // Watch all relevant fields for real-time updates
  const lineItems = form.watch('line_items') || [];
  const discountType = form.watch('discount_type');
  const discountValue = form.watch('discount_value');
  const invoiceWideTaxRate = form.watch('invoice_wide_tax_rate');
  
  // Calculate totals
  const calculations = calculateInvoiceTotals(
    lineItems, 
    discountType, 
    discountValue,
    invoiceWideTaxRate
  );
  
  const formatCurrency = (amount: number): string => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };
  
  const formatPercentage = (rate: number): string => {
    return `${rate.toFixed(1)}%`;
  };
  
  // Don't show totals if no line items
  if (!lineItems.length) {
    return null;
  }
  
  const isInvoiceWideTax = usesInvoiceWideTax(invoiceWideTaxRate);
  const effectiveTaxRate = getEffectiveTaxRate(invoiceWideTaxRate, lineItems);
  
  return (
    <Card className="w-full max-w-md ml-auto">
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(calculations.subtotal)}</span>
          </div>
          
          {/* Tax */}
          {calculations.total_tax > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Tax</span>
                  {isInvoiceWideTax ? (
                    <Badge variant="secondary" className="text-xs">
                      Invoice-wide {formatPercentage(invoiceWideTaxRate || 0)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Per-item avg {formatPercentage(effectiveTaxRate)}
                    </Badge>
                  )}
                </div>
                <span>{formatCurrency(calculations.total_tax)}</span>
              </div>
            </div>
          )}
          
          {/* Discount */}
          {calculations.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <div className="flex items-center gap-2">
                <span>Discount</span>
                {discountType && discountValue && (
                  <Badge variant="secondary" className="text-xs text-green-700">
                    {discountType === 'percentage' 
                      ? `${discountValue}%` 
                      : formatCurrency(discountValue)
                    }
                  </Badge>
                )}
              </div>
              <span>-{formatCurrency(calculations.discount_amount)}</span>
            </div>
          )}
          
          <Separator />
          
          {/* Total */}
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatCurrency(calculations.total)}</span>
          </div>
          
          {/* Summary info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
            {calculations.total_tax > 0 && (
              <span> • {formatPercentage(effectiveTaxRate)} effective tax</span>
            )}
            {calculations.discount_amount > 0 && (
              <span> • {formatCurrency(calculations.discount_amount)} saved</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceTotals;

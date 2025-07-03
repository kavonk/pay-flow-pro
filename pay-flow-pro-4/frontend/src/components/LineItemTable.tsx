import React from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Plus, Trash2 } from 'lucide-react';
import { LineItem, createEmptyLineItem, calculateLineTotal } from 'utils/invoiceTypes';
import { InvoiceFormData } from 'utils/invoiceTypes';

interface LineItemTableProps {
  form: UseFormReturn<InvoiceFormData>;
  currency: 'EUR' | 'USD';
}

const LineItemTable: React.FC<LineItemTableProps> = ({ form, currency }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'line_items',
  });

  const currencySymbol = currency === 'EUR' ? '€' : '$';

  const addLineItem = () => {
    append(createEmptyLineItem());
  };

  const removeLineItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Watch all line items for real-time calculation updates
  const watchedLineItems = form.watch('line_items');

  // Update line totals when quantity, unit_price, or tax_rate changes
  React.useEffect(() => {
    watchedLineItems.forEach((item, index) => {
      const calculatedTotal = calculateLineTotal(item);
      if (item.line_total !== calculatedTotal) {
        form.setValue(`line_items.${index}.line_total`, calculatedTotal);
      }
    });
  }, [watchedLineItems, form]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Line Items</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLineItem}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead className="w-[100px] text-center">Qty</TableHead>
                <TableHead className="w-[120px] text-right">Unit Price</TableHead>
                <TableHead className="w-[100px] text-center">Tax %</TableHead>
                <TableHead className="w-[120px] text-right">Line Total</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                const lineItem = watchedLineItems[index];
                return (
                  <TableRow key={field.id}>
                    {/* Description */}
                    <TableCell className="p-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Item description"
                                {...field}
                                className="border-0 shadow-none focus-visible:ring-0 min-w-[180px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* Quantity */}
                    <TableCell className="p-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                className="border-0 shadow-none focus-visible:ring-0 w-20 text-center"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* Unit Price */}
                    <TableCell className="p-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                                  {currencySymbol}
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                  className="border-0 shadow-none focus-visible:ring-0 pl-6 w-24 text-right"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* Tax Rate */}
                    <TableCell className="p-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.tax_rate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                  className="border-0 shadow-none focus-visible:ring-0 pr-6 w-20 text-center"
                                />
                                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                                  %
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* Line Total (calculated) */}
                    <TableCell className="p-2">
                      <div className="font-medium text-right min-w-[100px]">
                        {currencySymbol}{lineItem?.line_total?.toFixed(2) || '0.00'}
                      </div>
                    </TableCell>

                    {/* Remove Button */}
                    <TableCell className="p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        disabled={fields.length <= 1}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile-friendly card layout for small screens */}
      <div className="md:hidden space-y-4">
        {fields.map((field, index) => {
          const lineItem = watchedLineItems[index];
          return (
            <div key={field.id} className="border rounded-lg p-4 space-y-4">
              {/* Description */}
              <FormField
                control={form.control}
                name={`line_items.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Item description"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Quantity and Unit Price Row */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name={`line_items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`line_items.${index}.unit_price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Unit Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            {currencySymbol}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            className="pl-8"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Tax Rate and Line Total Row */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name={`line_items.${index}.tax_rate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Tax Rate</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel className="text-sm font-medium">Line Total</FormLabel>
                  <div className="h-10 flex items-center px-3 border rounded-md bg-muted font-medium">
                    {currencySymbol}{lineItem?.line_total?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
              
              {/* Remove Button */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeLineItem(index)}
                  disabled={fields.length <= 1}
                  className="text-destructive hover:text-destructive gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Item
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No line items added yet.</p>
          <Button
            type="button"
            variant="outline"
            onClick={addLineItem}
            className="mt-2 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Your First Item
          </Button>
        </div>
      )}
    </div>
  );
};

export default LineItemTable;

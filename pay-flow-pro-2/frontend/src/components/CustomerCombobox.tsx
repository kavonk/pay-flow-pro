import React, { useState, useCallback, useMemo } from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { useCustomers, useCreateCustomer } from 'utils/queryHooks';
import { cn } from 'utils/cn';
import { useDebounce } from '@uidotdev/usehooks';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormControl } from '@/components/ui/form';

interface CustomerComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface NewCustomerFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export const CustomerCombobox: React.FC<CustomerComboboxProps> = ({
  value,
  onValueChange,
  placeholder = "Search customers...",
  disabled = false,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerFormData>({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(search, 300);

  // Fetch customers with search
  const { data: customersData, isLoading } = useCustomers(1, 50, debouncedSearch);
  const customers = customersData?.customers || [];

  // Create customer mutation
  const createCustomerMutation = useCreateCustomer();

  // Find selected customer
  const selectedCustomer = useMemo(() => {
    if (!value) return null;
    return customers.find(customer => customer.id === value);
  }, [value, customers]);

  // Handle customer selection
  const handleSelect = useCallback((customerId: string) => {
    onValueChange(customerId);
    setOpen(false);
    setSearch('');
  }, [onValueChange]);

  // Handle create new customer
  const handleCreateNew = useCallback(() => {
    // Pre-fill name/email from search if it looks like an email
    const searchTerm = search.trim();
    if (searchTerm.includes('@')) {
      setNewCustomerData(prev => ({
        ...prev,
        email: searchTerm,
        name: ''
      }));
    } else {
      setNewCustomerData(prev => ({
        ...prev,
        name: searchTerm,
        email: ''
      }));
    }
    
    setShowCreateDialog(true);
    setOpen(false);
  }, [search]);

  // Handle customer creation
  const handleCustomerCreate = useCallback(async () => {
    if (!newCustomerData.name.trim() || !newCustomerData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setIsCreating(true);
    try {
      const newCustomer = await createCustomerMutation.mutateAsync({
        name: newCustomerData.name.trim(),
        email: newCustomerData.email.trim(),
        phone: newCustomerData.phone.trim() || undefined,
        notes: newCustomerData.notes.trim() || undefined
      });

      // Select the newly created customer
      onValueChange(newCustomer.id);
      
      // Close dialog and reset form
      setShowCreateDialog(false);
      setNewCustomerData({ name: '', email: '', phone: '', notes: '' });
      
      toast.success('Customer created successfully');
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast.error('Failed to create customer');
    } finally {
      setIsCreating(false);
    }
  }, [newCustomerData, createCustomerMutation, onValueChange]);

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setShowCreateDialog(false);
    setNewCustomerData({ name: '', email: '', phone: '', notes: '' });
  }, []);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between",
                !selectedCustomer && "text-muted-foreground",
                className
              )}
              disabled={disabled}
            >
              {selectedCustomer ? (
                <div className="flex flex-col items-start">
                  <span className="font-medium">{selectedCustomer.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedCustomer.email}
                  </span>
                </div>
              ) : (
                placeholder
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search customers by name or email..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <CommandEmpty>Searching...</CommandEmpty>
              ) : customers.length === 0 ? (
                <div className="p-2">
                  <CommandEmpty>No customers found.</CommandEmpty>
                  <Button
                    variant="ghost"
                    className="w-full justify-start mt-2"
                    onClick={handleCreateNew}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create new customer
                    {search.trim() && (
                      <span className="ml-1 text-muted-foreground">
                        "{search.trim()}"
                      </span>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <CommandGroup>
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => handleSelect(customer.id)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {customer.email}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4",
                            value === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <div className="border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-none"
                      onClick={handleCreateNew}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create new customer
                    </Button>
                  </div>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Customer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to your list. They'll be immediately available for selection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newCustomerData.name}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="customer@example.com"
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newCustomerData.notes}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this customer..."
                disabled={isCreating}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomerCreate}
              disabled={isCreating || !newCustomerData.name.trim() || !newCustomerData.email.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerCombobox;
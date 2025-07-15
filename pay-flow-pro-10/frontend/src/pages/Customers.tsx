import AppLayout from 'components/AppLayout';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Mail, Phone, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useCustomers, useDeleteCustomer } from 'utils/queryHooks';
import ExportComponent from 'components/ExportComponent';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

import brain from 'brain';
import { CustomerResponse, CustomersListResponse } from 'types';
import { useUserGuardContext } from 'app/auth';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { user } = useUserGuardContext();
  
  // State for pagination, search, and bulk selection
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Instant server-side search - no debouncing for immediate results
  const { data, isLoading: loading, error } = useCustomers(
    page, 
    20, 
    searchTerm.trim() || undefined
  );
  const deleteCustomerMutation = useDeleteCustomer();
  
  const customers = data?.customers || [];
  const hasNextPage = data?.has_next || false;
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; customer: CustomerResponse | null }>({ open: false, customer: null });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  // Bulk action handlers
  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    setBulkDeleteDialog(false);
    
    let successCount = 0;
    for (const customerId of Array.from(selectedCustomers)) {
      try {
        await deleteCustomerMutation.mutateAsync(customerId);
        successCount++;
      } catch (error) {
        console.error('Failed to delete customer:', customerId, error);
      }
    }
    
    setBulkActionLoading(false);
    setSelectedCustomers(new Set());
    toast.success(`Successfully deleted ${successCount} customers`);
  };

  const handleBulkExport = () => {
    const selectedCustomerData = customers.filter(customer => selectedCustomers.has(customer.id));
    
    // Create CSV content
    const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Notes', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...selectedCustomerData.map(customer => [
        customer.id,
        `"${customer.name || 'N/A'}"`,
        `"${customer.email || 'N/A'}"`,
        `"${customer.phone || 'N/A'}"`,
        `"${customer.notes || 'N/A'}"`,
        customer.created_at
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${selectedCustomerData.length} customers`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(new Set(customers.map(customer => customer.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    const newSelected = new Set(selectedCustomers);
    if (checked) {
      newSelected.add(customerId);
    } else {
      newSelected.delete(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleDeleteCustomer = async () => {
    if (!deleteDialog.customer) return;
    
    deleteCustomerMutation.mutate(deleteDialog.customer.id, {
      onSuccess: () => {
        setDeleteDialog({ open: false, customer: null });
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Customers</h1>
              <p className="text-muted-foreground">Manage your customer database</p>
            </div>
            <Button onClick={() => navigate('/create-customer')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
          
          <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>Failed to load customers. Please try refreshing the page.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Customers</h1>
            <p className="text-zinc-400 mt-2">
              Manage your customer base and build lasting relationships
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportComponent 
              type="customers" 
              variant="button" 
              size="sm"
              filters={{ search: searchTerm.trim() || undefined }}
            />
            <Button 
              onClick={() => navigate('/CreateCustomer')}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                    <Input
                      placeholder="Search customers by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1); // Reset to first page when searching
                      }}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <ExportComponent 
              type="customers" 
              variant="card"
              title="Export Data"
              description="Download customer data with invoice summaries"
              filters={{ search: searchTerm.trim() || undefined }}
            />
          </div>
        </div>

        {/* Customer List */}
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Customer Database</CardTitle>
              <div className="flex items-center space-x-2">
                {selectedCustomers.size > 0 && (
                  <>
                    <span className="text-sm text-zinc-400">
                      {selectedCustomers.size} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkDeleteDialog(true)}
                      disabled={bulkActionLoading}
                      className="border-red-700 text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkExport}
                      disabled={bulkActionLoading}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                  </>
                )}
              </div>
            </div>
            <CardDescription className="text-zinc-400">
              <span>
                {customers.length} {customers.length === 1 ? 'customer' : 'customers'} found
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && customers.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                <span className="ml-3 text-zinc-400">Searching customers...</span>
              </div>
            ) : customers.length > 0 ? (
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableHead className="text-zinc-300 w-12">
                        <Checkbox
                          checked={selectedCustomers.size === customers.length && customers.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-zinc-300">Name</TableHead>
                      <TableHead className="text-zinc-300">Email</TableHead>
                      <TableHead className="text-zinc-300">Phone</TableHead>
                      <TableHead className="text-zinc-300">Created</TableHead>
                      <TableHead className="text-zinc-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} className="border-zinc-800 hover:bg-zinc-800/30">
                        <TableCell>
                          <Checkbox
                            checked={selectedCustomers.has(customer.id)}
                            onCheckedChange={(checked) => handleSelectCustomer(customer.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-white">
                          {customer.name || 'Unnamed Customer'}
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {customer.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {customer.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {customer.phone}
                            </div>
                          ) : (
                            <span className="text-zinc-500">No phone</span>
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {formatDate(customer.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/EditCustomer?id=${customer.id}`)}
                              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, customer })}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-zinc-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No customers found</h3>
                <p className="text-zinc-400 mb-6">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Add your first customer to get started.'}
                </p>
                <Button 
                  onClick={() => navigate('/CreateCustomer')}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Customer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {(customers.length > 0 || page > 1) && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {page} of customers
              {searchTerm && ` (search: "${searchTerm}")`}
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasNextPage || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, customer: null })}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Customer</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Are you sure you want to delete {deleteDialog.customer?.name || 'this customer'}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, customer: null })}
                disabled={deleteCustomerMutation.isPending}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCustomer}
                disabled={deleteCustomerMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteCustomerMutation.isPending ? 'Deleting...' : 'Delete Customer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Selected Customers</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Are you sure you want to delete {selectedCustomers.size} selected customers? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkDeleteDialog(false)}
                disabled={bulkActionLoading}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {bulkActionLoading ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Send,
  Edit,
  Download,
  ExternalLink,
  Plus,
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { useInvoices } from 'utils/queryHooks';
import { InvoiceResponse } from 'types';
import { toast } from 'sonner';
import brain from 'brain';

export interface DrillDownFilter {
  type: 'revenue' | 'outstanding' | 'paid' | 'overdue' | 'sent' | 'draft';
  label: string;
  description: string;
}

interface InvoiceDrillDownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: DrillDownFilter;
}

type SortField = 'amount' | 'issue_date' | 'due_date' | 'customer_name';
type SortDirection = 'asc' | 'desc';

const InvoiceDrillDownModal: React.FC<InvoiceDrillDownModalProps> = ({
  open,
  onOpenChange,
  filter,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('issue_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  
  const limit = 10;
  
  // Map filter type to invoice status for API
  const getStatusFilter = () => {
    switch (filter.type) {
      case 'paid':
        return 'paid';
      case 'overdue':
        return 'overdue';
      case 'sent':
        return 'sent';
      case 'draft':
        return 'draft';
      case 'revenue':
        return 'paid'; // Show paid invoices for revenue
      case 'outstanding':
        return undefined; // We'll handle this with custom filtering
      default:
        return undefined;
    }
  };
  
  const statusFilter = getStatusFilter();
  
  const { data, isLoading, error } = useInvoices(
    currentPage,
    limit,
    statusFilter,
    undefined,
    searchTerm
  );
  
  // Filter invoices for "outstanding" which includes sent + overdue
  const filteredInvoices = React.useMemo(() => {
    if (!data?.invoices) return [];
    
    let invoices = data.invoices;
    
    if (filter.type === 'outstanding') {
      invoices = invoices.filter(invoice => 
        invoice.status === 'sent' || invoice.status === 'overdue'
      );
    }
    
    // Apply sorting
    return [...invoices].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'amount':
          aVal = parseFloat(a.amount);
          bVal = parseFloat(b.amount);
          break;
        case 'issue_date':
          aVal = new Date(a.issue_date);
          bVal = new Date(b.issue_date);
          break;
        case 'due_date':
          aVal = new Date(a.due_date);
          bVal = new Date(b.due_date);
          break;
        case 'customer_name':
          aVal = a.customer_name.toLowerCase();
          bVal = b.customer_name.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data?.invoices, filter.type, sortField, sortDirection]);
  
  const totalCount = filter.type === 'outstanding' 
    ? filteredInvoices.length 
    : data?.total || 0;
    
  const hasNextPage = currentPage * limit < totalCount;
  const hasPrevPage = currentPage > 1;
  
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      sent: 'secondary',
      overdue: 'destructive',
      draft: 'outline',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <SortAsc className="h-3 w-3 ml-1" /> : 
      <SortDesc className="h-3 w-3 ml-1" />;
  };
  
  const handleSendInvoice = async (invoiceId: string) => {
    setSendingInvoice(invoiceId);
    try {
      const response = await brain.send_invoice_endpoint({ invoice_id: invoiceId });
      if (response.ok) {
        toast.success('Invoice sent successfully');
      } else {
        toast.error('Failed to send invoice');
      }
    } catch (error) {
      toast.error('Failed to send invoice');
    } finally {
      setSendingInvoice(null);
    }
  };
  
  const handleCreateInvoice = () => {
    onOpenChange(false);
    navigate('/create-invoice');
  };
  
  const handleViewAllInvoices = () => {
    onOpenChange(false);
    navigate('/invoices');
  };
  
  const handleEditInvoice = (invoiceId: string) => {
    onOpenChange(false);
    navigate(`/invoices/${invoiceId}/edit`);
  };
  
  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{filter.label}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filter.description}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCreateInvoice}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewAllInvoices}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View All
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {filter.description}
          </DialogDescription>
        </DialogHeader>
        
        {/* Search and filters */}
        <div className="flex-shrink-0 flex items-center gap-4 py-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="issue_date">Issue Date</SelectItem>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="customer_name">Customer</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="gap-2"
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>
        
        {/* Results */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardContent className="pt-6">
                <p className="text-red-600 dark:text-red-400">Failed to load invoices</p>
              </CardContent>
            </Card>
          ) : filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No invoices found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('customer_name')}
                  >
                    <div className="flex items-center">
                      Customer {getSortIcon('customer_name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      Amount {getSortIcon('amount')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('issue_date')}
                  >
                    <div className="flex items-center">
                      Issue Date {getSortIcon('issue_date')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('due_date')}
                  >
                    <div className="flex items-center">
                      Due Date {getSortIcon('due_date')}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{invoice.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{invoice.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.status === 'draft' || invoice.status === 'sent' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendInvoice(invoice.id)}
                            disabled={sendingInvoice === invoice.id}
                            className="gap-1"
                          >
                            {sendingInvoice === invoice.id ? (
                              <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Send
                          </Button>
                        ) : null}
                        
                        {invoice.status !== 'paid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditInvoice(invoice.id)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                        )}
                        
                        {invoice.stripe_payment_link_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.stripe_payment_link_url!, '_blank')}
                            className="gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        {/* Pagination */}
        {filteredInvoices.length > 0 && (
          <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} invoices
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!hasPrevPage}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!hasNextPage}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDrillDownModal;
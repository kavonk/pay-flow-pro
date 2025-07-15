import React, { useState, useMemo } from 'react';
import { useInvoices, useDeleteInvoice, useSendInvoice } from 'utils/queryHooks';
import AppLayout from 'components/AppLayout';
import { useNavigate } from 'react-router-dom';
import { useUserGuardContext } from 'app/auth';
import ExportComponent from 'components/ExportComponent';
import brain from 'brain';
import {
  InvoicesListResponse,
  InvoiceResponse
} from 'types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Edit, Trash2, Send, Search, Download, Filter, Settings, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { usePayoutAccount } from 'utils/queryHooks';
import PayoutAccountRequiredModal from 'components/PayoutAccountRequiredModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InvoicesProps {}

const Invoices: React.FC<InvoicesProps> = () => {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  
  // State for pagination, search, and filtering
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  // Advanced filtering and sorting state
  const [dateFilters, setDateFilters] = useState({
    issueDateAfter: undefined as Date | undefined,
    issueDateBefore: undefined as Date | undefined,
    dueDateAfter: undefined as Date | undefined,
    dueDateBefore: undefined as Date | undefined,
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [columnVisibility, setColumnVisibility] = useState({
    invoiceNumber: true,
    customer: true,
    amount: true,
    issued: true,
    due: true,
    status: true,
    description: false,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Get export filters for the export component
  const getExportFilters = () => {
    const filters: Record<string, any> = {};
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }
    if (statusFilter.length === 1) {
      filters.status = statusFilter[0];
    }
    return filters;
  };
  
  // Enhanced server-side search with advanced filtering and sorting
  const { data, isLoading: loading, error } = useInvoices(
    page, 
    20, 
    statusFilter.length === 1 ? statusFilter[0] : undefined,
    undefined, // customer_id
    searchTerm.trim() || undefined,
    dateFilters.issueDateAfter ? format(dateFilters.issueDateAfter, 'yyyy-MM-dd') : undefined,
    dateFilters.issueDateBefore ? format(dateFilters.issueDateBefore, 'yyyy-MM-dd') : undefined,
    dateFilters.dueDateAfter ? format(dateFilters.dueDateAfter, 'yyyy-MM-dd') : undefined,
    dateFilters.dueDateBefore ? format(dateFilters.dueDateBefore, 'yyyy-MM-dd') : undefined,
    sortBy,
    sortOrder
  );
  const deleteInvoiceMutation = useDeleteInvoice();
  const sendInvoiceMutation = useSendInvoice();
  
  const invoices = data?.invoices || [];
  const hasNextPage = data?.has_next || false;
    
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; invoiceId: string | null }>({ open: false, invoiceId: null });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Payout account validation
  const { data: payoutAccount, isLoading: payoutLoading } = usePayoutAccount();
  const isPayoutActive = payoutAccount?.account_status === 'active';

  // Define InvoiceStatus enum
  const InvoiceStatus = {
    DRAFT: 'draft',
    SENT: 'sent', 
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled'
  } as const;

  // Bulk action handlers
  const handleBulkSend = async () => {
    if (!isPayoutActive) {
      setShowPayoutModal(true);
      return;
    }
    
    setBulkActionLoading(true);
    const sendableInvoices = Array.from(selectedInvoices).filter(id => {
      const invoice = invoices.find(inv => inv.id === id);
      return invoice && invoice.status !== 'paid' && invoice.status !== 'cancelled';
    });
    
    let successCount = 0;
    for (const invoiceId of sendableInvoices) {
      try {
        await sendInvoiceMutation.mutateAsync(invoiceId);
        successCount++;
      } catch (error) {
        console.error('Failed to send invoice:', invoiceId, error);
      }
    }
    
    setBulkActionLoading(false);
    setSelectedInvoices(new Set());
    toast.success(`Successfully sent ${successCount} of ${sendableInvoices.length} invoices`);
  };

  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    setBulkDeleteDialog(false);
    
    let successCount = 0;
    for (const invoiceId of Array.from(selectedInvoices)) {
      try {
        await deleteInvoiceMutation.mutateAsync(invoiceId);
        successCount++;
      } catch (error) {
        console.error('Failed to delete invoice:', invoiceId, error);
      }
    }
    
    setBulkActionLoading(false);
    setSelectedInvoices(new Set());
    toast.success(`Successfully deleted ${successCount} invoices`);
  };

  const handleBulkExport = () => {
    const selectedInvoiceData = invoices.filter(invoice => selectedInvoices.has(invoice.id));
    
    // Create CSV content
    const headers = ['Invoice ID', 'Customer Name', 'Customer Email', 'Amount', 'Currency', 'Issue Date', 'Due Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...selectedInvoiceData.map(invoice => [
        invoice.id,
        `"${invoice.customer_name || 'Unknown Customer'}"`,
        `"${invoice.customer_email || 'N/A'}"`,
        invoice.amount,
        invoice.currency,
        invoice.issue_date,
        invoice.due_date,
        invoice.status
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${selectedInvoiceData.length} invoices`);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setPage(1); // Reset to first page when filtering
  };

  const handleDeleteInvoice = async () => {
    if (!deleteDialog.invoiceId) return;
    
    deleteInvoiceMutation.mutate(deleteDialog.invoiceId, {
      onSuccess: () => {
        setDeleteDialog({ open: false, invoiceId: null });
      }
    });
  };

  const handleSendInvoice = async (invoiceId: string) => {
    if (!isPayoutActive) {
      setShowPayoutModal(true);
      return;
    }
    
    setSendingInvoice(invoiceId);
    sendInvoiceMutation.mutate(invoiceId, {
      onSettled: () => {
        setSendingInvoice(null);
      }
    });
  };

  const handleCreateInvoice = () => {
    if (!isPayoutActive) {
      setShowPayoutModal(true);
      return;
    }
    navigate('/create-invoice');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(invoices.map(inv => inv.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const getStatusBadge = (status: string, invoice?: InvoiceResponse) => {
    const today = new Date();
    const dueDate = invoice ? new Date(invoice.due_date) : null;
    const isOverdueSoon = dueDate && dueDate > today && (dueDate.getTime() - today.getTime()) <= (3 * 24 * 60 * 60 * 1000);
    const isHighPriority = dueDate && (today.getTime() - dueDate.getTime()) > (30 * 24 * 60 * 60 * 1000);
    
    const statusConfig = {
      draft: { color: 'bg-zinc-600 text-zinc-200', icon: null },
      sent: { color: 'bg-blue-600 text-blue-100', icon: null },
      paid: { color: 'bg-green-600 text-green-100', icon: null },
      overdue: { color: 'bg-red-600 text-red-100', icon: isHighPriority ? AlertTriangle : null },
      cancelled: { color: 'bg-zinc-500 text-zinc-200', icon: null }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <div className="flex items-center gap-1">
        <Badge className={`${config.color} border-0`}>
          {config.icon && <config.icon className="h-3 w-3 mr-1" />}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
        {isOverdueSoon && status !== 'paid' && status !== 'cancelled' && (
          <Clock className="h-4 w-4 text-amber-500" title="Due within 3 days" />
        )}
      </div>
    );
  };

  const formatCurrency = (amount: string | number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  // Calculate metrics from current data
  const metrics = useMemo(() => {
    if (!invoices.length) {
      return {
        totalInvoices: 0,
        totalAmount: 0,
        totalOutstanding: 0,
        currency: 'USD'
      };
    }
    
    const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0);
    const totalOutstanding = invoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0);
    
    return {
      totalInvoices: data?.total || invoices.length,
      totalAmount,
      totalOutstanding,
      currency: invoices[0]?.currency || 'USD'
    };
  }, [invoices, data?.total]);
  
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter([]);
    setDateFilters({
      issueDateAfter: undefined,
      issueDateBefore: undefined,
      dueDateAfter: undefined,
      dueDateBefore: undefined,
    });
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
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
                    <Skeleton className="h-4 w-full" />
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
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-500">{error instanceof Error ? error.message : 'An error occurred'}</div>
              <div className="text-center mt-4">
                <Button onClick={() => window.location.reload()}>Try Again</Button>
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
            <h1 className="text-3xl font-bold tracking-tight text-white">Invoices</h1>
            <p className="text-zinc-400 mt-2">
              Create, send, and track all your invoices in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportComponent 
              type="invoices" 
              variant="button" 
              size="sm"
              filters={getExportFilters()}
            />
            <Button 
              onClick={handleCreateInvoice}
              disabled={payoutLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Metrics Summary Bar */}
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{metrics.totalInvoices}</div>
                <div className="text-sm text-zinc-400">Total Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(metrics.totalAmount, metrics.currency)}
                </div>
                <div className="text-sm text-zinc-400">Total Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {formatCurrency(metrics.totalOutstanding, metrics.currency)}
                </div>
                <div className="text-sm text-zinc-400">Outstanding</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search and Basic Filters */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                  <Input
                    placeholder="Search invoices by customer name, description..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {showAdvancedFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Clear
                </Button>
              </div>
              
              {/* Status Filter Pills */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-zinc-400">Status:</span>
                {Object.values(InvoiceStatus).map(status => (
                  <Button
                    key={status}
                    variant={statusFilter.includes(status) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleStatusFilterChange(status)}
                    className={`capitalize ${statusFilter.includes(status) ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
              
              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
                  {/* Issue Date Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Issue Date From</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 text-white",
                            !dateFilters.issueDateAfter && "text-zinc-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFilters.issueDateAfter ? format(dateFilters.issueDateAfter, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700">
                        <Calendar
                          mode="single"
                          selected={dateFilters.issueDateAfter}
                          onSelect={(date) => {
                            setDateFilters(prev => ({ ...prev, issueDateAfter: date }));
                            setPage(1);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Issue Date To</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 text-white",
                            !dateFilters.issueDateBefore && "text-zinc-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFilters.issueDateBefore ? format(dateFilters.issueDateBefore, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700">
                        <Calendar
                          mode="single"
                          selected={dateFilters.issueDateBefore}
                          onSelect={(date) => {
                            setDateFilters(prev => ({ ...prev, issueDateBefore: date }));
                            setPage(1);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Due Date From</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 text-white",
                            !dateFilters.dueDateAfter && "text-zinc-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFilters.dueDateAfter ? format(dateFilters.dueDateAfter, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700">
                        <Calendar
                          mode="single"
                          selected={dateFilters.dueDateAfter}
                          onSelect={(date) => {
                            setDateFilters(prev => ({ ...prev, dueDateAfter: date }));
                            setPage(1);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Due Date To</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 text-white",
                            !dateFilters.dueDateBefore && "text-zinc-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFilters.dueDateBefore ? format(dateFilters.dueDateBefore, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700">
                        <Calendar
                          mode="single"
                          selected={dateFilters.dueDateBefore}
                          onSelect={(date) => {
                            setDateFilters(prev => ({ ...prev, dueDateBefore: date }));
                            setPage(1);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Invoice List */}
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Invoice History</CardTitle>
              <div className="flex items-center space-x-2">
                {selectedInvoices.size > 0 && (
                  <>
                    <span className="text-sm text-zinc-400">
                      {selectedInvoices.size} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkSend}
                      disabled={bulkActionLoading}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Selected
                    </Button>
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
              {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && invoices.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                <span className="ml-3 text-zinc-400">Searching invoices...</span>
              </div>
            ) : invoices.length > 0 ? (
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableHead className="text-zinc-300 w-12">
                        <Checkbox
                          checked={selectedInvoices.size === invoices.length && invoices.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-zinc-300 cursor-pointer" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center">
                          Invoice ID
                          {sortBy === 'created_at' && (
                            sortOrder === 'desc' ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-zinc-300 cursor-pointer" onClick={() => handleSort('customer_name')}>
                        <div className="flex items-center">
                          Customer
                          {sortBy === 'customer_name' && (
                            sortOrder === 'desc' ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-zinc-300 cursor-pointer" onClick={() => handleSort('amount')}>
                        <div className="flex items-center">
                          Amount
                          {sortBy === 'amount' && (
                            sortOrder === 'desc' ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-zinc-300 cursor-pointer" onClick={() => handleSort('issue_date')}>
                        <div className="flex items-center">
                          Issued
                          {sortBy === 'issue_date' && (
                            sortOrder === 'desc' ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-zinc-300 cursor-pointer" onClick={() => handleSort('due_date')}>
                        <div className="flex items-center">
                          Due
                          {sortBy === 'due_date' && (
                            sortOrder === 'desc' ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-zinc-300 cursor-pointer" onClick={() => handleSort('status')}>
                        <div className="flex items-center">
                          Status
                          {sortBy === 'status' && (
                            sortOrder === 'desc' ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-zinc-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow 
                        key={invoice.id} 
                        className="border-zinc-800 hover:bg-zinc-800/30 cursor-pointer"
                        onClick={() => navigate(`/invoice-detail?id=${invoice.id}`)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedInvoices.has(invoice.id)}
                            onCheckedChange={(checked) => handleSelectInvoice(invoice.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-400">#{invoice.id.split('-')[0]}...</TableCell>
                        <TableCell className="font-medium text-white">{invoice.customer_name || 'Unknown Customer'}</TableCell>
                        <TableCell className="text-white">{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                        <TableCell className="text-zinc-400">{formatDate(invoice.issue_date)}</TableCell>
                        <TableCell className="text-zinc-400">{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status, invoice)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                           {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSendInvoice(invoice.id)}
                                      disabled={sendingInvoice === invoice.id}
                                      className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    >
                                      {sendingInvoice === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Send Invoice</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/EditInvoice?id=${invoice.id}`)}
                                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Invoice</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteDialog({ open: true, invoiceId: invoice.id })}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Invoice</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Table Summary Row */}
                {invoices.length > 0 && (
                  <div className="mt-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Summary ({invoices.length} invoices on this page):</span>
                      <div className="flex space-x-6">
                        <span className="text-zinc-300">
                          Total: <span className="font-semibold text-white">
                            {formatCurrency(
                              invoices.reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0),
                              invoices[0]?.currency || 'USD'
                            )}
                          </span>
                        </span>
                        <span className="text-amber-400">
                          Outstanding: <span className="font-semibold">
                            {formatCurrency(
                              invoices
                                .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
                                .reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0),
                              invoices[0]?.currency || 'USD'
                            )}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-zinc-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No invoices found</h3>
                <p className="text-zinc-400 mb-6">
                  {searchTerm ? 'Try adjusting your search or filters.' : 'Create your first invoice to get started.'}
                </p>
                <Button 
                  onClick={handleCreateInvoice}
                  disabled={payoutLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Pagination Controls */}
        {(invoices.length > 0 || page > 1) && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {page} of invoices
              {statusFilter.length === 1 && ` (filtered by ${statusFilter[0]})`}
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
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, invoiceId: null })}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Invoice</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Are you sure you want to delete this invoice? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, invoiceId: null })}
                disabled={deleteInvoiceMutation.isPending}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteInvoice}
                disabled={deleteInvoiceMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteInvoiceMutation.isPending ? 'Deleting...' : 'Delete Invoice'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Selected Invoices</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Are you sure you want to delete {selectedInvoices.size} selected invoices? This action cannot be undone.
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

        {/* Payout Account Required Modal */}
        <PayoutAccountRequiredModal 
          open={showPayoutModal}
          onOpenChange={setShowPayoutModal}
        />
      </div>
    </AppLayout>
  );
};

export default Invoices;
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import brain from 'brain';
import { 
  FinancialStats, 
  SettlementSummary, 
  CustomersListResponse, 
  InvoicesListResponse,
  CustomerResponse,
  InvoiceResponse,
  DunningRule,
  DunningRuleCreate,
  DunningRuleUpdate,
  PayoutAccountResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  BrandingSettingsResponse
} from 'types';

// Invitation Details Interface
export interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  is_expired: boolean;
  account_name: string;
}
import { toast } from 'sonner';

// Query Keys - centralized for cache management
export const queryKeys = {
  financialStats: ['financial-stats'] as const,
  settlementSummary: ['settlement-summary'] as const,
  customers: (page = 1, limit = 20, search?: string) => ['customers', { page, limit, search }] as const,
  invoices: (page = 1, limit = 20, status?: string, customerId?: string, search?: string, issueDateAfter?: string, issueDateBefore?: string, dueDateAfter?: string, dueDateBefore?: string, sortBy?: string, sortOrder?: string) => ['invoices', { page, limit, status, customerId, search, issueDateAfter, issueDateBefore, dueDateAfter, dueDateBefore, sortBy, sortOrder }] as const,
  customer: (id: string) => ['customer', id] as const,
  invoice: (id: string) => ['invoice', id] as const,
  branding: ['branding'] as const,
};

// Dunning Rules Query Keys
export const dunningQueryKeys = {
  all: ['dunning'] as const,
  rules: ['dunning', 'rules'] as const,
};

// Payout Query Keys
export const payoutQueryKeys = {
  all: ['payout'] as const,
  account: ['payout', 'account'] as const,
};

// Team Query Keys
export const teamQueryKeys = {
  all: ['team'] as const,
  members: ['team', 'members'] as const,
  invitations: ['team', 'invitations'] as const,
  role: ['team', 'role'] as const,
  invitationDetails: (token: string) => ['invitation-details', token] as const,
};

// Financial Stats Hook
export const useFinancialStats = () => {
  return useQuery({
    queryKey: queryKeys.financialStats,
    queryFn: async (): Promise<FinancialStats> => {
      const response = await brain.get_financial_stats();
      if (!response.ok) {
        throw new Error(`Failed to fetch financial stats: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes  
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Branding Settings Hook
export const useBrandingSettings = () => {
  return useQuery({
    queryKey: queryKeys.branding,
    queryFn: async (): Promise<BrandingSettingsResponse> => {
      const response = await brain.get_branding_settings();
      if (!response.ok) {
        throw new Error(`Failed to fetch branding settings: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Settlement Summary Hook
export const useSettlementSummary = () => {
  return useQuery({
    queryKey: queryKeys.settlementSummary,
    queryFn: async (): Promise<SettlementSummary | null> => {
      try {
        const response = await brain.get_settlement_summary();
        if (response.status === 404) {
          return null; // No payout account exists
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch settlement summary: ${response.status}`);
        }
        return response.json();
      } catch (error: any) {
        // Handle 404 errors gracefully
        if (error?.response?.status === 404 || error?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors or when no payout account exists
      if (error?.response?.status === 404 || error?.status === 404 || error?.message?.includes('404')) {
        return false;
      }
      return failureCount < 1;
    },
  });
};

// Customers Hook with pagination
export const useCustomers = (page = 1, limit = 20, search?: string) => {
  return useQuery({
    queryKey: queryKeys.customers(page, limit, search),
    queryFn: async (): Promise<CustomersListResponse> => {
      const params: any = { page, limit };
      if (search && search.trim()) {
        params.search = search.trim();
      }
      
      const response = await brain.get_customers_endpoint(params);
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds for faster refresh
    gcTime: 2 * 60 * 1000, // 2 minutes
    // Use previous data while loading new search results for smooth UX
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Single Customer Hook
export const useCustomer = (customerId: string) => {
  return useQuery({
    queryKey: queryKeys.customer(customerId),
    queryFn: async (): Promise<CustomerResponse> => {
      const response = await brain.get_customer_endpoint({ customerId });
      if (!response.ok) {
        throw new Error(`Failed to fetch customer: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!customerId,
  });
};

// Customer Mutations
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerData: CreateCustomerRequest) => {
      const response = await brain.create_customer_endpoint(customerData);
      if (!response.ok) {
        throw new Error('Failed to create customer');
      }
      return response.json();
    },
    onMutate: async (newCustomer: CreateCustomerRequest) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      
      // Create optimistic customer with temporary ID
      const optimisticCustomer: CustomerResponse = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone || null,
        notes: newCustomer.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Snapshot the previous value for all customer queries
      const previousCustomers = new Map();
      
      // Update all customer list queries in cache
      queryClient.getQueriesData({ queryKey: ['customers'] }).forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'customers' in oldData) {
          const oldCustomersList = oldData as CustomersListResponse;
          previousCustomers.set(queryKey, oldCustomersList);
          
          // Add new customer to the beginning of the list
          const updatedCustomers: CustomersListResponse = {
            ...oldCustomersList,
            customers: [optimisticCustomer, ...oldCustomersList.customers],
            total: oldCustomersList.total + 1
          };
          
          queryClient.setQueryData(queryKey, updatedCustomers);
        }
      });
      
      // Return context for rollback
      return { previousCustomers, optimisticCustomer };
    },
    onSuccess: (newCustomer, _, context) => {
      // Replace optimistic customer with real one
      queryClient.getQueriesData({ queryKey: ['customers'] }).forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'customers' in oldData) {
          const oldCustomersList = oldData as CustomersListResponse;
          const updatedCustomers: CustomersListResponse = {
            ...oldCustomersList,
            customers: oldCustomersList.customers.map(customer => 
              customer.id === context?.optimisticCustomer.id ? newCustomer : customer
            )
          };
          queryClient.setQueryData(queryKey, updatedCustomers);
        }
      });
      
      // Also invalidate financial stats as they may be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.financialStats });
      toast.success('Customer created successfully');
    },
    onError: (error, _, context) => {
      // Rollback optimistic updates
      if (context?.previousCustomers) {
        context.previousCustomers.forEach((oldData, queryKey) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      console.error('Failed to create customer:', error);
      toast.error('Failed to create customer');
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ customerId, customerData }: { customerId: string; customerData: UpdateCustomerRequest }) => {
      const response = await brain.update_customer_endpoint({ customerId }, customerData);
      if (!response.ok) {
        throw new Error('Failed to update customer');
      }
      return response.json();
    },
    onMutate: async ({ customerId, customerData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      await queryClient.cancelQueries({ queryKey: queryKeys.customer(customerId) });
      
      // Snapshot the previous values
      const previousCustomers = new Map();
      const previousCustomer = queryClient.getQueryData(queryKeys.customer(customerId));
      
      // Update all customer list queries in cache
      queryClient.getQueriesData({ queryKey: ['customers'] }).forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'customers' in oldData) {
          const oldCustomersList = oldData as CustomersListResponse;
          previousCustomers.set(queryKey, oldCustomersList);
          
          // Update the customer in the list
          const updatedCustomers: CustomersListResponse = {
            ...oldCustomersList,
            customers: oldCustomersList.customers.map(customer => {
              if (customer.id === customerId) {
                return {
                  ...customer,
                  name: customerData.name || customer.name,
                  email: customerData.email || customer.email,
                  phone: customerData.phone !== undefined ? customerData.phone : customer.phone,
                  notes: customerData.notes !== undefined ? customerData.notes : customer.notes,
                  updated_at: new Date().toISOString()
                };
              }
              return customer;
            })
          };
          
          queryClient.setQueryData(queryKey, updatedCustomers);
        }
      });
      
      // Update single customer query if it exists
      if (previousCustomer && typeof previousCustomer === 'object') {
        const updatedCustomer = {
          ...previousCustomer as CustomerResponse,
          name: customerData.name || (previousCustomer as CustomerResponse).name,
          email: customerData.email || (previousCustomer as CustomerResponse).email,
          phone: customerData.phone !== undefined ? customerData.phone : (previousCustomer as CustomerResponse).phone,
          notes: customerData.notes !== undefined ? customerData.notes : (previousCustomer as CustomerResponse).notes,
          updated_at: new Date().toISOString()
        };
        queryClient.setQueryData(queryKeys.customer(customerId), updatedCustomer);
      }
      
      return { previousCustomers, previousCustomer };
    },
    onSuccess: (updatedCustomer, { customerId }) => {
      // Replace optimistic updates with server data
      queryClient.setQueryData(queryKeys.customer(customerId), updatedCustomer);
      
      // Update customer in all list queries
      queryClient.getQueriesData({ queryKey: ['customers'] }).forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'customers' in oldData) {
          const oldCustomersList = oldData as CustomersListResponse;
          const updatedCustomers: CustomersListResponse = {
            ...oldCustomersList,
            customers: oldCustomersList.customers.map(customer => 
              customer.id === customerId ? updatedCustomer : customer
            )
          };
          queryClient.setQueryData(queryKey, updatedCustomers);
        }
      });
      
      toast.success('Customer updated successfully');
    },
    onError: (error, { customerId }, context) => {
      // Rollback optimistic updates
      if (context?.previousCustomers) {
        context.previousCustomers.forEach((oldData, queryKey) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      if (context?.previousCustomer) {
        queryClient.setQueryData(queryKeys.customer(customerId), context.previousCustomer);
      }
      console.error('Failed to update customer:', error);
      toast.error('Failed to update customer');
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerId: string) => {
      const response = await brain.delete_customer_endpoint({ customerId });
      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }
      return response.json();
    },
    onMutate: async (customerId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      await queryClient.cancelQueries({ queryKey: queryKeys.customer(customerId) });
      
      // Snapshot the previous values
      const previousCustomers = new Map();
      const previousCustomer = queryClient.getQueryData(queryKeys.customer(customerId));
      
      // Remove customer from all list queries
      queryClient.getQueriesData({ queryKey: ['customers'] }).forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'customers' in oldData) {
          const oldCustomersList = oldData as CustomersListResponse;
          previousCustomers.set(queryKey, oldCustomersList);
          
          // Remove the customer from the list
          const updatedCustomers: CustomersListResponse = {
            ...oldCustomersList,
            customers: oldCustomersList.customers.filter(customer => customer.id !== customerId),
            total: Math.max(0, oldCustomersList.total - 1)
          };
          
          queryClient.setQueryData(queryKey, updatedCustomers);
        }
      });
      
      // Remove single customer query
      queryClient.removeQueries({ queryKey: queryKeys.customer(customerId) });
      
      return { previousCustomers, previousCustomer, customerId };
    },
    onSuccess: () => {
      // Invalidate financial stats as they may be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.financialStats });
      toast.success('Customer deleted successfully');
    },
    onError: (error, customerId, context) => {
      // Rollback optimistic updates
      if (context?.previousCustomers) {
        context.previousCustomers.forEach((oldData, queryKey) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      if (context?.previousCustomer) {
        queryClient.setQueryData(queryKeys.customer(customerId), context.previousCustomer);
      }
      console.error('Failed to delete customer:', error);
      toast.error('Failed to delete customer');
    },
  });
};

// Invoices Hook with pagination, filters, and search
export const useInvoices = (page = 1, limit = 20, status?: string, customerId?: string, search?: string, issueDateAfter?: string, issueDateBefore?: string, dueDateAfter?: string, dueDateBefore?: string, sortBy?: string, sortOrder?: string) => {
  return useQuery({
    queryKey: queryKeys.invoices(page, limit, status, customerId, search, issueDateAfter, issueDateBefore, dueDateAfter, dueDateBefore, sortBy, sortOrder),
    queryFn: async (): Promise<InvoicesListResponse> => {
      const params: any = { page, limit };
      if (status) {
        params.status = status;
      }
      if (customerId) {
        params.customer_id = customerId;
      }
      if (search && search.trim()) {
        params.search = search.trim();
      }
      if (issueDateAfter) {
        params.issue_date_after = issueDateAfter;
      }
      if (issueDateBefore) {
        params.issue_date_before = issueDateBefore;
      }
      if (dueDateAfter) {
        params.due_date_after = dueDateAfter;
      }
      if (dueDateBefore) {
        params.due_date_before = dueDateBefore;
      }
      if (sortBy) {
        params.sort_by = sortBy;
      }
      if (sortOrder) {
        params.sort_order = sortOrder;
      }
      
      const response = await brain.get_invoices_endpoint(params);
      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds for faster refresh
    gcTime: 2 * 60 * 1000, // 2 minutes
    // Use previous data while loading new search results for smooth UX
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Single Invoice Hook
export const useInvoice = (invoiceId: string) => {
  return useQuery({
    queryKey: queryKeys.invoice(invoiceId),
    queryFn: async (): Promise<InvoiceResponse> => {
      const response = await brain.get_invoice_endpoint({ invoiceId });
      if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!invoiceId,
  });
};

// Invoice Mutations
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceData: CreateInvoiceRequest) => {
      const response = await brain.create_invoice_endpoint(invoiceData);
      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }
      return response.json();
    },
    onMutate: async (newInvoice: CreateInvoiceRequest) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['invoices'] });
      
      // Get customer data for the invoice
      const customerData = queryClient.getQueryData(queryKeys.customer(newInvoice.customer_id));
      const customer = customerData as CustomerResponse | undefined;
      
      // Create optimistic invoice with temporary ID
      const optimisticInvoice: InvoiceResponse = {
        id: `temp-${Date.now()}`,
        customer_id: newInvoice.customer_id,
        customer_name: customer?.name || 'Unknown Customer',
        customer_email: customer?.email || '',
        amount: newInvoice.amount.toString(),
        currency: newInvoice.currency || 'EUR',
        issue_date: newInvoice.issue_date,
        due_date: newInvoice.due_date,
        description: newInvoice.description || null,
        status: 'draft',
        stripe_payment_link_id: null,
        stripe_payment_link_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Snapshot the previous value for all invoice queries
      const previousInvoices = new Map();
      
      // Update all invoice list queries in cache
      queryClient.getQueriesData({ queryKey: ['invoices'] }).forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'invoices' in oldData) {
          const oldInvoicesList = oldData as InvoicesListResponse;
          previousInvoices.set(queryKey, oldInvoicesList);
          
          // Add new invoice to the beginning of the list
          const updatedInvoices: InvoicesListResponse = {
            ...oldInvoicesList,
            invoices: [optimisticInvoice, ...oldInvoicesList.invoices],
            total: oldInvoicesList.total + 1
          };
          
          queryClient.setQueryData(queryKey, updatedInvoices);
        }
      });
      
      // Return context for rollback
      return { previousInvoices, optimisticInvoice };
    },
    onSuccess: (newInvoice, _, context) => {
      // Replace optimistic invoice with real one
      queryClient.getQueriesData({ queryKey: ['invoices'] }).forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'invoices' in oldData) {
          const oldInvoicesList = oldData as InvoicesListResponse;
          const updatedInvoices: InvoicesListResponse = {
            ...oldInvoicesList,
            invoices: oldInvoicesList.invoices.map(invoice => 
              invoice.id === context?.optimisticInvoice.id ? newInvoice : invoice
            )
          };
          queryClient.setQueryData(queryKey, updatedInvoices);
        }
      });
      
      // Also invalidate financial stats as they depend on invoice data
      queryClient.invalidateQueries({ queryKey: queryKeys.financialStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.settlementSummary });
      toast.success('Invoice created successfully');
    },
    onError: (error, _, context) => {
      // Rollback optimistic updates
      if (context?.previousInvoices) {
        context.previousInvoices.forEach((oldData, queryKey) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      console.error('Failed to create invoice:', error);
      toast.error('Failed to create invoice');
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invoiceId, invoiceData }: { invoiceId: string; invoiceData: UpdateInvoiceRequest }) => {
      const response = await brain.update_invoice_endpoint({ invoiceId }, invoiceData);
      if (!response.ok) {
        throw new Error('Failed to update invoice');
      }
      return response.json();
    },
    onSuccess: (_, { invoiceId }) => {
      // Invalidate all invoice queries to refresh the data instantly
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Also invalidate the specific invoice query
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(invoiceId) });
      // Also invalidate financial stats as they depend on invoice data
      queryClient.invalidateQueries({ queryKey: queryKeys.financialStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.settlementSummary });
      toast.success('Invoice updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update invoice:', error);
      toast.error('Failed to update invoice');
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await brain.delete_invoice_endpoint({ invoiceId });
      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all invoice queries to refresh the data instantly
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Also invalidate financial stats as they depend on invoice data
      queryClient.invalidateQueries({ queryKey: queryKeys.financialStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.settlementSummary });
      toast.success('Invoice deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete invoice:', error);
      toast.error('Failed to delete invoice');
    },
  });
};

// Send Invoice Mutation
export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await brain.send_invoice_endpoint({ invoice_id: invoiceId });
      if (!response.ok) {
        throw new Error('Failed to send invoice');
      }
      return response.json();
    },
    onSuccess: (_, invoiceId) => {
      // Invalidate all invoice queries to refresh the list with updated status instantly
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Also invalidate the specific invoice query
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(invoiceId) });
      // Also invalidate financial stats
      queryClient.invalidateQueries({ queryKey: queryKeys.financialStats });
      toast.success('Invoice sent successfully');
    },
    onError: (error) => {
      console.error('Failed to send invoice:', error);
      toast.error('Failed to send invoice');
    },
  });
};

// Hook for dunning rules with caching
export const useDunningRules = () => {
  return useQuery({
    queryKey: dunningQueryKeys.rules,
    queryFn: async (): Promise<DunningRule[]> => {
      const response = await brain.get_dunning_rules();
      if (!response.ok) {
        throw new Error(`Failed to fetch dunning rules: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Dunning Rules Mutations
export const useCreateDunningRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ruleData: DunningRuleCreate) => {
      const response = await brain.create_dunning_rule(ruleData);
      if (!response.ok) {
        throw new Error('Failed to create dunning rule');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all dunning rule queries to refresh instantly
      queryClient.invalidateQueries({ queryKey: dunningQueryKeys.all });
      toast.success('Dunning rule created successfully');
    },
    onError: (error) => {
      console.error('Failed to create dunning rule:', error);
      toast.error('Failed to create dunning rule');
    },
  });
};

export const useUpdateDunningRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ruleId, ruleData }: { ruleId: string; ruleData: DunningRuleUpdate }) => {
      const response = await brain.update_dunning_rule({ ruleId }, ruleData);
      if (!response.ok) {
        throw new Error('Failed to update dunning rule');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all dunning rule queries to refresh instantly
      queryClient.invalidateQueries({ queryKey: dunningQueryKeys.all });
      toast.success('Dunning rule updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update dunning rule:', error);
      toast.error('Failed to update dunning rule');
    },
  });
};

export const useDeleteDunningRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await brain.delete_dunning_rule({ ruleId });
      if (!response.ok) {
        throw new Error('Failed to delete dunning rule');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all dunning rule queries to refresh instantly
      queryClient.invalidateQueries({ queryKey: dunningQueryKeys.all });
      toast.success('Dunning rule deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete dunning rule:', error);
      toast.error('Failed to delete dunning rule');
    },
  });
};

// Hook for payout account with caching
export const usePayoutAccount = () => {
  return useQuery({
    queryKey: payoutQueryKeys.account,
    queryFn: async (): Promise<PayoutAccountResponse | null> => {
      const response = await brain.get_current_payout_account();
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch payout account: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (account status can change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Payout Account Mutations
export const useRefreshPayoutAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await brain.refresh_payout_account();
      if (!response.ok) {
        throw new Error('Failed to refresh payout account');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutQueryKeys.all });
      toast.success('Account status updated');
    },
    onError: (error) => {
      console.error('Failed to refresh payout account:', error);
      toast.error('Failed to refresh account status');
    },
  });
};

// Team Management Hooks
export const useTeamMembers = () => {
  return useQuery({
    queryKey: teamQueryKeys.members,
    queryFn: async () => {
      const response = await brain.get_team_members();
      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useTeamInvitations = () => {
  return useQuery({
    queryKey: teamQueryKeys.invitations,
    queryFn: async () => {
      const response = await brain.get_team_invitations();
      if (!response.ok) {
        throw new Error(`Failed to fetch team invitations: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (invitations can change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useUserRole = (enabled: boolean = true) => {
  return useQuery({
    queryKey: teamQueryKeys.role,
    queryFn: async () => {
      const response = await brain.get_my_role();
      if (!response.ok) {
        throw new Error(`Failed to fetch user role: ${response.status}`);
      }
      return response.json();
    },
    enabled, // Control query execution
    staleTime: 10 * 60 * 1000, // 10 minutes (role rarely changes)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
};

// Invitation Details Hook (for public invitation pages)
export const useInvitationDetails = (token: string | null) => {
  return useQuery({
    queryKey: teamQueryKeys.invitationDetails(token || ''),
    queryFn: async (): Promise<InvitationDetails> => {
      if (!token) {
        throw new Error('No invitation token provided');
      }
      const response = await brain.get_invitation_details({ token });
      if (!response.ok) {
        throw new Error(`Failed to fetch invitation details: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!token, // Only run query if token exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Utility function to check if user has permission for specific actions
export const hasPermission = (
  userRole: UserRole | null,
  action: 'manage_users' | 'manage_billing' | 'view_team' | 'view_billing'
): boolean => {
  if (!userRole) return false;

  switch (action) {
    case 'manage_users':
      return userRole.can_manage_users;
    case 'manage_billing':
      return userRole.can_manage_billing;
    case 'view_team':
      return userRole.can_manage_users; // Only admins can view team page
    case 'view_billing':
      return userRole.can_manage_billing; // Only admins can view billing
    default:
      return false;
  }
};

// Team Management Mutations
export const useInviteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const response = await brain.invite_user({ email, role });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all team queries to refresh instantly
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all });
      toast.success('Invitation sent successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to invite user:', error);
      toast.error(error.message || 'Failed to send invitation');
    },
  });
};

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await brain.remove_team_member({ userId: userId });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to remove team member');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all team queries to refresh instantly
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all });
      toast.success('Team member removed successfully');
    },
    onError: (error: any) => {
      console.error('Failed to remove team member:', error);
      toast.error(error.message || 'Failed to remove team member');
    },
  });
};

export const useRevokeInvitation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await brain.revoke_invitation({ invitationId: invitationId });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to revoke invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all team queries to refresh instantly
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all });
      toast.success('Invitation revoked successfully');
    },
    onError: (error: any) => {
      console.error('Failed to revoke invitation:', error);
      toast.error(error.message || 'Failed to revoke invitation');
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await brain.update_member_role({ userId: userId }, { role });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update member role');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all team queries to refresh instantly
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all });
      toast.success('Member role updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update member role:', error);
      toast.error(error.message || 'Failed to update member role');
    },
  });
};

// Combined team data hook for better performance
export const useTeamData = (enabled: boolean = true) => {
  const members = useTeamMembers();
  const invitations = useTeamInvitations();
  const userRole = useUserRole(enabled);
  
  return {
    members: members.data || [],
    invitations: invitations.data || [],
    userRole: userRole.data,
    loading: members.isLoading || invitations.isLoading || userRole.isLoading,
    error: members.error || invitations.error || userRole.error,
  };
};

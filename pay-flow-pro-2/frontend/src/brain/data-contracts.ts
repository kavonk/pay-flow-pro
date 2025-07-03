/** AcceptInvitationRequest */
export interface AcceptInvitationRequest {
  /** Token */
  token: string;
}

/** AdminStatsResponse */
export interface AdminStatsResponse {
  /** Trial Stats */
  trial_stats: Record<string, any>;
  /** System Health */
  system_health: Record<string, any>;
  /** Recent Activity */
  recent_activity: Record<string, any>;
}

/** AuditLogResponse */
export interface AuditLogResponse {
  /** Id */
  id: string;
  /** User Id */
  user_id: string;
  /** Account Id */
  account_id: string;
  /** Action */
  action: string;
  /** Resource Type */
  resource_type: string;
  /** Resource Id */
  resource_id?: string | null;
  /** Resource Identifier */
  resource_identifier?: string | null;
  /** Changes */
  changes?: Record<string, any> | null;
  /** Metadata */
  metadata?: Record<string, any> | null;
  /** Status */
  status: string;
  /** Error Message */
  error_message?: string | null;
  /** Timestamp */
  timestamp: string;
  /** Created At */
  created_at: string;
}

/** AuditLogStatsResponse */
export interface AuditLogStatsResponse {
  /** Total Actions */
  total_actions: number;
  /** Actions By Type */
  actions_by_type: Record<string, any>;
  /** Actions By User */
  actions_by_user: Record<string, any>;
  /** Actions By Resource */
  actions_by_resource: Record<string, any>;
  /** Recent Activity Count */
  recent_activity_count: number;
  /** Failed Actions Count */
  failed_actions_count: number;
}

/** AuditLogsListResponse */
export interface AuditLogsListResponse {
  /** Audit Logs */
  audit_logs: AuditLogResponse[];
  /** Total */
  total: number;
  /** Page */
  page: number;
  /** Limit */
  limit: number;
  /** Has Next */
  has_next: boolean;
  /** Filters Applied */
  filters_applied: Record<string, any>;
}

/** BankAccount */
export interface BankAccount {
  /** Account Number */
  account_number: string;
  /** Routing Number */
  routing_number: string;
  /** Account Holder Name */
  account_holder_name: string;
  /** Country */
  country: string;
  /** Currency */
  currency: string;
}

/** BillingHistoryListResponse */
export interface BillingHistoryListResponse {
  /** History */
  history: StripeBillingHistoryResponse[];
  /** Has More */
  has_more: boolean;
  /** Total Count */
  total_count: number;
}

/** Body_upload_logo */
export interface BodyUploadLogo {
  /**
   * File
   * @format binary
   */
  file: File;
}

/** BrandingSettingsResponse */
export interface BrandingSettingsResponse {
  /** Id */
  id: string;
  /** Account Id */
  account_id: string;
  /** Company Name */
  company_name?: string | null;
  /**
   * Primary Color
   * @default "#3B82F6"
   */
  primary_color?: string;
  /**
   * Secondary Color
   * @default "#EF4444"
   */
  secondary_color?: string;
  /**
   * Accent Color
   * @default "#10B981"
   */
  accent_color?: string;
  /** Logo Url */
  logo_url?: string | null;
  /** Business Email */
  business_email?: string | null;
  /** Business Phone */
  business_phone?: string | null;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/** BrandingSettingsUpdate */
export interface BrandingSettingsUpdate {
  /** Company Name */
  company_name?: string | null;
  /** Primary Color */
  primary_color?: string | null;
  /** Secondary Color */
  secondary_color?: string | null;
  /** Accent Color */
  accent_color?: string | null;
  /** Business Email */
  business_email?: string | null;
  /** Business Phone */
  business_phone?: string | null;
}

/** BusinessProfile */
export interface BusinessProfile {
  /** Name */
  name: string;
  /** Mcc */
  mcc: string;
  /** Url */
  url?: string | null;
  /** Product Description */
  product_description: string;
}

/** CancelSubscriptionRequest */
export interface CancelSubscriptionRequest {
  /**
   * Cancel At Period End
   * Cancel at end of current period or immediately
   * @default true
   */
  cancel_at_period_end?: boolean;
  /** Cancellation Reason */
  cancellation_reason?: string | null;
}

/** CheckoutSessionResponse */
export interface CheckoutSessionResponse {
  /** Checkout Session Id */
  checkout_session_id: string;
  /** Checkout Url */
  checkout_url: string;
}

/** CreateAccountLinkRequest */
export interface CreateAccountLinkRequest {
  /** User Id */
  user_id: string;
  /** Email */
  email?: string | null;
  /**
   * Country
   * @default "IE"
   */
  country?: string;
  /**
   * Business Type
   * @default "individual"
   */
  business_type?: string;
}

/** CreateCheckoutSessionRequest */
export interface CreateCheckoutSessionRequest {
  /**
   * Plan Slug
   * Target subscription plan slug
   */
  plan_slug: string;
  /**
   * Billing Cycle
   * 'monthly' or 'yearly'
   * @default "monthly"
   */
  billing_cycle?: string;
  /**
   * Success Url
   * URL to redirect on successful payment
   */
  success_url: string;
  /**
   * Cancel Url
   * URL to redirect on canceled payment
   */
  cancel_url: string;
}

/** CreateCustomerRequest */
export interface CreateCustomerRequest {
  /**
   * Name
   * Customer name
   * @minLength 1
   * @maxLength 255
   */
  name: string;
  /**
   * Email
   * Customer email address
   */
  email: string;
  /**
   * Phone
   * Customer phone number
   */
  phone?: string | null;
  /**
   * Notes
   * Additional notes about the customer
   */
  notes?: string | null;
}

/** CreateInvoiceRequest */
export interface CreateInvoiceRequest {
  /**
   * Customer Id
   * Customer ID
   * @format uuid
   */
  customer_id: string;
  /**
   * Invoice Number
   * Invoice number (auto-generated if not provided)
   */
  invoice_number?: string | null;
  /**
   * Amount
   * Invoice amount
   */
  amount: number | string;
  /**
   * Currency
   * Currency code (EUR or USD)
   * @default "EUR"
   */
  currency?: string;
  /**
   * Issue Date
   * Invoice issue date
   * @format date
   */
  issue_date: string;
  /**
   * Due Date
   * Invoice due date
   * @format date
   */
  due_date: string;
  /**
   * Description
   * Invoice description or notes
   */
  description?: string | null;
  /**
   * Terms
   * Payment terms and conditions
   */
  terms?: string | null;
  /**
   * Notes
   * Internal notes (not visible to customer)
   */
  notes?: string | null;
}

/** CreateMonthlyBillingRequest */
export interface CreateMonthlyBillingRequest {
  /**
   * Billing Month
   * @format date
   */
  billing_month: string;
  /**
   * Force Rebill
   * @default false
   */
  force_rebill?: boolean;
}

/** CreatePayoutAccountRequest */
export interface CreatePayoutAccountRequest {
  /** Business Type */
  business_type: string;
  /**
   * Country
   * @default "IE"
   */
  country?: string;
  representative: Representative;
  business_profile: BusinessProfile;
  bank_account: BankAccount;
}

/** CreateSimplePayoutAccountRequest */
export interface CreateSimplePayoutAccountRequest {
  /**
   * Business Type
   * @default "individual"
   */
  business_type?: string | null;
  /**
   * Country
   * @default "IE"
   */
  country?: string;
  /** Email */
  email?: string | null;
}

/** CreateTransactionFeeRequest */
export interface CreateTransactionFeeRequest {
  /** Invoice Id */
  invoice_id: string;
  /** Payment Id */
  payment_id: string;
  /** Stripe Payment Intent Id */
  stripe_payment_intent_id: string | null;
  /** Stripe Charge Id */
  stripe_charge_id: string | null;
  /** Payment Amount */
  payment_amount: number;
  /** Stripe Fee Amount */
  stripe_fee_amount: number;
  /** Subscription Plan Slug */
  subscription_plan_slug: string;
}

/** CronInstructionsResponse */
export interface CronInstructionsResponse {
  /** Instructions */
  instructions: string;
  /** Endpoints */
  endpoints: string[];
}

/** CronJobResult */
export interface CronJobResult {
  /** Job Name */
  job_name: string;
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Processed Count */
  processed_count: number;
  /**
   * Timestamp
   * @format date-time
   */
  timestamp: string;
}

/** CronSetupInstructions */
export interface CronSetupInstructions {
  /** Monthly Billing Url */
  monthly_billing_url: string;
  /** Dunning Reminders Url */
  dunning_reminders_url: string;
  /** Trial Conversion Url */
  trial_conversion_url: string;
  /** Cron Schedule Monthly */
  cron_schedule_monthly: string;
  /** Cron Schedule Daily */
  cron_schedule_daily: string;
  /** Required Headers */
  required_headers: Record<string, string>;
  /** Setup Instructions */
  setup_instructions: string[];
}

/** CustomerPortalRequest */
export interface CustomerPortalRequest {
  /**
   * Return Url
   * URL to return to after portal session
   */
  return_url: string;
}

/** CustomerResponse */
export interface CustomerResponse {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /** Name */
  name: string;
  /** Email */
  email: string;
  /** Phone */
  phone?: string | null;
  /** Notes */
  notes?: string | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
}

/** CustomersListResponse */
export interface CustomersListResponse {
  /** Customers */
  customers: CustomerResponse[];
  /** Total */
  total: number;
  /** Page */
  page: number;
  /** Limit */
  limit: number;
  /** Has Next */
  has_next: boolean;
}

/** DunningRule */
export interface DunningRule {
  /** Id */
  id?: string | null;
  /** Name */
  name: string;
  /** Offset Days */
  offset_days: number;
  /** Channel */
  channel: string;
  /** Message */
  message: string;
  /**
   * Is Active
   * @default true
   */
  is_active?: boolean;
}

/** EnterpriseContactRequest */
export interface EnterpriseContactRequest {
  /** Company Name */
  company_name: string;
  /** Contact Name */
  contact_name: string;
  /**
   * Email
   * @format email
   */
  email: string;
  /** Phone */
  phone?: string | null;
  /** Company Size */
  company_size?: string | null;
  /** Monthly Invoice Volume */
  monthly_invoice_volume?: string | null;
  /** Current Solution */
  current_solution?: string | null;
  /** Message */
  message?: string | null;
  /**
   * Request Demo
   * @default false
   */
  request_demo?: boolean;
  /**
   * Preferred Contact Method
   * @default "email"
   */
  preferred_contact_method?: string;
}

/** EnterpriseContactResponse */
export interface EnterpriseContactResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Contact Id */
  contact_id: string;
}

/** ExportResponse */
export interface ExportResponse {
  /** Format */
  format: string;
  /** Content */
  content: string;
  /** Filename */
  filename: string;
  /** Count */
  count: number;
  /** Exported At */
  exported_at: string;
  /** Filters Applied */
  filters_applied: Record<string, any>;
}

/** ExportStatsResponse */
export interface ExportStatsResponse {
  /** Available Formats */
  available_formats: string[];
  /** Estimated Records */
  estimated_records: Record<string, number>;
  /** Last Export Dates */
  last_export_dates: Record<string, string | null>;
}

/** FeatureAccessResponse */
export interface FeatureAccessResponse {
  /** Has Access */
  has_access: boolean;
}

/** FeePreviewRequest */
export interface FeePreviewRequest {
  /** Payment Amount */
  payment_amount: number;
  /** Plan Slug */
  plan_slug?: string | null;
}

/** FeePreviewResponse */
export interface FeePreviewResponse {
  /** Payment Amount */
  payment_amount: number;
  /** Stripe Fee */
  stripe_fee: string;
  /** Our Markup Amount */
  our_markup_amount: string;
  /** Total Fee */
  total_fee: string;
  /** Effective Rate */
  effective_rate: string;
  /** Markup Percentage */
  markup_percentage: string;
  /** Plan Name */
  plan_name: string;
}

/** FeeStructureInfo */
export interface FeeStructureInfo {
  /** Plan Slug */
  plan_slug: string;
  /** Plan Name */
  plan_name: string;
  /** Stripe Base Fee */
  stripe_base_fee: string;
  /** Our Markup Percentage */
  our_markup_percentage: string;
  /** Total Rate */
  total_rate: string;
  /** Example Fee On 100 */
  example_fee_on_100: string;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** InstantPayoutRequest */
export interface InstantPayoutRequest {
  /** Amount */
  amount: number;
  /** Currency */
  currency: string;
}

/** InstantPayoutResponse */
export interface InstantPayoutResponse {
  /** Id */
  id: string;
  /** Status */
  status: string;
  /** Message */
  message: string;
}

/** InviteUserRequest */
export interface InviteUserRequest {
  /**
   * Email
   * @format email
   */
  email: string;
  /**
   * Role
   * @default "member"
   */
  role?: string;
}

/** InviteUserResponse */
export interface InviteUserResponse {
  /** Id */
  id: string;
  /** Email */
  email: string;
  /** Role */
  role: string;
  /** Token */
  token: string;
  /**
   * Expires At
   * @format date-time
   */
  expires_at: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
}

/** InvoiceNumberResponse */
export interface InvoiceNumberResponse {
  /** Invoice Number */
  invoice_number: string;
  /** Prefix */
  prefix: string;
  /** Sequence Number */
  sequence_number: number;
}

/** InvoiceResponse */
export interface InvoiceResponse {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /**
   * Customer Id
   * @format uuid
   */
  customer_id: string;
  /** Customer Name */
  customer_name: string;
  /** Customer Email */
  customer_email: string;
  /** Invoice Number */
  invoice_number?: string | null;
  /** Amount */
  amount: string;
  /** Currency */
  currency: string;
  /**
   * Issue Date
   * @format date
   */
  issue_date: string;
  /**
   * Due Date
   * @format date
   */
  due_date: string;
  /** Description */
  description?: string | null;
  /** Terms */
  terms?: string | null;
  /** Notes */
  notes?: string | null;
  /** Line Items */
  line_items?: string | null;
  /** Invoice Wide Tax Rate */
  invoice_wide_tax_rate?: string | null;
  /** Discount Type */
  discount_type?: string | null;
  /** Discount Value */
  discount_value?: string | null;
  /** Status */
  status: string;
  /** Stripe Payment Link Id */
  stripe_payment_link_id?: string | null;
  /** Stripe Payment Link Url */
  stripe_payment_link_url?: string | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
}

/** InvoiceStatusBreakdownResponse */
export interface InvoiceStatusBreakdownResponse {
  /** Data */
  data: Record<string, number>;
}

/** InvoicesListResponse */
export interface InvoicesListResponse {
  /** Invoices */
  invoices: InvoiceResponse[];
  /** Total */
  total: number;
  /** Page */
  page: number;
  /** Limit */
  limit: number;
  /** Has Next */
  has_next: boolean;
}

/** KpiSummaryResponse */
export interface KpiSummaryResponse {
  /** Total Revenue */
  total_revenue: number;
  /** Outstanding Balance */
  outstanding_balance: number;
  /** Average Dso */
  average_dso: number;
  /** New Customers */
  new_customers: number;
}

/** LogoUploadResponse */
export interface LogoUploadResponse {
  /** Logo Url */
  logo_url: string;
  /** Message */
  message: string;
}

/** MonthlyBillingDetails */
export interface MonthlyBillingDetails {
  summary: MonthlyFeeSummary;
  /** Transactions */
  transactions: TransactionFeeDetail[];
}

/** MonthlyBillingJobResult */
export interface MonthlyBillingJobResult {
  /** Processed Users */
  processed_users: number;
  /** Total Amount Billed */
  total_amount_billed: number;
  /** Successful Billings */
  successful_billings: number;
  /** Failed Billings */
  failed_billings: number;
  /** Errors */
  errors: string[];
}

/** MonthlyBillingResponse */
export interface MonthlyBillingResponse {
  /** Success */
  success: boolean;
  /** Billing Id */
  billing_id: string;
  /** Stripe Invoice Id */
  stripe_invoice_id: string | null;
  /** Amount Billed */
  amount_billed: number;
  /** Message */
  message: string;
}

/** MonthlyFeeBilling */
export interface MonthlyFeeBilling {
  /** Id */
  id: string;
  /**
   * Billing Month
   * @format date
   */
  billing_month: string;
  /** Total Payment Volume */
  total_payment_volume: number;
  /** Total Stripe Fees */
  total_stripe_fees: number;
  /** Total Our Markup */
  total_our_markup: number;
  /** Total Fee Amount */
  total_fee_amount: number;
  /** Transaction Count */
  transaction_count: number;
  /** Subscription Plan Slug */
  subscription_plan_slug: string;
  /** Billing Status */
  billing_status: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Billed At */
  billed_at: string | null;
  /** Paid At */
  paid_at: string | null;
}

/** MonthlyFeeCalculationResponse */
export interface MonthlyFeeCalculationResponse {
  /**
   * Billing Month
   * @format date
   */
  billing_month: string;
  /** Total Payment Volume */
  total_payment_volume: number;
  /** Total Stripe Fees */
  total_stripe_fees: number;
  /** Total Our Markup */
  total_our_markup: number;
  /** Total Fee Amount */
  total_fee_amount: number;
  /** Transaction Count */
  transaction_count: number;
  /** Can Bill */
  can_bill: boolean;
  /** Reason */
  reason: string | null;
}

/** MonthlyFeeSummary */
export interface MonthlyFeeSummary {
  /**
   * Billing Month
   * @format date
   */
  billing_month: string;
  /** Total Payment Volume */
  total_payment_volume: number;
  /** Total Stripe Fees */
  total_stripe_fees: number;
  /** Total Our Markup */
  total_our_markup: number;
  /** Total Fee Amount */
  total_fee_amount: number;
  /** Transaction Count */
  transaction_count: number;
  /** Average Fee Rate */
  average_fee_rate: number;
  /** Billing Status */
  billing_status: string;
  /** Billed At */
  billed_at: string | null;
  /** Paid At */
  paid_at: string | null;
}

/** NotificationRequest */
export interface NotificationRequest {
  /**
   * Days Ahead
   * @default 3
   */
  days_ahead?: number;
}

/** NotificationResponse */
export interface NotificationResponse {
  /** Success */
  success: boolean;
  /** Notifications Sent */
  notifications_sent: number;
  /** Message */
  message: string;
}

/** PaymentReconciliationRequest */
export interface PaymentReconciliationRequest {
  /**
   * Invoice Id
   * Invoice ID to reconcile
   * @format uuid
   */
  invoice_id: string;
  /**
   * Payment Amount
   * Payment amount
   */
  payment_amount: number | string;
  /**
   * Payment Method
   * Payment method (card, bank_transfer, etc.)
   */
  payment_method: string;
  /**
   * Transaction Id
   * External transaction ID
   */
  transaction_id: string;
  /**
   * Notes
   * Additional notes
   */
  notes?: string | null;
}

/** PaymentReconciliationResponse */
export interface PaymentReconciliationResponse {
  /**
   * Payment Id
   * @format uuid
   */
  payment_id: string;
  /**
   * Invoice Id
   * @format uuid
   */
  invoice_id: string;
  /** Amount */
  amount: string;
  /** Status */
  status: string;
  /** Message */
  message: string;
}

/** Payout */
export interface Payout {
  /** Id */
  id: string;
  /** Amount */
  amount: number;
  /** Currency */
  currency: string;
  /** Status */
  status: string;
  /**
   * Arrival Date
   * @format date-time
   */
  arrival_date: string;
  /**
   * Created
   * @format date-time
   */
  created: string;
  /** Description */
  description: string | null;
  /** Method */
  method: string;
}

/** PayoutAccountResponse */
export interface PayoutAccountResponse {
  /** Id */
  id: string;
  /** Stripe Account Id */
  stripe_account_id: string;
  /** Account Status */
  account_status: string;
  /** Business Type */
  business_type: string | null;
  /** Country */
  country: string;
  /** Email */
  email: string | null;
  /** Requirements Currently Due */
  requirements_currently_due: string[];
  /** Requirements Past Due */
  requirements_past_due: string[];
  /** Charges Enabled */
  charges_enabled: boolean;
  /** Payouts Enabled */
  payouts_enabled: boolean;
  /** Details Submitted */
  details_submitted: boolean;
  /** External Account Id */
  external_account_id: string | null;
  /** Onboarding Url */
  onboarding_url?: string | null;
  /** Dashboard Url */
  dashboard_url?: string | null;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/** PayoutRequest */
export interface PayoutRequest {
  /** Amount */
  amount?: number | string | null;
  /** Description */
  description?: string | null;
}

/** PayoutResponse */
export interface PayoutResponse {
  /** Id */
  id: string;
  /** Amount */
  amount: string;
  /** Currency */
  currency: string;
  /** Status */
  status: string;
  /** Arrival Date */
  arrival_date?: string | null;
  /** Description */
  description?: string | null;
  /** Created At */
  created_at: string;
}

/** PlanFeeInfoResponse */
export interface PlanFeeInfoResponse {
  /** Plan Slug */
  plan_slug: string;
  /** Stripe Base */
  stripe_base: string;
  /** Our Markup */
  our_markup: string;
  /** Total Rate */
  total_rate: string;
  /** Example 100 */
  example_100: string;
}

/** PublicPlanResponse */
export interface PublicPlanResponse {
  /** Id */
  id: string;
  /** Slug */
  slug: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Price Monthly */
  price_monthly: number;
  /** Price Yearly */
  price_yearly?: number | null;
  /** Features */
  features: Record<string, any>;
  /** Invoice Limit */
  invoice_limit: number;
  /** Team Member Limit */
  team_member_limit: number;
  /** Dunning Rules Limit */
  dunning_rules_limit: number;
}

/** PublicSubscriptionPlanResponse */
export interface PublicSubscriptionPlanResponse {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Slug */
  slug: string;
  /** Description */
  description?: string | null;
  /** Price Monthly */
  price_monthly: number;
  /** Price Yearly */
  price_yearly?: number | null;
  /** Features */
  features: Record<string, any>;
  /** Invoice Limit */
  invoice_limit: number;
  /** Team Member Limit */
  team_member_limit: number;
  /** Dunning Rules Limit */
  dunning_rules_limit: number;
}

/** Representative */
export interface Representative {
  /** First Name */
  first_name: string;
  /** Last Name */
  last_name: string;
  /** Email */
  email: string;
  /** Phone */
  phone: string;
  /** Address Line1 */
  address_line1: string;
  /** Address City */
  address_city: string;
  /** Address State */
  address_state?: string | null;
  /** Address Postal Code */
  address_postal_code: string;
  /** Address Country */
  address_country: string;
  /** Dob Day */
  dob_day: number;
  /** Dob Month */
  dob_month: number;
  /** Dob Year */
  dob_year: number;
}

/** RevenueDataPoint */
export interface RevenueDataPoint {
  /** Date */
  date: string;
  /** Revenue */
  revenue: number;
}

/** RevenueOverTimeResponse */
export interface RevenueOverTimeResponse {
  /** Data */
  data: RevenueDataPoint[];
}

/** SendInvoiceRequest */
export interface SendInvoiceRequest {
  /**
   * Invoice Id
   * Invoice ID to send
   * @format uuid
   */
  invoice_id: string;
  /**
   * Email Message
   * Custom message to include in email
   */
  email_message?: string | null;
}

/** StartTrialRequest */
export interface StartTrialRequest {
  /**
   * Plan Slug
   * The slug of the plan to start a trial for.
   */
  plan_slug: string;
  /** Payment Method Id */
  payment_method_id?: string | null;
  /** Stripe Customer Id */
  stripe_customer_id?: string | null;
  /** Card Last Four */
  card_last_four?: string | null;
  /** Card Brand */
  card_brand?: string | null;
}

/** StripeBillingHistoryResponse */
export interface StripeBillingHistoryResponse {
  /** Id */
  id: string;
  /** Amount */
  amount: string;
  /** Currency */
  currency: string;
  /** Status */
  status: string;
  /** Description */
  description: string;
  /** Invoice Url */
  invoice_url?: string | null;
  /** Receipt Url */
  receipt_url?: string | null;
  /**
   * Payment Date
   * @format date-time
   */
  payment_date: string;
  /** Period Start */
  period_start?: string | null;
  /** Period End */
  period_end?: string | null;
  /** Payment Method */
  payment_method?: string | null;
  /** Last Four */
  last_four?: string | null;
  /** Invoice Number */
  invoice_number?: string | null;
}

/** SubscriptionPlanResponse */
export interface SubscriptionPlanResponse {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /** Name */
  name: string;
  /** Slug */
  slug: string;
  /** Description */
  description?: string | null;
  /** Price Monthly */
  price_monthly: string;
  /** Price Yearly */
  price_yearly?: string | null;
  /** Features */
  features: string[];
  /** Transaction Fee Percentage */
  transaction_fee_percentage: string;
  /** Max Invoices Per Month */
  max_invoices_per_month?: number | null;
  /** Max Customers */
  max_customers?: number | null;
  /** Has Custom Branding */
  has_custom_branding: boolean;
  /** Has Priority Support */
  has_priority_support: boolean;
  /** Has Recurring Billing */
  has_recurring_billing: boolean;
  /** Yearly Discount Percentage */
  yearly_discount_percentage: number;
  /** Is Trial */
  is_trial: boolean;
}

/** TeamInvitationResponse */
export interface TeamInvitationResponse {
  /** Id */
  id: string;
  /** Email */
  email: string;
  /** Role */
  role: string;
  /**
   * Expires At
   * @format date-time
   */
  expires_at: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Is Expired */
  is_expired: boolean;
}

/** TeamMemberResponse */
export interface TeamMemberResponse {
  /** User Id */
  user_id: string;
  /** Role */
  role: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
}

/** TransactionFeeDetail */
export interface TransactionFeeDetail {
  /** Invoice Id */
  invoice_id: string;
  /** Payment Amount */
  payment_amount: number;
  /** Stripe Fee Amount */
  stripe_fee_amount: number;
  /** Our Markup Amount */
  our_markup_amount: number;
  /** Total Fee Amount */
  total_fee_amount: number;
  /**
   * Processed At
   * @format date-time
   */
  processed_at: string;
  /** Customer Name */
  customer_name: string | null;
  /** Invoice Number */
  invoice_number: string | null;
}

/** TransactionFeeRecord */
export interface TransactionFeeRecord {
  /** Id */
  id: string;
  /** Invoice Id */
  invoice_id: string;
  /** Payment Id */
  payment_id: string;
  /** Stripe Payment Intent Id */
  stripe_payment_intent_id: string | null;
  /** Payment Amount */
  payment_amount: number;
  /** Stripe Fee Amount */
  stripe_fee_amount: number;
  /** Our Markup Percentage */
  our_markup_percentage: number;
  /** Our Markup Amount */
  our_markup_amount: number;
  /** Total Fee Amount */
  total_fee_amount: number;
  /** Subscription Plan Slug */
  subscription_plan_slug: string;
  /**
   * Processed At
   * @format date-time
   */
  processed_at: string;
  /**
   * Billing Month
   * @format date
   */
  billing_month: string;
  /** Billed At */
  billed_at: string | null;
}

/** TransactionFeeSettings */
export interface TransactionFeeSettings {
  /** Stripe Percentage */
  stripe_percentage: string;
  /** Stripe Fixed Fee */
  stripe_fixed_fee: string;
  /** Fee Structure */
  fee_structure: FeeStructureInfo[];
  current_plan_info: FeeStructureInfo;
}

/** Transfer */
export interface Transfer {
  /** Id */
  id: string;
  /** Amount */
  amount: number;
  /** Currency */
  currency: string;
  /** Status */
  status: string;
  /**
   * Arrival Date
   * @format date-time
   */
  arrival_date: string;
  /**
   * Created
   * @format date-time
   */
  created: string;
  /** Description */
  description: string | null;
}

/** TransferRecord */
export interface TransferRecord {
  /** Id */
  id: string;
  /** Amount */
  amount: string;
  /** Currency */
  currency: string;
  /** Status */
  status: string;
  /** Created At */
  created_at: string;
  /** Description */
  description?: string | null;
}

/** TrialConversionJobResponse */
export interface TrialConversionJobResponse {
  /** Success */
  success: boolean;
  /** Converted Count */
  converted_count: number;
  /** Failed Count */
  failed_count: number;
  /** Message */
  message: string;
}

/** UpdateCustomerRequest */
export interface UpdateCustomerRequest {
  /**
   * Name
   * Customer name
   */
  name?: string | null;
  /**
   * Email
   * Customer email address
   */
  email?: string | null;
  /**
   * Phone
   * Customer phone number
   */
  phone?: string | null;
  /**
   * Notes
   * Additional notes about the customer
   */
  notes?: string | null;
}

/** UpdateInvoiceRequest */
export interface UpdateInvoiceRequest {
  /**
   * Customer Id
   * Customer ID
   */
  customer_id?: string | null;
  /**
   * Invoice Number
   * Invoice number
   */
  invoice_number?: string | null;
  /**
   * Amount
   * Invoice amount
   */
  amount?: number | string | null;
  /**
   * Currency
   * Currency code (EUR or USD)
   */
  currency?: string | null;
  /**
   * Issue Date
   * Invoice issue date
   */
  issue_date?: string | null;
  /**
   * Due Date
   * Invoice due date
   */
  due_date?: string | null;
  /**
   * Description
   * Invoice description or notes
   */
  description?: string | null;
  /**
   * Terms
   * Payment terms and conditions
   */
  terms?: string | null;
  /**
   * Notes
   * Internal notes (not visible to customer)
   */
  notes?: string | null;
  /**
   * Line Items
   * JSON string of line items
   */
  line_items?: string | null;
  /**
   * Invoice Wide Tax Rate
   * Invoice-wide tax rate percentage
   */
  invoice_wide_tax_rate?: number | string | null;
  /**
   * Discount Type
   * Discount type (percentage or fixed)
   */
  discount_type?: string | null;
  /**
   * Discount Value
   * Discount value
   */
  discount_value?: number | string | null;
  /**
   * Status
   * Invoice status
   */
  status?: string | null;
}

/** UpdateMemberRoleRequest */
export interface UpdateMemberRoleRequest {
  /** Role */
  role: string;
}

/** UpdatePrefixRequest */
export interface UpdatePrefixRequest {
  /** Prefix */
  prefix: string;
}

/** UpdatePrefixResponse */
export interface UpdatePrefixResponse {
  /** Prefix */
  prefix: string;
  /** Message */
  message: string;
}

/** UpgradeSubscriptionRequest */
export interface UpgradeSubscriptionRequest {
  /**
   * Plan Slug
   * Target subscription plan slug
   */
  plan_slug: string;
  /**
   * Billing Cycle
   * 'monthly' or 'yearly'
   * @default "monthly"
   */
  billing_cycle?: string;
  /**
   * Payment Method Id
   * Stripe payment method ID
   */
  payment_method_id?: string | null;
  /**
   * Return Url
   * URL to return to after payment
   */
  return_url?: string | null;
}

/** UserSubscriptionResponse */
export interface UserSubscriptionResponse {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /** User Id */
  user_id: string;
  /** Status */
  status: string;
  /** Trial Start Date */
  trial_start_date?: string | null;
  /** Trial End Date */
  trial_end_date?: string | null;
  /** Current Period Start */
  current_period_start?: string | null;
  /** Current Period End */
  current_period_end?: string | null;
  /** Card Last Four */
  card_last_four?: string | null;
  /** Card Brand */
  card_brand?: string | null;
  /** Canceled At */
  canceled_at?: string | null;
  /** Cancel At Period End */
  cancel_at_period_end: boolean;
  plan?: SubscriptionPlanResponse | null;
  /** Trial Days Remaining */
  trial_days_remaining: number;
  /** Is Trial */
  is_trial: boolean;
  /** Is Active */
  is_active: boolean;
  /** Requires Upgrade Prompt */
  requires_upgrade_prompt: boolean;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/**
 * StripeConfigResponse
 * Response model for Stripe configuration.
 */
export interface AppApisConfigStripeConfigResponse {
  /** Publishable Key */
  publishable_key: string;
}

/** AccountLinkResponse */
export interface AppApisPayoutAccountsAccountLinkResponse {
  /** Url */
  url: string;
}

/** SettlementSummary */
export interface AppApisPayoutsSettlementSummary {
  /** Total Pending Balance */
  total_pending_balance: number;
  /** Total Available Balance */
  total_available_balance: number;
  /** Last Payout Amount */
  last_payout_amount: number | null;
  /** Last Payout Date */
  last_payout_date: string | null;
}

/** AcceptInvitationPublicRequest */
export interface AppApisPublicAcceptInvitationPublicRequest {
  /** Token */
  token: string;
  /** Email */
  email: string;
  /** Password */
  password?: string | null;
  /** First Name */
  first_name?: string | null;
  /** Last Name */
  last_name?: string | null;
}

/** AccountLinkResponse */
export interface AppApisPublicAccountLinkResponse {
  /** Account Link Url */
  account_link_url: string;
  /** Stripe Account Id */
  stripe_account_id: string;
  /** Expires At */
  expires_at: number;
}

/**
 * StripeConfigResponse
 * Response model for Stripe configuration.
 */
export interface AppApisPublicStripeConfigResponse {
  /** Publishable Key */
  publishable_key: string;
}

/** SettlementSummary */
export interface AppApisSettlementsSettlementSummary {
  /** Gross Amount */
  gross_amount: string;
  /** Stripe Fees */
  stripe_fees: string;
  /** Platform Fees */
  platform_fees: string;
  /** Net Amount */
  net_amount: string;
  /** Pending Transfers */
  pending_transfers: number;
  /** Last Payout Date */
  last_payout_date?: string | null;
  /** Next Payout Date */
  next_payout_date?: string | null;
}

/** CustomerPortalResponse */
export interface AppApisSubscriptionCustomerPortalResponse {
  /** Url */
  url: string;
}

/** CustomerPortalResponse */
export interface AppApisSubscriptionsCustomerPortalResponse {
  /** Portal Url */
  portal_url: string;
}

/** StripeConfigResponse */
export interface AppApisSubscriptionsStripeConfigResponse {
  /** Publishable Key */
  publishable_key: string;
}

/** AcceptInvitationPublicRequest */
export interface AppApisTeamAcceptInvitationPublicRequest {
  /** Token */
  token: string;
  /** Email */
  email: string;
  /** Password */
  password: string;
}

export type CheckHealthData = HealthResponse;

export interface RunDunningJobParams {
  /** Scheduler Key */
  scheduler_key?: string | null;
}

export type RunDunningJobData = any;

export type RunDunningJobError = HTTPValidationError;

export type RunTrialConversionJobData = TrialConversionJobResponse;

export type JobHealthCheckData = any;

export type GetStripeConfigData = AppApisConfigStripeConfigResponse;

export type CreateCustomerEndpointData = CustomerResponse;

export type CreateCustomerEndpointError = HTTPValidationError;

export interface GetCustomersEndpointParams {
  /**
   * Page
   * Page number
   * @min 1
   * @default 1
   */
  page?: number;
  /**
   * Limit
   * Items per page
   * @min 1
   * @max 100
   * @default 20
   */
  limit?: number;
  /**
   * Search
   * Search term for name or email
   */
  search?: string | null;
}

export type GetCustomersEndpointData = CustomersListResponse;

export type GetCustomersEndpointError = HTTPValidationError;

export interface GetCustomerEndpointParams {
  /**
   * Customer Id
   * @format uuid
   */
  customerId: string;
}

export type GetCustomerEndpointData = CustomerResponse;

export type GetCustomerEndpointError = HTTPValidationError;

export interface UpdateCustomerEndpointParams {
  /**
   * Customer Id
   * @format uuid
   */
  customerId: string;
}

export type UpdateCustomerEndpointData = CustomerResponse;

export type UpdateCustomerEndpointError = HTTPValidationError;

export interface DeleteCustomerEndpointParams {
  /**
   * Customer Id
   * @format uuid
   */
  customerId: string;
}

export type DeleteCustomerEndpointData = any;

export type DeleteCustomerEndpointError = HTTPValidationError;

export type GetExportStatsData = ExportStatsResponse;

export interface ExportCustomersParams {
  /**
   * Format
   * Export format: csv, json, or excel
   * @default "csv"
   */
  format?: string;
  /**
   * Search
   * Filter customers by name or email
   */
  search?: string | null;
  /**
   * Created After
   * Export customers created after this date
   */
  created_after?: string | null;
  /**
   * Created Before
   * Export customers created before this date
   */
  created_before?: string | null;
}

export type ExportCustomersData = ExportResponse;

export type ExportCustomersError = HTTPValidationError;

export interface ExportInvoicesParams {
  /**
   * Format
   * Export format: csv, json, or excel
   * @default "csv"
   */
  format?: string;
  /**
   * Status
   * Filter by invoice status
   */
  status?: string | null;
  /**
   * Customer Id
   * Filter by customer ID
   */
  customer_id?: string | null;
  /**
   * Issue Date After
   * Filter invoices issued after this date
   */
  issue_date_after?: string | null;
  /**
   * Issue Date Before
   * Filter invoices issued before this date
   */
  issue_date_before?: string | null;
  /**
   * Due Date After
   * Filter invoices due after this date
   */
  due_date_after?: string | null;
  /**
   * Due Date Before
   * Filter invoices due before this date
   */
  due_date_before?: string | null;
}

export type ExportInvoicesData = ExportResponse;

export type ExportInvoicesError = HTTPValidationError;

export interface ExportPaymentsParams {
  /**
   * Format
   * Export format: csv, json, or excel
   * @default "csv"
   */
  format?: string;
  /**
   * Status
   * Filter by payment status
   */
  status?: string | null;
  /**
   * Method
   * Filter by payment method
   */
  method?: string | null;
  /**
   * Date After
   * Filter payments after this date
   */
  date_after?: string | null;
  /**
   * Date Before
   * Filter payments before this date
   */
  date_before?: string | null;
}

export type ExportPaymentsData = ExportResponse;

export type ExportPaymentsError = HTTPValidationError;

export interface GetAuditLogsParams {
  /**
   * Page
   * Page number
   * @min 1
   * @default 1
   */
  page?: number;
  /**
   * Limit
   * Items per page
   * @min 1
   * @max 500
   * @default 50
   */
  limit?: number;
  /**
   * User Filter
   * Filter by user ID
   */
  user_filter?: string | null;
  /**
   * Resource Type
   * Filter by resource type
   */
  resource_type?: string | null;
  /**
   * Resource Id
   * Filter by resource ID
   */
  resource_id?: string | null;
  /**
   * Action
   * Filter by action type
   */
  action?: string | null;
  /**
   * Start Date
   * Start date for filtering
   */
  start_date?: string | null;
  /**
   * End Date
   * End date for filtering
   */
  end_date?: string | null;
  /**
   * Status
   * Filter by status (SUCCESS, FAILED, PENDING)
   */
  status?: string | null;
}

export type GetAuditLogsData = AuditLogsListResponse;

export type GetAuditLogsError = HTTPValidationError;

export interface GetAuditStatsParams {
  /**
   * Start Date
   * Start date for stats
   */
  start_date?: string | null;
  /**
   * End Date
   * End date for stats
   */
  end_date?: string | null;
}

export type GetAuditStatsData = AuditLogStatsResponse;

export type GetAuditStatsError = HTTPValidationError;

/** Response Get Available Actions */
export type GetAvailableActionsData = string[];

/** Response Get Available Resource Types */
export type GetAvailableResourceTypesData = string[];

export interface ExportAuditLogsParams {
  /**
   * Format
   * Export format: csv or json
   * @default "csv"
   */
  format?: string;
  /**
   * User Filter
   * Filter by user ID
   */
  user_filter?: string | null;
  /**
   * Resource Type
   * Filter by resource type
   */
  resource_type?: string | null;
  /**
   * Action
   * Filter by action type
   */
  action?: string | null;
  /**
   * Start Date
   * Start date for filtering
   */
  start_date?: string | null;
  /**
   * End Date
   * End date for filtering
   */
  end_date?: string | null;
}

/** Response Export Audit Logs */
export type ExportAuditLogsData = Record<string, any>;

export type ExportAuditLogsError = HTTPValidationError;

/** Response Get Team Members */
export type GetTeamMembersData = TeamMemberResponse[];

/** Response Get Team Invitations */
export type GetTeamInvitationsData = TeamInvitationResponse[];

export type InviteUserData = InviteUserResponse;

export type InviteUserError = HTTPValidationError;

export type AcceptInvitationData = any;

export type AcceptInvitationError = HTTPValidationError;

export interface UpdateMemberRoleParams {
  /** User Id */
  userId: string;
}

export type UpdateMemberRoleData = any;

export type UpdateMemberRoleError = HTTPValidationError;

export interface RemoveTeamMemberParams {
  /** User Id */
  userId: string;
}

export type RemoveTeamMemberData = any;

export type RemoveTeamMemberError = HTTPValidationError;

export interface RevokeInvitationParams {
  /** Invitation Id */
  invitationId: string;
}

export type RevokeInvitationData = any;

export type RevokeInvitationError = HTTPValidationError;

export interface GetInvitationDetails2Params {
  /** Token */
  token: string;
}

export type GetInvitationDetails2Data = any;

export type GetInvitationDetails2Error = HTTPValidationError;

export type AcceptInvitationPublic2Data = any;

export type AcceptInvitationPublic2Error = HTTPValidationError;

export type GetMyRoleData = any;

export type GetSettlementSummaryData = AppApisSettlementsSettlementSummary;

export interface GetTransfersParams {
  /**
   * Limit
   * @default 20
   */
  limit?: number;
}

/** Response Get Transfers */
export type GetTransfersData = TransferRecord[];

export type GetTransfersError = HTTPValidationError;

export type CreateInstantPayoutData = PayoutResponse;

export type CreateInstantPayoutError = HTTPValidationError;

export interface GetPayoutsParams {
  /**
   * Limit
   * @default 20
   */
  limit?: number;
}

/** Response Get Payouts */
export type GetPayoutsData = PayoutResponse[];

export type GetPayoutsError = HTTPValidationError;

export interface GetKpiSummaryParams {
  /** Start Date */
  start_date?: string | null;
  /** End Date */
  end_date?: string | null;
}

export type GetKpiSummaryData = KpiSummaryResponse;

export type GetKpiSummaryError = HTTPValidationError;

export interface GetRevenueOverTimeParams {
  /** Start Date */
  start_date?: string | null;
  /** End Date */
  end_date?: string | null;
}

export type GetRevenueOverTimeData = RevenueOverTimeResponse;

export type GetRevenueOverTimeError = HTTPValidationError;

export interface GetInvoiceStatusBreakdownParams {
  /** Start Date */
  start_date?: string | null;
  /** End Date */
  end_date?: string | null;
}

export type GetInvoiceStatusBreakdownData = InvoiceStatusBreakdownResponse;

export type GetInvoiceStatusBreakdownError = HTTPValidationError;

export type GetTrialStatisticsData = AdminStatsResponse;

export type GetCronSetupInstructionsData = CronInstructionsResponse;

export type GetBrandingSettingsData = BrandingSettingsResponse;

export type UpdateBrandingSettingsData = BrandingSettingsResponse;

export type UpdateBrandingSettingsError = HTTPValidationError;

export type UploadLogoData = LogoUploadResponse;

export type UploadLogoError = HTTPValidationError;

/** Response Remove Logo */
export type RemoveLogoData = Record<string, any>;

export type SubmitEnterpriseContactData = EnterpriseContactResponse;

export type SubmitEnterpriseContactError = HTTPValidationError;

export type GetEnterpriseInquiriesData = any;

export interface GetMonthlyBillingSummaryParams {
  /**
   * Limit
   * @default 12
   */
  limit?: number;
}

/** Response Get Monthly Billing Summary */
export type GetMonthlyBillingSummaryData = MonthlyFeeSummary[];

export type GetMonthlyBillingSummaryError = HTTPValidationError;

export interface GetMonthlyBillingDetailsParams {
  /** Year */
  year: number;
  /** Month */
  month: number;
}

export type GetMonthlyBillingDetailsData = MonthlyBillingDetails;

export type GetMonthlyBillingDetailsError = HTTPValidationError;

export type GetCurrentMonthPreviewData = MonthlyFeeSummary;

export type GetFeePreviewData = FeePreviewResponse;

export type GetFeePreviewError = HTTPValidationError;

export interface GetPlanFeeInfoEndpointParams {
  /** Plan Slug */
  planSlug: string;
}

export type GetPlanFeeInfoEndpointData = PlanFeeInfoResponse;

export type GetPlanFeeInfoEndpointError = HTTPValidationError;

/** Response Get All Plan Fee Info */
export type GetAllPlanFeeInfoData = PlanFeeInfoResponse[];

export type StripeWebhookHandlerData = any;

export type StripeWebhookHandlerError = HTTPValidationError;

export type ManualPaymentReconciliationData = PaymentReconciliationResponse;

export type ManualPaymentReconciliationError = HTTPValidationError;

export type TestWebhookData = any;

export type RunMonthlyBillingJobData = MonthlyBillingJobResult;

export type CreateMonthlyBillingData = MonthlyBillingResponse;

export type CreateMonthlyBillingError = HTTPValidationError;

export type BillingAutomationHealthCheckData = any;

export type GetFeeStructureData = TransactionFeeSettings;

export type GetBillingCronSetupInstructionsData = CronSetupInstructions;

export type RecordTransactionFeeData = TransactionFeeRecord;

export type RecordTransactionFeeError = HTTPValidationError;

export interface CalculateMonthlyFeesParams {
  /** Year */
  year: number;
  /** Month */
  month: number;
}

export type CalculateMonthlyFeesData = MonthlyFeeCalculationResponse;

export type CalculateMonthlyFeesError = HTTPValidationError;

export interface GetMonthlyBillingsParams {
  /**
   * Limit
   * @default 12
   */
  limit?: number;
}

/** Response Get Monthly Billings */
export type GetMonthlyBillingsData = MonthlyFeeBilling[];

export type GetMonthlyBillingsError = HTTPValidationError;

export type GetCurrentMonthFeesPreviewData = MonthlyFeeCalculationResponse;

/** Response Get Unbilled Fees */
export type GetUnbilledFeesData = TransactionFeeRecord[];

export type GetPublicStripeConfigData = AppApisPublicStripeConfigResponse;

export interface GetInvitationDetailsParams {
  /** Token */
  token: string;
}

export type GetInvitationDetailsData = any;

export type GetInvitationDetailsError = HTTPValidationError;

export type AcceptInvitationPublicData = any;

export type AcceptInvitationPublicError = HTTPValidationError;

export type CreateAccountLinkPublicData = AppApisPublicAccountLinkResponse;

export type CreateAccountLinkPublicError = HTTPValidationError;

export type CreatePayoutAccountData = PayoutAccountResponse;

export type CreatePayoutAccountError = HTTPValidationError;

export type CreateSimplePayoutAccountData = PayoutAccountResponse;

export type CreateSimplePayoutAccountError = HTTPValidationError;

/** Response Get Current Payout Account */
export type GetCurrentPayoutAccountData = PayoutAccountResponse | null;

export type CreateOnboardingLinkData = AppApisPayoutAccountsAccountLinkResponse;

export type RefreshPayoutAccountData = PayoutAccountResponse;

export type SendTrialRemindersData = NotificationResponse;

export type SendTrialRemindersError = HTTPValidationError;

export type GetNextInvoiceNumberData = InvoiceNumberResponse;

export type ReserveInvoiceNumberData = InvoiceNumberResponse;

export type UpdateInvoicePrefixData = UpdatePrefixResponse;

export type UpdateInvoicePrefixError = HTTPValidationError;

export type CreateInvoiceEndpointData = InvoiceResponse;

export type CreateInvoiceEndpointError = HTTPValidationError;

export interface GetInvoicesEndpointParams {
  /**
   * Page
   * Page number
   * @min 1
   * @default 1
   */
  page?: number;
  /**
   * Limit
   * Items per page
   * @min 1
   * @max 100
   * @default 20
   */
  limit?: number;
  /**
   * Status
   * Filter by status
   */
  status?: string | null;
  /**
   * Customer Id
   * Filter by customer ID
   */
  customer_id?: string | null;
  /**
   * Search
   * Search term for customer name, description, or invoice details
   */
  search?: string | null;
  /**
   * Issue Date After
   * Filter invoices issued after this date
   */
  issue_date_after?: string | null;
  /**
   * Issue Date Before
   * Filter invoices issued before this date
   */
  issue_date_before?: string | null;
  /**
   * Due Date After
   * Filter invoices due after this date
   */
  due_date_after?: string | null;
  /**
   * Due Date Before
   * Filter invoices due before this date
   */
  due_date_before?: string | null;
  /**
   * Sort By
   * Sort field: created_at, issue_date, due_date, amount, status, customer_name
   * @default "created_at"
   */
  sort_by?: string | null;
  /**
   * Sort Order
   * Sort order: asc or desc
   * @default "desc"
   */
  sort_order?: string | null;
}

export type GetInvoicesEndpointData = InvoicesListResponse;

export type GetInvoicesEndpointError = HTTPValidationError;

export interface GetInvoiceEndpointParams {
  /**
   * Invoice Id
   * @format uuid
   */
  invoiceId: string;
}

export type GetInvoiceEndpointData = InvoiceResponse;

export type GetInvoiceEndpointError = HTTPValidationError;

export interface UpdateInvoiceEndpointParams {
  /**
   * Invoice Id
   * @format uuid
   */
  invoiceId: string;
}

export type UpdateInvoiceEndpointData = InvoiceResponse;

export type UpdateInvoiceEndpointError = HTTPValidationError;

export interface DeleteInvoiceEndpointParams {
  /**
   * Invoice Id
   * @format uuid
   */
  invoiceId: string;
}

export type DeleteInvoiceEndpointData = any;

export type DeleteInvoiceEndpointError = HTTPValidationError;

export type SendInvoiceEndpointData = any;

export type SendInvoiceEndpointError = HTTPValidationError;

export type RunDunningJobCronData = CronJobResult;

export type RunDunningJobCronError = HTTPValidationError;

export type RunTrialConversionJobCronData = CronJobResult;

export type RunTrialConversionJobCronError = HTTPValidationError;

export type CronJobsHealthCheckData = any;

export type SendTrialRemindersCronData = CronJobResult;

export type SendTrialRemindersCronError = HTTPValidationError;

/** Response Get Public Subscription Plans */
export type GetPublicSubscriptionPlansData = PublicPlanResponse[];

/** Response Whoami */
export type WhoamiData = Record<string, any>;

export type GetPayoutsSettlementSummaryData = AppApisPayoutsSettlementSummary;

export interface GetPayoutsTransfersParams {
  /**
   * Limit
   * @default 10
   */
  limit?: number;
}

/** Response Get Payouts Transfers */
export type GetPayoutsTransfersData = Transfer[];

export type GetPayoutsTransfersError = HTTPValidationError;

export type CreatePayoutsInstantPayoutData = InstantPayoutResponse;

export type CreatePayoutsInstantPayoutError = HTTPValidationError;

export interface GetPayoutsHistoryParams {
  /**
   * Limit
   * @default 10
   */
  limit?: number;
}

/** Response Get Payouts History */
export type GetPayoutsHistoryData = Payout[];

export type GetPayoutsHistoryError = HTTPValidationError;

/** Response Get Dunning Rules */
export type GetDunningRulesData = DunningRule[];

export type CreateDunningRuleData = DunningRule;

export type CreateDunningRuleError = HTTPValidationError;

export interface GetDunningRuleParams {
  /** Rule Id */
  ruleId: string;
}

export type GetDunningRuleData = DunningRule;

export type GetDunningRuleError = HTTPValidationError;

export interface UpdateDunningRuleParams {
  /** Rule Id */
  ruleId: string;
}

export type UpdateDunningRuleData = DunningRule;

export type UpdateDunningRuleError = HTTPValidationError;

export interface DeleteDunningRuleParams {
  /** Rule Id */
  ruleId: string;
}

export type DeleteDunningRuleData = any;

export type DeleteDunningRuleError = HTTPValidationError;

export type CreateCustomerPortalData = AppApisSubscriptionCustomerPortalResponse;

export interface GetSubscriptionFeatureAccessParams {
  /** Feature Key */
  feature_key: string;
}

export type GetSubscriptionFeatureAccessData = FeatureAccessResponse;

export type GetSubscriptionFeatureAccessError = HTTPValidationError;

export type GetSubscriptionStripeConfigData = AppApisSubscriptionsStripeConfigResponse;

/** Response Get Subscription Plans */
export type GetSubscriptionPlansData = PublicSubscriptionPlanResponse[];

/** Response Get Current Subscription */
export type GetCurrentSubscriptionData = UserSubscriptionResponse | null;

export type StartTrialData = UserSubscriptionResponse;

export type StartTrialError = HTTPValidationError;

export type CreateCustomerPortal2Data = AppApisSubscriptionsCustomerPortalResponse;

export type CreateCustomerPortal2Error = HTTPValidationError;

export type CreateCheckoutSessionData = CheckoutSessionResponse;

export type CreateCheckoutSessionError = HTTPValidationError;

export type UpgradeSubscriptionData = UserSubscriptionResponse;

export type UpgradeSubscriptionError = HTTPValidationError;

export type CancelSubscriptionData = UserSubscriptionResponse;

export type CancelSubscriptionError = HTTPValidationError;

export interface GetBillingHistoryParams {
  /**
   * Limit
   * @default 10
   */
  limit?: number;
  /** Starting After */
  starting_after?: string | null;
}

export type GetBillingHistoryData = BillingHistoryListResponse;

export type GetBillingHistoryError = HTTPValidationError;

/** Response Get Feature Access */
export type GetFeatureAccessData = Record<string, any>;

export type SubscriptionWebhookHandlerData = any;

export type ConvertExpiredTrialsData = any;

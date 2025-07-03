import {
  AcceptInvitationData,
  AcceptInvitationPublic2Data,
  AcceptInvitationPublicData,
  AcceptInvitationRequest,
  AppApisPublicAcceptInvitationPublicRequest,
  AppApisTeamAcceptInvitationPublicRequest,
  BillingAutomationHealthCheckData,
  BodyUploadLogo,
  BrandingSettingsUpdate,
  CalculateMonthlyFeesData,
  CancelSubscriptionData,
  CancelSubscriptionRequest,
  CheckHealthData,
  ConvertExpiredTrialsData,
  CreateAccountLinkPublicData,
  CreateAccountLinkRequest,
  CreateCheckoutSessionData,
  CreateCheckoutSessionRequest,
  CreateCustomerEndpointData,
  CreateCustomerPortalData,
  CreateCustomerRequest,
  CreateDunningRuleData,
  CreateInstantPayoutData,
  CreateInvoiceEndpointData,
  CreateInvoiceRequest,
  CreateMonthlyBillingData,
  CreateMonthlyBillingRequest,
  CreateOnboardingLinkData,
  CreatePayoutAccountData,
  CreatePayoutAccountRequest,
  CreatePayoutsInstantPayoutData,
  CreateSimplePayoutAccountData,
  CreateSimplePayoutAccountRequest,
  CreateTransactionFeeRequest,
  CronJobsHealthCheckData,
  CustomerPortalRequest,
  DeleteCustomerEndpointData,
  DeleteDunningRuleData,
  DeleteInvoiceEndpointData,
  DunningRule,
  EnterpriseContactRequest,
  ExportAuditLogsData,
  ExportCustomersData,
  ExportInvoicesData,
  ExportPaymentsData,
  FeePreviewRequest,
  GetActivityFeedData,
  GetAllPlanFeeInfoData,
  GetAuditLogsData,
  GetAuditStatsData,
  GetAvailableActionsData,
  GetAvailableResourceTypesData,
  GetBillingCronSetupInstructionsData,
  GetBillingHistoryData,
  GetBrandingSettingsData,
  GetCronSetupInstructionsData,
  GetCurrentMonthFeesPreviewData,
  GetCurrentMonthPreviewData,
  GetCurrentPayoutAccountData,
  GetCurrentSubscriptionData,
  GetCustomerEndpointData,
  GetCustomersEndpointData,
  GetDashboardSettlementSummaryData,
  GetDunningRuleData,
  GetDunningRulesData,
  GetEnterpriseInquiriesData,
  GetExportStatsData,
  GetFeatureAccessData,
  GetFeePreviewData,
  GetFeeStructureData,
  GetFinancialStatsData,
  GetInvitationDetails2Data,
  GetInvitationDetailsData,
  GetInvoiceEndpointData,
  GetInvoiceStatusBreakdownData,
  GetInvoicesEndpointData,
  GetKpiSummaryData,
  GetMonthlyBillingDetailsData,
  GetMonthlyBillingSummaryData,
  GetMonthlyBillingsData,
  GetMyRoleData,
  GetNextInvoiceNumberData,
  GetPayoutsData,
  GetPayoutsHistoryData,
  GetPayoutsSettlementSummaryData,
  GetPayoutsTransfersData,
  GetPlanFeeInfoEndpointData,
  GetPublicStripeConfigData,
  GetPublicSubscriptionPlansData,
  GetRevenueOverTimeData,
  GetSettlementSummaryData,
  GetStripeConfigData,
  GetSubscriptionStripeConfigData,
  GetTeamInvitationsData,
  GetTeamMembersData,
  GetTopCustomersData,
  GetTransfersData,
  GetTrialStatisticsData,
  GetUnbilledFeesData,
  HealthCheckData,
  InstantPayoutRequest,
  InviteUserData,
  InviteUserRequest,
  JobHealthCheckData,
  ManualPaymentReconciliationData,
  NotificationRequest,
  PaymentReconciliationRequest,
  PayoutRequest,
  RecordTransactionFeeData,
  RefreshPayoutAccountData,
  RemoveLogoData,
  RemoveTeamMemberData,
  ReserveInvoiceNumberData,
  RevokeInvitationData,
  RunDunningJobCronData,
  RunDunningJobData,
  RunMonthlyBillingJobData,
  RunTrialConversionJobCronData,
  RunTrialConversionJobData,
  SendInvoiceEndpointData,
  SendInvoiceRequest,
  SendTrialRemindersCronData,
  SendTrialRemindersData,
  StartTrialNewData,
  StartTrialRequest,
  StripeWebhookHandlerData,
  SubmitEnterpriseContactData,
  SubscriptionWebhookHandlerData,
  TestWebhookData,
  UpdateBrandingSettingsData,
  UpdateCustomerEndpointData,
  UpdateCustomerRequest,
  UpdateDunningRuleData,
  UpdateInvoiceEndpointData,
  UpdateInvoicePrefixData,
  UpdateInvoiceRequest,
  UpdateMemberRoleData,
  UpdateMemberRoleRequest,
  UpdatePrefixRequest,
  UpgradeSubscriptionData,
  UpgradeSubscriptionRequest,
  UploadLogoData,
  WhoamiData,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Triggers the dunning process to check for overdue invoices and send reminders. This endpoint is designed to be called by a scheduler and is protected by a secret key.
   * @tags Scheduler, dbtn/module:scheduler, dbtn/hasAuth
   * @name run_dunning_job
   * @summary Run Dunning Job
   * @request POST:/routes/scheduler/run-dunning
   */
  export namespace run_dunning_job {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Scheduler Key */
      scheduler_key?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RunDunningJobData;
  }

  /**
   * @description Run the automated trial-to-paid conversion job. This endpoint should be called daily by an external scheduler (like GitHub Actions, Vercel Cron, or external cron service).
   * @tags dbtn/module:jobs
   * @name run_trial_conversion_job
   * @summary Run Trial Conversion Job
   * @request POST:/routes/run-trial-conversion
   */
  export namespace run_trial_conversion_job {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RunTrialConversionJobData;
  }

  /**
   * @description Health check for job endpoints.
   * @tags dbtn/module:jobs
   * @name job_health_check
   * @summary Job Health Check
   * @request GET:/routes/health
   */
  export namespace job_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = JobHealthCheckData;
  }

  /**
   * @description Get Stripe configuration for frontend. Public endpoint for signup flow.
   * @tags dbtn/module:config
   * @name get_stripe_config
   * @summary Get Stripe Config
   * @request GET:/routes/stripe
   */
  export namespace get_stripe_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetStripeConfigData;
  }

  /**
   * @description Get export statistics and available formats.
   * @tags dbtn/module:export, dbtn/hasAuth
   * @name get_export_stats
   * @summary Get Export Stats
   * @request GET:/routes/export/stats
   */
  export namespace get_export_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetExportStatsData;
  }

  /**
   * @description Export customer data with filtering options.
   * @tags dbtn/module:export, dbtn/hasAuth
   * @name export_customers
   * @summary Export Customers
   * @request GET:/routes/export/customers
   */
  export namespace export_customers {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExportCustomersData;
  }

  /**
   * @description Export invoice data with comprehensive filtering options.
   * @tags dbtn/module:export, dbtn/hasAuth
   * @name export_invoices
   * @summary Export Invoices
   * @request GET:/routes/export/invoices
   */
  export namespace export_invoices {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExportInvoicesData;
  }

  /**
   * @description Export payment data with filtering options.
   * @tags dbtn/module:export, dbtn/hasAuth
   * @name export_payments
   * @summary Export Payments
   * @request GET:/routes/export/payments
   */
  export namespace export_payments {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExportPaymentsData;
  }

  /**
   * @description Get audit logs with comprehensive filtering options.
   * @tags dbtn/module:audit, dbtn/hasAuth
   * @name get_audit_logs
   * @summary Get Audit Logs
   * @request GET:/routes/audit/logs
   */
  export namespace get_audit_logs {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAuditLogsData;
  }

  /**
   * @description Get audit log statistics for dashboard and analytics.
   * @tags dbtn/module:audit, dbtn/hasAuth
   * @name get_audit_stats
   * @summary Get Audit Stats
   * @request GET:/routes/audit/stats
   */
  export namespace get_audit_stats {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAuditStatsData;
  }

  /**
   * @description Get list of all available audit actions for filtering.
   * @tags dbtn/module:audit, dbtn/hasAuth
   * @name get_available_actions
   * @summary Get Available Actions
   * @request GET:/routes/audit/actions
   */
  export namespace get_available_actions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAvailableActionsData;
  }

  /**
   * @description Get list of all available resource types for filtering.
   * @tags dbtn/module:audit, dbtn/hasAuth
   * @name get_available_resource_types
   * @summary Get Available Resource Types
   * @request GET:/routes/audit/resource-types
   */
  export namespace get_available_resource_types {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAvailableResourceTypesData;
  }

  /**
   * @description Export audit logs in CSV or JSON format.
   * @tags dbtn/module:audit, dbtn/hasAuth
   * @name export_audit_logs
   * @summary Export Audit Logs
   * @request GET:/routes/audit/export
   */
  export namespace export_audit_logs {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ExportAuditLogsData;
  }

  /**
   * @description Get all team members for the current account.
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name get_team_members
   * @summary Get Team Members
   * @request GET:/routes/members
   */
  export namespace get_team_members {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamMembersData;
  }

  /**
   * @description Get all pending team invitations for the current account.
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name get_team_invitations
   * @summary Get Team Invitations
   * @request GET:/routes/invitations
   */
  export namespace get_team_invitations {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTeamInvitationsData;
  }

  /**
   * @description Invite a user to join the team.
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name invite_user
   * @summary Invite User
   * @request POST:/routes/invite
   */
  export namespace invite_user {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = InviteUserRequest;
    export type RequestHeaders = {};
    export type ResponseBody = InviteUserData;
  }

  /**
   * @description Accept a team invitation.
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name accept_invitation
   * @summary Accept Invitation
   * @request POST:/routes/accept-invitation
   */
  export namespace accept_invitation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AcceptInvitationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AcceptInvitationData;
  }

  /**
   * @description Update a team member's role.
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name update_member_role
   * @summary Update Member Role
   * @request PUT:/routes/members/{user_id}/role
   */
  export namespace update_member_role {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateMemberRoleRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateMemberRoleData;
  }

  /**
   * @description Remove a team member from the account.
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name remove_team_member
   * @summary Remove Team Member
   * @request DELETE:/routes/members/{user_id}
   */
  export namespace remove_team_member {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RemoveTeamMemberData;
  }

  /**
   * @description Revoke a pending team invitation.
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name revoke_invitation
   * @summary Revoke Invitation
   * @request DELETE:/routes/invitations/{invitation_id}
   */
  export namespace revoke_invitation {
    export type RequestParams = {
      /** Invitation Id */
      invitationId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RevokeInvitationData;
  }

  /**
   * @description Get invitation details without authentication for display on acceptance page.
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name get_invitation_details2
   * @summary Get Invitation Details2
   * @request GET:/routes/invitation/{token}
   */
  export namespace get_invitation_details2 {
    export type RequestParams = {
      /** Token */
      token: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetInvitationDetails2Data;
  }

  /**
   * @description Accept invitation and create new account if needed (no auth required).
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name accept_invitation_public2
   * @summary Accept Invitation Public2
   * @request POST:/routes/accept-invitation-public
   */
  export namespace accept_invitation_public2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisTeamAcceptInvitationPublicRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AcceptInvitationPublic2Data;
  }

  /**
   * @description Get current user's role in the team.
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name get_my_role
   * @summary Get My Role
   * @request GET:/routes/my-role
   */
  export namespace get_my_role {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMyRoleData;
  }

  /**
   * @description Get settlement summary with fee breakdown.
   * @tags dbtn/module:settlements, dbtn/hasAuth
   * @name get_settlement_summary
   * @summary Get Settlement Summary
   * @request GET:/routes/settlement-summary
   */
  export namespace get_settlement_summary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSettlementSummaryData;
  }

  /**
   * @description Get recent transfers to connected account.
   * @tags dbtn/module:settlements, dbtn/hasAuth
   * @name get_transfers
   * @summary Get Transfers
   * @request GET:/routes/transfers
   */
  export namespace get_transfers {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 20
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTransfersData;
  }

  /**
   * @description Create an instant payout to connected account.
   * @tags dbtn/module:settlements, dbtn/hasAuth
   * @name create_instant_payout
   * @summary Create Instant Payout
   * @request POST:/routes/instant-payout
   */
  export namespace create_instant_payout {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PayoutRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateInstantPayoutData;
  }

  /**
   * @description Get recent payouts for connected account.
   * @tags dbtn/module:settlements, dbtn/hasAuth
   * @name get_payouts
   * @summary Get Payouts
   * @request GET:/routes/payouts
   */
  export namespace get_payouts {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 20
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPayoutsData;
  }

  /**
   * @description Get comprehensive trial conversion statistics for admin dashboard. SECURITY: Results are scoped to the user's account to prevent cross-tenant data access.
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_trial_statistics
   * @summary Get Trial Statistics
   * @request GET:/routes/trial-stats
   */
  export namespace get_trial_statistics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTrialStatisticsData;
  }

  /**
   * @description Get instructions for setting up automated trial conversion. SECURITY: Requires authentication to access setup instructions.
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_cron_setup_instructions
   * @summary Get Cron Setup Instructions
   * @request GET:/routes/cron-setup
   */
  export namespace get_cron_setup_instructions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCronSetupInstructionsData;
  }

  /**
   * @description Get branding settings for the current user's account
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name get_branding_settings
   * @summary Get Branding Settings
   * @request GET:/routes/branding-settings
   */
  export namespace get_branding_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetBrandingSettingsData;
  }

  /**
   * @description Update branding settings
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name update_branding_settings
   * @summary Update Branding Settings
   * @request PUT:/routes/branding-settings
   */
  export namespace update_branding_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BrandingSettingsUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateBrandingSettingsData;
  }

  /**
   * @description Upload and set company logo
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name upload_logo
   * @summary Upload Logo
   * @request POST:/routes/branding-settings/upload-logo
   */
  export namespace upload_logo {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadLogo;
    export type RequestHeaders = {};
    export type ResponseBody = UploadLogoData;
  }

  /**
   * @description Remove company logo
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name remove_logo
   * @summary Remove Logo
   * @request DELETE:/routes/branding-settings/remove-logo
   */
  export namespace remove_logo {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RemoveLogoData;
  }

  /**
   * @description Handle Enterprise plan inquiries and demo requests. Store the inquiry and send notification to sales team.
   * @tags dbtn/module:enterprise_contact, dbtn/hasAuth
   * @name submit_enterprise_contact
   * @summary Submit Enterprise Contact
   * @request POST:/routes/enterprise-contact
   */
  export namespace submit_enterprise_contact {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = EnterpriseContactRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SubmitEnterpriseContactData;
  }

  /**
   * @description Get all enterprise inquiries (for admin/sales team use)
   * @tags dbtn/module:enterprise_contact, dbtn/hasAuth
   * @name get_enterprise_inquiries
   * @summary Get Enterprise Inquiries
   * @request GET:/routes/enterprise-inquiries
   */
  export namespace get_enterprise_inquiries {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetEnterpriseInquiriesData;
  }

  /**
   * @description Get monthly billing summary for the last N months.
   * @tags dbtn/module:monthly_billing, dbtn/hasAuth
   * @name get_monthly_billing_summary
   * @summary Get Monthly Billing Summary
   * @request GET:/routes/monthly-billing/summary
   */
  export namespace get_monthly_billing_summary {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 12
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMonthlyBillingSummaryData;
  }

  /**
   * @description Get detailed monthly billing information for a specific month.
   * @tags dbtn/module:monthly_billing, dbtn/hasAuth
   * @name get_monthly_billing_details
   * @summary Get Monthly Billing Details
   * @request GET:/routes/monthly-billing/details/{year}/{month}
   */
  export namespace get_monthly_billing_details {
    export type RequestParams = {
      /** Year */
      year: number;
      /** Month */
      month: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMonthlyBillingDetailsData;
  }

  /**
   * @description Get preview of current month's unbilled transaction fees.
   * @tags dbtn/module:monthly_billing, dbtn/hasAuth
   * @name get_current_month_preview
   * @summary Get Current Month Preview
   * @request GET:/routes/monthly-billing/current-month-preview
   */
  export namespace get_current_month_preview {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCurrentMonthPreviewData;
  }

  /**
   * @description Get a preview of transaction fees for a given payment amount.
   * @tags dbtn/module:fees, dbtn/hasAuth
   * @name get_fee_preview
   * @summary Get Fee Preview
   * @request POST:/routes/fees/preview
   */
  export namespace get_fee_preview {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = FeePreviewRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetFeePreviewData;
  }

  /**
   * @description Get fee information for a specific subscription plan.
   * @tags dbtn/module:fees, dbtn/hasAuth
   * @name get_plan_fee_info_endpoint
   * @summary Get Plan Fee Info Endpoint
   * @request GET:/routes/fees/plan-info/{plan_slug}
   */
  export namespace get_plan_fee_info_endpoint {
    export type RequestParams = {
      /** Plan Slug */
      planSlug: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlanFeeInfoEndpointData;
  }

  /**
   * @description Get fee information for all subscription plans.
   * @tags dbtn/module:fees, dbtn/hasAuth
   * @name get_all_plan_fee_info
   * @summary Get All Plan Fee Info
   * @request GET:/routes/fees/all-plans
   */
  export namespace get_all_plan_fee_info {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAllPlanFeeInfoData;
  }

  /**
   * @description Handle Stripe webhook events for payment processing.
   * @tags dbtn/module:webhooks
   * @name stripe_webhook_handler
   * @summary Stripe Webhook Handler
   * @request POST:/routes/webhooks/stripe
   */
  export namespace stripe_webhook_handler {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Stripe-Signature */
      "stripe-signature"?: string;
    };
    export type ResponseBody = StripeWebhookHandlerData;
  }

  /**
   * @description Manually reconcile a payment to an invoice.
   * @tags dbtn/module:webhooks
   * @name manual_payment_reconciliation
   * @summary Manual Payment Reconciliation
   * @request POST:/routes/webhooks/reconcile-payment
   */
  export namespace manual_payment_reconciliation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PaymentReconciliationRequest;
    export type RequestHeaders = {
      /** X-User-Id */
      "x-user-id": string;
    };
    export type ResponseBody = ManualPaymentReconciliationData;
  }

  /**
   * @description Test endpoint to verify webhook API is working.
   * @tags dbtn/module:webhooks
   * @name test_webhook
   * @summary Test Webhook
   * @request GET:/routes/webhooks/test
   */
  export namespace test_webhook {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestWebhookData;
  }

  /**
   * @description Run monthly billing job for all users with unbilled transaction fees. This should typically be run on the 1st of each month.
   * @tags dbtn/module:billing_automation, dbtn/hasAuth
   * @name run_monthly_billing_job
   * @summary Run Monthly Billing Job
   * @request POST:/routes/billing-automation/run-monthly-billing
   */
  export namespace run_monthly_billing_job {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RunMonthlyBillingJobData;
  }

  /**
   * @description Create monthly billing for the current user for a specific month.
   * @tags dbtn/module:billing_automation, dbtn/hasAuth
   * @name create_monthly_billing
   * @summary Create Monthly Billing
   * @request POST:/routes/billing-automation/create-monthly-billing
   */
  export namespace create_monthly_billing {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateMonthlyBillingRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateMonthlyBillingData;
  }

  /**
   * @description Health check endpoint for the billing automation system.
   * @tags dbtn/module:billing_automation, dbtn/hasAuth
   * @name billing_automation_health_check
   * @summary Billing Automation Health Check
   * @request GET:/routes/billing-automation/health
   */
  export namespace billing_automation_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BillingAutomationHealthCheckData;
  }

  /**
   * @description Get transaction fee structure information for the settings page.
   * @tags dbtn/module:settings, dbtn/hasAuth
   * @name get_fee_structure
   * @summary Get Fee Structure
   * @request GET:/routes/settings/fee-structure
   */
  export namespace get_fee_structure {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFeeStructureData;
  }

  /**
   * @description Get cron job setup instructions for automated billing.
   * @tags dbtn/module:settings, dbtn/hasAuth
   * @name get_billing_cron_setup_instructions
   * @summary Get Billing Cron Setup Instructions
   * @request GET:/routes/settings/cron-setup
   */
  export namespace get_billing_cron_setup_instructions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetBillingCronSetupInstructionsData;
  }

  /**
   * @description Record a transaction fee for a processed payment.
   * @tags dbtn/module:transaction_fees, dbtn/hasAuth
   * @name record_transaction_fee
   * @summary Record Transaction Fee
   * @request POST:/routes/transaction-fees/record-fee
   */
  export namespace record_transaction_fee {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateTransactionFeeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RecordTransactionFeeData;
  }

  /**
   * @description Calculate monthly transaction fees for a specific month.
   * @tags dbtn/module:transaction_fees, dbtn/hasAuth
   * @name calculate_monthly_fees
   * @summary Calculate Monthly Fees
   * @request GET:/routes/transaction-fees/monthly-calculation/{year}/{month}
   */
  export namespace calculate_monthly_fees {
    export type RequestParams = {
      /** Year */
      year: number;
      /** Month */
      month: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CalculateMonthlyFeesData;
  }

  /**
   * @description Get monthly fee billing history for the user.
   * @tags dbtn/module:transaction_fees, dbtn/hasAuth
   * @name get_monthly_billings
   * @summary Get Monthly Billings
   * @request GET:/routes/transaction-fees/monthly-billings
   */
  export namespace get_monthly_billings {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 12
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMonthlyBillingsData;
  }

  /**
   * @description Get preview of current month's transaction fees.
   * @tags dbtn/module:transaction_fees, dbtn/hasAuth
   * @name get_current_month_fees_preview
   * @summary Get Current Month Fees Preview
   * @request GET:/routes/transaction-fees/current-month-preview
   */
  export namespace get_current_month_fees_preview {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCurrentMonthFeesPreviewData;
  }

  /**
   * @description Get all unbilled transaction fees for the user.
   * @tags dbtn/module:transaction_fees, dbtn/hasAuth
   * @name get_unbilled_fees
   * @summary Get Unbilled Fees
   * @request GET:/routes/transaction-fees/unbilled-fees
   */
  export namespace get_unbilled_fees {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetUnbilledFeesData;
  }

  /**
   * @description Get Stripe publishable key for signup flow. Public endpoint.
   * @tags dbtn/module:public
   * @name get_public_stripe_config
   * @summary Get Public Stripe Config
   * @request GET:/routes/public/stripe-config
   */
  export namespace get_public_stripe_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPublicStripeConfigData;
  }

  /**
   * @description Get invitation details without authentication for display on acceptance page.
   * @tags dbtn/module:public
   * @name get_invitation_details
   * @summary Get Invitation Details
   * @request GET:/routes/public/invitation/{token}
   */
  export namespace get_invitation_details {
    export type RequestParams = {
      /** Token */
      token: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetInvitationDetailsData;
  }

  /**
   * @description Accept invitation and create new account if needed (no auth required).
   * @tags dbtn/module:public
   * @name accept_invitation_public
   * @summary Accept Invitation Public
   * @request POST:/routes/public/accept-invitation
   */
  export namespace accept_invitation_public {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisPublicAcceptInvitationPublicRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AcceptInvitationPublicData;
  }

  /**
   * @description Create account link for Stripe Express onboarding (Public endpoint - no auth required). This endpoint automatically creates a Stripe Express account if the user doesn't have one, then generates an account link for hosted onboarding. Designed for popup windows.
   * @tags dbtn/module:public
   * @name create_account_link_public
   * @summary Create Account Link Public
   * @request POST:/routes/public/create-account-link
   */
  export namespace create_account_link_public {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateAccountLinkRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateAccountLinkPublicData;
  }

  /**
   * @description Create a comprehensive Stripe Connect account with full onboarding data.
   * @tags dbtn/module:payout_accounts, dbtn/hasAuth
   * @name create_payout_account
   * @summary Create Payout Account
   * @request POST:/routes/create
   */
  export namespace create_payout_account {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreatePayoutAccountRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreatePayoutAccountData;
  }

  /**
   * @description Create a new Stripe Connect account for payouts.
   * @tags dbtn/module:payout_accounts, dbtn/hasAuth
   * @name create_simple_payout_account
   * @summary Create Simple Payout Account
   * @request POST:/routes/create-simple
   */
  export namespace create_simple_payout_account {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateSimplePayoutAccountRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateSimplePayoutAccountData;
  }

  /**
   * @description Get the current user's payout account.
   * @tags dbtn/module:payout_accounts, dbtn/hasAuth
   * @name get_current_payout_account
   * @summary Get Current Payout Account
   * @request GET:/routes/payout-account
   */
  export namespace get_current_payout_account {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCurrentPayoutAccountData;
  }

  /**
   * @description Create a new onboarding link for incomplete accounts.
   * @tags dbtn/module:payout_accounts, dbtn/hasAuth
   * @name create_onboarding_link
   * @summary Create Onboarding Link
   * @request POST:/routes/onboarding-link
   */
  export namespace create_onboarding_link {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CreateOnboardingLinkData;
  }

  /**
   * @description Refresh payout account status from Stripe.
   * @tags dbtn/module:payout_accounts, dbtn/hasAuth
   * @name refresh_payout_account
   * @summary Refresh Payout Account
   * @request POST:/routes/refresh
   */
  export namespace refresh_payout_account {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = RefreshPayoutAccountData;
  }

  /**
   * @description Send reminder notifications to users whose trials are expiring soon. This should be called daily, a few days before trials expire.
   * @tags dbtn/module:notifications, dbtn/hasAuth
   * @name send_trial_reminders
   * @summary Send Trial Reminders
   * @request POST:/routes/send-trial-reminders
   */
  export namespace send_trial_reminders {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = NotificationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SendTrialRemindersData;
  }

  /**
   * @description Get the next available invoice number for the user. Creates a sequence entry if it doesn't exist.
   * @tags dbtn/module:invoice_numbering, dbtn/hasAuth
   * @name get_next_invoice_number
   * @summary Get Next Invoice Number
   * @request GET:/routes/next-invoice-number
   */
  export namespace get_next_invoice_number {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetNextInvoiceNumberData;
  }

  /**
   * @description Reserve the next invoice number by incrementing the sequence. This should be called when an invoice is actually created.
   * @tags dbtn/module:invoice_numbering, dbtn/hasAuth
   * @name reserve_invoice_number
   * @summary Reserve Invoice Number
   * @request POST:/routes/reserve-invoice-number
   */
  export namespace reserve_invoice_number {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ReserveInvoiceNumberData;
  }

  /**
   * @description Update the invoice number prefix for the user.
   * @tags dbtn/module:invoice_numbering, dbtn/hasAuth
   * @name update_invoice_prefix
   * @summary Update Invoice Prefix
   * @request POST:/routes/update-prefix
   */
  export namespace update_invoice_prefix {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdatePrefixRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateInvoicePrefixData;
  }

  /**
   * @description Run the dunning job to send automated reminders.
   * @tags dbtn/module:cron_jobs, dbtn/hasAuth
   * @name run_dunning_job_cron
   * @summary Run Dunning Job Cron
   * @request POST:/routes/cron/run-dunning-job
   */
  export namespace run_dunning_job_cron {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: boolean;
    };
    export type ResponseBody = RunDunningJobCronData;
  }

  /**
   * @description Run job to process trial conversions and send notifications.
   * @tags dbtn/module:cron_jobs, dbtn/hasAuth
   * @name run_trial_conversion_job_cron
   * @summary Run Trial Conversion Job Cron
   * @request POST:/routes/cron/run-trial-conversion-job
   */
  export namespace run_trial_conversion_job_cron {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: boolean;
    };
    export type ResponseBody = RunTrialConversionJobCronData;
  }

  /**
   * @description Health check for cron job system.
   * @tags dbtn/module:cron_jobs, dbtn/hasAuth
   * @name cron_jobs_health_check
   * @summary Cron Jobs Health Check
   * @request GET:/routes/cron/health
   */
  export namespace cron_jobs_health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CronJobsHealthCheckData;
  }

  /**
   * @description Send trial reminder emails to users approaching trial end.
   * @tags dbtn/module:cron_jobs, dbtn/hasAuth
   * @name send_trial_reminders_cron
   * @summary Send Trial Reminders Cron
   * @request POST:/routes/cron/send-trial-reminders
   */
  export namespace send_trial_reminders_cron {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: boolean;
    };
    export type ResponseBody = SendTrialRemindersCronData;
  }

  /**
   * @description Get all available subscription plans directly from the PLANS constant.
   * @tags dbtn/module:public_subscriptions, dbtn/hasAuth
   * @name get_public_subscription_plans
   * @summary Get Public Subscription Plans
   * @request GET:/routes/public/plans
   */
  export namespace get_public_subscription_plans {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPublicSubscriptionPlansData;
  }

  /**
   * @description Returns the full details of the currently authenticated user object. This is crucial for debugging user ID and account linkage issues.
   * @tags Debug, dbtn/module:debug, dbtn/hasAuth
   * @name whoami
   * @summary Whoami
   * @request GET:/routes/debug/whoami
   */
  export namespace whoami {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = WhoamiData;
  }

  /**
   * No description
   * @tags dbtn/module:payouts, dbtn/hasAuth
   * @name get_payouts_settlement_summary
   * @summary Get Payouts Settlement Summary
   * @request GET:/routes/payouts/settlement-summary
   */
  export namespace get_payouts_settlement_summary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPayoutsSettlementSummaryData;
  }

  /**
   * No description
   * @tags dbtn/module:payouts, dbtn/hasAuth
   * @name get_payouts_transfers
   * @summary Get Payouts Transfers
   * @request GET:/routes/payouts/transfers
   */
  export namespace get_payouts_transfers {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 10
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPayoutsTransfersData;
  }

  /**
   * No description
   * @tags dbtn/module:payouts, dbtn/hasAuth
   * @name create_payouts_instant_payout
   * @summary Create Payouts Instant Payout
   * @request POST:/routes/payouts/instant-payout
   */
  export namespace create_payouts_instant_payout {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = InstantPayoutRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreatePayoutsInstantPayoutData;
  }

  /**
   * No description
   * @tags dbtn/module:payouts, dbtn/hasAuth
   * @name get_payouts_history
   * @summary Get Payouts History
   * @request GET:/routes/payouts/payouts
   */
  export namespace get_payouts_history {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 10
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPayoutsHistoryData;
  }

  /**
   * @description Get Stripe configuration for subscription management.
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name get_subscription_stripe_config
   * @summary Get Subscription Stripe Config
   * @request GET:/routes/config
   */
  export namespace get_subscription_stripe_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSubscriptionStripeConfigData;
  }

  /**
   * @description Get current user's subscription.
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name get_current_subscription
   * @summary Get Current Subscription
   * @request GET:/routes/current
   */
  export namespace get_current_subscription {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCurrentSubscriptionData;
  }

  /**
   * @description Create a Stripe checkout session for subscription upgrade.
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name create_checkout_session
   * @summary Create Checkout Session
   * @request POST:/routes/create-checkout-session
   */
  export namespace create_checkout_session {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCheckoutSessionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateCheckoutSessionData;
  }

  /**
   * @description Upgrade user's subscription to a paid plan (for direct payment method upgrades).
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name upgrade_subscription
   * @summary Upgrade Subscription
   * @request POST:/routes/upgrade
   */
  export namespace upgrade_subscription {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpgradeSubscriptionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpgradeSubscriptionData;
  }

  /**
   * @description Cancel user's subscription.
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name cancel_subscription
   * @summary Cancel Subscription
   * @request POST:/routes/cancel
   */
  export namespace cancel_subscription {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CancelSubscriptionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CancelSubscriptionData;
  }

  /**
   * @description Get billing history from Stripe for the current user.
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name get_billing_history
   * @summary Get Billing History
   * @request GET:/routes/billing-history
   */
  export namespace get_billing_history {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @default 10
       */
      limit?: number;
      /** Starting After */
      starting_after?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetBillingHistoryData;
  }

  /**
   * @description Create Stripe Customer Portal session for payment method and billing management.
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name create_customer_portal
   * @summary Create Customer Portal
   * @request POST:/routes/customer-portal
   */
  export namespace create_customer_portal {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CustomerPortalRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateCustomerPortalData;
  }

  /**
   * @description Get user's feature access based on their subscription with auto-trial enrollment.
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name get_feature_access
   * @summary Get Feature Access
   * @request GET:/routes/feature-access
   */
  export namespace get_feature_access {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFeatureAccessData;
  }

  /**
   * @description Handle Stripe webhook events for subscription updates.
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name subscription_webhook_handler
   * @summary Subscription Webhook Handler
   * @request POST:/routes/stripe-webhook
   */
  export namespace subscription_webhook_handler {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SubscriptionWebhookHandlerData;
  }

  /**
   * @description Convert expired trials to Premium subscriptions.
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name convert_expired_trials
   * @summary Convert Expired Trials
   * @request POST:/routes/convert-expired-trials
   */
  export namespace convert_expired_trials {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ConvertExpiredTrialsData;
  }

  /**
   * No description
   * @tags dbtn/module:health, dbtn/hasAuth
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/health-check
   */
  export namespace health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = HealthCheckData;
  }

  /**
   * @description Create a new customer.
   * @tags dbtn/module:customers, dbtn/hasAuth
   * @name create_customer_endpoint
   * @summary Create Customer Endpoint
   * @request POST:/routes/customers/
   */
  export namespace create_customer_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCustomerRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateCustomerEndpointData;
  }

  /**
   * @description Get list of customers with pagination and optional search.
   * @tags dbtn/module:customers, dbtn/hasAuth
   * @name get_customers_endpoint
   * @summary Get Customers Endpoint
   * @request GET:/routes/customers/
   */
  export namespace get_customers_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomersEndpointData;
  }

  /**
   * @description Get a specific customer by ID.
   * @tags dbtn/module:customers, dbtn/hasAuth
   * @name get_customer_endpoint
   * @summary Get Customer Endpoint
   * @request GET:/routes/customers/{customer_id}
   */
  export namespace get_customer_endpoint {
    export type RequestParams = {
      /**
       * Customer Id
       * @format uuid
       */
      customerId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomerEndpointData;
  }

  /**
   * @description Update an existing customer.
   * @tags dbtn/module:customers, dbtn/hasAuth
   * @name update_customer_endpoint
   * @summary Update Customer Endpoint
   * @request PUT:/routes/customers/{customer_id}
   */
  export namespace update_customer_endpoint {
    export type RequestParams = {
      /**
       * Customer Id
       * @format uuid
       */
      customerId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateCustomerRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateCustomerEndpointData;
  }

  /**
   * @description Delete a customer.
   * @tags dbtn/module:customers, dbtn/hasAuth
   * @name delete_customer_endpoint
   * @summary Delete Customer Endpoint
   * @request DELETE:/routes/customers/{customer_id}
   */
  export namespace delete_customer_endpoint {
    export type RequestParams = {
      /**
       * Customer Id
       * @format uuid
       */
      customerId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteCustomerEndpointData;
  }

  /**
   * @description Creates a new invoice.
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name create_invoice_endpoint
   * @summary Create Invoice Endpoint
   * @request POST:/routes/invoices/invoices
   */
  export namespace create_invoice_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateInvoiceRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateInvoiceEndpointData;
  }

  /**
   * @description Get a paginated and sortable list of invoices.
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name get_invoices_endpoint
   * @summary Get Invoices Endpoint
   * @request GET:/routes/invoices/
   */
  export namespace get_invoices_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Page
       * Page number for pagination
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
       * Filter by invoice status (e.g., 'paid', 'due', 'overdue')
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetInvoicesEndpointData;
  }

  /**
   * @description Gets a single invoice by its ID.
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name get_invoice_endpoint
   * @summary Get Invoice Endpoint
   * @request GET:/routes/invoices/invoices/{invoice_id}
   */
  export namespace get_invoice_endpoint {
    export type RequestParams = {
      /** Invoice Id */
      invoiceId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetInvoiceEndpointData;
  }

  /**
   * @description Update an existing invoice.
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name update_invoice_endpoint
   * @summary Update Invoice Endpoint
   * @request PUT:/routes/invoices/{invoice_id}
   */
  export namespace update_invoice_endpoint {
    export type RequestParams = {
      /**
       * Invoice Id
       * @format uuid
       */
      invoiceId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpdateInvoiceRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateInvoiceEndpointData;
  }

  /**
   * @description Delete an invoice.
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name delete_invoice_endpoint
   * @summary Delete Invoice Endpoint
   * @request DELETE:/routes/invoices/{invoice_id}
   */
  export namespace delete_invoice_endpoint {
    export type RequestParams = {
      /**
       * Invoice Id
       * @format uuid
       */
      invoiceId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteInvoiceEndpointData;
  }

  /**
   * @description Send invoice via email to customer.
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name send_invoice_endpoint
   * @summary Send Invoice Endpoint
   * @request POST:/routes/invoices/send
   */
  export namespace send_invoice_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SendInvoiceRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SendInvoiceEndpointData;
  }

  /**
   * @description Returns the core financial stats for the main dashboard view. Combines total revenue/outstanding with invoice status counts.
   * @tags dbtn/module:dashboard, dbtn/hasAuth
   * @name get_financial_stats
   * @summary Get Core Financial Stats
   * @request GET:/routes/financial-stats
   */
  export namespace get_financial_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFinancialStatsData;
  }

  /**
   * @description Calculates and returns key performance indicators for the dashboard.
   * @tags dbtn/module:dashboard, dbtn/hasAuth
   * @name get_kpi_summary
   * @summary Get Kpi Summary
   * @request GET:/routes/kpi-summary
   */
  export namespace get_kpi_summary {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Start Date */
      start_date?: string | null;
      /** End Date */
      end_date?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetKpiSummaryData;
  }

  /**
   * @description Returns revenue data over a specified time period.
   * @tags dbtn/module:dashboard, dbtn/hasAuth
   * @name get_revenue_over_time
   * @summary Get Revenue Over Time
   * @request GET:/routes/revenue-over-time
   */
  export namespace get_revenue_over_time {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Start Date */
      start_date?: string | null;
      /** End Date */
      end_date?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRevenueOverTimeData;
  }

  /**
   * @description Returns the breakdown of invoices by status.
   * @tags dbtn/module:dashboard, dbtn/hasAuth
   * @name get_invoice_status_breakdown
   * @summary Get Invoice Status Breakdown
   * @request GET:/routes/invoice-status-breakdown
   */
  export namespace get_invoice_status_breakdown {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Start Date */
      start_date?: string | null;
      /** End Date */
      end_date?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetInvoiceStatusBreakdownData;
  }

  /**
   * @description Returns settlement summary data.
   * @tags dbtn/module:dashboard, dbtn/hasAuth
   * @name get_dashboard_settlement_summary
   * @summary Get Dashboard Settlement Summary
   * @request GET:/routes/dashboard-settlement-summary
   */
  export namespace get_dashboard_settlement_summary {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Start Date */
      start_date?: string | null;
      /** End Date */
      end_date?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDashboardSettlementSummaryData;
  }

  /**
   * @description Returns top 5 customers by revenue.
   * @tags dbtn/module:dashboard, dbtn/hasAuth
   * @name get_top_customers
   * @summary Get Top Customers
   * @request GET:/routes/top-customers
   */
  export namespace get_top_customers {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Start Date */
      start_date?: string | null;
      /** End Date */
      end_date?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTopCustomersData;
  }

  /**
   * @description Returns the recent activity feed.
   * @tags dbtn/module:dashboard, dbtn/hasAuth
   * @name get_activity_feed
   * @summary Get Activity Feed
   * @request GET:/routes/activity-feed
   */
  export namespace get_activity_feed {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetActivityFeedData;
  }

  /**
   * No description
   * @tags Dunning, dbtn/module:dunning, dbtn/hasAuth
   * @name get_dunning_rules
   * @summary Get Dunning Rules
   * @request GET:/routes/dunning/rules
   */
  export namespace get_dunning_rules {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDunningRulesData;
  }

  /**
   * No description
   * @tags Dunning, dbtn/module:dunning, dbtn/hasAuth
   * @name create_dunning_rule
   * @summary Create Dunning Rule
   * @request POST:/routes/dunning/rules
   */
  export namespace create_dunning_rule {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DunningRule;
    export type RequestHeaders = {};
    export type ResponseBody = CreateDunningRuleData;
  }

  /**
   * No description
   * @tags Dunning, dbtn/module:dunning, dbtn/hasAuth
   * @name get_dunning_rule
   * @summary Get Dunning Rule
   * @request GET:/routes/dunning/rules/{rule_id}
   */
  export namespace get_dunning_rule {
    export type RequestParams = {
      /** Rule Id */
      ruleId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDunningRuleData;
  }

  /**
   * No description
   * @tags Dunning, dbtn/module:dunning, dbtn/hasAuth
   * @name update_dunning_rule
   * @summary Update Dunning Rule
   * @request PUT:/routes/dunning/rules/{rule_id}
   */
  export namespace update_dunning_rule {
    export type RequestParams = {
      /** Rule Id */
      ruleId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = DunningRule;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateDunningRuleData;
  }

  /**
   * No description
   * @tags Dunning, dbtn/module:dunning, dbtn/hasAuth
   * @name delete_dunning_rule
   * @summary Delete Dunning Rule
   * @request DELETE:/routes/dunning/rules/{rule_id}
   */
  export namespace delete_dunning_rule {
    export type RequestParams = {
      /** Rule Id */
      ruleId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteDunningRuleData;
  }

  /**
   * @description Public endpoint to initiate a trial.
   * @tags dbtn/module:public_trial, dbtn/hasAuth
   * @name start_trial_new
   * @summary Start Trial New
   * @request POST:/routes/public/start-trial-new
   */
  export namespace start_trial_new {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = StartTrialRequest;
    export type RequestHeaders = {};
    export type ResponseBody = StartTrialNewData;
  }
}

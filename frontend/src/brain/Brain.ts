import {
  AcceptInvitationData,
  AcceptInvitationError,
  AcceptInvitationPublic2Data,
  AcceptInvitationPublic2Error,
  AcceptInvitationPublicData,
  AcceptInvitationPublicError,
  AcceptInvitationRequest,
  AppApisPublicAcceptInvitationPublicRequest,
  AppApisTeamAcceptInvitationPublicRequest,
  BillingAutomationHealthCheckData,
  BodyUploadLogo,
  BrandingSettingsUpdate,
  CalculateMonthlyFeesData,
  CalculateMonthlyFeesError,
  CalculateMonthlyFeesParams,
  CancelSubscriptionData,
  CancelSubscriptionError,
  CancelSubscriptionRequest,
  CheckHealthData,
  ConvertExpiredTrialsData,
  CreateAccountLinkPublicData,
  CreateAccountLinkPublicError,
  CreateAccountLinkRequest,
  CreateCheckoutSessionData,
  CreateCheckoutSessionError,
  CreateCheckoutSessionRequest,
  CreateCustomerEndpointData,
  CreateCustomerEndpointError,
  CreateCustomerPortalData,
  CreateCustomerPortalError,
  CreateCustomerRequest,
  CreateDeploymentLogData,
  CreateDeploymentLogError,
  CreateDeploymentLogRequest,
  CreateDunningRuleData,
  CreateDunningRuleError,
  CreateInstantPayoutData,
  CreateInstantPayoutError,
  CreateInvoiceEndpointData,
  CreateInvoiceEndpointError,
  CreateInvoiceRequest,
  CreateMonthlyBillingData,
  CreateMonthlyBillingError,
  CreateMonthlyBillingRequest,
  CreateOnboardingLinkData,
  CreatePayoutAccountData,
  CreatePayoutAccountError,
  CreatePayoutAccountRequest,
  CreateSimplePayoutAccountData,
  CreateSimplePayoutAccountError,
  CreateSimplePayoutAccountRequest,
  CreateTransactionFeeRequest,
  CronJobsHealthCheckData,
  CustomerPortalRequest,
  DeleteCustomerEndpointData,
  DeleteCustomerEndpointError,
  DeleteCustomerEndpointParams,
  DeleteDunningRuleData,
  DeleteDunningRuleError,
  DeleteDunningRuleParams,
  DeleteInvoiceEndpointData,
  DeleteInvoiceEndpointError,
  DeleteInvoiceEndpointParams,
  DeploymentCronHealthCheckData,
  DeploymentHealthCheckData,
  DeploymentLogsHealthCheckData,
  DeploymentStatusCheckData,
  DunningRule,
  EnterpriseContactRequest,
  ExportAuditLogsData,
  ExportAuditLogsError,
  ExportAuditLogsParams,
  ExportCustomersData,
  ExportCustomersError,
  ExportCustomersParams,
  ExportInvoicesData,
  ExportInvoicesError,
  ExportInvoicesParams,
  ExportPaymentsData,
  ExportPaymentsError,
  ExportPaymentsParams,
  FeePreviewRequest,
  GetAllPlanFeeInfoData,
  GetAuditLogsData,
  GetAuditLogsError,
  GetAuditLogsParams,
  GetAuditStatsData,
  GetAuditStatsError,
  GetAuditStatsParams,
  GetAvailableActionsData,
  GetAvailableResourceTypesData,
  GetBillingCronSetupInstructionsData,
  GetBillingHistoryData,
  GetBillingHistoryError,
  GetBillingHistoryParams,
  GetBrandingSettingsData,
  GetCronSetupInstructionsData,
  GetCurrentMonthFeesPreviewData,
  GetCurrentMonthPreviewData,
  GetCurrentPayoutAccountData,
  GetCurrentSubscriptionData,
  GetCustomerEndpointData,
  GetCustomerEndpointError,
  GetCustomerEndpointParams,
  GetCustomersEndpointData,
  GetCustomersEndpointError,
  GetCustomersEndpointParams,
  GetDeploymentLogsData,
  GetDeploymentLogsError,
  GetDeploymentLogsParams,
  GetDunningRuleData,
  GetDunningRuleError,
  GetDunningRuleParams,
  GetDunningRulesData,
  GetEnterpriseInquiriesData,
  GetExportStatsData,
  GetFeatureAccessData,
  GetFeePreviewData,
  GetFeePreviewError,
  GetFeeStructureData,
  GetFinancialStatsData,
  GetInvitationDetails2Data,
  GetInvitationDetails2Error,
  GetInvitationDetails2Params,
  GetInvitationDetailsData,
  GetInvitationDetailsError,
  GetInvitationDetailsParams,
  GetInvoiceEndpointData,
  GetInvoiceEndpointError,
  GetInvoiceEndpointParams,
  GetInvoicesEndpointData,
  GetInvoicesEndpointError,
  GetInvoicesEndpointParams,
  GetMonthlyBillingDetailsData,
  GetMonthlyBillingDetailsError,
  GetMonthlyBillingDetailsParams,
  GetMonthlyBillingSummaryData,
  GetMonthlyBillingSummaryError,
  GetMonthlyBillingSummaryParams,
  GetMonthlyBillingsData,
  GetMonthlyBillingsError,
  GetMonthlyBillingsParams,
  GetMyRoleData,
  GetNextInvoiceNumberData,
  GetPayoutsData,
  GetPayoutsError,
  GetPayoutsParams,
  GetPlanFeeInfoEndpointData,
  GetPlanFeeInfoEndpointError,
  GetPlanFeeInfoEndpointParams,
  GetPublicStripeConfigData,
  GetSettlementSummaryData,
  GetStripeConfigData,
  GetSubscriptionPlansData,
  GetSubscriptionStripeConfigData,
  GetTeamInvitationsData,
  GetTeamMembersData,
  GetTransfersData,
  GetTransfersError,
  GetTransfersParams,
  GetTrialStatisticsData,
  GetUnbilledFeesData,
  InviteUserData,
  InviteUserError,
  InviteUserRequest,
  JobHealthCheckData,
  ManualPaymentReconciliationData,
  ManualPaymentReconciliationError,
  NotificationRequest,
  PaymentReconciliationRequest,
  PayoutRequest,
  RecordTransactionFeeData,
  RecordTransactionFeeError,
  RefreshPayoutAccountData,
  RemoveLogoData,
  RemoveTeamMemberData,
  RemoveTeamMemberError,
  RemoveTeamMemberParams,
  ReserveInvoiceNumberData,
  RevokeInvitationData,
  RevokeInvitationError,
  RevokeInvitationParams,
  RunDunningJobCronData,
  RunDunningJobCronError,
  RunDunningJobData,
  RunDunningJobError,
  RunDunningJobParams,
  RunMonthlyBillingJobData,
  RunTrialConversionJobCronData,
  RunTrialConversionJobCronError,
  RunTrialConversionJobData,
  SendInvoiceEndpointData,
  SendInvoiceEndpointError,
  SendInvoiceRequest,
  SendTrialRemindersCronData,
  SendTrialRemindersCronError,
  SendTrialRemindersData,
  SendTrialRemindersError,
  StartTrialData,
  StartTrialError,
  StartTrialRequest,
  StripeWebhookHandlerData,
  StripeWebhookHandlerError,
  SubmitEnterpriseContactData,
  SubmitEnterpriseContactError,
  SubscriptionWebhookHandlerData,
  TestWebhookData,
  UpdateBrandingSettingsData,
  UpdateBrandingSettingsError,
  UpdateCustomerEndpointData,
  UpdateCustomerEndpointError,
  UpdateCustomerEndpointParams,
  UpdateCustomerRequest,
  UpdateDunningRuleData,
  UpdateDunningRuleError,
  UpdateDunningRuleParams,
  UpdateInvoiceEndpointData,
  UpdateInvoiceEndpointError,
  UpdateInvoiceEndpointParams,
  UpdateInvoicePrefixData,
  UpdateInvoicePrefixError,
  UpdateInvoiceRequest,
  UpdateMemberRoleData,
  UpdateMemberRoleError,
  UpdateMemberRoleParams,
  UpdateMemberRoleRequest,
  UpdatePrefixRequest,
  UpgradeSubscriptionData,
  UpgradeSubscriptionError,
  UpgradeSubscriptionRequest,
  UploadLogoData,
  UploadLogoError,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Triggers the dunning process to check for overdue invoices and send reminders. This endpoint is designed to be called by a scheduler and is protected by a secret key.
   *
   * @tags Scheduler, dbtn/module:scheduler, dbtn/hasAuth
   * @name run_dunning_job
   * @summary Run Dunning Job
   * @request POST:/routes/scheduler/run-dunning
   */
  run_dunning_job = (query: RunDunningJobParams, params: RequestParams = {}) =>
    this.request<RunDunningJobData, RunDunningJobError>({
      path: `/routes/scheduler/run-dunning`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Run the automated trial-to-paid conversion job. This endpoint should be called daily by an external scheduler (like GitHub Actions, Vercel Cron, or external cron service).
   *
   * @tags dbtn/module:jobs
   * @name run_trial_conversion_job
   * @summary Run Trial Conversion Job
   * @request POST:/routes/run-trial-conversion
   */
  run_trial_conversion_job = (params: RequestParams = {}) =>
    this.request<RunTrialConversionJobData, any>({
      path: `/routes/run-trial-conversion`,
      method: "POST",
      ...params,
    });

  /**
   * @description Health check for job endpoints.
   *
   * @tags dbtn/module:jobs
   * @name job_health_check
   * @summary Job Health Check
   * @request GET:/routes/health
   */
  job_health_check = (params: RequestParams = {}) =>
    this.request<JobHealthCheckData, any>({
      path: `/routes/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get Stripe configuration for frontend. Public endpoint for signup flow.
   *
   * @tags dbtn/module:config
   * @name get_stripe_config
   * @summary Get Stripe Config
   * @request GET:/routes/stripe
   */
  get_stripe_config = (params: RequestParams = {}) =>
    this.request<GetStripeConfigData, any>({
      path: `/routes/stripe`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new customer.
   *
   * @tags dbtn/module:customers, dbtn/hasAuth
   * @name create_customer_endpoint
   * @summary Create Customer Endpoint
   * @request POST:/routes/customers/
   */
  create_customer_endpoint = (data: CreateCustomerRequest, params: RequestParams = {}) =>
    this.request<CreateCustomerEndpointData, CreateCustomerEndpointError>({
      path: `/routes/customers/`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get list of customers with pagination and optional search.
   *
   * @tags dbtn/module:customers, dbtn/hasAuth
   * @name get_customers_endpoint
   * @summary Get Customers Endpoint
   * @request GET:/routes/customers/
   */
  get_customers_endpoint = (query: GetCustomersEndpointParams, params: RequestParams = {}) =>
    this.request<GetCustomersEndpointData, GetCustomersEndpointError>({
      path: `/routes/customers/`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific customer by ID.
   *
   * @tags dbtn/module:customers, dbtn/hasAuth
   * @name get_customer_endpoint
   * @summary Get Customer Endpoint
   * @request GET:/routes/customers/{customer_id}
   */
  get_customer_endpoint = ({ customerId, ...query }: GetCustomerEndpointParams, params: RequestParams = {}) =>
    this.request<GetCustomerEndpointData, GetCustomerEndpointError>({
      path: `/routes/customers/${customerId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update an existing customer.
   *
   * @tags dbtn/module:customers, dbtn/hasAuth
   * @name update_customer_endpoint
   * @summary Update Customer Endpoint
   * @request PUT:/routes/customers/{customer_id}
   */
  update_customer_endpoint = (
    { customerId, ...query }: UpdateCustomerEndpointParams,
    data: UpdateCustomerRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateCustomerEndpointData, UpdateCustomerEndpointError>({
      path: `/routes/customers/${customerId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a customer.
   *
   * @tags dbtn/module:customers, dbtn/hasAuth
   * @name delete_customer_endpoint
   * @summary Delete Customer Endpoint
   * @request DELETE:/routes/customers/{customer_id}
   */
  delete_customer_endpoint = ({ customerId, ...query }: DeleteCustomerEndpointParams, params: RequestParams = {}) =>
    this.request<DeleteCustomerEndpointData, DeleteCustomerEndpointError>({
      path: `/routes/customers/${customerId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get export statistics and available formats.
   *
   * @tags dbtn/module:export, dbtn/hasAuth
   * @name get_export_stats
   * @summary Get Export Stats
   * @request GET:/routes/export/stats
   */
  get_export_stats = (params: RequestParams = {}) =>
    this.request<GetExportStatsData, any>({
      path: `/routes/export/stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Export customer data with filtering options.
   *
   * @tags dbtn/module:export, dbtn/hasAuth
   * @name export_customers
   * @summary Export Customers
   * @request GET:/routes/export/customers
   */
  export_customers = (query: ExportCustomersParams, params: RequestParams = {}) =>
    this.request<ExportCustomersData, ExportCustomersError>({
      path: `/routes/export/customers`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Export invoice data with comprehensive filtering options.
   *
   * @tags dbtn/module:export, dbtn/hasAuth
   * @name export_invoices
   * @summary Export Invoices
   * @request GET:/routes/export/invoices
   */
  export_invoices = (query: ExportInvoicesParams, params: RequestParams = {}) =>
    this.request<ExportInvoicesData, ExportInvoicesError>({
      path: `/routes/export/invoices`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Export payment data with filtering options.
   *
   * @tags dbtn/module:export, dbtn/hasAuth
   * @name export_payments
   * @summary Export Payments
   * @request GET:/routes/export/payments
   */
  export_payments = (query: ExportPaymentsParams, params: RequestParams = {}) =>
    this.request<ExportPaymentsData, ExportPaymentsError>({
      path: `/routes/export/payments`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get audit logs with comprehensive filtering options.
   *
   * @tags dbtn/module:audit, dbtn/hasAuth
   * @name get_audit_logs
   * @summary Get Audit Logs
   * @request GET:/routes/audit/logs
   */
  get_audit_logs = (query: GetAuditLogsParams, params: RequestParams = {}) =>
    this.request<GetAuditLogsData, GetAuditLogsError>({
      path: `/routes/audit/logs`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get audit log statistics for dashboard and analytics.
   *
   * @tags dbtn/module:audit, dbtn/hasAuth
   * @name get_audit_stats
   * @summary Get Audit Stats
   * @request GET:/routes/audit/stats
   */
  get_audit_stats = (query: GetAuditStatsParams, params: RequestParams = {}) =>
    this.request<GetAuditStatsData, GetAuditStatsError>({
      path: `/routes/audit/stats`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get list of all available audit actions for filtering.
   *
   * @tags dbtn/module:audit, dbtn/hasAuth
   * @name get_available_actions
   * @summary Get Available Actions
   * @request GET:/routes/audit/actions
   */
  get_available_actions = (params: RequestParams = {}) =>
    this.request<GetAvailableActionsData, any>({
      path: `/routes/audit/actions`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get list of all available resource types for filtering.
   *
   * @tags dbtn/module:audit, dbtn/hasAuth
   * @name get_available_resource_types
   * @summary Get Available Resource Types
   * @request GET:/routes/audit/resource-types
   */
  get_available_resource_types = (params: RequestParams = {}) =>
    this.request<GetAvailableResourceTypesData, any>({
      path: `/routes/audit/resource-types`,
      method: "GET",
      ...params,
    });

  /**
   * @description Export audit logs in CSV or JSON format.
   *
   * @tags dbtn/module:audit, dbtn/hasAuth
   * @name export_audit_logs
   * @summary Export Audit Logs
   * @request GET:/routes/audit/export
   */
  export_audit_logs = (query: ExportAuditLogsParams, params: RequestParams = {}) =>
    this.request<ExportAuditLogsData, ExportAuditLogsError>({
      path: `/routes/audit/export`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get all team members for the current account.
   *
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name get_team_members
   * @summary Get Team Members
   * @request GET:/routes/members
   */
  get_team_members = (params: RequestParams = {}) =>
    this.request<GetTeamMembersData, any>({
      path: `/routes/members`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all pending team invitations for the current account.
   *
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name get_team_invitations
   * @summary Get Team Invitations
   * @request GET:/routes/invitations
   */
  get_team_invitations = (params: RequestParams = {}) =>
    this.request<GetTeamInvitationsData, any>({
      path: `/routes/invitations`,
      method: "GET",
      ...params,
    });

  /**
   * @description Invite a user to join the team.
   *
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name invite_user
   * @summary Invite User
   * @request POST:/routes/invite
   */
  invite_user = (data: InviteUserRequest, params: RequestParams = {}) =>
    this.request<InviteUserData, InviteUserError>({
      path: `/routes/invite`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Accept a team invitation.
   *
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name accept_invitation
   * @summary Accept Invitation
   * @request POST:/routes/accept-invitation
   */
  accept_invitation = (data: AcceptInvitationRequest, params: RequestParams = {}) =>
    this.request<AcceptInvitationData, AcceptInvitationError>({
      path: `/routes/accept-invitation`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update a team member's role.
   *
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name update_member_role
   * @summary Update Member Role
   * @request PUT:/routes/members/{user_id}/role
   */
  update_member_role = (
    { userId, ...query }: UpdateMemberRoleParams,
    data: UpdateMemberRoleRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateMemberRoleData, UpdateMemberRoleError>({
      path: `/routes/members/${userId}/role`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Remove a team member from the account.
   *
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name remove_team_member
   * @summary Remove Team Member
   * @request DELETE:/routes/members/{user_id}
   */
  remove_team_member = ({ userId, ...query }: RemoveTeamMemberParams, params: RequestParams = {}) =>
    this.request<RemoveTeamMemberData, RemoveTeamMemberError>({
      path: `/routes/members/${userId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Revoke a pending team invitation.
   *
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name revoke_invitation
   * @summary Revoke Invitation
   * @request DELETE:/routes/invitations/{invitation_id}
   */
  revoke_invitation = ({ invitationId, ...query }: RevokeInvitationParams, params: RequestParams = {}) =>
    this.request<RevokeInvitationData, RevokeInvitationError>({
      path: `/routes/invitations/${invitationId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get invitation details without authentication for display on acceptance page.
   *
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name get_invitation_details2
   * @summary Get Invitation Details2
   * @request GET:/routes/invitation/{token}
   */
  get_invitation_details2 = ({ token, ...query }: GetInvitationDetails2Params, params: RequestParams = {}) =>
    this.request<GetInvitationDetails2Data, GetInvitationDetails2Error>({
      path: `/routes/invitation/${token}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Accept invitation and create new account if needed (no auth required).
   *
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name accept_invitation_public2
   * @summary Accept Invitation Public2
   * @request POST:/routes/accept-invitation-public
   */
  accept_invitation_public2 = (data: AppApisTeamAcceptInvitationPublicRequest, params: RequestParams = {}) =>
    this.request<AcceptInvitationPublic2Data, AcceptInvitationPublic2Error>({
      path: `/routes/accept-invitation-public`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current user's role in the team.
   *
   * @tags dbtn/module:team, dbtn/hasAuth
   * @name get_my_role
   * @summary Get My Role
   * @request GET:/routes/my-role
   */
  get_my_role = (params: RequestParams = {}) =>
    this.request<GetMyRoleData, any>({
      path: `/routes/my-role`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get settlement summary with fee breakdown.
   *
   * @tags dbtn/module:settlements, dbtn/hasAuth
   * @name get_settlement_summary
   * @summary Get Settlement Summary
   * @request GET:/routes/settlement-summary
   */
  get_settlement_summary = (params: RequestParams = {}) =>
    this.request<GetSettlementSummaryData, any>({
      path: `/routes/settlement-summary`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get recent transfers to connected account.
   *
   * @tags dbtn/module:settlements, dbtn/hasAuth
   * @name get_transfers
   * @summary Get Transfers
   * @request GET:/routes/transfers
   */
  get_transfers = (query: GetTransfersParams, params: RequestParams = {}) =>
    this.request<GetTransfersData, GetTransfersError>({
      path: `/routes/transfers`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create an instant payout to connected account.
   *
   * @tags dbtn/module:settlements, dbtn/hasAuth
   * @name create_instant_payout
   * @summary Create Instant Payout
   * @request POST:/routes/instant-payout
   */
  create_instant_payout = (data: PayoutRequest, params: RequestParams = {}) =>
    this.request<CreateInstantPayoutData, CreateInstantPayoutError>({
      path: `/routes/instant-payout`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get recent payouts for connected account.
   *
   * @tags dbtn/module:settlements, dbtn/hasAuth
   * @name get_payouts
   * @summary Get Payouts
   * @request GET:/routes/payouts
   */
  get_payouts = (query: GetPayoutsParams, params: RequestParams = {}) =>
    this.request<GetPayoutsData, GetPayoutsError>({
      path: `/routes/payouts`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * No description
   *
   * @tags Dunning, dbtn/module:dunning, dbtn/hasAuth
   * @name get_dunning_rules
   * @summary Get Dunning Rules
   * @request GET:/routes/dunning/rules
   */
  get_dunning_rules = (params: RequestParams = {}) =>
    this.request<GetDunningRulesData, any>({
      path: `/routes/dunning/rules`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags Dunning, dbtn/module:dunning, dbtn/hasAuth
   * @name create_dunning_rule
   * @summary Create Dunning Rule
   * @request POST:/routes/dunning/rules
   */
  create_dunning_rule = (data: DunningRule, params: RequestParams = {}) =>
    this.request<CreateDunningRuleData, CreateDunningRuleError>({
      path: `/routes/dunning/rules`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags Dunning, dbtn/module:dunning, dbtn/hasAuth
   * @name get_dunning_rule
   * @summary Get Dunning Rule
   * @request GET:/routes/dunning/rules/{rule_id}
   */
  get_dunning_rule = ({ ruleId, ...query }: GetDunningRuleParams, params: RequestParams = {}) =>
    this.request<GetDunningRuleData, GetDunningRuleError>({
      path: `/routes/dunning/rules/${ruleId}`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags Dunning, dbtn/module:dunning, dbtn/hasAuth
   * @name update_dunning_rule
   * @summary Update Dunning Rule
   * @request PUT:/routes/dunning/rules/{rule_id}
   */
  update_dunning_rule = (
    { ruleId, ...query }: UpdateDunningRuleParams,
    data: DunningRule,
    params: RequestParams = {},
  ) =>
    this.request<UpdateDunningRuleData, UpdateDunningRuleError>({
      path: `/routes/dunning/rules/${ruleId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags Dunning, dbtn/module:dunning, dbtn/hasAuth
   * @name delete_dunning_rule
   * @summary Delete Dunning Rule
   * @request DELETE:/routes/dunning/rules/{rule_id}
   */
  delete_dunning_rule = ({ ruleId, ...query }: DeleteDunningRuleParams, params: RequestParams = {}) =>
    this.request<DeleteDunningRuleData, DeleteDunningRuleError>({
      path: `/routes/dunning/rules/${ruleId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Calculates and returns key financial statistics from the invoices table. - Total Revenue: Sum of all 'PAID' invoices. - Total Outstanding: Sum of all 'SENT' and 'OVERDUE' invoices. - Invoice Summary: A count of invoices by their status. SECURITY: Results are scoped to the user's account to prevent data leakage.
   *
   * @tags Dashboard, dbtn/module:dashboard, dbtn/hasAuth
   * @name get_financial_stats
   * @summary Get Financial Stats
   * @request GET:/routes/dashboard/stats
   */
  get_financial_stats = (params: RequestParams = {}) =>
    this.request<GetFinancialStatsData, any>({
      path: `/routes/dashboard/stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get branding settings for the current user's account
   *
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name get_branding_settings
   * @summary Get Branding Settings
   * @request GET:/routes/branding-settings
   */
  get_branding_settings = (params: RequestParams = {}) =>
    this.request<GetBrandingSettingsData, any>({
      path: `/routes/branding-settings`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update branding settings
   *
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name update_branding_settings
   * @summary Update Branding Settings
   * @request PUT:/routes/branding-settings
   */
  update_branding_settings = (data: BrandingSettingsUpdate, params: RequestParams = {}) =>
    this.request<UpdateBrandingSettingsData, UpdateBrandingSettingsError>({
      path: `/routes/branding-settings`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Upload and set company logo
   *
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name upload_logo
   * @summary Upload Logo
   * @request POST:/routes/branding-settings/upload-logo
   */
  upload_logo = (data: BodyUploadLogo, params: RequestParams = {}) =>
    this.request<UploadLogoData, UploadLogoError>({
      path: `/routes/branding-settings/upload-logo`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Remove company logo
   *
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name remove_logo
   * @summary Remove Logo
   * @request DELETE:/routes/branding-settings/remove-logo
   */
  remove_logo = (params: RequestParams = {}) =>
    this.request<RemoveLogoData, any>({
      path: `/routes/branding-settings/remove-logo`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Handle Enterprise plan inquiries and demo requests. Store the inquiry and send notification to sales team.
   *
   * @tags dbtn/module:enterprise_contact, dbtn/hasAuth
   * @name submit_enterprise_contact
   * @summary Submit Enterprise Contact
   * @request POST:/routes/enterprise-contact
   */
  submit_enterprise_contact = (data: EnterpriseContactRequest, params: RequestParams = {}) =>
    this.request<SubmitEnterpriseContactData, SubmitEnterpriseContactError>({
      path: `/routes/enterprise-contact`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all enterprise inquiries (for admin/sales team use)
   *
   * @tags dbtn/module:enterprise_contact, dbtn/hasAuth
   * @name get_enterprise_inquiries
   * @summary Get Enterprise Inquiries
   * @request GET:/routes/enterprise-inquiries
   */
  get_enterprise_inquiries = (params: RequestParams = {}) =>
    this.request<GetEnterpriseInquiriesData, any>({
      path: `/routes/enterprise-inquiries`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get monthly billing summary for the last N months.
   *
   * @tags dbtn/module:monthly_billing, dbtn/hasAuth
   * @name get_monthly_billing_summary
   * @summary Get Monthly Billing Summary
   * @request GET:/routes/monthly-billing/summary
   */
  get_monthly_billing_summary = (query: GetMonthlyBillingSummaryParams, params: RequestParams = {}) =>
    this.request<GetMonthlyBillingSummaryData, GetMonthlyBillingSummaryError>({
      path: `/routes/monthly-billing/summary`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get detailed monthly billing information for a specific month.
   *
   * @tags dbtn/module:monthly_billing, dbtn/hasAuth
   * @name get_monthly_billing_details
   * @summary Get Monthly Billing Details
   * @request GET:/routes/monthly-billing/details/{year}/{month}
   */
  get_monthly_billing_details = (
    { year, month, ...query }: GetMonthlyBillingDetailsParams,
    params: RequestParams = {},
  ) =>
    this.request<GetMonthlyBillingDetailsData, GetMonthlyBillingDetailsError>({
      path: `/routes/monthly-billing/details/${year}/${month}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get preview of current month's unbilled transaction fees.
   *
   * @tags dbtn/module:monthly_billing, dbtn/hasAuth
   * @name get_current_month_preview
   * @summary Get Current Month Preview
   * @request GET:/routes/monthly-billing/current-month-preview
   */
  get_current_month_preview = (params: RequestParams = {}) =>
    this.request<GetCurrentMonthPreviewData, any>({
      path: `/routes/monthly-billing/current-month-preview`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a preview of transaction fees for a given payment amount.
   *
   * @tags dbtn/module:fees, dbtn/hasAuth
   * @name get_fee_preview
   * @summary Get Fee Preview
   * @request POST:/routes/fees/preview
   */
  get_fee_preview = (data: FeePreviewRequest, params: RequestParams = {}) =>
    this.request<GetFeePreviewData, GetFeePreviewError>({
      path: `/routes/fees/preview`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get fee information for a specific subscription plan.
   *
   * @tags dbtn/module:fees, dbtn/hasAuth
   * @name get_plan_fee_info_endpoint
   * @summary Get Plan Fee Info Endpoint
   * @request GET:/routes/fees/plan-info/{plan_slug}
   */
  get_plan_fee_info_endpoint = ({ planSlug, ...query }: GetPlanFeeInfoEndpointParams, params: RequestParams = {}) =>
    this.request<GetPlanFeeInfoEndpointData, GetPlanFeeInfoEndpointError>({
      path: `/routes/fees/plan-info/${planSlug}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get fee information for all subscription plans.
   *
   * @tags dbtn/module:fees, dbtn/hasAuth
   * @name get_all_plan_fee_info
   * @summary Get All Plan Fee Info
   * @request GET:/routes/fees/all-plans
   */
  get_all_plan_fee_info = (params: RequestParams = {}) =>
    this.request<GetAllPlanFeeInfoData, any>({
      path: `/routes/fees/all-plans`,
      method: "GET",
      ...params,
    });

  /**
   * @description Run monthly billing job for all users with unbilled transaction fees. This should typically be run on the 1st of each month.
   *
   * @tags dbtn/module:billing_automation, dbtn/hasAuth
   * @name run_monthly_billing_job
   * @summary Run Monthly Billing Job
   * @request POST:/routes/billing-automation/run-monthly-billing
   */
  run_monthly_billing_job = (params: RequestParams = {}) =>
    this.request<RunMonthlyBillingJobData, any>({
      path: `/routes/billing-automation/run-monthly-billing`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create monthly billing for the current user for a specific month.
   *
   * @tags dbtn/module:billing_automation, dbtn/hasAuth
   * @name create_monthly_billing
   * @summary Create Monthly Billing
   * @request POST:/routes/billing-automation/create-monthly-billing
   */
  create_monthly_billing = (data: CreateMonthlyBillingRequest, params: RequestParams = {}) =>
    this.request<CreateMonthlyBillingData, CreateMonthlyBillingError>({
      path: `/routes/billing-automation/create-monthly-billing`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check endpoint for the billing automation system.
   *
   * @tags dbtn/module:billing_automation, dbtn/hasAuth
   * @name billing_automation_health_check
   * @summary Billing Automation Health Check
   * @request GET:/routes/billing-automation/health
   */
  billing_automation_health_check = (params: RequestParams = {}) =>
    this.request<BillingAutomationHealthCheckData, any>({
      path: `/routes/billing-automation/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get transaction fee structure information for the settings page.
   *
   * @tags dbtn/module:settings, dbtn/hasAuth
   * @name get_fee_structure
   * @summary Get Fee Structure
   * @request GET:/routes/settings/fee-structure
   */
  get_fee_structure = (params: RequestParams = {}) =>
    this.request<GetFeeStructureData, any>({
      path: `/routes/settings/fee-structure`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get cron job setup instructions for automated billing.
   *
   * @tags dbtn/module:settings, dbtn/hasAuth
   * @name get_billing_cron_setup_instructions
   * @summary Get Billing Cron Setup Instructions
   * @request GET:/routes/settings/cron-setup
   */
  get_billing_cron_setup_instructions = (params: RequestParams = {}) =>
    this.request<GetBillingCronSetupInstructionsData, any>({
      path: `/routes/settings/cron-setup`,
      method: "GET",
      ...params,
    });

  /**
   * @description Run the dunning job to send automated reminders.
   *
   * @tags dbtn/module:cron_jobs, dbtn/hasAuth
   * @name run_dunning_job_cron
   * @summary Run Dunning Job Cron
   * @request POST:/routes/cron/run-dunning-job
   */
  run_dunning_job_cron = (params: RequestParams = {}) =>
    this.request<RunDunningJobCronData, RunDunningJobCronError>({
      path: `/routes/cron/run-dunning-job`,
      method: "POST",
      ...params,
    });

  /**
   * @description Run job to process trial conversions and send notifications.
   *
   * @tags dbtn/module:cron_jobs, dbtn/hasAuth
   * @name run_trial_conversion_job_cron
   * @summary Run Trial Conversion Job Cron
   * @request POST:/routes/cron/run-trial-conversion-job
   */
  run_trial_conversion_job_cron = (params: RequestParams = {}) =>
    this.request<RunTrialConversionJobCronData, RunTrialConversionJobCronError>({
      path: `/routes/cron/run-trial-conversion-job`,
      method: "POST",
      ...params,
    });

  /**
   * @description Health check for cron job system.
   *
   * @tags dbtn/module:cron_jobs, dbtn/hasAuth
   * @name cron_jobs_health_check
   * @summary Cron Jobs Health Check
   * @request GET:/routes/cron/health
   */
  cron_jobs_health_check = (params: RequestParams = {}) =>
    this.request<CronJobsHealthCheckData, any>({
      path: `/routes/cron/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Send trial reminder emails to users approaching trial end.
   *
   * @tags dbtn/module:cron_jobs, dbtn/hasAuth
   * @name send_trial_reminders_cron
   * @summary Send Trial Reminders Cron
   * @request POST:/routes/cron/send-trial-reminders
   */
  send_trial_reminders_cron = (params: RequestParams = {}) =>
    this.request<SendTrialRemindersCronData, SendTrialRemindersCronError>({
      path: `/routes/cron/send-trial-reminders`,
      method: "POST",
      ...params,
    });

  /**
   * @description Record a transaction fee for a processed payment.
   *
   * @tags dbtn/module:transaction_fees, dbtn/hasAuth
   * @name record_transaction_fee
   * @summary Record Transaction Fee
   * @request POST:/routes/transaction-fees/record-fee
   */
  record_transaction_fee = (data: CreateTransactionFeeRequest, params: RequestParams = {}) =>
    this.request<RecordTransactionFeeData, RecordTransactionFeeError>({
      path: `/routes/transaction-fees/record-fee`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Calculate monthly transaction fees for a specific month.
   *
   * @tags dbtn/module:transaction_fees, dbtn/hasAuth
   * @name calculate_monthly_fees
   * @summary Calculate Monthly Fees
   * @request GET:/routes/transaction-fees/monthly-calculation/{year}/{month}
   */
  calculate_monthly_fees = ({ year, month, ...query }: CalculateMonthlyFeesParams, params: RequestParams = {}) =>
    this.request<CalculateMonthlyFeesData, CalculateMonthlyFeesError>({
      path: `/routes/transaction-fees/monthly-calculation/${year}/${month}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get monthly fee billing history for the user.
   *
   * @tags dbtn/module:transaction_fees, dbtn/hasAuth
   * @name get_monthly_billings
   * @summary Get Monthly Billings
   * @request GET:/routes/transaction-fees/monthly-billings
   */
  get_monthly_billings = (query: GetMonthlyBillingsParams, params: RequestParams = {}) =>
    this.request<GetMonthlyBillingsData, GetMonthlyBillingsError>({
      path: `/routes/transaction-fees/monthly-billings`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get preview of current month's transaction fees.
   *
   * @tags dbtn/module:transaction_fees, dbtn/hasAuth
   * @name get_current_month_fees_preview
   * @summary Get Current Month Fees Preview
   * @request GET:/routes/transaction-fees/current-month-preview
   */
  get_current_month_fees_preview = (params: RequestParams = {}) =>
    this.request<GetCurrentMonthFeesPreviewData, any>({
      path: `/routes/transaction-fees/current-month-preview`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all unbilled transaction fees for the user.
   *
   * @tags dbtn/module:transaction_fees, dbtn/hasAuth
   * @name get_unbilled_fees
   * @summary Get Unbilled Fees
   * @request GET:/routes/transaction-fees/unbilled-fees
   */
  get_unbilled_fees = (params: RequestParams = {}) =>
    this.request<GetUnbilledFeesData, any>({
      path: `/routes/transaction-fees/unbilled-fees`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get deployment logs from the last N deployment attempts. This endpoint is public to allow external monitoring tools to access logs.
   *
   * @tags dbtn/module:deployment_logs, dbtn/hasAuth
   * @name get_deployment_logs
   * @summary Get Deployment Logs
   * @request GET:/routes/deployment-logs/
   */
  get_deployment_logs = (query: GetDeploymentLogsParams, params: RequestParams = {}) =>
    this.request<GetDeploymentLogsData, GetDeploymentLogsError>({
      path: `/routes/deployment-logs/`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create a new deployment log entry. This endpoint can be called during deployment processes to log progress.
   *
   * @tags dbtn/module:deployment_logs, dbtn/hasAuth
   * @name create_deployment_log
   * @summary Create Deployment Log
   * @request POST:/routes/deployment-logs/log
   */
  create_deployment_log = (data: CreateDeploymentLogRequest, params: RequestParams = {}) =>
    this.request<CreateDeploymentLogData, CreateDeploymentLogError>({
      path: `/routes/deployment-logs/log`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check for deployment logs system.
   *
   * @tags dbtn/module:deployment_logs, dbtn/hasAuth
   * @name deployment_logs_health_check
   * @summary Deployment Logs Health Check
   * @request GET:/routes/deployment-logs/health
   */
  deployment_logs_health_check = (params: RequestParams = {}) =>
    this.request<DeploymentLogsHealthCheckData, any>({
      path: `/routes/deployment-logs/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Comprehensive health check endpoint for external monitoring. This endpoint provides a detailed health status including: - Database connectivity - Environment configuration - External service availability - Overall system health Returns HTTP 200 with detailed status information. External monitoring tools can parse the 'overall_status' field.
   *
   * @tags dbtn/module:deployment_health
   * @name deployment_health_check
   * @summary Deployment Health Check
   * @request GET:/routes/deployment-health-check
   */
  deployment_health_check = (params: RequestParams = {}) =>
    this.request<DeploymentHealthCheckData, any>({
      path: `/routes/deployment-health-check`,
      method: "GET",
      ...params,
    });

  /**
   * @description Simple deployment health check for quick monitoring. Returns a simplified health status focused on deployment success/failure. Useful for basic uptime monitoring and alerting.
   *
   * @tags dbtn/module:deployment_health
   * @name deployment_status_check
   * @summary Deployment Status Check
   * @request GET:/routes/deployment-status
   */
  deployment_status_check = (params: RequestParams = {}) =>
    this.request<DeploymentStatusCheckData, any>({
      path: `/routes/deployment-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check endpoint specifically for cron job monitoring. This endpoint can be called by external cron monitoring services to verify that scheduled tasks are running properly.
   *
   * @tags dbtn/module:deployment_health
   * @name deployment_cron_health_check
   * @summary Deployment Cron Health Check
   * @request GET:/routes/deployment-cron-health
   */
  deployment_cron_health_check = (params: RequestParams = {}) =>
    this.request<DeploymentCronHealthCheckData, any>({
      path: `/routes/deployment-cron-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get Stripe publishable key for signup flow. Public endpoint.
   *
   * @tags dbtn/module:public
   * @name get_public_stripe_config
   * @summary Get Public Stripe Config
   * @request GET:/routes/public/stripe-config
   */
  get_public_stripe_config = (params: RequestParams = {}) =>
    this.request<GetPublicStripeConfigData, any>({
      path: `/routes/public/stripe-config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get invitation details without authentication for display on acceptance page.
   *
   * @tags dbtn/module:public
   * @name get_invitation_details
   * @summary Get Invitation Details
   * @request GET:/routes/public/invitation/{token}
   */
  get_invitation_details = ({ token, ...query }: GetInvitationDetailsParams, params: RequestParams = {}) =>
    this.request<GetInvitationDetailsData, GetInvitationDetailsError>({
      path: `/routes/public/invitation/${token}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Accept invitation and create new account if needed (no auth required).
   *
   * @tags dbtn/module:public
   * @name accept_invitation_public
   * @summary Accept Invitation Public
   * @request POST:/routes/public/accept-invitation
   */
  accept_invitation_public = (data: AppApisPublicAcceptInvitationPublicRequest, params: RequestParams = {}) =>
    this.request<AcceptInvitationPublicData, AcceptInvitationPublicError>({
      path: `/routes/public/accept-invitation`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create account link for Stripe Express onboarding (Public endpoint - no auth required). This endpoint automatically creates a Stripe Express account if the user doesn't have one, then generates an account link for hosted onboarding. Designed for popup windows.
   *
   * @tags dbtn/module:public
   * @name create_account_link_public
   * @summary Create Account Link Public
   * @request POST:/routes/public/create-account-link
   */
  create_account_link_public = (data: CreateAccountLinkRequest, params: RequestParams = {}) =>
    this.request<CreateAccountLinkPublicData, CreateAccountLinkPublicError>({
      path: `/routes/public/create-account-link`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Send reminder notifications to users whose trials are expiring soon. This should be called daily, a few days before trials expire.
   *
   * @tags dbtn/module:notifications, dbtn/hasAuth
   * @name send_trial_reminders
   * @summary Send Trial Reminders
   * @request POST:/routes/send-trial-reminders
   */
  send_trial_reminders = (data: NotificationRequest, params: RequestParams = {}) =>
    this.request<SendTrialRemindersData, SendTrialRemindersError>({
      path: `/routes/send-trial-reminders`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the next available invoice number for the user. Creates a sequence entry if it doesn't exist.
   *
   * @tags dbtn/module:invoice_numbering, dbtn/hasAuth
   * @name get_next_invoice_number
   * @summary Get Next Invoice Number
   * @request GET:/routes/next-invoice-number
   */
  get_next_invoice_number = (params: RequestParams = {}) =>
    this.request<GetNextInvoiceNumberData, any>({
      path: `/routes/next-invoice-number`,
      method: "GET",
      ...params,
    });

  /**
   * @description Reserve the next invoice number by incrementing the sequence. This should be called when an invoice is actually created.
   *
   * @tags dbtn/module:invoice_numbering, dbtn/hasAuth
   * @name reserve_invoice_number
   * @summary Reserve Invoice Number
   * @request POST:/routes/reserve-invoice-number
   */
  reserve_invoice_number = (params: RequestParams = {}) =>
    this.request<ReserveInvoiceNumberData, any>({
      path: `/routes/reserve-invoice-number`,
      method: "POST",
      ...params,
    });

  /**
   * @description Update the invoice number prefix for the user.
   *
   * @tags dbtn/module:invoice_numbering, dbtn/hasAuth
   * @name update_invoice_prefix
   * @summary Update Invoice Prefix
   * @request POST:/routes/update-prefix
   */
  update_invoice_prefix = (data: UpdatePrefixRequest, params: RequestParams = {}) =>
    this.request<UpdateInvoicePrefixData, UpdateInvoicePrefixError>({
      path: `/routes/update-prefix`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get comprehensive trial conversion statistics for admin dashboard. SECURITY: Results are scoped to the user's account to prevent cross-tenant data access.
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_trial_statistics
   * @summary Get Trial Statistics
   * @request GET:/routes/trial-stats
   */
  get_trial_statistics = (params: RequestParams = {}) =>
    this.request<GetTrialStatisticsData, any>({
      path: `/routes/trial-stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get instructions for setting up automated trial conversion. SECURITY: Requires authentication to access setup instructions.
   *
   * @tags dbtn/module:admin, dbtn/hasAuth
   * @name get_cron_setup_instructions
   * @summary Get Cron Setup Instructions
   * @request GET:/routes/cron-setup
   */
  get_cron_setup_instructions = (params: RequestParams = {}) =>
    this.request<GetCronSetupInstructionsData, any>({
      path: `/routes/cron-setup`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new invoice with Stripe payment link.
   *
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name create_invoice_endpoint
   * @summary Create Invoice Endpoint
   * @request POST:/routes/invoices/
   */
  create_invoice_endpoint = (data: CreateInvoiceRequest, params: RequestParams = {}) =>
    this.request<CreateInvoiceEndpointData, CreateInvoiceEndpointError>({
      path: `/routes/invoices/`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get list of invoices with pagination and optional filters.
   *
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name get_invoices_endpoint
   * @summary Get Invoices Endpoint
   * @request GET:/routes/invoices/
   */
  get_invoices_endpoint = (query: GetInvoicesEndpointParams, params: RequestParams = {}) =>
    this.request<GetInvoicesEndpointData, GetInvoicesEndpointError>({
      path: `/routes/invoices/`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific invoice by ID.
   *
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name get_invoice_endpoint
   * @summary Get Invoice Endpoint
   * @request GET:/routes/invoices/{invoice_id}
   */
  get_invoice_endpoint = ({ invoiceId, ...query }: GetInvoiceEndpointParams, params: RequestParams = {}) =>
    this.request<GetInvoiceEndpointData, GetInvoiceEndpointError>({
      path: `/routes/invoices/${invoiceId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update an existing invoice.
   *
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name update_invoice_endpoint
   * @summary Update Invoice Endpoint
   * @request PUT:/routes/invoices/{invoice_id}
   */
  update_invoice_endpoint = (
    { invoiceId, ...query }: UpdateInvoiceEndpointParams,
    data: UpdateInvoiceRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpdateInvoiceEndpointData, UpdateInvoiceEndpointError>({
      path: `/routes/invoices/${invoiceId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete an invoice.
   *
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name delete_invoice_endpoint
   * @summary Delete Invoice Endpoint
   * @request DELETE:/routes/invoices/{invoice_id}
   */
  delete_invoice_endpoint = ({ invoiceId, ...query }: DeleteInvoiceEndpointParams, params: RequestParams = {}) =>
    this.request<DeleteInvoiceEndpointData, DeleteInvoiceEndpointError>({
      path: `/routes/invoices/${invoiceId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Send invoice via email to customer.
   *
   * @tags dbtn/module:invoices, dbtn/hasAuth
   * @name send_invoice_endpoint
   * @summary Send Invoice Endpoint
   * @request POST:/routes/invoices/send
   */
  send_invoice_endpoint = (data: SendInvoiceRequest, params: RequestParams = {}) =>
    this.request<SendInvoiceEndpointData, SendInvoiceEndpointError>({
      path: `/routes/invoices/send`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get Stripe configuration for subscription management.
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name get_subscription_stripe_config
   * @summary Get Subscription Stripe Config
   * @request GET:/routes/config
   */
  get_subscription_stripe_config = (params: RequestParams = {}) =>
    this.request<GetSubscriptionStripeConfigData, any>({
      path: `/routes/config`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all available subscription plans.
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name get_subscription_plans
   * @summary Get Subscription Plans
   * @request GET:/routes/plans
   */
  get_subscription_plans = (params: RequestParams = {}) =>
    this.request<GetSubscriptionPlansData, any>({
      path: `/routes/plans`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get current user's subscription.
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name get_current_subscription
   * @summary Get Current Subscription
   * @request GET:/routes/current
   */
  get_current_subscription = (params: RequestParams = {}) =>
    this.request<GetCurrentSubscriptionData, any>({
      path: `/routes/current`,
      method: "GET",
      ...params,
    });

  /**
   * @description Start a free trial for a new user (now works for all users).
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name start_trial
   * @summary Start Trial
   * @request POST:/routes/start-trial
   */
  start_trial = (data: StartTrialRequest, params: RequestParams = {}) =>
    this.request<StartTrialData, StartTrialError>({
      path: `/routes/start-trial`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a Stripe checkout session for subscription upgrade.
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name create_checkout_session
   * @summary Create Checkout Session
   * @request POST:/routes/create-checkout-session
   */
  create_checkout_session = (data: CreateCheckoutSessionRequest, params: RequestParams = {}) =>
    this.request<CreateCheckoutSessionData, CreateCheckoutSessionError>({
      path: `/routes/create-checkout-session`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Upgrade user's subscription to a paid plan (for direct payment method upgrades).
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name upgrade_subscription
   * @summary Upgrade Subscription
   * @request POST:/routes/upgrade
   */
  upgrade_subscription = (data: UpgradeSubscriptionRequest, params: RequestParams = {}) =>
    this.request<UpgradeSubscriptionData, UpgradeSubscriptionError>({
      path: `/routes/upgrade`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Cancel user's subscription.
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name cancel_subscription
   * @summary Cancel Subscription
   * @request POST:/routes/cancel
   */
  cancel_subscription = (data: CancelSubscriptionRequest, params: RequestParams = {}) =>
    this.request<CancelSubscriptionData, CancelSubscriptionError>({
      path: `/routes/cancel`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get billing history from Stripe for the current user.
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name get_billing_history
   * @summary Get Billing History
   * @request GET:/routes/billing-history
   */
  get_billing_history = (query: GetBillingHistoryParams, params: RequestParams = {}) =>
    this.request<GetBillingHistoryData, GetBillingHistoryError>({
      path: `/routes/billing-history`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create Stripe Customer Portal session for payment method and billing management.
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name create_customer_portal
   * @summary Create Customer Portal
   * @request POST:/routes/customer-portal
   */
  create_customer_portal = (data: CustomerPortalRequest, params: RequestParams = {}) =>
    this.request<CreateCustomerPortalData, CreateCustomerPortalError>({
      path: `/routes/customer-portal`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get user's feature access based on their subscription with auto-trial enrollment.
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name get_feature_access
   * @summary Get Feature Access
   * @request GET:/routes/feature-access
   */
  get_feature_access = (params: RequestParams = {}) =>
    this.request<GetFeatureAccessData, any>({
      path: `/routes/feature-access`,
      method: "GET",
      ...params,
    });

  /**
   * @description Handle Stripe webhook events for subscription updates.
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name subscription_webhook_handler
   * @summary Subscription Webhook Handler
   * @request POST:/routes/stripe-webhook
   */
  subscription_webhook_handler = (params: RequestParams = {}) =>
    this.request<SubscriptionWebhookHandlerData, any>({
      path: `/routes/stripe-webhook`,
      method: "POST",
      ...params,
    });

  /**
   * @description Convert expired trials to Premium subscriptions.
   *
   * @tags dbtn/module:subscriptions, dbtn/hasAuth
   * @name convert_expired_trials
   * @summary Convert Expired Trials
   * @request POST:/routes/convert-expired-trials
   */
  convert_expired_trials = (params: RequestParams = {}) =>
    this.request<ConvertExpiredTrialsData, any>({
      path: `/routes/convert-expired-trials`,
      method: "POST",
      ...params,
    });

  /**
   * @description Handle Stripe webhook events for payment processing.
   *
   * @tags dbtn/module:webhooks
   * @name stripe_webhook_handler
   * @summary Stripe Webhook Handler
   * @request POST:/routes/webhooks/stripe
   */
  stripe_webhook_handler = (params: RequestParams = {}) =>
    this.request<StripeWebhookHandlerData, StripeWebhookHandlerError>({
      path: `/routes/webhooks/stripe`,
      method: "POST",
      ...params,
    });

  /**
   * @description Manually reconcile a payment to an invoice.
   *
   * @tags dbtn/module:webhooks
   * @name manual_payment_reconciliation
   * @summary Manual Payment Reconciliation
   * @request POST:/routes/webhooks/reconcile-payment
   */
  manual_payment_reconciliation = (data: PaymentReconciliationRequest, params: RequestParams = {}) =>
    this.request<ManualPaymentReconciliationData, ManualPaymentReconciliationError>({
      path: `/routes/webhooks/reconcile-payment`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Test endpoint to verify webhook API is working.
   *
   * @tags dbtn/module:webhooks
   * @name test_webhook
   * @summary Test Webhook
   * @request GET:/routes/webhooks/test
   */
  test_webhook = (params: RequestParams = {}) =>
    this.request<TestWebhookData, any>({
      path: `/routes/webhooks/test`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a comprehensive Stripe Connect account with full onboarding data.
   *
   * @tags Payout Accounts, dbtn/module:payout_accounts, dbtn/hasAuth
   * @name create_payout_account
   * @summary Create Payout Account
   * @request POST:/routes/payout_accounts/create
   */
  create_payout_account = (data: CreatePayoutAccountRequest, params: RequestParams = {}) =>
    this.request<CreatePayoutAccountData, CreatePayoutAccountError>({
      path: `/routes/payout_accounts/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a new Stripe Connect account for payouts.
   *
   * @tags Payout Accounts, dbtn/module:payout_accounts, dbtn/hasAuth
   * @name create_simple_payout_account
   * @summary Create Simple Payout Account
   * @request POST:/routes/payout_accounts/create-simple
   */
  create_simple_payout_account = (data: CreateSimplePayoutAccountRequest, params: RequestParams = {}) =>
    this.request<CreateSimplePayoutAccountData, CreateSimplePayoutAccountError>({
      path: `/routes/payout_accounts/create-simple`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the current user's payout account.
   *
   * @tags Payout Accounts, dbtn/module:payout_accounts, dbtn/hasAuth
   * @name get_current_payout_account
   * @summary Get Current Payout Account
   * @request GET:/routes/payout_accounts/payout-account
   */
  get_current_payout_account = (params: RequestParams = {}) =>
    this.request<GetCurrentPayoutAccountData, any>({
      path: `/routes/payout_accounts/payout-account`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new onboarding link for incomplete accounts.
   *
   * @tags Payout Accounts, dbtn/module:payout_accounts, dbtn/hasAuth
   * @name create_onboarding_link
   * @summary Create Onboarding Link
   * @request POST:/routes/payout_accounts/onboarding-link
   */
  create_onboarding_link = (params: RequestParams = {}) =>
    this.request<CreateOnboardingLinkData, any>({
      path: `/routes/payout_accounts/onboarding-link`,
      method: "POST",
      ...params,
    });

  /**
   * @description Refresh payout account status from Stripe.
   *
   * @tags Payout Accounts, dbtn/module:payout_accounts, dbtn/hasAuth
   * @name refresh_payout_account
   * @summary Refresh Payout Account
   * @request POST:/routes/payout_accounts/refresh
   */
  refresh_payout_account = (params: RequestParams = {}) =>
    this.request<RefreshPayoutAccountData, any>({
      path: `/routes/payout_accounts/refresh`,
      method: "POST",
      ...params,
    });
}

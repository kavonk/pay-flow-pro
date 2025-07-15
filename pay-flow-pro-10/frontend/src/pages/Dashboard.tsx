
import AppLayout from "components/AppLayout";
import brain from "brain";
import { FinancialStats, InvoiceSummary, SettlementSummary } from "types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Receipt,
  Clock,
  CheckCircle,
  Send,
  XCircle,
  FileText,
  TrendingUp,
  CreditCard,
  Wallet,
  Users,
  BarChart3,
  Crown,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useMemo, useState, useEffect } from "react";
import TrialBanner from "components/TrialBanner";
import TrialStatus from "components/TrialStatus";
import PayoutAccountStatusNotification from "components/PayoutAccountStatusNotification";
import { useFinancialStats, useSettlementSummary } from "utils/queryHooks";
import { useSubscription } from "utils/useSubscription";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import InvoiceDrillDownModal, { DrillDownFilter } from "components/InvoiceDrillDownModal";
import DeploymentHealth from "components/DeploymentHealth";
import FirstLoginOnboardingModal from "components/FirstLoginOnboardingModal";
import { useUserRole, usePayoutAccount } from "utils/queryHooks";



const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  onClick,
  clickable = false,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  onClick?: () => void;
  clickable?: boolean;
}) => (
  <Card 
    className={`transition-all duration-200 ${
      clickable 
        ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 active:scale-[0.98]' 
        : ''
    }`}
    onClick={clickable ? onClick : undefined}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${
        clickable ? 'text-muted-foreground group-hover:text-primary' : 'text-muted-foreground'
      }`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">
        {description}
        {clickable && (
          <span className="ml-2 text-primary font-medium">Click to view details →</span>
        )}
      </p>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  console.log("DashboardPage rendered");
  
  // Check admin status for deployment health
  const { data: userRole } = useUserRole();
  const isAdmin = userRole?.role === 'admin';
  
  // First-login onboarding modal state
  const { data: payoutAccount, isLoading: payoutAccountLoading } = usePayoutAccount();
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  
  // Show first-login modal for users without active payout accounts
  useEffect(() => {
    if (!payoutAccountLoading && (!payoutAccount || payoutAccount.account_status !== 'active')) {
      // Small delay to let the dashboard render first, then show modal
      const timer = setTimeout(() => {
        setShowFirstLoginModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [payoutAccount, payoutAccountLoading]);
  
  // State for drill-down modal
  const [drillDownModal, setDrillDownModal] = useState<{
    open: boolean;
    filter: DrillDownFilter | null;
  }>({ open: false, filter: null });
  
  const openDrillDown = (filter: DrillDownFilter) => {
    setDrillDownModal({ open: true, filter });
  };
  
  const closeDrillDown = () => {
    setDrillDownModal({ open: false, filter: null });
  };
  
  // Use React Query hooks for data fetching with caching
  const { data: stats, isLoading: statsLoading, error: statsError } = useFinancialStats();
  const { data: settlementSummary, isLoading: settlementLoading, error: settlementError } = useSettlementSummary();
  const { subscription, featureAccess, loading: subscriptionLoading } = useSubscription();
  
  const isLoading = statsLoading || settlementLoading || subscriptionLoading;
  const error = statsError; // Only consider stats errors since settlement 404s are expected

  const chartData = useMemo(() => {
    if (!stats?.invoice_summary) return [];
    const summary: InvoiceSummary = stats.invoice_summary;
    return [
      { name: "Paid", count: summary.paid, fill: "hsl(var(--chart-2))" },
      { name: "Sent", count: summary.sent, fill: "hsl(var(--chart-3))" },
      { name: "Overdue", count: summary.overdue, fill: "hsl(var(--chart-5))" },
      { name: "Draft", count: summary.draft, fill: "hsl(var(--muted-foreground))" },
    ];
  }, [stats]);

  // Loading skeleton component
  const DashboardSkeleton = () => (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Chart skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="pl-2">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD", // This could be made dynamic in a future iteration
    }).format(amount);

  // Show error state
  if (error) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <TrialStatus variant="badge" />
          </div>
          <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" />
                <span>Failed to load dashboard data. Please try refreshing the page.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Trial Status Banner */}
        <TrialBanner className="mb-6" />
        
        {/* Deployment Health for Admins */}
        {isAdmin && (
          <DeploymentHealth 
            className="mb-6" 
            showInDashboard={true}
          />
        )}
        
        {/* Payout Account Status for New Users */}
        <PayoutAccountStatusNotification showOnDashboard={true} className="mb-6" />
        
        {/* First-Login Express Onboarding Modal */}
        <FirstLoginOnboardingModal 
          open={showFirstLoginModal} 
          onOpenChange={setShowFirstLoginModal}
        />
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <TrialStatus variant="badge" />
        </div>
        <p className="text-muted-foreground">
          Click on any metric below to view detailed breakdowns and take quick actions.
        </p>
      </div>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <p>Loading dashboard...</p>
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-red-500">
            <p>Could not load dashboard data.</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}
        {!isLoading && !error && !stats && (
          <div className="p-8">No data available.</div>
        )}
        {stats && (
          <>
            {/* Usage Summary Card */}
            {subscription && featureAccess && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Usage Overview
                    <Badge variant="outline" className="ml-auto">
                      {subscription.plan?.name || 'Current Plan'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track your usage against your current plan limits
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Invoice Usage */}
                    {featureAccess.invoice_limit && featureAccess.invoice_limit !== -1 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Invoices This Month</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {featureAccess.current_invoice_count || 0} / {featureAccess.invoice_limit}
                          </span>
                        </div>
                        <Progress 
                          value={featureAccess.current_invoice_count ? 
                            (featureAccess.current_invoice_count / featureAccess.invoice_limit) * 100 : 0
                          } 
                          className="h-2"
                        />
                        {featureAccess.current_invoice_count && 
                         featureAccess.current_invoice_count / featureAccess.invoice_limit > 0.8 && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="h-3 w-3" />
                            Approaching limit - consider upgrading
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Seat Usage */}
                    {featureAccess.seat_limit && featureAccess.seat_limit !== -1 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Team Seats</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {featureAccess.current_seats || 0} / {featureAccess.seat_limit}
                          </span>
                        </div>
                        <Progress 
                          value={featureAccess.current_seats ? 
                            (featureAccess.current_seats / featureAccess.seat_limit) * 100 : 0
                          } 
                          className="h-2"
                        />
                        {featureAccess.current_seats && 
                         featureAccess.current_seats / featureAccess.seat_limit > 0.8 && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="h-3 w-3" />
                            Approaching limit - consider upgrading
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Transaction Fee Rate */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Transaction Fee</span>
                        </div>
                        <span className="text-sm font-medium">
                          {featureAccess.transaction_fee_percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Applied to all successful payments
                      </p>
                    </div>
                    
                    {/* Premium Features Indicator */}
                    {(featureAccess.can_use_custom_branding || 
                      featureAccess.can_use_recurring_billing ||
                      featureAccess.has_priority_support) && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">Premium Features</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {featureAccess.can_use_custom_branding && (
                            <Badge variant="secondary" className="text-xs">Custom Branding</Badge>
                          )}
                          {featureAccess.can_use_recurring_billing && (
                            <Badge variant="secondary" className="text-xs">Recurring Billing</Badge>
                          )}
                          {featureAccess.has_priority_support && (
                            <Badge variant="secondary" className="text-xs">Priority Support</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats.total_revenue)}
                description="Total amount from paid invoices"
                icon={DollarSign}
                clickable={true}
                onClick={() => openDrillDown({
                  type: 'revenue',
                  label: 'Total Revenue',
                  description: 'All paid invoices contributing to your revenue'
                })}
              />
              <StatCard
                title="Total Outstanding"
                value={formatCurrency(stats.total_outstanding)}
                description="Total amount from sent & overdue invoices"
                icon={Receipt}
                clickable={true}
                onClick={() => openDrillDown({
                  type: 'outstanding',
                  label: 'Outstanding Amount',
                  description: 'Invoices that are sent or overdue and awaiting payment'
                })}
              />
              <StatCard
                title="Paid Invoices"
                value={stats.invoice_summary.paid.toString()}
                description="Number of fully paid invoices"
                icon={CheckCircle}
                clickable={true}
                onClick={() => openDrillDown({
                  type: 'paid',
                  label: 'Paid Invoices',
                  description: 'All invoices that have been fully paid by customers'
                })}
              />
              <StatCard
                title="Overdue Invoices"
                value={stats.invoice_summary.overdue.toString()}
                description="Number of invoices past their due date"
                icon={Clock}
                clickable={true}
                onClick={() => openDrillDown({
                  type: 'overdue',
                  label: 'Overdue Invoices',
                  description: 'Invoices that are past their due date and need attention'
                })}
              />
            </div>
            
            {/* Drill-down modal */}
            {drillDownModal.filter && (
              <InvoiceDrillDownModal
                open={drillDownModal.open}
                onOpenChange={closeDrillDown}
                filter={drillDownModal.filter}
              />
            )}
            
            {/* Settlement Summary */}
            {settlementSummary && (
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                <StatCard
                  title="Gross Receipts"
                  value={formatCurrency(Number(settlementSummary.gross_amount))}
                  description="Total payments received"
                  icon={TrendingUp}
                />
                <StatCard
                  title="Total Fees"
                  value={formatCurrency(Number(settlementSummary.stripe_fees) + Number(settlementSummary.platform_fees))}
                  description="Processing and platform fees"
                  icon={CreditCard}
                />
                <StatCard
                  title="Net Payout"
                  value={formatCurrency(Number(settlementSummary.net_amount))}
                  description="Amount available for payout"
                  icon={DollarSign}
                />
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Invoice Status Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        type="category"
                        hide={false}
                        height={40}
                        orientation="bottom"
                        mirror={false}
                        allowDataOverflow={false}
                        allowDuplicatedCategory={true}
                        angle={0}
                        dx={0}
                        dy={0}
                        scale="auto"
                        reversed={false}
                        includeHidden={false}
                        padding={{ left: 0, right: 0 }}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                        type="number"
                        hide={false}
                        allowDecimals={false}
                        width={40}
                        orientation="left"
                        mirror={false}
                        allowDataOverflow={false}
                        scale="auto"
                        reversed={false}
                        includeHidden={false}
                        padding={{ top: 0, bottom: 0 }}
                        domain={[0, 'dataMax']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="col-span-4 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Status Breakdown</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Click any status to view invoices in that category.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div 
                    className="flex items-center cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                    onClick={() => openDrillDown({
                      type: 'paid',
                      label: 'Paid Invoices',
                      description: 'All invoices that have been fully paid by customers'
                    })}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Paid Invoices</span>
                    <span className="ml-auto font-semibold">
                      {stats.invoice_summary.paid}
                    </span>
                  </div>
                  <div 
                    className="flex items-center cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                    onClick={() => openDrillDown({
                      type: 'sent',
                      label: 'Sent Invoices',
                      description: 'Invoices that have been sent to customers and are awaiting payment'
                    })}
                  >
                    <Send className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Sent Invoices</span>
                    <span className="ml-auto font-semibold">
                      {stats.invoice_summary.sent}
                    </span>
                  </div>
                  <div 
                    className="flex items-center cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                    onClick={() => openDrillDown({
                      type: 'overdue',
                      label: 'Overdue Invoices',
                      description: 'Invoices that are past their due date and need attention'
                    })}
                  >
                    <Clock className="h-4 w-4 mr-2 text-orange-500" />
                    <span>Overdue Invoices</span>
                    <span className="ml-auto font-semibold">
                      {stats.invoice_summary.overdue}
                    </span>
                  </div>
                  <div 
                    className="flex items-center cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                    onClick={() => openDrillDown({
                      type: 'draft',
                      label: 'Draft Invoices',
                      description: 'Invoices that are saved as drafts and ready to be sent'
                    })}
                  >
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Draft Invoices</span>
                    <span className="ml-auto font-semibold">
                      {stats.invoice_summary.draft}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
      
      {/* Drill-down modal */}
      {drillDownModal.filter && (
        <InvoiceDrillDownModal
          open={drillDownModal.open}
          onOpenChange={closeDrillDown}
          filter={drillDownModal.filter}
        />
      )}
    </AppLayout>
  );
}

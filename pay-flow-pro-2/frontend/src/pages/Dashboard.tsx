import KPICard from "components/KPICard";
import { DollarSign, Users, CreditCard, AlertTriangle, Download, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import brain from "brain";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePickerWithRange } from "components/DatePickerWithRange";
import { Button } from "@/components/ui/button";
import React from "react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import RevenueChart from "components/RevenueChart";
import InvoiceStatusChart from "components/InvoiceStatusChart";

const KPICardSkeleton = () => (
  <div className="bg-gray-900/50 border-gray-800 rounded-lg p-4">
    <div className="flex items-center justify-between pb-2">
      <Skeleton className="h-4 w-2/4" />
      <Skeleton className="h-6 w-6" />
    </div>
    <div>
      <Skeleton className="h-8 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

const ChartSkeleton = () => (
    <div className="bg-gray-900/50 border-gray-800 rounded-lg p-4 h-[422px]">
      <div className="pb-2">
        <Skeleton className="h-4 w-2/4" />
      </div>
      <Skeleton className="h-full w-full" />
    </div>
  );

const Dashboard = () => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const {
    data: kpiData,
    isLoading: kpiLoading,
    isError: kpiError,
  } = useQuery({
    queryKey: ["kpiSummary", date],
    queryFn: () =>
      brain
        .get_kpi_summary({
          start_date: date?.from?.toISOString(),
          end_date: date?.to?.toISOString(),
        })
        .then((res) => res.data),
    enabled: !!date,
  });

  const {
    data: revenueData,
    isLoading: revenueLoading,
    isError: revenueError,
  } = useQuery({
    queryKey: ["revenueOverTime", date],
    queryFn: () =>
      brain
        .get_revenue_over_time({
          start_date: date?.from?.toISOString(),
          end_date: date?.to?.toISOString(),
        })
        .then((res) => res.data.data),
    enabled: !!date,
  });

  const {
    data: invoiceStatusData,
    isLoading: invoiceStatusLoading,
    isError: invoiceStatusError,
  } = useQuery({
    queryKey: ["invoiceStatusBreakdown", date],
    queryFn: () =>
      brain
        .get_invoice_status_breakdown({
          start_date: date?.from?.toISOString(),
          end_date: date?.to?.toISOString(),
        })
        .then((res) => res.data.data),
    enabled: !!date,
  });

  const formatCurrency = (amount?: number) => {
    if (typeof amount !== "number") return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Dashboard
          </h2>
          <p className="text-muted-foreground text-gray-400">
            Your real-time financial overview.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DatePickerWithRange date={date} setDate={setDate} />
          <Button variant="outline" size="sm" className="bg-gray-900/50 border-gray-800 hover:bg-gray-800 hover:text-white">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" className="bg-gray-900/50 border-gray-800 hover:bg-gray-800 hover:text-white">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiLoading ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : kpiError ? (
          <div className="col-span-4 text-red-500">
            Error loading dashboard data.
          </div>
        ) : (
          <>
            <KPICard
              title="Total Revenue"
              value={formatCurrency(kpiData?.total_revenue)}
              description="Sum of all paid invoices"
              icon={<DollarSign className="h-4 w-4" />}
              accentColor="#8B5CF6"
            />
            <KPICard
              title="Outstanding Balance"
              value={formatCurrency(kpiData?.outstanding_balance)}
              description="Sum of all unpaid invoices"
              icon={<AlertTriangle className="h-4 w-4" />}
              accentColor="#F59E0B"
            />
            <KPICard
              title="New Customers"
              value={kpiData?.new_customers ?? 0}
              description="New customers signed up"
              icon={<Users className="h-4 w-4" />}
              accentColor="#10B981"
            />
            <KPICard
              title="Avg. DSO"
              value={`${(kpiData?.average_dso ?? 0).toFixed(1)} days`}
              description="Days Sales Outstanding"
              icon={<CreditCard className="h-4 w-4" />}
              accentColor="#EF4444"
            />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {revenueLoading ? (
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
        ) : revenueError ? (
          <div className="lg:col-span-2 text-red-500">
            Error loading revenue data.
          </div>
        ) : (
          <RevenueChart data={revenueData ?? []} />
        )}
        {invoiceStatusLoading ? (
          <ChartSkeleton />
        ) : invoiceStatusError ? (
          <div className="text-red-500">
            Error loading invoice status data.
          </div>
        ) : (
          <InvoiceStatusChart data={invoiceStatusData ?? {}} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;

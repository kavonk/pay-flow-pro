import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { ChartSkeleton } from "components/ChartSkeleton";

interface TopCustomersChartProps {
  data: { name: string; total_revenue: number }[];
  isLoading: boolean;
}

export function TopCustomersChart({ data, isLoading }: TopCustomersChartProps) {
    if (isLoading) {
        return <ChartSkeleton />;
    }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Customers</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={80} tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
                cursor={{ fill: "hsl(var(--card))" }}
                contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                }}
            />
            <Bar dataKey="total_revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
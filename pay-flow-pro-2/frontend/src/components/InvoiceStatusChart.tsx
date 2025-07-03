"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InvoiceStatusData {
  [key: string]: number;
}

interface Props {
  data: InvoiceStatusData;
}

const COLORS = {
  paid: "#10B981",
  sent: "#3B82F6",
  overdue: "#F59E0B",
  draft: "#6B7280",
  cancelled: "#EF4444",
};

const InvoiceStatusChart: React.FC<Props> = ({ data }) => {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <Card className="bg-gray-900/50 border-gray-800 text-white shadow-lg backdrop-blur-sm col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>Invoice Status Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              innerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderColor: "#6B7280",
              }}
            />
            <Legend wrapperStyle={{ color: '#FFFFFF' }}/>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default InvoiceStatusChart;
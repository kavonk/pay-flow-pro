import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface Props {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  accentColor?: string;
  className?: string;
}

const KPICard: React.FC<Props> = ({
  title,
  value,
  description,
  icon,
  accentColor,
  className,
}) => {
  return (
    <Card
      className={cn(
        "bg-gray-900/50 border-gray-800 text-white shadow-lg backdrop-blur-sm",
        className
      )}
      style={{ borderLeft: `5px solid ${accentColor}` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">
          {title}
        </CardTitle>
        <div className="text-gray-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
};

export default KPICard;
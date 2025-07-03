import { Skeleton } from "@/components/ui/skeleton";
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

export const KPICardSkeleton = () => (
    <Card className="bg-gray-900/50 border-gray-800 text-white shadow-lg backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-2/4" />
        <div className="text-gray-400">
            <Skeleton className="h-6 w-6" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
);

export default KPICard;
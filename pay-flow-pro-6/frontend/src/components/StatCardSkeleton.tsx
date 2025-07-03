import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardSkeletonProps {
  className?: string;
}

export interface Props extends StatCardSkeletonProps {}

const StatCardSkeleton: React.FC<Props> = ({ className = "" }) => {
  return (
    <Card className={`bg-zinc-900 border-zinc-800 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <Skeleton className="h-4 w-24" />
        </CardTitle>
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCardSkeleton;
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface CardSkeletonProps {
  showHeader?: boolean;
  lines?: number;
  className?: string;
}

export interface Props extends CardSkeletonProps {}

const CardSkeleton: React.FC<Props> = ({ 
  showHeader = true, 
  lines = 3,
  className = ""
}) => {
  return (
    <Card className={`bg-zinc-900 border-zinc-800 ${className}`}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
};

export default CardSkeleton;
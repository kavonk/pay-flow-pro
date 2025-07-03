import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export interface Props extends TableSkeletonProps {}

const TableSkeleton: React.FC<Props> = ({ 
  rows = 5, 
  columns = 6, 
  showHeader = true 
}) => {
  return (
    <Table>
      {showHeader && (
        <TableHeader>
          <TableRow className="border-zinc-800">
            {Array.from({ length: columns }).map((_, index) => (
              <TableHead key={index} className="text-zinc-400">
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} className="border-zinc-800">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TableSkeleton;
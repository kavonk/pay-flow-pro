import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  header: string;
  width?: number;
  render?: (value: any, item: any) => React.ReactNode;
}

interface VirtualizedTableProps {
  data: any[];
  columns: Column[];
  height?: number;
  itemHeight?: number;
  className?: string;
  onRowClick?: (item: any, index: number) => void;
}

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  columns,
  height = 400,
  itemHeight = 60,
  className,
  onRowClick,
}) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = data[index];
    
    return (
      <div
        style={style}
        className={cn(
          "flex border-b border-border hover:bg-muted/50 cursor-pointer",
          index % 2 === 0 ? "bg-background" : "bg-muted/20"
        )}
        onClick={() => onRowClick?.(item, index)}
      >
        {columns.map((column) => {
          const value = item[column.key];
          const content = column.render ? column.render(value, item) : value;
          
          return (
            <div
              key={column.key}
              className="flex items-center px-4 py-3 text-sm flex-1"
              style={{ minWidth: column.width || 150, maxWidth: column.width || 'auto' }}
            >
              {content}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("border rounded-md", className)}>
      {/* Table Header */}
      <div className="flex bg-muted/50 border-b border-border">
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-4 py-3 text-sm font-medium text-muted-foreground flex-1"
            style={{ minWidth: column.width || 150, maxWidth: column.width || 'auto' }}
          >
            {column.header}
          </div>
        ))}
      </div>
      
      {/* Virtualized Body */}
      {data.length > 0 ? (
        <List
          height={height}
          itemCount={data.length}
          itemSize={itemHeight}
          itemData={data}
        >
          {Row}
        </List>
      ) : (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
};

export default VirtualizedTable;
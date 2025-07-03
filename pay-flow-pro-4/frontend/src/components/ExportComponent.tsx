import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Database, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';

export interface ExportConfig {
  type: 'customers' | 'invoices' | 'payments' | 'audit';
  format: 'csv' | 'json' | 'excel';
  filters?: Record<string, any>;
}

export interface ExportComponentProps {
  type: 'customers' | 'invoices' | 'payments' | 'audit';
  title?: string;
  description?: string;
  className?: string;
  variant?: 'button' | 'card';
  size?: 'sm' | 'md' | 'lg';
  filters?: Record<string, any>;
}

interface ExportProgress {
  isExporting: boolean;
  progress: number;
  filename?: string;
  recordCount?: number;
}

export const ExportComponent: React.FC<ExportComponentProps> = ({
  type,
  title,
  description,
  className = '',
  variant = 'button',
  size = 'md',
  filters = {}
}) => {
  const [format, setFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0
  });

  const exportTypeConfig = {
    customers: {
      title: 'Export Customers',
      description: 'Download customer data with invoice summaries',
      icon: Database,
      endpoint: 'export_customers'
    },
    invoices: {
      title: 'Export Invoices', 
      description: 'Download invoice data with customer information',
      icon: FileText,
      endpoint: 'export_invoices'
    },
    payments: {
      title: 'Export Payments',
      description: 'Download payment transaction data',
      icon: Download,
      endpoint: 'export_payments'
    },
    audit: {
      title: 'Export Audit Logs',
      description: 'Download compliance audit trail',
      icon: Calendar,
      endpoint: 'export_audit_logs'
    }
  };

  const config = exportTypeConfig[type];
  const Icon = config.icon;

  const downloadFile = (content: string, filename: string, format: string) => {
    const mimeTypes = {
      csv: 'text/csv',
      json: 'application/json',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    const blob = new Blob([content], { type: mimeTypes[format as keyof typeof mimeTypes] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setExportProgress({ isExporting: true, progress: 10 });
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 20, 80)
        }));
      }, 500);

      let response;
      const exportParams = { format, ...filters };

      // Call the appropriate export endpoint
      switch (type) {
        case 'customers':
          response = await brain.export_customers(exportParams);
          break;
        case 'invoices':
          response = await brain.export_invoices(exportParams);
          break;
        case 'payments':
          response = await brain.export_payments(exportParams);
          break;
        case 'audit':
          response = await brain.export_audit_logs(exportParams);
          break;
        default:
          throw new Error(`Unknown export type: ${type}`);
      }

      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const result = await response.json();
      
      setExportProgress({
        isExporting: false,
        progress: 100,
        filename: result.filename,
        recordCount: result.count
      });

      // Download the file
      downloadFile(result.content, result.filename, result.format);
      
      toast.success(`Export completed! Downloaded ${result.count} records`, {
        description: `File: ${result.filename}`
      });

      // Reset progress after a delay
      setTimeout(() => {
        setExportProgress({ isExporting: false, progress: 0 });
      }, 3000);

    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress({ isExporting: false, progress: 0 });
      toast.error('Export failed', {
        description: 'Please try again or contact support if the issue persists.'
      });
    }
  };

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title || config.title}
          </CardTitle>
          <CardDescription>
            {description || config.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={format} onValueChange={(value: 'csv' | 'json' | 'excel') => setFormat(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleExport} 
              disabled={exportProgress.isExporting}
              className="flex-1"
            >
              {exportProgress.isExporting ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
          
          {exportProgress.isExporting && (
            <div className="space-y-2">
              <Progress value={exportProgress.progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Preparing export... {exportProgress.progress}%
              </p>
            </div>
          )}
          
          {exportProgress.filename && exportProgress.recordCount !== undefined && (
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {exportProgress.filename}
                </span>
              </div>
              <Badge variant="secondary">
                {exportProgress.recordCount} records
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Button variant
  const buttonSizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 py-2',
    lg: 'h-10 px-8'
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Select value={format} onValueChange={(value: 'csv' | 'json' | 'excel') => setFormat(value)}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="json">JSON</SelectItem>
          <SelectItem value="excel">Excel</SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        onClick={handleExport} 
        disabled={exportProgress.isExporting}
        size={size as any}
        className={buttonSizes[size]}
      >
        {exportProgress.isExporting ? (
          <>
            <Download className="mr-2 h-4 w-4 animate-spin" />
            {size === 'sm' ? 'Exporting...' : 'Exporting...'}
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            {size === 'sm' ? 'Export' : `Export ${format.toUpperCase()}`}
          </>
        )}
      </Button>
      
      {exportProgress.isExporting && (
        <div className="flex items-center gap-2">
          <Progress value={exportProgress.progress} className="w-24" />
          <span className="text-xs text-muted-foreground">
            {exportProgress.progress}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ExportComponent;
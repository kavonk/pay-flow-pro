import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Activity, Clock } from 'lucide-react';
import { cn } from 'utils/cn';
import brain from 'brain';
import { DeploymentLogsResponse, DeploymentLogEntry } from 'types';

interface DeploymentHealthProps {
  className?: string;
  showInDashboard?: boolean;
}

const DeploymentHealth: React.FC<DeploymentHealthProps> = ({ 
  className = '', 
  showInDashboard = false 
}) => {
  const [logs, setLogs] = useState<DeploymentLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeploymentLogs = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await brain.get_deployment_logs({ limit: showInDashboard ? 10 : 50 });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        throw new Error(`Failed to fetch deployment logs: ${response.status}`);
      }
    } catch (err: any) {
      console.error('Error fetching deployment logs:', err);
      setError(err.message || 'Failed to fetch deployment logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeploymentLogs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Activity className="h-4 w-4 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
      case 'FATAL':
        return 'text-red-600 dark:text-red-400';
      case 'WARN':
        return 'text-orange-600 dark:text-orange-400';
      case 'INFO':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const isDeploymentFailed = logs?.latest_deployment_status === 'failed';
  const displayLogs = showInDashboard ? logs?.logs.slice(0, 2) : logs?.logs;

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Deployment Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading deployment status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full border-red-200 dark:border-red-800', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="h-5 w-5" />
            Deployment Health - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => fetchDeploymentLogs()}
            className="mt-4"
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'w-full',
      isDeploymentFailed && 'border-red-200 dark:border-red-800',
      className
    )}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Deployment Health
            {logs && (
              <Badge 
                className={cn(
                  'ml-2',
                  getStatusColor(logs.latest_deployment_status)
                )}
                variant="outline"
              >
                <span className="flex items-center gap-1">
                  {getStatusIcon(logs.latest_deployment_status)}
                  {logs.latest_deployment_status.replace('_', ' ')}
                </span>
              </Badge>
            )}
          </div>
          <Button
            onClick={() => fetchDeploymentLogs(true)}
            disabled={refreshing}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardTitle>
        {logs && (
          <p className="text-sm text-muted-foreground">
            {logs.total_count} total logs recorded
            {logs.last_successful_deployment && (
              <span className="ml-2">
                • Last success: {formatTimestamp(logs.last_successful_deployment)}
              </span>
            )}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {/* Persistent failure banner */}
        {isDeploymentFailed && (
          <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              <strong>Deployment Failed</strong> - The latest deployment attempt has failed. 
              Check the logs below for details and consider investigating the root cause.
            </AlertDescription>
          </Alert>
        )}

        {/* Recent logs */}
        {displayLogs && displayLogs.length > 0 ? (
          <div className="space-y-3">
            {displayLogs.map((log: DeploymentLogEntry) => (
              <div 
                key={log.id} 
                className={cn(
                  'p-3 rounded-lg border',
                  log.level === 'ERROR' || log.level === 'FATAL' 
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', getLogLevelColor(log.level))}
                    >
                      {log.level}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">
                      {log.step.replace('_', ' ')}
                    </span>
                    {log.deployment_id && (
                      <Badge variant="secondary" className="text-xs">
                        {log.deployment_id.slice(0, 8)}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {log.message}
                </p>
                {log.commit_sha && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Commit: <code className="bg-muted px-1 py-0.5 rounded">{log.commit_sha.slice(0, 8)}</code>
                    {log.branch_name && (
                      <span className="ml-2">
                        Branch: <code className="bg-muted px-1 py-0.5 rounded">{log.branch_name}</code>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {showInDashboard && logs.logs.length > 2 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/deployment-logs" className="text-primary hover:underline">
                    View all {logs.total_count} deployment logs →
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No deployment logs available</p>
            <p className="text-sm mt-1">Logs will appear here after the first deployment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeploymentHealth;
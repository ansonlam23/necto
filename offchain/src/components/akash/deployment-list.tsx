'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Server, 
  Clock, 
  MapPin, 
  DollarSign,
  MoreVertical,
  RefreshCw,
  Terminal,
  X,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Deployment types
export interface DeploymentItem {
  id: string;
  dseq: string;
  status: 'pending' | 'active' | 'closed' | 'error';
  createdAt: string;
  expiresAt?: string;
  leases: number;
  serviceName: string;
  provider?: string;
  costPerHour?: number;
  region?: string;
}

interface DeploymentListProps {
  deployments: DeploymentItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onViewLogs?: (deploymentId: string) => void;
  onCloseDeployment?: (deploymentId: string) => void;
  filter?: 'all' | 'active' | 'closed';
  className?: string;
}

interface DeploymentItemProps {
  deployment: DeploymentItem;
  onViewLogs?: (deploymentId: string) => void;
  onCloseDeployment?: (deploymentId: string) => void;
}

const STATUS_CONFIG: Record<string, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ReactNode;
}> = {
  pending: { 
    label: 'Pending', 
    variant: 'secondary',
    icon: <Loader2 className="h-3 w-3 animate-spin" />
  },
  active: { 
    label: 'Active', 
    variant: 'default',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  closed: { 
    label: 'Closed', 
    variant: 'outline',
    icon: <X className="h-3 w-3" />
  },
  error: { 
    label: 'Error', 
    variant: 'destructive',
    icon: <AlertCircle className="h-3 w-3" />
  }
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

function formatDuration(createdAt: string, expiresAt?: string): string {
  const start = new Date(createdAt);
  const end = expiresAt ? new Date(expiresAt) : new Date();
  const diff = end.getTime() - start.getTime();
  
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function DeploymentList({
  deployments,
  isLoading = false,
  onRefresh,
  onViewLogs,
  onCloseDeployment,
  filter = 'all',
  className
}: DeploymentListProps) {
  const [currentFilter, setCurrentFilter] = useState(filter);

  const filteredDeployments = React.useMemo(() => {
    if (currentFilter === 'all') return deployments;
    return deployments.filter(d => d.status === currentFilter);
  }, [deployments, currentFilter]);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Deployments</h3>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No deployments yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first deployment to get started
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Deployments</h3>
          <p className="text-sm text-muted-foreground">
            {filteredDeployments.length} deployment{filteredDeployments.length !== 1 ? 's' : ''}
            {currentFilter !== 'all' && ` (${currentFilter})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Filter
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCurrentFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentFilter('active')}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentFilter('closed')}>
                Closed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredDeployments.map((deployment) => (
          <DeploymentItemCard
            key={deployment.id}
            deployment={deployment}
            onViewLogs={onViewLogs}
            onCloseDeployment={onCloseDeployment}
          />
        ))}
      </div>
    </div>
  );
}

function DeploymentItemCard({ 
  deployment, 
  onViewLogs, 
  onCloseDeployment 
}: DeploymentItemProps) {
  const status = STATUS_CONFIG[deployment.status] || STATUS_CONFIG.pending;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Server className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-medium">
                {deployment.serviceName}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {deployment.id.slice(0, 16)}... • {deployment.dseq}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} className="gap-1">
              {status.icon}
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewLogs && (
                  <DropdownMenuItem onClick={() => onViewLogs(deployment.id)}>
                    <Terminal className="mr-2 h-4 w-4" />
                    View Logs
                  </DropdownMenuItem>
                )}
                {onCloseDeployment && deployment.status === 'active' && (
                  <DropdownMenuItem 
                    onClick={() => onCloseDeployment(deployment.id)}
                    className="text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Close Deployment
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(deployment.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Runtime: {formatDuration(deployment.createdAt, deployment.expiresAt)}</span>
          </div>

          {deployment.leases > 0 && (
            <div className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" />
              <span>{deployment.leases} lease{deployment.leases !== 1 ? 's' : ''}</span>
            </div>
          )}

          {deployment.region && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{deployment.region}</span>
            </div>
          )}

          {deployment.costPerHour && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              <span>${deployment.costPerHour.toFixed(2)}/hr</span>
            </div>
          )}

          {deployment.provider && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs">Provider: {deployment.provider}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { DeploymentItemCard };
export type { DeploymentItem };

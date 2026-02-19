'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { DeploymentState, useAkashDeployment } from '@/hooks/use-akash-deployment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Server,
  FileCode,
  Search,
  Upload,
  Activity,
  AlertCircle,
  CreditCard
} from 'lucide-react';

interface DeploymentStatusProps {
  deployment: ReturnType<typeof useAkashDeployment>;
  className?: string;
}

const STATE_ICONS: Record<DeploymentState, React.ReactNode> = {
  idle: <Clock className="h-5 w-5" />,
  checking_suitability: <Search className="h-5 w-5" />,
  generating_sdl: <FileCode className="h-5 w-5" />,
  selecting_provider: <Search className="h-5 w-5" />,
  paying_escrow: <CreditCard className="h-5 w-5" />,
  creating_deployment: <Upload className="h-5 w-5" />,
  waiting_bids: <Clock className="h-5 w-5" />,
  accepting_bid: <CheckCircle2 className="h-5 w-5" />,
  active: <Activity className="h-5 w-5" />,
  closing: <XCircle className="h-5 w-5" />,
  completed: <CheckCircle2 className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />
};

const STATE_LABELS: Record<DeploymentState, string> = {
  idle: 'Ready',
  checking_suitability: 'Checking Suitability',
  generating_sdl: 'Generating SDL',
  selecting_provider: 'Selecting Provider',
  paying_escrow: 'Processing Payment',
  creating_deployment: 'Creating Deployment',
  waiting_bids: 'Waiting for Bids',
  accepting_bid: 'Accepting Bid',
  active: 'Active',
  closing: 'Closing',
  completed: 'Completed',
  error: 'Error'
};

const STATE_COLORS: Record<DeploymentState, string> = {
  idle: 'text-muted-foreground',
  checking_suitability: 'text-blue-500',
  generating_sdl: 'text-purple-500',
  selecting_provider: 'text-indigo-500',
  paying_escrow: 'text-amber-500',
  creating_deployment: 'text-orange-500',
  waiting_bids: 'text-yellow-500',
  accepting_bid: 'text-green-500',
  active: 'text-green-500',
  closing: 'text-orange-500',
  completed: 'text-green-500',
  error: 'text-red-500'
};

export function DeploymentStatus({ deployment, className }: DeploymentStatusProps) {
  const { state, progress, logs, error, deployment: deployData, isLoading } = deployment;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Deployment Status
          </CardTitle>
          <Badge 
            variant={state === 'error' ? 'destructive' : state === 'active' ? 'default' : 'secondary'}
          >
            {STATE_LABELS[state]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={cn("flex items-center gap-2", STATE_COLORS[state])}>
              {STATE_ICONS[state]}
              {STATE_LABELS[state]}
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Deployment Info */}
        {deployData && (
          <div className="p-3 rounded-lg bg-muted space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono">{deployData.id.slice(0, 16)}...</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline">{deployData.status}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(deployData.createdAt).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              Error
            </div>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Activity Log</h4>
            <ScrollArea className="h-48 rounded-lg border bg-muted p-3">
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs font-mono">
                    <span className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={cn(
                      "ml-2",
                      log.level === 'error' && "text-red-500",
                      log.level === 'warn' && "text-yellow-500",
                      log.level === 'info' && "text-foreground"
                    )}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Actions */}
        {(state === 'active' || state === 'waiting_bids') && (
          <Button 
            variant="outline" 
            onClick={() => deployment.close()}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Close Deployment
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface DeploymentTimelineProps {
  logs: { timestamp: number; message: string; level: string }[];
  className?: string;
}

export function DeploymentTimeline({ logs, className }: DeploymentTimelineProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {logs.map((log, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className={cn(
            "mt-1.5 h-2 w-2 rounded-full",
            log.level === 'error' ? 'bg-red-500' :
            log.level === 'warn' ? 'bg-yellow-500' :
            'bg-green-500'
          )} />
          <div className="flex-1">
            <p className="text-sm">{log.message}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(log.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

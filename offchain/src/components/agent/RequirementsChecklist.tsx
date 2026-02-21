'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle, Cpu, HardDrive, MemoryStick, Package, Globe, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeploymentConfig } from '@/types/deployment';

interface RequirementsChecklistProps {
  config: DeploymentConfig;
  className?: string;
}

export function RequirementsChecklist({ config, className }: RequirementsChecklistProps) {
  const requirements = [
    {
      key: 'dockerImage',
      label: 'Docker Image',
      value: config.dockerImage,
      icon: Package,
      required: true,
    },
    {
      key: 'cpu',
      label: 'CPU',
      value: config.cpu ? `${config.cpu} vCPU` : null,
      icon: Cpu,
      required: true,
    },
    {
      key: 'memory',
      label: 'Memory',
      value: config.memory && config.memoryUnit
        ? `${config.memory} ${config.memoryUnit}`
        : null,
      icon: MemoryStick,
      required: true,
    },
    {
      key: 'storage',
      label: 'Storage',
      value: config.storage && config.storageUnit
        ? `${config.storage} ${config.storageUnit}`
        : null,
      icon: HardDrive,
      required: true,
    },
    {
      key: 'gpu',
      label: 'GPU',
      value: config.gpu ? `${config.gpu}${config.gpuCount ? ` x${config.gpuCount}` : ''}` : null,
      icon: Cpu,
      required: false,
    },
    {
      key: 'port',
      label: 'Port',
      value: config.port ? `${config.port}` : null,
      icon: Hash,
      required: false,
    },
    {
      key: 'region',
      label: 'Region',
      value: config.region,
      icon: Globe,
      required: false,
    },
  ];

  const filledRequired = requirements.filter(r => r.required && r.value).length;
  const totalRequired = requirements.filter(r => r.required).length;
  const progress = (filledRequired / totalRequired) * 100;

  return (
    <Card className={cn("bg-card/50 backdrop-blur border-border/50", className)}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Deployment Requirements</h3>
          <span className="text-xs text-muted-foreground">
            {filledRequired}/{totalRequired} required
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-3">
          {requirements.map((req) => {
            const Icon = req.icon;
            const isFilled = !!req.value;

            return (
              <div
                key={req.key}
                className={cn(
                  "flex items-center gap-3 transition-all duration-300",
                  isFilled && "translate-x-0.5"
                )}
              >
                {/* Status indicator */}
                <div className="relative">
                  {isFilled ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 animate-in zoom-in-50 duration-200" />
                  ) : (
                    <Circle className={cn(
                      "h-4 w-4",
                      req.required ? "text-muted-foreground/50" : "text-muted-foreground/30"
                    )} />
                  )}
                </div>

                {/* Icon */}
                <Icon className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  isFilled ? "text-foreground" : "text-muted-foreground/50"
                )} />

                {/* Label and value */}
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className={cn(
                    "text-xs transition-colors",
                    isFilled ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {req.label}
                  </span>

                  <span className={cn(
                    "text-xs font-mono truncate max-w-[140px] transition-all duration-300",
                    isFilled
                      ? "text-green-500 opacity-100"
                      : "text-muted-foreground/50 opacity-60"
                  )}>
                    {req.value || (req.required ? 'Pending' : 'Not set')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ready indicator */}
        {progress === 100 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-500 font-medium">
                Ready to find providers
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
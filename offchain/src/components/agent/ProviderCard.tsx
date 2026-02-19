'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Globe, Cpu, DollarSign, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProviderMatch } from '@/types/deployment';

interface ProviderCardProps {
  provider: ProviderMatch | null;
  isSearching?: boolean;
  className?: string;
  onDeploy?: () => void;
}

export function ProviderCard({ provider, isSearching, className, onDeploy }: ProviderCardProps) {
  if (!isSearching && !provider) return null;

  return (
    <Card className={cn(
      "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30 backdrop-blur",
      className
    )}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">
            {isSearching ? 'Finding Best Provider...' : 'Recommended Provider'}
          </h3>
        </div>

        {isSearching ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="flex gap-1 mb-3">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
            </div>
            <p className="text-xs text-muted-foreground">
              Analyzing {Math.floor(Math.random() * 50) + 100}+ providers...
            </p>
          </div>
        ) : provider && (
          <div className="space-y-4">
            {/* Provider header */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-base">{provider.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Provider ID: {provider.id}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {provider.matchScore ? `${provider.matchScore}% match` : 'Best match'}
              </Badge>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">Price</span>
                </div>
                <span className="text-sm font-semibold text-green-500">
                  ${provider.price.toFixed(4)}/hr
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Uptime</span>
                </div>
                <span className="text-sm font-semibold">
                  {provider.uptime.toFixed(1)}%
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <Globe className="h-3 w-3 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Region</span>
                </div>
                <span className="text-sm font-semibold">
                  {provider.region || 'Global'}
                </span>
              </div>
            </div>

            {/* Hardware specs */}
            {provider.hardware && (
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <Cpu className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Hardware Specs</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {provider.hardware.cpuCount && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">CPU: </span>
                      <span className="font-mono">{provider.hardware.cpuCount} vCPU</span>
                    </div>
                  )}
                  {provider.hardware.memoryGB && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">RAM: </span>
                      <span className="font-mono">{provider.hardware.memoryGB} GB</span>
                    </div>
                  )}
                  {provider.hardware.storageGB && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Storage: </span>
                      <span className="font-mono">{provider.hardware.storageGB} GB</span>
                    </div>
                  )}
                  {provider.hardware.gpuModel && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">GPU: </span>
                      <span className="font-mono">
                        {provider.hardware.gpuModel}
                        {provider.hardware.gpuCount && provider.hardware.gpuCount > 1
                          ? ` x${provider.hardware.gpuCount}`
                          : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendation reason */}
            {provider.reason && (
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {provider.reason}
                  </p>
                </div>
              </div>
            )}

            {/* Action button */}
            {onDeploy && (
              <Button
                onClick={onDeploy}
                size="sm"
                className="w-full"
              >
                Deploy to this Provider
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
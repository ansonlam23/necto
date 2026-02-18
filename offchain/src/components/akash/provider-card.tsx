'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Provider, ProviderScore } from '@/lib/agent/provider-selection';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Globe, 
  Zap,
  DollarSign,
  Activity,
  CheckCircle2,
  Star
} from 'lucide-react';

interface ProviderCardProps {
  provider: Provider;
  score?: ProviderScore;
  isSelected?: boolean;
  onSelect?: () => void;
  onViewDetails?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function ProviderCard({
  provider,
  score,
  isSelected,
  onSelect,
  onViewDetails,
  showDetails = true,
  className
}: ProviderCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        isSelected && "border-primary ring-2 ring-primary/20",
        className
      )}
    >
      <CardHeader 
        className="pb-2 cursor-pointer hover:bg-muted/50"
        onClick={onViewDetails}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">{provider.name}</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                {provider.region}
              </div>
            </div>
          </div>
          {score && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{(score.totalScore * 100).toFixed(0)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="font-medium">${provider.pricePerHour.toFixed(2)}/hr</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-blue-500" />
            <span>{(provider.availability * 100).toFixed(0)}% avail</span>
          </div>
        </div>

        {/* GPU Types */}
        <div className="flex flex-wrap gap-1">
          {provider.gpuTypes.map(gpu => (
            <Badge key={gpu} variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              {gpu}
            </Badge>
          ))}
        </div>

        {/* Specs */}
        {showDetails && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <Cpu className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <span className="text-xs font-medium">{provider.specs.vcpus} vCPU</span>
            </div>
            <div className="text-center">
              <Server className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <span className="text-xs font-medium">{provider.specs.memory}GB RAM</span>
            </div>
            <div className="text-center">
              <HardDrive className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <span className="text-xs font-medium">{provider.specs.storage}GB</span>
            </div>
          </div>
        )}

        {/* Score breakdown */}
        {score && showDetails && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span>Price</span>
              <Progress value={score.priceScore * 100} className="w-24 h-1" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Reliability</span>
              <Progress value={score.reliabilityScore * 100} className="w-24 h-1" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Performance</span>
              <Progress value={score.performanceScore * 100} className="w-24 h-1" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Latency</span>
              <Progress value={score.latencyScore * 100} className="w-24 h-1" />
            </div>
          </div>
        )}

        {/* Selection indicator - separate click area */}
        <div 
          className="flex items-center justify-center gap-2 pt-2 text-sm border-t cursor-pointer hover:bg-muted/50 py-2 -mx-6 px-6"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Selected</span>
            </>
          ) : (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
              <span className="text-muted-foreground">Click to select</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CompactProviderCardProps {
  provider: Provider;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function CompactProviderCard({
  provider,
  isSelected,
  onSelect,
  className
}: CompactProviderCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
        isSelected && "border-primary bg-primary/5",
        className
      )}
      onClick={onSelect}
    >
      <div className="p-2 rounded-md bg-muted">
        <Server className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{provider.name}</p>
        <p className="text-xs text-muted-foreground">
          {provider.region} • ${provider.pricePerHour.toFixed(2)}/hr
        </p>
      </div>
      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
    </div>
  );
}

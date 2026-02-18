'use client';

import * as React from 'react';
import { Provider } from '@/lib/agent/provider-selection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Server,
  Cpu,
  HardDrive,
  Zap,
  DollarSign,
  Activity,
  Clock,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface ProviderDetailDialogProps {
  provider: Provider | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (providerId: string) => void;
  isSelected?: boolean;
}

export function ProviderDetailDialog({
  provider,
  open,
  onOpenChange,
  onSelect,
  isSelected
}: ProviderDetailDialogProps) {
  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                {provider.name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {provider.region}
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    {provider.uptime}% uptime
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {provider.latency}ms latency
                  </span>
                </div>
              </DialogDescription>
            </div>
            {isSelected && (
              <Badge className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Selected
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Pricing */}
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                <p className="text-2xl font-bold">${provider.pricePerHour.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Availability</p>
                <p className="text-2xl font-bold">{(provider.availability * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {/* Hardware Specs */}
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Hardware Specifications
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <Cpu className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-lg font-semibold">{provider.specs.vcpus}</p>
                <p className="text-xs text-muted-foreground">vCPUs</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <Server className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-lg font-semibold">{provider.specs.memory}GB</p>
                <p className="text-xs text-muted-foreground">RAM</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <HardDrive className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-lg font-semibold">{provider.specs.storage}GB</p>
                <p className="text-xs text-muted-foreground">Storage</p>
              </div>
            </div>
          </div>

          {/* GPU Types */}
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Available GPUs
            </h4>
            <div className="flex flex-wrap gap-2">
              {provider.gpuTypes.map(gpu => (
                <Badge key={gpu} variant="secondary" className="text-sm py-1 px-3">
                  <Zap className="h-3 w-3 mr-1" />
                  {gpu}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1"
              onClick={() => {
                onSelect?.(provider.id);
                onOpenChange(false);
              }}
              disabled={isSelected}
            >
              {isSelected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Selected
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Select Provider
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

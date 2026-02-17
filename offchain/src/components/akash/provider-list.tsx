'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useProviderDiscovery } from '@/hooks/use-provider-discovery';
import { ProviderCard } from './provider-card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProviderListProps {
  className?: string;
  onSelect?: (providerId: string) => void;
  selectedId?: string;
}

const REGIONS = ['us-east', 'us-west', 'us-central', 'eu-west', 'eu-central', 'ap-south'];
const GPU_TYPES = ['NVIDIA A100', 'NVIDIA V100', 'NVIDIA H100', 'NVIDIA RTX 4090', 'NVIDIA RTX 3090'];

export function ProviderList({ className, onSelect, selectedId }: ProviderListProps) {
  const {
    ranked,
    isLoading,
    error,
    filters,
    setFilters,
    refresh,
    selectedProvider,
    setSelectedProvider
  } = useProviderDiscovery();

  const handleSelect = (providerId: string) => {
    const provider = ranked.find(r => r.provider.id === providerId)?.provider;
    if (provider) {
      setSelectedProvider(provider);
      onSelect?.(providerId);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="space-y-4 p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Filters</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Region</Label>
            <Select
              value={filters.region || 'any'}
              onValueChange={(value) => 
                setFilters({ ...filters, region: value === 'any' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any region</SelectItem>
                {REGIONS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>GPU Type</Label>
            <Select
              value={filters.gpuType || 'any'}
              onValueChange={(value) => 
                setFilters({ ...filters, gpuType: value === 'any' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any GPU" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any GPU</SelectItem>
                {GPU_TYPES.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Max Price</Label>
            <span className="text-sm text-muted-foreground">
              ${filters.maxPrice?.toFixed(2) || 'No limit'}/hr
            </span>
          </div>
          <Slider
            value={[filters.maxPrice || 5]}
            onValueChange={([value]) => 
              setFilters({ ...filters, maxPrice: value })
            }
            max={10}
            step={0.5}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Min Availability</Label>
            <span className="text-sm text-muted-foreground">
              {((filters.minAvailability || 0.8) * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[filters.minAvailability || 0.8]}
            onValueChange={([value]) => 
              setFilters({ ...filters, minAvailability: value })
            }
            max={1}
            step={0.05}
          />
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={refresh}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800">
          {error}
        </div>
      )}

      {/* Provider List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : ranked.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No providers match your filters
          </div>
        ) : (
          ranked.map(({ provider, totalScore }) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              score={{ provider, totalScore, priceScore: 0, reliabilityScore: 0, performanceScore: 0, latencyScore: 0 }}
              isSelected={provider.id === selectedId || provider.id === selectedProvider?.id}
              onSelect={() => handleSelect(provider.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

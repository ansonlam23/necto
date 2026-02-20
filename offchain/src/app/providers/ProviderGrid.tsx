'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchAkashProviders, type SynapseProvider } from '@/lib/providers/akash-fetcher';
import { fetchDepinProviders } from '@/lib/providers/depin-fetcher';
import { useMarketplace } from '@/context/MarketplaceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Server, Gpu, Cpu, HardDrive, MapPin, Activity, Building2, Search, Database } from 'lucide-react';

// Source → badge colour classes
const SOURCE_COLORS: Record<string, string> = {
  'io.net':     'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Nosana':     'bg-green-500/10 text-green-400 border-green-500/20',
  'Spheron':    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Aethir':     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Render':     'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Gensyn':     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Hyperspace': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Akash':      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'User-Listed':'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

function ProviderCard({ provider }: { provider: SynapseProvider }) {
  const vCpu = provider.hardware.cpuCount || (provider.hardware.cpuUnits / 1000).toFixed(0);
  const memoryGB = provider.hardware.memoryGB || (provider.hardware.memory / 1024 / 1024 / 1024).toFixed(1);
  const storageGB = provider.hardware.storageGB;

  const isUserListed = provider.source === 'User-Listed';
  const sourceColor = SOURCE_COLORS[provider.source] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <Card className="h-full min-h-[240px] flex flex-col hover:shadow-lg transition-shadow relative">
      {/* Top-right badges */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
        <Badge
          variant={
            provider.uptimePercentage >= 99 ? 'default' :
            provider.uptimePercentage >= 95 ? 'secondary' :
            'destructive'
          }
          className="text-[10px] px-1.5 py-0.5 flex items-center gap-1"
        >
          <Activity className={`h-2.5 w-2.5 ${
            provider.uptimePercentage >= 99 ? 'text-green-500' :
            provider.uptimePercentage >= 95 ? 'text-yellow-500' :
            provider.uptimePercentage >= 90 ? 'text-orange-500' :
            'text-red-500'
          }`} />
          {provider.uptimePercentage.toFixed(1)}%
        </Badge>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0.5 ${sourceColor}`}
        >
          {isUserListed ? (
            <><Building2 className="h-2.5 w-2.5 mr-1" />{provider.source}</>
          ) : (
            provider.source
          )}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between pr-16">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle
              className="text-sm font-medium truncate max-w-[180px]"
              title={provider.name}
            >
              {provider.name}
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-[10px] mt-1">
          ID: {provider.id.slice(0, 8)}...{provider.id.slice(-6)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-3">
        {/* GPU — hero element */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Gpu className="h-5 w-5 text-green-500" />
              <span className="font-bold text-base">{provider.hardware.gpuModel}</span>
            </div>
            <Badge variant="outline" className="text-[10px] w-fit">
              {provider.hardware.gpuCount}x GPU
            </Badge>
          </div>

          {/* CPU / RAM / Storage */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              <span>{vCpu} vCPU</span>
            </div>
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              <span>{memoryGB} GB RAM</span>
            </div>
            {storageGB && (
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                <span>
                  {storageGB >= 1000
                    ? `${(storageGB / 1000).toFixed(storageGB % 1000 === 0 ? 0 : 1)} TB`
                    : `${storageGB} GB`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Location & Pricing */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {provider.region ? (
              <>
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[110px]" title={provider.region}>
                  {provider.region}
                </span>
              </>
            ) : (
              <span className="text-gray-400">Location unknown</span>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-green-600">
              ${provider.priceEstimate.toFixed(2)}/hr
            </div>
            <div className="text-[10px] text-muted-foreground">per GPU</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProviderGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <Skeleton className="h-3 w-20" />
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type SortKey = 'price-asc' | 'price-desc' | 'uptime' | 'gpus';

const SORT_LABELS: Record<SortKey, string> = {
  'price-asc':  'Price: Low → High',
  'price-desc': 'Price: High → Low',
  'uptime':     'Highest Uptime',
  'gpus':       'Most GPUs',
};

export function ProviderGrid() {
  const [providers, setProviders] = useState<SynapseProvider[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter / sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortKey>('price-asc');

  const { convertToSynapseProviders, hostedMachines } = useMarketplace();

  useEffect(() => {
    async function loadProviders() {
      try {
        const [akashProviders, depinProviders] = await Promise.all([
          fetchAkashProviders(),
          fetchDepinProviders(),
        ]);

        const userListedProviders = convertToSynapseProviders();

        setProviders([
          ...userListedProviders,
          ...depinProviders,
          ...akashProviders,
        ]);
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProviders();
  }, [convertToSynapseProviders, hostedMachines]);

  // Derive unique sources from loaded data (preserving insertion order)
  const availableSources = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const p of providers) {
      if (!seen.has(p.source)) {
        seen.add(p.source);
        result.push(p.source);
      }
    }
    return result;
  }, [providers]);

  // Apply search + source filter + sort
  const filteredProviders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    let list = providers.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.hardware.gpuModel.toLowerCase().includes(q) ||
        p.source.toLowerCase().includes(q) ||
        (p.region ?? '').toLowerCase().includes(q);

      const matchesSource =
        selectedSource === 'All' || p.source === selectedSource;

      return matchesSearch && matchesSource;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':  return a.priceEstimate - b.priceEstimate;
        case 'price-desc': return b.priceEstimate - a.priceEstimate;
        case 'uptime':     return b.uptimePercentage - a.uptimePercentage;
        case 'gpus':       return b.hardware.gpuCount - a.hardware.gpuCount;
        default:           return 0;
      }
    });

    return list;
  }, [providers, searchQuery, selectedSource, sortBy]);

  if (loading) {
    return <ProviderGridSkeleton />;
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-12">
        <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No GPU providers found</h3>
        <p className="text-muted-foreground">Unable to fetch GPU providers at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Search + sort row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search GPU, network, region…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Network filter pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            key="All"
            variant={selectedSource === 'All' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => setSelectedSource('All')}
          >
            All ({providers.length})
          </Button>
          {availableSources.map((source) => {
            const count = providers.filter((p) => p.source === source).length;
            const colorCls = SOURCE_COLORS[source] ?? '';
            const isActive = selectedSource === source;
            return (
              <Button
                key={source}
                variant="outline"
                size="sm"
                className={`h-7 text-xs px-3 transition-colors ${
                  isActive
                    ? `${colorCls} border font-semibold`
                    : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedSource(isActive ? 'All' : source)}
              >
                {source} ({count})
              </Button>
            );
          })}
        </div>

        {/* Result count */}
        <p className="text-xs text-muted-foreground">
          {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} shown
          {selectedSource !== 'All' || searchQuery ? ` — filtered from ${providers.length} total` : ''}
        </p>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      {filteredProviders.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No providers match your search</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}
    </div>
  );
}

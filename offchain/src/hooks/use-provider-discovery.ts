'use client';

import { useState, useCallback, useEffect } from 'react';
import { Provider, ProviderScore } from '@/lib/agent/provider-selection';

export interface DiscoveryFilters {
  gpuType?: string;
  region?: string;
  maxPrice?: number;
  minAvailability?: number;
}

interface UseProviderDiscoveryReturn {
  providers: Provider[];
  ranked: ProviderScore[];
  isLoading: boolean;
  error: string | null;
  filters: DiscoveryFilters;
  setFilters: (filters: DiscoveryFilters) => void;
  refresh: () => Promise<void>;
  selectedProvider: Provider | null;
  setSelectedProvider: (provider: Provider | null) => void;
}

// Mock providers for initial development
const MOCK_PROVIDERS: Provider[] = [
  {
    id: 'prov-1',
    name: 'GPU Cloud East',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    region: 'us-east',
    gpuTypes: ['NVIDIA A100', 'NVIDIA V100'],
    pricePerHour: 2.50,
    availability: 0.95,
    uptime: 99.9,
    latency: 45,
    specs: { vcpus: 32, memory: 128, storage: 1000 }
  },
  {
    id: 'prov-2',
    name: 'Euro Compute',
    address: '0x8ba1f109551bD432803012645Hac136c82C3e8C',
    region: 'eu-west',
    gpuTypes: ['NVIDIA A100', 'NVIDIA RTX 4090'],
    pricePerHour: 2.20,
    availability: 0.92,
    uptime: 98.5,
    latency: 85,
    specs: { vcpus: 24, memory: 96, storage: 500 }
  },
  {
    id: 'prov-3',
    name: 'Asia GPU Hub',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    region: 'ap-south',
    gpuTypes: ['NVIDIA V100', 'NVIDIA RTX 3090'],
    pricePerHour: 1.80,
    availability: 0.88,
    uptime: 97.2,
    latency: 120,
    specs: { vcpus: 16, memory: 64, storage: 250 }
  },
  {
    id: 'prov-4',
    name: 'Premium West',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    region: 'us-west',
    gpuTypes: ['NVIDIA A100', 'NVIDIA H100'],
    pricePerHour: 3.50,
    availability: 0.98,
    uptime: 99.8,
    latency: 60,
    specs: { vcpus: 64, memory: 256, storage: 2000 }
  },
  {
    id: 'prov-5',
    name: 'Budget Compute',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    region: 'us-central',
    gpuTypes: ['NVIDIA RTX 4090', 'NVIDIA RTX 3090'],
    pricePerHour: 1.20,
    availability: 0.85,
    uptime: 96.8,
    latency: 55,
    specs: { vcpus: 12, memory: 48, storage: 500 }
  }
];

export function useProviderDiscovery(): UseProviderDiscoveryReturn {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [ranked, setRanked] = useState<ProviderScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DiscoveryFilters>({});
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with real Console API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Apply filters
      let filtered = [...MOCK_PROVIDERS];
      
      if (filters.gpuType) {
        filtered = filtered.filter(p => 
          p.gpuTypes.includes(filters.gpuType!)
        );
      }
      
      if (filters.region) {
        filtered = filtered.filter(p => p.region === filters.region);
      }
      
      if (filters.maxPrice) {
        filtered = filtered.filter(p => 
          p.pricePerHour <= filters.maxPrice!
        );
      }
      
      if (filters.minAvailability) {
        filtered = filtered.filter(p => 
          p.availability >= filters.minAvailability!
        );
      }

      setProviders(filtered);

      // Rank providers
      const { rankProviders } = await import('@/lib/agent/provider-selection');
      const scored = rankProviders(filtered);
      setRanked(scored);

      // Auto-select top provider
      if (scored.length > 0 && !selectedProvider) {
        setSelectedProvider(scored[0].provider);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch providers');
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedProvider]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    providers,
    ranked,
    isLoading,
    error,
    filters,
    setFilters,
    refresh: fetchProviders,
    selectedProvider,
    setSelectedProvider
  };
}

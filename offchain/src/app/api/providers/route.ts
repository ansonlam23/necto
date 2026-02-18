import { NextRequest, NextResponse } from 'next/server';

// Mock providers data - replace with Console API call when available
const MOCK_PROVIDERS = [
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
    specs: { vcpus: 32, memory: 128, storage: 1000 },
    attributes: {
      host: 'gpu-cloud-east.akash.io',
      tier: 'premium'
    }
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
    specs: { vcpus: 24, memory: 96, storage: 500 },
    attributes: {
      host: 'euro-compute.akash.io',
      tier: 'standard'
    }
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
    specs: { vcpus: 16, memory: 64, storage: 250 },
    attributes: {
      host: 'asia-gpu.akash.io',
      tier: 'budget'
    }
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
    specs: { vcpus: 64, memory: 256, storage: 2000 },
    attributes: {
      host: 'premium-west.akash.io',
      tier: 'premium'
    }
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
    specs: { vcpus: 12, memory: 48, storage: 500 },
    attributes: {
      host: 'budget-compute.akash.io',
      tier: 'budget'
    }
  }
];

export interface Provider {
  id: string;
  name: string;
  address: string;
  region: string;
  gpuTypes: string[];
  pricePerHour: number;
  availability: number;
  uptime: number;
  latency: number;
  specs: {
    vcpus: number;
    memory: number;
    storage: number;
  };
  attributes: Record<string, string>;
}

/**
 * GET /api/providers
 * List available providers with optional filters
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filter parameters
    const region = searchParams.get('region') || undefined;
    const gpuType = searchParams.get('gpuType') || undefined;
    const maxPrice = searchParams.get('maxPrice') 
      ? parseFloat(searchParams.get('maxPrice')!) 
      : undefined;
    const minAvailability = searchParams.get('minAvailability')
      ? parseFloat(searchParams.get('minAvailability')!)
      : undefined;
    const search = searchParams.get('search') || undefined;

    // Apply filters
    let providers = [...MOCK_PROVIDERS];

    if (region) {
      providers = providers.filter(p => 
        p.region.toLowerCase() === region.toLowerCase()
      );
    }

    if (gpuType) {
      providers = providers.filter(p => 
        p.gpuTypes.some(g => 
          g.toLowerCase().includes(gpuType.toLowerCase())
        )
      );
    }

    if (maxPrice !== undefined) {
      providers = providers.filter(p => p.pricePerHour <= maxPrice);
    }

    if (minAvailability !== undefined) {
      providers = providers.filter(p => p.availability >= minAvailability);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      providers = providers.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.region.toLowerCase().includes(searchLower) ||
        p.gpuTypes.some(g => g.toLowerCase().includes(searchLower))
      );
    }

    // Get available regions and GPU types for filters
    const availableRegions = [...new Set(MOCK_PROVIDERS.map(p => p.region))];
    const availableGpuTypes = [...new Set(MOCK_PROVIDERS.flatMap(p => p.gpuTypes))];
    const priceRange = {
      min: Math.min(...MOCK_PROVIDERS.map(p => p.pricePerHour)),
      max: Math.max(...MOCK_PROVIDERS.map(p => p.pricePerHour))
    };

    return NextResponse.json({
      success: true,
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        region: p.region,
        gpuTypes: p.gpuTypes,
        pricePerHour: p.pricePerHour,
        availability: p.availability,
        uptime: p.uptime,
        latency: p.latency,
        specs: p.specs
      })),
      meta: {
        total: providers.length,
        filters: {
          region,
          gpuType,
          maxPrice,
          minAvailability,
          search
        },
        availableFilters: {
          regions: availableRegions,
          gpuTypes: availableGpuTypes,
          priceRange
        }
      }
    });
  } catch (error) {
    console.error('Failed to list providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

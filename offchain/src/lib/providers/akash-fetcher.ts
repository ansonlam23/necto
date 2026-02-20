export interface SynapseProvider {
  id: string;
  name: string;
  source: 'Akash' | 'Lambda' | 'Render' | 'User-Listed' | 'io.net' | 'Nosana' | 'Spheron' | 'Aethir' | 'Gensyn' | 'Hyperspace';
  hardware: {
    gpuModel: string;
    gpuCount: number;
    cpuUnits: number;    // milli-units for Akash, actual vCPUs for Lambda
    memory: number;       // bytes
    cpuCount?: number;    // vCPUs (optional for backward compat)
    memoryGB?: number;    // RAM in GB (optional for backward compat)
    storageGB?: number;   // Disk in GB (optional for backward compat)
    cpuModel?: string;    // e.g. "AMD EPYC" (optional)
  };
  priceEstimate: number;
  region?: string;
  uptimePercentage: number; // e.g. 99.5
}

/**
 * Mock providers for demo fallback when Akash API is unavailable
 */
const MOCK_PROVIDERS: SynapseProvider[] = [
  {
    id: 'mock-akash-a100-us',
    name: 'Akash Node US-East-1',
    source: 'Akash',
    hardware: {
      gpuModel: 'NVIDIA A100',
      gpuCount: 4,
      cpuUnits: 128000,
      memory: 549755813888
    },
    priceEstimate: 2.50,
    region: 'us-east',
    uptimePercentage: 99.8
  },
  {
    id: 'mock-akash-h100-us',
    name: 'Akash Node US-West-1',
    source: 'Akash',
    hardware: {
      gpuModel: 'NVIDIA H100',
      gpuCount: 2,
      cpuUnits: 64000,
      memory: 274877906944
    },
    priceEstimate: 4.20,
    region: 'us-west',
    uptimePercentage: 99.5
  },
  {
    id: 'mock-akash-rtx4090-us',
    name: 'Akash Node US-Central-1',
    source: 'Akash',
    hardware: {
      gpuModel: 'NVIDIA RTX4090',
      gpuCount: 2,
      cpuUnits: 32000,
      memory: 137438953472
    },
    priceEstimate: 0.80,
    region: 'us-central',
    uptimePercentage: 98.2
  },
  {
    id: 'mock-akash-rtx3090-eu',
    name: 'Akash Node EU-West-1',
    source: 'Akash',
    hardware: {
      gpuModel: 'NVIDIA RTX3090',
      gpuCount: 1,
      cpuUnits: 16000,
      memory: 68719476736
    },
    priceEstimate: 0.55,
    region: 'eu-west',
    uptimePercentage: 97.1
  },
  {
    id: 'mock-akash-v100-eu',
    name: 'Akash Node EU-Central-1',
    source: 'Akash',
    hardware: {
      gpuModel: 'NVIDIA V100',
      gpuCount: 2,
      cpuUnits: 32000,
      memory: 137438953472
    },
    priceEstimate: 1.50,
    region: 'eu-central',
    uptimePercentage: 99.0
  },
  {
    id: 'mock-akash-a100-ap',
    name: 'Akash Node AP-South-1',
    source: 'Akash',
    hardware: {
      gpuModel: 'NVIDIA A100',
      gpuCount: 2,
      cpuUnits: 64000,
      memory: 274877906944
    },
    priceEstimate: 2.80,
    region: 'ap-south',
    uptimePercentage: 98.5
  }
];

interface AkashAttribute {
  key: string;
  value: string;
}

interface AkashGpuModel {
  vendor: string;
  model: string;
  ram?: string;
  interface?: string;
}

interface AkashStats {
  cpu: {
    active: number;
    available: number;
    pending: number;
    total: number;
  };
  gpu: {
    active: number;
    available: number;
    pending: number;
    total: number;
  };
  memory: {
    active: number;
    available: number;
    pending: number;
    total: number;
  };
  storage: {
    ephemeral: {
      active: number;
      available: number;
      pending: number;
      total: number;
    };
    persistent: {
      active: number;
      available: number;
      pending: number;
      total: number;
    };
  };
}

interface AkashProvider {
  owner: string;
  hostUri: string;
  name?: string;
  isOnline: boolean;
  attributes: AkashAttribute[];
  stats: AkashStats;
  gpuModels?: AkashGpuModel[];
  ipCountry?: string;
  ipRegion?: string;
  city?: string;
  uptime1d?: number;  // 1-day uptime (0-1)
  uptime7d?: number;  // 7-day uptime (0-1)
  uptime30d?: number; // 30-day uptime (0-1)
}

/**
 * Maps common country/region codes to UI region format
 */
function mapRegionToUIFormat(ipCountry?: string, ipRegion?: string, city?: string): string | undefined {
  if (!ipCountry) return undefined;
  
  const country = ipCountry.toUpperCase();
  const region = ipRegion?.toUpperCase();
  
  // Map US regions
  if (country === 'US') {
    if (region?.includes('EAST') || city?.toUpperCase().includes('VIRGINIA') || city?.toUpperCase().includes('NEW YORK')) {
      return 'us-east';
    }
    if (region?.includes('WEST') || city?.toUpperCase().includes('CALIFORNIA') || city?.toUpperCase().includes('OREGON')) {
      return 'us-west';
    }
    if (region?.includes('CENTRAL') || city?.toUpperCase().includes('TEXAS') || city?.toUpperCase().includes('OHIO')) {
      return 'us-central';
    }
    return 'us-east'; // Default US region
  }
  
  // Map EU regions
  if (['DE', 'FR', 'NL', 'BE', 'LU', 'AT', 'CH', 'IE', 'GB'].includes(country)) {
    if (country === 'DE') return 'eu-central';
    if (country === 'FR' || country === 'NL' || country === 'BE') return 'eu-west';
    if (country === 'GB' || country === 'IE') return 'eu-west';
    return 'eu-central';
  }
  
  // Map Asia Pacific regions
  if (['SG', 'IN', 'JP', 'KR', 'AU', 'ID', 'TH', 'VN', 'MY', 'PH', 'TW', 'HK'].includes(country)) {
    if (country === 'SG' || country === 'ID' || country === 'MY') return 'ap-south';
    if (country === 'IN') return 'ap-south';
    if (country === 'JP' || country === 'KR' || country === 'TW' || country === 'HK') return 'ap-northeast';
    if (country === 'AU') return 'ap-southeast';
    return 'ap-south';
  }
  
  // Default mapping for other countries
  if (['CA', 'MX'].includes(country)) return 'us-central';
  if (['BR', 'AR', 'CL', 'CO', 'PE'].includes(country)) return 'sa-east';
  
  return ipCountry.toLowerCase();
}

/**
 * Helper function to parse GPU information from Akash provider attributes
 */
function parseGpuInfo(attributes: AkashAttribute[]): {
  gpuModel: string;
  hasGpu: boolean;
} {
  let gpuModel = 'Unknown';
  let hasGpu = false;

  for (const attr of attributes) {
    const key = attr.key.toLowerCase();

    // Look for NVIDIA GPU model specifications
    if (key.includes('vendor/nvidia/model') || key.includes('gpu/vendor/nvidia/model')) {
      gpuModel = attr.value;
      hasGpu = true;
      break;
    }

    // Alternative patterns for GPU detection
    if (key.includes('gpu') && key.includes('model')) {
      gpuModel = attr.value;
      hasGpu = true;
    }

    // Check for vendor nvidia indicator
    if (key.includes('vendor/nvidia') || key === 'vendor' && attr.value.toLowerCase() === 'nvidia') {
      hasGpu = true;
    }
  }

  return { gpuModel, hasGpu };
}

/**
 * Helper function to extract region from attributes
 */
function parseRegion(attributes: AkashAttribute[]): string | undefined {
  for (const attr of attributes) {
    const key = attr.key.toLowerCase();

    if (key === 'region' || key.includes('location') || key.includes('datacenter')) {
      return attr.value;
    }
  }

  return undefined;
}

/**
 * Helper function to generate a readable provider name
 */
function generateProviderName(provider: AkashProvider): string {
  // Use explicit name if available
  if (provider.name) {
    return provider.name;
  }

  if (provider.hostUri) {
    // Extract hostname from URI
    try {
      const url = new URL(provider.hostUri.startsWith('http') ? provider.hostUri : `https://${provider.hostUri}`);
      return url.hostname;
    } catch {
      return provider.hostUri;
    }
  }

  // Fallback to shortened address
  const address = provider.owner;
  return address.length > 12 ? `${address.slice(0, 8)}...${address.slice(-4)}` : address;
}

/**
 * Fetches active GPU providers from Akash Network
 */
export async function fetchAkashProviders(): Promise<SynapseProvider[]> {
  try {
    // Try primary API endpoint first, fallback to secondary
    const endpoints = [
      'https://console-api.akash.network/v1/providers',
      'https://api.cloudmos.io/v1/providers'
    ];

    let response: Response | null = null;
    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Necto-Marketplace/1.0'
          }
        });

        if (response.ok) {
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        continue;
      }
    }

    if (!response || !response.ok) {
      console.warn('Akash API unavailable — using mock providers for demo');
      return MOCK_PROVIDERS;
    }

    const data = await response.json();

    // Handle direct array response or wrapped response
    const providers: AkashProvider[] = Array.isArray(data) ? data : (data.providers || []);

    if (!Array.isArray(providers) || providers.length === 0) {
      console.warn('Akash API returned no providers — using mock providers for demo');
      return MOCK_PROVIDERS;
    }

    const synapseProviders: SynapseProvider[] = [];

    for (const provider of providers) {
      // Skip offline providers
      if (!provider.isOnline) {
        continue;
      }

      // Check for GPUs - either in gpuModels array or stats
      const hasGpuModels = provider.gpuModels && provider.gpuModels.length > 0;
      const gpuCount = provider.stats?.gpu?.total || 0;

      // Skip providers without GPUs
      if (!hasGpuModels && gpuCount === 0) {
        continue;
      }

      // Extract GPU model from gpuModels array or attributes
      let gpuModel = 'Unknown GPU';
      if (hasGpuModels && provider.gpuModels) {
        const gpu = provider.gpuModels[0];
        gpuModel = `${gpu.vendor === 'nvidia' ? 'NVIDIA' : gpu.vendor} ${gpu.model.toUpperCase()}`;
        if (gpu.ram) {
          gpuModel += ` (${gpu.ram})`;
        }
      } else if (provider.attributes) {
        // Fallback to attribute parsing
        const { gpuModel: parsedModel, hasGpu } = parseGpuInfo(provider.attributes);
        if (hasGpu && parsedModel !== 'Unknown') {
          gpuModel = parsedModel;
        }
      }

      // Extract hardware stats
      const cpuUnits = provider.stats?.cpu?.total || 0;
      const memory = provider.stats?.memory?.total || 0;

      // Determine region using mapping to UI format
      let region: string | undefined;
      region = mapRegionToUIFormat(provider.ipCountry, provider.ipRegion, provider.city);
      
      // Fallback to attribute parsing if no IP-based region
      if (!region) {
        region = parseRegion(provider.attributes);
      }

      // Calculate uptime percentage (prioritize 7-day, then 30-day, then 1-day)
      let uptimePercentage = 0;
      if (provider.uptime7d !== undefined && provider.uptime7d !== null) {
        // Use 7-day uptime as the primary metric
        uptimePercentage = Math.round(provider.uptime7d * 100 * 10) / 10; // Convert to percentage with 1 decimal
      } else if (provider.uptime30d !== undefined && provider.uptime30d !== null) {
        // Fallback to 30-day uptime
        uptimePercentage = Math.round(provider.uptime30d * 100 * 10) / 10;
      } else if (provider.uptime1d !== undefined && provider.uptime1d !== null) {
        // Last resort: use 1-day uptime
        uptimePercentage = Math.round(provider.uptime1d * 100 * 10) / 10;
      } else if (provider.isOnline) {
        // If no uptime data but provider is online, assume 100%
        uptimePercentage = 100;
      }

      // Generate price estimate based on GPU model
      let priceEstimate = 0.5; // Default
      if (gpuModel.includes('A100')) priceEstimate = 2.5;
      else if (gpuModel.includes('H100')) priceEstimate = 4.0;
      else if (gpuModel.includes('RTX4090')) priceEstimate = 0.8;
      else if (gpuModel.includes('RTX3090')) priceEstimate = 0.6;
      else if (gpuModel.includes('V100')) priceEstimate = 1.5;

      synapseProviders.push({
        id: provider.owner,
        name: generateProviderName(provider),
        source: 'Akash',
        hardware: {
          gpuModel,
          gpuCount: Math.max(gpuCount, hasGpuModels ? provider.gpuModels!.length : 1),
          cpuUnits,
          memory
        },
        priceEstimate,
        region,
        uptimePercentage
      });
    }

    console.log(`Successfully fetched ${synapseProviders.length} Akash GPU providers`);
    return synapseProviders;

  } catch (error) {
    console.error('Error fetching Akash providers:', error);
    return MOCK_PROVIDERS;
  }
}

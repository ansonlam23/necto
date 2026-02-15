interface SynapseProvider {
  id: string;
  name: string;
  source: 'Akash';
  hardware: {
    gpuModel: string;
    gpuCount: number;
    cpuUnits: number;
    memory: number;
  };
  priceEstimate: number;
  region?: string;
  uptimePercentage: number; // e.g., 99.5
}

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
          next: { revalidate: 60 }, // Cache for 1 minute
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
      console.error('Failed to fetch Akash providers:', lastError?.message);
      return [];
    }

    const data = await response.json();

    // Handle direct array response or wrapped response
    const providers: AkashProvider[] = Array.isArray(data) ? data : (data.providers || []);

    if (!Array.isArray(providers) || providers.length === 0) {
      console.warn('Akash API returned no providers or invalid format');
      return [];
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

      // Determine region
      let region: string | undefined;
      if (provider.city && provider.ipCountry) {
        region = `${provider.city}, ${provider.ipCountry}`;
      } else if (provider.ipRegion && provider.ipCountry) {
        region = `${provider.ipRegion}, ${provider.ipCountry}`;
      } else if (provider.ipCountry) {
        region = provider.ipCountry;
      } else {
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
    return [];
  }
}

// Export the type for use in other modules
export type { SynapseProvider };
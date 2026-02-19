import { SynapseProvider } from './akash-fetcher';

interface RenderGpuType {
  id: string;
  displayName: string;
  manufacturer?: string;
  memoryInGb: number;
  cudaCores?: number;
  secureCloud?: boolean;
  communityCloud?: boolean;
  securePrice?: number;
  communityPrice?: number;
  communitySpotPrice?: number;
  secureSpotPrice?: number;
  maxGpuCount?: number;
  secureSpotStock?: number;
  communitySpotStock?: number;
}

interface RenderGraphQLResponse {
  data?: {
    gpuTypes?: RenderGpuType[];
  };
  errors?: Array<{
    message: string;
  }>;
}

/**
 * Fetches available GPU instances from Render
 */
export async function fetchRenderProviders(): Promise<SynapseProvider[]> {
  try {
    // Check if API key is available
    const apiKey = process.env.RENDER_API_KEY;
    if (!apiKey) {
      console.warn('Render API key not configured (RENDER_API_KEY) - using mock data');

      // Return mock Render providers for demonstration
      return [
        {
          id: 'render-rtx-4090',
          name: 'RTX 4090',
          source: 'Render',
          hardware: {
            gpuModel: 'NVIDIA RTX 4090',
            gpuCount: 1,
            cpuUnits: 16,
            memory: 125 * 1024 * 1024 * 1024, // 125 GB in bytes
            cpuCount: 16,
            memoryGB: 125,
            storageGB: 1000,
          },
          priceEstimate: 0.44, // Community price
          region: 'Global',
          uptimePercentage: 98.5, // Community cloud
        },
        {
          id: 'render-rtx-a6000',
          name: 'RTX A6000',
          source: 'Render',
          hardware: {
            gpuModel: 'NVIDIA RTX A6000',
            gpuCount: 1,
            cpuUnits: 16,
            memory: 100 * 1024 * 1024 * 1024, // 100 GB in bytes
            cpuCount: 16,
            memoryGB: 100,
            storageGB: 1000,
          },
          priceEstimate: 0.79, // Secure price
          region: 'Global',
          uptimePercentage: 99.5, // Secure cloud
        },
        {
          id: 'render-a100-80gb',
          name: 'A100 80GB',
          source: 'Render',
          hardware: {
            gpuModel: 'NVIDIA A100 80GB',
            gpuCount: 1,
            cpuUnits: 24,
            memory: 250 * 1024 * 1024 * 1024, // 250 GB in bytes
            cpuCount: 24,
            memoryGB: 250,
            storageGB: 2000,
          },
          priceEstimate: 1.39, // Community price
          region: 'Global',
          uptimePercentage: 98.5,
        },
        {
          id: 'render-h100-sxm5',
          name: 'H100 80GB SXM5',
          source: 'Render',
          hardware: {
            gpuModel: 'NVIDIA H100 80GB SXM5',
            gpuCount: 1,
            cpuUnits: 26,
            memory: 256 * 1024 * 1024 * 1024, // 256 GB in bytes
            cpuCount: 26,
            memoryGB: 256,
            storageGB: 2000,
          },
          priceEstimate: 2.99, // Estimated price
          region: 'Global',
          uptimePercentage: 99.5, // Secure cloud
        },
        {
          id: 'render-l4',
          name: 'L4',
          source: 'Render',
          hardware: {
            gpuModel: 'NVIDIA L4',
            gpuCount: 1,
            cpuUnits: 8,
            memory: 60 * 1024 * 1024 * 1024, // 60 GB in bytes
            cpuCount: 8,
            memoryGB: 60,
            storageGB: 500,
          },
          priceEstimate: 0.29, // Budget option
          region: 'Global',
          uptimePercentage: 98.0,
        },
      ];
    }

    // GraphQL query for GPU types
    const query = `
      query GpuTypes {
        gpuTypes {
          id
          displayName
          manufacturer
          memoryInGb
          cudaCores
          secureCloud
          communityCloud
          securePrice
          communityPrice
          communitySpotPrice
          secureSpotPrice
          maxGpuCount
          secureSpotStock
          communitySpotStock
        }
      }
    `;

    const response = await fetch(`https://api.runpod.io/graphql?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error('Failed to fetch Render GPU types:', response.status, response.statusText);
      return [];
    }

    const data: RenderGraphQLResponse = await response.json();

    if (data.errors && data.errors.length > 0) {
      console.error('Render GraphQL errors:', data.errors);
      return [];
    }

    if (!data.data?.gpuTypes) {
      console.warn('Render API returned no GPU types');
      return [];
    }

    const synapseProviders: SynapseProvider[] = [];

    // Process each GPU type
    for (const gpu of data.data.gpuTypes) {
      // Skip if no stock available
      const hasStock = (gpu.secureSpotStock && gpu.secureSpotStock > 0) ||
                      (gpu.communitySpotStock && gpu.communitySpotStock > 0);

      if (!hasStock && gpu.secureSpotStock !== undefined && gpu.communitySpotStock !== undefined) {
        continue; // Skip if we have stock info and both are 0
      }

      // Determine best price and cloud type
      let price = 0;
      let cloudType = 'Community';
      let uptimePercentage = 98.5; // Default for community

      // Prioritize community price (cheaper)
      if (gpu.communityPrice && gpu.communityPrice > 0) {
        price = gpu.communityPrice;
        cloudType = 'Community';
        uptimePercentage = 98.5;
      } else if (gpu.communitySpotPrice && gpu.communitySpotPrice > 0) {
        price = gpu.communitySpotPrice;
        cloudType = 'Community Spot';
        uptimePercentage = 95.0; // Lower for spot
      } else if (gpu.securePrice && gpu.securePrice > 0) {
        price = gpu.securePrice;
        cloudType = 'Secure';
        uptimePercentage = 99.5;
      } else if (gpu.secureSpotPrice && gpu.secureSpotPrice > 0) {
        price = gpu.secureSpotPrice;
        cloudType = 'Secure Spot';
        uptimePercentage = 97.0;
      }

      // Skip if no pricing available
      if (price === 0) {
        continue;
      }

      // Format GPU model name
      let gpuModel = gpu.displayName || gpu.id;
      if (gpu.manufacturer && !gpuModel.includes(gpu.manufacturer)) {
        gpuModel = `${gpu.manufacturer} ${gpuModel}`;
      }
      if (!gpuModel.toUpperCase().includes('NVIDIA') && gpu.manufacturer?.toUpperCase() === 'NVIDIA') {
        gpuModel = `NVIDIA ${gpuModel}`;
      }

      // Estimate CPU and storage based on GPU tier
      let estimatedCpu = 8;
      let estimatedStorageGB = 500;

      if (gpu.memoryInGb >= 80) {
        estimatedCpu = 24; // High-end GPU
        estimatedStorageGB = 2000;
      } else if (gpu.memoryInGb >= 40) {
        estimatedCpu = 16; // Mid-range GPU
        estimatedStorageGB = 1000;
      }

      // Estimate system RAM (usually 2-4x GPU memory)
      const estimatedMemoryGB = Math.min(gpu.memoryInGb * 3, 512);

      synapseProviders.push({
        id: `render-${gpu.id.toLowerCase().replace(/\s+/g, '-')}`,
        name: gpu.displayName || gpu.id,
        source: 'Render',
        hardware: {
          gpuModel,
          gpuCount: 1, // Render typically offers per-GPU pricing
          cpuUnits: estimatedCpu,
          memory: estimatedMemoryGB * 1024 * 1024 * 1024, // Convert to bytes
          cpuCount: estimatedCpu,
          memoryGB: estimatedMemoryGB,
          storageGB: estimatedStorageGB,
        },
        priceEstimate: price,
        region: `Global (${cloudType})`,
        uptimePercentage,
      });

      // If maxGpuCount > 1, also add multi-GPU configurations
      if (gpu.maxGpuCount && gpu.maxGpuCount > 1) {
        const multiGpuConfigs = [2, 4, 8].filter(count => count <= gpu.maxGpuCount!);

        for (const gpuCount of multiGpuConfigs) {
          synapseProviders.push({
            id: `render-${gpu.id.toLowerCase().replace(/\s+/g, '-')}-x${gpuCount}`,
            name: `${gpuCount}x ${gpu.displayName || gpu.id}`,
            source: 'Render',
            hardware: {
              gpuModel,
              gpuCount,
              cpuUnits: estimatedCpu * gpuCount,
              memory: estimatedMemoryGB * gpuCount * 1024 * 1024 * 1024,
              cpuCount: estimatedCpu * gpuCount,
              memoryGB: estimatedMemoryGB * gpuCount,
              storageGB: estimatedStorageGB * gpuCount,
            },
            priceEstimate: price, // Per GPU pricing
            region: `Global (${cloudType})`,
            uptimePercentage,
          });
        }
      }
    }

    console.log(`Successfully fetched ${synapseProviders.length} Render GPU configurations`);
    return synapseProviders;

  } catch (error) {
    console.error('Error fetching Render GPU types:', error);
    return [];
  }
}

// Export the type for use in other modules
export type { SynapseProvider };
import { SynapseProvider } from './akash-fetcher';

interface LambdaRegion {
  name: string;
  description: string;
}

interface LambdaInstanceType {
  name: string;
  description: string;
  gpu_description: string;
  price_cents_per_hour: number;
  specs: {
    vcpus: number;
    memory_gib: number;
    storage_gib: number;
    gpus: number;
  };
  regions_with_capacity_available: LambdaRegion[];
}

interface LambdaAPIResponse {
  data: {
    [key: string]: LambdaInstanceType;
  };
}

/**
 * Fetches available GPU instances from Lambda Labs
 */
export async function fetchLambdaProviders(): Promise<SynapseProvider[]> {
  try {
    // Check if API key is available
    const apiKey = process.env.LAMBDA_API_KEY;
    if (!apiKey) {
      console.warn('Lambda Labs API key not configured (LAMBDA_API_KEY) - using mock data');

      // Return mock Lambda providers for demonstration
      return [
        {
          id: 'lambda-gpu_1x_h100_80gb_sxm5',
          name: '1x H100 80GB SXM5',
          source: 'Lambda',
          hardware: {
            gpuModel: 'NVIDIA H100 80GB',
            gpuCount: 1,
            cpuUnits: 26,
            memory: 200 * 1024 * 1024 * 1024, // 200 GB in bytes
            cpuCount: 26,
            memoryGB: 200,
            storageGB: 512,
          },
          priceEstimate: 2.49,
          region: 'Texas, USA',
          uptimePercentage: 99.9,
        },
        {
          id: 'lambda-gpu_8x_h100_80gb_sxm5',
          name: '8x H100 80GB SXM5',
          source: 'Lambda',
          hardware: {
            gpuModel: 'NVIDIA H100 80GB',
            gpuCount: 8,
            cpuUnits: 208,
            memory: 2048 * 1024 * 1024 * 1024, // 2TB in bytes
            cpuCount: 208,
            memoryGB: 2048,
            storageGB: 6500,
          },
          priceEstimate: 2.49, // per GPU
          region: 'Texas, USA',
          uptimePercentage: 99.9,
        },
        {
          id: 'lambda-gpu_1x_a100_40gb',
          name: '1x A100 40GB',
          source: 'Lambda',
          hardware: {
            gpuModel: 'NVIDIA A100 40GB',
            gpuCount: 1,
            cpuUnits: 30,
            memory: 200 * 1024 * 1024 * 1024, // 200 GB in bytes
            cpuCount: 30,
            memoryGB: 200,
            storageGB: 512,
          },
          priceEstimate: 1.29,
          region: 'Virginia, USA',
          uptimePercentage: 99.9,
        },
        {
          id: 'lambda-gpu_8x_a100_80gb',
          name: '8x A100 80GB SXM4',
          source: 'Lambda',
          hardware: {
            gpuModel: 'NVIDIA A100 80GB',
            gpuCount: 8,
            cpuUnits: 240,
            memory: 2048 * 1024 * 1024 * 1024, // 2TB in bytes
            cpuCount: 240,
            memoryGB: 2048,
            storageGB: 7300,
          },
          priceEstimate: 1.89, // per GPU
          region: 'Virginia, USA',
          uptimePercentage: 99.9,
        },
        {
          id: 'lambda-gpu_1x_a10',
          name: '1x A10',
          source: 'Lambda',
          hardware: {
            gpuModel: 'NVIDIA A10',
            gpuCount: 1,
            cpuUnits: 30,
            memory: 200 * 1024 * 1024 * 1024, // 200 GB in bytes
            cpuCount: 30,
            memoryGB: 200,
            storageGB: 1400,
          },
          priceEstimate: 0.75,
          region: 'California, USA',
          uptimePercentage: 99.9,
        }
      ];
      // Original code would return empty array
      // return [];
    }

    // Encode API key in Base64 for Basic Auth
    const authHeader = `Basic ${Buffer.from(apiKey + ':').toString('base64')}`;

    const response = await fetch('https://cloud.lambdalabs.com/api/v1/instance-types', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error('Failed to fetch Lambda Labs instances:', response.status, response.statusText);
      return [];
    }

    const data: LambdaAPIResponse = await response.json();

    if (!data || !data.data) {
      console.warn('Lambda Labs API returned invalid format');
      return [];
    }

    const synapseProviders: SynapseProvider[] = [];

    // Process each instance type
    for (const [instanceKey, instanceType] of Object.entries(data.data)) {
      // Skip instances with no available capacity
      if (!instanceType.regions_with_capacity_available ||
          instanceType.regions_with_capacity_available.length === 0) {
        continue;
      }

      // Extract GPU model from description
      let gpuModel = instanceType.gpu_description || 'Unknown GPU';

      // Parse GPU count from description (e.g., "8x H100" -> 8)
      let gpuCount = instanceType.specs?.gpus || 1;

      // If description contains multiplier, use it
      const descMatch = instanceType.description.match(/^(\d+)x\s+(.+)$/);
      if (descMatch) {
        gpuCount = parseInt(descMatch[1], 10);
        // Use the GPU description if available, otherwise use parsed model
        if (!instanceType.gpu_description) {
          gpuModel = descMatch[2];
        }
      }

      // Format GPU model name
      if (!gpuModel.toUpperCase().includes('NVIDIA')) {
        gpuModel = `NVIDIA ${gpuModel}`;
      }

      // Convert price from cents to dollars
      const pricePerHour = instanceType.price_cents_per_hour / 100;

      // Get first available region (you could iterate for multiple entries per region)
      const region = instanceType.regions_with_capacity_available
        .map(r => r.description || r.name)
        .join(', ');

      // Extract hardware specs
      const cpuCount = instanceType.specs?.vcpus || 0;
      const memoryGB = instanceType.specs?.memory_gib || 0;
      const storageGB = instanceType.specs?.storage_gib || 0;

      synapseProviders.push({
        id: `lambda-${instanceType.name}`,
        name: instanceType.description || instanceType.name,
        source: 'Lambda',
        hardware: {
          gpuModel,
          gpuCount,
          cpuUnits: cpuCount,  // Lambda provides actual vCPU count
          memory: memoryGB * 1024 * 1024 * 1024, // Convert GiB to bytes
          cpuCount,
          memoryGB,
          storageGB,
          cpuModel: undefined, // Lambda doesn't specify CPU model
        },
        priceEstimate: pricePerHour / gpuCount, // Price per GPU for consistency
        region,
        uptimePercentage: 99.9, // Lambda Labs is a centralized cloud provider
      });
    }

    console.log(`Successfully fetched ${synapseProviders.length} Lambda Labs GPU instances`);
    return synapseProviders;

  } catch (error) {
    console.error('Error fetching Lambda Labs instances:', error);
    return [];
  }
}

// Export the type for use in other modules
export type { SynapseProvider };
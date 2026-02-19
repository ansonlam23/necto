/**
 * Akash Agent Router
 * Routes suitable workloads to Akash providers
 * Handles bid polling and deployment lifecycle
 */

import { AkashDeployment, ProviderBid } from '@/types/akash';
import { getConsoleClient } from '@/lib/akash/console-api';
import { generateSDL, JobRequirements } from '@/lib/akash/sdl-generator';
import {
  rankProviders,
  filterProviders,
  Provider
} from './provider-selection';
import { fetchAkashProviders, SynapseProvider } from '@/lib/providers/akash-fetcher';

export interface RouteRequest {
  jobId: string;
  requirements: JobRequirements;
  autoAcceptBid?: boolean;
  bidTimeoutMs?: number;
}

export interface AkashRouteResult {
  success: boolean;
  deployment?: AkashDeployment;
  provider?: Provider;
  bids?: ProviderBid[];
  error?: string;
  logs: RouteLog[];
}

export interface RouteLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export interface SuitabilityCheck {
  suitable: boolean;
  score: number;
  reasons: string[];
}

function parseMemoryToGi(memory?: string): number | undefined {
  if (!memory) return undefined;
  const match = memory.trim().match(/^(\d+(?:\.\d+)?)(mi|gi)$/i);
  if (!match) return undefined;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  return unit === 'mi' ? value / 1024 : value;
}

/**
 * Convert SynapseProvider to Provider format for provider-selection.ts
 */
function synapseToProvider(synapse: SynapseProvider): Provider {
  return {
    id: synapse.id,
    name: synapse.name,
    address: synapse.id, // Using id as address since SynapseProvider doesn't have separate address
    region: synapse.region || 'unknown',
    // Map the GPU model to the format expected by filterProviders
    gpuTypes: [`NVIDIA ${synapse.hardware.gpuModel.replace(/^NVIDIA\s*/, '')}`],
    pricePerHour: synapse.priceEstimate,
    availability: synapse.uptimePercentage / 100,
    uptime: synapse.uptimePercentage,
    latency: undefined, // Not available from Akash API
    specs: {
      vcpus: synapse.hardware.cpuUnits / 1000, // Convert milli-units to vCPUs
      memory: synapse.hardware.memoryGB || Math.round(synapse.hardware.memory / (1024 * 1024 * 1024)),
      storage: synapse.hardware.storageGB || 500 // Default storage
    }
  };
}

/**
 * Check if a workload is suitable for Akash
 */
export function isAkashSuitable(requirements: JobRequirements): SuitabilityCheck {
  const reasons: string[] = [];
  let score = 0;

  // GPU workloads are well-suited
  if (requirements.gpu && requirements.gpu.units > 0) {
    score += 0.3;
    reasons.push('GPU workloads ideal for Akash');
  }

  // Container-based workloads
  if (requirements.image) {
    score += 0.2;
    reasons.push('Container deployment supported');
  }

  // Stateful workloads less suitable
  if (requirements.storage && parseInt(requirements.storage) > 1000) {
    score -= 0.1;
    reasons.push('Large storage may be expensive on Akash');
  }

  // Short jobs are ideal
  if (!requirements.command?.some(c => c.includes('train') || c.includes('long'))) {
    score += 0.2;
    reasons.push('Suitable job duration');
  }

  // Web services work well
  if (requirements.port && requirements.expose) {
    score += 0.2;
    reasons.push('Web service deployment supported');
  }

  const suitable = score >= 0.5;
  
  if (!suitable) {
    reasons.push('Low suitability score - consider alternatives');
  }

  return { suitable, score: Math.min(1, Math.max(0, score)), reasons };
}

/**
 * Main routing function
 */
export async function routeToAkash(
  request: RouteRequest,
  onProgress?: (log: RouteLog) => void
): Promise<AkashRouteResult> {
  const logs: RouteLog[] = [];
  
  const log = (level: RouteLog['level'], message: string, details?: Record<string, unknown>) => {
    const entry = { timestamp: Date.now(), level, message, details };
    logs.push(entry);
    onProgress?.(entry);
  };

  try {
    // Step 1: Check suitability
    log('info', 'Checking workload suitability for Akash');
    const suitability = isAkashSuitable(request.requirements);
    
    if (!suitability.suitable) {
      log('warn', 'Workload not ideal for Akash', { score: suitability.score });
    }

    // Step 2: Generate SDL
    log('info', 'Generating Akash SDL from requirements');
    const sdl = generateSDL(request.requirements);

    // Step 3: Select provider - fetch real providers from Akash Network
    log('info', 'Discovering and ranking providers');
    
    let providers: Provider[] = [];
    try {
      const synapseProviders = await fetchAkashProviders();
      providers = synapseProviders.map(synapseToProvider);
      log('info', `Fetched ${providers.length} Akash providers`);
    } catch (error) {
      log('error', 'Failed to fetch Akash providers', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, error: 'Failed to fetch providers from Akash Network', logs };
    }

    // Build filters from requirements
    const filters: {
      gpuType?: string;
      region?: string;
      maxPrice?: number;
      minVcpus?: number;
      minMemory?: number;
    } = {};

    // Map gpu vendor/models to filter
    if (request.requirements.gpu?.models && request.requirements.gpu.models.length > 0) {
      // Use the first model for filtering (e.g., "a100" -> "A100")
      filters.gpuType = request.requirements.gpu.models[0].toUpperCase();
    } else if (request.requirements.gpu?.vendor) {
      filters.gpuType = request.requirements.gpu.vendor;
    }

    if (request.requirements.region) {
      filters.region = request.requirements.region;
    }

    if (request.requirements.cpu) {
      filters.minVcpus = request.requirements.cpu;
    }

    const memoryGi = parseMemoryToGi(request.requirements.memory);
    if (memoryGi) {
      filters.minMemory = memoryGi;
    }

    console.log('Routing with filters:', filters);
    
    const filtered = filterProviders(providers, filters);
    
    if (filtered.length === 0) {
      log('error', 'No providers match requirements', { filters });
      return { success: false, error: 'No matching providers found for your requirements', logs };
    }

    const ranked = rankProviders(filtered);
    const selected = ranked[0];
    
    log('info', `Selected provider: ${selected.provider.name}`, {
      score: selected.totalScore,
      price: selected.provider.pricePerHour
    });

    // Step 4: Create deployment using Console Client
    log('info', 'Creating deployment on Akash');
    const client = getConsoleClient();
    const deployment = await client.createDeployment(sdl);
    
    log('info', `Deployment created: ${deployment.id}`, {
      dseq: deployment.dseq,
      status: deployment.status
    });

    // Step 5: Poll for bids
    const bidTimeout = request.bidTimeoutMs || 300000; // 5 minutes
    log('info', `Waiting for bids (timeout: ${bidTimeout}ms)`);
    
    const bids = await pollForBids(deployment.id, bidTimeout, client, (status) => {
      log('info', status);
    });

    if (bids.length === 0) {
      log('error', 'No bids received within timeout');
      await client.closeDeployment(deployment.id);
      return { 
        success: false, 
        error: 'No bids received - deployment cancelled',
        deployment,
        logs 
      };
    }

    log('info', `Received ${bids.length} bid(s)`, { bids: bids.map(b => b.provider) });

    // Step 6: Auto-accept or return bids
    if (request.autoAcceptBid && bids.length > 0) {
      log('info', 'Auto-accepting best bid');
      const bestBid = bids[0];
      if (!deployment.manifest) {
        throw new Error('Missing deployment manifest for lease creation');
      }
      await client.acceptBid(deployment.id, bestBid.id, deployment.manifest);
      log('info', 'Bid accepted, lease created');
    }

    return {
      success: true,
      deployment,
      provider: selected.provider,
      bids,
      logs
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log('error', `Routing failed: ${message}`);
    return { success: false, error: message, logs };
  }
}

/**
 * Poll for bids with timeout
 */
async function pollForBids(
  deploymentId: string,
  timeoutMs: number,
  client: ReturnType<typeof getConsoleClient>,
  onStatus?: (status: string) => void
): Promise<ProviderBid[]> {
  const startTime = Date.now();
  const intervalMs = 10000; // 10 seconds

  while (Date.now() - startTime < timeoutMs) {
    const bids = await client.getBids(deploymentId);
    
    if (bids.length > 0) {
      return bids;
    }

    onStatus?.(`Waiting for bids... (${Math.round((Date.now() - startTime) / 1000)}s)`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  return [];
}

/**
 * Cancel routing and cleanup
 */
export async function cancelRoute(deploymentId?: string): Promise<void> {
  if (deploymentId) {
    try {
      const client = getConsoleClient();
      await client.closeDeployment(deploymentId);
    } catch (error) {
      console.error('Failed to close deployment:', error);
    }
  }
}

/**
 * Get routing logs as formatted string
 */
export function formatRouteLogs(logs: RouteLog[]): string {
  return logs.map(l => {
    const time = new Date(l.timestamp).toISOString();
    const emoji = l.level === 'error' ? '❌' : l.level === 'warn' ? '⚠️' : 'ℹ️';
    return `[${time}] ${emoji} ${l.message}`;
  }).join('\n');
}

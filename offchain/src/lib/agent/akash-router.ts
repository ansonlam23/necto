/**
 * Akash Agent Router
 * Routes suitable workloads to Akash providers
 * Handles bid polling and deployment lifecycle
 */

import { SdlSpec, AkashDeployment, ProviderBid } from '@/types/akash';
import { getConsoleClient } from '@/lib/akash/console-api';
import { generateSDL, JobRequirements } from '@/lib/akash/sdl-generator';
import {
  selectProvider,
  rankProviders,
  filterProviders,
  Provider,
  ProviderScore
} from './provider-selection';

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

// Mock providers for development (replace with Console API)
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

    // Step 3: Select provider
    log('info', 'Discovering and ranking providers');
    const filters = {
      gpuType: request.requirements.gpu?.vendor,
      region: request.requirements.region,
      minVcpus: request.requirements.cpu,
      minMemory: parseMemoryToGi(request.requirements.memory)
    };

    const filtered = filterProviders(MOCK_PROVIDERS, filters);
    
    if (filtered.length === 0) {
      log('error', 'No providers match requirements');
      return { success: false, error: 'No matching providers', logs };
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

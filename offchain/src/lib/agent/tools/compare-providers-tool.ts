/**
 * @title Compare Providers Tool
 * @notice Google ADK tool for comparing multiple compute providers
 * @dev Enables LLM agent to evaluate providers side-by-side before routing
 */

import { BaseTool, type RunAsyncToolRequest } from '@google/adk';
import { isAkashSuitable, type SuitabilityCheck } from '../akash-router';
import { 
  filterProviders, 
  rankProviders, 
  type Provider, 
  type SelectionWeights 
} from '../provider-selection';
import { JobRequirements } from '@/lib/akash/sdl-generator';

/**
 * Parameters for comparing providers
 */
export interface CompareProvidersParams {
  /** Hardware and software requirements */
  requirements: JobRequirements;
  /** Provider IDs to compare (e.g., ['akash', 'ionet']) */
  providersToCompare: string[];
  /** Optional custom weights for scoring */
  weights?: SelectionWeights;
}

/**
 * Provider comparison result
 */
export interface ProviderComparison {
  /** Provider identifier */
  provider: string;
  /** Provider name */
  name: string;
  /** Whether this provider can handle the workload */
  suitable: boolean;
  /** Suitability score (0-100) */
  score: number;
  /** Estimated cost in USD per hour */
  estimatedCost: number;
  /** Estimated time to deploy */
  timeToDeploy: string;
  /** Advantages of this provider */
  pros: string[];
  /** Disadvantages of this provider */
  cons: string[];
  /** Detailed assessment */
  assessment: string;
}

/**
 * Result from compare providers tool
 */
export interface CompareProvidersResult {
  /** Whether comparison was successful */
  success: boolean;
  /** Comparison results for each provider */
  comparisons: ProviderComparison[];
  /** Recommended provider (highest score) */
  recommended?: string;
  /** Error message if failed */
  error?: string;
}

// Mock providers for development - same as akash-router.ts
// In production, these would come from provider registries
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
 * Helper to get time to deploy estimate
 */
function getTimeToDeploy(provider: Provider, requirements: JobRequirements): string {
  // Base time: 2-3 minutes for container pull
  let baseMinutes = 3;
  
  // Add time for large images
  if (requirements.image?.includes('pytorch') || requirements.image?.includes('tensorflow')) {
    baseMinutes += 2;
  }
  
  // Add time for GPU setup
  if (requirements.gpu && requirements.gpu.units > 0) {
    baseMinutes += 2;
  }
  
  // Add time based on latency
  if (provider.latency && provider.latency > 100) {
    baseMinutes += 1;
  }
  
  return `~${baseMinutes}-${baseMinutes + 2} min`;
}

/**
 * Generate pros for a provider
 */
function generatePros(
  provider: Provider, 
  score: ProviderComparison['score'],
  requirements: JobRequirements
): string[] {
  const pros: string[] = [];
  
  if (provider.pricePerHour < 2.0) {
    pros.push('Competitive pricing');
  }
  if (provider.uptime > 99) {
    pros.push('High reliability (99%+ uptime)');
  }
  if (provider.availability > 0.95) {
    pros.push('High availability');
  }
  if (provider.latency && provider.latency < 60) {
    pros.push('Low latency');
  }
  if (provider.specs.vcpus >= 32) {
    pros.push('High CPU cores');
  }
  if (requirements.gpu?.model && provider.gpuTypes.some(g => 
    g.toLowerCase().includes(requirements.gpu?.model?.toLowerCase() || '')
  )) {
    pros.push(`Matching GPU model (${requirements.gpu.model})`);
  }
  if (score > 80) {
    pros.push('Excellent overall match');
  }
  
  return pros.length > 0 ? pros : ['Balanced performance'];
}

/**
 * Generate cons for a provider
 */
function generateCons(
  provider: Provider,
  score: ProviderComparison['score'],
  requirements: JobRequirements
): string[] {
  const cons: string[] = [];
  
  if (provider.pricePerHour > 3.0) {
    cons.push('Premium pricing');
  }
  if (provider.uptime < 98) {
    cons.push('Lower uptime history');
  }
  if (provider.availability < 0.90) {
    cons.push('Limited availability');
  }
  if (provider.latency && provider.latency > 100) {
    cons.push('Higher latency');
  }
  if (provider.specs.memory < 64) {
    cons.push('Limited memory');
  }
  if (score < 50) {
    cons.push('Poor match for requirements');
  }
  
  return cons;
}

/**
 * Execute provider comparison
 * 
 * @param params - Comparison parameters
 * @returns Comparison results with recommendations
 */
export async function executeCompareProviders(
  params: CompareProvidersParams
): Promise<CompareProvidersResult> {
  try {
    // For now, we only support Akash provider comparison
    // Future: Add io.net, Lambda Labs, etc.
    
    const comparisons: ProviderComparison[] = [];
    const akashSuitability = isAkashSuitable(params.requirements);
    
    // Get providers from Akash
    const filters = {
      gpuType: params.requirements.gpu?.model,
      region: params.requirements.region,
      minVcpus: params.requirements.cpu,
      minMemory: params.requirements.memory ? parseInt(params.requirements.memory) : undefined
    };
    
    const filtered = filterProviders(MOCK_PROVIDERS, filters);
    const ranked = rankProviders(filtered, params.weights);
    
    // Create comparison for Akash
    if (params.providersToCompare.includes('akash')) {
      const bestAkashProvider = ranked.length > 0 ? ranked[0] : null;
      
      if (bestAkashProvider) {
        const provider = bestAkashProvider.provider;
        const score = Math.round(bestAkashProvider.totalScore * 100);
        
        comparisons.push({
          provider: 'akash',
          name: 'Akash Network',
          suitable: akashSuitability.suitable,
          score,
          estimatedCost: provider.pricePerHour,
          timeToDeploy: getTimeToDeploy(provider, params.requirements),
          pros: generatePros(provider, score, params.requirements),
          cons: generateCons(provider, score, params.requirements),
          assessment: akashSuitability.suitable
            ? `Excellent choice for this workload. ${provider.name} offers the best balance of price and performance.`
            : `Not ideal for this workload. ${akashSuitability.reasons.join(', ')}`
        });
      } else {
        comparisons.push({
          provider: 'akash',
          name: 'Akash Network',
          suitable: false,
          score: 0,
          estimatedCost: 0,
          timeToDeploy: 'N/A',
          pros: [],
          cons: ['No providers match requirements'],
          assessment: 'No Akash providers available for these requirements.'
        });
      }
    }
    
    // Placeholder for io.net comparison
    if (params.providersToCompare.includes('ionet')) {
      comparisons.push({
        provider: 'ionet',
        name: 'io.net',
        suitable: false,
        score: 0,
        estimatedCost: 0,
        timeToDeploy: 'N/A',
        pros: [],
        cons: ['Not yet implemented'],
        assessment: 'io.net integration is planned for future release.'
      });
    }
    
    // Placeholder for Lambda Labs comparison
    if (params.providersToCompare.includes('lambda')) {
      comparisons.push({
        provider: 'lambda',
        name: 'Lambda Labs',
        suitable: false,
        score: 0,
        estimatedCost: 0,
        timeToDeploy: 'N/A',
        pros: [],
        cons: ['Not yet implemented'],
        assessment: 'Lambda Labs integration is planned for future release.'
      });
    }
    
    // Find recommended provider (highest score that is suitable)
    const suitableProviders = comparisons.filter(c => c.suitable && c.score > 0);
    const recommended = suitableProviders.length > 0
      ? suitableProviders.sort((a, b) => b.score - a.score)[0].provider
      : undefined;
    
    return {
      success: true,
      comparisons,
      recommended
    };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      comparisons: [],
      error: message
    };
  }
}

/**
 * Compare Providers Tool - ADK FunctionDeclaration
 * 
 * This tool enables the LLM agent to evaluate multiple compute providers
 * before making a routing decision. The agent can compare:
 * - Pricing across providers
 * - Suitability for the specific workload
 * - Time to deploy estimates
 * - Pros and cons of each option
 * 
 * Future providers to add:
 * - io.net: GPU aggregation network
 * - Lambda Labs: High-performance GPU cloud
 * - CoreWeave: Kubernetes-native GPU cloud
 */
export class CompareProvidersTool extends BaseTool {
  constructor() {
    super({
      name: 'compare_providers',
      description: `Compare multiple compute providers for a workload.

Evaluates providers based on:
- Hardware requirements match (GPU, CPU, memory)
- Pricing and cost estimates
- Availability and reliability
- Estimated deployment time

Parameters:
- requirements: Hardware/software requirements
- providersToCompare: Array of provider IDs (e.g., ['akash', 'ionet'])

Currently supported providers:
- akash: Decentralized compute marketplace (auction-based)

Returns: Comparison table with scores, costs, pros/cons, and recommendation.`,
      isLongRunning: false
    });
  }

  /**
   * Execute the tool - called by the ADK agent
   */
  async runAsync(request: RunAsyncToolRequest): Promise<unknown> {
    const { args } = request;

    // Validate required parameters
    if (!args.requirements || typeof args.requirements !== 'object') {
      return JSON.stringify({
        success: false,
        comparisons: [],
        error: 'Missing required parameter: requirements (object)'
      } as CompareProvidersResult);
    }

    if (!Array.isArray(args.providersToCompare) || args.providersToCompare.length === 0) {
      return JSON.stringify({
        success: false,
        comparisons: [],
        error: 'Missing required parameter: providersToCompare (array of strings)'
      } as CompareProvidersResult);
    }

    const params: CompareProvidersParams = {
      requirements: args.requirements as JobRequirements,
      providersToCompare: args.providersToCompare as string[],
      weights: args.weights as SelectionWeights | undefined
    };

    const result = await executeCompareProviders(params);
    return JSON.stringify(result);
  }
}

/**
 * Singleton instance of the CompareProvidersTool
 * Use this when adding tools to the ADK agent
 */
export const compareProvidersTool = new CompareProvidersTool();

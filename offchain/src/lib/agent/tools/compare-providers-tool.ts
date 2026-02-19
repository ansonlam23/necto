/**
 * @title Compare Providers Tool
 * @notice Google ADK FunctionTool for comparing multiple compute providers
 * @dev Uses zod schema so Gemini sees proper function declarations
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { isAkashSuitable } from '../akash-router';
import {
  filterProviders,
  rankProviders,
  type Provider
} from '../provider-selection';
import {
  CompareProvidersParams,
  ProviderComparison,
  CompareProvidersResult
} from '../types/compare-providers';
import { fetchAkashProviders, SynapseProvider } from '@/lib/providers/akash-fetcher';

export type { CompareProvidersParams, ProviderComparison, CompareProvidersResult };

/**
 * Convert SynapseProvider to Provider format for provider-selection.ts
 */
function synapseToProvider(synapse: SynapseProvider): Provider {
  return {
    id: synapse.id,
    name: synapse.name,
    address: synapse.id,
    region: synapse.region || 'unknown',
    gpuTypes: [`NVIDIA ${synapse.hardware.gpuModel.replace(/^NVIDIA\s*/, '')}`],
    pricePerHour: synapse.priceEstimate,
    availability: synapse.uptimePercentage / 100,
    uptime: synapse.uptimePercentage,
    latency: undefined,
    specs: {
      vcpus: synapse.hardware.cpuUnits / 1000,
      memory: synapse.hardware.memoryGB || Math.round(synapse.hardware.memory / (1024 * 1024 * 1024)),
      storage: synapse.hardware.storageGB || 500
    }
  };
}

function getTimeToDeploy(provider: Provider, req: CompareProvidersParams['requirements']): string {
  let baseMinutes = 3;
  if (req.image?.includes('pytorch') || req.image?.includes('tensorflow')) {
    baseMinutes += 2;
  }
  if (req.gpu && req.gpu.units > 0) {
    baseMinutes += 2;
  }
  if (provider.latency && provider.latency > 100) {
    baseMinutes += 1;
  }
  return `~${baseMinutes}-${baseMinutes + 2} min`;
}

function generatePros(
  provider: Provider,
  score: ProviderComparison['score'],
  req: CompareProvidersParams['requirements']
): string[] {
  const pros: string[] = [];
  if (provider.pricePerHour < 2.0) pros.push('Competitive pricing');
  if (provider.uptime > 99) pros.push('High reliability (99%+ uptime)');
  if (provider.availability > 0.95) pros.push('High availability');
  if (provider.latency && provider.latency < 60) pros.push('Low latency');
  if (provider.specs.vcpus >= 32) pros.push('High CPU cores');
  if (req.gpu?.models && req.gpu.models.length > 0) {
    const requestedModel = req.gpu.models[0].toLowerCase();
    const hasMatchingGpu = provider.gpuTypes.some(g =>
      g.toLowerCase().includes(requestedModel)
    );
    if (hasMatchingGpu) pros.push(`Matching GPU model (${req.gpu.models[0]})`);
  } else if (req.gpu?.vendor) {
    const hasMatchingGpu = provider.gpuTypes.some(g =>
      g.toLowerCase().includes(req.gpu?.vendor?.toLowerCase() || '')
    );
    if (hasMatchingGpu) pros.push(`Matching GPU vendor (${req.gpu.vendor})`);
  }
  if (score > 80) pros.push('Excellent overall match');
  return pros.length > 0 ? pros : ['Balanced performance'];
}

function generateCons(
  provider: Provider,
  score: ProviderComparison['score'],
  _req: CompareProvidersParams['requirements']
): string[] {
  const cons: string[] = [];
  if (provider.pricePerHour > 3.0) cons.push('Premium pricing');
  if (provider.uptime < 98) cons.push('Lower uptime history');
  if (provider.availability < 0.90) cons.push('Limited availability');
  if (provider.latency && provider.latency > 100) cons.push('Higher latency');
  if (provider.specs.memory < 64) cons.push('Limited memory');
  if (score < 50) cons.push('Poor match for requirements');
  return cons;
}

/**
 * Execute provider comparison (used by both the tool and fallback)
 */
export async function executeCompareProviders(
  params: CompareProvidersParams
): Promise<CompareProvidersResult> {
  try {
    const comparisons: ProviderComparison[] = [];
    const akashSuitability = isAkashSuitable(params.requirements);

    let providers: Provider[] = [];
    try {
      const synapseProviders = await fetchAkashProviders();
      providers = synapseProviders.map(synapseToProvider);
      console.log(`Fetched ${providers.length} Akash providers for comparison`);
    } catch (error) {
      console.error('Failed to fetch Akash providers:', error);
      providers = [];
    }

    const filters: {
      gpuType?: string;
      region?: string;
      maxPrice?: number;
      minVcpus?: number;
      minMemory?: number;
    } = {};

    if (params.requirements.gpu?.models && params.requirements.gpu.models.length > 0) {
      filters.gpuType = params.requirements.gpu.models[0].toUpperCase();
    } else if (params.requirements.gpu?.vendor) {
      filters.gpuType = params.requirements.gpu.vendor;
    }
    if (params.requirements.region) filters.region = params.requirements.region;
    if (params.requirements.cpu) filters.minVcpus = params.requirements.cpu;
    if (params.requirements.memory) {
      const memoryMatch = params.requirements.memory.match(/(\d+)/);
      if (memoryMatch) filters.minMemory = parseInt(memoryMatch[1], 10);
    }

    console.log('Filtering providers with:', filters);
    const filtered = filterProviders(providers, filters);
    const ranked = rankProviders(filtered, params.weights);
    console.log(`Filtered to ${filtered.length} providers, ranked ${ranked.length}`);

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
          assessment: 'No Akash providers available for these requirements. Try relaxing filters or selecting a different GPU model.'
        });
      }
    }

    if (params.providersToCompare.includes('ionet')) {
      comparisons.push({
        provider: 'ionet', name: 'io.net', suitable: false, score: 0,
        estimatedCost: 0, timeToDeploy: 'N/A', pros: [], cons: ['Not yet implemented'],
        assessment: 'io.net integration is planned for future release.'
      });
    }

    if (params.providersToCompare.includes('lambda')) {
      comparisons.push({
        provider: 'lambda', name: 'Lambda Labs', suitable: false, score: 0,
        estimatedCost: 0, timeToDeploy: 'N/A', pros: [], cons: ['Not yet implemented'],
        assessment: 'Lambda Labs integration is planned for future release.'
      });
    }

    const suitableProviders = comparisons.filter(c => c.suitable && c.score > 0);
    const recommended = suitableProviders.length > 0
      ? suitableProviders.sort((a, b) => b.score - a.score)[0].provider
      : undefined;

    return { success: true, comparisons, recommended };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, comparisons: [], error: message };
  }
}

// Zod schema for the tool parameters
const compareProvidersSchema = z.object({
  providersToCompare: z.array(z.string()).describe('Array of provider IDs to compare, e.g. ["akash", "ionet", "lambda"]. Currently supported: "akash".'),
  gpuModel: z.string().optional().describe('GPU model filter, e.g. "a100", "h100", "rtx4090"'),
  gpuVendor: z.string().optional().describe('GPU vendor filter, e.g. "nvidia"'),
  region: z.string().optional().describe('Region filter, e.g. "US", "EU"'),
  maxPricePerHour: z.number().optional().describe('Maximum price per hour in USD'),
});

/**
 * ADK FunctionTool for comparing providers
 */
export const compareProvidersTool = new FunctionTool({
  name: 'compare_providers',
  description: 'Compare compute providers for a workload. Evaluates pricing, hardware match, availability, and deployment time. Returns scored comparisons with a recommendation. Always call this before route_to_akash.',
  parameters: compareProvidersSchema,
  execute: async ({ providersToCompare, gpuModel, gpuVendor, region, maxPricePerHour }) => {
    console.log('[TOOL] compare_providers called with:', { providersToCompare, gpuModel, gpuVendor, region, maxPricePerHour });

    const requirements: CompareProvidersParams['requirements'] = {
      name: 'comparison',
      image: 'ubuntu:22.04',
    };

    if (gpuModel || gpuVendor) {
      requirements.gpu = {
        units: 1,
        vendor: gpuVendor || 'nvidia',
        ...(gpuModel ? { models: [gpuModel] } : {})
      };
    }
    if (region) requirements.region = region;

    const result = await executeCompareProviders({
      requirements,
      providersToCompare
    });

    return result;
  }
});

// Legacy class name kept as alias for backwards compatibility
export const CompareProvidersTool = compareProvidersTool;

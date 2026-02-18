/**
 * Provider Selection Algorithm
 * Multi-factor ranking based on latency, uptime, price, and specs
 */

export interface Provider {
  id: string;
  name: string;
  address: string;
  region: string;
  gpuTypes: string[];
  pricePerHour: number; // In USD
  availability: number; // 0-1
  uptime: number; // Percentage
  latency?: number; // ms
  specs: {
    vcpus: number;
    memory: number; // GB
    storage: number; // GB
  };
}

export interface ProviderScore {
  provider: Provider;
  totalScore: number;
  priceScore: number;
  reliabilityScore: number;
  performanceScore: number;
  latencyScore: number;
}

export interface SelectionWeights {
  price: number;
  reliability: number;
  performance: number;
  latency: number;
}

const DEFAULT_WEIGHTS: SelectionWeights = {
  price: 0.35,
  reliability: 0.25,
  performance: 0.25,
  latency: 0.15
};

/**
 * Calculate price score (lower is better)
 * Uses inverse normalization
 */
function calculatePriceScore(price: number, minPrice: number, maxPrice: number): number {
  if (maxPrice === minPrice) return 1;
  return 1 - ((price - minPrice) / (maxPrice - minPrice));
}

/**
 * Calculate reliability score from availability and uptime
 */
function calculateReliabilityScore(availability: number, uptime: number): number {
  const availabilityWeight = 0.4;
  const uptimeWeight = 0.6;
  return (availability * availabilityWeight) + ((uptime / 100) * uptimeWeight);
}

/**
 * Calculate performance score from specs
 */
function calculatePerformanceScore(
  specs: Provider['specs'],
  minSpecs: Provider['specs'],
  maxSpecs: Provider['specs']
): number {
  const vcpuScore = (specs.vcpus - minSpecs.vcpus) / (maxSpecs.vcpus - minSpecs.vcpus || 1);
  const memoryScore = (specs.memory - minSpecs.memory) / (maxSpecs.memory - minSpecs.memory || 1);
  const storageScore = (specs.storage - minSpecs.storage) / (maxSpecs.storage - minSpecs.storage || 1);

  return (vcpuScore + memoryScore + storageScore) / 3;
}

/**
 * Calculate latency score (lower is better)
 */
function calculateLatencyScore(latency: number, minLatency: number, maxLatency: number): number {
  if (!latency) return 0.5; // Neutral if unknown
  if (maxLatency === minLatency) return 1;
  return 1 - ((latency - minLatency) / (maxLatency - minLatency));
}

/**
 * Rank providers by composite score
 */
export function rankProviders(
  providers: Provider[],
  weights: SelectionWeights = DEFAULT_WEIGHTS
): ProviderScore[] {
  if (providers.length === 0) return [];

  // Calculate ranges for normalization
  const prices = providers.map(p => p.pricePerHour);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const vcpus = providers.map(p => p.specs.vcpus);
  const memory = providers.map(p => p.specs.memory);
  const storage = providers.map(p => p.specs.storage);

  const minSpecs = {
    vcpus: Math.min(...vcpus),
    memory: Math.min(...memory),
    storage: Math.min(...storage)
  };

  const maxSpecs = {
    vcpus: Math.max(...vcpus),
    memory: Math.max(...memory),
    storage: Math.max(...storage)
  };

  const latencies = providers
    .map(p => p.latency)
    .filter((l): l is number => l !== undefined);

  const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 100;

  // Score each provider
  const scored: ProviderScore[] = providers.map(provider => {
    const priceScore = calculatePriceScore(provider.pricePerHour, minPrice, maxPrice);
    const reliabilityScore = calculateReliabilityScore(provider.availability, provider.uptime);
    const performanceScore = calculatePerformanceScore(provider.specs, minSpecs, maxSpecs);
    const latencyScore = calculateLatencyScore(provider.latency || 0, minLatency, maxLatency);

    const totalScore =
      (priceScore * weights.price) +
      (reliabilityScore * weights.reliability) +
      (performanceScore * weights.performance) +
      (latencyScore * weights.latency);

    return {
      provider,
      totalScore,
      priceScore,
      reliabilityScore,
      performanceScore,
      latencyScore
    };
  });

  // Sort by total score descending
  return scored.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Select best provider from list
 */
export function selectProvider(
  providers: Provider[],
  weights?: SelectionWeights
): Provider | null {
  const ranked = rankProviders(providers, weights);
  return ranked.length > 0 ? ranked[0].provider : null;
}

/**
 * Filter providers by requirements
 */
export function filterProviders(
  providers: Provider[],
  filters: {
    gpuType?: string;
    region?: string;
    maxPrice?: number;
    minAvailability?: number;
    minVcpus?: number;
    minMemory?: number;
  }
): Provider[] {
  return providers.filter(p => {
    if (filters.gpuType) {
      const filterLower = filters.gpuType.toLowerCase();
      const hasMatchingGpu = p.gpuTypes.some(gpu =>
        gpu.toLowerCase().includes(filterLower)
      );
      if (!hasMatchingGpu) return false;
    }
    if (filters.region && p.region !== filters.region) {
      return false;
    }
    if (filters.maxPrice && p.pricePerHour > filters.maxPrice) {
      return false;
    }
    if (filters.minAvailability && p.availability < filters.minAvailability) {
      return false;
    }
    if (filters.minVcpus && p.specs.vcpus < filters.minVcpus) {
      return false;
    }
    if (filters.minMemory && p.specs.memory < filters.minMemory) {
      return false;
    }
    return true;
  });
}

/**
 * Get provider recommendations with explanations
 */
export function getProviderRecommendations(
  scored: ProviderScore[],
  limit: number = 3
): Array<{ provider: Provider; score: number; reason: string }> {
  return scored.slice(0, limit).map(s => {
    const strengths: string[] = [];

    if (s.priceScore > 0.8) strengths.push('best price');
    if (s.reliabilityScore > 0.8) strengths.push('high reliability');
    if (s.performanceScore > 0.8) strengths.push('great performance');
    if (s.latencyScore > 0.8) strengths.push('low latency');

    const reason = strengths.length > 0
      ? `Selected for ${strengths.join(', ')}`
      : 'Balanced overall score';

    return {
      provider: s.provider,
      score: s.totalScore,
      reason
    };
  });
}

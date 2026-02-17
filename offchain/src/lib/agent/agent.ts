/**
 * @title Google ADK Agent
 * @notice Main agent implementation using Google ADK and AI Studio
 * @dev Routes compute jobs to Akash providers and handles blockchain transactions
 */

import { LlmAgent } from '@google/adk'
import { fetchAkashProviders, type SynapseProvider } from '@/lib/providers/akash-fetcher'
import { walletTool, submitJobTransaction, recordRoutingDecision, hashJobDetails, hashRoutingDecision } from './wallet-tool'
import type { AgentConfig, RoutingRequest, RoutingResult, TransactionResult, ThinkingStep } from './types'

/**
 * Create the routing agent with Google AI Studio
 */
export function createRoutingAgent(config: AgentConfig): LlmAgent {
  const agent = new LlmAgent({
    name: config.name,
    model: config.model,
    description: `You are a compute marketplace routing agent. Your job is to:
1. Analyze job requirements
2. Fetch available GPU providers from Akash Network
3. Rank providers by price, availability, and hardware match
4. Select the best provider for the job
5. Submit the job to the blockchain if tracking is enabled

Use the submit_job_to_blockchain tool to record jobs on-chain.
Provide clear reasoning for your routing decisions.`,
    tools: [walletTool]
  })
  
  return agent
}

/**
 * Route a compute job using the agent
 * This is the main entry point for job routing
 */
export async function routeComputeJob(
  request: RoutingRequest,
  config: AgentConfig,
  onThinking?: (step: ThinkingStep) => void
): Promise<{ result: RoutingResult; transaction?: TransactionResult }> {
  // Step 1: Fetch providers
  onThinking?.({
    id: '1',
    message: 'Fetching providers from Akash Network...',
    status: 'active',
    timestamp: Date.now()
  })
  
  const providers = await fetchAkashProviders()
  
  if (providers.length === 0) {
    throw new Error('Provider fetch failed — no providers available from Akash Network or fallback')
  }
  
  onThinking?.({
    id: '1',
    message: `Found ${providers.length} GPU providers`,
    status: 'complete',
    timestamp: Date.now()
  })
  
  // Step 2: Normalize pricing
  onThinking?.({
    id: '2',
    message: 'Normalizing pricing across providers...',
    status: 'active',
    timestamp: Date.now()
  })
  
  // Filter by requirements
  const filteredProviders = filterProviders(providers, request.requirements)
  
  onThinking?.({
    id: '2',
    message: `${filteredProviders.length} providers match requirements`,
    status: 'complete',
    timestamp: Date.now()
  })
  
  // Step 3: Rank and select
  onThinking?.({
    id: '3',
    message: 'Ranking providers by cost-performance...',
    status: 'active',
    timestamp: Date.now()
  })
  
  const rankedProviders = rankProviders(filteredProviders, request.requirements)
  
  if (rankedProviders.length === 0) {
    throw new Error(
      `No providers match requirements after filtering ${providers.length} available providers. ` +
      `Try relaxing constraints: raise max price, remove GPU model filter, or clear region.`
    )
  }
  
  const selectedProvider = rankedProviders[0]
  
  onThinking?.({
    id: '3',
    message: `Selected: ${selectedProvider.name} ($${selectedProvider.priceEstimate}/hr)`,
    status: 'complete',
    timestamp: Date.now()
  })
  
  // Step 4: Decision ready
  onThinking?.({
    id: '4',
    message: 'Routing decision ready',
    status: 'complete',
    timestamp: Date.now()
  })
  
  const result: RoutingResult = {
    provider: selectedProvider,
    reasoning: `Selected ${selectedProvider.name} based on price (${selectedProvider.priceEstimate}/hr), ` +
               `hardware (${selectedProvider.hardware.gpuModel}), and uptime (${selectedProvider.uptimePercentage}%)`,
    estimatedCost: selectedProvider.priceEstimate,
    // TODO: Add confidence score
    confidence: 0.9
  }
  
  // Step 5: Submit to blockchain if tracked
  let transaction: TransactionResult | undefined
  
  if (request.isTracked) {
    onThinking?.({
      id: '5',
      message: 'Submitting job to blockchain...',
      status: 'active',
      timestamp: Date.now()
    })
    
    const detailsHash = hashJobDetails({
      description: request.description,
      requirements: request.requirements,
      timestamp: Date.now()
    })
    
    transaction = await submitJobTransaction(
      request.userAddress,
      detailsHash,
      true
    )
    
    if (transaction.success) {
      onThinking?.({
        id: '5',
        message: `Job submitted on-chain (tx: ${transaction.hash?.slice(0, 10)}...)`,
        status: 'complete',
        timestamp: Date.now()
      })
      
      // Record routing decision if job ID is available
      if (transaction.jobId) {
        const routingHash = hashRoutingDecision({
          provider: selectedProvider.id,
          price: selectedProvider.priceEstimate,
          reasoning: result.reasoning,
          timestamp: Date.now()
        })
        
        await recordRoutingDecision(
          transaction.jobId,
          selectedProvider.id as `0x${string}`,
          BigInt(Math.floor(selectedProvider.priceEstimate * 1e6)), // Convert to micro-USDC
          routingHash
        )
      }
    } else {
      onThinking?.({
        id: '5',
        message: `Transaction failed: ${transaction.error}`,
        status: 'error',
        timestamp: Date.now()
      })
    }
  }
  
  return { result, transaction }
}

/**
 * Filter providers by requirements
 */
function filterProviders(
  providers: SynapseProvider[],
  requirements: RoutingRequest['requirements']
): SynapseProvider[] {
  return providers.filter(p => {
    // Filter by GPU model if specified
    if (requirements.gpuModel && !p.hardware.gpuModel.includes(requirements.gpuModel)) {
      return false
    }
    
    // Filter by minimum GPU count
    if (requirements.minGpuCount && p.hardware.gpuCount < requirements.minGpuCount) {
      return false
    }
    
    // Filter by max price
    if (requirements.maxPricePerHour && p.priceEstimate > requirements.maxPricePerHour) {
      return false
    }
    
    // Filter by region
    if (requirements.region && p.region && !p.region.toLowerCase().includes(requirements.region.toLowerCase())) {
      return false
    }
    
    return true
  })
}

/**
 * Rank providers by best value
 * Considers price, uptime, and hardware match
 */
function rankProviders(
  providers: SynapseProvider[],
  requirements: RoutingRequest['requirements']
): SynapseProvider[] {
  return [...providers].sort((a, b) => {
    // Primary: Price (lower is better)
    const priceScoreA = 1 / (a.priceEstimate + 0.01)
    const priceScoreB = 1 / (b.priceEstimate + 0.01)
    
    // Secondary: Uptime (higher is better)
    const uptimeScoreA = a.uptimePercentage / 100
    const uptimeScoreB = b.uptimePercentage / 100
    
    // Combined score (weighted)
    const scoreA = priceScoreA * 0.7 + uptimeScoreA * 0.3
    const scoreB = priceScoreB * 0.7 + uptimeScoreB * 0.3
    
    return scoreB - scoreA
  })
}

/**
 * Quick route without thinking steps
 * Used for auto-sign mode
 */
export async function quickRoute(
  request: RoutingRequest,
  config: AgentConfig
): Promise<{ result: RoutingResult; transaction?: TransactionResult }> {
  return routeComputeJob(request, config)
}

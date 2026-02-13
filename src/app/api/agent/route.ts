/**
 * Agent API Route
 * 
 * HTTP endpoint for job submission and agent health checks.
 * Provides REST API for frontend integration.
 * 
 * Endpoints:
 * - POST /api/agent - Submit a job request
 * - GET /api/agent - Health check and provider count
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agent';
import { JobRequest, JobConstraints, IdentityMode } from '@/types/job';
import { GpuType, PricingModel } from '@/types/provider';
import { registry } from '@/lib/provider-registry';

/**
 * Request validation result
 */
interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Validate incoming job request
 * 
 * Checks required fields and format constraints
 */
function validateJobRequest(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const req = body as Record<string, unknown>;

  // Required: buyerAddress
  if (!req.buyerAddress || typeof req.buyerAddress !== 'string') {
    errors.push('buyerAddress is required and must be a string');
  } else if (!/^0x[a-fA-F0-9]{40}$/.test(req.buyerAddress)) {
    errors.push('buyerAddress must be a valid Ethereum address (0x...40 hex chars)');
  }

  // Required: gpuCount
  if (typeof req.gpuCount !== 'number' || req.gpuCount < 1 || req.gpuCount > 128) {
    errors.push('gpuCount is required and must be a number between 1 and 128');
  }

  // Required: durationHours
  if (typeof req.durationHours !== 'number' || req.durationHours < 0.5 || req.durationHours > 720) {
    errors.push('durationHours is required and must be a number between 0.5 and 720');
  }

  // Optional: constraints
  if (req.constraints !== undefined) {
    if (typeof req.constraints !== 'object' || req.constraints === null) {
      errors.push('constraints must be an object if provided');
    } else {
      const constraints = req.constraints as Record<string, unknown>;

      // Validate identityMode
      if (constraints.identityMode !== undefined) {
        if (!Object.values(IdentityMode).includes(constraints.identityMode as IdentityMode)) {
          errors.push(`identityMode must be one of: ${Object.values(IdentityMode).join(', ')}`);
        }
      }

      // Validate maxPricePerHour
      if (constraints.maxPricePerHour !== undefined) {
        if (typeof constraints.maxPricePerHour !== 'number' || constraints.maxPricePerHour <= 0) {
          errors.push('maxPricePerHour must be a positive number');
        }
      }

      // Validate requiredGpuType
      if (constraints.requiredGpuType !== undefined) {
        if (!Object.values(GpuType).includes(constraints.requiredGpuType as GpuType)) {
          errors.push(`requiredGpuType must be one of: ${Object.values(GpuType).join(', ')}`);
        }
      }

      // Validate preferredRegions
      if (constraints.preferredRegions !== undefined) {
        if (!Array.isArray(constraints.preferredRegions)) {
          errors.push('preferredRegions must be an array');
        } else {
          const validRegionCodes = ['us-east', 'us-west', 'us-central', 'eu-west', 
            'eu-central', 'eu-north', 'ap-south', 'ap-northeast', 'ap-southeast', 'sa-east'];
          const validRegions = constraints.preferredRegions.every(r => 
            validRegionCodes.includes(r as string)
          );
          if (!validRegions) {
            errors.push(`preferredRegions must contain valid region codes: ${validRegionCodes.join(', ')}`);
          }
        }
      }

      // Validate excludePricingModels
      if (constraints.excludePricingModels !== undefined) {
        if (!Array.isArray(constraints.excludePricingModels)) {
          errors.push('excludePricingModels must be an array');
        } else {
          const validModels = constraints.excludePricingModels.every(m => 
            Object.values(PricingModel).includes(m as PricingModel)
          );
          if (!validModels) {
            errors.push(`excludePricingModels must contain valid pricing models: ${Object.values(PricingModel).join(', ')}`);
          }
        }
      }

      // Validate minReputationScore
      if (constraints.minReputationScore !== undefined) {
        if (typeof constraints.minReputationScore !== 'number' || 
            constraints.minReputationScore < 0 || 
            constraints.minReputationScore > 100) {
          errors.push('minReputationScore must be a number between 0 and 100');
        }
      }

      // Validate allowSpot
      if (constraints.allowSpot !== undefined && typeof constraints.allowSpot !== 'boolean') {
        errors.push('allowSpot must be a boolean');
      }
    }
  }

  return { 
    valid: errors.length === 0, 
    errors: errors.length > 0 ? errors : undefined 
  };
}

/**
 * Generate unique job ID
 */
function generateJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * POST /api/agent
 * 
 * Submit a job request to the agent for processing.
 * Returns provider recommendations and reasoning hash.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request
    const validation = validateJobRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    const bodyData = body as {
      buyerAddress: string;
      gpuCount: number;
      durationHours: number;
      constraints?: Partial<JobConstraints>;
      teamMemberId?: string;
      organizationId?: string;
      name?: string;
    };

    // Build job request
    const jobRequest: JobRequest = {
      id: generateJobId(),
      buyerAddress: bodyData.buyerAddress,
      gpuCount: bodyData.gpuCount,
      durationHours: bodyData.durationHours,
      constraints: {
        identityMode: bodyData.constraints?.identityMode || IdentityMode.UNTRACKED,
        maxPricePerHour: bodyData.constraints?.maxPricePerHour,
        preferredRegions: bodyData.constraints?.preferredRegions,
        requiredGpuType: bodyData.constraints?.requiredGpuType,
        excludePricingModels: bodyData.constraints?.excludePricingModels,
        minReputationScore: bodyData.constraints?.minReputationScore,
        allowSpot: bodyData.constraints?.allowSpot,
      },
      teamMemberId: bodyData.teamMemberId,
      organizationId: bodyData.organizationId,
      name: bodyData.name,
      createdAt: new Date(),
    };

    console.log('[API] Processing job:', jobRequest.id);

    // Process job through orchestrator
    const result = await orchestrator.processJob(jobRequest);

    // Build response
    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      recommendations: result.recommendations.map(rec => ({
        rank: rec.rank,
        provider: {
          id: rec.provider.id,
          name: rec.provider.name,
          type: rec.provider.type,
          pricingModel: rec.provider.pricingModel,
        },
        normalizedPrice: {
          effectiveUsdPerA100Hour: rec.normalizedPrice.effectiveUsdPerA100Hour,
          usdPerGpuHour: rec.normalizedPrice.usdPerGpuHour,
          a100Equivalent: rec.normalizedPrice.a100Equivalent,
        },
        totalScore: rec.totalScore,
        scoreBreakdown: rec.scoreBreakdown,
        tradeoffs: rec.tradeoffs,
        estimatedSavings: rec.estimatedSavings,
      })),
      selectedProvider: {
        id: result.selectedProviderId,
        name: result.selectedProviderName,
        type: result.selectedProviderType,
      },
      totalCost: result.totalCost,
      reasoningHash: result.reasoningHash,
      status: result.status,
      metrics: {
        pipelineDurationMs: result.metrics.totalMs,
        providerCounts: result.providerCounts,
      },
    });

  } catch (error) {
    console.error('[API] Agent processing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Agent processing failed', 
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent
 * 
 * Health check endpoint that returns agent status and provider information.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const providers = registry.getAll();
    const stats = registry.getStats();

    return NextResponse.json({
      status: 'ok',
      agent: {
        version: '1.0.0',
        initialized: true,
      },
      providers: {
        count: providers.length,
        stats: {
          byType: stats.byType,
          byPricingModel: stats.byPricingModel,
          avgReputation: Math.round(stats.avgReputation * 10) / 10,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Health check error:', error);
    
    return NextResponse.json(
      { 
        error: 'Health check failed',
        status: 'error'
      },
      { status: 500 }
    );
  }
}

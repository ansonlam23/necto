/**
 * @title Route Job API
 * @notice Server-side API route for invoking the compute routing agent
 * @dev Accepts job requirements, runs routeComputeJob, returns result with thinking steps
 */

import { NextRequest, NextResponse } from 'next/server'
import { routeComputeJob } from '@/lib/agent/agent'
import type { AgentConfig, ThinkingStep, RoutingResult, TransactionResult } from '@/lib/agent/types'

interface RouteJobRequestBody {
  description: string
  requirements: {
    gpuModel?: string
    minGpuCount?: number
    maxPricePerHour?: number
    region?: string
  }
  isTracked?: boolean
  userAddress?: string
}

interface RouteJobSuccessResponse {
  success: true
  result: RoutingResult
  thinkingSteps: ThinkingStep[]
  transaction?: TransactionResult
}

interface RouteJobErrorResponse {
  success: false
  error: string
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<RouteJobSuccessResponse | RouteJobErrorResponse>> {
  try {
    const body: RouteJobRequestBody = await request.json()

    // Validate required fields
    if (!body.description || typeof body.description !== 'string' || body.description.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: description' },
        { status: 400 }
      )
    }

    // Get API key and set it in environment for Google ADK
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Set the API key in environment for Google GenAI library
    process.env.GOOGLE_GENAI_API_KEY = apiKey

    const agentConfig: AgentConfig = {
      apiKey,
      model: 'gemini-2.5-flash',
      name: 'necto_router'
    }

    // Collect thinking steps as they come in
    const thinkingSteps: ThinkingStep[] = []

    const onThinking = (step: ThinkingStep) => {
      // Upsert: if step with same id exists, update it; otherwise push
      const existingIndex = thinkingSteps.findIndex(s => s.id === step.id)
      if (existingIndex >= 0) {
        thinkingSteps[existingIndex] = step
      } else {
        thinkingSteps.push(step)
      }
    }

    const { result, transaction } = await routeComputeJob(
      {
        description: body.description.trim(),
        requirements: body.requirements || {},
        isTracked: body.isTracked ?? false,
        userAddress: (body.userAddress as `0x${string}`) || '0x0000000000000000000000000000000000000000'
      },
      agentConfig,
      onThinking
    )

    return NextResponse.json({
      success: true,
      result,
      thinkingSteps,
      transaction
    })
  } catch (error) {
    console.error('Route job error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

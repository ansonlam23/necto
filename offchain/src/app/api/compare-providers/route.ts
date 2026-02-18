/**
 * @title Compare Providers API Route
 * @notice API endpoint for comparing compute providers
 * @dev Calls the ADK compareProvidersTool and returns results
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeCompareProviders } from '@/lib/agent/tools/compare-providers-tool';
import { CompareProvidersParams } from '@/lib/agent/types/compare-providers';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.requirements || typeof body.requirements !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: requirements' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(body.providersToCompare) || body.providersToCompare.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: providersToCompare' },
        { status: 400 }
      );
    }
    
    const params: CompareProvidersParams = {
      requirements: body.requirements,
      providersToCompare: body.providersToCompare,
      weights: body.weights
    };
    
    const result = await executeCompareProviders(params);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Compare providers API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        comparisons: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

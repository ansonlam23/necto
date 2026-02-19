import { NextRequest, NextResponse } from 'next/server';
import { getConsoleClient } from '@/lib/akash/console-api';
import { SdlSpec } from '@/types/akash';

/**
 * GET /api/deployments
 * List deployments for authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // TODO: Get authenticated user from session/JWT
    const userAddress = request.headers.get('x-user-address');
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const client = getConsoleClient();
    const deployments = await client.listDeployments(userAddress);

    return NextResponse.json({
      success: true,
      deployments: deployments.map(d => ({
        id: d.id,
        dseq: d.dseq,
        status: d.status,
        createdAt: d.createdAt,
        expiresAt: d.expiresAt,
        leases: d.leases.length,
        serviceName: Object.keys(d.sdl.services)[0] || 'unknown'
      }))
    });
  } catch (error) {
    console.error('Failed to list deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deployments
 * Create a new deployment from SDL
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userAddress = request.headers.get('x-user-address');
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sdl, autoAcceptBid = false }: { sdl: SdlSpec; autoAcceptBid?: boolean } = body;

    // Validate SDL
    if (!sdl || !sdl.version || !sdl.services) {
      return NextResponse.json(
        { error: 'Invalid SDL: missing required fields' },
        { status: 400 }
      );
    }

    // Validate services
    for (const [name, service] of Object.entries(sdl.services)) {
      if (!service.image) {
        return NextResponse.json(
          { error: `Invalid SDL: service "${name}" missing image` },
          { status: 400 }
        );
      }
    }

    const client = getConsoleClient();
    const deployment = await client.createDeployment(sdl);

    // If auto-accept is enabled and bids come in quickly, accept the first one
    let acceptedBid = null;
    if (autoAcceptBid) {
      try {
        // Wait a short time for bids to come in
        await new Promise(resolve => setTimeout(resolve, 5000));
        const bids = await client.getBids(deployment.id);
        
        if (bids.length > 0) {
          if (!deployment.manifest) {
            throw new Error('Missing deployment manifest for lease creation');
          }
          // Accept the first (usually cheapest) bid
          const bid = bids[0];
          await client.acceptBid(deployment.id, bid.id, deployment.manifest);
          acceptedBid = bid;
        }
      } catch (bidError) {
        console.warn('Auto-accept bid failed:', bidError);
        // Don't fail the deployment creation if bid acceptance fails
      }
    }

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        dseq: deployment.dseq,
        status: deployment.status,
        createdAt: deployment.createdAt,
        acceptedBid: acceptedBid ? {
          id: acceptedBid.id,
          provider: acceptedBid.provider,
          price: acceptedBid.price
        } : null
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create deployment:', error);
    return NextResponse.json(
      { error: 'Failed to create deployment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

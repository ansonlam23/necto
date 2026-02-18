import { NextRequest, NextResponse } from 'next/server';
import { getConsoleClient } from '@/lib/akash/console-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/deployments/[id]
 * Get deployment details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userAddress = request.headers.get('x-user-address');
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Deployment ID required' },
        { status: 400 }
      );
    }

    const client = getConsoleClient();
    const deployment = await client.getDeployment(id);

    // Verify ownership
    if (deployment.owner !== userAddress) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        owner: deployment.owner,
        dseq: deployment.dseq,
        status: deployment.status,
        createdAt: deployment.createdAt,
        expiresAt: deployment.expiresAt,
        services: Object.keys(deployment.sdl.services),
        leases: deployment.leases.map(lease => ({
          id: lease.id,
          provider: lease.provider,
          status: lease.status,
          price: lease.price,
          createdAt: lease.createdAt
        })),
        sdl: deployment.sdl
      }
    });
  } catch (error) {
    console.error('Failed to get deployment:', error);
    
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch deployment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deployments/[id]
 * Close/cancel a deployment
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userAddress = request.headers.get('x-user-address');
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Deployment ID required' },
        { status: 400 }
      );
    }

    const client = getConsoleClient();
    
    // Get deployment first to verify ownership
    const deployment = await client.getDeployment(id);
    
    if (deployment.owner !== userAddress) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Close the deployment
    await client.closeDeployment(id);

    return NextResponse.json({
      success: true,
      message: 'Deployment closed successfully',
      deploymentId: id,
      closedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to close deployment:', error);
    
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to close deployment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

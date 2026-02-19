import { NextRequest, NextResponse } from 'next/server';
import { getConsoleClient } from '@/lib/akash/console-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/deployments/[id]/bids
 * List bids for a deployment
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const client = getConsoleClient();
    const bids = await client.getBids(id);
    return NextResponse.json({ success: true, bids });
  } catch (error) {
    console.error('Failed to get bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deployments/[id]/bids
 * Accept a bid: { bidId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { bidId }: { bidId: string } = await request.json();

    if (!bidId) {
      return NextResponse.json({ error: 'bidId is required' }, { status: 400 });
    }

    const client = getConsoleClient();
    const deployment = await client.getDeployment(id);
    if (!deployment.manifest) {
      return NextResponse.json(
        { error: 'Missing deployment manifest for lease creation' },
        { status: 400 }
      );
    }
    const lease = await client.acceptBid(id, bidId, deployment.manifest);
    const bids = await client.getBids(id);

    return NextResponse.json({ success: true, lease, bids });
  } catch (error) {
    console.error('Failed to accept bid:', error);
    return NextResponse.json(
      { error: 'Failed to accept bid', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

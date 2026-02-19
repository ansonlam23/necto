import { NextRequest, NextResponse } from 'next/server';
import { routeToAkash } from '@/lib/agent/akash-router';
import { JobRequirements } from '@/lib/akash/sdl-generator';

/**
 * POST /api/akash/route
 * Server-side Akash routing — keeps AKASH_CONSOLE_API_KEY server-only.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      requirements,
      autoAcceptBid = false,
      jobId,
    }: { requirements: JobRequirements; autoAcceptBid?: boolean; jobId?: string } = body;

    if (!requirements) {
      return NextResponse.json({ error: 'requirements is required' }, { status: 400 });
    }

    const logs: import('@/lib/agent/akash-router').RouteLog[] = [];

    const result = await routeToAkash(
      {
        jobId: jobId || `job-${Date.now()}`,
        requirements,
        autoAcceptBid,
        bidTimeoutMs: 60000, // 1 minute — suitable for demo
      },
      (log) => logs.push(log)
    );

    return NextResponse.json({ ...result, logs });
  } catch (error) {
    console.error('Akash route error:', error);
    return NextResponse.json(
      { error: 'Routing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

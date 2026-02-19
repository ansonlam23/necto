import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { adiTestnet } from '@/lib/adi-chain';
import { COMPUTE_ROUTER_ABI, COMPUTE_ROUTER_ADDRESS } from '@/lib/contracts/compute-router';

// Create public client for reading from blockchain
const publicClient = createPublicClient({
  chain: adiTestnet,
  transport: http(process.env.ADI_TESTNET_RPC_URL || 'https://rpc.ab.testnet.adifoundation.ai/')
});

/**
 * GET /api/job-count
 * Returns the current job count from the ComputeRouter contract
 * Used to determine the next job ID after submitting a job
 */
export async function GET(): Promise<NextResponse> {
  try {
    const count = await publicClient.readContract({
      address: COMPUTE_ROUTER_ADDRESS,
      abi: COMPUTE_ROUTER_ABI,
      functionName: 'jobCount'
    });

    return NextResponse.json({
      success: true,
      count: count.toString()
    });
  } catch (error) {
    console.error('Failed to get job count:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch job count',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

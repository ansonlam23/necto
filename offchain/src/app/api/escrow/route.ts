import { NextRequest, NextResponse } from 'next/server';
import { encodeFunctionData, createPublicClient, http } from 'viem';
import { adiTestnet } from '@/lib/adi-chain';
import { 
  ESCROW_ABI, 
  ESCROW_ADDRESS, 
  EscrowStatus 
} from '@/lib/contracts/testnet-usdc-escrow';

// Testnet USDC contract address on ADI Testnet
const TESTNET_USDC_ADDRESS = process.env.TESTNET_USDC_CONTRACT || '0x0000000000000000000000000000000000000000';
const ADI_TESTNET_CHAIN_ID = 99999;

// Create public client for reading from blockchain
const publicClient = createPublicClient({
  chain: adiTestnet,
  transport: http(process.env.ADI_TESTNET_RPC_URL || 'https://rpc.ab.testnet.adifoundation.ai/')
});

/**
 * Map contract escrow status to API status string
 */
function mapEscrowStatus(status: number): 'active' | 'released' | 'refunded' {
  switch (status) {
    case EscrowStatus.Active:
      return 'active';
    case EscrowStatus.Released:
      return 'released';
    case EscrowStatus.Refunded:
      return 'refunded';
    default:
      return 'active';
  }
}

/**
 * GET /api/escrow
 * Get escrow status for a job
 * 
 * Note: Since we don't have an indexer, this endpoint has limited functionality.
 * In production, you would query an indexer or backend database to get all escrows
 * for a user. For now, it only supports fetching a specific escrow by jobId.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userAddress = request.headers.get('x-user-address');
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!userAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // If jobId provided, return specific escrow from contract
    if (jobId) {
      try {
        const escrow = await publicClient.readContract({
          address: ESCROW_ADDRESS as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'getEscrow',
          args: [BigInt(jobId)]
        });

        // Verify ownership
        if (escrow.depositor.toLowerCase() !== userAddress.toLowerCase()) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          escrow: {
            jobId,
            depositor: escrow.depositor,
            amount: escrow.amount.toString(),
            status: mapEscrowStatus(Number(escrow.status)),
            createdAt: new Date(Number(escrow.createdAt) * 1000).toISOString()
          }
        });
      } catch (error) {
        console.error('Contract read error:', error);
        return NextResponse.json(
          { error: 'Escrow not found on blockchain' },
          { status: 404 }
        );
      }
    }

    // Without an indexer, we cannot list all escrows for a user
    // In production, query an indexer or backend database
    return NextResponse.json({
      success: true,
      escrows: [],
      summary: {
        totalEscrows: 0,
        totalDeposited: '0',
        activeCount: 0,
        pendingCount: 0,
        note: 'Escrow listing requires an indexer. Use jobId parameter to fetch specific escrow.'
      }
    });
  } catch (error) {
    console.error('Failed to get escrow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escrow data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/escrow
 * Create escrow deposit (returns transaction data for client-side signing)
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
    const { jobId, amount, deploymentId }: { 
      jobId: string; 
      amount: string; 
      deploymentId?: string;
    } = body;

    // Validate inputs
    if (!jobId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId and amount' },
        { status: 400 }
      );
    }

    // Validate amount is a valid number
    try {
      const amountBigInt = BigInt(amount);
      if (amountBigInt <= 0) {
        return NextResponse.json(
          { error: 'Amount must be greater than 0' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid amount format' },
        { status: 400 }
      );
    }

    // Check if escrow already exists for this job
    try {
      const existingEscrow = await publicClient.readContract({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'getEscrow',
        args: [BigInt(jobId)]
      });

      // If depositor is not zero address, escrow exists
      if (existingEscrow.depositor !== '0x0000000000000000000000000000000000000000') {
        return NextResponse.json(
          { error: 'Escrow already exists for this job' },
          { status: 409 }
        );
      }
    } catch {
      // If contract read fails, continue (escrow likely doesn't exist)
    }

    // Build transaction data for client-side signing
    // This is the data the client will sign and send to the blockchain
    const transactionData = {
      to: ESCROW_ADDRESS,
      data: buildEscrowDepositCalldata(jobId, amount),
      value: '0',
      chainId: ADI_TESTNET_CHAIN_ID,
      // Gas estimation - client should override
      gasLimit: '200000',
    };

    return NextResponse.json({
      success: true,
      message: 'Escrow deposit transaction created',
      escrow: {
        jobId,
        depositor: userAddress,
        amount,
        status: 'pending',
        createdAt: new Date().toISOString(),
        deploymentId
      },
      transaction: {
        ...transactionData,
        // Human-readable info for wallet display
        description: `Deposit ${formatUSDC(amount)} USDC to escrow for job ${jobId}`,
        network: 'ADI Testnet',
        token: {
          symbol: 'USDC',
          decimals: 6,
          address: TESTNET_USDC_ADDRESS
        }
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create escrow:', error);
    return NextResponse.json(
      { error: 'Failed to create escrow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/escrow
 * Request refund for an escrow
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const userAddress = request.headers.get('x-user-address');
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!userAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId query parameter required' },
        { status: 400 }
      );
    }

    // Fetch escrow from contract
    let escrow;
    try {
      escrow = await publicClient.readContract({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'getEscrow',
        args: [BigInt(jobId)]
      });
    } catch {
      return NextResponse.json(
        { error: 'Escrow not found on blockchain' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (escrow.depositor.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only allow refund for active escrows
    if (Number(escrow.status) !== EscrowStatus.Active) {
      return NextResponse.json(
        { error: `Cannot refund escrow with status: ${mapEscrowStatus(Number(escrow.status))}` },
        { status: 400 }
      );
    }

    // Build refund transaction data
    const transactionData = {
      to: ESCROW_ADDRESS,
      data: buildEscrowRefundCalldata(jobId),
      value: '0',
      chainId: ADI_TESTNET_CHAIN_ID,
      gasLimit: '150000',
    };

    return NextResponse.json({
      success: true,
      message: 'Escrow refund transaction created',
      escrow: {
        jobId,
        depositor: escrow.depositor,
        amount: escrow.amount.toString(),
        status: 'refunded',
        refundedAt: new Date().toISOString()
      },
      transaction: {
        ...transactionData,
        description: `Refund ${formatUSDC(escrow.amount.toString())} USDC from escrow for job ${jobId}`,
        network: 'ADI Testnet'
      }
    });
  } catch (error) {
    console.error('Failed to refund escrow:', error);
    return NextResponse.json(
      { error: 'Failed to process refund', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to build escrow deposit calldata using viem
 */
function buildEscrowDepositCalldata(jobId: string, amount: string): string {
  return encodeFunctionData({
    abi: ESCROW_ABI,
    functionName: 'deposit',
    args: [BigInt(jobId), BigInt(amount)]
  });
}

/**
 * Helper function to build escrow refund calldata using viem
 */
function buildEscrowRefundCalldata(jobId: string): string {
  return encodeFunctionData({
    abi: ESCROW_ABI,
    functionName: 'refund',
    args: [BigInt(jobId)]
  });
}

/**
 * Format USDC amount (6 decimals) for display
 */
function formatUSDC(amount: string): string {
  const amountBigInt = BigInt(amount);
  const whole = amountBigInt / BigInt(10 ** 6);
  const fraction = amountBigInt % BigInt(10 ** 6);
  return `${whole}.${fraction.toString().padStart(6, '0')}`;
}

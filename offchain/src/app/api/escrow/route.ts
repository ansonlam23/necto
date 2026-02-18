import { NextRequest, NextResponse } from 'next/server';

// Testnet USDC contract address on ADI Testnet
const TESTNET_USDC_ADDRESS = process.env.TESTNET_USDC_CONTRACT || '0x0000000000000000000000000000000000000000';
const ADI_TESTNET_CHAIN_ID = 99999;
const ADI_TESTNET_RPC = process.env.ADI_TESTNET_RPC_URL || 'https://rpc.ab.testnet.adifoundation.ai/';

// Mock escrow data store (replace with contract calls)
interface EscrowData {
  jobId: string;
  depositor: string;
  amount: string;
  status: 'pending' | 'active' | 'released' | 'refunded';
  createdAt: string;
  deploymentId?: string;
}

const mockEscrows: Map<string, EscrowData> = new Map();

/**
 * GET /api/escrow
 * Get escrow status for a job
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

    // If jobId provided, return specific escrow
    if (jobId) {
      const escrow = mockEscrows.get(jobId);
      
      if (!escrow) {
        return NextResponse.json(
          { error: 'Escrow not found' },
          { status: 404 }
        );
      }

      // Verify ownership
      if (escrow.depositor !== userAddress) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        escrow: {
          jobId: escrow.jobId,
          amount: escrow.amount,
          status: escrow.status,
          createdAt: escrow.createdAt,
          deploymentId: escrow.deploymentId
        }
      });
    }

    // Return all escrows for user
    const userEscrows = Array.from(mockEscrows.values())
      .filter(e => e.depositor === userAddress)
      .map(e => ({
        jobId: e.jobId,
        amount: e.amount,
        status: e.status,
        createdAt: e.createdAt,
        deploymentId: e.deploymentId
      }));

    // Calculate totals
    const totalDeposited = userEscrows
      .filter(e => ['pending', 'active'].includes(e.status))
      .reduce((sum, e) => sum + BigInt(e.amount), BigInt(0));

    return NextResponse.json({
      success: true,
      escrows: userEscrows,
      summary: {
        totalEscrows: userEscrows.length,
        totalDeposited: totalDeposited.toString(),
        activeCount: userEscrows.filter(e => e.status === 'active').length,
        pendingCount: userEscrows.filter(e => e.status === 'pending').length
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
    if (mockEscrows.has(jobId)) {
      return NextResponse.json(
        { error: 'Escrow already exists for this job' },
        { status: 409 }
      );
    }

    // Create mock escrow entry
    const escrow: EscrowData = {
      jobId,
      depositor: userAddress,
      amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      deploymentId
    };

    mockEscrows.set(jobId, escrow);

    // Build transaction data for client-side signing
    // This is the data the client will sign and send to the blockchain
    const transactionData = {
      to: TESTNET_USDC_ADDRESS,
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
        amount,
        status: 'pending',
        createdAt: escrow.createdAt
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

    const escrow = mockEscrows.get(jobId);

    if (!escrow) {
      return NextResponse.json(
        { error: 'Escrow not found' },
        { status: 404 }
      );
    }

    if (escrow.depositor !== userAddress) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only allow refund for pending escrows
    if (escrow.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot refund escrow with status: ${escrow.status}` },
        { status: 400 }
      );
    }

    // Build refund transaction data
    const transactionData = {
      to: TESTNET_USDC_ADDRESS,
      data: buildEscrowRefundCalldata(jobId),
      value: '0',
      chainId: ADI_TESTNET_CHAIN_ID,
      gasLimit: '150000',
    };

    // Update escrow status
    escrow.status = 'refunded';

    return NextResponse.json({
      success: true,
      message: 'Escrow refund transaction created',
      escrow: {
        jobId,
        amount: escrow.amount,
        status: 'refunded',
        refundedAt: new Date().toISOString()
      },
      transaction: {
        ...transactionData,
        description: `Refund ${formatUSDC(escrow.amount)} USDC from escrow for job ${jobId}`,
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
 * Helper function to build escrow deposit calldata
 * In production, this would encode a contract call
 */
function buildEscrowDepositCalldata(jobId: string, amount: string): string {
  // Placeholder: In production, encode ABI for escrow contract
  // Example: contract.deposit(jobId, amount)
  return `0x${Buffer.from(JSON.stringify({ method: 'deposit', jobId, amount })).toString('hex')}`;
}

/**
 * Helper function to build escrow refund calldata
 */
function buildEscrowRefundCalldata(jobId: string): string {
  // Placeholder: In production, encode ABI for escrow contract
  return `0x${Buffer.from(JSON.stringify({ method: 'refund', jobId })).toString('hex')}`;
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

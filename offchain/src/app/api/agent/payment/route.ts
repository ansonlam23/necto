import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { adiTestnet } from '@/lib/adi-chain';
import { USDC_ABI, USDC_ADDRESS } from '@/lib/contracts/testnet-usdc-token';
import { COMPUTE_ROUTER_ABI, COMPUTE_ROUTER_ADDRESS } from '@/lib/contracts/compute-router';
import { ESCROW_ABI, ESCROW_ADDRESS } from '@/lib/contracts/testnet-usdc-escrow';
import { 
  createAgentWallet, 
  getAgentAddress,
  hashJobDetails 
} from '@/lib/agent/wallet-tool';

const publicClient = createPublicClient({
  chain: adiTestnet,
  transport: http(process.env.ADI_TESTNET_RPC_URL || 'https://rpc.ab.testnet.adifoundation.ai/')
});

const GAS_LIMIT_TRANSFER = BigInt(200000);
const GAS_LIMIT_SUBMIT_JOB = BigInt(500000);
const GAS_LIMIT_APPROVE = BigInt(200000);
const GAS_LIMIT_DEPOSIT = BigInt(500000);

export interface PaymentRequest {
  userAddress: `0x${string}`;
  requirements: object;
  amount: string;
  isTracked: boolean;
}

export interface PaymentResponse {
  success: boolean;
  jobId?: string;
  transactions?: {
    transferHash: string;
    submitJobHash: string;
    approveHash: string;
    depositHash: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PaymentRequest = await request.json();
    const { userAddress, requirements, amount, isTracked } = body;

    if (!userAddress || !requirements || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const amountBigInt = BigInt(amount);
    if (amountBigInt <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const agentAddress = getAgentAddress();
    console.log('Agent processing payment:', { userAddress, agentAddress, amount: amountBigInt.toString() });

    console.log('Step 1: Checking USDC allowance...');
    const currentAllowance = await publicClient.readContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [userAddress, agentAddress]
    }) as bigint;

    if (currentAllowance < amountBigInt) {
      return NextResponse.json(
        { success: false, error: `Insufficient USDC allowance` },
        { status: 400 }
      );
    }

    const wallet = createAgentWallet();
    const account = wallet.account!;

    console.log('Step 2: Transferring USDC from user to agent...');
    const transferHash = await wallet.writeContract({
      account,
      address: USDC_ADDRESS as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'transferFrom',
      args: [userAddress, agentAddress, amountBigInt],
      chain: adiTestnet,
      gas: GAS_LIMIT_TRANSFER
    });
    console.log('Transfer transaction hash:', transferHash);

    const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferHash });
    if (transferReceipt.status === 'reverted') {
      throw new Error('USDC transfer to agent was reverted');
    }

    console.log('Step 3: Submitting job to ComputeRouter...');
    const detailsHash = hashJobDetails(requirements);
    
    const submitJobHash = await wallet.writeContract({
      account,
      address: COMPUTE_ROUTER_ADDRESS,
      abi: COMPUTE_ROUTER_ABI,
      functionName: 'submitJob',
      args: [userAddress, detailsHash, isTracked],
      chain: adiTestnet,
      gas: GAS_LIMIT_SUBMIT_JOB
    });
    console.log('Job submission hash:', submitJobHash);

    const jobReceipt = await publicClient.waitForTransactionReceipt({ hash: submitJobHash });
    if (jobReceipt.status === 'reverted') {
      throw new Error('Job submission was reverted');
    }

    const jobCount = await publicClient.readContract({
      address: COMPUTE_ROUTER_ADDRESS,
      abi: COMPUTE_ROUTER_ABI,
      functionName: 'jobCount'
    }) as bigint;
    const jobId = jobCount;

    const jobData = await publicClient.readContract({
      address: COMPUTE_ROUTER_ADDRESS,
      abi: COMPUTE_ROUTER_ABI,
      functionName: 'getJob',
      args: [jobId]
    }) as { id: bigint; createdAt: bigint };
    
    if (jobData.createdAt === BigInt(0)) {
      throw new Error(`Job ${jobId.toString()} was not created properly`);
    }

    console.log('Step 4: Approving USDC to escrow...');
    const approveHash = await wallet.writeContract({
      account,
      address: USDC_ADDRESS as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [ESCROW_ADDRESS as `0x${string}`, amountBigInt],
      chain: adiTestnet,
      gas: GAS_LIMIT_APPROVE
    });
    console.log('Approval hash:', approveHash);

    const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
    if (approveReceipt.status === 'reverted') {
      throw new Error('USDC approval to escrow was reverted');
    }

    console.log('Step 5: Depositing USDC to escrow...');
    const depositHash = await wallet.writeContract({
      account,
      address: ESCROW_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'deposit',
      args: [jobId, amountBigInt],
      chain: adiTestnet,
      gas: GAS_LIMIT_DEPOSIT
    });
    console.log('Deposit hash:', depositHash);

    const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositHash });
    if (depositReceipt.status === 'reverted') {
      throw new Error('Escrow deposit was reverted');
    }

    const escrowData = await publicClient.readContract({
      address: ESCROW_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'getEscrow',
      args: [jobId]
    }) as { depositor: string; amount: bigint; createdAt: bigint };
    
    console.log('Escrow created:', escrowData);

    return NextResponse.json({
      success: true,
      jobId: jobId.toString(),
      transactions: {
        transferHash,
        submitJobHash,
        approveHash,
        depositHash
      }
    });

  } catch (error) {
    console.error('Agent payment processing failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const agentAddress = getAgentAddress();
    return NextResponse.json({
      success: true,
      agentAddress,
      usdcAddress: USDC_ADDRESS
    });
  } catch (error) {
    console.error('Failed to get agent address:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

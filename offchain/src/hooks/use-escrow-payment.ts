'use client';

import { useState, useCallback } from 'react';
import 'viem/window';
import { createWalletClient, custom, createPublicClient, http } from 'viem';
import { getMetaMaskProvider } from '@/lib/metamask-provider';
import { USDC_ABI, USDC_ADDRESS } from '@/lib/contracts/testnet-usdc-token';
import { JobRequirements } from '@/lib/akash/sdl-generator';
import { adiTestnet } from '@/lib/adi-chain';

export type PaymentState = 
  | 'idle' 
  | 'fetching_agent'
  | 'approving' 
  | 'approval_confirming'
  | 'processing_payment' 
  | 'payment_processing'
  | 'completed' 
  | 'error';

export interface TransactionHashes {
  transferHash: string | null;
  submitJobHash: string | null;
  approveHash: string | null;
  depositHash: string | null;
}

export interface UseEscrowPaymentReturn {
  state: PaymentState;
  txHash: string | null;
  transactions: TransactionHashes;
  jobId: bigint | null;
  error: string | null;
  isLoading: boolean;
  currentStep: string;
  agentAddress: `0x${string}` | null;
  executePayment: (params: PaymentParams) => Promise<bigint | null>;
  reset: () => void;
}

export interface PaymentParams {
  requirements: JobRequirements;
  amount: bigint;
  isTracked: boolean;
}

interface AgentPaymentResponse {
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

const STEP_MESSAGES: Record<PaymentState, string> = {
  idle: 'Ready to pay',
  fetching_agent: 'Fetching agent address...',
  approving: 'Requesting USDC approval to agent...',
  approval_confirming: 'Confirming approval on-chain...',
  processing_payment: 'Sending payment request to agent...',
  payment_processing: 'Agent processing payment...',
  completed: 'Payment completed successfully',
  error: 'Payment failed'
};

const GAS_LIMIT_APPROVE = BigInt(200000);

export function useEscrowPayment(): UseEscrowPaymentReturn {
  const [state, setState] = useState<PaymentState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionHashes>({
    transferHash: null,
    submitJobHash: null,
    approveHash: null,
    depositHash: null
  });
  const [jobId, setJobId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentAddress, setAgentAddress] = useState<`0x${string}` | null>(null);

  const executePayment = useCallback(async (params: PaymentParams): Promise<bigint | null> => {
    const { requirements, amount, isTracked } = params;

    try {
      setError(null);
      setTxHash(null);
      setTransactions({
        transferHash: null,
        submitJobHash: null,
        approveHash: null,
        depositHash: null
      });
      setJobId(null);
      setAgentAddress(null);

      const metaMaskProvider = await getMetaMaskProvider();

      const publicClient = createPublicClient({
        chain: adiTestnet,
        transport: http('https://rpc.ab.testnet.adifoundation.ai')
      });

      const walletClient = createWalletClient({
        chain: adiTestnet,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transport: custom(metaMaskProvider as any)
      });

      const [address] = await walletClient.getAddresses();
      if (!address) {
        throw new Error('No wallet connected');
      }

      // Ensure wallet is on ADI Testnet before any transactions
      try {
        await walletClient.switchChain({ id: adiTestnet.id });
      } catch {
        await walletClient.addChain({ chain: adiTestnet });
        await walletClient.switchChain({ id: adiTestnet.id });
      }

      console.log('Payment Flow: User -> Agent -> Escrow');
      console.log('Wallet address:', address);
      console.log('USDC Address:', USDC_ADDRESS);
      console.log('Amount:', amount.toString());

      const usdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [address]
      }) as bigint;
      
      if (usdcBalance < amount) {
        throw new Error(`Insufficient USDC balance. Have: ${usdcBalance.toString()}, Need: ${amount.toString()}`);
      }

      setState('fetching_agent');
      console.log('Fetching agent address from API...');
      
      const agentResponse = await fetch('/api/agent/payment');
      if (!agentResponse.ok) {
        const errorData = await agentResponse.json();
        throw new Error(errorData.error || 'Failed to fetch agent address');
      }
      
      const agentData = await agentResponse.json();
      if (!agentData.success) {
        throw new Error(agentData.error || 'Failed to fetch agent address');
      }
      
      const currentAgentAddress = agentData.agentAddress as `0x${string}`;
      setAgentAddress(currentAgentAddress);
      console.log('Agent Address:', currentAgentAddress);

      console.log('Checking USDC allowance to agent...');
      const currentAllowance = await publicClient.readContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [address, currentAgentAddress]
      }) as bigint;

      console.log('Current allowance to agent:', currentAllowance.toString());

      if (currentAllowance < amount) {
        setState('approving');
        console.log('Submitting USDC approval transaction to agent...');
        
        try {
          const approvalHash = await walletClient.writeContract({
            address: USDC_ADDRESS as `0x${string}`,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [currentAgentAddress, amount],
            account: address,
            gas: GAS_LIMIT_APPROVE
          });

          console.log('Approval transaction hash:', approvalHash);
          setTxHash(approvalHash);
          setTransactions(prev => ({ ...prev, approveHash: approvalHash }));
          setState('approval_confirming');

          const approvalReceipt = await publicClient.waitForTransactionReceipt({ 
            hash: approvalHash 
          });
          console.log('Approval confirmed in block:', approvalReceipt.blockNumber);

          if (approvalReceipt.status === 'reverted') {
            throw new Error('USDC approval transaction reverted on-chain');
          }
          
          const newAllowance = await publicClient.readContract({
            address: USDC_ADDRESS as `0x${string}`,
            abi: USDC_ABI,
            functionName: 'allowance',
            args: [address, currentAgentAddress]
          }) as bigint;
          console.log('New allowance after approval:', newAllowance.toString());
        } catch (err) {
          console.error('Approval error details:', err);
          const message = err instanceof Error ? err.message : 'Unknown error';
          if (message.includes('rejected') || message.includes('denied') || message.includes('User rejected')) {
            throw new Error('Transaction rejected by user');
          }
          throw new Error(`USDC approval failed: ${message}`);
        }
      } else {
        console.log('Sufficient allowance already granted to agent');
      }

      setState('processing_payment');
      console.log('Calling agent API to process payment...');

      const paymentResponse = await fetch('/api/agent/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAddress: address,
          requirements,
          amount: amount.toString(),
          isTracked
        })
      });

      setState('payment_processing');

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Agent payment processing failed');
      }

      const paymentData: AgentPaymentResponse = await paymentResponse.json();
      
      if (!paymentData.success) {
        throw new Error(paymentData.error || 'Agent payment processing failed');
      }

      console.log('Agent payment completed:', paymentData);
      
      // Store all transaction hashes
      if (paymentData.transactions) {
        setTransactions({
          transferHash: paymentData.transactions.transferHash || null,
          submitJobHash: paymentData.transactions.submitJobHash || null,
          approveHash: paymentData.transactions.approveHash || null,
          depositHash: paymentData.transactions.depositHash || null
        });
      }
      
      if (paymentData.jobId) {
        const jobIdBigInt = BigInt(paymentData.jobId);
        setJobId(jobIdBigInt);
        console.log('Job ID:', jobIdBigInt.toString());
      }
      
      if (paymentData.transactions?.depositHash) {
        setTxHash(paymentData.transactions.depositHash);
      }

      setState('completed');
      console.log('Payment flow completed successfully!');
      
      return paymentData.jobId ? BigInt(paymentData.jobId) : null;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      setState('error');
      console.error('Payment flow error:', err);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setTxHash(null);
    setTransactions({
      transferHash: null,
      submitJobHash: null,
      approveHash: null,
      depositHash: null
    });
    setJobId(null);
    setError(null);
    setAgentAddress(null);
  }, []);

  const isLoading = state !== 'idle' && state !== 'completed' && state !== 'error';

  return {
    state,
    txHash,
    transactions,
    jobId,
    error,
    isLoading,
    currentStep: STEP_MESSAGES[state],
    agentAddress,
    executePayment,
    reset
  };
}

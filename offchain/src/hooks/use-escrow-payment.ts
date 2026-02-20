'use client';

import { useState, useCallback } from 'react';
import 'viem/window';
import { createWalletClient, custom, createPublicClient, http, keccak256, toBytes } from 'viem';
import { COMPUTE_ROUTER_ABI, COMPUTE_ROUTER_ADDRESS } from '@/lib/contracts/compute-router';
import { ESCROW_ABI, ESCROW_ADDRESS } from '@/lib/contracts/testnet-usdc-escrow';
import { USDC_ABI, USDC_ADDRESS } from '@/lib/contracts/testnet-usdc-token';
import { JobRequirements } from '@/lib/akash/sdl-generator';
import { adiTestnet } from '@/lib/adi-chain';

export type PaymentState = 
  | 'idle' 
  | 'approving' 
  | 'approval_confirming'
  | 'submitting_job' 
  | 'job_confirming'
  | 'depositing' 
  | 'deposit_confirming'
  | 'completed' 
  | 'error';

export interface UseEscrowPaymentReturn {
  state: PaymentState;
  txHash: string | null;
  jobId: bigint | null;
  error: string | null;
  isLoading: boolean;
  currentStep: string;
  executePayment: (params: PaymentParams) => Promise<bigint | null>;
  reset: () => void;
}

export interface PaymentParams {
  requirements: JobRequirements;
  amount: bigint;
  isTracked: boolean;
}

// Progress messages for each state
const STEP_MESSAGES: Record<PaymentState, string> = {
  idle: 'Ready to pay',
  approving: 'Requesting USDC approval...',
  approval_confirming: 'Confirming USDC approval on-chain...',
  submitting_job: 'Submitting job to router...',
  job_confirming: 'Confirming job submission on-chain...',
  depositing: 'Depositing to escrow...',
  deposit_confirming: 'Confirming escrow deposit on-chain...',
  completed: 'Payment completed successfully',
  error: 'Payment failed'
};

export function useEscrowPayment(): UseEscrowPaymentReturn {
  const [state, setState] = useState<PaymentState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [jobId, setJobId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Hash job requirements for ComputeRouter
   */
  function hashJobRequirements(requirements: JobRequirements): `0x${string}` {
    const jsonString = JSON.stringify(requirements, Object.keys(requirements).sort());
    return keccak256(toBytes(jsonString));
  }

  /**
   * Execute the full payment flow using viem
   * Following pattern from hardhat/scripts/interact-router.ts
   */
  const executePayment = useCallback(async (params: PaymentParams): Promise<bigint | null> => {
    const { requirements, amount, isTracked } = params;

    try {
      setError(null);
      setTxHash(null);
      setJobId(null);

      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Create public client for reading state
      const publicClient = createPublicClient({
        chain: adiTestnet,
        transport: http('https://rpc.ab.testnet.adifoundation.ai')
      });

      // Create wallet client connected to MetaMask
      const walletClient = createWalletClient({
        chain: adiTestnet,
        transport: custom(window.ethereum)
      });

      // Get connected address (matches pattern from hardhat/scripts)
      const [address] = await walletClient.getAddresses();
      if (!address) {
        throw new Error('No wallet connected');
      }

      console.log('Connected to ADI Testnet');
      console.log('Wallet address:', address);

      // Step 1: Check USDC allowance
      console.log('Checking USDC allowance...');
      const currentAllowance = await publicClient.readContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [address, ESCROW_ADDRESS as `0x${string}`]
      }) as bigint;

      console.log('Current allowance:', currentAllowance.toString());

      // Step 1: Approve USDC if needed
      if (currentAllowance < amount) {
        setState('approving');
        console.log('Submitting USDC approval transaction...');
        
        try {
          // Direct writeContract call (matches hardhat/scripts pattern)
          const approvalHash = await walletClient.writeContract({
            address: USDC_ADDRESS as `0x${string}`,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [ESCROW_ADDRESS as `0x${string}`, amount],
            account: address
          });

          console.log('Approval transaction hash:', approvalHash);
          setTxHash(approvalHash);
          setState('approval_confirming');

          // Wait for confirmation (matches hardhat/scripts pattern)
          const approvalReceipt = await publicClient.waitForTransactionReceipt({ 
            hash: approvalHash 
          });
          console.log('Approval confirmed in block:', approvalReceipt.blockNumber);

          if (approvalReceipt.status === 'reverted') {
            throw new Error('USDC approval transaction reverted');
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          if (message.includes('rejected') || message.includes('denied') || message.includes('User rejected')) {
            throw new Error('Transaction rejected by user');
          }
          throw new Error(`USDC approval failed: ${message}`);
        }
      }

      // Step 2: Submit job to ComputeRouter
      setState('submitting_job');
      const detailsHash = hashJobRequirements(requirements);
      
      console.log('Submitting job transaction...', {
        user: address,
        detailsHash,
        isTracked
      });

      let jobIdResult: bigint;
      try {
        // Direct writeContract call (matches hardhat/scripts/interact-router.ts pattern)
        const jobHash = await walletClient.writeContract({
          address: COMPUTE_ROUTER_ADDRESS,
          abi: COMPUTE_ROUTER_ABI,
          functionName: 'submitJob',
          args: [address, detailsHash, isTracked],
          account: address
        });

        console.log('Job submission transaction hash:', jobHash);
        setTxHash(jobHash);
        setState('job_confirming');

        // Wait for confirmation
        const jobReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: jobHash 
        });
        console.log('Job submission confirmed in block:', jobReceipt.blockNumber);

        if (jobReceipt.status === 'reverted') {
          throw new Error('Job submission transaction reverted');
        }
        
        // Get job ID from API (similar to reading jobCount in scripts)
        const response = await fetch('/api/job-count');
        if (response.ok) {
          const data = await response.json();
          jobIdResult = BigInt(data.count);
        } else {
          jobIdResult = BigInt(1);
        }
        
        setJobId(jobIdResult);
        console.log('New job ID:', jobIdResult.toString());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (message.includes('rejected') || message.includes('denied') || message.includes('User rejected')) {
          throw new Error('Transaction rejected by user');
        }
        throw new Error(`Job submission failed: ${message}`);
      }

      // Step 3: Deposit to escrow
      setState('depositing');
      
      console.log('Submitting escrow deposit transaction...', {
        jobId: jobIdResult.toString(),
        amount: amount.toString()
      });

      try {
        // Direct writeContract call
        const depositHash = await walletClient.writeContract({
          address: ESCROW_ADDRESS as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'deposit',
          args: [jobIdResult, amount],
          account: address
        });

        console.log('Escrow deposit transaction hash:', depositHash);
        setTxHash(depositHash);
        setState('deposit_confirming');

        // Wait for confirmation
        const depositReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: depositHash 
        });
        console.log('Escrow deposit confirmed in block:', depositReceipt.blockNumber);

        if (depositReceipt.status === 'reverted') {
          throw new Error('Escrow deposit transaction reverted');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (message.includes('rejected') || message.includes('denied') || message.includes('User rejected')) {
          throw new Error('Transaction rejected by user');
        }
        if (message.includes('insufficient') || message.includes('balance')) {
          throw new Error('Insufficient USDC balance');
        }
        throw new Error(`Escrow deposit failed: ${message}`);
      }

      setState('completed');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Payment flow completed successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return jobIdResult;

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
    setJobId(null);
    setError(null);
  }, []);

  const isLoading = state !== 'idle' && state !== 'completed' && state !== 'error';

  return {
    state,
    txHash,
    jobId,
    error,
    isLoading,
    currentStep: STEP_MESSAGES[state],
    executePayment,
    reset
  };
}

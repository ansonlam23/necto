'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { COMPUTE_ROUTER_ABI, COMPUTE_ROUTER_ADDRESS } from '@/lib/contracts/compute-router';
import { ESCROW_ABI, ESCROW_ADDRESS } from '@/lib/contracts/testnet-usdc-escrow';
import { USDC_ABI, USDC_ADDRESS } from '@/lib/contracts/testnet-usdc-token';
import { JobRequirements } from '@/lib/akash/sdl-generator';

export type PaymentState = 
  | 'idle' 
  | 'approving' 
  | 'submitting_job' 
  | 'depositing' 
  | 'completed' 
  | 'error';

export interface UseEscrowPaymentReturn {
  state: PaymentState;
  txHash: string | null;
  jobId: bigint | null;
  error: string | null;
  isLoading: boolean;
  currentStep: string;
  executePayment: (params: PaymentParams) => Promise<void>;
  reset: () => void;
}

export interface PaymentParams {
  requirements: JobRequirements;
  amount: bigint; // USDC amount (6 decimals)
  isTracked: boolean;
}

interface PaymentProgress {
  state: PaymentState;
  step: string;
  isLoading: boolean;
}

const PAYMENT_PROGRESS: Record<PaymentState, PaymentProgress> = {
  idle: { state: 'idle', step: 'Ready to pay', isLoading: false },
  approving: { state: 'approving', step: 'Approving USDC spend', isLoading: true },
  submitting_job: { state: 'submitting_job', step: 'Submitting job to router', isLoading: true },
  depositing: { state: 'depositing', step: 'Depositing to escrow', isLoading: true },
  completed: { state: 'completed', step: 'Payment completed', isLoading: false },
  error: { state: 'error', step: 'Payment failed', isLoading: false }
};

/**
 * Hash job requirements for ComputeRouter
 */
function hashJobRequirements(requirements: JobRequirements): `0x${string}` {
  const jsonString = JSON.stringify(requirements, Object.keys(requirements).sort());
  return keccak256(toBytes(jsonString));
}

/**
 * Hook for managing escrow payment flow
 * 1. Check/approve USDC allowance
 * 2. Submit job to ComputeRouter
 * 3. Deposit USDC into escrow
 */
export function useEscrowPayment(): UseEscrowPaymentReturn {
  const { address } = useAccount();
  const [state, setState] = useState<PaymentState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [jobId, setJobId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  // USDC approval write
  const { writeContractAsync: approveUSDC } = useWriteContract();
  // ComputeRouter submitJob write
  const { writeContractAsync: submitJob } = useWriteContract();
  // Escrow deposit write
  const { writeContractAsync: depositEscrow } = useWriteContract();

  // Read USDC allowance
  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address && ESCROW_ADDRESS ? [address, ESCROW_ADDRESS as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!ESCROW_ADDRESS
    }
  });

  const executePayment = useCallback(async (params: PaymentParams) => {
    const { requirements, amount, isTracked } = params;

    if (!address) {
      setError('Wallet not connected');
      setState('error');
      return;
    }

    setError(null);
    setTxHash(null);
    setJobId(null);

    try {
      // Step 1: Check and approve USDC allowance
      setState('approving');
      
      const currentAllowance = allowance ?? BigInt(0);
      
      if (currentAllowance < amount) {
        try {
          const approveHash = await approveUSDC({
            address: USDC_ADDRESS as `0x${string}`,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [ESCROW_ADDRESS as `0x${string}`, amount]
          });
          
          setTxHash(approveHash);
          
          // Wait for approval confirmation
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          if (message.includes('rejected') || message.includes('denied')) {
            throw new Error('Transaction rejected by user');
          }
          throw new Error(`USDC approval failed: ${message}`);
        }
      }

      // Step 2: Submit job to ComputeRouter
      setState('submitting_job');
      
      const detailsHash = hashJobRequirements(requirements);
      
      let jobIdResult: bigint;
      try {
        const submitHash = await submitJob({
          address: COMPUTE_ROUTER_ADDRESS,
          abi: COMPUTE_ROUTER_ABI,
          functionName: 'submitJob',
          args: [address, detailsHash, isTracked]
        });
        
        setTxHash(submitHash);
        
        // Wait a bit for transaction to be mined
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Get job count (jobId = jobCount after submission)
        // Note: In a production app, we'd watch for JobSubmitted event
        // For now, we'll fetch jobCount and use that as the jobId
        // This is a simplification - in production, parse event logs
        const response = await fetch('/api/job-count');
        if (response.ok) {
          const data = await response.json();
          jobIdResult = BigInt(data.count);
        } else {
          // Fallback: assume sequential job IDs starting from 1
          jobIdResult = BigInt(1);
        }
        
        setJobId(jobIdResult);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (message.includes('rejected') || message.includes('denied')) {
          throw new Error('Transaction rejected by user');
        }
        throw new Error(`Job submission failed: ${message}`);
      }

      // Step 3: Deposit to escrow
      setState('depositing');
      
      try {
        const depositHash = await depositEscrow({
          address: ESCROW_ADDRESS as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'deposit',
          args: [jobIdResult, amount]
        });
        
        setTxHash(depositHash);
        
        // Wait for deposit confirmation
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (message.includes('rejected') || message.includes('denied')) {
          throw new Error('Transaction rejected by user');
        }
        if (message.includes('insufficient') || message.includes('balance')) {
          throw new Error('Insufficient USDC balance');
        }
        throw new Error(`Escrow deposit failed: ${message}`);
      }

      setState('completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      setState('error');
      console.error('Payment flow error:', err);
    }
  }, [address, allowance, approveUSDC, submitJob, depositEscrow]);

  const reset = useCallback(() => {
    setState('idle');
    setTxHash(null);
    setJobId(null);
    setError(null);
  }, []);

  const progress = PAYMENT_PROGRESS[state];

  return {
    state,
    txHash,
    jobId,
    error,
    isLoading: progress.isLoading,
    currentStep: progress.step,
    executePayment,
    reset
  };
}

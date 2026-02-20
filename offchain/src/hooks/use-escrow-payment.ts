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

// Higher gas limits for ADI Testnet - ensures transactions don't run out of gas
const GAS_LIMIT_APPROVE = BigInt(200000);      // ERC20 approve
const GAS_LIMIT_SUBMIT_JOB = BigInt(500000);   // submitJob - generous limit
const GAS_LIMIT_DEPOSIT = BigInt(500000);      // deposit - generous limit

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
   * Uses explicit gas limits to prevent MetaMask from over-estimating
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
      console.log('USDC Address:', USDC_ADDRESS);
      console.log('Escrow Address:', ESCROW_ADDRESS);
      console.log('ComputeRouter Address:', COMPUTE_ROUTER_ADDRESS);

      // Step 0: Check USDC balance
      console.log('Checking USDC balance...');
      const usdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [address]
      }) as bigint;
      console.log('USDC Balance:', usdcBalance.toString(), '(need:', amount.toString() + ')');
      
      if (usdcBalance < amount) {
        throw new Error(`Insufficient USDC balance. Have: ${usdcBalance.toString()}, Need: ${amount.toString()}`);
      }

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
        console.log('Approving', amount.toString(), 'USDC for spender', ESCROW_ADDRESS);
        
        try {
          // Use explicit gas limit to prevent MetaMask over-estimation
          const approvalHash = await walletClient.writeContract({
            address: USDC_ADDRESS as `0x${string}`,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [ESCROW_ADDRESS as `0x${string}`, amount],
            account: address,
            gas: GAS_LIMIT_APPROVE
          });

          console.log('Approval transaction hash:', approvalHash);
          setTxHash(approvalHash);
          setState('approval_confirming');

          // Wait for confirmation
          const approvalReceipt = await publicClient.waitForTransactionReceipt({ 
            hash: approvalHash 
          });
          console.log('Approval confirmed in block:', approvalReceipt.blockNumber);
          console.log('Gas used:', approvalReceipt.gasUsed.toString());
          console.log('Status:', approvalReceipt.status);

          if (approvalReceipt.status === 'reverted') {
            throw new Error('USDC approval transaction reverted on-chain');
          }
          
          // Verify allowance was updated
          const newAllowance = await publicClient.readContract({
            address: USDC_ADDRESS as `0x${string}`,
            abi: USDC_ABI,
            functionName: 'allowance',
            args: [address, ESCROW_ADDRESS as `0x${string}`]
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
      }

      // Step 2: Submit job to ComputeRouter
      setState('submitting_job');
      const detailsHash = hashJobRequirements(requirements);
      
      console.log('Submitting job transaction...');
      console.log('Params:', {
        user: address,
        detailsHash,
        isTracked,
        routerAddress: COMPUTE_ROUTER_ADDRESS
      });

      let jobIdResult: bigint;
      try {
        // Use explicit gas limit
        const jobHash = await walletClient.writeContract({
          address: COMPUTE_ROUTER_ADDRESS,
          abi: COMPUTE_ROUTER_ABI,
          functionName: 'submitJob',
          args: [address, detailsHash, isTracked],
          account: address,
          gas: GAS_LIMIT_SUBMIT_JOB
        });

        console.log('Job submission transaction hash:', jobHash);
        setTxHash(jobHash);
        setState('job_confirming');

        // Wait for confirmation
        const jobReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: jobHash 
        });
        console.log('Job submission confirmed in block:', jobReceipt.blockNumber);
        console.log('Gas used:', jobReceipt.gasUsed.toString());
        console.log('Status:', jobReceipt.status);

        if (jobReceipt.status === 'reverted') {
          throw new Error('Job submission transaction reverted on-chain');
        }
        
        // Verify job was created by reading jobCount
        const jobCountOnChain = await publicClient.readContract({
          address: COMPUTE_ROUTER_ADDRESS,
          abi: COMPUTE_ROUTER_ABI,
          functionName: 'jobCount'
        }) as bigint;
        console.log('Job count on chain:', jobCountOnChain.toString());
        
        // Get job ID - use the on-chain count
        jobIdResult = jobCountOnChain;
        
        // Verify the job exists
        const jobData = await publicClient.readContract({
          address: COMPUTE_ROUTER_ADDRESS,
          abi: COMPUTE_ROUTER_ABI,
          functionName: 'getJob',
          args: [jobIdResult]
        }) as { id: bigint; createdAt: bigint };
        console.log('Job data from chain:', jobData);
        
        if (jobData.createdAt === BigInt(0)) {
          throw new Error(`Job ${jobIdResult.toString()} was not created properly`);
        }
        
        setJobId(jobIdResult);
        console.log('New job ID:', jobIdResult.toString());
      } catch (err) {
        console.error('Job submission error details:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (message.includes('rejected') || message.includes('denied') || message.includes('User rejected')) {
          throw new Error('Transaction rejected by user');
        }
        throw new Error(`Job submission failed: ${message}`);
      }

      // Step 3: Deposit to escrow
      setState('depositing');
      
      console.log('Submitting escrow deposit transaction...');
      console.log('Params:', {
        jobId: jobIdResult.toString(),
        amount: amount.toString(),
        escrowAddress: ESCROW_ADDRESS
      });
      
      // Verify job exists before depositing
      try {
        const jobCheck = await publicClient.readContract({
          address: COMPUTE_ROUTER_ADDRESS,
          abi: COMPUTE_ROUTER_ABI,
          functionName: 'getJob',
          args: [jobIdResult]
        }) as { createdAt: bigint };
        console.log('Job exists check - createdAt:', jobCheck.createdAt.toString());
        if (jobCheck.createdAt === BigInt(0)) {
          throw new Error(`Cannot deposit: Job ${jobIdResult.toString()} does not exist in router`);
        }
      } catch (err) {
        console.error('Job verification failed:', err);
        throw new Error(`Job verification failed before deposit: ${err instanceof Error ? err.message : 'Unknown'}`);
      }

      try {
        // Use explicit gas limit to prevent the 35M gas estimate issue
        const depositHash = await walletClient.writeContract({
          address: ESCROW_ADDRESS as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'deposit',
          args: [jobIdResult, amount],
          account: address,
          gas: GAS_LIMIT_DEPOSIT
        });

        console.log('Escrow deposit transaction hash:', depositHash);
        setTxHash(depositHash);
        setState('deposit_confirming');

        // Wait for confirmation
        const depositReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: depositHash 
        });
        console.log('Escrow deposit confirmed in block:', depositReceipt.blockNumber);
        console.log('Gas used:', depositReceipt.gasUsed.toString());
        console.log('Status:', depositReceipt.status);

        if (depositReceipt.status === 'reverted') {
          throw new Error('Escrow deposit transaction reverted on-chain');
        }
        
        // Verify escrow was created
        const escrowData = await publicClient.readContract({
          address: ESCROW_ADDRESS as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'getEscrow',
          args: [jobIdResult]
        }) as { depositor: string; amount: bigint; createdAt: bigint };
        console.log('Escrow created:', escrowData);
      } catch (err) {
        console.error('Escrow deposit error details:', err);
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

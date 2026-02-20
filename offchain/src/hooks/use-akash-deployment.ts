'use client';

import { useState, useCallback, useRef } from 'react';
import { AkashDeployment, ProviderBid, LeaseResponse } from '@/types/akash';
import { JobRequirements } from '@/lib/akash/sdl-generator';
import { RouteLog } from '@/lib/agent/akash-router';
import { useEscrowPayment, PaymentParams, TransactionHashes } from '@/hooks/use-escrow-payment';

export type DeploymentState =
  | 'idle'
  | 'checking_suitability'
  | 'generating_sdl'
  | 'selecting_provider'
  | 'paying_escrow'
  | 'creating_deployment'
  | 'waiting_bids'
  | 'accepting_bid'
  | 'active'
  | 'closing'
  | 'completed'
  | 'error';

export interface StartDeploymentParams {
  requirements: JobRequirements;
  autoAccept?: boolean;
  escrowAmount?: bigint; // USDC amount
  isTracked?: boolean;
}

interface UseAkashDeploymentReturn {
  state: DeploymentState;
  deployment: AkashDeployment | null;
  bids: ProviderBid[];
  logs: RouteLog[];
  error: string | null;
  isLoading: boolean;
  progress: number;
  escrowTxHash: string | null;
  escrowTransactions: TransactionHashes;
  escrowJobId: bigint | null;
  escrowError: string | null;
  escrowState: import('@/hooks/use-escrow-payment').PaymentState;
  leaseResponse: LeaseResponse | null;
  startDeployment: (params: StartDeploymentParams) => Promise<void>;
  acceptBid: (bidId: string) => Promise<void>;
  close: () => Promise<void>;
  reset: () => void;
}

const STATE_PROGRESS: Record<DeploymentState, number> = {
  idle: 0,
  checking_suitability: 10,
  generating_sdl: 20,
  selecting_provider: 30,
  paying_escrow: 40,
  creating_deployment: 60,
  waiting_bids: 75,
  accepting_bid: 85,
  active: 100,
  closing: 90,
  completed: 100,
  error: 0
};

export function useAkashDeployment(): UseAkashDeploymentReturn {
  const [state, setState] = useState<DeploymentState>('idle');
  const [deployment, setDeployment] = useState<AkashDeployment | null>(null);
  const [bids, setBids] = useState<ProviderBid[]>([]);
  const [logs, setLogs] = useState<RouteLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [escrowJobId, setEscrowJobId] = useState<bigint | null>(null);
  const [leaseResponse, setLeaseResponse] = useState<LeaseResponse | null>(null);
  const escrowJobIdRef = useRef<bigint | null>(null);

  // Escrow payment hook
  const escrowPayment = useEscrowPayment();

  const startDeployment = useCallback(async (
    params: StartDeploymentParams
  ) => {
    const { requirements, autoAccept = false, escrowAmount, isTracked = true } = params;

    setIsLoading(true);
    setError(null);
    setLogs([]);
    setEscrowJobId(null);
    setLeaseResponse(null);
    escrowJobIdRef.current = null;

    try {
      // Step 1: Execute escrow payment if amount is provided
      if (escrowAmount && escrowAmount > BigInt(0)) {
        setState('paying_escrow');

        const paymentParams: PaymentParams = {
          requirements,
          amount: escrowAmount,
          isTracked
        };

        // Execute payment and get jobId from return value
        // (React state updates from executePayment won't be available until next render,
        // so we use the returned value directly. Throws on failure.)
        const returnedJobId = await escrowPayment.executePayment(paymentParams);

        if (returnedJobId) {
          setEscrowJobId(returnedJobId);
          escrowJobIdRef.current = returnedJobId;
        }
      }

      // Step 2: Proceed with Akash deployment
      setState('checking_suitability');

      // All server-side routing logic runs in the API route — AKASH_CONSOLE_API_KEY stays server-only
      const res = await fetch('/api/akash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requirements, 
          autoAcceptBid: autoAccept,
          jobId: escrowJobIdRef.current ? escrowJobIdRef.current.toString() : undefined
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        try { throw new Error(JSON.parse(text).error || `HTTP ${res.status}`); }
        catch { throw new Error(`HTTP ${res.status}`); }
      }

      const data = await res.json();

      console.log('[useAkashDeployment] API response:', data);
      console.log('[useAkashDeployment] Lease response from API:', data.leaseResponse);

      setLogs(data.logs ?? []);

      if (data.success && data.deployment) {
        setDeployment(data.deployment);
        setBids(data.bids || []);
        if (data.leaseResponse) {
          console.log('[useAkashDeployment] Setting leaseResponse:', JSON.stringify(data.leaseResponse, null, 2));
          setLeaseResponse(data.leaseResponse);
        } else {
          console.log('[useAkashDeployment] No leaseResponse in API response');
        }
        setState(data.bids && data.bids.length > 0 ? 'active' : 'waiting_bids');
      } else {
        setError(data.error || 'Deployment failed');
        setState('error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setState('error');
      console.error('Deployment error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [escrowPayment]);

  const acceptBid = useCallback(async (bidId: string) => {
    if (!deployment) return;

    setState('accepting_bid');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/deployments/${deployment.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId }),
      });

      if (!res.ok) {
        const text = await res.text();
        try { throw new Error(JSON.parse(text).error || `HTTP ${res.status}`); }
        catch { throw new Error(`HTTP ${res.status}`); }
      }

      const data = await res.json();

      setBids(data.bids ?? []);
      setState('active');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept bid');
      setState('error');
    } finally {
      setIsLoading(false);
    }
  }, [deployment]);

  const close = useCallback(async () => {
    if (!deployment) return;

    setState('closing');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/deployments/${deployment.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-address': deployment.owner,
        },
      });

      if (!res.ok) {
       const data = await res.json();
        throw new Error(data.error || 'Failed to close deployment');
      }

      setState('completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close deployment');
      setState('error');
    } finally {
      setIsLoading(false);
    }
  }, [deployment]);

  const reset = useCallback(() => {
    setState('idle');
    setDeployment(null);
    setBids([]);
    setLogs([]);
    setError(null);
    setEscrowJobId(null);
    setLeaseResponse(null);
    escrowJobIdRef.current = null;
    setIsLoading(false);
    escrowPayment.reset();
  }, [escrowPayment]);

  return {
    state,
    deployment,
    bids,
    logs,
    error,
    isLoading,
    progress: STATE_PROGRESS[state],
    escrowTxHash: escrowPayment.txHash,
    escrowTransactions: escrowPayment.transactions,
    escrowJobId: escrowJobId || escrowPayment.jobId,
    escrowError: escrowPayment.error,
    escrowState: escrowPayment.state,
    leaseResponse,
    startDeployment,
    acceptBid,
    close,
    reset
  };
}

'use client';

import { useState, useCallback } from 'react';
import { AkashDeployment, ProviderBid } from '@/types/akash';
import { JobRequirements } from '@/lib/akash/sdl-generator';
import { RouteLog } from '@/lib/agent/akash-router';

export type DeploymentState = 
  | 'idle'
  | 'checking_suitability'
  | 'generating_sdl'
  | 'selecting_provider'
  | 'creating_deployment'
  | 'waiting_bids'
  | 'accepting_bid'
  | 'active'
  | 'closing'
  | 'completed'
  | 'error';

interface UseAkashDeploymentReturn {
  state: DeploymentState;
  deployment: AkashDeployment | null;
  bids: ProviderBid[];
  logs: RouteLog[];
  error: string | null;
  isLoading: boolean;
  progress: number;
  startDeployment: (requirements: JobRequirements, autoAccept?: boolean) => Promise<void>;
  acceptBid: (bidId: string) => Promise<void>;
  close: () => Promise<void>;
  reset: () => void;
}

const STATE_PROGRESS: Record<DeploymentState, number> = {
  idle: 0,
  checking_suitability: 10,
  generating_sdl: 20,
  selecting_provider: 35,
  creating_deployment: 50,
  waiting_bids: 65,
  accepting_bid: 80,
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

  const addLog = useCallback((log: RouteLog) => {
    setLogs(prev => [...prev, log]);
  }, []);

  const startDeployment = useCallback(async (
    requirements: JobRequirements,
    autoAccept: boolean = false
  ) => {
    setIsLoading(true);
    setError(null);
    setLogs([]);
    setState('checking_suitability');

    try {
      const { routeToAkash } = await import('@/lib/agent/akash-router');
      
      const result = await routeToAkash(
        {
          jobId: `job-${Date.now()}`,
          requirements,
          autoAcceptBid: autoAccept,
          bidTimeoutMs: 300000 // 5 minutes
        },
        addLog
      );

      if (result.success && result.deployment) {
        setDeployment(result.deployment);
        setBids(result.bids || []);
        setState(result.bids && result.bids.length > 0 ? 'active' : 'waiting_bids');
      } else {
        setError(result.error || 'Deployment failed');
        setState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    } finally {
      setIsLoading(false);
    }
  }, [addLog]);

  const acceptBid = useCallback(async (bidId: string) => {
    if (!deployment) return;

    setState('accepting_bid');
    setIsLoading(true);

    try {
      const { acceptProviderBid, getDeploymentBids } = await import('@/lib/akash/console-api');
      
      await acceptProviderBid(deployment.id, bidId);
      
      // Refresh bids to get updated status
      const updatedBids = await getDeploymentBids(deployment.id);
      setBids(updatedBids);
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
      const { closeDeployment } = await import('@/lib/akash/console-api');
      await closeDeployment(deployment.id);
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
    setIsLoading(false);
  }, []);

  return {
    state,
    deployment,
    bids,
    logs,
    error,
    isLoading,
    progress: STATE_PROGRESS[state],
    startDeployment,
    acceptBid,
    close,
    reset
  };
}

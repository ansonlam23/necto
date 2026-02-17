/**
 * Akash Console API Client
 * Manages real Akash deployments via Console API
 * Uses https://console-api.akash.network
 */

import {
  AkashDeployment,
  DeploymentStatus,
  SdlSpec,
  ProviderBid,
  Lease,
  CreateDeploymentRequest,
  ConsoleApiConfig
} from '@/types/akash';

const DEFAULT_BASE_URL = 'https://console-api.akash.network';

export class AkashConsoleClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ConsoleApiConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Console API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Create a new deployment with SDL
   */
  async createDeployment(request: CreateDeploymentRequest): Promise<AkashDeployment> {
    return this.fetch<AkashDeployment>('/v1/deployments', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Get deployment by ID
   */
  async getDeployment(deploymentId: string): Promise<AkashDeployment> {
    return this.fetch<AkashDeployment>(`/v1/deployments/${deploymentId}`);
  }

  /**
   * List all deployments for owner
   */
  async listDeployments(owner: string): Promise<AkashDeployment[]> {
    return this.fetch<AkashDeployment[]>(`/v1/deployments?owner=${owner}`);
  }

  /**
   * Close a deployment
   */
  async closeDeployment(deploymentId: string): Promise<void> {
    await this.fetch<void>(`/v1/deployments/${deploymentId}/close`, {
      method: 'POST'
    });
  }

  /**
   * Get bids for a deployment
   */
  async getBids(deploymentId: string): Promise<ProviderBid[]> {
    return this.fetch<ProviderBid[]>(`/v1/deployments/${deploymentId}/bids`);
  }

  /**
   * Accept a bid to create a lease
   */
  async acceptBid(deploymentId: string, bidId: string): Promise<Lease> {
    return this.fetch<Lease>(`/v1/deployments/${deploymentId}/bids/${bidId}/accept`, {
      method: 'POST'
    });
  }

  /**
   * Get deployment logs
   */
  async getLogs(deploymentId: string, follow?: boolean): Promise<ReadableStream> {
    const url = `${this.baseUrl}/v1/deployments/${deploymentId}/logs${follow ? '?follow=true' : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    
    if (!response.ok || !response.body) {
      throw new Error('Failed to fetch logs');
    }

    return response.body;
  }

  /**
   * Get deployment status with polling
   */
  async pollDeploymentStatus(
    deploymentId: string,
    targetStatus: DeploymentStatus,
    timeoutMs: number = 300000,
    intervalMs: number = 5000
  ): Promise<AkashDeployment> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const deployment = await this.getDeployment(deploymentId);
      
      if (deployment.status === targetStatus) {
        return deployment;
      }
      
      if (deployment.status === 'error') {
        throw new Error('Deployment failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error('Deployment polling timeout');
  }
}

// Singleton instance
let consoleClient: AkashConsoleClient | null = null;

export function getConsoleClient(): AkashConsoleClient {
  if (!consoleClient) {
    const apiKey = process.env.AKASH_CONSOLE_API_KEY;
    const baseUrl = process.env.AKASH_CONSOLE_API_URL || DEFAULT_BASE_URL;
    
    if (!apiKey) {
      throw new Error('AKASH_CONSOLE_API_KEY not configured');
    }
    
    consoleClient = new AkashConsoleClient({ apiKey, baseUrl });
  }
  
  return consoleClient;
}

export function resetConsoleClient(): void {
  consoleClient = null;
}

/**
 * Convenience functions using singleton
 */
export async function createDeployment(sdl: SdlSpec): Promise<AkashDeployment> {
  const client = getConsoleClient();
  return client.createDeployment({ sdl });
}

export async function getDeploymentStatus(deploymentId: string): Promise<AkashDeployment> {
  const client = getConsoleClient();
  return client.getDeployment(deploymentId);
}

export async function closeDeployment(deploymentId: string): Promise<void> {
  const client = getConsoleClient();
  return client.closeDeployment(deploymentId);
}

export async function getDeploymentBids(deploymentId: string): Promise<ProviderBid[]> {
  const client = getConsoleClient();
  return client.getBids(deploymentId);
}

export async function acceptProviderBid(deploymentId: string, bidId: string): Promise<Lease> {
  const client = getConsoleClient();
  return client.acceptBid(deploymentId, bidId);
}

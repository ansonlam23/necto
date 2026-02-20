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
  ConsoleApiConfig,
  LeaseResponse
} from '@/types/akash';
import { sdlToYAML } from '@/lib/akash/sdl-generator';

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
        'x-api-key': this.apiKey,
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
   * API expects: { data: { sdl: string (YAML), deposit: number (USD) } }
   * API returns: { data: { dseq: string, manifest: string } }
   */
  async createDeployment(sdl: SdlSpec, depositUsd: number = 5): Promise<AkashDeployment> {
    const sdlYaml = sdlToYAML(sdl);
    
    console.log('Creating deployment with SDL:');
    console.log(sdlYaml);
    
    const response = await this.fetch<{ data?: { dseq?: string; manifest?: string; data?: { dseq?: string; manifest?: string } } }>(
      '/v1/deployments',
      {
        method: 'POST',
        body: JSON.stringify({ data: { sdl: sdlYaml, deposit: depositUsd } })
      }
    );
    
    console.log('Console API response:', JSON.stringify(response, null, 2));

    const primaryData = response.data;
    const fallbackData = response.data?.data;
    const deploymentData = primaryData?.dseq ? primaryData : fallbackData;

    if (!deploymentData?.dseq) {
      throw new Error('Invalid API response: missing dseq');
    }
    if (!deploymentData.manifest || typeof deploymentData.manifest !== 'string') {
      throw new Error('Invalid API response: missing manifest');
    }

    const { dseq, manifest } = deploymentData;
    
    return {
      id: dseq,
      owner: '',
      dseq,
      status: 'pending' as DeploymentStatus,
      createdAt: new Date().toISOString(),
      sdl,
      leases: [],
      manifest,
    };
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
    await this.fetch<void>(`/v1/deployments/${deploymentId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get bids for a deployment
   * API: GET /v1/bids?dseq={dseq}
   * Returns: { data: BidResponse[] }
   */
  async getBids(deploymentId: string): Promise<ProviderBid[]> {
    const response = await this.fetch<{ data: Array<{
      bid: {
        id: {
          owner: string;
          dseq: string;
          gseq: number;
          oseq: number;
          provider: string;
          bseq: number;
        };
        state: string;
        price: {
          denom: string;
          amount: string;
        };
        created_at: string;
      };
    }> }>(`/v1/bids?dseq=${deploymentId}`);
    
    // Map bid response to ProviderBid format
    return response.data.map(item => ({
      id: `${item.bid.id.dseq}-${item.bid.id.provider}`,
      provider: item.bid.id.provider,
      price: item.bid.price,
      resources: {
        cpu: { units: '0' },
        memory: { size: '0' },
        storage: { size: '0' }
      },
      createdAt: item.bid.created_at
    }));
  }

  /**
   * Accept a bid and create a lease
   * API: POST /v1/leases
   * Request: { manifest, leases: [{ dseq, gseq, oseq, provider }] }
   */
  async acceptBid(deploymentId: string, bidId: string, manifest: string): Promise<LeaseResponse> {
    // Parse bidId to extract provider info (format: "dseq-provider")
    const parts = bidId.split('-');
    const provider = parts.length > 1 ? parts[parts.length - 1] : bidId;
    
    const response = await this.fetch<LeaseResponse>('/v1/leases', {
      method: 'POST',
      body: JSON.stringify({
        manifest: manifest,
        leases: [{
          dseq: deploymentId,
          gseq: 1,  // Default group sequence
          oseq: 1,  // Default order sequence  
          provider: provider
        }]
      })
    });

    return response;
  }

  /**
   * Get logs for a deployment
   * API: GET /v1/deployments/{dseq}/logs
   */
  async getLogs(deploymentId: string, follow: boolean = false): Promise<ReadableStream<Uint8Array>> {
    const url = `${this.baseUrl}/v1/deployments/${deploymentId}/logs?follow=${follow}`;
    const response = await fetch(url, {
      headers: {
        'x-api-key': this.apiKey,
        'Accept': 'text/event-stream'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Console API error: ${response.status} - ${error}`);
    }

    if (!response.body) {
      throw new Error('No response body from log stream');
    }

    return response.body;
  }
}

// Singleton instance
let consoleClient: AkashConsoleClient | null = null;

export function getConsoleClient(): AkashConsoleClient {
  if (!consoleClient) {
    const apiKey = process.env.AKASH_CONSOLE_API_KEY;
    if (!apiKey) {
      throw new Error('AKASH_CONSOLE_API_KEY environment variable not set');
    }
    consoleClient = new AkashConsoleClient({ apiKey });
  }
  return consoleClient;
}

export function resetConsoleClient(): void {
  consoleClient = null;
}

/**
 * Akash Network Type Definitions
 * Types for Console API integration and deployments
 * Based on official Akash SDL specification from awesome-akash
 */

export interface AkashDeployment {
  id: string;
  owner: string;
  dseq: string;
  status: DeploymentStatus;
  createdAt: string;
  expiresAt?: string;
  sdl: SdlSpec;
  leases: Lease[];
  manifest?: string;
}

export type DeploymentStatus = 
  | 'pending'
  | 'active'
  | 'closed'
  | 'error';

export interface SdlSpec {
  version: string;
  services: Record<string, Service>;
  profiles: {
    compute: Record<string, ComputeProfile>;
    placement: Record<string, PlacementProfile>;
  };
  deployment: Record<string, DeploymentConfig>;
}

export interface Service {
  image: string;
  expose: Expose[];
  env?: string[];
  command?: string[];
  args?: string[];
}

export interface Expose {
  port: number;
  as: number;
  to?: { global: boolean }[];
  accept?: string[];
}

export interface ComputeProfile {
  resources: Resources;
}

export interface Resources {
  cpu: { units: number | string };
  memory: { size: string };
  storage: { size: string }[] | { size: string };
  gpu?: {
    units: number | string;
    attributes?: GpuAttributes;
  };
}

export interface GpuAttributes {
  vendor: {
    [vendor: string]: GpuModel[] | undefined;
  };
}

export interface GpuModel {
  model: string;
}

export interface PlacementProfile {
  attributes?: Record<string, string>;
  signedBy?: { allOf?: string[]; anyOf?: string[] };
  pricing: Record<string, { denom: string; amount: string | number }>;
}

export interface DeploymentConfig {
  [provider: string]: {
    profile: string;
    count: number;
  };
}

export interface ProviderBid {
  id: string;
  provider: string;
  price: { denom: string; amount: string };
  resources: Resources;
  createdAt: string;
}

export interface Lease {
  id: string;
  provider: string;
  status: LeaseStatus;
  price: { denom: string; amount: string };
  createdAt: string;
}

export type LeaseStatus = 'active' | 'closed';

export type LeaseResponse = {
  data: {
    deployment: {
      id: {
        owner: string;
        dseq: string;
      };
      state: string;
      hash: string;
      created_at: string;
    };
    leases: {
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
      closed_on: string;
      reason?: string;
      status: {
        forwarded_ports: Record<string, {
          port: number;
          externalPort: number;
          host?: string;
          available?: number;
        }[]>;
        ips: Record<string, {
          IP: string;
          Port: number;
          ExternalPort: number;
          Protocol: string;
        }[]>;
        services: Record<string, {
          name: string;
          available: number;
          total: number;
          uris: string[];
          observed_generation: number;
          replicas: number;
          updated_replicas: number;
          ready_replicas: number;
          available_replicas: number;
        }>;
      } | null;
    }[];
    escrow_account: {
      id: { scope: string; xid: string };
      state: {
        owner: string;
        state: string;
        transferred: { denom: string; amount: string }[];
        settled_at: string;
        funds: { denom: string; amount: string }[];
        deposits: {
          owner: string;
          height: string;
          source: string;
          balance: { denom: string; amount: string };
        }[];
      };
    };
  }
}


export interface ConsoleApiConfig {
  apiKey: string;
  baseUrl?: string;
}

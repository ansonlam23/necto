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

export interface ConsoleApiConfig {
  apiKey: string;
  baseUrl?: string;
}

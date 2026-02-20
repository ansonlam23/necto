import type { SynapseProvider } from '@/lib/providers/akash-fetcher';

export interface HostedMachine {
  id: string;
  name: string;
  institutionName: string;
  hardware: {
    gpuModel: 'H100' | 'A100' | 'RTX 4090' | 'RTX 3090' | 'V100' | 'T4';
    vram: number; // in GB
    gpuCount: number;
    cpuCores: number;
    ram: number; // in GB
    storage?: number; // in GB
  };
  pricing: {
    hourlyRate: number; // in USD
    minimumRentalHours: number;
    currency: 'USD';
  };
  availability: {
    status: 'online' | 'offline' | 'maintenance';
    region: 'us-east' | 'us-west' | 'eu-west' | 'eu-central' | 'asia-pacific' | 'asia-south';
    schedule?: string; // e.g., "Weeknights only", "24/7", "Business hours"
  };
  performance: {
    uptime: number; // percentage
    avgResponseTime?: number; // ms
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    totalEarnings: number; // mock value for demo
    totalHours: number; // mock value for demo
    isVerified?: boolean;
  };
}

export interface MarketplaceState {
  hostedMachines: HostedMachine[];
  addMachine: (machine: Omit<HostedMachine, 'id' | 'metadata'>) => void;
  updateMachine: (id: string, updates: Partial<HostedMachine>) => void;
  deleteMachine: (id: string) => void;
  toggleMachineStatus: (id: string) => void;
  getMachineById: (id: string) => HostedMachine | undefined;
  getActiveMachines: () => HostedMachine[];
  convertToSynapseProviders: () => SynapseProvider[];
}

export const GPU_MODELS = [
  { value: 'H100', label: 'NVIDIA H100', vram: 80 },
  { value: 'A100', label: 'NVIDIA A100', vram: 80 },
  { value: 'RTX 4090', label: 'NVIDIA RTX 4090', vram: 24 },
  { value: 'RTX 3090', label: 'NVIDIA RTX 3090', vram: 24 },
  { value: 'V100', label: 'NVIDIA V100', vram: 32 },
  { value: 'T4', label: 'NVIDIA T4', vram: 16 },
] as const;

export const REGIONS = [
  { value: 'us-east', label: 'US East (Virginia)', flag: '🇺🇸' },
  { value: 'us-west', label: 'US West (California)', flag: '🇺🇸' },
  { value: 'eu-west', label: 'EU West (Ireland)', flag: '🇪🇺' },
  { value: 'eu-central', label: 'EU Central (Frankfurt)', flag: '🇩🇪' },
  { value: 'asia-pacific', label: 'Asia Pacific (Singapore)', flag: '🇸🇬' },
  { value: 'asia-south', label: 'Asia South (Mumbai)', flag: '🇮🇳' },
] as const;
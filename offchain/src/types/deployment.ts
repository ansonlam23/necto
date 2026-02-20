export interface DeploymentConfig {
  dockerImage?: string;
  cpu?: number;
  memory?: number;
  memoryUnit?: 'Mi' | 'Gi';
  storage?: number;
  storageUnit?: 'Mi' | 'Gi';
  gpu?: string;
  gpuCount?: number;
  port?: number;
  region?: string;
  token?: 'AKT' | 'USDC';
}

export interface DeploymentRequirement {
  key: keyof DeploymentConfig;
  label: string;
  value: string | number | null;
  optional?: boolean;
  filled?: boolean;
}

export interface ProviderMatch {
  id: string;
  name: string;
  price: number;
  uptime: number;
  hardware: {
    gpuModel?: string;
    gpuCount?: number;
    cpuCount?: number;
    memoryGB?: number;
    storageGB?: number;
  };
  region?: string;
  reason?: string;
  matchScore?: number;
}

export interface DeploymentScenario {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: string;
  color: string;
  defaults: Partial<DeploymentConfig>;
}
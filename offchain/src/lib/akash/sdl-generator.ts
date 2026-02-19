/**
 * SDL Generator Module
 * Converts natural language job requirements to Akash SDL
 * Supports templates and custom configurations
 */

import YAML from 'js-yaml';
import { SdlSpec, Service, Resources, ComputeProfile, PlacementProfile } from '@/types/akash';

export interface JobRequirements {
  name: string;
  image: string;
  command?: string[];
  args?: string[];
  env?: Record<string, string>;
  cpu?: number;
  memory?: string;
  storage?: string;
  gpu?: {
    units: number;
    model?: string;
  };
  port?: number;
  expose?: boolean;
  count?: number;
  region?: string;
}

export interface SdlTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'compute' | 'storage' | 'web';
  requirements: JobRequirements;
  tags: string[];
}

const TEMPLATES: SdlTemplate[] = [
  {
    id: 'pytorch-gpu',
    name: 'PyTorch GPU Training',
    description: 'NVIDIA GPU-optimized PyTorch environment for ML training',
    category: 'ai',
    requirements: {
      name: 'pytorch',
      image: 'pytorch/pytorch:latest',
      cpu: 4,
      memory: '16Gi',
      storage: '100Gi',
      gpu: { units: 1, model: 'nvidia' },
      port: 8888,
      expose: true
    },
    tags: ['pytorch', 'ml', 'gpu', 'jupyter']
  },
  {
    id: 'jupyter-notebook',
    name: 'Jupyter Notebook',
    description: 'Interactive Python environment with Jupyter',
    category: 'ai',
    requirements: {
      name: 'jupyter',
      image: 'jupyter/scipy-notebook:latest',
      cpu: 2,
      memory: '8Gi',
      storage: '50Gi',
      port: 8888,
      expose: true
    },
    tags: ['jupyter', 'python', 'notebook', 'data-science']
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    description: 'AI image generation with Stable Diffusion WebUI',
    category: 'ai',
    requirements: {
      name: 'sd-webui',
      image: 'neonstable/stable-diffusion-webui:latest',
      cpu: 4,
      memory: '16Gi',
      storage: '100Gi',
      gpu: { units: 1, model: 'nvidia' },
      port: 7860,
      expose: true
    },
    tags: ['stable-diffusion', 'ai', 'image-generation', 'gpu']
  },
  {
    id: 'ollama',
    name: 'Ollama LLM',
    description: 'Run local LLMs with Ollama',
    category: 'ai',
    requirements: {
      name: 'ollama',
      image: 'ollama/ollama:latest',
      cpu: 8,
      memory: '32Gi',
      storage: '200Gi',
      gpu: { units: 1, model: 'nvidia' },
      port: 11434,
      expose: true
    },
    tags: ['ollama', 'llm', 'ai', 'gpu']
  },
  {
    id: 'nginx-web',
    name: 'NGINX Web Server',
    description: 'Simple NGINX web server',
    category: 'web',
    requirements: {
      name: 'web',
      image: 'nginx:alpine',
      cpu: 0.5,
      memory: '512Mi',
      storage: '1Gi',
      port: 80,
      expose: true
    },
    tags: ['nginx', 'web', 'static']
  },
  {
    id: 'postgres-db',
    name: 'PostgreSQL Database',
    description: 'Production-ready PostgreSQL instance',
    category: 'storage',
    requirements: {
      name: 'postgres',
      image: 'postgres:15-alpine',
      env: { POSTGRES_PASSWORD: 'changeme' },
      cpu: 1,
      memory: '2Gi',
      storage: '50Gi',
      port: 5432,
      expose: false
    },
    tags: ['postgres', 'database', 'sql']
  }
];

/**
 * Generate SDL from job requirements
 */
export function generateSDL(requirements: JobRequirements): SdlSpec {
  const service: Service = {
    image: requirements.image,
    expose: []
  };

  if (requirements.command) {
    service.command = requirements.command;
  }

  if (requirements.args) {
    service.args = requirements.args;
  }

  if (requirements.env) {
    service.env = Object.entries(requirements.env).map(
      ([key, value]) => `${key}=${value}`
    );
  }

  if (requirements.port) {
    service.expose.push({
      port: requirements.port,
      as: requirements.port,
      ...(requirements.expose && { to: [{ global: true }] })
    });
  }

  const resources: Resources = {
    cpu: { units: String(requirements.cpu || 1) },
    memory: { size: requirements.memory || '1Gi' },
    storage: [{ size: requirements.storage || '10Gi' }]
  };

  if (requirements.gpu && requirements.gpu.units > 0) {
    resources.gpu = {
      units: String(requirements.gpu.units),
      attributes: requirements.gpu.model
        ? [{ key: 'vendor', value: 'nvidia' }]
        : undefined
    };
  }

  const computeProfile: ComputeProfile = { resources };

  const placementProfile: PlacementProfile = {
    pricing: {
      [requirements.name]: { denom: 'uakt', amount: '1000' }
    }
  };

  if (requirements.region) {
    placementProfile.attributes = [
      { key: 'region', value: requirements.region }
    ];
  }

  return {
    version: '2.0',
    services: {
      [requirements.name]: service
    },
    profiles: {
      compute: {
        [requirements.name]: computeProfile
      },
      placement: {
        [requirements.name]: placementProfile
      }
    },
    deployment: {
      [requirements.name]: {
        profile: requirements.name,
        count: requirements.count || 1
      }
    }
  };
}

/**
 * Generate SDL from template ID
 */
export function generateFromTemplate(templateId: string): SdlSpec {
  const template = TEMPLATES.find(t => t.id === templateId);
  
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  
  return generateSDL(template.requirements);
}

/**
 * Validate SDL structure
 */
export function validateSDL(sdl: SdlSpec): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!sdl.version) {
    errors.push('Missing SDL version');
  }

  if (!sdl.services || Object.keys(sdl.services).length === 0) {
    errors.push('At least one service required');
  }

  for (const [name, service] of Object.entries(sdl.services)) {
    if (!service.image) {
      errors.push(`Service ${name}: missing image`);
    }
  }

  if (!sdl.profiles?.compute || Object.keys(sdl.profiles.compute).length === 0) {
    errors.push('Missing compute profiles');
  }

  if (!sdl.profiles?.placement || Object.keys(sdl.profiles.placement).length === 0) {
    errors.push('Missing placement profiles');
  }

  if (!sdl.deployment || Object.keys(sdl.deployment).length === 0) {
    errors.push('Missing deployment configuration');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get all available templates
 */
export function getTemplates(category?: SdlTemplate['category']): SdlTemplate[] {
  if (category) {
    return TEMPLATES.filter(t => t.category === category);
  }
  return [...TEMPLATES];
}

/**
 * Search templates by tags or name
 */
export function searchTemplates(query: string): SdlTemplate[] {
  const lowerQuery = query.toLowerCase();
  return TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Parse natural language to requirements
 * Simple keyword-based parser
 */
export function parseNaturalLanguage(input: string): Partial<JobRequirements> {
  const requirements: Partial<JobRequirements> = {};
  const lower = input.toLowerCase();

  // Detect GPU needs and extract count
  if (lower.includes('gpu') || lower.includes('nvidia') || lower.includes('cuda')) {
    // Try to extract GPU count from patterns like "2 GPUs", "2x GPU", "2 GPU"
    const gpuCountMatch = lower.match(/(\d+)\s*(?:x\s*)?gpus?/);
    const gpuUnits = gpuCountMatch ? parseInt(gpuCountMatch[1], 10) : 1;
    requirements.gpu = { units: gpuUnits };
  }

  // Detect ML/AI frameworks
  if (lower.includes('pytorch') || lower.includes('torch')) {
    requirements.image = 'pytorch/pytorch:latest';
    requirements.name = 'pytorch';
  } else if (lower.includes('tensorflow') || lower.includes('tf')) {
    requirements.image = 'tensorflow/tensorflow:latest-gpu';
    requirements.name = 'tensorflow';
  } else if (lower.includes('jupyter') || lower.includes('notebook')) {
    requirements.image = 'jupyter/scipy-notebook:latest';
    requirements.name = 'jupyter';
  } else if (lower.includes('stable diffusion') || lower.includes('sd')) {
    requirements.image = 'neonstable/stable-diffusion-webui:latest';
    requirements.name = 'sd-webui';
    requirements.gpu = { units: requirements.gpu?.units || 1, model: 'nvidia' };
  } else if (lower.includes('ollama') || lower.includes('llm')) {
    requirements.image = 'ollama/ollama:latest';
    requirements.name = 'ollama';
    requirements.gpu = { units: requirements.gpu?.units || 1, model: 'nvidia' };
  }

  // Detect resource requirements
  const cpuMatch = lower.match(/(\d+)\s*cpu/);
  if (cpuMatch) {
    requirements.cpu = parseInt(cpuMatch[1], 10);
  }

  const memoryMatch = lower.match(/(\d+)\s*gb?\s*(ram|memory)/);
  if (memoryMatch) {
    requirements.memory = `${memoryMatch[1]}Gi`;
  }

  return requirements;
}

/**
 * Convert SDL to YAML string
 */
export function sdlToYAML(sdl: SdlSpec): string {
  // Simple YAML serialization
  const indent = (level: number) => '  '.repeat(level);
  
  let yaml = `version: "${sdl.version}"\n\n`;
  
  yaml += 'services:\n';
  for (const [name, service] of Object.entries(sdl.services)) {
    yaml += `${indent(1)}${name}:\n`;
    yaml += `${indent(2)}image: ${service.image}\n`;
    
    if (service.command) {
      yaml += `${indent(2)}command:\n`;
      for (const cmd of service.command) {
        yaml += `${indent(3)}- ${cmd}\n`;
      }
    }
    
    if (service.args) {
      yaml += `${indent(2)}args:\n`;
      for (const arg of service.args) {
        yaml += `${indent(3)}- ${arg}\n`;
      }
    }
    
    if (service.env) {
      yaml += `${indent(2)}env:\n`;
      for (const env of service.env) {
        yaml += `${indent(3)}- ${env}\n`;
      }
    }
    
    if (service.expose.length > 0) {
      yaml += `${indent(2)}expose:\n`;
      for (const exp of service.expose) {
        yaml += `${indent(3)}- port: ${exp.port}\n`;
        yaml += `${indent(4)}as: ${exp.as}\n`;
        if (exp.to) {
          yaml += `${indent(4)}to:\n`;
          for (const to of exp.to) {
            yaml += `${indent(5)}- global: ${to.global}\n`;
          }
        }
      }
    }
  }
  
  yaml += '\nprofiles:\n';
  yaml += `${indent(1)}compute:\n`;
  for (const [name, profile] of Object.entries(sdl.profiles.compute)) {
    yaml += `${indent(2)}${name}:\n`;
    yaml += `${indent(3)}resources:\n`;
    yaml += `${indent(4)}cpu:\n`;
    yaml += `${indent(5)}units: ${profile.resources.cpu.units}\n`;
    yaml += `${indent(4)}memory:\n`;
    yaml += `${indent(5)}size: ${profile.resources.memory.size}\n`;
    
    if (profile.resources.storage.length > 0) {
      yaml += `${indent(4)}storage:\n`;
      for (const storage of profile.resources.storage) {
        yaml += `${indent(5)}- size: ${storage.size}\n`;
      }
    }
    
    if (profile.resources.gpu) {
      yaml += `${indent(4)}gpu:\n`;
      yaml += `${indent(5)}units: ${profile.resources.gpu.units}\n`;
      if (profile.resources.gpu.attributes) {
        yaml += `${indent(5)}attributes:\n`;
        for (const attr of profile.resources.gpu.attributes) {
          yaml += `${indent(6)}- key: ${attr.key}\n`;
          yaml += `${indent(7)}value: ${attr.value}\n`;
        }
      }
    }
  }
  
  yaml += `${indent(1)}placement:\n`;
  for (const [name, placement] of Object.entries(sdl.profiles.placement)) {
    yaml += `${indent(2)}${name}:\n`;
    yaml += `${indent(3)}pricing:\n`;
    for (const [svc, price] of Object.entries(placement.pricing)) {
      yaml += `${indent(4)}${svc}:\n`;
      yaml += `${indent(5)}denom: ${price.denom}\n`;
      yaml += `${indent(5)}amount: ${price.amount}\n`;
    }
  }
  
  yaml += '\ndeployment:\n';
  for (const [name, config] of Object.entries(sdl.deployment)) {
    yaml += `${indent(1)}${name}:\n`;
    yaml += `${indent(2)}profile: ${config.profile}\n`;
    yaml += `${indent(2)}count: ${config.count}\n`;
  }
  
  return yaml;
}

/**
 * Parse YAML string to SDL specification
 */
export function parseYAMLToSDL(yamlString: string): { sdl: SdlSpec | null; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const parsed = YAML.load(yamlString) as Record<string, unknown>;
    
    if (!parsed || typeof parsed !== 'object') {
      errors.push('Invalid YAML: must be an object');
      return { sdl: null, errors };
    }
    
    // Validate required top-level keys
    if (!parsed.version) errors.push('Missing required field: version');
    if (!parsed.services) errors.push('Missing required field: services');
    if (!parsed.deployment) errors.push('Missing required field: deployment');
    if (!parsed.profiles) errors.push('Missing required field: profiles');
    
    if (errors.length > 0) {
      return { sdl: null, errors };
    }
    
    // Cast to SdlSpec (runtime validation is lenient)
    return { sdl: parsed as unknown as SdlSpec, errors: [] };
  } catch (err) {
    errors.push(`YAML parse error: ${err instanceof Error ? err.message : String(err)}`);
    return { sdl: null, errors };
  }
}

/**
 * Docker Image Resolver
 * Uses pattern matching to resolve natural language to Docker Hub images
 */

// Common Docker Hub images mapping
export const DOCKER_IMAGE_MAP: Record<string, { image: string; category: string; port?: number }> = {
  // AI/ML Frameworks
  'pytorch': { image: 'pytorch/pytorch:latest', category: 'ai', port: 8888 },
  'tensorflow': { image: 'tensorflow/tensorflow:latest-gpu', category: 'ai', port: 8888 },
  'jupyter': { image: 'jupyter/scipy-notebook:latest', category: 'ai', port: 8888 },
  'stable-diffusion': { image: 'neonstable/stable-diffusion-webui:latest', category: 'ai', port: 7860 },
  'ollama': { image: 'ollama/ollama:latest', category: 'ai', port: 11434 },
  'llama': { image: 'ollama/ollama:latest', category: 'ai', port: 11434 },
  'comfyui': { image: 'yanwk/comfyui-boot:latest', category: 'ai', port: 8188 },
  'invokeai': { image: 'invokeai/invokeai:latest', category: 'ai', port: 9090 },
  
  // Databases
  'postgres': { image: 'postgres:15-alpine', category: 'database', port: 5432 },
  'postgresql': { image: 'postgres:15-alpine', category: 'database', port: 5432 },
  'mysql': { image: 'mysql:8.0', category: 'database', port: 3306 },
  'redis': { image: 'redis:7-alpine', category: 'database', port: 6379 },
  'mongodb': { image: 'mongo:6', category: 'database', port: 27017 },
  
  // Web Servers
  'nginx': { image: 'nginx:alpine', category: 'web', port: 80 },
  'apache': { image: 'httpd:alpine', category: 'web', port: 80 },
  'caddy': { image: 'caddy:alpine', category: 'web', port: 80 },
  
  // Development
  'ubuntu': { image: 'ubuntu:22.04', category: 'os' },
  'debian': { image: 'debian:bookworm-slim', category: 'os' },
  'alpine': { image: 'alpine:latest', category: 'os' },
  'node': { image: 'node:20-alpine', category: 'dev', port: 3000 },
  'python': { image: 'python:3.11-slim', category: 'dev' },
  'golang': { image: 'golang:1.21-alpine', category: 'dev' },
  'rust': { image: 'rust:1.75-slim', category: 'dev' },
  
  // Specialized AI
  'automatic1111': { image: 'AUTOMATIC1111/stable-diffusion-webui:latest', category: 'ai', port: 7860 },
  'text-generation-webui': { image: 'atinoda/text-generation-webui:default', category: 'ai', port: 7860 },
  'koboldai': { image: 'koboldai/koboldai:latest', category: 'ai', port: 5000 },
  'tabbyml': { image: 'tabbyml/tabby:latest', category: 'ai', port: 8080 },
};

export interface ImageResolutionResult {
  image: string;
  category: string;
  port?: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'exact' | 'pattern' | 'inferred';
}

/**
 * Parse natural language description to extract Docker image
 * Uses keyword matching and pattern recognition
 */
export function resolveDockerImage(description: string): ImageResolutionResult | null {
  const lowerDesc = description.toLowerCase();
  
  // First, check for exact matches in the map
  for (const [key, value] of Object.entries(DOCKER_IMAGE_MAP)) {
    // Check for word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lowerDesc)) {
      return {
        image: value.image,
        category: value.category,
        port: value.port,
        confidence: 'high',
        source: 'exact'
      };
    }
  }
  
  // Pattern matching for common phrases
  const patterns: Array<{ regex: RegExp; image: string; category: string; port?: number }> = [
    // AI/ML patterns
    { regex: /\b(sd|stable.?diffusion)\b/i, image: 'neonstable/stable-diffusion-webui:latest', category: 'ai', port: 7860 },
    { regex: /\b(llm|large.?language.?model)\b/i, image: 'ollama/ollama:latest', category: 'ai', port: 11434 },
    { regex: /\b(gpt|chatbot|ai.?chat)\b/i, image: 'ollama/ollama:latest', category: 'ai', port: 11434 },
    { regex: /\b(ml|machine.?learning|deep.?learning)\b/i, image: 'pytorch/pytorch:latest', category: 'ai', port: 8888 },
    { regex: /\b(training|fine.?tuning)\b/i, image: 'pytorch/pytorch:latest', category: 'ai', port: 8888 },
    
    // Database patterns
    { regex: /\b(database|db|sql)\b/i, image: 'postgres:15-alpine', category: 'database', port: 5432 },
    { regex: /\b(cache|caching)\b/i, image: 'redis:7-alpine', category: 'database', port: 6379 },
    
    // Web patterns
    { regex: /\b(web.?server|static.?site)\b/i, image: 'nginx:alpine', category: 'web', port: 80 },
    { regex: /\b(api|backend|server)\b/i, image: 'node:20-alpine', category: 'dev', port: 3000 },
    
    // Development patterns
    { regex: /\b(development|dev.?environment|coding)\b/i, image: 'ubuntu:22.04', category: 'os' },
  ];
  
  for (const pattern of patterns) {
    if (pattern.regex.test(lowerDesc)) {
      return {
        image: pattern.image,
        category: pattern.category,
        port: pattern.port,
        confidence: 'medium',
        source: 'pattern'
      };
    }
  }
  
  // GPU workload inference
  if (/\b(gpu|nvidia|cuda|video.?card)\b/i.test(lowerDesc)) {
    return {
      image: 'pytorch/pytorch:latest',
      category: 'ai',
      port: 8888,
      confidence: 'low',
      source: 'inferred'
    };
  }
  
  return null;
}

/**
 * Get suggested images based on category
 */
export function getSuggestedImages(category?: string): Array<{ image: string; description: string; category: string }> {
  const suggestions: Array<{ image: string; description: string; category: string }> = [
    { image: 'pytorch/pytorch:latest', description: 'PyTorch ML framework', category: 'ai' },
    { image: 'tensorflow/tensorflow:latest-gpu', description: 'TensorFlow ML framework', category: 'ai' },
    { image: 'jupyter/scipy-notebook:latest', description: 'Jupyter Notebook environment', category: 'ai' },
    { image: 'ollama/ollama:latest', description: 'Run local LLMs', category: 'ai' },
    { image: 'neonstable/stable-diffusion-webui:latest', description: 'Stable Diffusion WebUI', category: 'ai' },
    { image: 'postgres:15-alpine', description: 'PostgreSQL database', category: 'database' },
    { image: 'redis:7-alpine', description: 'Redis cache', category: 'database' },
    { image: 'nginx:alpine', description: 'NGINX web server', category: 'web' },
    { image: 'node:20-alpine', description: 'Node.js runtime', category: 'dev' },
    { image: 'python:3.11-slim', description: 'Python runtime', category: 'dev' },
    { image: 'ubuntu:22.04', description: 'Ubuntu Linux', category: 'os' },
  ];
  
  if (category) {
    return suggestions.filter(s => s.category === category);
  }
  
  return suggestions;
}

/**
 * Validate if a string looks like a valid Docker image reference
 */
export function isValidDockerImage(image: string): boolean {
  // Basic validation: must contain a colon (tag) or slash (namespace)
  // Valid examples: nginx:alpine, library/nginx:latest, pytorch/pytorch:2.0
  const dockerImageRegex = /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[\w.-]+)?$/i;
  return dockerImageRegex.test(image);
}

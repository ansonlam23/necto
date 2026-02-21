import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { fetchAkashProviders } from '@/lib/providers/akash-fetcher';
import type { DeploymentConfig } from '@/types/deployment';

// Context7 integration for documentation
const CONTEXT7_LIBRARY = '/websites/akash_network';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Workload knowledge base for intelligent defaults
const WORKLOAD_DEFAULTS: Record<string, Partial<DeploymentConfig>> = {
  minecraft: {
    dockerImage: 'itzg/minecraft-server',
    cpu: 4,
    memory: 8,
    memoryUnit: 'Gi',
    storage: 20,
    storageUnit: 'Gi',
    port: 25565,
  },
  'llama3': {
    dockerImage: 'ollama/ollama',
    cpu: 8,
    memory: 32,
    memoryUnit: 'Gi',
    storage: 100,
    storageUnit: 'Gi',
    gpu: 'H100',
    gpuCount: 1,
  },
  'stable-diffusion': {
    dockerImage: 'runpod/stable-diffusion:web-ui',
    cpu: 4,
    memory: 16,
    memoryUnit: 'Gi',
    storage: 50,
    storageUnit: 'Gi',
    gpu: 'RTX4090',
    gpuCount: 1,
    port: 7860,
  },
  nginx: {
    dockerImage: 'nginx:latest',
    cpu: 2,
    memory: 4,
    memoryUnit: 'Gi',
    storage: 10,
    storageUnit: 'Gi',
    port: 80,
  },
  postgres: {
    dockerImage: 'postgres:15',
    cpu: 4,
    memory: 8,
    memoryUnit: 'Gi',
    storage: 50,
    storageUnit: 'Gi',
    port: 5432,
  },
  nodejs: {
    dockerImage: 'node:18-alpine',
    cpu: 1,
    memory: 2,
    memoryUnit: 'Gi',
    storage: 5,
    storageUnit: 'Gi',
    port: 3000,
  },
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
      process.env.GOOGLE_AI_STUDIO_API_KEY ??
      process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Gemini API key not configured. Please add GOOGLE_AI_STUDIO_API_KEY to your .env.local file.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const model = google('gemini-2.5-flash');

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model,
      messages: modelMessages,
      stopWhen: stepCountIs(3),
      system: `# ROLE
You are an expert DevOps engineer and infrastructure specialist. Your job is to help users deploy applications by intelligently inferring ALL hardware requirements from their descriptions.

# CRITICAL BEHAVIOR
1. **PROACTIVE INFERENCE**: When a user mentions ANY workload, you MUST immediately infer ALL specs
2. **USE DEFAULTS**: If user doesn't specify details, use intelligent defaults based on the workload type
3. **IMMEDIATE ACTION**: Call proposeDeployment as soon as you understand the task (even from the first message)
4. **NO QUESTIONS FIRST**: Don't ask for specs - infer them and present them for confirmation

# WORKLOAD INTELLIGENCE
When you recognize a workload type, use these defaults:

**Minecraft Server**:
- Image: itzg/minecraft-server, CPU: 4, RAM: 8Gi, Storage: 20Gi, Port: 25565

**LLM/AI Training** (Llama, GPT, etc):
- Image: ollama/ollama or appropriate, CPU: 8, RAM: 32Gi, Storage: 100Gi, GPU: H100 or A100

**Stable Diffusion/Image Generation**:
- Image: runpod/stable-diffusion:web-ui, CPU: 4, RAM: 16Gi, Storage: 50Gi, GPU: RTX4090, Port: 7860

**Web Server** (nginx, apache):
- Image: nginx:latest, CPU: 2, RAM: 4Gi, Storage: 10Gi, Port: 80

**Database** (postgres, mysql, mongo):
- Image: [db]:latest, CPU: 4, RAM: 8Gi, Storage: 50Gi, Port: standard db port

**Node.js/Python Apps**:
- Image: node:18 or python:3.11, CPU: 1-2, RAM: 2-4Gi, Storage: 5-10Gi, Port: 3000/8000

# WORKFLOW
1. User describes task (e.g., "I want to host a Minecraft server")
2. IMMEDIATELY call proposeDeployment with COMPLETE configuration
3. Then call searchAkash to find best provider
4. Present the configuration and provider recommendation in natural language
5. Ask for confirmation to proceed

# REASONING OUTPUTS
- After tool calls complete, provide detailed reasoning for each decision (workload type, specs, provider choice).
- Base the reasoning explicitly on user input and any inferred defaults.
- Keep reasoning in plain language; do not reveal tool mechanics.

# PROVIDER MESSAGING
- Do NOT mention which networks are available before you have a provider result.
- When presenting results, use neutral language and then recommend the best option.

# TOOL USAGE
- **proposeDeployment**: Call this IMMEDIATELY with full config (don't wait for user to provide specs)
- **searchAkash**: Call this right after proposeDeployment succeeds
- **generateSDL**: Use to create deployment manifest when user confirms provider selection

# EXAMPLE INTERACTION
User: "I need to run a Minecraft server"
You: [Immediately call proposeDeployment with Minecraft defaults]
You: "I've configured a Minecraft server deployment with 4 vCPU, 8GB RAM, and 20GB storage. Searching for the best provider..."
You: [Call searchAkash]
You: "Found a strong match at $0.05/hr with 99.9% uptime. It seems Akash Network is the best option in this case because it balances cost and reliability. Ready to deploy?"

Remember: BE PROACTIVE. Don't ask questions first. Infer and confirm.`,
      tools: {
        proposeDeployment: tool({
          description: 'Propose a complete deployment configuration based on user requirements',
          inputSchema: z.object({
            workloadType: z.string().describe('Type of workload (minecraft, llama3, nginx, etc)'),
            dockerImage: z.string().describe('Docker image to deploy'),
            cpu: z.number().describe('CPU units (vCPU count)'),
            memory: z.number().describe('Memory amount'),
            memoryUnit: z.enum(['Mi', 'Gi']).describe('Memory unit'),
            storage: z.number().describe('Storage amount'),
            storageUnit: z.enum(['Mi', 'Gi']).describe('Storage unit'),
            gpu: z.string().optional().describe('GPU model if needed'),
            gpuCount: z.number().optional().describe('Number of GPUs'),
            port: z.number().optional().describe('Port to expose'),
            region: z.string().optional().describe('Preferred region'),
            reasoning: z.string().describe('Brief explanation of why these specs were chosen'),
          }),
          execute: async (params) => {
            const config: DeploymentConfig = {
              dockerImage: params.dockerImage,
              cpu: params.cpu,
              memory: params.memory,
              memoryUnit: params.memoryUnit,
              storage: params.storage,
              storageUnit: params.storageUnit,
              gpu: params.gpu,
              gpuCount: params.gpuCount,
              port: params.port,
              region: params.region,
            };

            return {
              success: true,
              config,
              workloadType: params.workloadType,
              reasoning: params.reasoning,
              readyToSearch: true,
              message: `Configuration complete for ${params.workloadType}`,
            };
          },
        }),

        searchAkash: tool({
          description: 'Search for Akash providers matching the proposed configuration',
          inputSchema: z.object({
            minCpu: z.number().describe('Minimum CPU units required'),
            minMemoryGB: z.number().describe('Minimum memory in GB'),
            minStorageGB: z.number().describe('Minimum storage in GB'),
            gpuModel: z.string().optional().describe('GPU model if required'),
            maxPrice: z.number().optional().describe('Maximum price per hour in USD'),
          }),
          execute: async ({ minCpu, minMemoryGB, minStorageGB, gpuModel }) => {
            try {
              const providers = await fetchAkashProviders();

              // Filter providers
              const filtered = providers.filter(p => {
                const providerCpu = p.hardware.cpuCount || Math.round(p.hardware.cpuUnits / 1000);
                if (providerCpu < minCpu) return false;

                const providerMemoryGB = p.hardware.memoryGB || (p.hardware.memory / (1024 ** 3));
                if (providerMemoryGB < minMemoryGB) return false;

                const providerStorageGB = p.hardware.storageGB || providerMemoryGB * 2;
                if (providerStorageGB < minStorageGB) return false;

                if (gpuModel && !p.hardware.gpuModel?.toLowerCase().includes(gpuModel.toLowerCase())) {
                  return false;
                }

                return true;
              });

              // Sort by price and uptime
              filtered.sort((a, b) => {
                const scoreA = (a.priceEstimate * 100) - (a.uptimePercentage * 0.5);
                const scoreB = (b.priceEstimate * 100) - (b.uptimePercentage * 0.5);
                return scoreA - scoreB;
              });

              const topProviders = filtered.slice(0, 3);

              if (topProviders.length === 0) {
                return {
                  success: false,
                  message: 'No providers found matching your requirements',
                  totalFound: 0,
                };
              }

              return {
                success: true,
                totalFound: filtered.length,
                bestProvider: {
                  id: topProviders[0].id,
                  name: topProviders[0].name,
                  price: topProviders[0].priceEstimate,
                  uptime: topProviders[0].uptimePercentage,
                  hardware: {
                    gpuModel: topProviders[0].hardware.gpuModel,
                    gpuCount: topProviders[0].hardware.gpuCount,
                    cpuCount: topProviders[0].hardware.cpuCount || Math.round(topProviders[0].hardware.cpuUnits / 1000),
                    memoryGB: topProviders[0].hardware.memoryGB || Math.round(topProviders[0].hardware.memory / (1024 ** 3)),
                    storageGB: topProviders[0].hardware.storageGB || Math.round(topProviders[0].hardware.memory / (1024 ** 3)) * 2,
                  },
                  region: topProviders[0].region || 'Global',
                  reason: `Best balance of price ($${topProviders[0].priceEstimate.toFixed(4)}/hr) and reliability (${topProviders[0].uptimePercentage.toFixed(1)}% uptime)`,
                },
                alternatives: topProviders.slice(1).map(p => ({
                  name: p.name,
                  price: p.priceEstimate,
                  uptime: p.uptimePercentage,
                })),
              };
            } catch (error) {
              return {
                success: false,
                error: 'Failed to search Akash providers',
              };
            }
          },
        }),

        generateSDL: tool({
          description: 'Generate Akash SDL deployment manifest',
          inputSchema: z.object({
            providerId: z.string(),
            dockerImage: z.string(),
            cpu: z.number(),
            memoryMi: z.number(),
            storageMi: z.number(),
            gpuCount: z.number().optional(),
            port: z.number().optional(),
          }),
          execute: async (params) => {
            const sdl = `---
version: "2.0"

services:
  app:
    image: ${params.dockerImage}
    ${params.port ? `expose:
      - port: ${params.port}
        as: ${params.port}
        proto: tcp
        to:
          - global: true` : ''}

profiles:
  compute:
    app:
      resources:
        cpu:
          units: ${params.cpu}
        memory:
          size: ${params.memoryMi}Mi
        storage:
          size: ${params.storageMi}Mi
        ${params.gpuCount ? `gpu:
          units: ${params.gpuCount}` : ''}

  placement:
    akash:
      attributes:
        host: ${params.providerId}
      pricing:
        app:
          denom: uakt
          amount: 1000

deployment:
  app:
    akash:
      profile: app
      count: 1`;

            return {
              success: true,
              sdl,
              filename: 'deploy.yaml',
              message: 'SDL manifest generated successfully',
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('AGENTv2 Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

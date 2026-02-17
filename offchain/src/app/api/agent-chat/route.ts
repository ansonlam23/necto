import { streamText, tool, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { fetchAkashProviders, type SynapseProvider } from '@/lib/providers/akash-fetcher';

// Allow streaming responses properly
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Deployment configuration schema
const deploymentConfigSchema = z.object({
  dockerImage: z.string().optional(),
  cpu: z.number().optional(),
  memory: z.number().optional(),
  memoryUnit: z.enum(['Mi', 'Gi']).optional(),
  storage: z.number().optional(),
  storageUnit: z.enum(['Mi', 'Gi']).optional(),
  gpu: z.string().optional(),
  gpuCount: z.number().optional(),
  port: z.number().optional(),
  token: z.enum(['AKT', 'USDC']).optional(),
  region: z.string().optional(),
});

type DeploymentConfig = z.infer<typeof deploymentConfigSchema>;

// Store conversation context
interface ConversationContext {
  deploymentConfig: DeploymentConfig;
  gatheredInfo: Set<string>;
  candidateProviders?: SynapseProvider[];
}

const contexts = new Map<string, ConversationContext>();

function getContext(sessionId: string): ConversationContext {
  if (!contexts.has(sessionId)) {
    contexts.set(sessionId, {
      deploymentConfig: {},
      gatheredInfo: new Set(),
    });
  }
  return contexts.get(sessionId)!;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Check for API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Gemini API key not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use a session ID (in production, you'd want to use proper session management)
    const sessionId = 'default-session';
    const context = getContext(sessionId);

    // Initialize Gemini model
    const model = google('gemini-2.5-flash-lite');

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages);

    // Stream the response with tools
    const result = streamText({
      model,
      messages: modelMessages,
      system: `# ROLE
You are an expert Infrastructure Consultant for the Akash Network (DeCloud). Your goal is to match users with the optimal Akash Provider for their specific container deployment needs.

# CONTEXT & CONSTRAINTS
1. **Source of Truth:** You have access to live Akash Network providers through the searchProviders tool. You must ONLY recommend providers from this list.
2. **Interactive Process:** You cannot recommend a provider until you fully understand the user's hardware and network requirements.
3. **Deployment Specs:** To make an accurate recommendation, you must obtain the configuration details used in the standard Akash deployment manifest (SDL).

# INFORMATION GATHERING STRATEGY
Before making recommendations, gather the following specifications:

**Required Specifications:**
- **Docker Image:** (e.g., nginx:latest, ubuntu:22.04, or custom image)
- **CPU:** (Units, e.g., 0.1, 1.0, 4.0)
- **Memory:** (Amount & Unit, e.g., 512Mi, 4Gi)
- **Storage:** (Amount & Unit, e.g., 1Gi, 100Gi)

**Optional Specifications:**
- **GPU:** (Required? If yes, specific model or VRAM count?)
- **Expose Port:** (e.g., 80, 443, 3000)
- **Token:** (e.g., AKT, USDC)
- **Region:** (Geographic preference)

# CRITICAL WORKFLOW
1. **ALWAYS** use gatherRequirements tool for EACH piece of information the user provides
2. Track requirements using the tool - the UI will update automatically
3. When gatherRequirements returns readyToSearch: true, IMMEDIATELY call searchProviders
4. The UI will display the recommendation automatically

# PROVIDER SELECTION LOGIC
Once you have ALL required fields (docker image, cpu, memory, storage):
1. **Immediately** call searchProviders tool with appropriate parameters
2. Convert memory/storage to GB for the search (e.g., 4Gi = 4GB, 512Mi = 0.5GB)
3. The tool will return top providers sorted by price and reliability
4. The UI will automatically display the best provider

# OUTPUT FORMAT
After searchProviders completes, provide a brief summary:

✅ **Found the perfect provider!**

I've identified **[Provider Name]** as the optimal choice for your deployment.

Key benefits:
- Matches all your hardware requirements
- Excellent uptime: [X]%
- Competitive pricing: $[X]/hour
- [Any other relevant detail]

Would you like me to generate the deployment manifest (SDL) for this provider?

# CONVERSATION FLOW
1. Greet the user and explain your role
2. Parse any initial requirements from their message
3. **IMMEDIATELY** use gatherRequirements for EACH field mentioned
4. Ask for missing required fields
5. As soon as ALL required fields are gathered, automatically call searchProviders
6. Confirm the recommendation and offer to generate SDL`,
      tools: {
        gatherRequirements: tool({
          description: 'Track and validate deployment requirements gathering',
          inputSchema: z.object({
            field: z.string().describe('The requirement field being gathered'),
            value: z.any().describe('The value provided by the user'),
            stillNeeded: z.array(z.string()).describe('List of fields still needed'),
          }),
          execute: async ({ field, value, stillNeeded }) => {
            context.gatheredInfo.add(field);

            // Update deployment config
            if (field === 'cpu') context.deploymentConfig.cpu = Number(value);
            if (field === 'memory') {
              const match = String(value).match(/(\d+)\s*(Mi|Gi)/i);
              if (match) {
                context.deploymentConfig.memory = Number(match[1]);
                context.deploymentConfig.memoryUnit = match[2] as 'Mi' | 'Gi';
              }
            }
            if (field === 'storage') {
              const match = String(value).match(/(\d+)\s*(Mi|Gi)/i);
              if (match) {
                context.deploymentConfig.storage = Number(match[1]);
                context.deploymentConfig.storageUnit = match[2] as 'Mi' | 'Gi';
              }
            }
            if (field === 'dockerImage') context.deploymentConfig.dockerImage = String(value);
            if (field === 'gpu') context.deploymentConfig.gpu = String(value);
            if (field === 'port') context.deploymentConfig.port = Number(value);
            if (field === 'region') context.deploymentConfig.region = String(value);

            const required = ['cpu', 'memory', 'storage', 'dockerImage'];
            const missing = required.filter(r => !context.gatheredInfo.has(r));

            // Format the value for display
            let displayValue = value;
            if (field === 'cpu') displayValue = `${value} units`;
            if (field === 'memory' && context.deploymentConfig.memoryUnit) {
              displayValue = `${context.deploymentConfig.memory}${context.deploymentConfig.memoryUnit}`;
            }
            if (field === 'storage' && context.deploymentConfig.storageUnit) {
              displayValue = `${context.deploymentConfig.storage}${context.deploymentConfig.storageUnit}`;
            }

            return {
              success: true,
              field,
              value,
              displayValue,
              currentConfig: context.deploymentConfig,
              stillNeeded: missing.length > 0 ? missing : [],
              readyToSearch: missing.length === 0,
              requirementUpdate: {
                field,
                value: displayValue,
                allRequirements: {
                  dockerImage: context.deploymentConfig.dockerImage || null,
                  cpu: context.deploymentConfig.cpu ? `${context.deploymentConfig.cpu} units` : null,
                  memory: context.deploymentConfig.memory && context.deploymentConfig.memoryUnit
                    ? `${context.deploymentConfig.memory}${context.deploymentConfig.memoryUnit}`
                    : null,
                  storage: context.deploymentConfig.storage && context.deploymentConfig.storageUnit
                    ? `${context.deploymentConfig.storage}${context.deploymentConfig.storageUnit}`
                    : null,
                  gpu: context.deploymentConfig.gpu || null,
                  port: context.deploymentConfig.port || null,
                }
              }
            };
          },
        }),

        searchProviders: tool({
          description: 'Search for Akash providers matching deployment requirements',
          inputSchema: z.object({
            minCpu: z.number().describe('Minimum CPU units required'),
            minMemoryGB: z.number().describe('Minimum memory in GB'),
            minStorageGB: z.number().describe('Minimum storage in GB'),
            gpuModel: z.string().optional().describe('GPU model if required'),
            maxPrice: z.number().optional().describe('Maximum price per hour'),
          }),
          execute: async ({ minCpu, minMemoryGB, minStorageGB, gpuModel, maxPrice }) => {
            try {
              // Fetch providers using existing function
              const providers = await fetchAkashProviders();

              // Apply filters
              let filtered = providers.filter(p => {
                // Check CPU (convert CPU units to cores approximately)
                const providerCpu = p.hardware.cpuCount || Math.round(p.hardware.cpuUnits / 1000);
                if (providerCpu < minCpu) return false;

                // Check Memory
                const providerMemoryGB = p.hardware.memoryGB || (p.hardware.memory / (1024 ** 3));
                if (providerMemoryGB < minMemoryGB) return false;

                // Check Storage (estimate if not provided)
                const providerStorageGB = p.hardware.storageGB || providerMemoryGB * 2;
                if (providerStorageGB < minStorageGB) return false;

                // Check GPU if required
                if (gpuModel && !p.hardware.gpuModel.toLowerCase().includes(gpuModel.toLowerCase())) {
                  return false;
                }

                // Check price if specified
                if (maxPrice && p.priceEstimate > maxPrice) return false;

                return true;
              });

              // Sort by a combination of price and uptime
              filtered.sort((a, b) => {
                const uptimeWeight = (b.uptimePercentage - a.uptimePercentage) * 0.01;
                const priceWeight = (a.priceEstimate - b.priceEstimate);
                return uptimeWeight * 2 + priceWeight;
              });

              // Store candidates in context
              context.candidateProviders = filtered.slice(0, 5);

              return {
                success: true,
                totalFound: filtered.length,
                topProviders: context.candidateProviders.map(p => ({
                  id: p.id,
                  name: p.name,
                  gpuModel: p.hardware.gpuModel,
                  gpuCount: p.hardware.gpuCount,
                  cpuCount: p.hardware.cpuCount || Math.round(p.hardware.cpuUnits / 1000),
                  memoryGB: p.hardware.memoryGB || Math.round(p.hardware.memory / (1024 ** 3)),
                  storageGB: p.hardware.storageGB || Math.round(p.hardware.memory / (1024 ** 3)) * 2,
                  pricePerHour: p.priceEstimate,
                  uptime: p.uptimePercentage,
                  region: p.region || 'Global',
                })),
                recommendation: filtered.length > 0 ? {
                  provider: context.candidateProviders[0].name,
                  reason: `Best balance of price ($${context.candidateProviders[0].priceEstimate}/hr) and reliability (${context.candidateProviders[0].uptimePercentage}% uptime)`,
                } : null,
              };
            } catch (error) {
              return {
                success: false,
                error: 'Failed to fetch Akash providers',
              };
            }
          },
        }),

        generateSDL: tool({
          description: 'Generate an SDL deployment manifest for the selected provider',
          inputSchema: z.object({
            providerId: z.string().describe('The provider ID to deploy to'),
            dockerImage: z.string().describe('Docker image to deploy'),
            cpu: z.number().describe('CPU units'),
            memoryMB: z.number().describe('Memory in MB'),
            storageMB: z.number().describe('Storage in MB'),
            gpuCount: z.number().optional().describe('Number of GPUs if needed'),
            port: z.number().optional().describe('Port to expose'),
          }),
          execute: async ({ providerId, dockerImage, cpu, memoryMB, storageMB, gpuCount, port }) => {
            const sdl = `---
version: "2.0"

services:
  app:
    image: ${dockerImage}
    expose:
      ${port ? `- port: ${port}
        as: ${port}
        proto: tcp
        to:
          - global: true` : '[]'}

profiles:
  compute:
    app:
      resources:
        cpu:
          units: ${cpu}
        memory:
          size: ${memoryMB}Mi
        storage:
          size: ${storageMB}Mi
        ${gpuCount ? `gpu:
          units: ${gpuCount}
          attributes:
            vendor:
              nvidia:` : ''}

  placement:
    akash:
      attributes:
        host: ${providerId}
      signedBy:
        anyOf:
          - "${providerId}"
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
              providerId,
              instructions: 'Save this SDL file and deploy it using: akash tx deployment create deploy.yaml --from wallet',
            };
          },
        }),

        lookupAkashDocs: tool({
          description: 'Look up Akash Network documentation for specific topics',
          inputSchema: z.object({
            topic: z.string().describe('The topic to look up in Akash docs'),
          }),
          execute: async ({ topic }) => {
            // This would integrate with Context7 MCP
            // For now, return a structured response
            return {
              success: true,
              topic,
              documentation: `Documentation for ${topic} would be fetched from Context7 MCP integration.`,
              links: [
                'https://docs.akash.network/deployments/deploy',
                'https://docs.akash.network/providers/provider-faq',
              ],
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Agent Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
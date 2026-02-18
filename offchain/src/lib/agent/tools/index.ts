/**
 * @title Agent Tools Index
 * @notice Central export point for all ADK agent tools
 * @dev Tools expose provider-specific logic to the LLM agent.
 *      Adding a new provider? Create a tool in this directory and export it here.
 */

// Import all ADK tools
import { 
  RouteToAkashTool, 
  routeToAkashTool, 
  executeRouteToAkash,
  type RouteToAkashParams,
  type RouteToAkashResult 
} from './route-to-akash-tool';

import { 
  CompareProvidersTool, 
  compareProvidersTool,
  executeCompareProviders,
  type CompareProvidersParams,
  type CompareProvidersResult,
  type ProviderComparison 
} from './compare-providers-tool';

/**
 * Tool Architecture
 * 
 * The agent uses a tool-based architecture where each provider or capability
 * is exposed as an ADK (Agent Development Kit) tool. This makes it trivial
 * to add new providers without changing the core agent logic.
 * 
 * To add a new provider:
 * 1. Create a new file: `{provider-name}-tool.ts`
 * 2. Extend BaseTool from @google/adk
 * 3. Implement runAsync() method
 * 4. Export the tool class and singleton instance
 * 5. Add exports to this index file
 * 6. Add tool to agent's tools array in agent.ts
 * 
 * Example providers to add:
 * - io.net: GPU aggregation network
 * - Lambda Labs: High-performance GPU cloud  
 * - CoreWeave: Kubernetes-native GPU cloud
 * - Vast.ai: Peer-to-peer GPU marketplace
 */

// Re-export all tool classes (for extension)
export { RouteToAkashTool, CompareProvidersTool };

// Re-export singleton instances (for agent configuration)
export { routeToAkashTool, compareProvidersTool };

// Re-export helper functions (for direct programmatic use)
export { executeRouteToAkash, executeCompareProviders };

// Re-export all types
export type { 
  RouteToAkashParams, 
  RouteToAkashResult,
  CompareProvidersParams,
  CompareProvidersResult,
  ProviderComparison 
};

/**
 * Array of all available tools for agent initialization
 * 
 * Usage in agent.ts:
 * ```typescript
 * import { allTools } from './tools';
 * 
 * const agent = new LlmAgent({
 *   name: 'routing-agent',
 *   model: 'gemini-2.0-flash',
 *   tools: allTools,
 *   // ...
 * });
 * ```
 */
export const allTools = [
  routeToAkashTool,
  compareProvidersTool
] as const;

/**
 * Tool registry by provider ID
 * 
 * Usage:
 * ```typescript
 * import { toolRegistry } from './tools';
 * 
 * const akashTool = toolRegistry['akash'];
 * const result = await akashTool.runAsync({ ... });
 * ```
 */
export const toolRegistry = {
  akash: routeToAkashTool,
  compare: compareProvidersTool
} as const;

/**
 * Get a tool by provider name
 * 
 * @param provider - Provider ID (e.g., 'akash', 'compare')
 * @returns The tool instance or undefined if not found
 */
export function getTool(provider: keyof typeof toolRegistry) {
  return toolRegistry[provider];
}

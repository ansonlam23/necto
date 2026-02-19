/**
 * @title Agent Tools Index
 * @notice Central export point for all ADK agent tools
 */

import {
  routeToAkashTool,
  executeRouteToAkash,
  type RouteToAkashParams,
  type RouteToAkashResult
} from './route-to-akash-tool';

import {
  compareProvidersTool,
  executeCompareProviders,
  type CompareProvidersParams,
  type CompareProvidersResult,
  type ProviderComparison
} from './compare-providers-tool';

import {
  logReasoningTo0gTool,
  executeLogReasoningTo0g,
  type LogReasoningTo0gParams,
  type LogReasoningTo0gResult
} from './log-reasoning-to-0g';

// Re-export tool instances (for agent configuration)
export { routeToAkashTool, compareProvidersTool, logReasoningTo0gTool };

// Re-export helper functions (for direct programmatic use / fallback)
export { executeRouteToAkash, executeCompareProviders, executeLogReasoningTo0g };

// Re-export types
export type {
  RouteToAkashParams,
  RouteToAkashResult,
  CompareProvidersParams,
  CompareProvidersResult,
  ProviderComparison,
  LogReasoningTo0gParams,
  LogReasoningTo0gResult
};

export const allTools = [
  routeToAkashTool,
  compareProvidersTool,
  logReasoningTo0gTool
] as const;

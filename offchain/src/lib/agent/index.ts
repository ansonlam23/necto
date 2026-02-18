/**
 * @title Agent Module
 * @notice Main exports for the Google ADK agent integration
 * @dev Tools are exported for direct use and ADK integration
 */

// Core agent exports
export {
  createRoutingAgent,
  routeComputeJob,
  quickRoute
} from './agent';

// Type exports
export type {
  AgentConfig,
  JobRequirements,
  RoutingRequest,
  RoutingResult,
  TransactionResult,
  ThinkingStep
} from './types';

// Wallet tool exports
export {
  walletTool,
  WalletTool,
  submitJobTransaction,
  recordRoutingDecision,
  hashJobDetails,
  hashRoutingDecision,
  createAgentWallet
} from './wallet-tool';

// Akash router exports
export {
  routeToAkash,
  isAkashSuitable,
  cancelRoute,
  formatRouteLogs,
  type RouteRequest,
  type AkashRouteResult,
  type RouteLog,
  type SuitabilityCheck
} from './akash-router';

// Provider selection exports
export {
  rankProviders,
  filterProviders,
  selectProvider,
  getProviderRecommendations,
  type Provider,
  type ProviderScore,
  type SelectionWeights
} from './provider-selection';

// Tool exports (for ADK integration and direct use)
// Tools are the primary way to add new providers - just create a tool and add it here
export {
  // Tool classes
  RouteToAkashTool,
  CompareProvidersTool,
  // Tool singleton instances
  routeToAkashTool,
  compareProvidersTool,
  // Tool helper functions
  executeRouteToAkash,
  executeCompareProviders,
  // Tool types
  type RouteToAkashParams,
  type RouteToAkashResult,
  type CompareProvidersParams,
  type CompareProvidersResult,
  type ProviderComparison,
  // Tool utilities
  allTools,
  toolRegistry,
  getTool
} from './tools';

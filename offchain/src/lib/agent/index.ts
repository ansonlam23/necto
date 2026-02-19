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
export {
  routeToAkashTool,
  compareProvidersTool,
  executeRouteToAkash,
  executeCompareProviders,
  allTools,
  type RouteToAkashParams,
  type RouteToAkashResult,
  type CompareProvidersParams,
  type CompareProvidersResult,
  type ProviderComparison,
} from './tools';

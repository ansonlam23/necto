import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title ComputeRouterModuleV2
 * @notice Hardhat Ignition deployment module for ComputeRouter V2
 * @dev Deploys the ComputeRouter contract with NO parameters required
 * 
 * This is V2 - constructor has no parameters.
 * Agent can be set later via setInitialAgent().
 * submitJob() is open to all users.
 * 
 * Deploy command:
 * ```bash
 * npx hardhat ignition deploy --network adiTestnet ignition/modules/ComputeRouterV2.ts
 * ```
 * 
 * After deployment, update the contract address in:
 * - offchain/src/lib/contracts/compute-router.ts (COMPUTE_ROUTER_ADDRESS)
 */
export default buildModule("ComputeRouterModuleV2", (m) => {
  // No parameters - zero argument constructor
  const computeRouter = m.contract("ComputeRouter");

  return { computeRouter };
});
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title ComputeRouterModule
 * @notice Hardhat Ignition deployment module for ComputeRouter
 * @dev Deploys the ComputeRouter contract with an initial agent address
 * 
 * The agentAddress parameter must be provided at deploy time.
 * The deployer should pass their own address or a dedicated agent wallet address.
 * 
 * Deploy command:
 * ```bash
 * npx hardhat ignition deploy --network adiTestnet ignition/modules/ComputeRouter.ts \
 *   --parameters '{"ComputeRouterModule": {"agentAddress": "0xYOUR_AGENT_ADDRESS"}}'
 * ```
 * 
 * After deployment, update the contract address in:
 * - offchain/src/lib/contracts/compute-router.ts (COMPUTE_ROUTER_ADDRESS)
 */
export default buildModule("ComputeRouterModule", (m) => {
  // Agent address passed as module parameter
  // The deployer's address or a dedicated agent wallet should be used
  // Override at deploy time with --parameters flag
  const agentAddress = m.getParameter("agentAddress");

  const computeRouter = m.contract("ComputeRouter", [agentAddress]);

  return { computeRouter };
});

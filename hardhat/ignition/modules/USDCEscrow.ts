import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title USDCEscrowModule
 * @notice Deploys USDCEscrow linked to TestnetUSDC and ComputeRouter
 *
 * Deploy command:
 * ```bash
 * npx hardhat ignition deploy --network adiTestnet ignition/modules/USDCEscrow.ts \
 *   --parameters '{"USDCEscrowModule": {"usdcTokenAddress": "0x...", "computeRouterAddress": "0x..."}}'
 * ```
 *
 * The deployer wallet becomes both the escrow owner and should be the same
 * wallet used as the ComputeRouter agent.
 * 
 * Contract addr: 0x0Fc569ACAf6196A2dEf11C9363193c89083e6aDA
 */
export default buildModule("USDCEscrowModule", (m) => {
  const usdcTokenAddress = m.getParameter("usdcTokenAddress");
  const computeRouterAddress = m.getParameter("computeRouterAddress");
  const usdcEscrow = m.contract("USDCEscrow", [usdcTokenAddress, computeRouterAddress]);
  return { usdcEscrow };
});

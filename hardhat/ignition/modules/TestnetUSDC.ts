import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title TestnetUSDCModule
 * @notice Deploys the TestnetUSDC (fake USDC) token for testing
 *
 * Deploy command:
 * ```bash
 * npx hardhat ignition deploy --network adiTestnet ignition/modules/TestnetUSDC.ts
 * 
 * Contract addr: 0x213E3C8C9C3E5F94455Fc1606D97555e5aaf7FA7
 * ```
 */
export default buildModule("TestnetUSDCModule", (m) => {
  const testnetUSDC = m.contract("TestnetUSDC");
  return { testnetUSDC };
});

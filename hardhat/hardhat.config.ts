import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  ignition: {
    requiredConfirmations: 1,
  },
  networks: {
    adiTestnet: {
      type: 'http',
      chainType: 'generic',
      url: 'https://rpc.ab.testnet.adifoundation.ai',
      accounts: [configVariable('TESTNET_PRIVATE_KEY')],
    },
  },
});
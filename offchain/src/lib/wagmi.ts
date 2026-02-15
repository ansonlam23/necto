import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { adiTestnet } from './adi-chain'

export const config = createConfig({
  chains: [mainnet, sepolia, adiTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [adiTestnet.id]: http(),
  },
})

export type WagmiConfig = typeof config

import { createConfig, http, cookieStorage, createStorage } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { adiTestnet } from './adi-chain'

export const config = createConfig({
  chains: [mainnet, sepolia, adiTestnet],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [adiTestnet.id]: http('https://rpc.ab.testnet.adifoundation.ai'),
  },
})

export type WagmiConfig = typeof config
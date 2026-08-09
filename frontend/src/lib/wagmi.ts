import { createConfig, http } from 'wagmi'
import { flareTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [flareTestnet],
  connectors: [injected()],
  transports: {
    [flareTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

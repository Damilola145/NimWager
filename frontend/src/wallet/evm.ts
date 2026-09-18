import { createConfig, http } from "wagmi"
import { mainnet } from "wagmi/chains"
import { injected, walletConnect } from "wagmi/connectors"

/**
 * EVM wallet support (secondary option). MetaMask/injected works out of the box;
 * WalletConnect is enabled only when a project id is provided so the app never
 * crashes without one.
 */
const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

export const wagmiConfig = createConfig({
  chains: [mainnet],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(wcProjectId
      ? [walletConnect({ projectId: wcProjectId, showQrModal: true })]
      : []),
  ],
  transports: {
    [mainnet.id]: http(),
  },
})

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig
  }
}

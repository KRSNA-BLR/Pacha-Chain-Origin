import { http, createConfig } from "wagmi";
import { polygonAmoy, hardhat } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet, safe } from "wagmi/connectors";

/**
 * Cadena local Anvil (Foundry) - misma config que Hardhat chain
 * pero con chainId 31337 y nombre Anvil
 */
const anvil = {
  ...hardhat,
  id: 31337,
  name: "Anvil (Local)",
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
} as const;

/**
 * Configuración wagmi para Pacha-Chain-Origin
 *
 * Cadenas soportadas:
 * - Polygon Amoy Testnet (80002) → producción testnet
 * - Anvil local (31337) → desarrollo
 */
export const config = createConfig({
  chains: [polygonAmoy, anvil],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "PLACEHOLDER_WC_PROJECT_ID",
      metadata: {
        name: "Pacha-Chain-Origin",
        description: "Farm-to-Table traceability for Ecuador cacao & coffee",
        url: "https://pachachainorigin.com",
        icons: ["https://pachachainorigin.com/icon.png"],
      },
    }),
    coinbaseWallet({
      appName: "Pacha-Chain-Origin",
    }),
    safe(),
  ],
  transports: {
    [polygonAmoy.id]: http(
      process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL ||
        "https://rpc-amoy.polygon.technology"
    ),
    [anvil.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true, // Requerido para Next.js SSR — wagmi.sh/react/guides/ssr
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

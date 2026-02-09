import { type Address } from "viem";
import { polygonAmoy } from "wagmi/chains";
import { PACHA_CHAIN_ORIGIN_ABI } from "./abi";

/**
 * Direcciones del contrato por chain ID
 * Actualizar después de cada deployment
 */
const CONTRACT_ADDRESSES: Record<number, Address> = {
  31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Anvil local
  80002: "0x0000000000000000000000000000000000000000", // Polygon Amoy (pendiente)
};

/**
 * Obtener dirección del contrato para una cadena específica
 */
export function getContractAddress(chainId: number): Address {
  const address = CONTRACT_ADDRESSES[chainId];
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    throw new Error(
      `Contract not deployed on chain ${chainId}. Update config/contract.ts`
    );
  }
  return address;
}

/**
 * Chain ID por defecto para lecturas públicas (sin wallet conectada)
 */
export const DEFAULT_CHAIN_ID =
  process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID === "31337"
    ? 31337
    : polygonAmoy.id;

/**
 * Obtener dirección del contrato de forma segura (sin lanzar error).
 * Retorna zero address como fallback — útil durante SSR/build.
 */
function getContractAddressSafe(chainId: number): Address {
  const address = CONTRACT_ADDRESSES[chainId];
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return "0x0000000000000000000000000000000000000000" as Address;
  }
  return address;
}

/**
 * Configuración del contrato para wagmi hooks.
 * Usa getContractAddressSafe para no lanzar error durante SSR/build.
 */
export const pachaContract = {
  address: getContractAddressSafe(DEFAULT_CHAIN_ID),
  abi: PACHA_CHAIN_ORIGIN_ABI,
} as const;

/**
 * Re-export del ABI para uso directo
 */
export { PACHA_CHAIN_ORIGIN_ABI } from "./abi";

/**
 * Enum de estados del batch (mirror del contrato Solidity)
 */
export enum BatchState {
  Harvested = 0,
  Fermented = 1,
  Dried = 2,
  Packed = 3,
  Shipped = 4,
  Delivered = 5,
}

/**
 * Labels legibles para cada estado
 */
export const BATCH_STATE_LABELS: Record<BatchState, string> = {
  [BatchState.Harvested]: "Cosechado",
  [BatchState.Fermented]: "Fermentado",
  [BatchState.Dried]: "Secado",
  [BatchState.Packed]: "Empacado",
  [BatchState.Shipped]: "Enviado",
  [BatchState.Delivered]: "Entregado",
};

/**
 * Labels en inglés
 */
export const BATCH_STATE_LABELS_EN: Record<BatchState, string> = {
  [BatchState.Harvested]: "Harvested",
  [BatchState.Fermented]: "Fermented",
  [BatchState.Dried]: "Dried",
  [BatchState.Packed]: "Packed",
  [BatchState.Shipped]: "Shipped",
  [BatchState.Delivered]: "Delivered",
};

/**
 * Iconos emoji para cada estado
 */
export const BATCH_STATE_ICONS: Record<BatchState, string> = {
  [BatchState.Harvested]: "🌱",
  [BatchState.Fermented]: "🫘",
  [BatchState.Dried]: "☀️",
  [BatchState.Packed]: "📦",
  [BatchState.Shipped]: "🚢",
  [BatchState.Delivered]: "✅",
};

/**
 * Colores CSS para cada estado
 */
export const BATCH_STATE_COLORS: Record<BatchState, string> = {
  [BatchState.Harvested]: "bg-green-500",
  [BatchState.Fermented]: "bg-amber-600",
  [BatchState.Dried]: "bg-yellow-500",
  [BatchState.Packed]: "bg-blue-500",
  [BatchState.Shipped]: "bg-indigo-500",
  [BatchState.Delivered]: "bg-emerald-600",
};

/**
 * Enum de tipos de producto
 */
export enum ProductType {
  Cacao = 0,
  Coffee = 1,
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  [ProductType.Cacao]: "Cacao",
  [ProductType.Coffee]: "Café",
};

// ─── Role Constants (keccak256 hashes from Solidity) ────────

/** keccak256("FARMER_ROLE") */
export const FARMER_ROLE =
  "0x7c6181838a71a779e445600d4c6ecbe16bacf2b3c5bda69c29fada66d1b645d1" as `0x${string}`;
/** keccak256("PROCESSOR_ROLE") */
export const PROCESSOR_ROLE =
  "0xe61decff6e4a5c6b5a3d3cbd28f882e595173563b49353ce5f31dba2de7f05ee" as `0x${string}`;
/** keccak256("EXPORTER_ROLE") */
export const EXPORTER_ROLE =
  "0xaf60a13a1620ed8606730e7105f2af60851db04bb2ce1a068e80262de457512a" as `0x${string}`;
/** keccak256("BUYER_ROLE") */
export const BUYER_ROLE =
  "0xf8cd32ed93fc2f9fc78152a14807c9609af3d99c5fe4dc6b106a801aaddfe90e" as `0x${string}`;
/** DEFAULT_ADMIN_ROLE (bytes32(0)) */
export const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

/**
 * All named roles for the admin panel
 */
export const ROLES = [
  { key: "FARMER_ROLE", label: "Farmer", icon: "🌱", description: "Puede crear lotes y actualizar metadata" },
  { key: "PROCESSOR_ROLE", label: "Processor", icon: "🫘", description: "Puede avanzar estados de procesamiento" },
  { key: "EXPORTER_ROLE", label: "Exporter", icon: "🚢", description: "Puede avanzar estados de exportación" },
  { key: "BUYER_ROLE", label: "Buyer", icon: "🛒", description: "Puede confirmar la entrega final" },
  { key: "DEFAULT_ADMIN_ROLE", label: "Admin", icon: "🔐", description: "Administrador con control total" },
] as const;

/**
 * Mapping from state to the required role for advancing
 */
export const STATE_REQUIRED_ROLE: Record<BatchState, string> = {
  [BatchState.Harvested]: "PROCESSOR_ROLE",    // Harvested → Fermented
  [BatchState.Fermented]: "PROCESSOR_ROLE",    // Fermented → Dried
  [BatchState.Dried]: "EXPORTER_ROLE",         // Dried → Packed
  [BatchState.Packed]: "EXPORTER_ROLE",        // Packed → Shipped
  [BatchState.Shipped]: "BUYER_ROLE",          // Shipped → Delivered
  [BatchState.Delivered]: "BUYER_ROLE",        // terminal state
};

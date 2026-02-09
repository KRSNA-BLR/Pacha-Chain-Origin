"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { pachaContract } from "@/config/contract";
import { type Address, keccak256, toHex } from "viem";

// ─── Write Hooks ────────────────────────────────────────────

/**
 * Hook para crear un nuevo lote (requiere FARMER_ROLE)
 */
export function useCreateBatch() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function createBatch(params: {
    productType: number;
    variety: string;
    weightKg: bigint;
    originHash: `0x${string}`;
    region: string;
    harvestDate: bigint;
    ipfsHash: string;
  }) {
    writeContract({
      ...pachaContract,
      functionName: "createBatch",
      args: [
        params.productType,
        params.variety,
        params.weightKg,
        params.originHash,
        params.region,
        params.harvestDate,
        params.ipfsHash,
      ],
    });
  }

  return { createBatch, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook para avanzar el estado de un lote (requiere rol correspondiente)
 */
export function useAdvanceState() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function advanceState(batchId: bigint, newState: number, notes: string) {
    writeContract({
      ...pachaContract,
      functionName: "advanceState",
      args: [batchId, newState, notes],
    });
  }

  return { advanceState, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook para actualizar metadata IPFS de un lote
 */
export function useUpdateMetadata() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function updateMetadata(batchId: bigint, ipfsHash: string) {
    writeContract({
      ...pachaContract,
      functionName: "updateMetadata",
      args: [batchId, ipfsHash],
    });
  }

  return { updateMetadata, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook para grant de roles (requiere DEFAULT_ADMIN_ROLE)
 */
export function useGrantRole() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function grantRole(role: `0x${string}`, account: Address) {
    writeContract({
      ...pachaContract,
      functionName: "grantRole",
      args: [role, account],
    });
  }

  return { grantRole, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook para revocar roles (requiere DEFAULT_ADMIN_ROLE)
 */
export function useRevokeRole() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function revokeRole(role: `0x${string}`, account: Address) {
    writeContract({
      ...pachaContract,
      functionName: "revokeRole",
      args: [role, account],
    });
  }

  return { revokeRole, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook para pausar el contrato (requiere DEFAULT_ADMIN_ROLE)
 */
export function usePause() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function pause() {
    writeContract({
      ...pachaContract,
      functionName: "pause",
    });
  }

  return { pause, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Hook para despausar el contrato (requiere DEFAULT_ADMIN_ROLE)
 */
export function useUnpause() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function unpause() {
    writeContract({
      ...pachaContract,
      functionName: "unpause",
    });
  }

  return { unpause, hash, isPending, isConfirming, isSuccess, error, reset };
}

// ─── Helper ─────────────────────────────────────────────────

/**
 * Genera originHash a partir de un string (keccak256)
 * Utilidad para el formulario de creación de lotes
 */
export function generateOriginHash(originDescription: string): `0x${string}` {
  return keccak256(toHex(originDescription));
}

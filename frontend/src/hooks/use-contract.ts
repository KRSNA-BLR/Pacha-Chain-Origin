"use client";

import { useReadContract } from "wagmi";
import { pachaContract } from "@/config/contract";

/**
 * Hook para leer la información completa de un batch
 * Llama a getBatchInfo(batchId) en el contrato
 */
export function useBatchInfo(batchId: bigint) {
  return useReadContract({
    ...pachaContract,
    functionName: "getBatchInfo",
    args: [batchId],
    query: {
      enabled: batchId > 0n,
    },
  });
}

/**
 * Hook para leer el estado actual de un batch
 * Llama a getBatchState(batchId) en el contrato
 */
export function useBatchState(batchId: bigint) {
  return useReadContract({
    ...pachaContract,
    functionName: "getBatchState",
    args: [batchId],
    query: {
      enabled: batchId > 0n,
    },
  });
}

/**
 * Hook para leer la URI de metadata de un batch
 * Llama a getBatchURI(batchId) en el contrato
 */
export function useBatchURI(batchId: bigint) {
  return useReadContract({
    ...pachaContract,
    functionName: "getBatchURI",
    args: [batchId],
    query: {
      enabled: batchId > 0n,
    },
  });
}

/**
 * Hook para verificar si un batch existe (supply > 0)
 * Llama a batchExists(batchId) en el contrato
 */
export function useBatchExists(batchId: bigint) {
  return useReadContract({
    ...pachaContract,
    functionName: "batchExists",
    args: [batchId],
    query: {
      enabled: batchId > 0n,
    },
  });
}

/**
 * Hook para verificar si una dirección tiene un rol específico
 * Llama a hasRole(role, account) en el contrato
 */
export function useHasRole(role: `0x${string}`, account: `0x${string}`) {
  return useReadContract({
    ...pachaContract,
    functionName: "hasRole",
    args: [role, account],
    query: {
      enabled: !!account,
    },
  });
}

/**
 * Hook para verificar si el contrato está pausado
 * Llama a paused() en el contrato
 */
export function usePaused() {
  return useReadContract({
    ...pachaContract,
    functionName: "paused",
  });
}

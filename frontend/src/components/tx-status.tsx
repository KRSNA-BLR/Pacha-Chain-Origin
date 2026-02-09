"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TxStatusProps {
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  hash?: `0x${string}`;
  successMessage?: string;
}

/**
 * Shows transaction status: pending, confirming, success, or error.
 */
export function TxStatus({
  isPending,
  isConfirming,
  isSuccess,
  error,
  hash,
  successMessage = "Transacción confirmada exitosamente",
}: TxStatusProps) {
  if (isPending) {
    return (
      <Alert>
        <AlertTitle>⏳ Esperando aprobación...</AlertTitle>
        <AlertDescription>
          Confirma la transacción en tu wallet.
        </AlertDescription>
      </Alert>
    );
  }

  if (isConfirming) {
    return (
      <Alert>
        <AlertTitle>⛏️ Confirmando en blockchain...</AlertTitle>
        <AlertDescription>
          <p>La transacción está siendo minada.</p>
          {hash && (
            <p className="font-mono text-xs mt-1 break-all">
              TX: {hash}
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isSuccess) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
        <AlertTitle>✅ {successMessage}</AlertTitle>
        <AlertDescription>
          {hash && (
            <p className="font-mono text-xs mt-1 break-all">
              TX: {hash}
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    const message = error.message?.includes("User rejected")
      ? "Transacción rechazada por el usuario."
      : error.message?.includes("AccessControl")
        ? "No tienes el rol necesario para esta operación."
        : error.message?.includes("EnforcedPause")
          ? "El contrato está pausado."
          : error.message?.slice(0, 200) ?? "Error desconocido";

    return (
      <Alert variant="destructive">
        <AlertTitle>❌ Error en transacción</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  return null;
}

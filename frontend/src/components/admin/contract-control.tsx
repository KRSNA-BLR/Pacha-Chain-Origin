"use client";

import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DEFAULT_ADMIN_ROLE } from "@/config/contract";
import { useHasRole, usePaused } from "@/hooks/use-contract";
import { usePause, useUnpause } from "@/hooks/use-contract-write";
import { TxStatus } from "@/components/tx-status";

export function ContractControl() {
  const { address } = useAccount();
  const { data: isAdmin } = useHasRole(
    DEFAULT_ADMIN_ROLE,
    address ?? "0x0000000000000000000000000000000000000000"
  );
  const { data: isPaused, isLoading: pauseLoading } = usePaused();
  const pause = usePause();
  const unpause = useUnpause();

  if (!isAdmin) {
    return (
      <Alert>
        <AlertDescription>
          ⛔ Solo cuentas con <strong>DEFAULT_ADMIN_ROLE</strong> pueden controlar el contrato.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>⚙️ Control del Contrato</CardTitle>
        <CardDescription>
          Pausa o reanuda el contrato. Cuando está pausado, no se pueden crear
          lotes ni avanzar estados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Estado actual:</span>
          {pauseLoading ? (
            <Badge variant="outline">Cargando...</Badge>
          ) : isPaused ? (
            <Badge variant="destructive">⏸️ Pausado</Badge>
          ) : (
            <Badge className="bg-green-700 text-white">▶️ Activo</Badge>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="destructive"
            onClick={() => pause.pause()}
            disabled={!!isPaused || pause.isPending || pause.isConfirming}
          >
            {pause.isPending ? "Esperando..." : "⏸️ Pausar Contrato"}
          </Button>
          <Button
            className="bg-green-800 hover:bg-green-700 text-white"
            onClick={() => unpause.unpause()}
            disabled={!isPaused || unpause.isPending || unpause.isConfirming}
          >
            {unpause.isPending ? "Esperando..." : "▶️ Reanudar Contrato"}
          </Button>
        </div>

        <TxStatus
          isPending={pause.isPending || unpause.isPending}
          isConfirming={pause.isConfirming || unpause.isConfirming}
          isSuccess={pause.isSuccess || unpause.isSuccess}
          error={pause.error || unpause.error}
          hash={pause.hash || unpause.hash}
          successMessage="Estado del contrato actualizado"
        />
      </CardContent>
    </Card>
  );
}

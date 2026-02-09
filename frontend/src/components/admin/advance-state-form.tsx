"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TxStatus } from "@/components/tx-status";
import { useAdvanceState } from "@/hooks/use-contract-write";
import { useBatchInfo, useBatchState } from "@/hooks/use-contract";
import {
  BatchState,
  BATCH_STATE_LABELS,
  BATCH_STATE_ICONS,
  BATCH_STATE_COLORS,
  STATE_REQUIRED_ROLE,
} from "@/config/contract";

export function AdvanceStateForm() {
  const { advanceState, hash, isPending, isConfirming, isSuccess, error, reset } =
    useAdvanceState();

  const [batchId, setBatchId] = useState("");
  const [notes, setNotes] = useState("");

  const batchIdBigInt = batchId.trim() ? BigInt(batchId.trim()) : 0n;

  const { data: batchInfo, isLoading: infoLoading } = useBatchInfo(batchIdBigInt);
  const { data: batchState, isLoading: stateLoading } = useBatchState(batchIdBigInt);

  const info = batchInfo as
    | {
        farmer: `0x${string}`;
        productType: number;
        variety: string;
        weightKg: bigint;
        region: string;
        currentState: number;
      }
    | undefined;

  const currentState = (batchState as number) ?? info?.currentState ?? -1;
  const nextState = currentState >= 0 && currentState < 5 ? currentState + 1 : -1;
  const isTerminal = currentState === BatchState.Delivered;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    reset();
    if (batchIdBigInt > 0n && nextState >= 0) {
      advanceState(batchIdBigInt, nextState, notes);
    }
  }

  const hasBatch = batchIdBigInt > 0n && info && !infoLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>⏭️ Avanzar Estado de Lote</CardTitle>
        <CardDescription>
          Avanza al siguiente estado en la cadena de trazabilidad. Cada
          transición requiere un rol específico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Batch ID */}
          <div className="space-y-2">
            <Label htmlFor="advBatchId">Batch ID *</Label>
            <Input
              id="advBatchId"
              type="text"
              placeholder="Ingresa el Batch ID numérico"
              value={batchId}
              onChange={(e) => {
                setBatchId(e.target.value.replace(/[^0-9]/g, ""));
                reset();
              }}
              className="font-mono"
            />
          </div>

          {/* Batch Preview */}
          {infoLoading || stateLoading ? (
            <div className="animate-pulse h-20 bg-muted rounded-lg" />
          ) : hasBatch ? (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{info.variety}</p>
                  <p className="text-sm text-muted-foreground">{info.region}</p>
                </div>
                <Badge className={`${BATCH_STATE_COLORS[currentState as BatchState]} text-white`}>
                  {BATCH_STATE_ICONS[currentState as BatchState]}{" "}
                  {BATCH_STATE_LABELS[currentState as BatchState]}
                </Badge>
              </div>

              {!isTerminal && nextState >= 0 ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Siguiente:</span>
                  <Badge variant="outline">
                    {BATCH_STATE_ICONS[nextState as BatchState]}{" "}
                    {BATCH_STATE_LABELS[nextState as BatchState]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    (requiere {STATE_REQUIRED_ROLE[currentState as BatchState]})
                  </span>
                </div>
              ) : (
                <p className="text-sm text-emerald-600 font-medium">
                  ✅ Este lote ya está entregado (estado terminal).
                </p>
              )}
            </div>
          ) : batchIdBigInt > 0n ? (
            <div className="rounded-lg border border-destructive/50 p-4 text-center">
              <p className="text-sm text-destructive">
                No se encontró un lote con ese ID.
              </p>
            </div>
          ) : null}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="advNotes">
              Notas{" "}
              <span className="text-muted-foreground">(quedan registradas on-chain)</span>
            </Label>
            <Textarea
              id="advNotes"
              placeholder="Ej: Fermentación completada, 5 días en cajón de madera"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!hasBatch || isTerminal || isPending || isConfirming}
            className="w-full"
          >
            {isPending
              ? "Esperando wallet..."
              : isConfirming
                ? "Confirmando..."
                : isTerminal
                  ? "Estado terminal — no se puede avanzar"
                  : `⏭️ Avanzar a ${nextState >= 0 ? BATCH_STATE_LABELS[nextState as BatchState] : "..."}`}
          </Button>

          {/* Status */}
          <TxStatus
            isPending={isPending}
            isConfirming={isConfirming}
            isSuccess={isSuccess}
            error={error}
            hash={hash}
            successMessage={`Estado avanzado a ${nextState >= 0 ? BATCH_STATE_LABELS[nextState as BatchState] : "nuevo estado"}`}
          />
        </form>
      </CardContent>
    </Card>
  );
}

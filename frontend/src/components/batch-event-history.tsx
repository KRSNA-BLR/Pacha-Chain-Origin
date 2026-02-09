"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem, type Log } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BATCH_STATE_LABELS,
  BATCH_STATE_ICONS,
  BATCH_STATE_COLORS,
  BatchState,
} from "@/config/contract";

interface BatchEvent {
  type: "created" | "stateChanged" | "metadataUpdated";
  blockNumber: bigint;
  timestamp?: number;
  data: Record<string, unknown>;
  transactionHash: string;
}

interface BatchEventHistoryProps {
  /** The batch ID to fetch events for */
  batchId: bigint;
  /** Contract address */
  contractAddress: `0x${string}`;
}

const EVENT_ABIS = {
  created: parseAbiItem(
    "event BatchCreated(uint256 indexed batchId, address indexed farmer, uint8 productType, uint256 weightKg, uint256 timestamp)"
  ),
  stateChanged: parseAbiItem(
    "event BatchStateChanged(uint256 indexed batchId, uint8 indexed previousState, uint8 indexed newState, address actor, uint256 timestamp, string notes)"
  ),
  metadataUpdated: parseAbiItem(
    "event BatchMetadataUpdated(uint256 indexed batchId, string ipfsHash)"
  ),
};

/**
 * Displays on-chain event history for a specific batch.
 * Fetches BatchCreated, BatchStateChanged, and BatchMetadataUpdated logs.
 */
export function BatchEventHistory({
  batchId,
  contractAddress,
}: BatchEventHistoryProps) {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<BatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      if (!publicClient) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch all three event types in parallel
        const [createdLogs, stateChangedLogs, metadataLogs] = await Promise.all(
          [
            publicClient.getLogs({
              address: contractAddress,
              event: EVENT_ABIS.created,
              args: { batchId },
              fromBlock: 0n,
              toBlock: "latest",
            }),
            publicClient.getLogs({
              address: contractAddress,
              event: EVENT_ABIS.stateChanged,
              args: { batchId },
              fromBlock: 0n,
              toBlock: "latest",
            }),
            publicClient.getLogs({
              address: contractAddress,
              event: EVENT_ABIS.metadataUpdated,
              args: { batchId },
              fromBlock: 0n,
              toBlock: "latest",
            }),
          ]
        );

        if (cancelled) return;

        const allEvents: BatchEvent[] = [];

        // Parse created events
        for (const log of createdLogs) {
          allEvents.push({
            type: "created",
            blockNumber: log.blockNumber,
            data: { ...(log as Log & { args: Record<string, unknown> }).args },
            transactionHash: log.transactionHash,
          });
        }

        // Parse state changed events
        for (const log of stateChangedLogs) {
          allEvents.push({
            type: "stateChanged",
            blockNumber: log.blockNumber,
            data: { ...(log as Log & { args: Record<string, unknown> }).args },
            transactionHash: log.transactionHash,
          });
        }

        // Parse metadata updated events
        for (const log of metadataLogs) {
          allEvents.push({
            type: "metadataUpdated",
            blockNumber: log.blockNumber,
            data: { ...(log as Log & { args: Record<string, unknown> }).args },
            transactionHash: log.transactionHash,
          });
        }

        // Sort by block number
        allEvents.sort((a, b) => Number(a.blockNumber - b.blockNumber));

        setEvents(allEvents);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Error al obtener eventos on-chain"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (batchId > 0n) {
      fetchEvents();
    }

    return () => {
      cancelled = true;
    };
  }, [publicClient, batchId, contractAddress]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📜 Historial On-Chain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📜 Historial On-Chain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Conecta tu wallet o verifica que el nodo RPC esté activo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📜 Historial On-Chain</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No se encontraron eventos para este lote.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📜 Historial On-Chain</CardTitle>
        <CardDescription>
          {events.length} evento{events.length !== 1 ? "s" : ""} registrado
          {events.length !== 1 ? "s" : ""} en la blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, i) => (
            <EventCard key={`${event.transactionHash}-${i}`} event={event} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard({ event }: { event: BatchEvent }) {
  const txShort = `${event.transactionHash.slice(0, 10)}...${event.transactionHash.slice(-8)}`;

  switch (event.type) {
    case "created": {
      const farmer = String(event.data.farmer ?? "");
      const ts = Number(event.data.timestamp ?? 0);
      return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <span className="text-xl flex-shrink-0">🌱</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium">Lote Creado</p>
              <Badge variant="outline" className="text-xs">
                Block #{event.blockNumber.toString()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Farmer: <span className="font-mono">{farmer.slice(0, 8)}...{farmer.slice(-6)}</span>
              {ts > 0 && (
                <> • {new Date(ts * 1000).toLocaleDateString("es-EC")}</>
              )}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              tx: {txShort}
            </p>
          </div>
        </div>
      );
    }

    case "stateChanged": {
      const prevState = Number(event.data.previousState ?? 0) as BatchState;
      const newState = Number(event.data.newState ?? 0) as BatchState;
      const actor = String(event.data.actor ?? "");
      const notes = String(event.data.notes ?? "");
      const ts = Number(event.data.timestamp ?? 0);

      return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
          <span className="text-xl flex-shrink-0">
            {BATCH_STATE_ICONS[newState] ?? "🔄"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-sm font-medium">Cambio de Estado</p>
              <Badge variant="outline" className="text-xs">
                Block #{event.blockNumber.toString()}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs mb-1">
              <Badge
                variant="secondary"
                className={`${BATCH_STATE_COLORS[prevState]} text-white text-xs`}
              >
                {BATCH_STATE_LABELS[prevState]}
              </Badge>
              <span>→</span>
              <Badge
                variant="secondary"
                className={`${BATCH_STATE_COLORS[newState]} text-white text-xs`}
              >
                {BATCH_STATE_LABELS[newState]}
              </Badge>
            </div>
            {notes && (
              <p className="text-xs text-muted-foreground italic">&quot;{notes}&quot;</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              Actor: <span className="font-mono">{actor.slice(0, 8)}...{actor.slice(-6)}</span>
              {ts > 0 && (
                <> • {new Date(ts * 1000).toLocaleDateString("es-EC")}</>
              )}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              tx: {txShort}
            </p>
          </div>
        </div>
      );
    }

    case "metadataUpdated": {
      const ipfsHash = String(event.data.ipfsHash ?? "");
      return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <span className="text-xl flex-shrink-0">📎</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium">Metadata Actualizada</p>
              <Badge variant="outline" className="text-xs">
                Block #{event.blockNumber.toString()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">
              IPFS: {ipfsHash}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              tx: {txShort}
            </p>
          </div>
        </div>
      );
    }
  }
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BatchState,
  BATCH_STATE_LABELS,
  BATCH_STATE_ICONS,
  BATCH_STATE_COLORS,
  PRODUCT_TYPE_LABELS,
  ProductType,
  getContractAddress,
  DEFAULT_CHAIN_ID,
} from "@/config/contract";
import { useBatchInfo, useBatchState } from "@/hooks/use-contract";

interface BatchSummary {
  batchId: bigint;
  farmer: string;
  productType: number;
  weightKg: bigint;
  timestamp: bigint;
}

const BATCH_CREATED_EVENT = parseAbiItem(
  "event BatchCreated(uint256 indexed batchId, address indexed farmer, uint8 productType, uint256 weightKg, uint256 timestamp)"
);

export function BatchDashboard() {
  const publicClient = usePublicClient();
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchBatches = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    setError(null);

    try {
      const contractAddress = getContractAddress(DEFAULT_CHAIN_ID);
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: BATCH_CREATED_EVENT,
        fromBlock: 0n,
        toBlock: "latest",
      });

      const items: BatchSummary[] = logs.map((log) => {
        const args = (log as unknown as { args: Record<string, unknown> }).args;
        return {
          batchId: args.batchId as bigint,
          farmer: String(args.farmer ?? ""),
          productType: Number(args.productType ?? 0),
          weightKg: args.weightKg as bigint,
          timestamp: args.timestamp as bigint,
        };
      });

      // Reverse so newest first
      setBatches(items.reverse());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar lotes"
      );
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Filter by product type
  const filtered = batches.filter((b) => {
    if (filter !== "all" && b.productType !== parseInt(filter)) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const idStr = b.batchId.toString();
      return (
        idStr.includes(s) ||
        b.farmer.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>📊 Dashboard de Lotes</CardTitle>
            <CardDescription>
              {batches.length} lote{batches.length !== 1 ? "s" : ""} registrado
              {batches.length !== 1 ? "s" : ""} en la blockchain
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchBatches} disabled={loading}>
            🔄 Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input
            placeholder="Buscar por Batch ID o farmer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="sm:max-w-[180px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los productos</SelectItem>
              <SelectItem value="0">🫘 Cacao</SelectItem>
              <SelectItem value="1">☕ Café</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <p className="text-xs text-muted-foreground">
              Verifica que el nodo RPC y la dirección del contrato sean correctos.
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-8">
            <span className="text-4xl block mb-2">📭</span>
            <p className="text-sm text-muted-foreground">
              {batches.length === 0
                ? "No hay lotes registrados aún."
                : "No se encontraron lotes con estos filtros."}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((batch) => (
                  <BatchRow key={batch.batchId.toString()} batch={batch} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BatchRow({ batch }: { batch: BatchSummary }) {
  const { data: stateData } = useBatchState(batch.batchId);
  const state = (stateData as number) ?? 0;

  const idStr = batch.batchId.toString();
  const shortId = idStr.length > 12 ? `${idStr.slice(0, 6)}...${idStr.slice(-6)}` : idStr;

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{shortId}</TableCell>
      <TableCell>
        {batch.productType === 0 ? "🫘" : "☕"}{" "}
        {PRODUCT_TYPE_LABELS[batch.productType as ProductType]}
      </TableCell>
      <TableCell>{(Number(batch.weightKg) / 100).toFixed(2)} kg</TableCell>
      <TableCell className="font-mono text-xs">
        {batch.farmer.slice(0, 6)}...{batch.farmer.slice(-4)}
      </TableCell>
      <TableCell className="text-xs">
        {Number(batch.timestamp) > 0
          ? new Date(Number(batch.timestamp) * 1000).toLocaleDateString("es-EC")
          : "—"}
      </TableCell>
      <TableCell className="text-center">
        <Badge className={`${BATCH_STATE_COLORS[state as BatchState]} text-white text-xs`}>
          {BATCH_STATE_ICONS[state as BatchState]}{" "}
          {BATCH_STATE_LABELS[state as BatchState]}
        </Badge>
      </TableCell>
      <TableCell>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/track/${idStr}`}>Ver →</Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

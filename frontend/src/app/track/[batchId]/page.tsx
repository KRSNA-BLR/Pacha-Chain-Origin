"use client";

import { use, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useBatchInfo, useBatchState, useBatchURI } from "@/hooks/use-contract";
import { IpfsMetadata } from "@/components/ipfs-metadata";
import { BatchEventHistory } from "@/components/batch-event-history";
import { getContractAddress, DEFAULT_CHAIN_ID } from "@/config/contract";
import {
  BatchState,
  BATCH_STATE_LABELS,
  BATCH_STATE_ICONS,
  BATCH_STATE_COLORS,
  PRODUCT_TYPE_LABELS,
  ProductType,
} from "@/config/contract";

// Dynamic import for Leaflet (no SSR — uses `window`)
const OriginMap = dynamic(
  () => import("@/components/origin-map").then((m) => m.OriginMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
    ),
  }
);

export default function TrackBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = use(params);

  const {
    data: batchInfo,
    isLoading: infoLoading,
    error: infoError,
  } = useBatchInfo(BigInt(batchId));

  const { data: batchState, isLoading: stateLoading } = useBatchState(
    BigInt(batchId)
  );

  const { data: uri } = useBatchURI(BigInt(batchId));

  if (infoLoading || stateLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4" />
            <div className="h-4 bg-muted rounded w-2/3 mx-auto mb-8" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (infoError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">❌ Lote No Encontrado</h1>
          <p className="text-muted-foreground mb-4">
            El Batch ID <code className="font-mono text-sm">{batchId}</code> no
            existe en la blockchain.
          </p>
          <p className="text-sm text-muted-foreground">
            Verifica que el ID sea correcto o escanea el QR del producto.
          </p>
        </div>
      </div>
    );
  }

  // Destructure batch info (wagmi v3 returns a named struct)
  const info = batchInfo as
    | {
        farmer: `0x${string}`;
        productType: number;
        variety: string;
        weightKg: bigint;
        originHash: `0x${string}`;
        region: string;
        harvestDate: bigint;
        lastUpdate: bigint;
        currentState: number;
        ipfsHash: string;
      }
    | undefined;

  const farmer = info?.farmer ?? "0x";
  const productType = info?.productType ?? 0;
  const variety = info?.variety ?? "";
  const weightKg = info?.weightKg ?? 0n;
  const region = info?.region ?? "";
  const harvestDate = info?.harvestDate ?? 0n;
  const ipfsHash = info?.ipfsHash ?? "";
  const currentState = info?.currentState ?? 0;

  const stateNum = (batchState as number) ?? currentState;
  const stateEnum = stateNum as BatchState;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Badge
              variant="outline"
              className="text-xs font-mono"
            >
              Batch #{batchId.slice(0, 12)}...
            </Badge>
            <Badge className={`${BATCH_STATE_COLORS[stateEnum]} text-white`}>
              {BATCH_STATE_ICONS[stateEnum]} {BATCH_STATE_LABELS[stateEnum]}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{variety}</h1>
          <p className="text-muted-foreground">
            {PRODUCT_TYPE_LABELS[productType as ProductType]} • {region}
          </p>
        </div>

        {/* Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              📍 Timeline de Trazabilidad
            </CardTitle>
            <CardDescription>
              Cada estado está verificado on-chain en Polygon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.values(BatchState)
                .filter((v) => typeof v === "number")
                .map((state) => {
                  const s = state as BatchState;
                  const isCompleted = s <= stateEnum;
                  const isCurrent = s === stateEnum;

                  return (
                    <div key={s} className="flex items-center gap-4">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          isCompleted
                            ? `${BATCH_STATE_COLORS[s]} text-white`
                            : "bg-muted text-muted-foreground"
                        } ${isCurrent ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                      >
                        {BATCH_STATE_ICONS[s]}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            isCompleted
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {BATCH_STATE_LABELS[s]}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-primary font-medium">
                            ← Estado actual
                          </p>
                        )}
                      </div>
                      {isCompleted && (
                        <span className="text-green-500 text-sm">✓</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">📋 Detalles del Lote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Producto" value={PRODUCT_TYPE_LABELS[productType as ProductType]} />
            <DetailRow label="Variedad" value={variety} />
            <Separator />
            <DetailRow label="Región" value={region} />
            <DetailRow
              label="Peso"
              value={`${(Number(weightKg) / 100).toFixed(2)} kg`}
            />
            <DetailRow
              label="Fecha Cosecha"
              value={new Date(Number(harvestDate) * 1000).toLocaleDateString(
                "es-EC"
              )}
            />
            <Separator />
            <DetailRow
              label="Agricultor"
              value={`${farmer.slice(0, 8)}...${farmer.slice(-6)}`}
              mono
            />
            {uri && (
              <DetailRow
                label="IPFS"
                value={String(uri)}
                mono
                href={`https://ipfs.io/ipfs/${ipfsHash}`}
              />
            )}
          </CardContent>
        </Card>

        {/* Origin Map */}
        {region && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">🗺️ Origen en Ecuador</CardTitle>
              <CardDescription>
                Ubicación aproximada de la finca de origen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OriginMap region={region} height={350} />
            </CardContent>
          </Card>
        )}

        {/* IPFS Metadata */}
        {ipfsHash && (
          <div className="mb-6">
            <IpfsMetadata ipfsHash={ipfsHash} uri={uri ? String(uri) : undefined} />
          </div>
        )}

        {/* On-Chain Event History */}
        <div className="mb-6">
          <BatchEventHistory
            batchId={BigInt(batchId)}
            contractAddress={getContractAddress(DEFAULT_CHAIN_ID)}
          />
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <Button asChild variant="outline">
            <Link href="/track">← Buscar otro lote</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  href,
}: {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm text-primary hover:underline ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </a>
      ) : (
        <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
      )}
    </div>
  );
}

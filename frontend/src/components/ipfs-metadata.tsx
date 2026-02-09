"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Expected shape of IPFS metadata for a Pacha-Chain-Origin batch.
 * Matches the schema defined in scripts/generate-metadata.mjs
 */
interface BatchMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  properties?: {
    farmer?: {
      name?: string;
      cooperative?: string;
      region?: string;
    };
    certifications?: string[];
    processing_notes?: string;
    cupping_score?: number;
    photos?: string[];
  };
}

interface IpfsMetadataProps {
  /** IPFS hash from the contract (CID) */
  ipfsHash: string;
  /** Optional pre-fetched URI from the contract */
  uri?: string;
}

const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
];

/**
 * Try fetching from multiple IPFS gateways with fallback
 */
async function fetchFromIPFS(hash: string): Promise<BatchMetadata | null> {
  // Clean hash — remove ipfs:// prefix if present
  const cleanHash = hash.replace(/^ipfs:\/\//, "").trim();
  if (!cleanHash || cleanHash.length < 10) return null;

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const response = await fetch(`${gateway}${cleanHash}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      continue; // try next gateway
    }
  }
  return null;
}

/**
 * Resolves an IPFS URL to an HTTP gateway URL
 */
function resolveIpfsUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const clean = url.replace(/^ipfs:\/\//, "");
  return `${IPFS_GATEWAYS[0]}${clean}`;
}

/**
 * Displays IPFS metadata for a batch: attributes, farmer info,
 * certifications, photos, and processing notes.
 */
export function IpfsMetadata({ ipfsHash, uri }: IpfsMetadataProps) {
  const [metadata, setMetadata] = useState<BatchMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // Try fetching from the contract URI first, then the raw hash
      const hashToFetch =
        uri && uri.startsWith("ipfs://")
          ? uri.replace("ipfs://", "")
          : ipfsHash;

      const data = await fetchFromIPFS(hashToFetch);

      if (cancelled) return;

      if (data) {
        setMetadata(data);
      } else {
        setError("No se pudo cargar la metadata desde IPFS");
      }
      setLoading(false);
    }

    if (ipfsHash) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [ipfsHash, uri]);

  if (!ipfsHash) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🌐 Metadata IPFS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🌐 Metadata IPFS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <span className="text-3xl mb-2 block">🔗</span>
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <a
              href={`${IPFS_GATEWAYS[0]}${ipfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-mono"
            >
              Ver directamente en IPFS →
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metadata) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🌐 Metadata IPFS</CardTitle>
        <CardDescription>
          Información descentralizada almacenada en IPFS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image */}
        {metadata.image && (
          <div className="overflow-hidden rounded-lg">
            <img
              src={resolveIpfsUrl(metadata.image)}
              alt={metadata.name ?? "Batch image"}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Name & Description */}
        {metadata.name && (
          <div>
            <h3 className="font-semibold">{metadata.name}</h3>
            {metadata.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {metadata.description}
              </p>
            )}
          </div>
        )}

        {/* Attributes */}
        {metadata.attributes && metadata.attributes.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Atributos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {metadata.attributes.map((attr, i) => (
                <div key={i} className="rounded-lg border p-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    {attr.trait_type}
                  </p>
                  <p className="text-sm font-medium">{String(attr.value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Farmer Info */}
        {metadata.properties?.farmer && (
          <div>
            <p className="text-sm font-medium mb-2">👨‍🌾 Agricultor</p>
            <div className="space-y-1 text-sm">
              {metadata.properties.farmer.name && (
                <p>
                  <span className="text-muted-foreground">Nombre:</span>{" "}
                  {metadata.properties.farmer.name}
                </p>
              )}
              {metadata.properties.farmer.cooperative && (
                <p>
                  <span className="text-muted-foreground">Cooperativa:</span>{" "}
                  {metadata.properties.farmer.cooperative}
                </p>
              )}
              {metadata.properties.farmer.region && (
                <p>
                  <span className="text-muted-foreground">Región:</span>{" "}
                  {metadata.properties.farmer.region}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Certifications */}
        {metadata.properties?.certifications &&
          metadata.properties.certifications.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">📜 Certificaciones</p>
              <div className="flex flex-wrap gap-2">
                {metadata.properties.certifications.map((cert, i) => (
                  <Badge key={i} variant="secondary">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {/* Cupping Score */}
        {metadata.properties?.cupping_score && (
          <div>
            <p className="text-sm font-medium mb-1">☕ Puntaje de Cata</p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${Math.min(metadata.properties.cupping_score, 100)}%`,
                  }}
                />
              </div>
              <span className="text-sm font-bold">
                {metadata.properties.cupping_score}/100
              </span>
            </div>
          </div>
        )}

        {/* Processing Notes */}
        {metadata.properties?.processing_notes && (
          <div>
            <p className="text-sm font-medium mb-1">📝 Notas de Procesamiento</p>
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              {metadata.properties.processing_notes}
            </p>
          </div>
        )}

        {/* Photos Gallery */}
        {metadata.properties?.photos &&
          metadata.properties.photos.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">📸 Fotos</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {metadata.properties.photos.map((photo, i) => (
                  <a
                    key={i}
                    href={resolveIpfsUrl(photo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="overflow-hidden rounded-lg border hover:ring-2 hover:ring-primary transition-all"
                  >
                    <img
                      src={resolveIpfsUrl(photo)}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-24 object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

        {/* IPFS Link */}
        <div className="pt-2 border-t">
          <a
            href={`${IPFS_GATEWAYS[0]}${ipfsHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline font-mono"
          >
            Ver JSON completo en IPFS →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QrScanner } from "@/components/qr-scanner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VerifyPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      setScanResult(decodedText);
      setScanError(null);

      // If the QR contains a URL with /track/BATCHID, navigate directly
      const trackMatch = decodedText.match(/\/track\/(\d+)/);
      if (trackMatch) {
        router.push(`/track/${trackMatch[1]}`);
        return;
      }

      // If it's a pure numeric batchId
      if (/^\d+$/.test(decodedText.trim())) {
        router.push(`/track/${decodedText.trim()}`);
        return;
      }

      // Otherwise show result with option to search
      setScanError(
        "El QR no contiene un Batch ID válido. Intenta con otro código."
      );
    },
    [router]
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">📱 Verificar Producto</h1>
          <p className="text-muted-foreground">
            Escanea el código QR en el empaque del producto para ver su journey
            completo desde el campo ecuatoriano hasta tu mesa.
          </p>
        </div>

        {/* Scanner Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Escáner QR</CardTitle>
            <CardDescription>
              Apunta la cámara al código QR del empaque. Se reconocerá
              automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QrScanner
              onScanSuccess={handleScanSuccess}
              width={320}
              height={320}
            />
          </CardContent>
        </Card>

        {/* Result feedback */}
        {scanResult && !scanError && (
          <Card className="mb-6 border-green-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium">QR Detectado</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {scanResult.length > 60
                      ? `${scanResult.slice(0, 60)}...`
                      : scanResult}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    Redirigiendo al tracking...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {scanError && (
          <Card className="mb-6 border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-medium text-destructive">
                    QR no reconocido
                  </p>
                  <p className="text-sm text-muted-foreground">{scanError}</p>
                  {scanResult && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      Contenido: {scanResult}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {INSTRUCTIONS.map((inst, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Badge
                    variant="outline"
                    className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs p-0"
                  >
                    {i + 1}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{inst.title}</p>
                    <p className="text-xs text-muted-foreground">{inst.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                También puedes ingresar el Batch ID manualmente en{" "}
                <Link href="/track" className="text-primary hover:underline">
                  Rastrear Lote
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const INSTRUCTIONS = [
  {
    title: "Busca el código QR",
    desc: "Está impreso en la etiqueta del empaque del producto de cacao o café.",
  },
  {
    title: "Escanea con la cámara",
    desc: "Permite el acceso a la cámara y apunta al código QR. Se detectará automáticamente.",
  },
  {
    title: "Ve el journey completo",
    desc: "Serás redirigido a la página de trazabilidad donde verás cada estado del lote verificado en blockchain.",
  },
];

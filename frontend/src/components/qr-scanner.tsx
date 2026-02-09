"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

interface QrScannerProps {
  /** Callback fired when a QR code is successfully decoded */
  onScanSuccess: (decodedText: string) => void;
  /** Optional callback for scan errors (noisy — fires on every frame without QR) */
  onScanError?: (error: string) => void;
  /** Width of the scanner viewport in pixels */
  width?: number;
  /** Height of the scanner viewport in pixels */
  height?: number;
}

/**
 * QR Scanner component using html5-qrcode.
 * Requests camera permission and scans for QR codes in real time.
 */
export function QrScanner({
  onScanSuccess,
  onScanError,
  width = 300,
  height = 300,
}: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const scannerId = "pacha-qr-scanner";

  const stopScanner = useCallback(async () => {
    if (
      scannerRef.current &&
      scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING
    ) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore — may already be stopped
      }
    }
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }

      // Stop any existing scan
      if (
        scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING
      ) {
        await scannerRef.current.stop();
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: Math.min(width - 40, 250), height: Math.min(height - 40, 250) },
        },
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          onScanError?.(errorMessage);
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al iniciar la cámara";
      setError(msg);
      setHasPermission(false);
      setIsScanning(false);
    }
  }, [onScanSuccess, onScanError, width, height]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        try {
          if (
            scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING
          ) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Scanner viewport */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25 bg-black/5"
        style={{ width, height }}
      >
        <div id={scannerId} style={{ width: "100%", height: "100%" }} />

        {!isScanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-5xl mb-3">📷</span>
            <p className="text-sm text-muted-foreground">
              Presiona el botón para activar la cámara
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-4xl mb-3">⚠️</span>
            <p className="text-sm text-destructive font-medium mb-1">
              Error de cámara
            </p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            📷 Activar Cámara
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            ⏹ Detener Escáner
          </button>
        )}
      </div>

      {/* Permission hint */}
      {hasPermission === false && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Permite el acceso a la cámara en la configuración de tu navegador para
          escanear códigos QR.
        </p>
      )}
    </div>
  );
}

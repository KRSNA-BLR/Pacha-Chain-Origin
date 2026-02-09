"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/motion";

export default function TrackPage() {
  const [batchId, setBatchId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchId.trim()) {
      router.push(`/track/${batchId.trim()}`);
    }
  };

  return (
    <PageTransition>
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🔍 Rastrear Lote</h1>
          <p className="text-muted-foreground">
            Ingresa el ID del lote para ver su journey completo desde el campo
            hasta tu mesa.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buscar por Batch ID</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  placeholder="Ingresa el Batch ID (número)"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Button type="submit" disabled={!batchId.trim()}>
                  Rastrear
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                El Batch ID es el número único generado al crear el lote en la
                blockchain. Lo encuentras en el QR del producto.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    </PageTransition>
  );
}

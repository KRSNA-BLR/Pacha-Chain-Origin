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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TxStatus } from "@/components/tx-status";
import { useCreateBatch, generateOriginHash } from "@/hooks/use-contract-write";
import { ProductType, PRODUCT_TYPE_LABELS } from "@/config/contract";

const REGIONS = [
  "Esmeraldas, Ecuador",
  "Los Ríos, Ecuador",
  "Manabí, Ecuador",
  "Guayas, Ecuador",
  "El Oro, Ecuador",
  "Santo Domingo, Ecuador",
  "Loja, Ecuador",
  "Zamora Chinchipe, Ecuador",
  "Bolívar, Ecuador",
  "Cotopaxi, Ecuador",
  "Napo, Ecuador",
  "Sucumbíos, Ecuador",
  "Orellana, Ecuador",
  "Morona Santiago, Ecuador",
  "Pastaza, Ecuador",
  "Galápagos, Ecuador",
];

export function CreateBatchForm() {
  const { createBatch, hash, isPending, isConfirming, isSuccess, error, reset } =
    useCreateBatch();

  const [form, setForm] = useState({
    productType: "0",
    variety: "",
    weightKg: "",
    region: "",
    originDetail: "",
    harvestDate: "",
    ipfsHash: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    reset();

    const weightCentesimal = BigInt(Math.round(parseFloat(form.weightKg) * 100));
    const harvestTimestamp = BigInt(
      Math.floor(new Date(form.harvestDate).getTime() / 1000)
    );
    const originString = form.originDetail || form.region;
    const originHash = generateOriginHash(originString);

    createBatch({
      productType: parseInt(form.productType),
      variety: form.variety,
      weightKg: weightCentesimal,
      originHash,
      region: form.region,
      harvestDate: harvestTimestamp,
      ipfsHash: form.ipfsHash,
    });
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const isValid =
    form.variety.trim() !== "" &&
    form.weightKg !== "" &&
    parseFloat(form.weightKg) > 0 &&
    form.region !== "" &&
    form.harvestDate !== "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>📝 Crear Nuevo Lote</CardTitle>
        <CardDescription>
          Registra un nuevo lote de cacao o café en la blockchain. Requiere rol
          FARMER_ROLE.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Product Type + Variety */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productType">Tipo de Producto</Label>
              <Select
                value={form.productType}
                onValueChange={(v) => updateField("productType", v)}
              >
                <SelectTrigger id="productType">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    🫘 {PRODUCT_TYPE_LABELS[ProductType.Cacao]}
                  </SelectItem>
                  <SelectItem value="1">
                    ☕ {PRODUCT_TYPE_LABELS[ProductType.Coffee]}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variety">Variedad *</Label>
              <Input
                id="variety"
                placeholder="Ej: Nacional Fino de Aroma"
                value={form.variety}
                onChange={(e) => updateField("variety", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: Weight + Harvest Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weightKg">Peso (kg) *</Label>
              <Input
                id="weightKg"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ej: 150.50"
                value={form.weightKg}
                onChange={(e) => updateField("weightKg", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="harvestDate">Fecha de Cosecha *</Label>
              <Input
                id="harvestDate"
                type="date"
                value={form.harvestDate}
                onChange={(e) => updateField("harvestDate", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label htmlFor="region">Región de Origen *</Label>
            <Select
              value={form.region}
              onValueChange={(v) => updateField("region", v)}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder="Seleccionar región..." />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Origin Detail (para el hash) */}
          <div className="space-y-2">
            <Label htmlFor="originDetail">
              Detalle de Origen{" "}
              <span className="text-muted-foreground">(opcional, para hash)</span>
            </Label>
            <Textarea
              id="originDetail"
              placeholder="Ej: Finca La Aurora, km 45 vía Quinindé, Esmeraldas"
              value={form.originDetail}
              onChange={(e) => updateField("originDetail", e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Se genera un hash keccak256 de este texto como identificador único de origen.
            </p>
          </div>

          {/* IPFS Hash */}
          <div className="space-y-2">
            <Label htmlFor="ipfsHash">
              IPFS Hash{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="ipfsHash"
              placeholder="Ej: QmXoypiz..."
              value={form.ipfsHash}
              onChange={(e) => updateField("ipfsHash", e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!isValid || isPending || isConfirming}
            className="w-full"
          >
            {isPending
              ? "Esperando wallet..."
              : isConfirming
                ? "Confirmando..."
                : "🌱 Crear Lote en Blockchain"}
          </Button>

          {/* Status */}
          <TxStatus
            isPending={isPending}
            isConfirming={isConfirming}
            isSuccess={isSuccess}
            error={error}
            hash={hash}
            successMessage="¡Lote creado exitosamente en la blockchain!"
          />
        </form>
      </CardContent>
    </Card>
  );
}

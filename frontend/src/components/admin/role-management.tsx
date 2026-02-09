"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ROLES,
  DEFAULT_ADMIN_ROLE,
  FARMER_ROLE,
  PROCESSOR_ROLE,
  EXPORTER_ROLE,
  BUYER_ROLE,
} from "@/config/contract";
import { useHasRole } from "@/hooks/use-contract";
import { useGrantRole, useRevokeRole } from "@/hooks/use-contract-write";
import { TxStatus } from "@/components/tx-status";

const ROLE_MAP: Record<string, `0x${string}`> = {
  FARMER_ROLE: FARMER_ROLE,
  PROCESSOR_ROLE: PROCESSOR_ROLE,
  EXPORTER_ROLE: EXPORTER_ROLE,
  BUYER_ROLE: BUYER_ROLE,
  DEFAULT_ADMIN_ROLE: DEFAULT_ADMIN_ROLE,
};

export function RoleManagement() {
  const { address } = useAccount();

  // Admin check
  const { data: isAdmin } = useHasRole(
    DEFAULT_ADMIN_ROLE,
    address ?? "0x0000000000000000000000000000000000000000"
  );

  // Grant form
  const [grantAddress, setGrantAddress] = useState("");
  const [grantRole, setGrantRole] = useState("");
  const grant = useGrantRole();

  // Revoke form
  const [revokeAddress, setRevokeAddress] = useState("");
  const [revokeRole, setRevokeRole] = useState("");
  const revoke = useRevokeRole();

  // Lookup
  const [lookupAddress, setLookupAddress] = useState("");
  const [lookupActive, setLookupActive] = useState(false);

  const handleGrant = () => {
    if (!grantAddress || !grantRole) return;
    if (!isAddress(grantAddress)) return;
    const roleHash = ROLE_MAP[grantRole];
    if (!roleHash) return;
    grant.grantRole(roleHash, grantAddress as `0x${string}`);
  };

  const handleRevoke = () => {
    if (!revokeAddress || !revokeRole) return;
    if (!isAddress(revokeAddress)) return;
    const roleHash = ROLE_MAP[revokeRole];
    if (!roleHash) return;
    revoke.revokeRole(roleHash, revokeAddress as `0x${string}`);
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertDescription>
          ⛔ Solo cuentas con <strong>DEFAULT_ADMIN_ROLE</strong> pueden gestionar roles.
          {address && (
            <span className="block text-xs font-mono mt-1 text-muted-foreground">
              Tu wallet: {address}
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grant Role */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Otorgar Rol</CardTitle>
          <CardDescription>
            Asigna un rol a una dirección de wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grant-addr">Dirección de Wallet</Label>
              <Input
                id="grant-addr"
                placeholder="0x..."
                value={grantAddress}
                onChange={(e) => setGrantAddress(e.target.value)}
              />
              {grantAddress && !isAddress(grantAddress) && (
                <p className="text-xs text-destructive">Dirección inválida</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="grant-role">Rol</Label>
              <Select value={grantRole} onValueChange={setGrantRole}>
                <SelectTrigger id="grant-role">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      {r.icon} {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleGrant}
            disabled={
              !grantAddress ||
              !grantRole ||
              !isAddress(grantAddress) ||
              grant.isPending
            }
            className="bg-green-800 hover:bg-green-700 text-white"
          >
            {grant.isPending ? "Enviando..." : "Otorgar Rol"}
          </Button>
          <TxStatus
            hash={grant.hash}
            isPending={grant.isPending}
            isConfirming={grant.isConfirming}
            isSuccess={grant.isSuccess}
            error={grant.error}
          />
        </CardContent>
      </Card>

      {/* Revoke Role */}
      <Card>
        <CardHeader>
          <CardTitle>🚫 Revocar Rol</CardTitle>
          <CardDescription>
            Elimina un rol de una dirección de wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revoke-addr">Dirección de Wallet</Label>
              <Input
                id="revoke-addr"
                placeholder="0x..."
                value={revokeAddress}
                onChange={(e) => setRevokeAddress(e.target.value)}
              />
              {revokeAddress && !isAddress(revokeAddress) && (
                <p className="text-xs text-destructive">Dirección inválida</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="revoke-role">Rol</Label>
              <Select value={revokeRole} onValueChange={setRevokeRole}>
                <SelectTrigger id="revoke-role">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      {r.icon} {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleRevoke}
            disabled={
              !revokeAddress ||
              !revokeRole ||
              !isAddress(revokeAddress) ||
              revoke.isPending
            }
            variant="destructive"
          >
            {revoke.isPending ? "Enviando..." : "Revocar Rol"}
          </Button>
          <TxStatus
            hash={revoke.hash}
            isPending={revoke.isPending}
            isConfirming={revoke.isConfirming}
            isSuccess={revoke.isSuccess}
            error={revoke.error}
          />
        </CardContent>
      </Card>

      {/* Role Lookup */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Consultar Roles</CardTitle>
          <CardDescription>
            Verifica qué roles tiene una dirección
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="0x... dirección a consultar"
              value={lookupAddress}
              onChange={(e) => {
                setLookupAddress(e.target.value);
                setLookupActive(false);
              }}
              className="flex-1"
            />
            <Button
              onClick={() => setLookupActive(true)}
              disabled={!isAddress(lookupAddress)}
              variant="outline"
            >
              Consultar
            </Button>
          </div>
          {lookupActive && isAddress(lookupAddress) && (
            <RoleLookupTable address={lookupAddress as `0x${string}`} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RoleLookupTable({ address }: { address: `0x${string}` }) {
  return (
    <div className="rounded-md border mt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            <TableHead className="text-center">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROLES.map((role) => (
            <RoleLookupRow key={role.key} roleKey={role.key} address={address} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RoleLookupRow({
  roleKey,
  address,
}: {
  roleKey: string;
  address: `0x${string}`;
}) {
  const roleHash = ROLE_MAP[roleKey];
  const { data: hasRole, isLoading } = useHasRole(roleHash, address);
  const role = ROLES.find((r) => r.key === roleKey);

  return (
    <TableRow>
      <TableCell>
        {role?.icon} {role?.label}
      </TableCell>
      <TableCell className="text-center">
        {isLoading ? (
          <Badge variant="outline">Cargando...</Badge>
        ) : hasRole ? (
          <Badge className="bg-green-700 text-white">✅ Activo</Badge>
        ) : (
          <Badge variant="secondary">— Sin rol</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

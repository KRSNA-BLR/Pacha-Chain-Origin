"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const CONNECTOR_ICONS: Record<string, string> = {
  MetaMask: "🦊",
  "Coinbase Wallet": "🔵",
  WalletConnect: "🔗",
  Safe: "🛡️",
  Injected: "💉",
};

/**
 * Botón de conexión multi-wallet
 * Soporta: MetaMask, WalletConnect, Coinbase Wallet, Safe
 */
export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden lg:inline">
          {chain?.name}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="font-mono text-xs"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </Button>
      </div>
    );
  }

  // Deduplicate connectors by name (injected can appear multiple times)
  const uniqueConnectors = connectors.filter(
    (c, i, arr) => arr.findIndex((x) => x.name === c.name) === i
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" disabled={isPending}>
          {isPending ? "Conectando..." : "Conectar Wallet"}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Conectar Wallet</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {uniqueConnectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => {
                connect({ connector });
                setOpen(false);
              }}
              disabled={isPending}
              className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left disabled:opacity-50"
            >
              <span className="text-2xl">
                {CONNECTOR_ICONS[connector.name] || "🔐"}
              </span>
              <div>
                <p className="text-sm font-medium">{connector.name}</p>
                <p className="text-xs text-muted-foreground">
                  {connector.name === "MetaMask"
                    ? "Extensión de navegador"
                    : connector.name === "WalletConnect"
                      ? "+400 wallets móviles"
                      : connector.name === "Coinbase Wallet"
                        ? "App & extensión"
                        : connector.name === "Safe"
                          ? "Multisig (Gnosis)"
                          : "Wallet inyectada"}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 p-3 rounded-lg bg-muted text-xs text-muted-foreground">
          <p className="font-medium mb-1">Redes soportadas</p>
          <p>Polygon Amoy (Testnet) • Anvil (Local)</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

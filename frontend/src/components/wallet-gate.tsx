"use client";

import { useAccount } from "wagmi";
import { injected } from "wagmi/connectors";
import { useConnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WalletGateProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that requires a wallet connection.
 * Shows a connect prompt if not connected.
 */
export function WalletGate({ children }: WalletGateProps) {
  const { isConnected, address } = useAccount();
  const { connect, isPending } = useConnect();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="text-5xl mb-2">🔐</div>
              <CardTitle>Wallet Requerida</CardTitle>
              <CardDescription>
                Conecta tu wallet para acceder al panel de administración.
                Necesitas una cuenta con los roles apropiados en el contrato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                onClick={() => connect({ connector: injected() })}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? "Conectando..." : "🦊 Conectar MetaMask"}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Asegúrate de estar en la red correcta (Polygon Amoy o Anvil
                local).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

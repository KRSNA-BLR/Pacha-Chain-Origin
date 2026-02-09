import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-4">🌿</div>
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-8">
        Esta página no existe. Tal vez el lote que buscas tiene otro camino.
      </p>
      <div className="flex justify-center gap-4">
        <Button asChild>
          <Link href="/">Ir al Inicio</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/track">Rastrear Lote</Link>
        </Button>
      </div>
    </div>
  );
}

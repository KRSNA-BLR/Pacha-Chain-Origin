import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌿</span>
              <span className="font-bold text-lg">
                Pacha<span className="text-primary">Chain</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Trazabilidad blockchain Farm-to-Table para cacao y café premium
              ecuatoriano.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Navegación</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="hover:text-foreground transition-colors"
                >
                  Rastrear Lote
                </Link>
              </li>
              <li>
                <Link
                  href="/verify"
                  className="hover:text-foreground transition-colors"
                >
                  Verificar QR
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Tecnología</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Polygon Amoy Testnet</li>
              <li>ERC-1155 + IPFS</li>
              <li>
                <a
                  href="https://github.com/KRSNA-BLR/Pacha-Chain-Origin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Pacha-Chain-Origin. KB Asesorias.</p>
          <p>
            Built with Next.js, wagmi, and{" "}
            <span className="text-primary">♥</span> from Ecuador 🇪🇨
          </p>
        </div>
      </div>
    </footer>
  );
}

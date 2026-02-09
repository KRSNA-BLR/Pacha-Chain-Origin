import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/admin-panel";

export const metadata: Metadata = {
  title: "Admin | Pacha Chain Origin",
  description:
    "Panel de administración para gestionar lotes, roles y el contrato de trazabilidad",
};

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🔐 Panel Admin</h1>
        <p className="text-muted-foreground mb-8">
          Gestiona lotes, avanza estados y administra roles. Requiere wallet
          conectada con los permisos adecuados.
        </p>

        <AdminPanel />
      </div>
    </div>
  );
}

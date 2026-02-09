import type { Metadata } from "next";
import VerifyPage from "./page-client";

export const metadata: Metadata = {
  title: "Verificar QR",
  description:
    "Escanea el QR de un producto para verificar su trazabilidad blockchain",
};

export default function Page() {
  return <VerifyPage />;
}

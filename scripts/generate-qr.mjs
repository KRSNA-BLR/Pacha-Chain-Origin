/**
 * @file generate-qr.mjs
 * @description Genera códigos QR para lotes de producto
 *
 * ¿Para qué sirve el QR?
 * =======================
 * El QR es el puente entre el mundo FÍSICO y el DIGITAL:
 *
 *   Saco de cacao 📦 → Etiqueta con QR 📱 → Escaneo → Web de verificación 🌐
 *
 * El consumidor escanea el QR con su celular y ve:
 * - De qué finca viene el cacao
 * - Quién lo cosechó
 * - Cómo se fermentó y secó
 * - El viaje completo hasta su mano
 *
 * El QR puede apuntar a:
 * 1. La metadata IPFS directamente (descentralizado, pero URL larga)
 * 2. Una web de verificación que lee la blockchain (más amigable)
 * 3. Ambos
 *
 * Herramienta: qrcode - Genera QR en formato PNG, SVG o terminal
 *
 * Uso:
 *   node scripts/generate-qr.mjs <batchId_o_CID> [tipo]
 *
 *   Tipos:
 *     ipfs      - QR apunta a gateway IPFS (ej: https://ipfs.io/ipfs/QmXYZ...)
 *     verify    - QR apunta a web de verificación (ej: https://pacha-chain.xyz/verify/123)
 *     contract  - QR apunta a PolygonScan del contrato
 *
 *   Ejemplos:
 *     node scripts/generate-qr.mjs QmABC123 ipfs
 *     node scripts/generate-qr.mjs 12345 verify
 */

import QRCode from "qrcode";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import chalk from "chalk";
import "dotenv/config";

// ============================================================
//  Configuración
// ============================================================
const VERIFY_BASE_URL = process.env.VERIFY_BASE_URL || "https://pacha-chain.xyz/verify";
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs";
const CONTRACT_ADDRESS = process.env.PACHA_CHAIN_ORIGIN_ADDRESS || "0x_NOT_DEPLOYED_YET";
const POLYGONSCAN_URL = `https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`;

const OUTPUT_DIR = resolve("output/qr-codes");

// ============================================================
//  Argumentos
// ============================================================
const identifier = process.argv[2];
const type = process.argv[3] || "verify";

if (!identifier) {
  console.log(chalk.yellow("\n⚠  Uso: node scripts/generate-qr.mjs <batchId_o_CID> [tipo]\n"));
  console.log("  Tipos disponibles:");
  console.log("    ipfs     → QR apunta a gateway IPFS");
  console.log("    verify   → QR apunta a web de verificación");
  console.log("    contract → QR apunta a PolygonScan\n");
  console.log("  Ejemplos:");
  console.log("    node scripts/generate-qr.mjs QmABC123def ipfs");
  console.log("    node scripts/generate-qr.mjs 12345 verify\n");
  process.exit(1);
}

// ============================================================
//  Determinar URL del QR
// ============================================================
let url;
let label;

switch (type) {
  case "ipfs":
    url = `${IPFS_GATEWAY}/${identifier}`;
    label = "IPFS Metadata";
    break;
  case "verify":
    url = `${VERIFY_BASE_URL}/${identifier}`;
    label = "Verificación Pública";
    break;
  case "contract":
    url = POLYGONSCAN_URL;
    label = "Contrato en PolygonScan";
    break;
  default:
    console.log(chalk.red(`\n❌ Tipo desconocido: ${type}. Usa: ipfs, verify, contract\n`));
    process.exit(1);
}

// ============================================================
//  Generar QR
// ============================================================
console.log(chalk.blue(`\n📱 Generando QR Code (${label})\n`));
console.log(chalk.gray(`  URL:  ${url}`));
console.log(chalk.gray(`  Tipo: ${type}`));

// Crear directorio de salida
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sanitizedId = identifier.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
const pngPath = resolve(OUTPUT_DIR, `qr-${type}-${sanitizedId}.png`);
const svgPath = resolve(OUTPUT_DIR, `qr-${type}-${sanitizedId}.svg`);

try {
  // Generar PNG (para impresión en etiquetas)
  await QRCode.toFile(pngPath, url, {
    type: "png",
    width: 512,
    margin: 2,
    color: {
      dark: "#1a1a2e",   // Color oscuro (azul oscuro Pacha)
      light: "#ffffff",  // Fondo blanco
    },
    errorCorrectionLevel: "H", // Alta corrección de errores (30%) - resiste daño en etiquetas
  });

  // Generar SVG (para diseño gráfico y escalado)
  const svgString = await QRCode.toString(url, {
    type: "svg",
    margin: 2,
    color: {
      dark: "#1a1a2e",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
  writeFileSync(svgPath, svgString);

  // Mostrar QR en terminal (preview rápido)
  const terminalQR = await QRCode.toString(url, {
    type: "terminal",
    small: true,
  });

  console.log(chalk.green("\n✅ QR Codes generados:\n"));
  console.log(chalk.gray(`  PNG: ${pngPath}`));
  console.log(chalk.gray(`  SVG: ${svgPath}`));
  console.log();
  console.log(chalk.cyan("  Preview en terminal:"));
  console.log(terminalQR);
  console.log(chalk.gray("  El QR PNG tiene corrección de errores 'H' (30%),"));
  console.log(chalk.gray("  ideal para impresión en etiquetas de sacos de cacao.\n"));
} catch (err) {
  console.log(chalk.red(`\n❌ Error generando QR: ${err.message}\n`));
  process.exit(1);
}

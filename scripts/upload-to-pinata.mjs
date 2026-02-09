/**
 * @file upload-to-pinata.mjs
 * @description Sube un archivo individual a IPFS vía Pinata
 *
 * ¿Qué es Pinata?
 * ================
 * Pinata es un servicio que hace fácil subir archivos a IPFS.
 * IPFS (InterPlanetary File System) es un almacén descentralizado:
 * - Cada archivo tiene un "CID" (Content Identifier) único basado en su contenido
 * - Si el contenido cambia, el CID cambia → inmutabilidad garantizada
 * - Múltiples nodos guardan copias → no hay punto central de fallo
 *
 * ¿Por qué Pinata y no IPFS directo?
 * - IPFS directo requiere correr tu propio nodo
 * - Pinata corre nodos por ti y garantiza "pinning" (que tu archivo no desaparezca)
 * - Tiene API REST simple y plan gratuito de 500MB
 *
 * Herramienta: pinata SDK oficial de Pinata para Node.js
 *
 * Configuración previa:
 *   1. Crea cuenta en https://app.pinata.cloud
 *   2. Ve a API Keys → New Key → Copia el JWT
 *   3. Agrégalo a tu .env como PINATA_JWT=<tu_jwt>
 *
 * Uso:
 *   node scripts/upload-to-pinata.mjs <archivo> [nombre_opcional]
 *   node scripts/upload-to-pinata.mjs metadata/sample-batch.json "Lote Cacao 2026-001"
 *   node scripts/upload-to-pinata.mjs photos/cosecha.jpg "Foto cosecha Esmeraldas"
 */

import { readFileSync, existsSync } from "fs";
import { resolve, basename } from "path";
import { PinataSDK } from "pinata";
import chalk from "chalk";
import "dotenv/config";

// ============================================================
//  Verificar configuración
// ============================================================
const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_JWT) {
  console.log(chalk.red("\n❌ PINATA_JWT no configurado en .env\n"));
  console.log("  Pasos:");
  console.log("  1. Crea cuenta en https://app.pinata.cloud");
  console.log("  2. Ve a API Keys → New Key → Copia el JWT");
  console.log("  3. Agrega a .env: PINATA_JWT=<tu_jwt>\n");
  process.exit(1);
}

// ============================================================
//  Leer argumentos
// ============================================================
const filePath = process.argv[2];
const customName = process.argv[3];

if (!filePath) {
  console.log(chalk.yellow("\n⚠  Uso: node scripts/upload-to-pinata.mjs <archivo> [nombre]\n"));
  console.log("  Ejemplos:");
  console.log("    node scripts/upload-to-pinata.mjs metadata/sample-batch.json");
  console.log('    node scripts/upload-to-pinata.mjs photos/cosecha.jpg "Foto cosecha"\n');
  process.exit(1);
}

const absolutePath = resolve(filePath);
const fileName = customName || basename(absolutePath);

if (!existsSync(absolutePath)) {
  console.log(chalk.red(`\n❌ Archivo no encontrado: ${absolutePath}\n`));
  process.exit(1);
}

// ============================================================
//  Subir a Pinata
// ============================================================
console.log(chalk.blue(`\n📤 Subiendo a IPFS vía Pinata: ${basename(absolutePath)}\n`));

try {
  const pinata = new PinataSDK({ pinataJwt: PINATA_JWT });

  const fileContent = readFileSync(absolutePath);
  const blob = new Blob([fileContent]);
  const file = new File([blob], basename(absolutePath), {
    type: absolutePath.endsWith(".json") ? "application/json" : "application/octet-stream",
  });

  const result = await pinata.upload.file(file).addMetadata({
    name: fileName,
    keyValues: {
      project: "Pacha-Chain-Origin",
      type: absolutePath.endsWith(".json") ? "metadata" : "file",
    },
  });

  const cid = result.IpfsHash;
  const ipfsUri = `ipfs://${cid}`;
  const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

  console.log(chalk.green("✅ Archivo subido exitosamente a IPFS!\n"));
  console.log(chalk.white("  Resultados:"));
  console.log(chalk.gray(`    CID:          ${cid}`));
  console.log(chalk.gray(`    IPFS URI:     ${ipfsUri}`));
  console.log(chalk.gray(`    Gateway URL:  ${gatewayUrl}`));
  console.log(chalk.gray(`    Tamaño:       ${result.PinSize} bytes`));
  console.log(chalk.gray(`    Timestamp:    ${result.Timestamp}`));
  console.log();
  console.log(chalk.cyan("  Usa este CID en el smart contract:"));
  console.log(chalk.cyan(`    createBatch(..., "${cid}")`));
  console.log(chalk.cyan(`    updateMetadata(batchId, "${cid}")\n`));
} catch (err) {
  console.log(chalk.red(`\n❌ Error subiendo a Pinata: ${err.message}\n`));

  if (err.message.includes("401") || err.message.includes("Unauthorized")) {
    console.log(chalk.yellow("  → Tu PINATA_JWT puede ser inválido o estar expirado"));
    console.log(chalk.yellow("  → Genera uno nuevo en https://app.pinata.cloud/developers/api-keys\n"));
  }

  process.exit(1);
}

/**
 * @file upload-metadata.mjs
 * @description Valida y sube metadata de un lote a IPFS (flujo completo)
 *
 * ¿Qué hace este script?
 * =======================
 * Es el flujo "todo en uno" para metadata:
 *   1. Lee el archivo JSON
 *   2. Lo valida contra el schema GS1
 *   3. Si es válido, lo sube a Pinata/IPFS
 *   4. Retorna el CID para usar en el smart contract
 *
 * Es el script que un productor o cooperativa usaría en la práctica.
 *
 * Uso:
 *   node scripts/upload-metadata.mjs metadata/sample-batch.json
 */

import { readFileSync, existsSync } from "fs";
import { resolve, basename } from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { PinataSDK } from "pinata";
import chalk from "chalk";
import "dotenv/config";

// ============================================================
//  Función principal
// ============================================================
async function main() {
  const targetFile = process.argv[2];

  if (!targetFile) {
    console.log(chalk.yellow("\n⚠  Uso: node scripts/upload-metadata.mjs <archivo.json>\n"));
    process.exit(1);
  }

  const filePath = resolve(targetFile);
  const fileName = basename(filePath);

  if (!existsSync(filePath)) {
    console.log(chalk.red(`\n❌ Archivo no encontrado: ${filePath}\n`));
    process.exit(1);
  }

  console.log(chalk.blue(`\n🔄 Procesando metadata: ${fileName}\n`));

  // --- PASO 1: Leer JSON ---
  console.log(chalk.gray("  1/3 Leyendo archivo..."));
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.log(chalk.red(`\n❌ JSON inválido: ${err.message}\n`));
    process.exit(1);
  }

  // --- PASO 2: Validar contra schema ---
  console.log(chalk.gray("  2/3 Validando contra schema GS1..."));
  const schema = JSON.parse(
    readFileSync(resolve("metadata/schema/batch-metadata-v1.schema.json"), "utf-8")
  );
  const ajv = new Ajv({ allErrors: true, verbose: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    console.log(chalk.red("\n❌ Metadata inválida:\n"));
    validate.errors.forEach((err, i) => {
      console.log(chalk.red(`  ${i + 1}. ${err.instancePath}: ${err.message}`));
    });
    console.log(chalk.yellow("\n  Corrige los errores y vuelve a intentar.\n"));
    process.exit(1);
  }

  console.log(chalk.green("     ✓ Schema válido"));

  // --- PASO 3: Subir a IPFS vía Pinata ---
  console.log(chalk.gray("  3/3 Subiendo a IPFS vía Pinata..."));

  const PINATA_JWT = process.env.PINATA_JWT;
  if (!PINATA_JWT) {
    console.log(chalk.red("\n❌ PINATA_JWT no configurado en .env\n"));
    console.log(chalk.yellow("  La metadata es válida, pero no se puede subir sin API key."));
    console.log(chalk.yellow("  Configura PINATA_JWT en .env y re-ejecuta.\n"));
    process.exit(1);
  }

  try {
    const pinata = new PinataSDK({ pinataJwt: PINATA_JWT });

    const fileContent = readFileSync(filePath);
    const blob = new Blob([fileContent]);
    const file = new File([blob], fileName, { type: "application/json" });

    const batchName = data.name || fileName;
    const result = await pinata.upload.file(file).addMetadata({
      name: batchName,
      keyValues: {
        project: "Pacha-Chain-Origin",
        type: "batch-metadata",
        product: data.properties?.product?.type || "unknown",
        variety: data.properties?.product?.variety || "unknown",
        origin: data.properties?.origin?.province || "unknown",
      },
    });

    const cid = result.IpfsHash;

    console.log(chalk.green(`\n✅ Metadata subida exitosamente!\n`));
    console.log(chalk.white("  ╔══════════════════════════════════════════════════╗"));
    console.log(chalk.white(`  ║  CID: ${cid}`));
    console.log(chalk.white(`  ║  URI: ipfs://${cid}`));
    console.log(chalk.white("  ╚══════════════════════════════════════════════════╝"));
    console.log();
    console.log(chalk.cyan("  Para usar en el smart contract:"));
    console.log(chalk.gray(`    createBatch(..., "${cid}")`));
    console.log(chalk.gray(`    updateMetadata(batchId, "${cid}")\n`));
  } catch (err) {
    console.log(chalk.red(`\n❌ Error subiendo: ${err.message}\n`));
    process.exit(1);
  }
}

main().catch(console.error);

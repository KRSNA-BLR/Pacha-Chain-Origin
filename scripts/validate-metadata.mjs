/**
 * @file validate-metadata.mjs
 * @description Valida archivos JSON de metadata contra el schema GS1-compatible
 *
 * ¿Qué hace este script?
 * =======================
 * Antes de subir metadata a IPFS (que es PERMANENTE), validamos que el JSON
 * cumple con nuestro schema. Si hay errores, se muestran antes de gastar
 * dinero en storage.
 *
 * Herramientas usadas:
 * - ajv:         La librería de validación JSON Schema más rápida de Node.js
 * - ajv-formats: Extensión para validar formatos como "date-time", "uri", etc.
 * - chalk:       Colores en terminal para mensajes legibles
 *
 * Uso:
 *   node scripts/validate-metadata.mjs metadata/sample-batch.json
 *   node scripts/validate-metadata.mjs metadata/my-batch.json
 */

import { readFileSync } from "fs";
import { resolve, basename } from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import chalk from "chalk";

// ============================================================
//  Cargar el JSON Schema
// ============================================================
const schemaPath = resolve("metadata/schema/batch-metadata-v1.schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));

// ============================================================
//  Configurar validador AJV
// ============================================================
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv); // Agrega soporte para "date-time", "uri", "email", etc.
const validate = ajv.compile(schema);

// ============================================================
//  Leer archivo a validar desde argumentos
// ============================================================
const targetFile = process.argv[2];

if (!targetFile) {
  console.log(chalk.yellow("\n⚠  Uso: node scripts/validate-metadata.mjs <archivo.json>\n"));
  console.log("  Ejemplo:");
  console.log("    node scripts/validate-metadata.mjs metadata/sample-batch.json\n");
  process.exit(1);
}

const filePath = resolve(targetFile);
const fileName = basename(filePath);

console.log(chalk.blue(`\n🔍 Validando: ${fileName}\n`));

try {
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  const valid = validate(data);

  if (valid) {
    console.log(chalk.green("✅ Metadata VÁLIDA - Cumple con el schema GS1-compatible\n"));
    console.log(chalk.gray("  Datos verificados:"));
    console.log(chalk.gray(`    Nombre:    ${data.name}`));
    console.log(chalk.gray(`    Producto:  ${data.properties?.product?.type || "N/A"}`));
    console.log(chalk.gray(`    Variedad:  ${data.properties?.product?.variety || "N/A"}`));
    console.log(chalk.gray(`    Origen:    ${data.properties?.origin?.province || "N/A"}, ${data.properties?.origin?.country || "N/A"}`));
    console.log(chalk.gray(`    Finca:     ${data.properties?.origin?.farm || "N/A"}`));
    console.log(chalk.gray(`    Cosecha:   ${data.properties?.harvest?.date || "N/A"}`));
    console.log();
    console.log(chalk.green("  ✓ Listo para subir a IPFS con: npm run upload:metadata\n"));
  } else {
    console.log(chalk.red("❌ Metadata INVÁLIDA - Errores encontrados:\n"));
    validate.errors.forEach((err, i) => {
      console.log(chalk.red(`  ${i + 1}. ${err.instancePath || "/"}`));
      console.log(chalk.yellow(`     ${err.message}`));
      if (err.params) {
        console.log(chalk.gray(`     Parámetros: ${JSON.stringify(err.params)}`));
      }
      console.log();
    });
    process.exit(1);
  }
} catch (err) {
  if (err.code === "ENOENT") {
    console.log(chalk.red(`❌ Archivo no encontrado: ${filePath}\n`));
  } else if (err instanceof SyntaxError) {
    console.log(chalk.red(`❌ JSON inválido en ${fileName}: ${err.message}\n`));
  } else {
    console.log(chalk.red(`❌ Error: ${err.message}\n`));
  }
  process.exit(1);
}

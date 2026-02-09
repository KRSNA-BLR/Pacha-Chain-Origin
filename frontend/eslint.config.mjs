import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  sonarjs.configs.recommended,
  {
    rules: {
      // ── Complejidad ciclomática ──
      "complexity": ["warn", 10],
      "sonarjs/cognitive-complexity": ["warn", 15],
      "max-depth": ["warn", 4],
      "max-params": ["warn", 4],

      // ── Sonarjs: warn en reglas comunes en React/JSX ──
      "sonarjs/no-nested-conditional": "warn",
      "sonarjs/concise-regex": "warn",
      "sonarjs/table-header": "warn",
      "sonarjs/no-dead-store": "warn",

      // ── Desactivar duplicados con @typescript-eslint o incompatibles ──
      "sonarjs/unused-import": "off",
      "sonarjs/no-unused-vars": "off",
      "sonarjs/no-commented-code": "off",
      "sonarjs/todo-tag": "off",
      "sonarjs/fixme-tag": "off",
      "sonarjs/no-unknown-property": "off",
      "sonarjs/no-misused-promises": "off",
      "sonarjs/no-empty-function": "off",
      "sonarjs/function-name": "off",
      "sonarjs/no-async-constructor": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

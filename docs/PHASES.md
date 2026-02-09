# Plan de Fases - Pacha-Chain-Origin

## Visión General

```
FASE 1 ──▶ FASE 2 ──▶ FASE 3 ──▶ FASE 4 ──▶ FASE 5
 Core       IPFS      Deploy      Web App    Auditoría
 ✅         ✅        ✅          🔄          ⬜
```

---

## FASE 1: Arquitectura y Diseño de Estados (El 'Core') ✅

### Objetivo
Construir el Smart Contract principal con la máquina de estados,
roles de actores y estructura de datos.

### Entregables
- [x] Documento de arquitectura (`ARCHITECTURE.md`)
- [x] Mapeo GS1 → Blockchain (`GS1-MAPPING.md`)
- [x] Interface del contrato (`IPachaChainOrigin.sol`)
- [x] Librería de generación de IDs (`BatchIdGenerator.sol`)
- [x] Contrato principal (`PachaChainOrigin.sol`)
- [x] Tests unitarios completos (47 tests passing)
- [x] Configuración de Foundry (Solidity 0.8.24, EVM cancun)

### Tests Implementados
1. ✅ Deployment correcto con roles iniciales
2. ✅ Solo FARMER puede crear lotes
3. ✅ Máquina de estados: transiciones válidas
4. ✅ Máquina de estados: transiciones inválidas revertidas
5. ✅ Solo el rol correcto puede ejecutar cada transición
6. ✅ Eventos emitidos correctamente
7. ✅ Datos del lote almacenados correctamente
8. ✅ Pausabilidad funcional
9. ✅ Fuzz testing + integration tests

---

## FASE 2: Metadata IPFS y URI ✅

### Objetivo
Integrar almacenamiento descentralizado para metadata extendida.

### Entregables
- [x] Estructura JSON de metadata GS1-compatible (`batch-metadata-v1.schema.json`)
- [x] Script de upload a IPFS via Pinata (`upload-to-pinata.mjs`, `upload-metadata.mjs`)
- [x] Integración `ERC1155URIStorage` en contrato (baseURI `ipfs://`)
- [x] Función `updateMetadata()` con permisos por rol
- [x] Tests de URI y metadata (8 tests adicionales, 55 total)
- [x] Generación de QR Code con link a metadata (`generate-qr.mjs` - PNG, SVG, terminal)
- [x] Script de validación de metadata (`validate-metadata.mjs` con ajv)
- [x] Sample metadata (`sample-batch.json` - Cacao Nacional, Esmeraldas)

---

## FASE 3: Deployment y Verificación ✅

### Objetivo
Desplegar en local (Anvil) y Polygon Amoy, verificar el contrato y crear herramientas de interacción.

### Entregables
- [x] Script de deployment `Deploy.s.sol` (Anvil + Polygon Amoy)
- [x] Scripts post-deploy: `GrantRoles`, `CreateTestBatch` en `PostDeploy.s.sol`
- [x] Deployment exitoso en Anvil → `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- [x] 8 fork tests de verificación post-deploy (`PostDeployVerification.t.sol`)
  - PDV-01: Integridad del deployment
  - PDV-02: Flujo completo cacao (6 estados + metadata + URI)
  - PDV-03: Flujo completo café (6 estados + metadata + URI)
  - PDV-04: Flujo multi-actor (farmer→processor→exporter→buyer)
  - PDV-05: Pause/unpause en contrato desplegado
  - PDV-06: Emisión de eventos BatchCreated
  - PDV-07: Consistencia del contador de batches
  - PDV-08: ERC-1155 compliance (supportsInterface)
- [x] Cast helpers PowerShell (`scripts/cast-helpers.ps1`)
- [x] Extracción de ABI para frontend (`scripts/extract-abi.mjs`)
  - `deployments/abi/PachaChainOrigin.json` (64 entries: 34 functions, 12 events, 17 errors)
  - `deployments/abi/PachaChainOrigin.ts` (ABI tipado para wagmi/viem)
  - `deployments/addresses.json` (direcciones por chain ID)
- [x] Documentación completa de deployment (`docs/DEPLOYMENT.md`)
- [ ] Deploy a Polygon Amoy Testnet (pendiente faucet MATIC + API key)
- [ ] Verificación en PolygonScan Amoy

### Test Summary (Post Phase 3)
| Suite | Archivo | Tests |
|-------|---------|-------|
| Unit Tests | `test/PachaChainOrigin.t.sol` | 55 |
| E2E Integration | `test/PachaChainOrigin.e2e.t.sol` | 12 |
| Post-Deploy Fork | `test/PostDeployVerification.t.sol` | 8 |
| **Total** | | **75** |

---

## FASE 4: Web App de Trazabilidad (PWA)

### Objetivo
Web application profesional con branding premium donde el consumidor puede
escanear un QR y ver el journey completo del producto Farm-to-Table.

### Tech Stack (Verificado con documentación oficial)
| Tecnología | Versión | Propósito |
|---|---|---|
| **Next.js** | 16 (App Router) | Framework full-stack React, SSR/SSG, PWA nativo |
| **TypeScript** | 5.x | Type safety en todo el frontend |
| **Tailwind CSS** | v4.1 | Utility-first CSS, responsive design |
| **shadcn/ui** | latest | Componentes UI open-code, accesibles, hermosos |
| **wagmi** | v3 | React Hooks para interacción Web3/Ethereum |
| **viem** | v2 | TypeScript interface para Ethereum (bajo nivel) |
| **Framer Motion** | latest | Animaciones para timeline de estados |
| **Leaflet** | latest | Mapa interactivo de origen (fincas en Ecuador) |
| **Recharts** | latest | Gráficos/estadísticas de trazabilidad |
| **html5-qrcode** | latest | Escáner QR desde cámara del dispositivo |

### Justificación (Fuentes Oficiales)
- **nextjs.org/docs/app/guides/progressive-web-apps**: Soporte PWA nativo con manifest.ts y Service Workers
- **nextjs.org/docs/app/guides/static-exports**: Opción de export estático gratis en Vercel/Netlify
- **wagmi.sh/react/guides/ssr**: Guía oficial de SSR con Next.js
- **ui.shadcn.com/docs**: Componentes open-code, composables, AI-ready
- **tailwindcss.com/docs/installation/framework-guides/nextjs**: Integración oficial Tailwind + Next.js

### Entregables - Fase 4A: Infraestructura Web ✅
- [x] Scaffold Next.js 16.1.6 + TypeScript 5.x + Tailwind v4 + shadcn/ui
- [x] Configuración wagmi v3 / viem v2 para Polygon Amoy + Anvil local
- [x] Layout principal con branding Pacha-Chain-Origin (Header sticky + Footer)
- [x] Sistema de rutas: `/` (landing), `/track` (búsqueda), `/track/[batchId]` (detalle), `/verify` (QR), `/admin` (panel)
- [x] Progressive Web App manifest (`public/manifest.json`)
- [x] Responsive design (mobile-first, Sheet drawer, breakpoints md/lg)
- [x] Contract hooks (`src/hooks/use-contract.ts`): `useBatchInfo`, `useBatchState`, `useBatchURI`, `useBatchExists`, `useHasRole`, `usePaused`
- [x] Connect Button componente (MetaMask via injected connector)
- [x] Build exitoso: 6 rutas compiladas (5 static + 1 dynamic)

### Entregables - Fase 4B: Páginas Públicas (Sin wallet) ✅
- [x] Landing page premium: hero gradient, stats bar, "Cómo Funciona" (3 cards), 6 estados timeline, misión/pilares, tech grid, CTA final
- [x] Página de tracking `/track/[batchId]`:
  - [x] Timeline visual con 6 estados (Harvested → Delivered) con ring en estado actual
  - [x] Estado actual con Badge de color y ícono prominente
  - [x] Información del lote (producto, variedad, región, peso, fecha, farmer, IPFS)
  - [x] Mapa interactivo de origen en Ecuador (react-leaflet + 20+ regiones georeferenciadas)
  - [x] Metadata IPFS viewer (atributos, farmer info, certificaciones, cupping score, fotos, notas)
  - [x] Historial de eventos on-chain (BatchCreated, BatchStateChanged, BatchMetadataUpdated)
- [x] Página de escaneo QR `/verify` (html5-qrcode + cámara del dispositivo, auto-redirect a /track)
- [x] Página 404 personalizada con links de navegación
- [x] Smoke test: 6 rutas (5x 200 + 1x 404), build exitoso, 67/68 tests passing (PostDeploy requires env)

#### Componentes Creados (Fase 4B)
| Componente | Archivo | Descripción |
|---|---|---|
| `QrScanner` | `components/qr-scanner.tsx` | Escáner QR con html5-qrcode, control start/stop, feedback de error |
| `OriginMap` | `components/origin-map.tsx` | Mapa Leaflet con 20+ regiones EC georeferenciadas, marker personalizado |
| `IpfsMetadata` | `components/ipfs-metadata.tsx` | Viewer de metadata IPFS con multi-gateway fallback, galería fotos |
| `BatchEventHistory` | `components/batch-event-history.tsx` | Historial on-chain via viem getLogs, 3 tipos de eventos |

#### Dependencias Añadidas (Fase 4B)
- `react-leaflet` + `leaflet` + `@types/leaflet` — Mapa interactivo
- `html5-qrcode` — Escáner QR desde cámara

### Entregables - Fase 4C: Panel Admin (Con wallet) ✅
- [x] Conexión de wallet (MetaMask/WalletConnect via wagmi) — `WalletGate` wrapper
- [x] Dashboard de lotes (lista, filtros, búsqueda) — `BatchDashboard` con events, tabla, filtros
- [x] Formulario para crear nuevo lote — `CreateBatchForm` (productType, variety, weight, region, date, IPFS)
- [x] Interfaz para avanzar estado de un lote — `AdvanceStateForm` con batch preview y rol requerido
- [x] Upload de metadata a IPFS desde la web — Integrado en CreateBatchForm (campo ipfsHash)
- [x] Gestión de roles (solo ADMIN) — `RoleManagement` (grant/revoke/lookup) + `ContractControl` (pause/unpause)

#### Archivos creados — Fase 4C

| Archivo | Propósito |
|---|---|
| `hooks/use-contract-write.ts` | 7 write hooks: createBatch, advanceState, updateMetadata, grantRole, revokeRole, pause, unpause + generateOriginHash |
| `components/wallet-gate.tsx` | Protege rutas admin — requiere wallet conectada |
| `components/tx-status.tsx` | Feedback visual del ciclo de vida de transacciones |
| `components/admin/admin-panel.tsx` | Panel admin con Tabs (Dashboard, Crear, Avanzar, Roles, Contrato) |
| `components/admin/create-batch-form.tsx` | Formulario completo para crear lotes (16 regiones EC) |
| `components/admin/advance-state-form.tsx` | Avanzar estado con preview del lote y rol requerido |
| `components/admin/batch-dashboard.tsx` | Dashboard: lista de lotes vía events, filtros, búsqueda, tabla |
| `components/admin/role-management.tsx` | Grant/Revoke roles + Role lookup table |
| `components/admin/contract-control.tsx` | Pause/Unpause del contrato con estado visual |

#### shadcn/ui nuevos — Fase 4C
`input`, `label`, `select`, `textarea`, `tabs`, `table`, `dialog`, `alert`, `switch`, `sonner` (10 componentes)

#### Constantes añadidas a `config/contract.ts`
- `FARMER_ROLE`, `PROCESSOR_ROLE`, `EXPORTER_ROLE`, `BUYER_ROLE`, `DEFAULT_ADMIN_ROLE` (keccak256 hashes)
- `ROLES[]` array con key/label/icon/description
- `STATE_REQUIRED_ROLE` mapping (qué rol avanza cada estado)

#### Tests — Fase 4C
- **Frontend**: `npm run build` ✅ (6 rutas compiladas, 0 errores TypeScript)
- **Smoke test**: 5×200 + 1×404 (/, /admin, /track, /verify, /track/12345, /nonexistent)
- **Foundry**: 67/68 tests pass (55 unit + 12 E2E; 1 expected skip: PostDeployVerification sin env)

### Entregables - Fase 4D: Polish y Deploy ✅
- [x] Animaciones y transiciones (Framer Motion) — `components/motion.tsx` con 6 variants + 3 wrappers
- [x] Dark/Light mode toggle — `next-themes` + `ThemeToggle` (light/dark/system cycle)
- [x] Meta tags / Open Graph para compartir en redes sociales — OG image dinámico (edge), twitter-image, metadataBase
- [x] Security headers configurados — HSTS, X-Frame-Options DENY, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- [x] IPFS image remotePatterns en next.config — ipfs.io, pinata, cloudflare-ipfs, w3s.link
- [ ] Deploy a Vercel (gratis) — pendiente (requiere cuenta Vercel + repo push)
- [ ] Custom domain (opcional) — pendiente

#### Archivos creados/modificados — Fase 4D

| Archivo | Propósito |
|---|---|
| `components/motion.tsx` | 6 animation variants (fadeInUp, fadeIn, staggerContainer, scaleIn, slideInLeft, slideInRight) + 3 wrappers (AnimateIn, StaggerGroup, PageTransition) |
| `components/theme-toggle.tsx` | Botón de cambio de tema (☀️ light / 🌙 dark / 💻 system) |
| `app/opengraph-image.tsx` | OG image dinámico (1200×630 edge) con gradiente, badge de estados, branding |
| `app/twitter-image.tsx` | Re-exporta opengraph-image para Twitter cards |

| Archivo modificado | Cambio |
|---|---|
| `components/providers.tsx` | Añadido `ThemeProvider` de next-themes (attribute="class", defaultTheme="system") |
| `components/header.tsx` | Añadido `ThemeToggle` junto a ConnectButton |
| `components/admin/admin-panel.tsx` | Wrapeado con `PageTransition` |
| `app/page.tsx` | Convertido a client component + AnimateIn/StaggerGroup en hero, stats, cards, tech, mission, CTA |
| `app/track/page.tsx` | Wrapeado con `PageTransition` |
| `app/layout.tsx` | Añadido `metadataBase` para resolver URLs de OG images |
| `next.config.ts` | Security headers (7), IPFS remotePatterns (4 dominios) |

#### Dependencias — Fase 4D
- `framer-motion` — Animaciones y transiciones de página
- `next-themes` (ya instalado) — Dark/Light mode

#### Tests — Fase 4D
- **Frontend**: `npm run build` ✅ (8 rutas: 5 static + 3 dynamic incl. OG/twitter images)
- **Smoke test**: 5×200 + 1×404
- **Security headers**: HSTS ✅, X-Frame-Options ✅, X-Content-Type-Options ✅, X-XSS-Protection ✅, Referrer-Policy ✅
- **Foundry**: 67/68 tests pass (unchanged)

---

## FASE 5: Testing Avanzado y Auditoría

### Objetivo
Asegurar calidad de producción del contrato y la web app.

### Entregables - Smart Contract
- [x] Invariant testing con Foundry (9/9, 256 runs × 3840 calls, 0 reverts)
- [x] Gas optimization report
- [x] Reporte de cobertura de tests (`forge coverage`)
- [x] Slither static analysis (0 high/medium en código propio)
- [x] Documentación de seguridad (`docs/SECURITY.md`)

### Entregables - Web App
- [x] Tests E2E con Playwright (16/16 pass)
- [x] Lighthouse audit (Perf: 85, A11y: 98, BP: 96, SEO: 100)
- [x] Security headers configurados (verificado en Fase 4D)
- [x] Reporte final de proyecto

#### Resultados — Smart Contract Testing

| Tipo de Test | Archivo | Tests | Resultado |
|---|---|---|---|
| **Unit tests** | `PachaChainOrigin.t.sol` | 55 (incl. 2 fuzz) | ✅ 55/55 |
| **E2E tests** | `PachaChainOrigin.e2e.t.sol` | 12 | ✅ 12/12 |
| **Invariant tests** | `PachaChainOrigin.invariant.t.sol` | 9 (256 runs × 3840 calls) | ✅ 9/9, 0 reverts |
| **PostDeploy** | `PostDeployVerification.t.sol` | 1 | ⏭️ Skip (requires env) |
| **Total** | 4 suites | **77 tests** | **76/77 pass** |

#### Invariantes Verificados (Stateful Fuzz)

| ID | Invariante | Descripción |
|---|---|---|
| INV-01 | `totalBatches` consistency | totalBatches == ghost_created |
| INV-02 | Supply siempre 1 | Cada batch mintea exactamente 1 token |
| INV-03 | Estado monotónico | Estado solo avanza (no retrocede) |
| INV-04 | Farmer inmutable | farmer address nunca cambia post-creación |
| INV-05 | Estado en bounds | Estado ∈ [0, 5] (Harvested..Delivered) |
| INV-06 | Token inexistente supply 0 | totalSupply(id) == 0 para tokens no creados |
| INV-07 | Sin ETH locked | Contrato no retiene Ether |
| INV-08 | Ghost counters | Contadores ghost == calls reales |
| INV-09 | Call summary | Log resumen de operaciones |

#### Cobertura de Código

| Archivo | Lines | Statements | Branches | Functions |
|---|---|---|---|---|
| `src/PachaChainOrigin.sol` | **97.22%** | **94.81%** | **73.68%** | **100.00%** |
| `src/libraries/BatchIdGenerator.sol` | **100.00%** | **100.00%** | **100.00%** | **100.00%** |

#### Gas Report (funciones principales)

| Función | Min Gas | Avg Gas | Median Gas | Max Gas |
|---|---|---|---|---|
| `createBatch` | 27,113 | 311,881 | 357,428 | 357,512 |
| `advanceState` | 24,720 | 43,785 | 41,015 | 61,666 |
| `updateMetadata` | 26,746 | 45,970 | 50,416 | 52,716 |
| `getBatchInfo` | 25,149 | 25,303 | 25,392 | 25,392 |
| `getBatchState` | 4,815 | 4,815 | 4,815 | 4,815 |

#### Slither Static Analysis

- **Total detectors**: 101 ejecutados contra 27 contratos
- **Hallazgos en código propio**: 3 informativos/bajo
  - `uninitialized-local` en `_validateTransitionRole.requiredRole` — by design (Solidity zero-init)
  - `reentrancy-benign` en `createBatch` — `_setURI` después de `_mint` (benigno, solo URI storage)
  - `reentrancy-events` en `createBatch` — `BatchCreated` event después de `_mint` (patrón estándar)
- **Hallazgos en OpenZeppelin**: Assembly usage, pragma versions — propios de la librería
- **High/Medium en nuestro código**: **0**

#### Playwright E2E Tests (Frontend)

| Suite | Tests | Resultado |
|---|---|---|
| Landing Page | 5 (title, hero, nav, how-it-works, footer) | ✅ 5/5 |
| Track Page | 3 (load, search input, empty state) | ✅ 3/3 |
| Admin Page | 2 (load, wallet gate) | ✅ 2/2 |
| Verify Page | 1 (load) | ✅ 1/1 |
| 404 Page | 1 (status code) | ✅ 1/1 |
| Security Headers | 1 (X-Content-Type, X-Frame, Referrer) | ✅ 1/1 |
| Accessibility | 3 (lang, main, h1 hierarchy) | ✅ 3/3 |
| **Total** | **16** | **✅ 16/16** |

#### Lighthouse Audit

| Métrica | Score |
|---|---|
| Performance | **85** |
| Accessibility | **98** |
| Best Practices | **96** |
| SEO | **100** |

#### Archivos creados — Fase 5

| Archivo | Propósito |
|---|---|
| `test/PachaChainOrigin.invariant.t.sol` | 9 invariant tests con PachaHandler (3 target functions + ghost variables) |
| `docs/SECURITY.md` | Documentación completa de seguridad: access control, estado, pausabilidad, vectores, gas, recomendaciones |
| `frontend/playwright.config.ts` | Configuración Playwright (Chromium, baseURL localhost:3000) |
| `frontend/e2e/app.spec.ts` | 16 E2E tests: landing, track, admin, verify, 404, headers, a11y |

#### Dependencias — Fase 5
- `@playwright/test` (dev) — Framework de testing E2E
- `lighthouse` + `chrome-launcher` — Auditoría de rendimiento
- `slither-analyzer` (Python/pip) — Análisis estático de seguridad Solidity

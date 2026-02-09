# 📋 Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.0] — 2025-07-15

### Agregado

#### Smart Contract (`PachaChainOrigin.sol`)
- Contrato ERC-1155 multi-token para trazabilidad de lotes agrícolas
- Sistema de roles con AccessControl: `PRODUCER_ROLE`, `INSPECTOR_ROLE`, `DEFAULT_ADMIN_ROLE`
- Máquina de estados de 6 fases: `Registered → Harvested → Processing → QualityCheck → Certified → InTransit`
- Generación determinista de `batchId` basado en hash (`keccak256`) de productor + timestamp + GTIN
- Metadata URI on-chain por lote (para enlace a IPFS/Pinata)
- Funcionalidad `Pausable` para emergencias (solo admin)
- Validaciones de negocio (transición secuencial, lote existente, roles requeridos)
- Eventos detallados: `BatchRegistered`, `StateAdvanced`, `MetadataUpdated`

#### Frontend
- Aplicación Next.js 16 con App Router y React 19
- Conexión wallet con wagmi 3 + viem 2
- Registro de lotes con formulario validado
- Visualización de estados con timeline interactiva
- Escáner QR para verificación de lotes
- Consulta de metadata IPFS integrada
- Tema claro/oscuro con `next-themes`
- Diseño responsive con Tailwind CSS 4 + shadcn/ui

#### DevSecOps
- Pipeline CI con GitHub Actions (6 jobs paralelos)
- Análisis de secretos con Gitleaks 8.21
- Escaneo de vulnerabilidades con Trivy 0.58
- Análisis estático con Semgrep 1.151
- Linting con ESLint 9 + SonarJS
- Detección de código duplicado con jscpd 4.0

#### Documentación
- `ARCHITECTURE.md` — Arquitectura del sistema
- `DEPLOYMENT.md` — Guía de despliegue
- `GS1-MAPPING.md` — Mapeo de estándares GS1
- `PHASES.md` — Fases del proyecto
- `SECURITY.md` — Política de seguridad
- `CONTRIBUTING.md` — Guía de contribución
- `CODE_OF_CONDUCT.md` — Código de conducta
- `README.md` profesional con diagramas Mermaid

#### Scripts
- `Deploy.s.sol` — Script de despliegue Foundry
- `PostDeploy.s.sol` — Verificación post-despliegue
- `generate-qr.mjs` — Generador de códigos QR
- `upload-metadata.mjs` — Subida de metadata a IPFS
- `validate-metadata.mjs` — Validación contra schema JSON
- `extract-abi.mjs` — Extracción de ABI para frontend

#### Tests
- Tests unitarios con Foundry (76/77 pass)
- Tests de invariantes
- Tests end-to-end de flujo completo
- Tests de verificación post-deploy

---

## [0.1.0] — 2025-06-01

### Agregado
- Estructura inicial del proyecto monorepo
- Configuración base de Foundry
- Estructura de carpetas para frontend Next.js

---

<div align="center">

**[Comparar cambios](https://github.com/KRSNA-BLR/Pacha-Chain-Origin/compare/v0.1.0...v1.0.0)**

</div>

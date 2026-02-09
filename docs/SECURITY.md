# 🔒 SECURITY — PachaChainOrigin

> Auditoría de seguridad interna del smart contract `PachaChainOrigin.sol`
> Fecha: Febrero 2026 | Solidity ^0.8.24 | OpenZeppelin 5.x

---

## 1. Modelo de Control de Acceso

### Roles del Sistema

| Rol | Permisos | Risk Level |
|-----|----------|------------|
| `DEFAULT_ADMIN_ROLE` | Gestionar roles, pausar/despausar contrato, actualizar metadata | **ALTO** — compromiso implica control total |
| `FARMER_ROLE` | Crear lotes (`createBatch`), actualizar metadata | Medio |
| `PROCESSOR_ROLE` | Avanzar estado: Fermented, Dried | Bajo |
| `EXPORTER_ROLE` | Avanzar estado: Packed, Shipped | Bajo |
| `BUYER_ROLE` | Confirmar: Delivered | Bajo |

### Mecanismo
- **OpenZeppelin AccessControl**: roles granulares basados en `bytes32` hash
- Cada rol tiene su `adminRole` (por defecto `DEFAULT_ADMIN_ROLE`)
- `grantRole` y `revokeRole` solo ejecutables por el admin del rol
- Roles son generados con `keccak256("ROLE_NAME")` — patrón estándar OZ

### Mitigaciones
- ✅ Validación `admin != address(0)` en constructor
- ✅ Cada transición de estado valida el rol exacto vía `_validateTransitionRole()`
- ✅ `onlyRole(FARMER_ROLE)` en `createBatch`
- ✅ Solo farmer original o admin puede actualizar metadata (`updateMetadata`)

---

## 2. Máquina de Estados — Seguridad

### Propiedad: Monotónica y Secuencial

```
Harvested(0) → Fermented(1) → Dried(2) → Packed(3) → Shipped(4) → Delivered(5)
```

| Propiedad | Implementación | Verificada |
|-----------|----------------|------------|
| **Unidireccional** | `uint8(newState) == uint8(currentState) + 1` | ✅ Invariant INV-03 |
| **Sin saltos** | Misma validación: solo +1 permitido | ✅ Unit + E2E tests |
| **Sin retroceso** | El operador `+1` solo permite avanzar | ✅ `testRevert_advanceState_shouldRevert_whenGoingBackwards` |
| **Estado terminal** | `Delivered` (5) no puede avanzar más (5+1=6 > max) | ✅ `testRevert_advanceState_shouldRevert_whenAlreadyDelivered` |
| **Inmutabilidad del farmer** | `batch.farmer` nunca se reasigna post-creación | ✅ Invariant INV-04 |

### Permisos por Transición

| Transición | Rol Requerido | Validación |
|------------|---------------|------------|
| → Fermented | PROCESSOR_ROLE | `_validateTransitionRole` |
| → Dried | PROCESSOR_ROLE | `_validateTransitionRole` |
| → Packed | EXPORTER_ROLE | `_validateTransitionRole` |
| → Shipped | EXPORTER_ROLE | `_validateTransitionRole` |
| → Delivered | BUYER_ROLE | `_validateTransitionRole` |

---

## 3. Pausabilidad (Circuit Breaker)

### Funciones Afectadas

| Función | `whenNotPaused` | Read cuando paused |
|---------|------------------|--------------------|
| `createBatch` | ✅ Bloqueada | N/A |
| `advanceState` | ✅ Bloqueada | N/A |
| `updateMetadata` | ✅ Bloqueada | N/A |
| `getBatchInfo` | ❌ No afectada | ✅ Sí |
| `getBatchState` | ❌ No afectada | ✅ Sí |
| `batchExists` | ❌ No afectada | ✅ Sí |
| `totalBatches` | ❌ No afectada | ✅ Sí |
| `uri` | ❌ No afectada | ✅ Sí |

### Mecanismo
- `pause()` — solo `DEFAULT_ADMIN_ROLE`
- `unpause()` — solo `DEFAULT_ADMIN_ROLE`
- Las funciones de lectura permanecen accesibles durante pausa → transparencia
- Test: `test_readFunctions_shouldWorkWhenPaused` ✅

---

## 4. Validación de Entradas

| Función | Validación | Custom Error |
|---------|------------|-------------|
| `constructor` | `admin != address(0)` | `InvalidAddress()` |
| `createBatch` | `weightKg != 0` | `InvalidWeight(weightKg)` |
| `createBatch` | `originHash != bytes32(0)` | `InvalidOriginHash()` |
| `advanceState` | `_batchExists(batchId)` | `BatchDoesNotExist(batchId)` |
| `advanceState` | `newState == currentState + 1` | `InvalidStateTransition(batchId, current, new)` |
| `advanceState` | `msg.sender` tiene rol requerido | `UnauthorizedTransition(batchId, newState, caller)` |
| `updateMetadata` | `_batchExists(batchId)` | `BatchDoesNotExist(batchId)` |
| `updateMetadata` | caller es farmer o admin | `UnauthorizedMetadataUpdate(batchId, caller)` |
| `getBatchURI` | `_batchExists(batchId)` | `BatchDoesNotExist(batchId)` |

### Custom Errors vs require()
- ✅ Usa `custom errors` (Solidity ^0.8.4) — más eficiente en gas que `require(string)`
- ✅ Errores incluyen parámetros contextuales para debugging

---

## 5. Vectores de Ataque Analizados

### 5.1 Reentrancy
- **Riesgo**: Bajo
- **Razón**: No hay llamadas externas a contratos no confiables. `_mint()` de OZ ERC1155 hace callback `onERC1155Received`, pero solo al `msg.sender` (que ya es un EOA verificado via `FARMER_ROLE`)
- **Mitigación adicional**: No hay operaciones de estado después del mint (Checks-Effects-Interactions pattern implícito)

### 5.2 Integer Overflow/Underflow
- **Riesgo**: Ninguno
- **Razón**: Solidity ^0.8.x tiene overflow checks built-in. `_nonce++` y `_totalBatchCount++` son seguros

### 5.3 Front-running
- **Riesgo**: Bajo
- **Razón**: `createBatch` genera IDs determinísticos (basados en sender+timestamp+nonce). Un front-runner no puede predecir el ID exacto ni tiene el rol para crear batches
- **Impacto**: Si un farmer es front-run por otro farmer, ambas transacciones crean batches independientes — sin colisión

### 5.4 Denial of Service (DoS)
- **Riesgo**: Bajo
- **Razón**: No hay loops sobre arrays dinámicos. Cada operación es O(1). No hay funciones que iteren sobre todos los batches
- **Gas limit**: Cada función tiene gas acotado (~350K max para `createBatch`)

### 5.5 Access Control Escalation
- **Riesgo**: Medio si admin key es comprometida
- **Mitigación**: Admin key debería ser un multisig en producción
- **Recomendación**: Implementar `TimelockController` de OZ para operaciones críticas

### 5.6 Storage Collision
- **Riesgo**: Ninguno (no es upgradeable)
- **Razón**: No usa proxy pattern. Si se quisiera upgradeabilidad, requiere OZ `ERC1155Upgradeable` + UUPS pattern

### 5.7 URI/IPFS Manipulation
- **Riesgo**: Bajo
- **Razón**: Solo farmer original o admin puede actualizar `ipfsHash`
- **Nota**: El contenido IPFS referenciado es inmutable (content-addressed), pero el *puntero* (ipfsHash) sí puede cambiar si se llama `updateMetadata`

---

## 6. Análisis de Gas

| Función | Min Gas | Avg Gas | Median Gas | Max Gas |
|---------|---------|---------|------------|---------|
| `createBatch` | 27,113 | 311,881 | 357,428 | 357,512 |
| `advanceState` | 24,720 | 43,785 | 41,015 | 61,666 |
| `updateMetadata` | 26,746 | 45,970 | 50,416 | 52,716 |
| `getBatchInfo` | 25,149 | 25,303 | 25,392 | 25,392 |
| `getBatchState` | 4,815 | 4,815 | 4,815 | 4,815 |
| `pause` | 23,764 | 43,185 | 47,070 | 47,070 |
| `unpause` | 25,147 | 25,147 | 25,147 | 25,147 |

**Benchmark E2E** (test dedicado):
- `createBatch`: ~347,603 gas
- `advanceState`: ~32,247 gas
- `updateMetadata`: ~11,594 gas
- `getBatchInfo`: ~11,763 gas (view, no gas real)
- `uri()`: ~4,299 gas (view)

### Optimización
- ✅ Storage packing: `BatchInfo` struct empaqueta campos eficientemente
- ✅ `calldata` para strings (no `memory`) en funciones externas
- ✅ Custom errors en lugar de `require(string)`
- ✅ Mint amount = 1 (mínimo posible)

---

## 7. Cobertura de Tests

| Archivo | Lines | Statements | Branches | Functions |
|---------|-------|------------|----------|-----------|
| `src/PachaChainOrigin.sol` | **97.22%** (70/72) | **94.81%** (73/77) | **73.68%** (14/19) | **100.00%** (16/16) |
| `src/libraries/BatchIdGenerator.sol` | **100.00%** (2/2) | **100.00%** (1/1) | **100.00%** (0/0) | **100.00%** (1/1) |

### Test Suite Completo

| Tipo | Archivo | Tests | Status |
|------|---------|-------|--------|
| Unit | `PachaChainOrigin.t.sol` | 55 (incl. 2 fuzz) | ✅ 55/55 |
| E2E | `PachaChainOrigin.e2e.t.sol` | 12 | ✅ 12/12 |
| Invariant | `PachaChainOrigin.invariant.t.sol` | 9 (256 runs × 3840 calls) | ✅ 9/9 |
| PostDeploy | `PostDeployVerification.t.sol` | 1 | ⏭️ Skip (requires env) |
| **Total** | | **77** | **76/77 pass** |

### Invariantes Verificados
1. **INV-01** `totalBatches` == handler.ghost_created
2. **INV-02** Supply de cada batch siempre es 1
3. **INV-03** Estado solo avanza (monotónico)
4. **INV-04** Farmer address es inmutable
5. **INV-05** Estado ∈ [0, 5] (Harvested..Delivered)
6. **INV-06** Token no-existente tiene supply 0
7. **INV-07** Contrato no retiene ETH
8. **INV-08** Ghost counters = calls reales
9. **INV-09** Summary log de calls

---

## 8. Dependencias y Supply Chain

| Dependencia | Versión | Riesgo | Auditoría |
|-------------|---------|--------|-----------|
| OpenZeppelin Contracts | 5.x | ✅ Bajo | Auditado por múltiples firmas |
| Solidity Compiler | 0.8.24 | ✅ Bajo | Compiler estable |
| Foundry | v1.6.0-nightly | ⚠️ Nightly | Solo tooling, no afecta deploy |

---

## 9. Recomendaciones para Producción

### Críticas
1. **Admin Multisig**: Usar Safe (ex-Gnosis Safe) como admin en mainnet
2. **Timelock**: Agregar `TimelockController` para operaciones admin (delay 24-48h)
3. **Monitoring**: Integrar Tenderly o OpenZeppelin Defender para alertas on-chain
4. **Bug Bounty**: Establecer programa de bug bounty antes de launch

### Recomendadas
5. **Rate Limiting**: Considerar cooldown entre `createBatch` por wallet para evitar spam
6. **Event Indexing**: Indexar todos los eventos con The Graph para queries eficientes
7. **Backup Admin**: Asignar 2+ admin wallets para redundancia
8. **Auditoría Externa**: Solicitar auditoría de firma especializada (Trail of Bits, OpenZeppelin, etc.)

### Opcionales
9. **Upgradeability**: Si se requiere, migrar a UUPS proxy pattern
10. **Batch Operations**: Agregar `createBatchBulk()` para múltiples lotes en una tx

---

## 10. Headers de Seguridad — Frontend (Next.js)

| Header | Valor | Propósito |
|--------|-------|-----------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HSTS — forzar HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevenir MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevenir clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Filtro XSS del navegador |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limitar referrer leaks |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restringir APIs del browser |
| `X-DNS-Prefetch-Control` | `on` | Optimización DNS |

Configurados en `next.config.ts` → verificados con smoke test ✅

---

*Documento generado como parte de la Fase 5: Testing Avanzado y Auditoría*

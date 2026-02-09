# Arquitectura Detallada - Pacha-Chain-Origin

## 1. Visión General del Sistema

### 1.1 Problema que Resuelve

La cadena de suministro del cacao y café premium ecuatoriano enfrenta:
- **Fraude de origen**: Producto de baja calidad vendido como "premium ecuatoriano"
- **Falta de transparencia**: El consumidor no puede verificar el origen real
- **Intermediarios opacos**: Cada actor añade opacidad a la cadena
- **Pérdida de valor**: Los productores no capturan el valor de su trabajo

### 1.2 Solución Blockchain

Un registro inmutable donde cada actor de la cadena **firma criptográficamente**
la transición de estado del lote, creando una pista de auditoría verificable
desde la cosecha hasta el consumidor final.

---

## 2. Actores del Sistema (Roles)

### Basado en GS1 Supply Chain Roles (Sección 2.3)

| Rol | Actor Real | Wallet | Permisos |
|---|---|---|---|
| `DEFAULT_ADMIN_ROLE` | Administrador del sistema | Multisig/DAO | Gestionar roles, pausar contrato |
| `FARMER_ROLE` | Productor/Agricultor | Wallet del productor | Crear lotes (`Harvested`) |
| `PROCESSOR_ROLE` | Centro de Acopio/Cooperativa | Wallet del centro | Transicionar a `Fermented`, `Dried` |
| `EXPORTER_ROLE` | Exportador | Wallet del exportador | Transicionar a `Packed`, `Shipped` |
| `BUYER_ROLE` | Comprador Final (importador) | Wallet del comprador | Confirmar `Delivered` |

### Principio GS1: "One Step Up, One Step Down"
Cada actor solo puede:
1. **Recibir** el lote del actor inmediatamente anterior
2. **Registrar** su operación sobre el lote
3. **Transferir** el lote al actor inmediatamente siguiente

---

## 3. Máquina de Estados (State Machine)

### 3.1 Estados del Lote

```solidity
enum BatchState {
    Harvested,    // 0 - Cosechado por el Farmer
    Fermented,    // 1 - Fermentado en Centro de Acopio
    Dried,        // 2 - Secado en Centro de Acopio
    Packed,       // 3 - Empacado por el Exportador
    Shipped,      // 4 - Enviado por el Exportador
    Delivered     // 5 - Recibido por el Comprador Final
}
```

### 3.2 Transiciones Válidas

```
Estado Actual  → Estado Siguiente   │ Quién puede ejecutar
─────────────────────────────────────┼──────────────────────
(nuevo lote)   → Harvested          │ FARMER_ROLE
Harvested      → Fermented          │ PROCESSOR_ROLE
Fermented      → Dried              │ PROCESSOR_ROLE
Dried          → Packed             │ EXPORTER_ROLE
Packed         → Shipped            │ EXPORTER_ROLE
Shipped        → Delivered          │ BUYER_ROLE
```

### 3.3 Reglas de la Máquina de Estados

1. **Unidireccional**: Un lote solo avanza, nunca retrocede
2. **Secuencial**: No se puede saltar estados
3. **Permisionada**: Solo el rol autorizado puede ejecutar la transición
4. **Inmutable**: Una vez registrada, la transición no se puede deshacer
5. **Auditable**: Cada transición emite un evento con timestamp y firmante

---

## 4. Estructura de Datos On-Chain

### 4.1 BatchInfo Struct

Basado en los Key Data Elements (KDE) de GS1:

```solidity
struct BatchInfo {
    // WHO - Quién
    address farmer;              // Wallet del productor original

    // WHAT - Qué
    ProductType productType;     // Cacao o Café
    string variety;              // Variedad: "Nacional", "CCN-51", "Arábica", etc.
    uint256 weightKg;            // Peso en kilogramos (multiplicado x100 para 2 decimales)

    // WHERE - Dónde
    bytes32 originHash;          // keccak256(latitud, longitud, nombre_finca)
    string region;               // Provincia/Cantón de Ecuador

    // WHEN - Cuándo
    uint256 harvestDate;         // Timestamp de cosecha
    uint256 lastUpdate;          // Timestamp de última actualización

    // Estado actual
    BatchState currentState;     // Estado en la máquina de estados

    // Metadata off-chain
    string ipfsHash;             // CID de IPFS con metadata extendida
}
```

### 4.2 Mapeo GS1 KDE → Struct

| GS1 KDE | Campo On-Chain | Tipo | Razón |
|---|---|---|---|
| GTIN + Batch/Lot | `batchId` (tokenId) | uint256 | Identificador único del lote |
| GLN de party (WHO) | `farmer` | address | Criptográficamente vinculado |
| Product Description | `productType` + `variety` | enum + string | Identificación del producto |
| Net Weight | `weightKg` | uint256 | Peso verificable on-chain |
| GLN of location (WHERE) | `originHash` | bytes32 | Hash de coordenadas GPS |
| Date/Time of CTE (WHEN) | `harvestDate`, `lastUpdate` | uint256 | Timestamps inmutables |
| Business Process (WHY) | `currentState` | enum | El CTE que ocurrió |
| Extended Metadata | `ipfsHash` | string | Fotos, certificaciones, etc. |

### 4.3 ¿Por qué on-chain vs off-chain?

| Dato | Almacenamiento | Razón |
|---|---|---|
| Estado del lote | **On-chain** | Crítico para trazabilidad, debe ser inmutable |
| Farmer address | **On-chain** | Vinculación criptográfica con el productor |
| Peso | **On-chain** | Verificable, disputas de peso comunes |
| Coordenadas exactas | **Off-chain (IPFS)** | Privacidad del productor |
| Fotos del producto | **Off-chain (IPFS)** | Demasiado costoso on-chain |
| Certificaciones | **Off-chain (IPFS)** | Documentos PDF/imágenes |
| Perfil de sabor | **Off-chain (IPFS)** | Dato complementario |

---

## 5. ¿Por qué ERC-1155?

### Comparación de Estándares

| Característica | ERC-721 (NFT) | ERC-1155 (Multi-Token) | Elegido |
|---|---|---|---|
| Un token por lote | ✅ | ✅ | |
| Batch mint (múltiples lotes en 1 TX) | ❌ | ✅ | ✅ |
| Gas por mint | ~120k | ~50k | ✅ ERC-1155 |
| Transferencia batch | ❌ | ✅ | ✅ |
| Semi-fungible (subdivisión) | ❌ | ✅ | ✅ |
| URI por token | Extension | Built-in | ✅ |

### Justificación clave:
- Un productor puede cosechar 50 lotes en un día → `_mintBatch` ahorra 60%+ gas
- Un exportador puede enviar múltiples lotes → `safeBatchTransferFrom`
- ERC-1155 es el estándar recomendado para Supply Chain por su eficiencia

---

## 6. Eventos (Audit Trail)

### Basados en GS1 Critical Tracking Events (CTE)

```solidity
// Cuando se crea un nuevo lote
event BatchCreated(
    uint256 indexed batchId,
    address indexed farmer,
    ProductType productType,
    uint256 weightKg,
    uint256 timestamp
);

// Cuando un lote cambia de estado (CTE principal)
event BatchStateChanged(
    uint256 indexed batchId,
    BatchState indexed previousState,
    BatchState indexed newState,
    address actor,
    uint256 timestamp,
    string notes
);

// Cuando se actualiza la metadata IPFS
event BatchMetadataUpdated(
    uint256 indexed batchId,
    string ipfsHash
);
```

---

## 7. Seguridad

### Patrones Implementados

1. **AccessControl (OpenZeppelin)**: Roles granulares, no `onlyOwner`
2. **Pausable**: Interrupción de emergencia ante vulnerabilidades
3. **ReentrancyGuard**: Protección contra ataques de re-entrada
4. **State Machine Pattern**: Transiciones válidas forzadas por código
5. **Input Validation**: Validación de todos los parámetros de entrada
6. **Event Emission**: Log de todas las acciones para auditoría off-chain

### Consideraciones de Gas
- `weightKg` usa uint256 x100 en vez de decimales (evita floating point)
- `originHash` usa bytes32 en vez de string para coordenadas (32 bytes vs variable)
- `variety` y `region` como string por flexibilidad (no se acceden frecuentemente)

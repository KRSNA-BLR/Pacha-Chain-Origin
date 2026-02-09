# Mapeo GS1 Global Traceability Standard → Blockchain

## Referencia: GS1 Fresh Fruit & Vegetable Traceability Guideline v2.0

Este documento mapea los conceptos del estándar GS1 GTS2 a la implementación
blockchain de Pacha-Chain-Origin.

---

## 1. Identificadores GS1

### GTIN (Global Trade Item Number) → Token ID (ERC-1155)

En GS1, el GTIN identifica un tipo de producto. En nuestra implementación:

```
Token ID (batchId) = Identificador único del lote
Construido como: keccak256(producerAddress, timestamp, nonce)
```

**Diferencia clave**: En GS1 el GTIN identifica el *tipo* de producto y el batch/lot
identifica la *instancia*. En blockchain, el tokenId ERC-1155 combina ambos conceptos
ya que cada lote es un token único.

### GLN (Global Location Number) → originHash (bytes32)

En GS1, el GLN identifica ubicaciones físicas (fincas, bodegas, puertos).

```solidity
originHash = keccak256(abi.encodePacked(latitude, longitude, farmName))
```

Ventajas:
- Privacidad: Los datos reales están en IPFS, solo el hash on-chain
- Verificabilidad: Cualquiera puede verificar recalculando el hash
- Costo: 32 bytes fijos en vez de strings variables

### SSCC (Serial Shipping Container Code) → Evento `Shipped`

El SSCC identifica unidades logísticas. En blockchain:
- Se registra como dato en el evento `BatchStateChanged` al pasar a `Shipped`
- Los detalles del contenedor van en IPFS metadata

---

## 2. Key Data Elements (KDE)

### WHO (Quién)

| GS1 KDE | Blockchain | Tipo |
|---|---|---|
| GLN of party | `msg.sender` (address) | Criptográfico |
| Party name | Off-chain (IPFS) | String |
| Tax number | Off-chain (IPFS) | String |

La ventaja blockchain: **WHO es verificado criptográficamente** por la firma
de la transacción. No se puede falsificar.

### WHAT (Qué)

| GS1 KDE | Blockchain | Tipo |
|---|---|---|
| GTIN | `batchId` (tokenId) | uint256 |
| Batch/lot number | Incluido en `batchId` | uint256 |
| Quantity | `balanceOf(address, batchId)` | uint256 |
| Net weight | `weightKg` en BatchInfo | uint256 |
| Product description | `productType` + `variety` | enum + string |

### WHERE (Dónde)

| GS1 KDE | Blockchain | Tipo |
|---|---|---|
| GLN of physical location | `originHash` | bytes32 |
| Name and address | Off-chain (IPFS) | String |
| GPS coordinates | Off-chain (IPFS) | String |
| Region | `region` en BatchInfo | string |

### WHEN (Cuándo)

| GS1 KDE | Blockchain | Tipo |
|---|---|---|
| Date/time of CTE | `block.timestamp` | uint256 |
| Harvest date | `harvestDate` | uint256 |
| Last update | `lastUpdate` | uint256 |

Ventaja blockchain: **WHEN es garantizado por el protocolo** (timestamp del bloque).
No se puede antedatar.

### WHY (Por qué)

| GS1 KDE | Blockchain | Tipo |
|---|---|---|
| Business process | `currentState` (enum) | uint8 |
| Disposition | Derivado del estado | - |
| Notes | Parámetro `notes` en transición | string |

---

## 3. Critical Tracking Events (CTE)

### Mapeo CTE → Funciones del Contrato

| GS1 CTE | Función Solidity | Evento Emitido |
|---|---|---|
| Beginning of life | `createBatch()` | `BatchCreated` |
| Transformation (fermentation) | `advanceState(batchId, Fermented)` | `BatchStateChanged` |
| Transformation (drying) | `advanceState(batchId, Dried)` | `BatchStateChanged` |
| Transformation (packing) | `advanceState(batchId, Packed)` | `BatchStateChanged` |
| Shipping | `advanceState(batchId, Shipped)` | `BatchStateChanged` |
| Receiving | `advanceState(batchId, Delivered)` | `BatchStateChanged` |

### Ventaja sobre GS1 tradicional

En GS1 tradicional, los CTE se almacenan en sistemas EPCIS centralizados.
En blockchain:
- **Inmutabilidad**: Una vez registrado, no se puede alterar
- **Descentralización**: No hay un punto central de fallo
- **Verificabilidad pública**: Cualquiera puede auditar la cadena
- **Firma criptográfica**: Cada actor firma con su wallet

---

## 4. Metadata IPFS (Fase 2)

### Estructura JSON basada en GS1 EPCIS

```json
{
  "name": "Lote Cacao Nacional - Esmeraldas #2026-001",
  "description": "Cacao fino de aroma, variedad Nacional, finca La Aurora",
  "image": "ipfs://Qm.../foto-lote.jpg",
  "properties": {
    "gs1": {
      "gtin": "7861234567890",
      "batchLot": "2026-ESM-001",
      "sscc": ""
    },
    "product": {
      "type": "Cacao",
      "variety": "Nacional Fino de Aroma",
      "grade": "ASS (Arriba Superior Summer)",
      "certification": ["Rainforest Alliance", "UTZ"]
    },
    "origin": {
      "country": "Ecuador",
      "province": "Esmeraldas",
      "canton": "Quinindé",
      "farm": "Finca La Aurora",
      "coordinates": {
        "latitude": "0.3167",
        "longitude": "-79.4500"
      },
      "altitude": "150m"
    },
    "harvest": {
      "date": "2026-01-15",
      "method": "Manual selective picking",
      "crew": "Equipo Aurora-A"
    },
    "processing": {
      "fermentationDays": 6,
      "fermentationType": "Cajón de madera",
      "dryingMethod": "Solar, camas elevadas",
      "dryingDays": 8,
      "humidity": "7%",
      "temperature": "28°C avg"
    },
    "quality": {
      "flavorProfile": ["Floral", "Frutal", "Nuez"],
      "cuppingScore": 87,
      "defects": "0%"
    },
    "documents": {
      "fitosanitaryCert": "ipfs://Qm.../cert-fito.pdf",
      "originCert": "ipfs://Qm.../cert-origen.pdf",
      "labAnalysis": "ipfs://Qm.../lab-analysis.pdf"
    }
  }
}
```

# Pacha-Chain-Origin — Guía de Deployment

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Deploy Local (Anvil)](#deploy-local-anvil)
3. [Post-Deploy: Grant Roles](#post-deploy-grant-roles)
4. [Post-Deploy: Crear Batch de Prueba](#post-deploy-crear-batch-de-prueba)
5. [Verificación con Fork Test](#verificación-con-fork-test)
6. [Deploy a Polygon Amoy Testnet](#deploy-a-polygon-amoy-testnet)
7. [Cast Helpers (PowerShell)](#cast-helpers-powershell)
8. [Exportar ABI para Frontend](#exportar-abi-para-frontend)
9. [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

```bash
# Foundry instalado
curl -L https://foundry.paradigm.xyz | bash
foundryup

# En Windows PowerShell, asegurar PATH:
$env:Path = "$env:USERPROFILE\.foundry\bin;$env:Path"
$env:FOUNDRY_DISABLE_NIGHTLY_WARNING = "1"

# Compilar
forge build

# Tests (67 unit/E2E + 8 post-deploy = 75 total)
forge test -vvv
```

---

## Deploy Local (Anvil)

### 1. Iniciar Anvil

```powershell
anvil --host 127.0.0.1 --port 8545 --chain-id 31337
```

Anvil provee 10 cuentas con 10,000 ETH cada una. Account #0 se usa como admin/deployer:

| Account | Address | Private Key |
|---------|---------|-------------|
| #0 (Admin) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #1 (Farmer) | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| #2 (Processor) | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| #3 (Exporter) | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| #4 (Buyer) | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

### 2. Deploy

```powershell
$env:PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

forge script script/Deploy.s.sol:DeployPachaChainOrigin `
  --rpc-url http://127.0.0.1:8545 `
  --broadcast -vvvv
```

**Output esperado:**
```
PachaChainOrigin deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Deployment verified successfully!
ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
```

### 3. Setear variable de entorno

```powershell
$env:CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
```

---

## Post-Deploy: Grant Roles

```powershell
$env:PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
$env:CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

forge script script/PostDeploy.s.sol:GrantRoles `
  --rpc-url http://127.0.0.1:8545 `
  --broadcast --slow
```

Esto otorga los 4 roles operativos (FARMER, PROCESSOR, EXPORTER, BUYER) al admin para pruebas.

---

## Post-Deploy: Crear Batch de Prueba

```powershell
forge script script/PostDeploy.s.sol:CreateTestBatch `
  --rpc-url http://127.0.0.1:8545 `
  --broadcast
```

---

## Verificación con Fork Test

La suite de verificación más completa: **8 tests que corren contra el contrato desplegado**:

```powershell
$env:CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

forge test --match-contract PostDeployVerification `
  --fork-url http://127.0.0.1:8545 -vvv
```

### Tests incluidos:

| Test | Descripción |
|------|-------------|
| PDV-01 | Integridad del deployment (admin role, roles únicos) |
| PDV-02 | Flujo completo cacao: 6 estados + metadata + URI |
| PDV-03 | Flujo completo café: 6 estados + metadata + URI |
| PDV-04 | Flujo multi-actor (farmer→processor→exporter→buyer) |
| PDV-05 | Pause/unpause en contrato desplegado |
| PDV-06 | Emisión de eventos BatchCreated |
| PDV-07 | Consistencia del contador de batches |
| PDV-08 | ERC-1155 compliance (supportsInterface) |

---

## Deploy a Polygon Amoy Testnet

### Prerrequisitos

1. **Obtener MATIC testnet**: [Polygon Faucet](https://faucet.polygon.technology/)
2. **API Key de PolygonScan**: [amoy.polygonscan.com/myapikey](https://amoy.polygonscan.com/myapikey)
3. **Configurar `.env`**:

```env
PRIVATE_KEY=<tu_private_key_sin_0x>
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGONSCAN_API_KEY=<tu_api_key>
```

### Deploy + Verify

```bash
source .env

forge script script/Deploy.s.sol:DeployPachaChainOrigin \
  --rpc-url $POLYGON_AMOY_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

### Post-Deploy en Amoy

```bash
export CONTRACT_ADDRESS=<dirección_desplegada>

# Grant roles
forge script script/PostDeploy.s.sol:GrantRoles \
  --rpc-url $POLYGON_AMOY_RPC_URL \
  --broadcast --slow

# Fork test de verificación
forge test --match-contract PostDeployVerification \
  --fork-url $POLYGON_AMOY_RPC_URL -vvv
```

### Actualizar addresses.json

Después del deploy, actualizar `deployments/addresses.json` con la dirección real.

---

## Cast Helpers (PowerShell)

```powershell
# Cargar helpers
. .\scripts\cast-helpers.ps1

# Ver estado del contrato
Show-ContractStatus

# Ver hashes de roles
Get-RoleHashes

# Leer datos de un batch
Get-BatchInfo -BatchId <id>
Get-BatchState -BatchId <id>
Get-BatchURI -BatchId <id>

# Crear batch
New-Batch -ProductType 0 -Variety "Nacional" -WeightKg 15050 `
  -GpsHash "0x..." -Region "Esmeraldas" -HarvestDate 1738368000 `
  -IpfsHash "QmHash123"

# Avanzar estado (1=Fermented, 2=Dried, 3=Packed, 4=Shipped, 5=Delivered)
Set-BatchState -BatchId <id> -NewState 1 -Notes "Fermentacion completada"
```

---

## Exportar ABI para Frontend

```bash
node scripts/extract-abi.mjs
```

Genera:
- `deployments/abi/PachaChainOrigin.json` — ABI JSON puro (64 entries)
- `deployments/abi/PachaChainOrigin.ts` — ABI tipado para wagmi/viem
- `deployments/addresses.json` — Direcciones por chain ID

---

## Troubleshooting

### `anvil` o `cast` no encontrado

```powershell
$env:Path = "$env:USERPROFILE\.foundry\bin;$env:Path"
```

### Warnings de Foundry rompen JSON output

```powershell
$env:FOUNDRY_DISABLE_NIGHTLY_WARNING = "1"
# O redirigir stderr:
cast call ... 2>$null
```

### `createBatch` en script broadcast falla con `InvalidBatchState`

El `batchId` depende de `block.timestamp` que difiere entre simulación y broadcast. Solución:
- Usar scripts **separados** (`GrantRoles` + `CreateTestBatch`) en vez de un monolítico
- O usar **fork tests** (`PostDeployVerification`) que corren en simulación pura

### Gas insuficiente en Amoy

Obtener MATIC gratis del [Polygon Faucet](https://faucet.polygon.technology/).

---

## Resumen de Test Suites

| Suite | Archivo | Tests | Tipo |
|-------|---------|-------|------|
| Unit Tests | `test/PachaChainOrigin.t.sol` | 55 | Unit |
| E2E Tests | `test/PachaChainOrigin.e2e.t.sol` | 12 | Integration |
| Post-Deploy | `test/PostDeployVerification.t.sol` | 8 | Fork/Live |
| **Total** | | **75** | |

```bash
# Correr todos
forge test -vvv

# Correr solo unit + E2E (sin fork)
forge test --no-match-contract PostDeployVerification -vvv

# Correr solo post-deploy (requiere fork)
CONTRACT_ADDRESS=0x... forge test --match-contract PostDeployVerification --fork-url http://127.0.0.1:8545 -vvv
```

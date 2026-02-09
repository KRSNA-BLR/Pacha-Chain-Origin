#!/usr/bin/env pwsh
# ============================================================
# Pacha-Chain-Origin — Setup completo (Windows)
# Uso: .\setup.ps1
# ============================================================
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "`n🌱 Pacha-Chain-Origin — Setup" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor DarkGray

# 1. Git submodules (Foundry libraries)
Write-Host "`n📦 [1/4] Inicializando git submodules..." -ForegroundColor Cyan
git submodule update --init --recursive
if ($LASTEXITCODE -ne 0) { Write-Error "Git submodules fallaron"; exit 1 }
Write-Host "  ✓ forge-std + openzeppelin-contracts listos" -ForegroundColor Green

# 2. Root scripts dependencies (optional, light)
if (Test-Path "package.json") {
  Write-Host "`n📦 [2/4] Instalando scripts auxiliares (raíz)..." -ForegroundColor Cyan
  npm install --no-package-lock 2>&1 | Out-Null
  Write-Host "  ✓ Scripts auxiliares listos" -ForegroundColor Green
}

# 3. Frontend dependencies
Write-Host "`n📦 [3/4] Instalando dependencias del frontend..." -ForegroundColor Cyan
Push-Location frontend
npm ci
if ($LASTEXITCODE -ne 0) { Write-Error "npm ci falló en frontend/"; Pop-Location; exit 1 }
Pop-Location
Write-Host "  ✓ Frontend dependencies listos" -ForegroundColor Green

# 4. Verify
Write-Host "`n🔍 [4/4] Verificando instalación..." -ForegroundColor Cyan

$checks = @(
  @{ Name = "forge";       Test = { forge --version 2>&1 | Out-Null; $LASTEXITCODE -eq 0 } },
  @{ Name = "next";        Test = { Test-Path "frontend/node_modules/.bin/next.ps1" } },
  @{ Name = "forge-std";   Test = { Test-Path "lib/forge-std/src/Test.sol" } },
  @{ Name = "openzeppelin"; Test = { Test-Path "lib/openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol" } }
)

$allOk = $true
foreach ($check in $checks) {
  $ok = & $check.Test
  $icon = if ($ok) { "✓" } else { "✗"; $allOk = $false }
  $color = if ($ok) { "Green" } else { "Red" }
  Write-Host "  $icon $($check.Name)" -ForegroundColor $color
}

if ($allOk) {
  Write-Host "`n✅ Setup completo. Comandos útiles:" -ForegroundColor Green
  Write-Host "  forge test                    # Ejecutar tests Solidity" -ForegroundColor DarkGray
  Write-Host "  cd frontend && npm run dev    # Levantar frontend en localhost:3000" -ForegroundColor DarkGray
  Write-Host "  cd frontend && npm run build  # Build de producción" -ForegroundColor DarkGray
} else {
  Write-Host "`n⚠️  Algunos componentes no están listos. Revisa los errores arriba." -ForegroundColor Yellow
  exit 1
}

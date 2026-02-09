#!/usr/bin/env bash
# ============================================================
# Pacha-Chain-Origin — Setup completo (macOS / Linux)
# Uso: chmod +x setup.sh && ./setup.sh
# ============================================================
set -euo pipefail

echo ""
echo "🌱 Pacha-Chain-Origin — Setup"
echo "============================================"

# 1. Git submodules
echo ""
echo "📦 [1/4] Inicializando git submodules..."
git submodule update --init --recursive
echo "  ✓ forge-std + openzeppelin-contracts listos"

# 2. Root dependencies (scripts auxiliares)
if [ -f "package.json" ]; then
  echo ""
  echo "📦 [2/4] Instalando scripts auxiliares (raíz)..."
  npm install --no-package-lock > /dev/null 2>&1
  echo "  ✓ Scripts auxiliares listos"
fi

# 3. Frontend
echo ""
echo "📦 [3/4] Instalando dependencias del frontend..."
cd frontend
npm ci
cd ..
echo "  ✓ Frontend dependencies listos"

# 4. Verify
echo ""
echo "🔍 [4/4] Verificando instalación..."

ok=true
for item in \
  "forge:command -v forge" \
  "next:test -f frontend/node_modules/.bin/next" \
  "forge-std:test -f lib/forge-std/src/Test.sol" \
  "openzeppelin:test -f lib/openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol"
do
  name="${item%%:*}"
  cmd="${item#*:}"
  if eval "$cmd" > /dev/null 2>&1; then
    echo "  ✓ $name"
  else
    echo "  ✗ $name"
    ok=false
  fi
done

echo ""
if [ "$ok" = true ]; then
  echo "✅ Setup completo. Comandos útiles:"
  echo "  forge test                    # Ejecutar tests Solidity"
  echo "  cd frontend && npm run dev    # Levantar frontend en localhost:3000"
  echo "  cd frontend && npm run build  # Build de producción"
else
  echo "⚠️  Algunos componentes no están listos."
  exit 1
fi

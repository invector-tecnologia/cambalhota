#!/bin/bash

# Script para rodar testes desacoplados de banco (100% mocks)
# Apenas o processing_engine.spec.ts é totalmente desacoplado de banco

cd "$(dirname "$0")" || exit 1

echo "Rodando testes desacoplados de banco (ProcessingEngine)..."
echo ""

npm run test 2>&1 | grep -A 200 "ProcessingEngine"

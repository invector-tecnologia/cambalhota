#!/bin/bash
# Script para executar apenas os testes do ProcessingEngine sem dependências de BD

npm run test -- tests/unit/processing_engine.spec.ts 2>&1 | grep -E "^(✔|✖|●|PASSED|FAILED|Tests|ProcessingEngine|Processing)" | head -100

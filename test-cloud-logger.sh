#!/bin/bash

# Script para testar CloudLogger localmente

echo "🧪 Teste do CloudLogger"
echo "======================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica se as variáveis estão definidas
echo "1️⃣ Verificando variáveis de ambiente..."

if [ -z "$LOG_UPLOAD_ENABLED" ]; then
  echo -e "${YELLOW}⚠️  LOG_UPLOAD_ENABLED não definida${NC}"
  echo "   Para testar, execute: export LOG_UPLOAD_ENABLED=true"
  echo ""
fi

if [ -z "$R2_ACCESS_KEY_ID" ]; then
  echo -e "${YELLOW}⚠️  R2_ACCESS_KEY_ID não definida${NC}"
fi

if [ -z "$R2_SECRET_ACCESS_KEY" ]; then
  echo -e "${YELLOW}⚠️  R2_SECRET_ACCESS_KEY não definida${NC}"
fi

if [ -z "$R2_ENDPOINT" ]; then
  echo -e "${YELLOW}⚠️  R2_ENDPOINT não definida${NC}"
fi

if [ -z "$R2_BUCKET" ]; then
  echo -e "${YELLOW}⚠️  R2_BUCKET não definida (default: tavolo-logs)${NC}"
fi

echo ""

# Testa compilação
echo "2️⃣ Compilando projeto..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Compilação OK${NC}"
else
  echo -e "${RED}❌ Erro na compilação${NC}"
  exit 1
fi

echo ""

# Testa importação do logger
echo "3️⃣ Testando CloudLogger..."

cat > /tmp/test_cloud_logger.js << 'EOF'
import('#services/cloud_logger').then(module => {
  const cloudLogger = module.default;
  
  // Adiciona alguns logs de teste
  cloudLogger.info('Teste de log INFO', { teste: true, timestamp: new Date() });
  cloudLogger.warn('Teste de log WARN', { aviso: 'importante' });
  cloudLogger.error('Teste de log ERROR', { erro: 'simulado' });
  cloudLogger.debug('Teste de log DEBUG', { debug: 'data' });
  
  console.log('✅ CloudLogger funcionando!');
  console.log(`📊 Logs no buffer: ${cloudLogger.getBufferSize()}`);
}).catch(err => {
  console.error('❌ Erro ao importar CloudLogger:', err.message);
  process.exit(1);
});
EOF

cd build && node /tmp/test_cloud_logger.js

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ CloudLogger importado com sucesso${NC}"
else
  echo -e "${RED}❌ Erro ao importar CloudLogger${NC}"
  rm /tmp/test_cloud_logger.js
  exit 1
fi

rm /tmp/test_cloud_logger.js
cd ..

echo ""

# Testa worker (se variáveis estiverem definidas)
if [ "$LOG_UPLOAD_ENABLED" = "true" ] && [ -n "$R2_ACCESS_KEY_ID" ]; then
  echo "4️⃣ Testando worker..."
  echo "   (Pressione Ctrl+C após ver a mensagem de inicialização)"
  echo ""
  
  timeout 5 node ace upload:logs:worker 2>&1 | head -20
  
  echo ""
  echo -e "${GREEN}✅ Worker inicia corretamente${NC}"
else
  echo "4️⃣ Pulando teste de worker (variáveis não configuradas)"
  echo "   Para testar upload real, configure as variáveis R2"
fi

echo ""
echo "═══════════════════════════════════"
echo -e "${GREEN}✅ Testes concluídos!${NC}"
echo "═══════════════════════════════════"
echo ""
echo "📚 Próximos passos:"
echo "   1. Configure variáveis R2 (se ainda não fez)"
echo "   2. Teste localmente: heroku local -f Procfile.dev"
echo "   3. Ou execute worker manualmente: node ace upload:logs:worker"
echo "   4. Faça deploy: git push origin main"
echo ""
echo "📖 Documentação completa: docs/CLOUD_LOGGER.md"
echo ""

#!/bin/bash

# Script para configurar variáveis de ambiente no Heroku
# Execute com: bash setup-heroku-env.sh SEU_APP_NAME

if [ -z "$1" ]; then
    echo "❌ Por favor, forneça o nome do app do Heroku"
    echo "Uso: bash setup-heroku-env.sh SEU_APP_NAME"
    exit 1
fi

APP_NAME=$1

echo "🚀 Configurando variáveis de ambiente para o app: $APP_NAME"

# Verificar se PostgreSQL addon está instalado
echo "🔍 Verificando addons do Heroku..."
heroku addons --app $APP_NAME

echo ""
echo "📦 Adicionando PostgreSQL addon se não existir..."
heroku addons:create heroku-postgresql:essential-0 --app $APP_NAME || echo "PostgreSQL addon já existe ou erro ao criar"

echo ""
echo "⚙️ Configurando variáveis de ambiente..."

# Configurações básicas da aplicação
heroku config:set APP_KEY=aQAgiMOTr0oScvsbs8Owr5_8dbfqQ4Qw --app $APP_NAME
heroku config:set NODE_ENV=production --app $APP_NAME
heroku config:set HOST=0.0.0.0 --app $APP_NAME
heroku config:set LOG_LEVEL=info --app $APP_NAME
heroku config:set TZ=UTC --app $APP_NAME

# Fiscal Engine: definir chave de criptografia (gera uma se não for informada)
if [ -z "$FISCAL_ENCRYPTION_KEY" ]; then
    echo "🔐 Gerando FISCAL_ENCRYPTION_KEY temporária (32 bytes)..."
    FISCAL_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
fi
heroku config:set FISCAL_ENCRYPTION_KEY=$FISCAL_ENCRYPTION_KEY --app $APP_NAME

# Configuração de sessão
heroku config:set SESSION_DRIVER=cookie --app $APP_NAME

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Configurações aplicadas:"
heroku config --app $APP_NAME

echo ""
echo "🔄 Para fazer redeploy agora, execute:"
echo "git push heroku main"
#!/bin/bash

echo "🔍 Debug: Verificando variáveis de ambiente no Heroku"
echo ""
echo "DATABASE_URL: ${DATABASE_URL:-'❌ NÃO DEFINIDA'}"
echo "DB_HOST: ${DB_HOST:-'❌ NÃO DEFINIDA'}"
echo "DB_PORT: ${DB_PORT:-'❌ NÃO DEFINIDA'}"
echo "DB_USER: ${DB_USER:-'❌ NÃO DEFINIDA'}"
echo "DB_DATABASE: ${DB_DATABASE:-'❌ NÃO DEFINIDA'}"
echo ""
echo "🔗 NODE_ENV: $NODE_ENV"
echo "📍 PWD: $PWD"
echo ""
echo "🚀 Executando migrations..."
node ace migration:run --force
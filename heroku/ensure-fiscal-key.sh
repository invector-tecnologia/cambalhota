#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${1:-}" ]]; then
  echo "Uso: $0 <HEROKU_APP_NAME>" >&2
  exit 1
fi

APP_NAME="$1"

# Se já existir, apenas mostra e sai
EXISTING_KEY=$(heroku config:get FISCAL_ENCRYPTION_KEY -a "$APP_NAME" || true)
if [[ -n "$EXISTING_KEY" ]]; then
  echo "✅ FISCAL_ENCRYPTION_KEY já está definida no app '$APP_NAME'"
  exit 0
fi

# Gera uma nova chave de 32 bytes (hex)
NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "🔐 Definindo FISCAL_ENCRYPTION_KEY no app '$APP_NAME'..."
heroku config:set FISCAL_ENCRYPTION_KEY="$NEW_KEY" -a "$APP_NAME"

echo "✅ Configurada com sucesso. Reinicie o app se necessário:"
echo "   heroku ps:restart -a $APP_NAME"
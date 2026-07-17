#!/usr/bin/env bash
set -e

echo "================================================="
echo " 🚀 Instalando o Cambalhota v1.0 (Migration Engine) "
echo "================================================="

OS="$(uname -s)"
ARCH="$(uname -m)"

echo "Detectando sistema: $OS ($ARCH)"

INSTALL_DIR="/usr/local/bin"
BIN_NAME="cambalhota"

REPO="invector-tecnologia/tai"
DOWNLOAD_URL="https://github.com/$REPO/releases/download/v1.0.0/cambalhota"

echo "Baixando o binário..."
curl -sSL -o "$BIN_NAME" "$DOWNLOAD_URL"

echo "Dando permissão de execução..."
chmod +x "$BIN_NAME"

echo "Instalando em $INSTALL_DIR (pode exigir senha root)..."
sudo mv "$BIN_NAME" "$INSTALL_DIR/"

echo "================================================="
echo " ✅ Instalação concluída com sucesso! "
echo " Execute 'cambalhota' no seu terminal para abrir a TUI."
echo "================================================="

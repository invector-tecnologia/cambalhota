#!/usr/bin/env bash
set -e

echo "================================================="
echo " 🚀 Installing Cambalhota v1.0 (Migration Engine) "
echo "================================================="

OS="$(uname -s)"
ARCH="$(uname -m)"

echo "Detecting system: $OS ($ARCH)"

INSTALL_DIR="/usr/local/bin"
BIN_NAME="cambalhota"

REPO="invector-tecnologia/cambalhota"
DOWNLOAD_URL="https://github.com/$REPO/releases/download/v1.0.0/cambalhota"

echo "Downloading the binary..."
curl -sSL -o "$BIN_NAME" "$DOWNLOAD_URL"

echo "Granting execute permission..."
chmod +x "$BIN_NAME"

echo "Installing to $INSTALL_DIR (may require the root password)..."
sudo mv "$BIN_NAME" "$INSTALL_DIR/"

echo "================================================="
echo " ✅ Installation completed successfully! "
echo " Run 'cambalhota' in your terminal to open the TUI."
echo "================================================="

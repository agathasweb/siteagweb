#!/bin/bash
# Roda o effectcraft-cli com a Poppins disponível (a fonte não está instalada no sistema).
# Binário: usa EC_BIN se existir; senão extrai o AppImage para ~/.cache/effectcraft-cli/ (uma vez) e usa de lá.
AQUI="$(cd "$(dirname "$0")" && pwd)"
APPIMAGE="${EC_APPIMAGE:-/home/gutto/Aplicativos/CraftingApps/effectcraft-0.9.2-linux-x86_64.AppImage}"
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/effectcraft-cli"
BIN="$EC_BIN"
if [ -z "$BIN" ] || [ ! -x "$BIN" ]; then
  BIN="$CACHE/squashfs-root/usr/bin/effectcraft-cli"
  if [ ! -x "$BIN" ]; then
    [ -f "$APPIMAGE" ] || { echo "ec.sh: AppImage não encontrado em $APPIMAGE (defina EC_BIN ou EC_APPIMAGE)" >&2; exit 1; }
    mkdir -p "$CACHE" && (cd "$CACHE" && "$APPIMAGE" --appimage-extract >/dev/null) || { echo "ec.sh: falha ao extrair o AppImage" >&2; exit 1; }
  fi
fi
FONTCONFIG_FILE="$AQUI/fonts.conf" exec "$BIN" "$@"

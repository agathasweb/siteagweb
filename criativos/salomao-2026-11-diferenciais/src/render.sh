#!/usr/bin/env bash
# Renderiza todos os HTML de src/ em PNG 1080x1350 na pasta acima (mesma estrutura de subpastas).
cd "$(dirname "$0")"
for f in ${@:-*.html */*.html}; do
  out="../${f%.html}.png"; mkdir -p "$(dirname "$out")"
  google-chrome --headless=new --screenshot="$(realpath -m "$out")" --window-size=1080,1350 --hide-scrollbars --virtual-time-budget=4000 "file://$PWD/$f" >/dev/null 2>&1
  echo "$out"
done

#!/bin/bash
# Regera um vídeo (ou todos): roda o script .jsx, renderiza 9x16 e 4x5 e tira a capa.
# uso: ./build.sh            -> todos
#      ./build.sh v10        -> só o V10
AQUI="$(cd "$(dirname "$0")" && pwd)"; SAIDA="$(dirname "$AQUI")"
#        prefixo comp  arquivo                  tempo da capa (s)
LISTA="v10 V10 v10-preco-na-pagina 8.6
v2 V2 v2-adeus-grupo 14.2
v6 V6 v6-app-da-escola 8.2
v7 V7 v7-tudo-num-app 2.3
v4 V4 v4-antes-depois-saida 9.4"
echo "$LISTA" | while read pre comp nome tcapa; do
  [ -n "$1" ] && [ "$1" != "$pre" ] && continue
  echo "== $nome"
  "$AQUI/ec.sh" --empty script "$AQUI/$nome.jsx" || exit 1
  for f in 9x16 4x5; do
    "$AQUI/ec.sh" --project "$AQUI/$nome.ecproj" render --comp "${comp}_$f" --out "$SAIDA/$f/$nome.mp4" --format h264 --bitrate 6000 --audio off | tail -1 || exit 1
  done
  "$AQUI/ec.sh" --project "$AQUI/$nome.ecproj" render-frame --comp "${comp}_9x16" --time "$tcapa" --out "/tmp/claude-1000/-home-gutto-DDEV-yeshua-next/0ce3cb24-08dc-4418-8d08-c540d4f85603/scratchpad/sal/capa-$nome.png" >/dev/null &&
    ffmpeg -loglevel error -y -i "/tmp/claude-1000/-home-gutto-DDEV-yeshua-next/0ce3cb24-08dc-4418-8d08-c540d4f85603/scratchpad/sal/capa-$nome.png" -q:v 3 "$SAIDA/capas/$nome.jpg" && rm -f "/tmp/claude-1000/-home-gutto-DDEV-yeshua-next/0ce3cb24-08dc-4418-8d08-c540d4f85603/scratchpad/sal/capa-$nome.png"
done

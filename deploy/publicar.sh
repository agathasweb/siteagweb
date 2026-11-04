#!/usr/bin/env bash
# Publica o último COMMIT da main em agathas.com.br, agathas.es, agathasweb.com, uk. e oferta.salomao.
# O que não foi commitado não vai. Build no VPS; a cópia de trabalho fica em disco, nunca em /tmp (cota do tmpfs).
set -euo pipefail
cd "$(dirname "$0")/.."
VPS=hostinger-vps; DIR=/home/agweb/agathas; URL=https://agathas.com.br
[ "$(git rev-parse --abbrev-ref HEAD)" = main ] || { echo "✗ Publique a partir da main"; exit 1; }
W="$HOME/.cache/claude-builds/agathas-publicar"; rm -rf "$W"; mkdir -p "$W"; trap 'rm -rf "$W"' EXIT
git archive HEAD | tar -x -C "$W"
ssh "$VPS" "mkdir -p $DIR/.snap && chmod 700 $DIR/.snap"
rsync -az --delete --exclude /.snap --exclude /deploy/.env.runtime -e ssh "$W/" "$VPS:$DIR/"
ssh "$VPS" bash -s <<ENDSSH
set -e
cd $DIR
trap 'rm -f .snap/*' EXIT
# Cópia consistente do banco (WAL) só para o build
rm -f .snap/*
python3 -c "import sqlite3; a=sqlite3.connect('file:/home/agweb/web/agathas.com.br/private/data/agathas.db?mode=ro',uri=True); b=sqlite3.connect('.snap/agathas.db'); a.backup(b); b.close()"
python3 deploy/gerar-env-runtime.py /home/agweb/web/agathas.com.br/private/.env.local deploy/.env.runtime
# O secret e os uploads estão fora da pasta do projeto: libera a leitura pelo buildx
BUILDX_BAKE_ENTITLEMENTS_FS=0 docker compose -f deploy/docker-compose.prod.yml up -d --build --remove-orphans
ENDSSH
for i in $(seq 1 40); do [ "$(ssh "$VPS" "docker inspect -f '{{.State.Health.Status}}' agathas-prod-web")" = healthy ] && break; sleep 3; done
echo "container: $(ssh "$VPS" "docker inspect -f '{{.State.Health.Status}}' agathas-prod-web") | site: $(curl -4 -s -o /dev/null -m 30 -w '%{http_code}' $URL/)"

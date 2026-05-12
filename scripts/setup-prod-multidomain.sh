#!/bin/bash
################################################################################
# Setup Multi-Domain em Producao (HestiaCP + Nginx proxy ao PM2)
#
# Roda uma unica vez para registrar os 3 dominios adicionais no HestiaCP do
# VPS Hostinger, emitir SSL e configurar Nginx para fazer proxy_pass ao
# Next.js (porta 3002) ja em execucao.
#
# Uso:
#   ./scripts/setup-prod-multidomain.sh           # interativo
#   ./scripts/setup-prod-multidomain.sh --yes     # sem confirmacao
#
# Pre-requisitos:
#   - DNS dos 3 dominios apontando para o VPS (76.13.167.20)
#   - Chave SSH ~/.ssh/id_hostinger_vps funcional
#   - deploy.sh ja rodou pelo menos uma vez (PM2 :3002 ativo)
################################################################################

set -e

PROD_USER="root"
PROD_HOST="76.13.167.20"
PROD_PORT="22"
WEB_USER="agweb"
APP_PORT=3002
SSH_KEY="$HOME/.ssh/id_hostinger_vps"
SSH_OPTS="-i $SSH_KEY -o IdentitiesOnly=yes -o PreferredAuthentications=publickey"

DOMAINS=(
    "agathas.es"
    "agathasweb.com"
    "uk.agathasweb.com"
)

AUTO_CONFIRM=false
for arg in "$@"; do
    case $arg in
        -y|--yes) AUTO_CONFIRM=true ;;
    esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()      { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()  { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}   Setup Multi-Domain Producao (HestiaCP + Nginx)        ${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo ""
log "Servidor: $PROD_USER@$PROD_HOST"
log "Dominios a configurar:"
for d in "${DOMAINS[@]}"; do
    echo "  - $d"
done
echo ""
log_warn "Esta acao registra os dominios no HestiaCP, emite SSL e substitui"
log_warn "o nginx.conf de cada um para fazer proxy ao Next.js :$APP_PORT."
echo ""

if [ "$AUTO_CONFIRM" = false ]; then
    read -p "$(echo -e ${YELLOW}Continuar? [s/N]:${NC} )" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log "Cancelado."
        exit 0
    fi
fi

log "Testando SSH..."
ssh -p "$PROD_PORT" $SSH_OPTS "$PROD_USER@$PROD_HOST" "echo 'OK'" > /dev/null 2>&1 \
    || { log_err "SSH falhou"; exit 1; }
log_ok "SSH OK"

DOMAIN_LIST="${DOMAINS[*]}"

ssh -p "$PROD_PORT" $SSH_OPTS "$PROD_USER@$PROD_HOST" bash <<ENDSSH
set -e

WEB_USER="$WEB_USER"
APP_PORT=$APP_PORT
DOMAINS="$DOMAIN_LIST"

for DOMAIN in \$DOMAINS; do
    echo ""
    echo "============================================================"
    echo "  Configurando \$DOMAIN"
    echo "============================================================"

    # 1) Registrar o dominio no HestiaCP (cria /home/\$WEB_USER/web/\$DOMAIN/)
    if [ ! -d "/home/\$WEB_USER/web/\$DOMAIN" ]; then
        echo "-- Adicionando dominio no HestiaCP..."
        v-add-web-domain "\$WEB_USER" "\$DOMAIN" || {
            echo "Falha ao adicionar \$DOMAIN no HestiaCP."
            continue
        }
    else
        echo "-- /home/\$WEB_USER/web/\$DOMAIN ja existe, pulando v-add-web-domain"
    fi

    # 2) Emitir SSL Let's Encrypt
    if [ -f "/home/\$WEB_USER/conf/web/\$DOMAIN/ssl/\$DOMAIN.crt" ]; then
        echo "-- SSL ja emitido para \$DOMAIN"
    else
        echo "-- Emitindo SSL Let's Encrypt..."
        v-add-letsencrypt-domain "\$WEB_USER" "\$DOMAIN" || {
            echo "AVISO: Falha ao emitir SSL para \$DOMAIN (DNS pode nao estar propagado)."
        }
    fi

    # 3) Substituir nginx.conf para fazer proxy_pass ao Next.js :3002
    NGINX_CONF="/home/\$WEB_USER/conf/web/\$DOMAIN/nginx.conf"
    NGINX_SSL_CONF="/home/\$WEB_USER/conf/web/\$DOMAIN/nginx.ssl.conf"

    cat > "\$NGINX_CONF" <<EOF
server {
    listen      80;
    server_name \$DOMAIN www.\$DOMAIN;

    access_log  /var/log/nginx/domains/\$DOMAIN.log combined;
    error_log   /var/log/nginx/domains/\$DOMAIN.error.log error;

    location / {
        proxy_pass         http://127.0.0.1:\$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header   Host              \\\$host;
        proxy_set_header   X-Real-IP         \\\$remote_addr;
        proxy_set_header   X-Forwarded-For   \\\$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \\\$scheme;
        proxy_set_header   Upgrade           \\\$http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 120s;
    }

    location ~* /\\.(git|env) {
        deny all;
        return 404;
    }
}
EOF

    if [ -f "\$NGINX_SSL_CONF" ] || [ -f "/home/\$WEB_USER/conf/web/\$DOMAIN/ssl/\$DOMAIN.crt" ]; then
        cat > "\$NGINX_SSL_CONF" <<EOF
server {
    listen      443 ssl;
    listen      [::]:443 ssl;
    http2 on;
    server_name \$DOMAIN www.\$DOMAIN;

    ssl_certificate     /home/\$WEB_USER/conf/web/\$DOMAIN/ssl/\$DOMAIN.pem;
    ssl_certificate_key /home/\$WEB_USER/conf/web/\$DOMAIN/ssl/\$DOMAIN.key;

    access_log  /var/log/nginx/domains/\$DOMAIN.log combined;
    error_log   /var/log/nginx/domains/\$DOMAIN.error.log error;

    location / {
        proxy_pass         http://127.0.0.1:\$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header   Host              \\\$host;
        proxy_set_header   X-Real-IP         \\\$remote_addr;
        proxy_set_header   X-Forwarded-For   \\\$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \\\$scheme;
        proxy_set_header   Upgrade           \\\$http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 120s;
    }

    location ~* /\\.(git|env) {
        deny all;
        return 404;
    }
}
EOF
        echo "-- nginx.ssl.conf escrito (HTTPS proxy ao :\$APP_PORT)"
    fi

    echo "-- nginx.conf escrito (HTTP proxy ao :\$APP_PORT)"
done

echo ""
echo "============================================================"
echo "  Testando configuracao Nginx e recarregando..."
echo "============================================================"
nginx -t && systemctl reload nginx && echo "Nginx recarregado OK"

echo ""
echo "============================================================"
echo "  Validacao final"
echo "============================================================"
for DOMAIN in \$DOMAINS; do
    CODE=\$(curl -s -o /dev/null -w "%{http_code}" -H "Host: \$DOMAIN" http://localhost/)
    echo "  \$DOMAIN -> HTTP \$CODE"
done

ENDSSH

echo ""
log_ok "Setup multi-domain concluido."
log "Teste cada dominio externamente:"
for d in "${DOMAINS[@]}"; do
    echo "    curl -sI https://$d/ | head -3"
done
echo ""

#!/bin/bash

################################################################################
# AGATHAS SITE - Script de Deploy Automatico v1.0
#
# Autor: Agathas Web
# Descricao: Faz deploy do site institucional Agathas Web (Next.js 16 SSR)
#            para producao no HestiaCP (Hostinger VPS)
#
# Estrutura no servidor:
#   /home/agweb/web/agathas.com.br/
#     private/       -> todo o projeto Next.js (.next, node_modules, etc.)
#     public_html    -> symlink para private/public (assets estaticos)
#
# O Next.js roda via PM2 (modo SSR) na porta 3002, com Nginx fazendo
# proxy reverso para o app Node.
#
# Uso:
#   ./deploy.sh           # Deploy completo com confirmacao
#   ./deploy.sh -y        # Deploy sem confirmacao
#   ./deploy.sh --dry-run # Testar sem fazer upload real
################################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_deploy()  { echo -e "${MAGENTA}[DEPLOY]${NC} $1"; }

echo -e "${GREEN}"
echo "========================================================="
echo "      AGATHAS SITE - Deploy Automatico v1.0             "
echo "      Hostinger VPS (Next.js SSR + PM2)                 "
echo "========================================================="
echo -e "${NC}"

################################################################################
# CONFIGURACOES DO SERVIDOR
################################################################################

PROD_USER="root"
PROD_HOST="76.13.167.20"
PROD_PORT="22"

# Dominio primario (onde o codigo + node_modules ficam)
PROD_DOMAIN="agathas.com.br"
PROD_BASE="/home/agweb/web/$PROD_DOMAIN"
PROD_PRIVATE="$PROD_BASE/private"

# Dominios adicionais (i18n multi-dominio). O Next.js (proxy.ts) le o Host
# header e mapeia para o locale correto. Todos sao server blocks Nginx que
# fazem proxy_pass para o PM2 :3002.
EXTRA_DOMAINS=(
    "agathas.es"
    "agathasweb.com"
    "uk.agathasweb.com"
)

WEB_USER="agweb"
WEB_GROUP="agweb"

LOCAL_PATH="/home/gutto/DDEV/agathas-dev"

LOG_FILE="$LOCAL_PATH/deploy.log"

SSH_KEY="$HOME/.ssh/id_hostinger_vps"
SSH_OPTS="-i $SSH_KEY -o IdentitiesOnly=yes -o PreferredAuthentications=publickey"

APP_PORT=3002
PM2_APP_NAME="agathas-site"

################################################################################
# ARGUMENTOS
################################################################################

AUTO_CONFIRM=false
DRY_RUN=false

for arg in "$@"; do
    case $arg in
        -y|--yes)
            AUTO_CONFIRM=true
            log_info "Modo auto-confirmacao ativado (-y)"
            ;;
        --dry-run)
            DRY_RUN=true
            log_warning "Modo DRY-RUN ativado (nenhum arquivo sera enviado)"
            ;;
        *)
            log_error "Argumento invalido: $arg"
            echo ""
            echo "Uso:"
            echo "  $0              # Deploy com confirmacao"
            echo "  $0 -y           # Deploy sem confirmacao"
            echo "  $0 --dry-run    # Testar sem enviar arquivos"
            exit 1
            ;;
    esac
done

################################################################################
# VALIDACOES
################################################################################

log_info "Iniciando validacoes..."

if [ ! -f "$LOCAL_PATH/package.json" ]; then
    log_error "package.json nao encontrado em $LOCAL_PATH"
    exit 1
fi

if [ ! -f "$LOCAL_PATH/next.config.ts" ] && [ ! -f "$LOCAL_PATH/next.config.js" ]; then
    log_error "next.config.ts/js nao encontrado!"
    exit 1
fi

if [ ! -f "$LOCAL_PATH/ecosystem.config.js" ]; then
    log_error "ecosystem.config.js nao encontrado!"
    exit 1
fi

if [ ! -f "$SSH_KEY" ]; then
    log_error "Chave SSH nao encontrada: $SSH_KEY"
    exit 1
fi

log_info "Testando conexao SSH com o servidor..."
if ! ssh -p "$PROD_PORT" $SSH_OPTS "$PROD_USER@$PROD_HOST" "echo 'OK'" > /dev/null 2>&1; then
    log_error "Falha ao conectar via SSH!"
    log_error "Verifique: ssh -p $PROD_PORT $SSH_OPTS $PROD_USER@$PROD_HOST"
    exit 1
fi

log_success "Conexao SSH OK"
log_success "Validacoes concluidas"

################################################################################
# REGISTRO GIT (commit + tag de rastreabilidade do deploy)
################################################################################

if [ -d "$LOCAL_PATH/.git" ]; then
    cd "$LOCAL_PATH"
    DEPLOY_TAG="prod-$(date +%Y%m%d-%H%M%S)"
    HAS_CHANGES=$(git status --porcelain 2>/dev/null | wc -l)

    echo ""
    if [ "$HAS_CHANGES" -gt 0 ]; then
        log_info "Working tree: $HAS_CHANGES arquivo(s) modificado(s)/nao-trackado(s)"
    else
        log_info "Working tree limpo"
    fi
    log_info "Tag proposta: $DEPLOY_TAG"

    DO_GIT_TAG=false
    if [ "$AUTO_CONFIRM" = true ]; then
        DO_GIT_TAG=true
    else
        read -p "$(echo -e ${YELLOW}Criar commit + tag deste deploy para rastreabilidade? [S/n]:${NC} )" -n 1 -r
        echo
        [[ ! $REPLY =~ ^[Nn]$ ]] && DO_GIT_TAG=true
    fi

    if [ "$DO_GIT_TAG" = true ]; then
        if [ "$HAS_CHANGES" -gt 0 ]; then
            git add -A >/dev/null 2>&1 || true
            git commit -m "deploy: $DEPLOY_TAG" >/dev/null 2>&1 \
                && log_success "Commit do estado do deploy criado" \
                || log_warning "Sem mudancas para commitar"
        fi
        if git tag "$DEPLOY_TAG" 2>/dev/null; then
            log_success "Tag $DEPLOY_TAG criada (rollback: git checkout $DEPLOY_TAG && ./deploy.sh -y)"
        else
            log_warning "Falha ao criar tag (talvez ja exista)"
        fi
    else
        log_warning "Deploy sem registro git (rollback ficara manual)"
    fi
    echo ""
fi


################################################################################
# BUILD LOCAL
################################################################################

log_info "Executando build local (Next.js)..."
cd "$LOCAL_PATH"

if [ ! -d "node_modules" ]; then
    log_info "Instalando dependencias locais..."
    npm install 2>&1 | tail -3
fi

log_info "Executando 'npm run build'..."
npm run build 2>&1 | tail -10
log_success "Build concluido (.next/ gerado)"

################################################################################
# CONFIRMACAO
################################################################################

echo ""
log_warning "Voce esta prestes a fazer deploy para PRODUCAO:"
echo -e "  ${BLUE}Servidor:${NC}  $PROD_USER@$PROD_HOST:$PROD_PORT"
echo -e "  ${BLUE}Destino:${NC}   $PROD_PRIVATE"
echo -e "  ${BLUE}Symlink:${NC}   public_html -> private/public"
echo -e "  ${BLUE}Dominio:${NC}   https://$PROD_DOMAIN"
echo -e "  ${BLUE}App:${NC}       PM2 '$PM2_APP_NAME' (porta $APP_PORT)"
echo -e "  ${BLUE}Origem:${NC}    $LOCAL_PATH"
echo ""

if [ "$AUTO_CONFIRM" = false ]; then
    read -p "$(echo -e ${YELLOW}Deseja continuar? [s/N]:${NC} )" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_warning "Deploy cancelado pelo usuario"
        exit 0
    fi
else
    log_info "Confirmacao automatica - prosseguindo com deploy..."
fi

################################################################################
# UPLOAD VIA RSYNC
################################################################################

START_TIME=$(date +%s)

RSYNC_DRY=""
if [ "$DRY_RUN" = true ]; then
    RSYNC_DRY="-n"
    log_warning "DRY-RUN: Simulando upload..."
fi

log_deploy "Sincronizando projeto -> private/..."
rsync -avz $RSYNC_DRY --progress \
    -e "ssh -p $PROD_PORT $SSH_OPTS" \
    --delete \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='node_modules/' \
    --exclude='.git/' \
    --exclude='.github/' \
    --exclude='.devilbox/' \
    --exclude='.ddev/' \
    --exclude='.claude/' \
    --exclude='.vscode/' \
    --exclude='.idea/' \
    --exclude='data/' \
    --exclude='deploy.sh' \
    --exclude='deploy.log' \
    --exclude='dev.log' \
    --exclude='*.log' \
    --exclude='docs/' \
    --exclude='*.md' \
    --exclude='#SOURCE#/' \
    --exclude='.DS_Store' \
    --exclude='Thumbs.db' \
    --exclude='test-routes.js' \
    "$LOCAL_PATH/" "$PROD_USER@$PROD_HOST:$PROD_PRIVATE/" | tee -a "$LOG_FILE"

log_success "Projeto sincronizado"

################################################################################
# POS-DEPLOY
################################################################################

if [ "$DRY_RUN" = false ]; then
    log_info "Executando comandos pos-deploy no servidor..."

    ssh -p "$PROD_PORT" $SSH_OPTS "$PROD_USER@$PROD_HOST" bash <<ENDSSH
set -e
cd '$PROD_PRIVATE'

echo '-- Verificando symlink public_html -> private/public...'
if [ -L '$PROD_BASE/public_html' ]; then
    CURRENT_TARGET=\$(readlink '$PROD_BASE/public_html')
    if [ "\$CURRENT_TARGET" = '$PROD_PRIVATE/public' ]; then
        echo 'Symlink OK'
    else
        echo "Symlink aponta para \$CURRENT_TARGET, recriando..."
        rm -f '$PROD_BASE/public_html'
        ln -s '$PROD_PRIVATE/public' '$PROD_BASE/public_html'
    fi
elif [ -d '$PROD_BASE/public_html' ]; then
    echo 'AVISO: public_html e um diretorio! Removendo e criando symlink...'
    rm -rf '$PROD_BASE/public_html'
    ln -s '$PROD_PRIVATE/public' '$PROD_BASE/public_html'
else
    echo 'public_html nao existe. Criando symlink...'
    ln -s '$PROD_PRIVATE/public' '$PROD_BASE/public_html'
fi

echo '-- Criando diretorio de logs...'
mkdir -p '$PROD_PRIVATE/logs'

echo '-- Ajustando permissoes...'
find . -type f -exec chmod 644 {} \; 2>/dev/null || true
find . -type d -exec chmod 755 {} \; 2>/dev/null || true

echo '-- Restaurando ownership para $WEB_USER...'
chown -R $WEB_USER:$WEB_GROUP '$PROD_BASE'

echo '-- Instalando dependencias de producao (npm ci)...'
sudo -u $WEB_USER bash -c "cd '$PROD_PRIVATE' && export PATH=\\\$PATH:/usr/local/bin && npm ci --omit=dev --no-audit --no-fund" 2>&1 || {
    echo 'Fallback: npm install...'
    sudo -u $WEB_USER bash -c "cd '$PROD_PRIVATE' && export PATH=\\\$PATH:/usr/local/bin && npm install --omit=dev --no-audit --no-fund" 2>&1
}

echo '-- Verificando PM2...'
which pm2 > /dev/null 2>&1 || {
    echo 'PM2 nao encontrado! Instalando globalmente...'
    npm install -g pm2
}

echo '-- Reiniciando app via PM2...'
sudo -u $WEB_USER bash -c "cd '$PROD_PRIVATE' && pm2 delete $PM2_APP_NAME 2>/dev/null || true"
sudo -u $WEB_USER bash -c "cd '$PROD_PRIVATE' && pm2 start ecosystem.config.js --env production"
sudo -u $WEB_USER bash -c "pm2 save"
pm2 startup systemd -u $WEB_USER --hp /home/$WEB_USER 2>/dev/null || true

echo '-- Verificando se o app esta respondendo...'
sleep 3
if curl -s -o /dev/null -w "%{http_code}" http://localhost:$APP_PORT 2>/dev/null | grep -q "200\|301\|302\|404"; then
    echo "App respondendo na porta $APP_PORT OK!"
else
    echo "AVISO: App pode nao estar respondendo ainda. Verificar: pm2 logs $PM2_APP_NAME"
fi

echo '-- Verificando dominios adicionais (i18n multi-dominio)...'
for DOMAIN in ${EXTRA_DOMAINS[@]}; do
    if [ -d "/home/$WEB_USER/web/\$DOMAIN" ]; then
        echo "  [OK] /home/$WEB_USER/web/\$DOMAIN existe"
    else
        echo "  [PENDENTE] \$DOMAIN nao tem dir em /home/$WEB_USER/web/"
        echo "             Adicione no HestiaCP: v-add-web-domain $WEB_USER \$DOMAIN"
    fi
done

echo '-- Verificando Nginx server blocks dos dominios extras...'
for DOMAIN in ${EXTRA_DOMAINS[@]}; do
    NGINX_CONF="/home/$WEB_USER/conf/web/\$DOMAIN/nginx.conf"
    if [ -f "\$NGINX_CONF" ]; then
        if grep -q "proxy_pass.*localhost:$APP_PORT" "\$NGINX_CONF" 2>/dev/null; then
            echo "  [OK] \$DOMAIN ja faz proxy para :$APP_PORT"
        else
            echo "  [ATENCAO] \$DOMAIN tem nginx.conf mas nao faz proxy para :$APP_PORT"
        fi
    fi
done

echo '-- Deploy concluido com sucesso!'
ENDSSH

    log_success "Comandos pos-deploy executados"
fi

################################################################################
# FIM
################################################################################

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}         DEPLOY CONCLUIDO COM SUCESSO!                   ${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo ""
log_info "Tempo total: ${DURATION}s"
echo ""
log_info "URLs de producao (i18n multi-dominio):"
echo -e "  ${BLUE}pt-BR${NC}: https://$PROD_DOMAIN"
for DOMAIN in "${EXTRA_DOMAINS[@]}"; do
    case "$DOMAIN" in
        agathas.es)         echo -e "  ${BLUE}es   ${NC}: https://$DOMAIN" ;;
        agathasweb.com)     echo -e "  ${BLUE}en-US${NC}: https://$DOMAIN" ;;
        uk.agathasweb.com)  echo -e "  ${BLUE}en-GB${NC}: https://$DOMAIN" ;;
        *)                  echo -e "         https://$DOMAIN" ;;
    esac
done
echo ""
log_info "Log salvo em: $LOG_FILE"
echo ""
log_warning "Verificar logs: ssh root@$PROD_HOST 'sudo -u $WEB_USER pm2 logs $PM2_APP_NAME'"
log_warning "Painel admin: https://$PROD_DOMAIN/admin (apenas pt-BR)"
echo ""

if [ "$DRY_RUN" = false ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploy realizado para $PROD_USER@$PROD_HOST:$PROD_PRIVATE" >> "$LOG_FILE"
fi

exit 0

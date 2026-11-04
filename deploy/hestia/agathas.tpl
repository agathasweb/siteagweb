#=========================================================================#
# Agathas Web (Docker :8099) - HTTP: agathas.com.br, .es, agathasweb.com, uk. e oferta.salomao
# Copiar para /usr/local/hestia/data/templates/web/nginx/
#=========================================================================#

server {
    listen      %ip%:%proxy_port%;
    server_name %domain_idn% %alias_idn%;
    error_log   /var/log/%web_system%/domains/%domain%.error.log error;

    include %home%/%user%/conf/web/%domain%/nginx.forcessl.conf*;

    location ~ /\.(?!well-known\/|file) {
        deny all;
        return 404;
    }

    # Uploads do admin (capas, avatares) — servidos direto pelo Nginx.
    # 'next start' so serve public/ presente no boot; uploads em runtime cairiam.
    location /uploads/ {
        alias %home%/%user%/web/agathas.com.br/private/public/uploads/;
        expires 30d;
        access_log off;
    }
    # O container serve todo o resto, inclusive /_next/static e /assets
    location / {
        proxy_pass http://127.0.0.1:8099;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        client_max_body_size 50M;
    }

    location /error/ {
        alias %home%/%user%/web/%domain%/document_errors/;
    }

    include %home%/%user%/conf/web/%domain%/nginx.conf_*;
}

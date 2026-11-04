# Site da Agathas em produção. Sem standalone de propósito: mesmo node_modules de produção e glibc do
# ambiente anterior, porque PDF, jsdom e sharp não se testam de forma simples fora do painel.
# O build lê o .env.local (secret), uma cópia do banco e os uploads (bind): montados só durante o RUN,
# não ficam em nenhuma camada da imagem.
FROM node:22-bookworm-slim AS deps
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --loglevel=error

FROM node:22-bookworm-slim AS build
ENV NEXT_TELEMETRY_DISABLED=1 TZ=America/Sao_Paulo
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --loglevel=error
COPY . .
ENV NODE_ENV=production
RUN --mount=type=secret,id=env,target=/app/.env.local \
    --mount=type=bind,from=dados,target=/app/data,rw \
    --mount=type=bind,from=uploads,target=/app/public/uploads \
    npx next build

FROM node:22-bookworm-slim
ENV NEXT_TELEMETRY_DISABLED=1 TZ=America/Sao_Paulo NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json next.config.ts tsconfig.json ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
# schema.sql e outros arquivos são lidos por caminho em tempo de execução
COPY --from=build /app/src ./src
COPY --from=build /app/scripts ./scripts
RUN mkdir -p data public/uploads && chown -R 1006:1006 .next data public/uploads
USER 1006:1006
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "--port", "3000", "--hostname", "0.0.0.0"]

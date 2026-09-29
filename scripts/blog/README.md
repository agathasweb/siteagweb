# Publicação em lote dos posts semanais

`publicar-lote.ts` faz no servidor o que o `/admin/posts` faz pela tela — validar, importar,
capa do Unsplash, tradução com o Gemini e publicação — usando as mesmas funções do site.

## Empacotar (na máquina local)

```bash
echo "export {};" > /tmp/server-only-stub.js
EXT=$(node -e "const p=require('./package.json');console.log(Object.keys({...p.dependencies,...p.devDependencies}).filter(n=>n!=='server-only').map(n=>'--external:'+n+' --external:'+n+'/*').join(' '))")
npx esbuild@0.24.0 scripts/blog/publicar-lote.ts --bundle --platform=node --format=esm \
  --target=node20 --tsconfig=tsconfig.json --alias:server-only=/tmp/server-only-stub.js \
  $EXT --outfile=/tmp/publicar-lote.mjs
scp /tmp/publicar-lote.mjs root@76.13.167.20:/home/agweb/web/agathas.com.br/private/.publicar-lote.mjs
```

O arquivo fica na raiz do projeto no servidor (o ESM só acha o `node_modules` a partir da
pasta do script) e o `deploy.sh` o exclui do `rsync --delete`.

## Rodar (no servidor, como agweb, a partir de `private/`)

```bash
cd /home/agweb/web/agathas.com.br/private
N="sudo -u agweb node --env-file=.env.local .publicar-lote.mjs"
$N validar  /tmp/posts/*.json
$N importar /tmp/posts/*.json          # entram como rascunho
$N capa-buscar <slug> "busca em inglês"  # lista 6 candidatas
$N capa-aplicar <slug> <n>
$N traduzir <slug ...>                 # es, en-US, en-GB (com novas tentativas)
$N publicar <slug ...>
$N status   <slug ...>
```

Faça backup do banco antes do import (`db.backup(...)` do better-sqlite3).

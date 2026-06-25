# GSC tool — consulta à Google Search Console API

Ferramenta zero-dependência (só Node nativo) para inspecionar o status de
indexação das URLs no Google Search Console, autenticando via **service account**.

## Por que service account (e não OAuth pessoal)

Permite consulta automatizada, sem login interativo a cada vez. O Claude consegue
rodar `node scripts/gsc/gsc.mjs ...` sozinho quando precisar te ajudar com SEO.

## O que a API entrega (e o que NÃO entrega)

- ✅ **Inspeção de URL** — status + motivo exato + canônica que o Google escolheu.
- ✅ **Search Analytics** — cliques/impressões/posição (não usado ainda aqui).
- ❌ O relatório agregado "Páginas" (124 não indexadas / 336 indexadas) **não**
  existe na API — é só na UI. Por isso auditamos URL a URL via sitemap, o que é
  mais acionável.

## Setup (uma vez)

### 1. Criar o service account no GCP

1. Acesse https://console.cloud.google.com/ → crie/selecione um projeto
   (ex.: `agathas-seo`).
2. Ative a API: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
   → **Ativar** (com o projeto certo selecionado no topo).
3. Crie a conta de serviço:
   https://console.cloud.google.com/iam-admin/serviceaccounts → **Criar conta de serviço**
   - Nome: `gsc-reader` → **Concluir** (não precisa dar nenhum papel/role no projeto).
4. Gere a chave JSON: clique na conta criada → aba **Chaves** → **Adicionar chave**
   → **Criar nova chave** → **JSON** → baixa um arquivo `.json`.
5. **Copie o e-mail** do service account (algo como
   `gsc-reader@agathas-seo.iam.gserviceaccount.com`).

### 2. Autorizar o SA no Search Console

1. Abra https://search.google.com/search-console (propriedade **agathas.com.br**).
2. **Configurações** (engrenagem) → **Usuários e permissões** → **Adicionar usuário**.
3. Cole o e-mail do service account, permissão **Restrito** (leitura basta) → **Adicionar**.
4. Repita para os outros domínios (agathas.es, agathas.com, etc.) se quiser auditá-los.

### 3. Instalar a chave na máquina

```bash
# Substitua pelo caminho do JSON que você baixou:
cp ~/Downloads/agathas-seo-XXXX.json ~/.config/gsc/agathas-sa.json
chmod 600 ~/.config/gsc/agathas-sa.json
```

> O arquivo fica **fora** do repositório (`~/.config/gsc/`), nunca é commitado.
> Alternativa: aponte a env `GSC_SA_KEY=/caminho/para/chave.json`.

## Uso

```bash
# Confirmar que o SA enxerga as propriedades (teste de fumaça):
node scripts/gsc/gsc.mjs sites

# Inspecionar uma URL específica:
node scripts/gsc/gsc.mjs inspect https://agathas.com.br/quem-somos

# Auditar o sitemap inteiro de agathas.com.br (agrupa por status + lista não indexadas):
node scripts/gsc/gsc.mjs audit

# Outro domínio:
node scripts/gsc/gsc.mjs audit --site=sc-domain:agathas.es
node scripts/gsc/gsc.mjs inspect https://agathas.es/ --site=sc-domain:agathas.es
```

Cota: 2.000 inspeções/dia, 600/min por propriedade.

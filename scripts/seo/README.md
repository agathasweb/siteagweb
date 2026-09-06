# Ferramentas de SEO — o ciclo mensal do blog

Depois da auditoria de 06/09/2026 (163 posts, 629 cliques em 90 dias, 79% deles
vindos de 4 notícias de gadget e apenas 14 cliques nas páginas comerciais), a
pauta do blog deixou de nascer do Google Trends e passou a nascer daqui.

A ideia em uma frase: **o blog existe para alimentar as páginas que vendem.**

## O ciclo

```
 1x por mês                     por post                        1x por mês
┌──────────────┐   pauta.tsv  ┌──────────────────┐  JSON  ┌──────────────┐
│  npm run     │─────────────▶│ gerar-posts-agweb│───────▶│ /admin/posts │
│  seo:pauta   │              │     --pauta      │        │   /import    │
└──────────────┘              └──────────────────┘        └──────────────┘
       ▲                                                          │
       │                      ┌──────────────┐                    │
       └──────────────────────│ npm run      │◀───────────────────┘
         ajusta clusters.json │ seo:review   │  o que reescrever, reforçar,
                              └──────────────┘  consolidar e congelar
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run seo:snapshot` | Baixa o banco de **produção** para `data/prod-snapshot.db` (as demais ferramentas leem daí). Não escreve nada em produção. |
| `npm run seo:pauta` | Monta a fila do mês: 60% clusters + 25% oportunidades do Search Console + 15% notícia com trava de tema. Salva `pauta-AAAA-MM.tsv` na Área de trabalho. |
| `npm run seo:review` | Revisão do acervo: o que reescrever (CTR baixo), reforçar (posição 8-20), consolidar (duplicados), congelar (invisível), mais posts sem link comercial e órfãos. |
| `npm run seo:consulta -- <cmd>` | Contexto para escrever: `autor`, `voz`, `taxonomia`, `checar <slug> "<kw>"`, `links "<tema>"`, `orfaos`. Usado pelo `post.md`. |
| `npm run seo:perf` | Desempenho no GSC: totais, top páginas, top consultas e o placar das páginas comerciais. |
| `npm run seo:gaps` | Consultas em posição 8-30 — o que está a um passo da primeira página. |

Flags úteis: `--days=90`, `--posts=12`, `--site=sc-domain:agathas.es`, `--sem-gsc`,
`--db=<caminho>`. Ex.: `npm run seo:review -- --days=28`.

## Arquivos

- **`clusters.json`** — o mapa estratégico. **É aqui que se muda a estratégia.**
  Cada cluster tem uma `money_page` (a página que vende) e uma fila de posts.
  Também define os gatilhos permitidos para notícia e o filtro de consultas do
  GSC que não viram pauta (navegacional de terceiros, gadget, entretenimento).
- `pauta.mjs` · `review.mjs` · `consulta.mjs` · `snapshot.mjs` · `db.mjs` (leitura do SQLite).
- A autenticação no Search Console fica em `../gsc/lib.mjs` (service account em
  `~/.config/gsc/agathas-sa.json`).

## Regras que o import passou a exigir

`src/lib/posts-import.ts` recusa o JSON que:

1. não declare `money_page` (uma das 10 páginas de produto/serviço);
2. não declare `search_intent` — e `navegacional` é proibido de propósito;
3. tenha menos de **2 links contextuais** para a `money_page` no corpo do post;
4. reaproveite uma `focus_keyword` já publicada (canibalização). Só passa com
   `"allow_keyword_overlap": true`, que deve ser decisão consciente.

## Rotina sugerida

**Todo dia 1º:**

```bash
npm run seo:snapshot        # traz o acervo de produção
npm run seo:review          # o que corrigir no que já existe
npm run seo:pauta           # a fila do mês
# revise o pauta-AAAA-MM.tsv (troque as linhas [PREENCHER])
gerar-posts-agweb --pauta   # gera os JSONs
# revise e importe em /admin/posts/import
```

**A métrica que importa** não é o total de cliques do blog: é o número de
cliques nas páginas de `/produtos/` e `/servicos/`, que o `seo:perf` imprime no
fim. Linha de base em 06/09/2026: **14 cliques por trimestre**.

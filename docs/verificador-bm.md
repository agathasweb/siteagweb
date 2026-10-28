# Verificador de BM (Voyia)

Página de pré-contratação do Voyia. Ela confere se a empresa (CNPJ) e o Business Manager do cliente estão aptos para a API Oficial do WhatsApp.

- **Produção:** https://agathas.com.br/verificador-bm (`?debug=1` mostra o JSON da Meta)
- **Local:** https://agathas-dev.agathasweb.com/verificador-bm, servido pelo `next dev` na porta 3077. O login da Meta só funciona em agathas.com.br, porque o JS SDK do app só aceita esse domínio.
- **Só pt-BR** e noindex.

## Arquivos
- `src/lib/verificador-bm/index.ts`: consulta de CNPJ (BrasilAPI → CNPJá aberto), leitura do PDF do cartão CNPJ (unpdf), validação do token (debug_token), lista de BMs, checks e limite por IP
- `src/app/api/verificador-bm/{cnpj,cnpj-pdf,meta}/route.ts`: rotas da API
- `src/app/[lang]/verificador-bm/page.tsx` e `src/components/verificador-bm/VerificadorBm.tsx`: tela
- `.env.local`: `META_APP_ID` e `META_APP_SECRET`, do app Voyia 517429776771018

## Meta
- O login usa Facebook Login for Business com a configuração **1123305396753718** ("Verificador de BM"), que pede business_management, ads_read e whatsapp_business_management.
- A janela da Meta não tem seletor de BM, por isso a página lista `/me/businesses` e o cliente escolhe a BM ali.
- `owned_ad_accounts.disable_reason` (1, 5, 6, 7) é usado como sinal de BM restrita.
- A entidade `APP` do `health_status` é ignorada. Ela se refere ao nosso app, não ao cliente.
- A Meta não expõe o CNPJ da BM, então a comparação é feita por semelhança de nome.

## App Review
O pedido de business_management + ads_read foi ENVIADO em 28/10/2026 e aguarda resposta. As "Instruções para o analista" só liberam com a plataforma Site salva em Configurações → Básico (website_url https://agathas.com.br/).
- Textos enviados: `~/Downloads/Analise-App-Meta-Voyia-business_management-ads_read.md`
- Vídeo: `~/Vídeos/Voyia-AppReview-business_management-ads_read.mp4`
- Para regravar, remova antes o Voyia em Integrações comerciais do Facebook. Sem isso, a tela de permissões não aparece.

## Pendências
- Depois da aprovação: tornar a verificação obrigatória no cadastro do Voyia.
- A cópia antiga em `~/DDEV/voyia-dev` (rota `/verificacao`, Embedded Signup) está obsoleta. Remover ou atualizar.

## Deploy
`bash deploy.sh -y` (o deploy derruba o `next dev`; religue a porta 3077 depois).

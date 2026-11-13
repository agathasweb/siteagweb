# Salomão: criativos "Diferenciais" (nov/2026)

Base: `salomao/docs/comercial/plano-criativos-2026-11.md`, seções 1 a 3.
Campanha: Salomão | F2 | Leads | Formulário instantâneo (act_349931326347438), conjunto GMaps + semelhantes.
Imagens 1080x1350 (4:5). Fonte em `src/` (`python3 montar.py && ./render.sh`).
Dados das imagens são fictícios (selo "Imagem ilustrativa · dados fictícios" na arte). Escolas das artes são inventadas.
CTA padrão: SIGN_UP ("Cadastre-se") no formulário instantâneo. Para público frio com destino no site: LEARN_MORE ("Saiba mais").
Oferta em todas as peças: 30% de desconto nos 3 primeiros meses para quem começar até 31/12 + teste grátis por 7 dias.
**Tirar do ar em 31/12** (a data está na arte).

## Estáticos: avisos (dor do grupo de mensagens e do bilhete)

### A1. Quem leu o aviso (`A1-quem-leu.png`)
- **Título:** Quem leu o aviso? Agora você sabe
- **Texto principal:** Diretora, quantos pais leram o seu último comunicado? No Salomão cada aviso mostra quem abriu e leu e quem ainda falta, e o lembrete vai só para quem não leu. Teste grátis por 7 dias e 30% de desconto nos 3 primeiros meses para quem começar até 31/12.
- **Descrição:** Avisos com leitura confirmada
- **CTA:** Cadastre-se

### A2. Sumiu no grupo (`A2-sumiu-no-grupo.png`)
- **Título:** O recado sumiu no grupo de novo?
- **Texto principal:** Aviso de passeio no meio de 200 mensagens não é aviso. No Salomão o recado chega como notificação, fica fixo no topo do app e a escola vê quem abriu e leu. Teste grátis por 7 dias, sem falar com vendedor.
- **Descrição:** O aviso da escola no app da escola
- **CTA:** Cadastre-se

### A3. Bilhete na mochila (`A3-bilhete-na-mochila.png`)
- **Título:** O bilhete voltou na mochila?
- **Texto principal:** Papel se perde. O aviso no app chega na hora: para todas as famílias, para uma turma ou só para os pais de um aluno. E a escola vê quem abriu e leu. Teste grátis por 7 dias.
- **Descrição:** Adeus, bilhete de papel
- **CTA:** Cadastre-se

### A4. 12 grupos (`A4-12-grupos.png`)
- **Título:** Seu número fora de 12 grupos de pais
- **Texto principal:** Professor não precisa dar o celular pessoal para os pais. No Salomão o aviso sai da escola, pelo app da escola, com o nome da escola. Teste grátis por 7 dias e 30% de desconto nos 3 primeiros meses até 31/12.
- **Descrição:** Comunicação oficial da escola
- **CTA:** Cadastre-se

### A5. Turma certa (`A5-turma-certa.png`)
- **Título:** Avisou a turma certa?
- **Texto principal:** Um aviso para todos, outro só para o 3º ano, outro só para os professores. No Salomão você escolhe quem recebe e acompanha quem abriu e leu. Teste grátis por 7 dias.
- **Descrição:** Você escolhe quem recebe
- **CTA:** Cadastre-se

## Carrossel "Tudo num app só" (`carrossel-tudo/01` a `08`)
Ordem fixa (desligar a otimização automática da ordem dos cartões). Um texto principal para o carrossel; título e descrição por cartão.

- **Texto principal:** Diretora, quantas ferramentas a sua escola usa hoje? No Salomão a portaria com TV, a cantina, os avisos, as notas, a frequência e o financeiro ficam num app só, com a marca da sua escola. R$ 249 por mês até 250 alunos, com teste grátis por 7 dias e 30% de desconto nos 3 primeiros meses para quem começar até 31/12.
- **CTA:** Cadastre-se

| Cartão | Arquivo | Título | Descrição |
|---|---|---|---|
| 1 | `01-capa.png` | 6 coisas num app só | Com a marca da sua escola |
| 2 | `02-portaria.png` | A TV chama o aluno pelo nome | E fica o registro de quem buscou |
| 3 | `03-cantina.png` | Cantina sem dinheiro | Crédito, PIX e lanche encomendado |
| 4 | `04-avisos.png` | Você vê quem leu cada aviso | Lembrete só para quem falta |
| 5 | `05-notas-frequencia.png` | Notas e frequência no celular | A família acompanha pelo app |
| 6 | `06-financeiro.png` | Financeiro de verdade | Lembrete de vencimento automático |
| 7 | `07-marca-da-escola.png` | App com a marca da sua escola | A nossa marca não aparece |
| 8 | `08-fechamento.png` | R$ 249 por mês até 250 alunos | 30% de desconto até 31/12 |

## Carrossel de preço (`carrossel-preco/01` a `06`)
Ordem fixa (a história só funciona em sequência).

- **Texto principal:** Quanto custa um sistema para a sua escola? A maioria só diz depois da reunião com o vendedor. O nosso está na página: R$ 249 por mês, até 250 alunos. Isso dá a partir de R$ 0,99 por aluno, com 6 módulos. Sem fidelidade, sem taxa de implantação e sem reajuste surpresa no 13º mês. Teste grátis por 7 dias e 30% de desconto nos 3 primeiros meses para quem começar até 31/12.
- **CTA:** Cadastre-se

| Cartão | Arquivo | Título | Descrição |
|---|---|---|---|
| 1 | `01-quanto-custa.png` | Quanto custa um sistema escolar? | Arraste para ver |
| 2 | `02-a-maioria-nao-diz.png` | A maioria não diz o preço | Só depois da reunião |
| 3 | `03-o-nosso-esta-na-pagina.png` | O nosso: R$ 249 por mês | Até 250 alunos |
| 4 | `04-por-aluno.png` | A partir de R$ 0,99 por aluno | Com 6 módulos |
| 5 | `05-sem-pegadinha.png` | Preço fixo, sem pegadinha | Sem fidelidade nem implantação |
| 6 | `06-teste-gratis.png` | Teste grátis por 7 dias | 30% de desconto até 31/12 |

## Estático: app com a marca da escola

### B1. O app é da sua escola (`B1-app-da-sua-escola.png`)
- **Título:** O app é da sua escola, não o nosso
- **Texto principal:** Diretora, quando o pai abre o app, ele vê o nome, o logo e as cores da sua escola. Pais, professores e equipe usam o app da escola, e a nossa marca não aparece. Já vem incluso. Teste grátis por 7 dias.
- **Descrição:** Nome, logo e cores da sua escola
- **CTA:** Cadastre-se
- *Não escrever "nas lojas" neste anúncio: o que vem incluso é o app instalável (PWA); App Store e Google Play são um adicional.*

## Estáticos: WhatsApp oficial da escola (opcional)
O WhatsApp oficial é um opcional contratado à parte, ativado pelo suporte. **Não divulgar valor** em arte nem em texto.
Destino no site: `/produtos/salomao?a=whatsapp`.

### W1. Vários atendentes (`W1-varios-atendentes.png`)
- **Título:** Um número, a equipe toda atendendo
- **Texto principal:** Diretora, o WhatsApp da escola ainda depende de um celular na secretaria? Com o Salomão a escola pode ter o WhatsApp oficial: secretaria, financeiro e coordenação atendem no mesmo número, cada um com o próprio acesso, e o WhatsApp continua funcionando no celular. É um opcional do app da escola, pela API oficial da Meta.
- **Descrição:** WhatsApp oficial da escola
- **CTA:** Saiba mais

### W2. Envio em massa (`W2-envio-em-massa.png`)
- **Título:** Avise 300 famílias sem medo de bloqueio
- **Texto principal:** Mandar aviso para todas as famílias por aplicativo não oficial pode bloquear o número da escola. No Salomão o envio em massa sai pela API oficial da Meta, do número da própria escola, e o aviso ainda fica no app com a lista de quem leu. O WhatsApp oficial é um opcional do Salomão.
- **Descrição:** Envio em massa pela API oficial
- **CTA:** Saiba mais

### W3. App e WhatsApp (`W3-app-e-whatsapp.png`)
- **Título:** O aviso no app e no WhatsApp da escola
- **Texto principal:** A família que ainda não instalou o app também recebe: você publica o aviso uma vez e ele chega no app da escola e, se quiser, no WhatsApp oficial da escola, com o link para ler. No app, você vê quem abriu e leu. R$ 249 por mês até 250 alunos; o WhatsApp oficial é um opcional.
- **Descrição:** Publicou uma vez, chega nos dois
- **CTA:** Saiba mais

## Estáticos: portaria e cantina

### P1. A TV chama (`P1-tv-chama.png`)
- **Título:** A TV chama o aluno pelo nome
- **Texto principal:** Fim da gritaria no portão: o pai avisa pelo app que chegou, a TV da escola chama o aluno pelo nome e a saída fica registrada, com quem buscou e quanto esperou. Teste grátis por 7 dias.
- **Descrição:** Portaria com TV
- **CTA:** Cadastre-se

### P2. Quem buscou (`P2-quem-buscou.png`)
- **Título:** Quem buscou o seu aluno hoje?
- **Texto principal:** No Salomão cada saída fica registrada: quem pediu, a que horas e quanto tempo esperou. Irmãos saem juntos. Teste grátis por 7 dias e 30% de desconto nos 3 primeiros meses até 31/12.
- **Descrição:** Saída registrada, sem caderno
- **CTA:** Cadastre-se

### C1. Cantina sem troco (`C1-cantina-sem-troco.png`)
- **Título:** Cantina sem troco e sem caderninho
- **Texto principal:** O pai põe crédito por PIX, o valor entra sozinho e o aluno compra sem dinheiro. A família vê pelo app o que ele comeu. Teste grátis por 7 dias.
- **Descrição:** Crédito por PIX na cantina
- **CTA:** Cadastre-se

### C2. Lanche de amanhã (`C2-lanche-de-amanha.png`)
- **Título:** O lanche de amanhã, pedido hoje
- **Texto principal:** A família encomenda o lanche pelo app e a cantina já sabe quanto preparar. Sem fila, sem troco e sem desperdício. Teste grátis por 7 dias.
- **Descrição:** Lanche encomendado pelo app
- **CTA:** Cadastre-se

## Ordem sugerida de teste
Subir 3 a 4 por vez no conjunto que já converte e pausar o que não entregar em 7 dias:
1. A1, P1, carrossel de preço, carrossel "Tudo num app só".
2. A2, C1, B1.
3. A5, P2, C2, A4, A3.

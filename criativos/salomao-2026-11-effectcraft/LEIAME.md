# Salomão: 5 vídeos em motion graphics (EffectCraft 0.9.2, via CLI)

Roteiros: `salomao/docs/comercial/plano-criativos-2026-11.md`, seção 4 (V10, V2, V6, V7, V4).

| Pasta | O que tem |
|---|---|
| `9x16/` | mp4 1080x1920, 30 fps, H.264, sem áudio (Reels, TikTok, Stories) |
| `4x5/` | mp4 1080x1350, mesma animação reenquadrada numa segunda composição (feed) |
| `capas/` | uma capa .jpg (1080x1920) de cada vídeo |
| `projetos/` | `.ecproj` de cada vídeo, os scripts `.jsx` que os geram, `lib.jsx`, `icons.jsx`, `assets/`, `fontes/` |

## Como regerar

```bash
cd projetos
./build.sh          # todos: roda o .jsx, renderiza 9x16 e 4x5, tira a capa
./build.sh v10      # só um (v10, v2, v6, v7, v4)
```

O `build.sh` chama o `ec.sh`, que é o `effectcraft-cli` com a Poppins disponível. O `ec.sh` acha o binário sozinho:
usa `EC_BIN` se estiver definido e existir; senão extrai (uma única vez) o AppImage
`/home/gutto/Aplicativos/CraftingApps/effectcraft-0.9.2-linux-x86_64.AppImage` para `~/.cache/effectcraft-cli/` e usa de
lá. Se o AppImage mudar de lugar ou de versão, passe `EC_APPIMAGE=/caminho/novo.AppImage` (e apague a pasta do cache).

Passo a passo manual, para um vídeo:

```bash
./ec.sh --empty script "$PWD/v10-preco-na-pagina.jsx"        # gera v10-preco-na-pagina.ecproj
./ec.sh --project v10-preco-na-pagina.ecproj render --comp V10_9x16 --out ../9x16/v10-preco-na-pagina.mp4 --format h264 --bitrate 6000 --audio off
./ec.sh --project v10-preco-na-pagina.ecproj render --comp V10_4x5  --out ../4x5/v10-preco-na-pagina.mp4  --format h264 --bitrate 6000 --audio off
./ec.sh --project v10-preco-na-pagina.ecproj render-frame --comp V10_9x16 --time 8.6 --out quadro.png   # conferir um quadro
```

## Como ajustar

- **Texto, tempo, cor, posição:** edite o `.jsx` do vídeo e rode o `build.sh`. Cada script tem os quadros em ordem
  (`Q1`, `Q2`…), com o tempo em segundos do vídeo inteiro. O que é comum (cores, quadro final da oferta, fundo,
  entradas com easing) está em `lib.jsx`. A oferta do quadro final está na função `oferta()` da `lib.jsx`:
  quando a promoção acabar (31/12), mude lá e regere os cinco.
- **Na interface do EffectCraft:** abra o `.ecproj`. Cada vídeo tem as comps `V?_9x16` e `V?_4x5` (as finais) e uma
  comp por quadro (`Q1 pergunta_9x16` etc.). **Atenção:** rodar o `.jsx` de novo sobrescreve o `.ecproj`; se ajustar
  na interface, salve com outro nome.
- **Fonte:** a Poppins não está instalada no sistema. Pelo CLI ela entra via `fonts.conf` (o `ec.sh` cuida disso).
  Para abrir os projetos na interface com a fonte certa, instale os três `.ttf` de `projetos/fontes/`
  (`cp projetos/fontes/*.ttf ~/.local/share/fonts/ && fc-cache -f`).

## O que cada vídeo tem

| Vídeo | Duração | Quadros |
|---|---|---|
| `v10-preco-na-pagina` | 12 s | "?" gigante + pergunta · balão "Agende uma reunião…" riscado · "R$ 249 por mês" entra em escala (valor fixo, sem contagem) + selos · oferta |
| `v2-adeus-grupo` | 18 s | balões caem e empilham · aviso vermelho afunda · faixa dourada varre tudo · celular + notificação + "Aviso aberto e lido" · 92% e 23 de 25 famílias · oferta |
| `v6-app-da-escola` | 15 s | app genérico cinza · troca de roupa 3x (Colégio Vila Aurora, Escola Ipê Dourado, Instituto Sabiá: fictícias) · ícone vai para a tela inicial · oferta |
| `v7-tudo-num-app` | 20 s | pergunta · 4 ferramentas se fundem num celular · 6 módulos com frase de apoio (1,9 s cada) · oferta com preço (3 s) |
| `v4-antes-depois-saida` | 15 s | ANTES em cinza · cortina · DEPOIS em azul e dourado · registro de quem buscou · oferta |

**Área útil:** no 9:16 o conteúdo fica entre 14% do topo e 22% do rodapé (faixa coberta pela interface do
Reels/TikTok) e 8% nas laterais; no 4:5, 8% em tudo. Está em `setFmt()` na `lib.jsx`; `Y(0..1)` é a fração dessa área.

## O que aprendi da API do CLI (0.9.2)

- `effectcraft-cli commands [--filter X]` lista os 681 comandos do motor com os parâmetros. `props <comp> <camada> --flat`
  mostra os caminhos reais das propriedades (ex.: `transform/position`, `contents/group/contents/rect/roundness`,
  `text/animators/animator/selectors/rangeSelector/offset`, `effects/#1/softness`).
- Dentro de `script arquivo.jsx` existe o modelo de objetos estilo After Effects **e** `app.run("comando.do.motor", {params})`,
  que foi o caminho mais direto. Usados: `comp.new`, `comp.open`, `layer.newText`, `layer.newShape`, `layer.newNull`,
  `layer.addShapeItem`, `layer.addItem`, `layer.setParent`, `layer.setTrackMatte`, `layer.timing`, `layer.setText`
  (cor em um trecho, com `range`), `layer.applyTextPreset`, `prop.set`, `prop.addKey`, `keys.set`, `keys.setEase`,
  `prop.setExpression`, `effect.apply`, `file.import`, `edit.pasteSvg`, `comp.setSwitch`.
- `edit.pasteSvg` transforma SVG numa camada de forma vetorial: os ícones (Lucide, licença ISC) entram assim.
- Easing: `keys.setEase {layer, path, time, side: in|out, speed: 0, influence}` em cada keyframe. A `lib.jsx` embrulha
  isso em `K(camada, caminho, [[t, valor], …], "out"|"in"|"io"|"lin")`.
- Expressões funcionam em `text/sourceText` (os contadores de R$ 249 e de 92% são `Math.round(ease(time, …))`).
- O texto mede com `layer.sourceRectAtTime(0, false).width` (só a largura veio confiável; a altura veio 0).
- Render: `render --format h264` saiu H.264 High, yuv420p, 30 fps, sem depender de ffmpeg. Cerca de 45 a 90 s por
  vídeo de 12 a 20 s em 1080x1920.

### Armadilhas

1. **`$.evalFile` só lê arquivos da pasta do próprio script** (ou do projeto), e só resolve caminho se o script for
   chamado com caminho absoluto. Por isso a `lib.jsx` fica ao lado dos scripts e os caminhos são absolutos: se mover a
   pasta, troque o caminho no topo de cada `.jsx` e em `DIR` na `lib.jsx`.
2. `$.getenv` não existe: não dá para passar parâmetro por variável de ambiente ao script.
3. **Parentear depois de animar quebra a posição**: `layer.setParent` compensa a transformação do pai no instante 0;
   se o pai já tem escala 0 em t=0 (entrada em "pop"), o filho vai parar longe. Sempre parentear antes de animar o pai.
4. **Opacidade não é herdada do pai** (como no After Effects). Para sumir com um grupo, use precomp ou dê fade em cada filho.
5. A camada nova entra no topo; `layer.arrange {to: "backward"}` desce só um degrau. Mais simples criar na ordem certa.
6. Os presets de texto (`layer.applyTextPreset`) põem os keyframes sempre em 0 s e 1,5 s da camada; é preciso
   reposicionar com `keys.set {time, newTime}`.
7. Os tempos de `prop.addKey`/`keys.setEase` são do tempo da camada. Para não fazer conta, todas as comps de quadro têm
   a duração do vídeo inteiro e começam em 0; o que muda é o ponto de entrada/saída da camada (`layer.timing`).
8. `comp.new` não ativa a comp: é preciso `comp.open` antes de criar camadas (a `lib.jsx` faz isso em `comp()`).
9. Fonte fora do sistema: o EffectCraft enxerga o que o fontconfig enxerga. `FONTCONFIG_FILE` apontando para um
   `fonts.conf` com a pasta das fontes resolve sem instalar nada (confirmado com `exec text.fonts --params '{"query":"Poppins"}'`).

## Limitações

- Sem áudio e sem narração (pedido assim). Não há trilha.
- Emojis dos roteiros ("🌞", "📢") ficaram de fora: a Poppins não tem esses glifos. O megafone é ícone vetorial.
- Os ícones são de traço (Lucide). "Maquininha" usa o ícone de calculadora, o mais próximo disponível.
- No V2 a tela do celular usa a captura atual do app dos pais (`assets/app-avisos-lista.png`, interface de 12/11),
  mas só o cabeçalho e o primeiro aviso: o segundo cartão da captura tem o texto "A autorização vai pelo…"
  (autorizações ainda não existem), então o cartão do passeio e os dois seguintes são desenhados em vetor na comp `Tela app`.
- A largura medida do texto (`sourceRectAtTime`) não inclui toda a folga dos glifos: ao ajustar texto grande à
  largura útil, deixe margem (a função `cabe()` da `lib.jsx` reduz a escala; no preço do V10 usei 94%).
- As escolas do V6 e os nomes da lista do V4 são fictícios e levam o aviso "imagem ilustrativa" na tela.
- O 4:5 é uma segunda composição com o mesmo conteúdo reposicionado (objetos a 82%, textos a 90%), não um desenho
  feito do zero para o feed.

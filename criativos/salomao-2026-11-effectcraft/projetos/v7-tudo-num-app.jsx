// V7 "Tudo num app só" — 20 s. Gera as comps V7_9x16 e V7_4x5.
$.evalFile(new File("/home/gutto/DDEV/agathas-dev/criativos/salomao-2026-11-effectcraft/projetos/lib.jsx"));
$.evalFile(new File("/home/gutto/DDEV/agathas-dev/criativos/salomao-2026-11-effectcraft/projetos/icons.jsx"));
DUR = 20;
var FERR = [["sheet", "Planilha"], ["messages-square", "Grupo de mensagens"], ["notebook-pen", "Caderno"], ["calculator", "Maquininha"]];
// módulo: ícone, nome (3 palavras) e frase de apoio (carrossel 3.2 do plano, encurtada)
var MODS = [["tv", "Portaria com TV", "A TV chama o aluno pelo nome"],
            ["utensils", "Cantina com PIX", "Crédito no app, sem dinheiro"],
            ["megaphone", "Avisos com leitura", "Você vê quem abriu e leu"],
            ["clipboard-check", "Notas e frequência", "O professor lança pelo celular"],
            ["wallet", "Financeiro", "Recebimentos, despesas e saldo"],
            ["smartphone", "App com a sua marca", "Nome, logo e cores da escola"]];
var B = 2.8;                  // início do quadro das ferramentas
var T0 = 5.6, PASSO = 1.9;    // 1º módulo em 5,6 s, um a cada 1,9 s (6 módulos até 17 s); oferta de 17 a 20 s

function build(fmt) {
  setFmt(fmt);
  var cx = FMT.cx, W = FMT.W, H = FMT.H, sfx = "_" + fmt, i, maxW = W - 2 * FMT.mx;

  // ---- Quadro 1 (0–2,8 s): pergunta
  var q1 = comp("Q1 pergunta" + sfx);
  var d = text("Diretora,", cx, Y(0.36), { size: ut(72), style: "SemiBold", fill: GOLD, name: "Diretora," });
  slideIn(d, 0.15, 0, 40, 0.5);
  var p = text("quantas ferramentas\na sua escola usa hoje?", cx, Y(0.36) + ut(134), { size: ut(84), leading: ut(106), name: "pergunta" });
  cabe(p, maxW);
  textIn(p, 0.4, 0.85);
  var ln = path(cx, Y(0.36) + ut(134) + ut(106) + ut(56), [[-ut(440), 0], [ut(440), 0]], { stroke: GOLD, sw: 10, trim: true, name: "sublinhado" });
  draw(ln, 1.3, 0.5);

  // ---- Quadro 2 (2,8–5,6 s): quatro ferramentas se fundem num celular
  var tiles = [];
  for (i = 0; i < 4; i++) {
    var tc = comp("Ferramenta · " + FERR[i][1] + sfx, 380, 380);
    rect(190, 190, 360, 360, { fill: WHITE, r: 72, name: "cartão" });
    icon(FERR[i][0], 190, 155, 170, NAVY, 1.8);
    text(FERR[i][1], 190, 318, { size: FERR[i][1].length > 12 ? 28 : 32, style: "SemiBold", fill: INK, name: FERR[i][1] });
    tiles.push(tc);
  }
  var scr = comp("Tela Salomão" + sfx, 400, 800);
  rect(200, 400, 400, 800, { fill: NAVY, r: 0, name: "fundo" });
  image("coroa.png", 200, 360, 42, "coroa");
  text("Salomão", 200, 520, { size: 52, name: "Salomão" });
  var q2 = comp("Q2 fusão" + sfx);
  var cy = Y(0.42), off = u(232);
  var cant = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (i = 0; i < 4; i++) {
    var x = cx + cant[i][0] * off, y = cy + cant[i][1] * off, t = B + 0.1 + i * 0.16, s = u(112);
    var l = place(tiles[i], x, y, s, FERR[i][1]);
    shadow(l, 16, 50, 35); mblur(l);
    K(l, "transform/position", [[t, [cx + cant[i][0] * W * 0.95, cy + cant[i][1] * H * 0.5, 0]], [t + 0.6, [x, y, 0]]]);
    K(l, "transform/rotation", [[t, cant[i][0] * 35], [t + 0.6, cant[i][0] * 3]]);
    // fusão: vão ao centro, giram e encolhem
    K(l, "transform/position", [[B + 1.65, [x, y, 0]], [B + 2.1, [cx, cy, 0]]], "in");
    K(l, "transform/scale", [[B + 1.65, [s, s, 100]], [B + 2.1, [12, 12, 100]]], "in");
    K(l, "transform/rotation", [[B + 1.65, cant[i][0] * 3], [B + 2.1, cant[i][0] * 120]], "in");
    timing(l, t, B + 2.12);
  }
  anel(cx, cy, u(480), B + 2.05);
  var fone = celular(scr, cx, cy, 400, 800, "celular");
  var fs = u(100);
  timing(fone, B + 2.0, null);
  K(fone, "transform/scale", [[B + 2.03, [0, 0, 100]], [B + 2.33, [fs * 1.1, fs * 1.1, 100]], [B + 2.5, [fs, fs, 100]]]);
  var cap = text("Tudo num app só", cx, Y(0.95), { size: ut(84), name: "Tudo num app só" });
  textIn(cap, B + 2.2, 0.45);

  // ---- Quadro 3 (5,6–17 s): um módulo a cada 1,9 s
  var q3 = comp("Q3 módulos" + sfx);
  var cab = text("TUDO NUM APP SÓ", cx, Y(0.02), { size: ut(42), style: "SemiBold", fill: GRAY2, tracking: 80, name: "cabeçalho" });
  fadeIn(cab, T0 + 0.1, 0.4);
  var my = Y(0.35), D = u(540);
  for (i = 0; i < 6; i++) {
    var a = T0 + i * PASSO, b = a + PASSO, ultimo = (i == 5);
    var num = text(String(i + 1), cx + u(270), my + u(330), { size: u(940), fill: WHITE, name: "número " + (i + 1) });
    set(num, "transform/opacity", 0);
    K(num, "transform/opacity", ultimo ? [[a, 0], [a + 0.4, 6]] : [[a, 0], [a + 0.4, 6], [b - 0.3, 6], [b, 0]], "io");
    K(num, "transform/position", [[a, [cx + u(350), my + u(330), 0]], [b, [cx + u(230), my + u(330), 0]]], "lin");
    timing(num, a, ultimo ? null : b + 0.02);
    var g = nullAt(cx, my, "módulo " + (i + 1) + " ctrl");
    var disco = circle(cx, my, D, { fill: GOLD, name: "disco" });
    var ic = icon(MODS[i][0], cx, my, D * 0.5, NAVY, 1.9);
    parent(disco, g); parent(ic, g);
    shadow(disco, 20, 70, 35);
    var e = a - (i > 0 ? 0.08 : 0);   // entra enquanto o anterior ainda está saindo
    var fim = ultimo ? null : b + 0.1;  // o último fica até a saída do quadro
    K(g, "transform/position", [[e, [cx + W * 0.9, my, 0]], [e + 0.5, [cx, my, 0]]]);
    K(g, "transform/rotation", [[e, 25], [e + 0.5, 0]]);
    K(ic, "transform/rotation", [[e + 0.35, -18], [e + 0.6, 10], [e + 0.85, 0]], "io");
    if (!ultimo) {
      K(g, "transform/position", [[b - 0.3, [cx, my, 0]], [b + 0.08, [cx - W * 0.9, my, 0]]], "in");
      K(g, "transform/rotation", [[b - 0.3, 0], [b + 0.08, -25]], "in");
    }
    timing(g, e, fim); timing(disco, e, fim); timing(ic, e, fim);
    mblur(disco); mblur(ic);
    var tt = text(MODS[i][1], cx, Y(0.745), { size: ut(92), name: MODS[i][1] });
    cabe(tt, maxW);
    textIn(tt, e + 0.2, 0.4);
    var ap = text(MODS[i][2], cx, Y(0.745) + ut(84), { size: ut(48), style: "Regular", fill: "#e5e7eb", name: "apoio " + (i + 1) });
    cabe(ap, maxW);
    K(ap, "transform/opacity", [[e + 0.45, 0], [e + 0.75, 100]]);
    if (!ultimo) {
      K(tt, "transform/opacity", [[b - 0.3, 100], [b - 0.05, 0]], "io");
      K(ap, "transform/opacity", [[b - 0.3, 100], [b - 0.05, 0]], "io");
    }
    timing(tt, e, ultimo ? null : b); timing(ap, e, ultimo ? null : b);
  }
  // pontos de progresso
  var py = Y(0.965), gap = 58;
  for (i = 0; i < 6; i++) {
    var px = cx + (i - 2.5) * gap;
    circle(px, py, 22, { fill: NAVY3, name: "ponto base " + (i + 1) });
    var on = circle(px, py, 28, { fill: GOLD, name: "ponto " + (i + 1) });
    var ta = T0 + i * PASSO + 0.2;
    K(on, "transform/scale", [[ta, [0, 0, 100]], [ta + 0.25, [125, 125, 100]], [ta + 0.4, [100, 100, 100]]]);
    timing(on, ta, null);
  }

  // ---- Quadro 4 (17–20 s): preço + oferta
  var q4 = comp("Q4 oferta" + sfx);
  oferta(17.02, "R$ 249 por mês · até 250 alunos");

  montar("V7_" + fmt, [{ c: q1, tout: 2.55 }, { c: q2, tin: B, tout: 5.4 }, { c: q3, tin: T0, tout: 16.75, d: 0.25 }, { c: q4, tin: 17.0 }]);
}
build("9x16");
build("4x5");
salvar("v7-tudo-num-app");

// V2 "Adeus, grupo de mensagens" — 18 s. Gera as comps V2_9x16 e V2_4x5.
// Sem marca de aplicativo de mensagens: balões genéricos em cinza/azulado.
$.evalFile(new File("/home/gutto/DDEV/agathas-dev/criativos/salomao-2026-11-effectcraft/projetos/lib.jsx"));
$.evalFile(new File("/home/gutto/DDEV/agathas-dev/criativos/salomao-2026-11-effectcraft/projetos/icons.jsx"));
DUR = 18;
var FRASES = ["Bom dia!", "Alguém sabe se tem aula?", "Qual o valor do passeio?", "kkkk", "Bom dia, grupo", "Que horas é a saída?",
  "Obrigada!", "Alguém achou um casaco azul?", "Bom dia!!", "É amanhã a reunião?", "kkkkkk", "Qual a lição de hoje?",
  "Boa tarde", "Alguém tem o cardápio?", "Bom diaaa", "Tem aula sexta?", "Amém"];

// balão genérico: texto + fundo, centrado em x conforme o lado. devolve o null controlador (já na posição final)
function balao(str, lado, y, cor, corTxt, tam, h, jit) {
  var b = rect(0, 0, 100, h, { fill: cor, r: h * 0.42, name: "fundo balão" });
  var t = text(str, 0, 0, { size: tam, style: "SemiBold", fill: corTxt, name: str });
  var w = textW(t) + tam * 1.5;
  var x = lado < 0 ? FMT.mx - 30 + w / 2 + jit : FMT.W - FMT.mx + 30 - w / 2 - jit;
  if (lado == 0) x = FMT.cx;
  var n = nullAt(x, y, "balão · " + str);
  set(b, "contents/group/contents/rect/size", [w, h]);
  pos(b, x, y); pos(t, x, y + tam * 0.35);
  parent(b, n); parent(t, n);
  return n;
}
function cai(n, t, y, rot) {
  var p = getPos(n);
  K(n, "transform/position", [[t, [p[0], -160, 0]], [t + 0.45, [p[0], y, 0]]], "in");
  K(n, "transform/scale", [[t + 0.45, [100, 100, 100]], [t + 0.53, [105, 90, 100]], [t + 0.68, [100, 100, 100]]], "io");
  set(n, "transform/rotation", rot);
  timing(n, t, null);
}

function build(fmt) {
  setFmt(fmt);
  var cx = FMT.cx, W = FMT.W, H = FMT.H, sfx = "_" + fmt, i;

  // ---- Quadros 1 e 2 (0–5 s): balões caem e empilham; o aviso afunda
  var q1 = comp("Q1 balões" + sfx);
  var rowH = 124, N = Math.ceil((H + 40) / rowH), dt = 2.25 / N;
  for (i = 0; i < N; i++) {
    var lado = (i % 2 == 0) ? -1 : 1;
    var n = balao(FRASES[i % FRASES.length], lado, H - 70 - i * rowH, lado < 0 ? GRAY : "#dbe4f6", INK, 46, 104, (i * 37) % 90);
    cai(n, 0.08 + i * dt, H - 70 - i * rowH, ((i * 7) % 5) - 2);
  }
  // o aviso, pequeno e em vermelho, cai no meio…
  var ay = H * 0.47;
  var av = balao("AVISO: passeio na sexta", 0, ay, RED, WHITE, 40, 92, 0);
  cai(av, 3.0, ay, -2);
  // …e afunda: encolhe, escurece e é coberto por novas mensagens
  K(av, "transform/scale", [[3.9, [100, 100, 100]], [4.9, [80, 80, 100]]], "io");
  K(av, "transform/opacity", [[3.9, 100], [4.9, 45]], "io");
  var extra = [["Bom dia!!!", -1, -86], ["kkkkk", 1, 22], ["Alguém sabe do uniforme?", -1, 90], ["Boa tarde, grupo", 1, 150]];
  for (i = 0; i < extra.length; i++) {
    var e = balao(extra[i][0], extra[i][1], ay + extra[i][2], i % 2 ? "#dbe4f6" : GRAY, INK, 46, 104, 140 - i * 30);
    cai(e, 3.65 + i * 0.26, ay + extra[i][2], (i % 2 ? 3 : -3));
  }

  // ---- Quadro 3 (5–7 s): tudo é varrido; frase
  var q3 = comp("Q3 frase" + sfx);
  var f = text("O seu aviso não precisa\ndisputar atenção.", cx, Y(0.47), { size: ut(76), leading: ut(98), name: "frase" });
  run("layer.setText", { layer: f, range: [24, 41], fill: GOLD });
  textIn(f, 5.45, 0.8);

  // ---- Quadro 4 (7–11 s): celular + notificação do app
  var tela = comp("Tela app" + sfx, 780, 1560);
  rect(390, 780, 780, 1560, { fill: GRAY, r: 0, name: "fundo tela" });
  // captura atual do app dos pais (interface de 12/11): só o cabeçalho e o 1º aviso; o resto é desenhado em vetor
  image("app-avisos-lista.png", 390, 1100 + 70, 100, "tela real do app (topo)");
  rect(390, 70 + 728 + 500, 780, 1000, { fill: GRAY, r: 0, name: "cobre o resto da captura" });
  rect(390, 35, 780, 72, { fill: NAVY, r: 0, name: "barra de status" });
  var cy0 = 70 + 742 + 165;
  rect(390, cy0, 712, 330, { fill: WHITE, r: 30, stroke: GOLD, sw: 4, name: "cartão passeio" });
  text("FIXADO · PASSEIO", 76, cy0 - 100, { size: 24, style: "SemiBold", justify: "left", fill: "#6b7280", tracking: 20, name: "etiqueta" });
  text("até 16/11", 704, cy0 - 100, { size: 24, style: "Regular", justify: "right", fill: GRAY3, name: "validade" });
  text("Passeio ao zoológico", 76, cy0 - 42, { size: 36, justify: "left", fill: INK, name: "título do aviso" });
  text("Sexta-feira, saída às 8h e volta às 12h.\nLevar lanche, água e boné.", 76, cy0 + 16, { size: 28, style: "Regular", justify: "left", fill: "#4b5568", leading: 44, name: "texto do aviso" });
  text("Toque para abrir", 76, cy0 + 118, { size: 24, style: "SemiBold", justify: "left", fill: INK, name: "toque para abrir" });
  for (i = 0; i < 2; i++) {
    var ly = cy0 + 165 + 30 + 80 + i * 180;
    rect(390, ly, 712, 160, { fill: WHITE, r: 30, name: "aviso " + (i + 3) });
    circle(110, ly, 64, { fill: "#e5e7eb", name: "bolinha" });
    rect(380, ly - 22, 400, 24, { fill: "#4b5568", r: 12, name: "linha título" });
    rect(330, ly + 24, 300, 18, { fill: GRAY2, r: 9, name: "linha texto" });
  }
  var q4 = comp("Q4 notificação" + sfx);
  var cap = text("Chega direto no celular", cx, Y(0.07), { size: ut(62), name: "legenda" });
  slideIn(cap, 7.2, 0, 40, 0.5);
  var ps = u(86), fy = Y(0.17) + 1560 * ps / 200;
  var fone = celular(tela, cx, fy, 780, 1560, "celular");
  set(fone, "transform/scale", [ps, ps, 100]);
  K(fone, "transform/position", [[7.0, [cx, fy + H * 0.7, 0]], [7.7, [cx, fy, 0]]]);
  K(fone, "transform/rotation", [[7.0, 8], [7.7, 0]]);
  // notificação ampliada
  var ny = Y(0.17) + u(330), nw = 900, nh = ut(210);
  var nn = nullAt(cx, ny, "notificação ctrl");
  var card = rect(cx, ny, nw, nh, { fill: WHITE, r: 44, name: "cartão notificação" }); shadow(card, 22, 70, 45);
  var tile = rect(cx - nw / 2 + ut(110), ny, ut(120), ut(120), { fill: NAVY, r: 30, name: "ícone fundo" });
  var meg = icon("megaphone", cx - nw / 2 + ut(110), ny, ut(70), GOLD, 2);
  var n1 = text("Passeio ao zoológico", cx - nw / 2 + ut(200), ny - ut(8), { size: ut(50), justify: "left", fill: INK, name: "título notificação" });
  var n2 = text("sexta, 8h", cx - nw / 2 + ut(200), ny + ut(52), { size: ut(36), style: "Regular", justify: "left", fill: "#5b6478", name: "detalhe notificação" });
  parent(card, nn); parent(tile, nn); parent(meg, nn); parent(n1, nn); parent(n2, nn);
  K(nn, "transform/position", [[8.0, [cx, -nh, 0]], [8.55, [cx, ny + 24, 0]], [8.75, [cx, ny, 0]]]);
  K(meg, "transform/rotation", [[8.7, 0], [8.85, -16], [9.0, 12], [9.15, -8], [9.3, 0]], "io");
  // toque na notificação → selo "Aviso aberto e lido" (a leitura é automática ao abrir; não há botão de confirmar)
  K(nn, "transform/scale", [[9.5, [100, 100, 100]], [9.62, [96, 96, 100]], [9.8, [100, 100, 100]]], "io");
  var toque = circle(cx + ut(150), ny + 10, ut(170), { fill: GOLD, name: "toque" });
  K(toque, "transform/scale", [[9.45, [0, 0, 100]], [9.95, [170, 170, 100]]]);
  K(toque, "transform/opacity", [[9.45, 70], [9.95, 0]]);
  timing(toque, 9.45, 10.0);
  var byy = ny + nh / 2 + ut(95), bw = ut(600), bh = ut(104);
  var b2 = rect(cx, byy, bw, bh, { fill: GREEN, r: bh / 2, name: "selo lido" });
  var b2t = text("Aviso aberto e lido", cx + ut(34), byy + ut(15), { size: ut(42), style: "SemiBold", name: "Aviso aberto e lido" });
  var b2c = check(cx - ut(235), byy, ut(44), WHITE, ut(8));
  parent(b2t, b2); parent(b2c, b2);
  shadow(b2, 14, 40, 40);
  timing(b2, 9.8, null); timing(b2t, 9.8, null); timing(b2c, 9.8, null);
  K(b2, "transform/scale", [[9.8, [0, 0, 100]], [10.05, [108, 108, 100]], [10.2, [100, 100, 100]]]);
  draw(b2c, 10.0, 0.3);

  // ---- Quadro 5 (11–15 s): 92% · 23 de 25 famílias leram
  var D = 120, G = 34;
  var fam = comp("Família" + sfx, D, D);
  circle(D / 2, D / 2, D - 4, { fill: NAVY3, stroke: "#44557d", sw: 3, name: "avatar" });
  icon("user", D / 2, D / 2, 64, GRAY2, 2);
  var lido = comp("Leu" + sfx, D, D);
  circle(D / 2, D / 2, D - 4, { fill: GOLD, name: "leu" });
  icon("check", D / 2, D / 2 + 2, 72, INK, 3);
  var q5 = comp("Q5 leitura" + sfx);
  var pct = text("92%", cx, Y(0.115), { size: u(170), fill: GOLD, name: "92%" });
  try { run("prop.setExpression", { layer: pct, path: "text/sourceText", expression: "Math.round(ease(time, 11.35, 13.1, 0, 92)) + '%'" }); } catch (e) { writeLn("sem contador: " + e); }
  fadeIn(pct, 11.15, 0.3);
  var barW = 860, barH = u(40), barY = Y(0.19);
  rect(cx, barY, barW, barH, { fill: NAVY3, r: barH / 2, name: "trilho" });
  var bar = rect(cx - barW / 2, barY, barH, barH, { fill: GOLD, r: barH / 2, name: "progresso" });
  K(bar, "contents/group/contents/rect/size", [[11.35, [barH, barH]], [13.1, [barW * 0.92, barH]]], "io");
  K(bar, "contents/group/contents/rect/position", [[11.35, [barH / 2, 0]], [13.1, [barW * 0.46, 0]]], "io");
  var lg = text("23 de 25 famílias leram", cx, Y(0.305), { size: ut(64), name: "23 de 25" });
  textIn(lg, 11.6, 0.7);
  var k = u(1), step = (D + G) * k, gx = cx - 2 * step, gy = Y(0.42);
  var naoLeu = { 13: 1, 21: 1 }, ordem = 0;
  for (i = 0; i < 25; i++) {
    var x = gx + (i % 5) * step, y = gy + Math.floor(i / 5) * step;
    var a = place(fam, x, y, 100 * k, "família " + (i + 1));
    popIn(a, 11.2 + (i % 5) * 0.04 + Math.floor(i / 5) * 0.05, 100 * k, 0.4);
    if (naoLeu[i]) { K(a, "transform/opacity", [[13.2, 100], [13.6, 45]], "io"); continue; }
    var c = place(lido, x, y, 100 * k, "leu " + (i + 1));
    var tc = 11.75 + ordem * 0.058; ordem++;
    timing(c, tc, null);
    K(c, "transform/scale", [[tc, [0, 0, 100]], [tc + 0.2, [116 * k, 116 * k, 100]], [tc + 0.32, [100 * k, 100 * k, 100]]]);
  }

  // ---- Quadro 6 (15–18 s): marca + oferta
  var q6 = comp("Q6 oferta" + sfx);
  oferta(15.05, "Saiba quem abriu e leu cada aviso");

  var r = montar("V2_" + fmt, [{ c: q1 }, { c: q3, tin: 5.2, tout: 6.75 }, { c: q4, tin: 7.0, tout: 10.75 }, { c: q5, tin: 11.0, tout: 14.75 }, { c: q6, tin: 15.0 }]);
  // varredura: uma faixa dourada empurra a conversa para fora
  var chat = r.ls[0];
  K(chat, "transform/position", [[4.95, [cx, H / 2, 0]], [5.5, [cx + W * 1.6, H / 2 - 60, 0]]], "in");
  K(chat, "transform/rotation", [[4.95, 0], [5.5, 7]], "in");
  timing(chat, null, 5.55);
  var rodo = rect(-300, H / 2, 150, H * 1.6, { fill: GOLD, r: 75, name: "faixa que varre" });
  set(rodo, "transform/rotation", 7);
  K(rodo, "transform/position", [[4.95, [-260, H / 2, 0]], [5.5, [W * 1.6 - W / 2 - 150, H / 2, 0]], [5.62, [W * 1.9, H / 2, 0]]], "in");
  timing(rodo, 4.9, 5.7); mblur(rodo); mblur(chat);
}
build("9x16");
build("4x5");
salvar("v2-adeus-grupo");

// V4 "Antes × depois da saída" — 15 s. Gera as comps V4_9x16 e V4_4x5.
// O quadro do contador "de 12 min para 3 min" foi trocado por "Saída organizada, com registro de quem buscou"
// (não há número medido). Os nomes da lista são fictícios.
$.evalFile(new File("/home/gutto/DDEV/agathas-dev/criativos/salomao-2026-11-effectcraft/projetos/lib.jsx"));
$.evalFile(new File("/home/gutto/DDEV/agathas-dev/criativos/salomao-2026-11-effectcraft/projetos/icons.jsx"));
DUR = 15;
var CINZA_BG = "#3b3e45", CINZA_1 = "#565a63", CINZA_2 = "#b9bcc4";

function selo(str, y, fill, cor, t) {
  var w = ut(str.length * 40 + 130), h = ut(100);
  var b = rect(FMT.cx, y, w, h, { fill: fill, r: h / 2, name: "selo " + str });
  var tx = text(str, FMT.cx, y + ut(18), { size: ut(52), fill: cor, tracking: 120, name: str });
  parent(tx, b); popIn(b, t, 100, 0.45); return b;
}

function build(fmt) {
  setFmt(fmt);
  var cx = FMT.cx, W = FMT.W, H = FMT.H, sfx = "_" + fmt, i, maxW = W - 2 * FMT.mx;
  // três blocos empilhados e centrados: disco com ícone em cima, frase embaixo
  var D = u(196), rows = [Y(0.28), Y(0.58), Y(0.88)], dyD = -u(98), dyT = u(86);

  // ---- Quadro 1 (0–5 s): ANTES, em tons de cinza
  var q1 = comp("Q1 antes" + sfx);
  rect(cx, H / 2, W + 4, H + 4, { fill: CINZA_BG, r: 0, name: "fundo cinza" });
  selo("ANTES", Y(0.035), CINZA_2, CINZA_BG, 0.15);
  var antes = [["car", "Fila"], ["megaphone", "Grito no portão"], ["clock", "Entrega sem registro"]];
  for (i = 0; i < 3; i++) {
    var t = 0.5 + i * 0.75, y = rows[i] + dyD;
    var g = nullAt(cx, y, "antes " + (i + 1));
    var c = circle(cx, y, D, { fill: CINZA_1, name: "disco" });
    var ic = icon(antes[i][0], cx, y, D * 0.52, CINZA_2, 2);
    parent(c, g); parent(ic, g);
    // marca de problema (vermelho) — presa ao disco antes de animar
    var xb = circle(cx + D * 0.36, y - D * 0.36, D * 0.36, { fill: RED, name: "problema" });
    var xi = icon("x", cx + D * 0.36, y - D * 0.36, D * 0.24, WHITE, 3.2);
    parent(xi, xb);
    popIn(g, t, 100, 0.45);
    treme(g, t + 0.5, 4.6, i == 1 ? 7 : 5);
    var tt = text(antes[i][1], cx, rows[i] + dyT, { size: ut(72), fill: "#e6e7ea", name: antes[i][1] });
    cabe(tt, maxW);
    slideIn(tt, t + 0.15, 0, 40, 0.5);
    popIn(xb, 2.9 + i * 0.3, 100, 0.4);
  }

  // ---- Quadro 2 (5–10 s): DEPOIS, em azul e dourado
  var q2 = comp("Q2 depois" + sfx);
  selo("DEPOIS", Y(0.035), GOLD, INK, 5.35);
  var depois = [["smartphone", "Cheguei no app"], ["tv", "A TV chama"], ["check", "Saída registrada"]];
  for (i = 0; i < 3; i++) {
    var t2 = 5.7 + i * 1.05, y2 = rows[i] + dyD;
    var g2 = nullAt(cx, y2, "depois " + (i + 1));
    var c2 = circle(cx, y2, D, { fill: GOLD, name: "disco" });
    var ic2 = icon(depois[i][0], cx, y2, D * 0.52, NAVY, i == 2 ? 3 : 2);
    parent(c2, g2); parent(ic2, g2);
    shadow(c2, 14, 50, 35);
    popIn(g2, t2, 100, 0.5);
    anel(cx, y2, D, t2 + 0.3);
    var t3 = text(depois[i][1], cx, rows[i] + dyT, { size: ut(72), name: depois[i][1] });
    cabe(t3, maxW);
    slideIn(t3, t2 + 0.15, 0, 40, 0.5);
    if (i < 2) {   // seta para o passo seguinte
      var sy = (rows[i] + dyT + u(22) + rows[i + 1] + dyD - D / 2) / 2;
      var seta = icon("arrow-down", cx, sy, u(46), GOLD, 3);
      slideIn(seta, t2 + 0.75, 0, -30, 0.4);
    }
  }

  // ---- Quadro 3 (10–12,7 s): saída organizada, com registro
  var q3 = comp("Q3 registro" + sfx);
  var h1 = text("Saída organizada,", cx, Y(0.1), { size: ut(88), name: "Saída organizada," });
  cabe(h1, maxW);
  textIn(h1, 10.2, 0.45);
  var h2 = text("com registro de quem buscou", cx, Y(0.1) + ut(92), { size: ut(58), style: "SemiBold", fill: GOLD, name: "com registro" });
  cabe(h2, maxW);
  slideIn(h2, 10.55, 0, 30, 0.45);
  var lista = [["Lia · 2º ano", "12:02", "Mãe"], ["Davi · 4º ano", "12:04", "Avô"], ["Nina · 1º ano", "12:05", "Pai"]];
  var rh = u(220), top = Y(0.42);
  for (i = 0; i < 3; i++) {
    var ry = top + i * (rh + u(30)), ta = 10.75 + i * 0.22, cw = maxW;
    var card = rect(cx, ry, cw, rh, { fill: WHITE, r: 40, name: "linha " + (i + 1) });
    var nm = text(lista[i][0], cx - cw / 2 + 54, ry - u(8), { size: ut(58), justify: "left", fill: INK, name: lista[i][0] });
    var dt = text("Buscado por: " + lista[i][2] + " · " + lista[i][1], cx - cw / 2 + 54, ry + u(62), { size: ut(40), style: "Regular", justify: "left", fill: "#5b6478", name: "detalhe " + (i + 1) });
    var ok = circle(cx + cw / 2 - 105, ry, u(110), { fill: GREEN, name: "ok " + (i + 1) });
    var ck = check(cx + cw / 2 - 105, ry, u(60), WHITE, u(10));
    parent(nm, card); parent(dt, card); parent(ok, card); parent(ck, card);
    shadow(card, 14, 50, 35);
    slideIn(card, ta, 0, 120, 0.5);
    // opacidade não é herdada do pai: os filhos recebem o mesmo fade
    fadeIn(nm, ta, 0.3); fadeIn(dt, ta, 0.3); fadeIn(ok, ta, 0.3);
    draw(ck, ta + 0.5, 0.3);
  }
  ilustrativa(10.9, "Imagem ilustrativa · nomes fictícios");

  // ---- Quadro 4 (12,7–15 s): marca + oferta
  var q4 = comp("Q4 oferta" + sfx);
  oferta(12.75, "Portaria com TV");

  var r = montar("V4_" + fmt, [{ c: q2, tin: 5.0, tout: 9.75 }, { c: q3, tin: 10.0, tout: 12.45 }, { c: q4, tin: 12.7 }, { c: q1 }]);
  // cortina: uma faixa dourada empurra o "antes" para a esquerda e revela o "depois"
  var a1 = r.ls[3];
  K(a1, "transform/position", [[4.85, [cx, H / 2, 0]], [5.45, [cx - W - 140, H / 2, 0]]], "io");
  timing(a1, null, 5.5);
  var faixa = rect(W + 60, H / 2, 120, H + 40, { fill: GOLD, r: 0, name: "cortina" });
  K(faixa, "transform/position", [[4.85, [W + 60, H / 2, 0]], [5.45, [-80, H / 2, 0]]], "io");
  timing(faixa, 4.8, 5.5); mblur(faixa); mblur(a1);
}
build("9x16");
build("4x5");
salvar("v4-antes-depois-saida");

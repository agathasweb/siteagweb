// V6 "O app é da sua escola" — 15 s. Gera as comps V6_9x16 e V6_4x5.
// As três escolas são fictícias (nomes genéricos, só para ilustrar a troca de marca).
$.evalFile(new File("/home/gutto/DDEV/agathas-dev/criativos/salomao-2026-11-effectcraft/projetos/lib.jsx"));
$.evalFile(new File("/home/gutto/DDEV/agathas-dev/criativos/salomao-2026-11-effectcraft/projetos/icons.jsx"));
DUR = 15;
var SW = 780, SH = 1560;
var ESCOLAS = [
  { nome: "Colégio Vila Aurora", curto: "Vila Aurora", cor: "#c2410c", claro: "#ffedd5", ic: "sun", t: 3.3 },
  { nome: "Escola Ipê Dourado", curto: "Ipê Dourado", cor: "#15803d", claro: "#dcfce7", ic: "tree-deciduous", t: 5.1 },
  { nome: "Instituto Sabiá", curto: "Sabiá", cor: "#6d28d9", claro: "#ede9fe", ic: "bird", t: 6.9 }
];

// "roupa" do app: cabeçalho, cartão de destaque, lista e barra inferior nas cores da escola
function roupa(nome, titulo, cor, claro, ic, sfx) {
  var c = comp("App · " + titulo + sfx, SW, SH), i;
  rect(SW / 2, SH / 2, SW, SH, { fill: GRAY, r: 0, name: "fundo" });
  rect(SW / 2, 135, SW, 270, { fill: cor, r: 0, name: "cabeçalho" });
  circle(120, 175, 116, { fill: WHITE, name: "logo fundo" });
  icon(ic, 120, 175, 70, cor, 2.2);
  text(titulo, 205, 192, { size: 46, justify: "left", name: "nome da escola" });
  rect(SW / 2, 440, 700, 250, { fill: cor, r: 40, name: "destaque" });
  text("Avisos da escola", 100, 425, { size: 46, justify: "left", name: "título destaque" });
  rect(250, 480, 300, 22, { fill: WHITE, r: 11, op: 55, name: "linha" });
  for (i = 0; i < 3; i++) {
    var y = 720 + i * 235;
    rect(SW / 2, y, 700, 205, { fill: WHITE, r: 34, name: "cartão " + (i + 1) });
    circle(120, y, 96, { fill: claro, name: "bolinha" });
    icon(["calendar", "book-open", "utensils"][i], 120, y, 52, cor, 2.2);
    rect(390, y - 28, 380, 26, { fill: "#4b5568", r: 13, name: "linha título" });
    rect(340, y + 26, 280, 20, { fill: GRAY2, r: 10, name: "linha texto" });
  }
  rect(SW / 2, SH - 85, SW, 170, { fill: WHITE, r: 0, name: "barra inferior" });
  var tabs = ["house", "book-open", "utensils", "megaphone"];
  for (i = 0; i < 4; i++) icon(tabs[i], 110 + i * 187, SH - 95, 60, i == 3 ? cor : GRAY3, 2.2);
  return c;
}

function build(fmt) {
  setFmt(fmt);
  var cx = FMT.cx, W = FMT.W, H = FMT.H, sfx = "_" + fmt, i;

  var rGen = roupa("gen", "Outra Empresa App", "#8b93a5", "#e5e7eb", "smartphone", sfx);
  var rs = [];
  for (i = 0; i < 3; i++) rs.push(roupa("e" + i, ESCOLAS[i].nome, ESCOLAS[i].cor, ESCOLAS[i].claro, ESCOLAS[i].ic, sfx));

  // ícone do app da escola (para a tela inicial)
  var E = ESCOLAS[2];
  var ico = comp("Ícone do app" + sfx, 300, 300);
  rect(150, 150, 296, 296, { fill: E.cor, r: 68, name: "ícone fundo" });
  icon(E.ic, 150, 150, 170, WHITE, 2);

  // tela inicial do celular
  var home = comp("Tela inicial" + sfx, SW, SH);
  rect(SW / 2, SH / 2, SW, SH, { fill: "#101827", r: 0, name: "papel de parede" });
  var gl = circle(SW * 0.7, SH * 0.3, 900, { fill: "#24365f", name: "brilho" });
  set(gl, run("effect.apply", { effect: "Gaussian Blur", layers: [gl] }).paths[0] + "/blurriness", 160);
  text("09:41", SW / 2, 250, { size: 120, style: "SemiBold", name: "hora" });
  var cols = 4, gx = 120, gap = 180, gy = 470, slot = 5;
  for (i = 0; i < 20; i++) {
    if (i == slot) continue;
    rect(gx + (i % cols) * gap, gy + Math.floor(i / cols) * 215, 132, 132, { fill: "#33415f", r: 32, name: "app " + (i + 1) });
    rect(gx + (i % cols) * gap, gy + Math.floor(i / cols) * 215 + 92, 86, 14, { fill: "#33415f", r: 7, name: "rótulo" });
  }
  var sx = gx + (slot % cols) * gap, sy = gy + Math.floor(slot / cols) * 215;
  var lb = text(E.curto, sx, sy + 104, { size: 26, style: "SemiBold", name: "rótulo do app" });
  fadeIn(lb, 10.75, 0.3);
  var ai = place(ico, SW / 2, SH * 0.5, 100, "app da escola");
  K(ai, "transform/scale", [[9.55, [0, 0, 100]], [9.95, [150, 150, 100]], [10.25, [140, 140, 100]], [10.75, [44, 44, 100]]], "io");
  K(ai, "transform/position", [[10.25, [SW / 2, SH * 0.5, 0]], [10.75, [sx, sy, 0]]], "io");
  K(ai, "transform/rotation", [[9.55, -20], [9.95, 0]]);
  shadow(ai, 20, 60, 50);
  var halo = circle(sx, sy, 150, { nofill: true, stroke: GOLD, sw: 8, name: "halo" });
  K(halo, "transform/scale", [[10.75, [80, 80, 100]], [11.4, [210, 210, 100]]]);
  K(halo, "transform/opacity", [[10.75, 100], [11.4, 0]]);
  timing(halo, 10.75, 11.45);

  // conteúdo da tela: as roupas entram deslizando
  var tela = comp("Tela (conteúdo)" + sfx, SW, SH);
  place(rGen, SW / 2, SH / 2, 100, "app genérico");
  for (i = 0; i < 3; i++) {
    var l = place(rs[i], SW / 2, SH / 2, 100, ESCOLAS[i].nome);
    K(l, "transform/position", [[ESCOLAS[i].t, [SW * 1.5 + 20, SH / 2, 0]], [ESCOLAS[i].t + 0.5, [SW / 2, SH / 2, 0]]], "io");
    timing(l, ESCOLAS[i].t, null); mblur(l);
  }
  var hl = place(home, SW / 2, SH / 2, 100, "tela inicial");
  K(hl, "transform/position", [[9.0, [SW / 2, SH * 1.5 + 20, 0]], [9.5, [SW / 2, SH / 2, 0]]], "io");
  timing(hl, 9.0, null);

  // ---- celular (0–12 s)
  var qc = comp("Celular" + sfx);
  var ps = u(80), fy = Y(0.25) + SH * ps / 200;
  for (i = 0; i < 3; i++) {
    var g = circle(cx, fy - u(200), u(1000), { fill: ESCOLAS[i].cor, name: "luz " + ESCOLAS[i].nome });
    set(g, run("effect.apply", { effect: "Gaussian Blur", layers: [g] }).paths[0] + "/blurriness", 170);
    var t1 = ESCOLAS[i].t, t2 = (i < 2 ? ESCOLAS[i + 1].t : 9.0);
    K(g, "transform/opacity", [[t1, 0], [t1 + 0.5, 60], [t2, 60], [t2 + 0.5, 0]], "io");
    timing(g, t1, t2 + 0.55);
  }
  var fone = celular(tela, cx, fy, SW, SH, "celular");
  set(fone, "transform/scale", [ps, ps, 100]);
  K(fone, "transform/position", [[0.05, [cx, fy + H * 0.75, 0]], [0.75, [cx, fy, 0]]]);
  var sk = [[0.05, [ps, ps, 100]]];
  for (i = 0; i < 3; i++) { var tt = ESCOLAS[i].t; sk.push([tt, [ps, ps, 100]]); sk.push([tt + 0.22, [ps * 1.05, ps * 1.05, 100]]); sk.push([tt + 0.55, [ps, ps, 100]]); }
  K(fone, "transform/scale", sk, "io");
  K(fone, "transform/rotation", [[0.05, -7], [0.75, 0], [3.3, 0], [3.55, 2.5], [3.9, 0], [5.1, 0], [5.35, -2.5], [5.7, 0], [6.9, 0], [7.15, 2.5], [7.5, 0]], "io");

  // ---- textos
  var t1c = comp("T1 pergunta" + sfx);
  var a = text("App com a marca\nde outra empresa?", cx, Y(0.055), { size: ut(74), leading: ut(92), name: "pergunta" });
  textIn(a, 0.35, 0.8);
  var t2c = comp("T2 sua escola" + sfx);
  var b = text("Nome, logo e cores\nda sua escola", cx, Y(0.055), { size: ut(74), leading: ut(92), name: "frase" });
  run("layer.setText", { layer: b, range: [22, 25], fill: GOLD });
  textIn(b, 3.25, 0.7);
  var av = text("Escolas fictícias · imagem ilustrativa", cx, Y(0.055) + ut(92) + ut(62), { size: 26, style: "Regular", fill: GRAY3, name: "aviso ilustrativo" });
  fadeIn(av, 3.6, 0.4, 85);
  var t3c = comp("T3 todos usam" + sfx);
  var c3 = text("Pais, professores e equipe\nusam o app da escola", cx, Y(0.055), { size: ut(66), leading: ut(86), name: "frase" });
  textIn(c3, 9.2, 0.8);

  // ---- oferta (12–15 s)
  var q4 = comp("Q4 oferta" + sfx);
  oferta(12.05, "Feito com Salomão · já vem incluso");

  montar("V6_" + fmt, [{ c: qc, tout: 11.7 }, { c: t1c, tout: 2.85 }, { c: t2c, tin: 3.15, tout: 8.75 }, { c: t3c, tin: 9.05, tout: 11.7 }, { c: q4, tin: 12.0 }]);
}
build("9x16");
build("4x5");
salvar("v6-app-da-escola");

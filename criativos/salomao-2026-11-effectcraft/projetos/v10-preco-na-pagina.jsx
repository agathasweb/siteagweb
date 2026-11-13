// V10 "O preço está na página" — 12 s. Gera as comps V10_9x16 e V10_4x5.
$.evalFile(new File("/home/gutto/DDEV/agathas-dev/criativos/salomao-2026-11-effectcraft/projetos/lib.jsx"));
$.evalFile(new File("/home/gutto/DDEV/agathas-dev/criativos/salomao-2026-11-effectcraft/projetos/icons.jsx"));
DUR = 12;

function build(fmt) {
  setFmt(fmt);
  var cx = FMT.cx, sfx = "_" + fmt, maxW = FMT.W - 2 * FMT.mx;

  // ---- Quadro 1 (0–3 s): interrogação gigante + pergunta
  var q1 = comp("Q1 pergunta" + sfx);
  var qy = Y(0.33);
  var anel = circle(cx, qy, u(760), { nofill: true, stroke: GOLD, sw: 6, name: "anel", op: 35 });
  K(anel, "transform/scale", [[0.05, [40, 40, 100]], [0.9, [100, 100, 100]]]);
  K(anel, "transform/scale", [[0.9, [100, 100, 100]], [3.2, [108, 108, 100]]], "lin");
  fadeIn(anel, 0.05, 0.5, 35);
  var piv = nullAt(cx, qy, "pivô ?");
  var q = text("?", cx, qy + u(232), { size: u(660), style: "Bold", fill: GOLD, name: "?" });
  parent(q, piv);
  popIn(piv, 0.1, 100, 0.6);
  K(piv, "transform/rotation", [[0.1, -25], [0.7, 6], [1.5, -4], [2.4, 3], [3.2, 0]], "io");
  var h = text("Quanto custa um sistema\npara a sua escola?", cx, Y(0.86), { size: ut(78), leading: ut(98), name: "pergunta" });
  cabe(h, maxW);
  textIn(h, 0.55, 0.9);

  // ---- Quadro 2 (3–6 s): balão riscado
  var q2 = comp("Q2 reunião" + sfx);
  var by = Y(0.27), bw = 900, bh = u(380);
  var grp = nullAt(cx, by, "balão ctrl");
  var bal = rect(cx, by, bw, bh, { fill: GRAY, r: u(80), name: "balão" });
  var rabo = path(cx - 250, by + bh / 2 - 4, [[-55, 0], [70, 0], [-80, u(105)]], { fill: GRAY, closed: true, name: "rabo do balão" });
  var bt = text("Agende uma reunião\npara saber…", cx, by - u(14), { size: ut(68), style: "SemiBold", fill: INK, leading: ut(90), name: "texto balão" });
  parent(bal, grp); parent(rabo, grp); parent(bt, grp);
  var r1 = path(cx, by - ut(38), [[-ut(372), 6], [ut(372), -6]], { stroke: RED, sw: 16, trim: true, name: "risco 1" });
  var r2 = path(cx, by + ut(52), [[-ut(245), 6], [ut(245), -6]], { stroke: RED, sw: 16, trim: true, name: "risco 2" });
  parent(r1, grp); parent(r2, grp);
  popIn(grp, 3.1, 100, 0.55);
  K(grp, "transform/rotation", [[3.1, 6], [3.65, 0]]);
  draw(r1, 3.75, 0.3); draw(r2, 4.0, 0.25);
  K(grp, "transform/rotation", [[4.25, 0], [4.65, -5]], "io");
  K(grp, "transform/scale", [[4.25, [100, 100, 100]], [4.65, [90, 90, 100]]], "io");
  K(bal, "transform/opacity", [[4.25, 100], [4.65, 60]], "io");
  K(rabo, "transform/opacity", [[4.25, 100], [4.65, 60]], "io");
  var h2 = text("A maioria só diz\ndepois da reunião.", cx, Y(0.8), { size: ut(84), leading: ut(106), name: "frase" });
  cabe(h2, maxW);
  textIn(h2, 4.15, 0.7);

  // ---- Quadro 3 (6–9,2 s): o preço entra já como R$ 249 (sem contagem: quem pausa nunca vê outro valor)
  var q3 = comp("Q3 preço" + sfx);
  var kick = text("O PREÇO ESTÁ NA PÁGINA", cx, Y(0.04), { size: ut(50), style: "SemiBold", fill: WHITE, tracking: 60, name: "chamada" });
  cabe(kick, maxW);
  slideIn(kick, 6.1, 0, -40, 0.5);
  var py = Y(0.5), ns = 480;
  var pp = nullAt(cx, py, "preço ctrl");
  var num = text("249", cx, py + ns * 0.35, { size: ns, style: "Bold", fill: GOLD, name: "249", tracking: -20 });
  var wN = textW(num);
  var rs = text("R$", cx - wN / 2 + 6, py - ns * 0.35 - 44, { size: 130, style: "SemiBold", fill: WHITE, justify: "left", name: "R$" });
  var pm = text("por mês", cx, py + ns * 0.35 + 150, { size: 112, style: "SemiBold", fill: WHITE, name: "por mês" });
  parent(num, pp); parent(rs, pp); parent(pm, pp);
  // "249" ocupa a largura útil (a largura medida não inclui a folga do glifo: margem de 6%); no 4:5 a altura limita
  var s0 = Math.min(maxW * 0.94 / wN, FMT.name == "4x5" ? 0.82 : 9) * 100;
  K(pp, "transform/scale", [[6.15, [s0 * 0.25, s0 * 0.25, 100]], [6.75, [s0 * 1.07, s0 * 1.07, 100]], [7.0, [s0, s0, 100]]]);
  K(pp, "transform/scale", [[7.0, [s0, s0, 100]], [9.3, [s0 * 1.02, s0 * 1.02, 100]]], "lin");
  fadeIn(num, 6.15, 0.2); fadeIn(rs, 6.15, 0.2); fadeIn(pm, 6.55, 0.3);
  var cy = Y(0.95), cw = 436, ch = ut(118);
  var c1 = rect(cx - 228, cy, cw, ch, { nofill: true, stroke: GOLD, sw: 4, r: ch / 2, name: "selo alunos" });
  var c1t = text("até 250 alunos", cx - 228, cy + ut(17), { size: ut(48), style: "SemiBold", name: "até 250 alunos" }); parent(c1t, c1);
  var c2 = rect(cx + 228, cy, cw, ch, { fill: GOLD, r: ch / 2, name: "selo módulos" });
  var c2t = text("6 módulos", cx + 228, cy + ut(17), { size: ut(48), style: "Bold", fill: INK, name: "6 módulos" }); parent(c2t, c2);
  popIn(c1, 7.2, 100, 0.45); popIn(c2, 7.45, 100, 0.45);

  // ---- Quadro 4 (9,2–12 s): marca + oferta
  var q4 = comp("Q4 oferta" + sfx);
  oferta(9.25, "Sem fidelidade");

  montar("V10_" + fmt, [{ c: q1, tout: 2.75 }, { c: q2, tin: 3.0, tout: 5.75 }, { c: q3, tin: 6.0, tout: 8.95 }, { c: q4, tin: 9.2 }]);
}
build("9x16");
build("4x5");
salvar("v10-preco-na-pagina");

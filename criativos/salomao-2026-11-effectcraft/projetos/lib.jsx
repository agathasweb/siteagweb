// lib.jsx — utilitários comuns dos vídeos do Salomão (EffectCraft 0.9.2, CLI).
// Carregado pelos scripts v*.jsx com $.evalFile. Usa app.run(<comando do motor>, {params}).
var NAVY = "#1f2b44", NAVY2 = "#172033", NAVY3 = "#2b3a5c", GOLD = "#d4a72c", WHITE = "#ffffff",
    GRAY = "#f3f4f6", GRAY2 = "#c9ced8", GRAY3 = "#8b93a5", RED = "#e5484d", GREEN = "#2fa36b", INK = "#1f2b44";
var FONT = "Poppins";
var DIR = "/home/gutto/DDEV/agathas-dev/criativos/salomao-2026-11-effectcraft/projetos";
var FMT = null, DUR = 10, CUR = null, ITEMS = {};

function run(id, p) {
  try { return app.run(id, p || {}); }
  catch (e) { throw new Error(id + " " + JSON.stringify(p || {}).substring(0, 300) + " => " + e); }
}
// ---------- formato ----------
// 9x16: margem 8% laterais, 14% no topo e 22% no rodapé (faixa que a interface do Reels/TikTok cobre). 4x5: 8% em tudo.
function setFmt(name) {
  if (name == "4x5") FMT = { name: name, W: 1080, H: 1350, top: 108, bot: 108, k: 0.82, kt: 0.9 };
  else FMT = { name: name, W: 1080, H: 1920, top: 269, bot: 422, k: 1, kt: 1 };
  FMT.cx = FMT.W / 2; FMT.mx = 86;
}
function Y(f) { return FMT.top + f * (FMT.H - FMT.top - FMT.bot); }   // fração da área segura
function u(v) { return v * FMT.k; }                                   // tamanho de objeto
function ut(v) { return Math.round(v * FMT.kt); }                     // tamanho de texto
// ---------- comps ----------
function comp(name, w, h, bg) {
  var p = { name: name, width: w || FMT.W, height: h || FMT.H, frameRate: 30, duration: DUR };
  if (bg) p.background = bg;
  CUR = run("comp.new", p).comp; run("comp.open", { comp: CUR }); return CUR;
}
function open(c) { CUR = c; run("comp.open", { comp: c }); }
// ---------- propriedades / keyframes ----------
function set(l, path, v) { run("prop.set", { layer: l, path: path, value: v }); }
function v3(a) { return a.length == 2 ? [a[0], a[1], 0] : a; }
// kfs: [[t, valor], ...]; ease: "out" (padrão, desacelera), "in", "io", "lin", "back" (sem ease no fim)
function K(l, path, kfs, ease) {
  ease = ease || "out";
  var i;
  for (i = 0; i < kfs.length; i++) run("prop.addKey", { layer: l, path: path, time: kfs[i][0], value: kfs[i][1] });
  if (ease == "lin") return;
  var o = 20, n = 80;
  if (ease == "in") { o = 75; n = 20; } else if (ease == "io") { o = 60; n = 60; }
  for (i = 0; i < kfs.length; i++) {
    if (i < kfs.length - 1) run("keys.setEase", { layer: l, path: path, time: kfs[i][0], side: "out", speed: 0, influence: o });
    if (i > 0) run("keys.setEase", { layer: l, path: path, time: kfs[i][0], side: "in", speed: 0, influence: n });
  }
}
function pos(l, x, y) { set(l, "transform/position", [x, y, 0]); }
function getPos(l) { return run("prop.get", { layer: l, path: "transform/position" }).value; }
function getScale(l) { return run("prop.get", { layer: l, path: "transform/scale" }).value; }
function timing(l, tin, tout) { var p = { layers: [l] }; if (tin != null) p["in"] = tin; if (tout != null) p.out = tout; run("layer.timing", p); }
function parent(l, p) { run("layer.setParent", { layers: [l], parent: p }); }
function rename(l, n) { run("layer.rename", { layer: l, name: n }); }
function mblur(l) { run("layer.setSwitch", { layers: [l], "switch": "motionBlur", value: true }); }
// ---------- animações prontas ----------
function fadeIn(l, t, d, to) { K(l, "transform/opacity", [[t, 0], [t + (d || 0.35), to == null ? 100 : to]]); }
function fadeOut(l, t, d, from) { K(l, "transform/opacity", [[t, from == null ? 100 : from], [t + (d || 0.3), 0]], "io"); }
// entra deslizando (dx,dy = de onde vem) com fade
function slideIn(l, t, dx, dy, d) {
  var p = getPos(l); d = d || 0.55;
  K(l, "transform/position", [[t, [p[0] + (dx || 0), p[1] + (dy || 0), 0]], [t + d, [p[0], p[1], 0]]]);
  K(l, "transform/opacity", [[t, 0], [t + d * 0.6, 100]]);
}
function slideOut(l, t, dx, dy, d) {
  var p = getPos(l); d = d || 0.4;
  K(l, "transform/position", [[t, [p[0], p[1], 0]], [t + d, [p[0] + (dx || 0), p[1] + (dy || 0), 0]]], "in");
  K(l, "transform/opacity", [[t + d * 0.3, 100], [t + d, 0]], "io");
}
// pop com overshoot
function popIn(l, t, s, d) {
  s = s || 100; d = d || 0.5;
  K(l, "transform/scale", [[t, [0, 0, 100]], [t + d * 0.6, [s * 1.1, s * 1.1, 100]], [t + d, [s, s, 100]]]);
  K(l, "transform/opacity", [[t, 0], [t + 0.12, 100]], "lin");
}
function popOut(l, t, d) {
  var s = getScale(l)[0]; d = d || 0.3;
  K(l, "transform/scale", [[t, [s, s, 100]], [t + d, [0, 0, 100]]], "in");
}
// texto: palavras (ou letras) sobem e aparecem em sequência
function textIn(l, t, d, chars) {
  d = d || 0.8;
  run("layer.applyTextPreset", { layer: l, preset: "fadeUpCharacters" });
  var b = "text/animators/animator/";
  if (!chars) set(l, b + "selectors/rangeSelector/advanced/basedOn", 2);
  set(l, b + "properties/position", [0, 46, 0]);
  var p = b + "selectors/rangeSelector/offset";
  run("keys.set", { layer: l, path: p, time: 1.5, newTime: t + d + 40 });
  run("keys.set", { layer: l, path: p, time: 0, newTime: t });
  run("keys.set", { layer: l, path: p, time: t + d + 40, newTime: t + d });
}
// ---------- camadas ----------
// texto de ponto: y = linha de base da 1ª linha. o: {size, style, fill, justify, leading, tracking, name, caps}
function text(str, x, y, o) {
  o = o || {};
  var p = { text: str, font: FONT, style: o.style || "Bold", size: o.size || 80, fill: o.fill || WHITE,
            justify: o.justify || "center", position: [x, y] };
  if (o.leading) p.leading = o.leading;
  if (o.tracking != null) p.tracking = o.tracking;
  if (o.caps) p.allCaps = true;
  if (o.name) p.name = o.name;
  return run("layer.newText", p).layer;
}
function textW(l) { // largura medida do texto
  var c = app.project.itemByID(CUR), i;
  for (i = 1; i <= c.numLayers; i++) if (c.layer(i).id == l) return c.layer(i).sourceRectAtTime(0, false).width;
  return 0;
}
// retângulo arredondado centrado em (x,y). o: {r, fill, stroke, sw, name, op}
function rect(x, y, w, h, o) {
  o = o || {};
  var p = { kind: "rounded", size: [w, h], position: [x, y], name: o.name || "ret" };
  p.fill = o.fill || WHITE;
  if (o.stroke) { p.stroke = o.stroke; p.strokeWidth = o.sw || 4; }
  var l = run("layer.newShape", p).layer;
  set(l, "contents/group/contents/rect/roundness", o.r == null ? 24 : o.r);
  if (o.nofill) set(l, "contents/group/contents/fill/opacity", 0);
  if (o.op != null) set(l, "transform/opacity", o.op);
  return l;
}
function circle(x, y, d, o) {
  o = o || {};
  var p = { kind: "ellipse", size: [d, o.h || d], position: [x, y], name: o.name || "circ", fill: o.fill || WHITE };
  if (o.stroke) { p.stroke = o.stroke; p.strokeWidth = o.sw || 4; }
  var l = run("layer.newShape", p).layer;
  if (o.nofill) set(l, "contents/group/contents/fill/opacity", 0);
  if (o.op != null) set(l, "transform/opacity", o.op);
  return l;
}
// caminho livre. pts relativos à posição (x,y). o: {stroke, sw, fill, closed, name, trim, round}
function path(x, y, pts, o) {
  o = o || {};
  var l = run("layer.newShape", { kind: "none", name: o.name || "traço", position: [x, y] }).layer;
  run("layer.addShapeItem", { layer: l, kind: "path" });
  var z = [], i; for (i = 0; i < pts.length; i++) z.push([0, 0]);
  set(l, "contents/path/path", { closed: !!o.closed, vertices: pts, in_tangents: o.tin || z, out_tangents: o.tout || z });
  if (o.trim) run("layer.addShapeItem", { layer: l, kind: "trim" });
  if (o.fill) { run("layer.addShapeItem", { layer: l, kind: "fill" }); set(l, "contents/fill/color", o.fill); }
  if (o.stroke) {
    run("layer.addShapeItem", { layer: l, kind: "stroke" });
    set(l, "contents/stroke/color", o.stroke); set(l, "contents/stroke/width", o.sw || 10);
    set(l, "contents/stroke/cap", 1); set(l, "contents/stroke/join", 1);
  }
  pos(l, x, y);
  return l;
}
// desenha o traço (trim path) de 0 a 100%
function draw(l, t, d) { K(l, "contents/trim/end", [[t, 0], [t + (d || 0.4), 100]], "io"); }
function check(x, y, s, color, sw) {
  return path(x, y, [[-0.42 * s, 0.02 * s], [-0.12 * s, 0.3 * s], [0.44 * s, -0.3 * s]], { stroke: color || WHITE, sw: sw || s * 0.16, trim: true, name: "check" });
}
function image(file, x, y, scale, name) {
  if (!ITEMS[file]) ITEMS[file] = run("file.import", { paths: [DIR + "/assets/" + file] }).items[0];
  var l = run("layer.addItem", { item: ITEMS[file], position: [x, y] }).layer;
  if (scale != null) set(l, "transform/scale", [scale, scale, 100]);
  if (name) rename(l, name);
  return l;
}
function nullAt(x, y, name) { var l = run("layer.newNull", { name: name || "ctrl" }).layer; pos(l, x, y); return l; }
// coloca uma comp como camada na comp atual
function place(c, x, y, scale, name) {
  var l = run("layer.addItem", { item: c, position: [x, y] }).layer;
  if (scale != null) set(l, "transform/scale", [scale, scale, 100]);
  if (name) rename(l, name);
  return l;
}
function shadow(l, dist, soft, op) {
  var r = run("effect.apply", { effect: "Drop Shadow", layers: [l] });
  var b = r.paths[0] + "/";
  set(l, b + "opacity", op == null ? 35 : op); set(l, b + "direction", 180);
  set(l, b + "distance", dist == null ? 14 : dist); set(l, b + "softness", soft == null ? 40 : soft);
  return r.paths[0];
}
function matte(l, m, kind) { run("layer.setTrackMatte", { layer: l, matte: m, kind: kind || "alpha" }); }
// ---------- peças da marca ----------
// fundo azul-marinho com brilhos suaves em movimento lento (continuidade entre quadros)
function fundo() {
  var W = FMT.W, H = FMT.H;
  var bg = rect(W / 2, H / 2, W + 4, H + 4, { fill: NAVY, r: 0, name: "fundo" });
  var a = circle(W * 0.9, H * 0.12, 900, { fill: NAVY3, name: "brilho A", op: 55 });
  var b = circle(W * 0.05, H * 0.92, 1000, { fill: NAVY2, name: "brilho B", op: 80 });
  var e1 = run("effect.apply", { effect: "Gaussian Blur", layers: [a] }).paths[0]; set(a, e1 + "/blurriness", 180);
  var e2 = run("effect.apply", { effect: "Gaussian Blur", layers: [b] }).paths[0]; set(b, e2 + "/blurriness", 180);
  K(a, "transform/position", [[0, [W * 0.95, H * 0.1, 0]], [DUR, [W * 0.6, H * 0.22, 0]]], "io");
  K(b, "transform/position", [[0, [W * 0.0, H * 0.95, 0]], [DUR, [W * 0.35, H * 0.8, 0]]], "io");
  return bg;
}
// selo "coroa + Salomão" horizontal, centrado em (x,y). devolve null controlador
function marca(x, y, s, cor) {
  s = s || 1;
  var n = nullAt(x, y, "marca");
  var c = image("coroa.png", x - 150 * s, y - 6 * s, 20 * s, "coroa");
  var t = text("Salomão", x + 50 * s, y + 24 * s, { size: 72 * s, style: "Bold", fill: cor || WHITE, name: "Salomão" });
  parent(c, n); parent(t, n);
  return { n: n, c: c, t: t };
}
// transição de saída de um quadro (camada de precomp)
function sai(l, t, d) {
  d = d || 0.4;
  K(l, "transform/opacity", [[t, 100], [t + d, 0]], "io");
  K(l, "transform/scale", [[t, [100, 100, 100]], [t + d, [93, 93, 100]]], "in");
  timing(l, null, t + d + 0.02);
}
// reduz a camada (escala) se o texto passar de maxW. devolve a escala usada
function cabe(l, maxW) {
  var w = textW(l), k = (w > maxW) ? maxW / w * 100 : 100;
  if (k < 100) set(l, "transform/scale", [k, k, 100]);
  return k;
}
// quadro final com a oferta, centrado na área útil. tag = linha de apoio (opcional). t0..DUR
function oferta(t0, tag) {
  var cx = FMT.cx, maxW = FMT.W - 2 * FMT.mx;
  var coroa = image("coroa.png", cx, Y(0.15), u(50), "coroa");
  popIn(coroa, t0 + 0.05, u(50), 0.55);
  K(coroa, "transform/rotation", [[t0 + 0.05, -14], [t0 + 0.7, 0]]);
  var nome = text("Salomão", cx, Y(0.395), { size: ut(124), style: "Bold", name: "Salomão" });
  slideIn(nome, t0 + 0.15, 0, 50, 0.5);
  if (tag) {
    var tg = text(tag, cx, Y(0.485), { size: ut(50), style: "SemiBold", fill: GOLD, name: "apoio" });
    cabe(tg, maxW); slideIn(tg, t0 + 0.28, 0, 40, 0.5);
  }
  var by = Y(0.655), bw = Math.min(maxW, ut(900)), bh = ut(168);
  var btn = rect(cx, by, bw, bh, { fill: GOLD, r: bh / 2, name: "botão oferta" });
  shadow(btn, 16, 50, 40);
  var bt = text("Teste grátis por 7 dias", cx, by + ut(23), { size: ut(66), style: "Bold", fill: INK, name: "oferta" });
  cabe(bt, bw - 90);
  parent(bt, btn);
  popIn(btn, t0 + 0.4, 100, 0.5);
  K(btn, "transform/scale", [[t0 + 1.3, [100, 100, 100]], [t0 + 1.6, [104, 104, 100]], [t0 + 1.95, [100, 100, 100]]], "io");
  var d1 = text("30% de desconto", cx, Y(0.855), { size: ut(70), style: "Bold", name: "30% de desconto" });
  var d2 = text("nos 3 primeiros meses · até 31/12", cx, Y(0.855) + ut(76), { size: ut(48), style: "SemiBold", fill: "#e5e7eb", name: "condição do desconto" });
  cabe(d2, maxW);
  slideIn(d1, t0 + 0.6, 0, 30, 0.45); slideIn(d2, t0 + 0.7, 0, 30, 0.45);
}
// monta a comp principal: fundo + quadros (precomps de duração total, tempos globais)
// cenas: [{c: compId, tin, tout}]  (tout = início da saída padrão; sem tout = sem saída automática)
// devolve {m: comp, ls: [camadas dos quadros]}
function montar(nome, cenas) {
  var m = comp(nome, FMT.W, FMT.H, NAVY);
  fundo();
  var i, l, ls = [];
  for (i = 0; i < cenas.length; i++) {
    l = place(cenas[i].c, FMT.W / 2, FMT.H / 2, 100);
    if (cenas[i].tin) timing(l, cenas[i].tin, null);
    if (cenas[i].tout != null) sai(l, cenas[i].tout, cenas[i].d);
    ls.push(l);
  }
  run("comp.setSwitch", { comp: m, "switch": "motionBlur", value: true });
  return { m: m, ls: ls };
}
// ícone Lucide (icons.jsx) centrado em (x,y), com "size" px de lado
function icon(name, x, y, size, color, sw) {
  if (!ICONS[name]) throw new Error("ícone inexistente: " + name);
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + (color || WHITE) +
            '" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
  var l = run("edit.pasteSvg", { svg: svg, name: "ícone " + name }).layer;
  var k = size / 24 * 100;
  set(l, "transform/scale", [k, k, 100]); pos(l, x, y);
  return l;
}
// celular: corpo + tela (comp "scr" de sw x sh recortada com cantos arredondados). devolve o null controlador
function celular(scr, x, y, sw, sh, name) {
  var n = nullAt(x, y, name || "celular"), b = Math.round(sw * 0.035);
  var body = rect(x, y, sw + 2 * b, sh + 2 * b, { fill: "#0d1320", r: sw * 0.12 + b, stroke: "#3a4666", sw: 3, name: "corpo do celular" });
  var m = rect(x, y, sw, sh, { fill: WHITE, r: sw * 0.11, name: "máscara da tela" });
  var t = place(scr, x, y, 100, "tela");
  matte(t, m);
  var cam = rect(x, y - sh / 2 + sw * 0.055, sw * 0.28, sw * 0.055, { fill: "#0d1320", r: sw * 0.03, name: "câmera" });
  parent(body, n); parent(m, n); parent(t, n); parent(cam, n);
  return n;
}
// rótulo de imagem ilustrativa (na base da área útil)
function ilustrativa(t0, txt) {
  var l = text(txt || "Imagem ilustrativa · dados fictícios", FMT.cx, Y(1) - 6, { size: 26, style: "Regular", fill: GRAY3, name: "aviso ilustrativo" });
  fadeIn(l, t0, 0.4, 85); return l;
}
// tremor (rotação) entre t0 e t1 — período ~0,3 s, sem piscar
function treme(l, t0, t1, amp) {
  var ks = [[t0, 0]], t = t0 + 0.15, s = 1;
  while (t < t1 - 0.1) { ks.push([t, amp * s]); s = -s; t += 0.15; }
  ks.push([t1, 0]);
  K(l, "transform/rotation", ks, "io");
}
// anel que se expande e some (destaque)
function anel(x, y, d, t, cor) {
  var a = circle(x, y, d, { nofill: true, stroke: cor || GOLD, sw: 8, name: "anel" });
  K(a, "transform/scale", [[t, [60, 60, 100]], [t + 0.7, [190, 190, 100]]]);
  K(a, "transform/opacity", [[t, 100], [t + 0.7, 0]]);
  timing(a, t, t + 0.75); return a;
}
function salvar(nome) { app.project.save(new File(DIR + "/" + nome + ".ecproj")); writeLn("salvo " + nome + ".ecproj"); }

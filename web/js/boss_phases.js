'use strict';
// =============================================================================
// BOSS A FASI (Alfa 5) — tre fasi per ogni boss di fine capitolo, due per i
// mini-boss. Ogni fase ha un nome, una battuta d'ingresso, un'aura e un proprio
// repertorio di copioni (generatori, vedi bosses.js). Le meccaniche vengono dai
// giochi d'origine: le catene del Vaso Puro, le Spade dello Spirito di Gabriele,
// le Urne del Tartaro, gli specchi e le inseguitrici di Badeline, lo scudo della
// Mano del Re, la Penitenza di Escribar, i punti deboli del Signore della Luna,
// le porte e il Cuore della Mamma, l'arena che si stringe della Cucitrice.
// =============================================================================

const PH = (at, name, line, patterns, o = {}) => Object.assign({ at, name, line, patterns }, o);
const isChar = id => (G.players ? G.players.some(pl => pl.char.id === id) : G.char.id === id);
const countOwn = (e, type) => G.enemies.filter(q => !q.dead && q.own === e && q.type === type).length;
function laserFx(x1, y1, x2, y2, col) {
  G.fx.push({ k: 'line', x1, y1, x2, y2, col, w: 6, life: 0.22, max: 0.22 });
  G.fx.push({ k: 'line', x1, y1, x2, y2, col: '#ffffff', w: 2, life: 0.16, max: 0.16 });
}
// Laser istantaneo telegrafato da un punto qualsiasi (riflessi, porte, ombre)
function laserFrom(e, sx, sy, a, o = {}) {
  const { len = 300, w = 4, dmg = 16, t = 0.7, col = '#ff3050' } = o;
  const x2 = sx + Math.cos(a) * len, y2 = sy + Math.sin(a) * len;
  tele({ kind: 'line', x1: sx, y1: sy, x2, y2, w, t, col, fire: () => { hitLine(sx, sy, x2, y2, w, dmg, e); laserFx(sx, sy, x2, y2, col); sfx('shot'); } });
}
// Carica che lascia una scia di fuoco (Mano del Re, Portinaio)
function* gFireCharge(e, times = 1, o = {}) {
  const { spd = 440, tt = 0.5, col = '#ffd23f', kind = 'fire' } = o;   // kind: null = nessuna scia
  for (let i = 0; i < times; i++) {
    const [dx, dy] = norm(G.p.x - e.x, G.p.y - e.y);
    e.mv = 'stay'; e.face = dx;
    tele({ kind: 'line', x1: e.x, y1: e.y, x2: e.x + dx * spd * 0.5, y2: e.y + dy * spd * 0.5, w: e.r * 0.8, t: tt, col });
    yield tt;
    e.mv = 'dash'; e.dvx = dx * spd; e.dvy = dy * spd; e.trail = 0.5;
    for (let k = 0; k < 5; k++) { if (kind) hazard(e.x, e.y, 13, 3.5, 8, kind); yield 0.1; }
    e.mv = e.def.mv || 'chase';
    yield 0.25;
  }
}

// =============================================================================
// HOLLOWNEST — Il Cavaliere Cavo
// =============================================================================
const HKW = '#f4f1e8', INF = '#ff9a2a', RAD = '#fff2b0';
function* hkCombo(e, n, tt) {
  for (let i = 0; i < n; i++) {
    // un piccolo affondo verso il bersaglio prima di ogni fendente
    const [dx, dy] = norm(G.p.x - e.x, G.p.y - e.y);
    e.mv = 'dash'; e.dvx = dx * 260; e.dvy = dy * 260;
    yield 0.08;
    yield* gArc(e, { r: 46, half: 1.05, dmg: 18, tele: tt, col: HKW });
  }
}
function* hkFocus(e) {
  // Concentrazione: l'Infezione si raccoglie nel Vaso ed esplode tutto intorno
  e.mv = 'stay';
  bossSay(e, '[L\'Infezione si raccoglie nel Vaso]');
  tele({ kind: 'circle', x: e.x, y: e.y, r: 84, t: 1.4, col: INF });
  yield 1.4;
  hitCircle(e.x, e.y, 84, 24, e);
  fxRing(e.x, e.y, 10, 92, INF, 0.4, 4); fxParticles(e.x, e.y, INF, 30, 160, 0.6, 2); shake(8); sfx('boom');
  for (let i = 0; i < 16; i++) eShootB(e.x, e.y, i / 16 * TAU, 100, 13, { col: INF });
  e.mv = 'chase';
  yield 0.5;
}
BOSSES.hollowknight.phases = [
  PH(1, 'Il Vaso Puro', null, [
    { f: e => hkCombo(e, 3, 0.3), w: 2 },
    { f: function* (e) { yield* gDash(e, { tele: 0.5, spd: 470, dur: 0.42, col: INF, gap: 0 }); yield* gArc(e, { r: 44, dmg: 20, tele: 0.18, col: HKW }); }, w: 2 },
    { f: e => gCounter(e, { dur: 1.1, r: 60, dmg: 20, text: '[Il Vaso alza l\'Aculeo e para]' }), w: 1.1 },
    { f: e => gRadial(e, 12, 85, 14, INF, 'orb', 2, 0.4), w: 1 },
  ], { gap: 0.75 }),
  PH(0.66, 'Le Catene si Spezzano', '[Le catene cedono. L\'Infezione trabocca.]', [
    { f: e => { const a = angTo(e); return gSpikes(e, [...linePts(e.x, e.y, a, 7, 26), ...linePts(e.x, e.y, a + 0.55, 6, 26), ...linePts(e.x, e.y, a - 0.55, 6, 26)], { r: 13, tele: 0.75, dmg: 18, col: INF }); }, w: 1.5 },
    { f: e => gRain(e, 8, { area: 130, r: 16, tele: 0.9, dmg: 16, col: INF, onFire: t => hazard(t.x, t.y, 14, 3.5, 8, 'infection') }), w: 1.3 },
    { f: e => gDash(e, { tele: 0.42, spd: 500, dur: 0.38, times: 2, col: INF, onEnd: e => { for (let i = 0; i < 8; i++) eShootB(e.x, e.y, i / 8 * TAU, 95, 12, { col: INF }); } }), w: 1.6 },
    { f: hkFocus, w: 1 },
    { f: e => hkCombo(e, 3, 0.24), w: 1.5 },
  ], { gap: 0.6, aura: INF }),
  PH(0.33, 'La Luce Radiosa', '[Si trafigge. Dietro la maschera, una luce dorata.]', [
    { f: function* (e) { yield* gRadial(e, 16, 90, 12, INF, 'orb', 1); yield* gStagger(e, 1.6, '[Si trafigge con il proprio Aculeo]'); }, w: 1.1 },
    { f: function* (e) { const a = rnd(TAU); yield* gWall(e, { ang: a, kind: 'sword', col: RAD, gap: 3, spd: 95, dmg: 16 }); yield 0.5; yield* gWall(e, { ang: a + Math.PI / 2, kind: 'sword', col: RAD, gap: 3, spd: 95, dmg: 16 }); }, w: 1.4, shout: ['[Spade di luce cadono dal cielo]'] },
    { f: e => gBoth(gBeams(e, { n: 3, len: 300, w: 6, dmg: 18, sweep: 0.65, dur: 3.4, col: RAD }), gHoming(e, 4, 70, 12, INF, 1.6, 5)), w: 1.2 },
    { f: e => gRingIn(e, { n: 16, r: 96, col: INF, kind: 'orb', dmg: 13 }), w: 1 },
    { f: e => gDash(e, { tele: 0.36, spd: 540, dur: 0.34, times: 3, gap: 0.1, col: INF }), w: 1.3 },
  ], { gap: 0.5, aura: RAD }),
];

// =============================================================================
// INFERNO — Gabriele
// =============================================================================
const GOLD = '#ffe680', GLT = '#fff2b0', HATE = '#ff5a3a';
function* gabCombo(e, n, tt, col = GOLD, dist = 46) {
  yield* gTeleport(e, dist);
  for (let i = 0; i < n; i++) yield* gArc(e, { r: 42, half: 1.0, dmg: 18, tele: tt, col });
}
function* gabCross(e, col = GOLD) {
  // Lance incrociate: due linee che si incrociano sul bersaglio, poi lance lungo le linee
  const p = G.p, a = rnd(TAU), L = 170;
  for (const b of [a, a + Math.PI / 2]) {
    const x1 = p.x - Math.cos(b) * L, y1 = p.y - Math.sin(b) * L, x2 = p.x + Math.cos(b) * L, y2 = p.y + Math.sin(b) * L;
    tele({ kind: 'line', x1, y1, x2, y2, w: 7, t: 0.8, col, fire: () => {
      hitLine(x1, y1, x2, y2, 7, 20, e); laserFx(x1, y1, x2, y2, col);
      for (let i = 0; i < 3; i++) eShootB(x1, y1, b, 240 + i * 40, 14, { col, kind: 'spear' });
    } });
  }
  sfx('bell');
  yield 1.0;
}
function* gabJavelin(e, col = GOLD) {
  const p = G.p, tx = p.x, ty = p.y;
  e.mv = 'stay';
  tele({ kind: 'line', x1: e.x, y1: e.y, x2: tx, y2: ty, w: 4, t: 0.6, col });
  tele({ kind: 'circle', x: tx, y: ty, r: 26, t: 0.9, col, fire: t => {
    hitCircle(t.x, t.y, t.r, 20, e); fxRing(t.x, t.y, 4, 34, '#ffffff', 0.3, 3); shake(5); sfx('boom');
    for (let i = 0; i < 10; i++) eShootB(t.x, t.y, i / 10 * TAU, 120, 13, { col, kind: 'spear' });
  } });
  yield 0.9;
  e.mv = 'chase';
  yield 0.3;
}
BOSSES.gabriel.sprPhase = 2;
BOSSES.gabriel.phases = [
  PH(1, 'Giudice dell\'Inferno', null, [
    { f: e => gabCombo(e, 3, 0.26), w: 2.2, shout: ['PREPARATI!', 'GIUDIZIO!', 'MUORI!'] },
    { f: e => gAimed(e, 3, 0.5, 230, 16, GOLD, 'spear', 3, 0.45), w: 2, shout: ['TROPPO LENTO!'] },
    { f: e => gDash(e, { tele: 0.4, spd: 560, dur: 0.35, times: 2, col: GOLD }), w: 1.5, shout: ['SCHIACCIATO!'] },
    { f: e => gabCross(e), w: 1.3, shout: ['NON C\'È SCAMPO!'] },
  ], { gap: 0.7 }),
  PH(0.66, 'Spade dello Spirito', () => (isChar('v1') ? 'MACCHINA! TI FARÒ A PEZZI E SPARGERÒ I TUOI RESTI TRA LE STELLE!' : 'TI FARÒ A PEZZI, CREATURA PROFANA!'), [
    { f: e => gRingIn(e, { n: 12, r: 92, kind: 'sword', col: GLT, dmg: 16, hold: 0.9 }), w: 1.6, shout: ['NON PUOI SFUGGIRE!'] },
    { f: function* (e) { yield* gabCombo(e, 3, 0.22); yield* gabCombo(e, 2, 0.22, GOLD, 60); }, w: 1.8, shout: ['PREPARATI!'] },
    { f: e => gabJavelin(e), w: 1.4, shout: ['GIUDIZIO!'] },
    { f: e => gBoth(gabCross(e), gRadial(e, 16, 115, 14, GLT, 'spear', 2, 0.5, 0.2)), w: 1.1 },
  ], { gap: 0.55, aura: GLT }),
  PH(0.33, 'Apostata dell\'Odio', 'BASTA! IL PARADISO MI HA VOLTATO LE SPALLE… E IO NON CADRÒ DA SOLO!', [
    { f: e => gBoth(gBeams(e, { n: 4, len: 240, w: 5, dmg: 18, sweep: 0.9, dur: 3, col: HATE, stay: false, spd: 38 }), gAimed(e, 3, 0.4, 200, 14, HATE, 'spear', 3, 0.8)), w: 1.3, shout: ['AMMIRA IL POTERE DI UN ANGELO!'] },
    { f: function* (e) { for (let i = 0; i < 4; i++) { yield* gTeleport(e, 70); yield* gArc(e, { r: 44, half: 1.1, dmg: 18, tele: 0.22, col: HATE }); } }, w: 1.6, shout: ['MUORI! MUORI! MUORI!'] },
    { f: function* (e) { const a = rnd(TAU); yield* gWall(e, { ang: a, kind: 'spear', col: HATE, gap: 3, spd: 100 }); yield 0.4; yield* gWall(e, { ang: a + Math.PI, kind: 'spear', col: GOLD, gap: 3, spd: 100 }); }, w: 1.3 },
    { f: function* (e) { yield* gRingIn(e, { n: 12, r: 96, kind: 'sword', col: HATE, dmg: 16, hold: 0.8 }); yield* gRingIn(e, { n: 12, r: 96, kind: 'sword', col: GOLD, dmg: 16, hold: 0.7 }); }, w: 1.1 },
    { f: e => gDash(e, { tele: 0.32, spd: 620, dur: 0.3, times: 3, gap: 0.12, col: HATE }), w: 1.2, shout: ['SCHIACCIATO!'] },
  ], { gap: 0.45, aura: HATE }),
];

// =============================================================================
// TARTARO — Ade
// =============================================================================
const HRED = '#e0303a', HGOLD = '#e2b04a', SHADE = '#c96aff';
function* hadesAmbush(e, n = 1) {
  for (let i = 0; i < n; i++) {
    e.cloak = 1;
    if (i === 0) bossSay(e, isChar('zagreus') ? 'Dove guardi, ragazzo?' : 'Dove guardi, intruso?');
    yield* gTeleport(e, 34);
    e.cloak = 0;
    yield* gArc(e, { r: 48, half: 1.4, dmg: 20, tele: 0.32, col: HRED });
  }
}
// Urne del Tartaro: finché sono intere Ade è protetto, e liberano anime che inseguono
function urnAct(q, dt) {
  q.cd -= dt;
  if (q.cd <= 0) {
    q.cd = 3.2;
    eShootB(q.x, q.y - 8, Math.atan2(G.p.y - q.y, G.p.x - q.x) + rnd(-0.5, 0.5), 72, 13, { col: SHADE, kind: 'skull', homing: 1.4, life: 5, r: 4 });
    fxParticles(q.x, q.y - 12, SHADE, 6, 40, 0.4);
  }
}
function drawUrn(c, q, x, y) {
  const glow = q.cd < 0.6 ? 1 : 0.5 + 0.2 * Math.sin(G.t * 4 + q.x);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, y + 6, 8, 3, 0, 0, TAU); c.fill();
  const f = q.flash > 0 ? '#ffffff' : null;
  // anfora: collo, spalle larghe, ventre, piede
  oPoly(c, [[x - 3, y - 15], [x + 3, y - 15], [x + 3, y - 12], [x + 7, y - 9], [x + 8, y - 3], [x + 6, y + 2], [x + 3, y + 3], [x + 4, y + 6], [x - 4, y + 6], [x - 3, y + 3], [x - 6, y + 2], [x - 8, y - 3], [x - 7, y - 9], [x - 3, y - 12]], f || '#2a1626');
  if (!f) {
    c.fillStyle = '#e2b04a'; c.fillRect(x - 4, y - 15, 8, 1); c.fillRect(x - 7, y - 8, 14, 1); c.fillRect(x - 6, y + 1, 12, 1);
    c.fillStyle = '#b8743a'; for (let i = -6; i <= 4; i += 3) c.fillRect(x + i, y - 6, 2, 1), c.fillRect(x + i + 1, y - 5, 1, 2);
    c.fillStyle = '#c94a2a'; c.fillRect(x - 2, y - 4, 4, 3); c.fillStyle = '#1a0a14'; c.fillRect(x - 1, y - 3, 1, 1); c.fillRect(x + 1, y - 3, 1, 1);
    c.fillStyle = '#5a3a5a'; c.fillRect(x - 5, y - 7, 1, 6);
  }
  // le anime salgono dalla bocca dell'urna
  c.globalAlpha = 0.5 * glow; c.fillStyle = SHADE; c.beginPath(); c.ellipse(x, y - 16, 4, 2, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
  if (G.frame % 6 === 0) G.fx.push({ k: 'p', x: q.x + rnd(-2, 2), y: q.y - 16, vx: rnd(-6, 6), vy: -rnd(16, 30), life: 0.6, max: 0.6, col: SHADE, size: 1 });
  c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(x, y - 4, 13, -Math.PI / 2, -Math.PI / 2 + TAU * q.hp / q.maxHp); c.stroke();
  c.strokeStyle = SHADE; c.lineWidth = 1; c.stroke();
  light(q.x, q.y - 8, 30 + 12 * glow, SHADE);
}
function* hadesUrns(e) {
  e.urnT = G.t;
  bossSay(e, 'Urne del Tartaro, a me!', true);
  e.mv = 'stay';
  const off = rnd(TAU);
  // le urne girano intorno ad Ade (e prima o poi si sbriciolano da sole)
  for (let i = 0; i < 3; i++) {
    const a = off + i / 3 * TAU;
    const q = addPart(e, Math.cos(a) * 62, Math.sin(a) * 46, 0.045, { orbit: 0.7, oa: a, rad: 62, life: 16, col: SHADE, r: 9, drawPart: drawUrn, act: urnAct, cd: 1.5 + i * 0.8 });
    fxRing(q.x, q.y, 2, 24, SHADE, 0.4, 2); fxParticles(q.x, q.y, SHADE, 10, 60, 0.5);
  }
  sfx('bell');
  yield 0.8;
  e.mv = 'chase';
}
function* hadesFlameSweep(e) {
  // il Bidente infuocato spazza davanti a lui e lascia il fuoco dello Stige
  const a0 = angTo(e) - 1.2;
  yield* gBeam(e, { tele: 0.6, len: 130, w: 7, dmg: 20, dur: 1.2, sweep: 2.0, col: '#ff6a2a', ang: a0 });
  for (let i = 0; i < 6; i++) { const a = a0 + i / 5 * 2.4; hazard(e.x + Math.cos(a) * 82, e.y + Math.sin(a) * 82, 16, 4, 8, 'fire'); }
}
function* hadesFireSpin(e) {
  e.spin = { r: 34, dmg: 16, col: HGOLD, k: 0 }; e.mv = 'chase'; e.spdOv = 125;
  for (let t = 0; t < 2.6; t += 0.3) { hazard(e.x, e.y, 14, 3.5, 8, 'fire'); yield 0.3; }
  e.spin = null; e.spdOv = null; e.mv = 'chase';
  yield 0.3;
}
BOSSES.hades.sprPhase = 2;
BOSSES.hades.partTag = 'URNE DEL TARTARO';
BOSSES.hades.phases = [
  PH(1, 'Signore dei Morti', null, [
    { f: e => gSpin(e, { dur: 2, r: 34, dmg: 16, spd: 120, col: HGOLD }), w: 2, shout: ['Basta così.'] },
    { f: e => gHoming(e, 4, 90, 14, HRED, 2.0, 5), w: 1.6, shout: ['Non c\'è via d\'uscita.'] },
    { f: e => gDash(e, { tele: 0.6, spd: 380, dur: 0.6, col: HRED }), w: 1.3 },
    { f: function* (e) { yield* gArc(e, { r: 56, half: 1.3, dmg: 20, tele: 0.45, col: HGOLD }); yield* gAimed(e, 5, 0.9, 170, 13, HGOLD, 'spear', 1); }, w: 1.4, shout: ['In ginocchio.'] },
    { f: e => gSummon(e, 'wretch', 4, 46), w: 0.7, shout: ['Servitori.'] },
  ], { gap: 0.75 }),
  PH(0.66, 'Le Urne del Tartaro', 'Mi stai mettendo alla prova. Pessima idea.', [
    { f: hadesUrns, w: 1.6, when: e => countOwn(e, 'bosspart') === 0 && G.t - (e.urnT ?? -99) > 18 },
    { f: e => hadesAmbush(e, 1), w: 1.5 },
    { f: e => gRadial(e, 18, 100, 14, '#ff6a6a', 'orb', 3, 0.35, 0.17), w: 1 },
    { f: e => gBoth(gSpin(e, { dur: 2.2, r: 34, dmg: 16, spd: 120, col: HGOLD }), gHoming(e, 3, 80, 13, SHADE, 1.8, 5)), w: 1.4 },
    { f: e => gDash(e, { tele: 0.5, spd: 420, dur: 0.5, times: 2, col: HRED }), w: 1 },
  ], { gap: 0.6, aura: SHADE, onEnter: e => { e.urnT = -99; } }),
  PH(0.33, 'L\'Ira del Padre', () => (isChar('zagreus') ? 'Sei proprio mio figlio. Testardo fino alla fine!' : 'Nessuno lascia il mio regno. NESSUNO!'), [
    { f: hadesFlameSweep, w: 1.4, shout: ['Brucia, come lo Stige.'] },
    { f: e => gHoming(e, 8, 70, 13, HRED, 1.5, 6), w: 1.1 },
    { f: e => hadesAmbush(e, 3), w: 1.4 },
    { f: e => gRingIn(e, { n: 14, r: 95, col: SHADE, kind: 'skull', dmg: 14 }), w: 1.1, shout: ['Le anime ti stringono.'] },
    { f: hadesFireSpin, w: 1.1 },
  ], { gap: 0.5, aura: '#ff4a2a' }),
];

// =============================================================================
// MONTE CELESTE — Badeline
// =============================================================================
const BPUR = '#c96aff', BRED = '#ff3050';
function drawBadeAs(c, q, x, y, alpha = 0.8) {
  const moving = Math.abs(q.vx) + Math.abs(q.vy) > 5;
  const s = SPR['badeline' + (moving ? '_w' + (Math.floor(G.t * 10) % 4) : (Math.sin(G.t * 3 + q.x) > 0 ? '_i1' : '_i0'))];
  if (!s) return;
  const sc = 1.6, flip = (q.face || 1) < 0, w = s.w * sc, h = s.h * sc;
  const X = Math.round(x - w / 2), Y = Math.round(y + 10 - h);
  const a0 = c.globalAlpha;
  c.globalAlpha = a0 * alpha;
  c.drawImage(q.flash > 0 ? (flip ? s.flipWhite : s.white) : (flip ? s.flip : s.img), X, Y, w, h);
  // velo viola: è un riflesso, non lei
  if (!s.violet) { s.violet = tinted(s.img, BPUR); s.violetF = tinted(s.flip, BPUR); }
  c.globalAlpha = a0 * alpha * (0.35 + 0.15 * Math.sin(G.t * 6));
  c.drawImage(flip ? s.violetF : s.violet, X, Y, w, h);
  c.globalAlpha = a0;
  light(q.x, q.y - 14, 28, BPUR);
}
function mirrorMove(q, dt) {
  q.oa += 0.55 * dt * q.dir;
  const tx = G.p.x + Math.cos(q.oa) * 120, ty = G.p.y + Math.sin(q.oa) * 95;
  q.vx = (tx - q.x) * 2.5; q.vy = (ty - q.y) * 2.5;
}
function* mirrorAct(q) {
  yield rnd(0.2, 1.2);
  laserFrom(q.own, q.x, q.y - 10, Math.atan2(G.p.y - (q.y - 10), G.p.x - q.x), { len: 320, w: 4, dmg: 16, t: 0.75, col: BRED });
  yield 1.0;
  yield rnd(1.2, 2.0);
}
function* badeMirrors(e) {
  bossSay(e, 'Quale di noi è quella vera?', true);
  const off = rnd(TAU);
  for (let i = 0; i < 3; i++) {
    const a = off + i / 3 * TAU;
    addClone(e, G.p.x + Math.cos(a) * 120, G.p.y + Math.sin(a) * 95, { frac: 0.035, life: 14, col: BPUR, oa: a, dir: i % 2 ? 1 : -1, move: mirrorMove, mk: mirrorAct, drawAs: (c, q, x, y) => drawBadeAs(c, q, x, y), barY: 50 });
  }
  yield 0.8;
}
function* badeCrossfire(e) {
  // tre ombre attorno al bersaglio: i laser si incrociano proprio dove sei
  const p = G.p, off = rnd(TAU);
  for (let i = 0; i < 3; i++) {
    const a = off + i / 3 * TAU, sx = p.x + Math.cos(a) * 140, sy = p.y + Math.sin(a) * 110;
    laserFrom(e, sx, sy, Math.atan2(p.y - sy, p.x - sx), { len: 300, w: 5, dmg: 18, t: 0.85, col: BRED });
    fxParticles(sx, sy, BPUR, 14, 60, 0.7);
  }
  sfx('bell');
  yield 1.1;
}
function* badeStar(e) {
  // salta tra le punte di una stella attorno a te, sparando da ognuna
  const p = G.p, cx = p.x, cy = p.y, off = rnd(TAU);
  for (let i = 0; i < 5; i++) {
    const a = off + i * 2 * TAU / 5;
    fxParticles(e.x, e.y, BPUR, 10, 80, 0.3);
    [e.x, e.y] = G.stage.clampPos(cx + Math.cos(a) * 115, cy + Math.sin(a) * 90);
    fxParticles(e.x, e.y, BPUR, 10, 80, 0.3);
    yield* gBeam(e, { tele: 0.42, len: 300, w: 4, dmg: 16, dur: 0.15, col: BRED });
  }
}
function* badeChasers(e) {
  bossSay(e, isChar('madeline') ? 'Corri pure. Sono io che inseguo te.' : 'Corri. Conosco già la tua strada.', true);
  for (const pl of alivePls()) for (const d of [0.9, 1.7]) addChaser(e, pl, d, { life: 8.5, drawAs: (c, q, x, y) => drawBadeAs(c, q, x, y, 0.9) });
  yield 0.6;
}
function* badeTwin(e) {
  yield* gTeleport(e, 120);
  const a = angTo(e), nx = -Math.sin(a), ny = Math.cos(a);
  for (const s of [-1, 1]) laserFrom(e, e.x + nx * 16 * s, e.y + ny * 16 * s, a, { len: 320, w: 4, dmg: 16, t: 0.6, col: BRED });
  yield 0.6;
  yield* gAimed(e, 3, 0.25, 170, 13, BPUR, 'orb', 2, 0.3);
}
BOSSES.badelineboss.phases = [
  PH(1, 'Riflesso', null, [
    { f: e => gAimed(e, 3, 0.4, 150, 14, BPUR, 'orb', 3, 0.3), w: 2, shout: ['Sei patetica.', 'Arrenditi.'] },
    { f: function* (e) { yield* gTeleport(e, 110); yield* gBeam(e, { tele: 0.7, len: 300, w: 5, dmg: 18, dur: 0.35, col: BRED }); }, w: 2 },
    { f: e => gRadial(e, 10, 90, 12, BPUR, 'orb', 2, 0.4), w: 1 },
    { f: function* (e) { yield* gTeleport(e, 140); const a = angTo(e); for (const d of [-0.35, 0, 0.35]) laserFrom(e, e.x, e.y - 8, a + d, { len: 300, w: 4, dmg: 16, t: 0.75 }); yield 1.0; }, w: 1.2, shout: ['Guarda bene.'] },
  ], { gap: 0.75 }),
  PH(0.66, 'Specchi', () => (isChar('madeline') ? 'Perché non ti arrendi?! Lo faccio per proteggerti!' : 'Non sai nemmeno chi sei. Io sì.'), [
    { f: badeMirrors, w: 1.6, when: e => countOwn(e, 'bossclone') < 2 },
    { f: badeCrossfire, w: 1.5 },
    { f: e => gSummon(e, 'seeker', 2, 50), w: 0.6 },
    { f: function* (e) { for (let i = 0; i < 3; i++) { yield* gTeleport(e, 100); yield* gBeam(e, { tele: 0.45, len: 280, w: 4, dmg: 16, dur: 0.2, col: BRED }); } }, w: 1.3 },
    { f: e => gAimed(e, 5, 0.6, 160, 13, BPUR, 'orb', 3, 0.35), w: 1 },
  ], { gap: 0.6, aura: BPUR }),
  PH(0.33, 'Il Picco', () => (isChar('madeline') ? 'Se cadi tu, cado anch\'io. Allora… NON FERMARTI!' : 'Sulla cima non c\'è posto per tutte e due!'), [
    { f: badeChasers, w: 1.5, when: e => countOwn(e, 'bosschaser') === 0 },
    { f: badeStar, w: 1.4 },
    { f: e => gRadial(e, 12, 85, 12, BPUR, 'orb', 4, 0.3, 0.3), w: 1 },
    { f: e => gRingIn(e, { n: 14, r: 92, col: BPUR, kind: 'orb', dmg: 13 }), w: 1.1 },
    { f: badeTwin, w: 1 },
  ], { gap: 0.5, aura: BRED }),
];

// =============================================================================
// PRIGIONI (Dead Cells) — La Mano del Re
// =============================================================================
const HOK = '#ff8a2a', HOKG = '#ffd23f', FIRE = '#ff6a2a';
function* hokShield(e, bash = 1, fire = false) {
  bossSay(e, pick(['Fermati!', 'Non passerai.', 'Lo scudo del Re non cede.']));
  let n = 0;
  yield* gGuard(e, { dur: 2.2, turn: 0.85, spd: 26, onTick: fire ? (e, t) => {
    if (++n % 4 === 0) { const a = e.guardA; for (const d of [-0.25, 0, 0.25]) eShootB(e.x, e.y - 6, a + d, 130, 14, { col: FIRE, kind: 'flame', r: 4 }); sfx('shot'); }
  } : null });
  yield* gFireCharge(e, bash, { spd: 440, tt: 0.5, col: HOKG, kind: fire ? 'fire' : null });
}
function* hokFlameLance(e) {
  const a = angTo(e);
  yield* gBeam(e, { tele: 0.6, len: 300, w: 6, dmg: 20, dur: 0.3, col: FIRE, ang: a });
  for (let i = 1; i <= 6; i++) hazard(e.x + Math.cos(a) * i * 46, e.y + Math.sin(a) * i * 46, 14, 4, 8, 'fire', { arm: 0.2 + i * 0.05 });
}
function* hokTripleSlam(e) {
  bossSay(e, 'Il pavimento del Re trema!');
  for (let i = 0; i < 3; i++) {
    yield* gSlam(e, { tele: 0.7, r: 40, dmg: 22, ring: 0 });
    shock(e.x, e.y, { spd: 130, dmg: 16, col: HOK, gaps: gapsToward(e.x, e.y, 2, 0.35), max: 300 });
  }
}
function* hokFireCircle(e) {
  // anello di fuoco con un varco, poi bombe all'interno: esci dal varco!
  const p = G.p, n = 12, g0 = Math.floor(rnd(n)), off = rnd(TAU);
  bossSay(e, 'Nessuna via di fuga!');
  for (let i = 0; i < n; i++) { if ((i - g0 + n) % n < 2) continue; const a = off + i / n * TAU; hazard(p.x + Math.cos(a) * 84, p.y + Math.sin(a) * 84, 16, 5, 8, 'fire', { arm: 0.8 }); }
  yield 0.6;
  yield* gRain(e, 6, { area: 60, r: 18, tele: 0.9, dmg: 18, col: FIRE });
}
BOSSES.handofking.phases = [
  PH(1, 'Guardiano del Trono', null, [
    { f: e => hokShield(e, 1), w: 1.6 },
    { f: function* (e) { for (let i = 0; i < 2; i++) yield* gBeam(e, { tele: 0.45, len: 110, w: 6, dmg: 20, dur: 0.15, col: HOKG }); }, w: 2, shout: ['In guardia!'] },
    { f: e => gSpikes(e, circlePts(G.p.x, G.p.y, 6, 48, rnd(TAU)).concat([[G.p.x, G.p.y]]), { r: 16, tele: 0.85, dmg: 18, col: FIRE }), w: 1.3, shout: ['Brucia!'] },
    { f: e => gSlam(e, { tele: 0.9, r: 44, dmg: 22, ring: 10, ringSpd: 110, ringCol: FIRE }), w: 1.2 },
  ], { gap: 0.75, onEnter: e => { e.guard = guardMul; } }),
  PH(0.66, 'Per il Re!', 'Per il Re! FIAMME!', [
    { f: e => gRain(e, 10, { area: 140, r: 16, tele: 0.85, dmg: 16, col: FIRE, onFire: t => hazard(t.x, t.y, 15, 4, 8, 'fire') }), w: 1.5, shout: ['Cenere!'] },
    { f: hokFlameLance, w: 1.4 },
    { f: e => hokShield(e, 1, true), w: 1.5 },
    { f: e => gFireCharge(e, 2), w: 1.2 },
  ], { gap: 0.6, aura: FIRE }),
  PH(0.33, 'L\'Ultimo Giuramento', 'Il Re non c\'è più… ma io servo ancora!', [
    { f: hokTripleSlam, w: 1.6 },
    { f: hokFireCircle, w: 1.2 },
    { f: function* (e) { yield* gWall(e, { kind: 'flame', col: FIRE, gap: 3, spd: 90, dmg: 16 }); yield 0.3; yield* gWall(e, { kind: 'flame', col: FIRE, gap: 3, spd: 90, dmg: 16, ang: angTo(e) + Math.PI / 2 }); }, w: 1.3 },
    { f: e => hokShield(e, 2, true), w: 1.2 },
  ], { gap: 0.5, aura: '#ff4a1a' }),
];

// =============================================================================
// CVSTODIA (Blasphemous) — Escribar
// =============================================================================
const ESC = '#e2c46a', HOLY = '#fff2b0', BLOOD = '#c41e2a';
BOSSES.escribar.sprPhase = 2;
BOSSES.escribar.phases = [
  PH(1, 'L\'Ultimo dei Supremi', null, [
    { f: e => gRain(e, 9, { area: 150, r: 15, tele: 1.0, dmg: 16, col: HOLY }), w: 2, shout: ['Luce su di te.'] },
    { f: e => gArc(e, { r: 72, half: 1.0, dmg: 20, tele: 0.65, col: ESC }), w: 1.5 },
    { f: e => gSummon(e, 'condemned', 4, 50), w: 0.8 },
    { f: e => gAimed(e, 7, 1.2, 130, 12, BLOOD, 'orb', 2, 0.5), w: 1.3, shout: ['Sanguina.'] },
  ], { gap: 0.8 }),
  PH(0.66, 'Penitenza', 'Il Miracolo mi ha scelto. Inginocchiati!', [
    { f: e => gPurge(e, { t: 2.6, r: 30, dmg: 26, label: 'PENITENZA: RIFUGIATI NELLA LUCE!' }), w: 1.4, shout: ['PENITENZA!'] },
    { f: e => gBeams(e, { n: 4, len: 300, w: 6, dmg: 18, sweep: 0.6, dur: 3.4, col: HOLY }), w: 1.3, shout: ['Croce di luce.'] },
    { f: e => gSpikes(e, circlePts(e.x, e.y, 10, 70, rnd(TAU)).concat(circlePts(e.x, e.y, 14, 120)), { r: 14, tele: 0.9, dmg: 16, col: HOLY }), w: 1.1 },
    { f: e => gBeam(e, { tele: 0.9, len: 360, w: 9, dmg: 20, dur: 1.1, sweep: 1.1, col: HOLY }), w: 1.2 },
    { f: e => gAimed(e, 9, 1.4, 130, 12, BLOOD, 'orb', 2, 0.5), w: 0.9 },
  ], { gap: 0.65, aura: HOLY }),
  PH(0.33, 'La Mostruosità Santa', '[La carne del Supremo si squarcia: ne esce il Miracolo stesso]', [
    { f: e => gRingIn(e, { n: 16, r: 96, col: BLOOD, kind: 'spear', dmg: 15 }), w: 1.3, shout: ['Corona di spine!'] },
    { f: e => gPurge(e, { t: 2.3, r: 26, dmg: 28, label: 'PENITENZA!', onFire: () => { for (let i = 0; i < 14; i++) eShootB(e.x, e.y, i / 14 * TAU, 100, 12, { col: BLOOD }); } }), w: 1.2 },
    { f: e => gBeam(e, { tele: 1.0, len: 420, w: 12, dmg: 22, dur: 2.0, sweep: 1.4, col: '#ff6a3a' }), w: 1.1, shout: ['Brucia nella grazia!'] },
    { f: function* (e) { yield* gWall(e, { kind: 'orb', col: BLOOD, gap: 3, spd: 85 }); yield 0.5; yield* gWall(e, { kind: 'orb', col: HOLY, gap: 3, spd: 85, ang: angTo(e) + Math.PI / 2 }); }, w: 1.2 },
    { f: e => gSummon(e, 'candlebearer', 3, 60), w: 0.6 },
  ], { gap: 0.5, aura: '#ff3a2a' }),
];

// =============================================================================
// TERRARIA — Il Signore della Luna
// =============================================================================
const MLC = '#7ff0e0';
const ML_EYES = [[-38, -15], [38, -15], [0, -37]];
function mlParts(e) {
  // fase 1: occhi delle mani e della testa. Il nucleo resta chiuso finché non cadono tutti
  ML_EYES.forEach(([ox, oy], i) => addPart(e, ox, oy, 0.08, { share: 1, floor: 0.67, col: MLC, r: i === 2 ? 8 : 9, slot: i }));
}
function* mlBolts(e) {
  for (const s of [-1, 1]) {
    const hx = e.x + s * 38, hy = e.y - 15;
    for (let i = 0; i < 3; i++) eShootB(hx, hy, Math.atan2(G.p.y - hy, G.p.x - hx) + (i - 1) * 0.2, 160, 14, { col: MLC, kind: 'bolt' });
    sfx('shot');
    yield 0.3;
  }
}
const mlHeadAlive = e => e.parts && e.parts.some(q => q.slot === 2 && !q.dead);
function trueEyeMove(q, dt) {
  q.oa += 0.9 * dt;
  const tx = q.own.x + Math.cos(q.oa) * 84, ty = q.own.y - 22 + Math.sin(q.oa) * 62;
  q.vx = (tx - q.x) * 3; q.vy = (ty - q.y) * 3;
}
function* trueEyeAct(q) {
  yield rnd(0.4, 1.4);
  const a = Math.atan2(G.p.y - q.y, G.p.x - q.x);
  tele({ kind: 'line', x1: q.x, y1: q.y, x2: q.x + Math.cos(a) * 60, y2: q.y + Math.sin(a) * 60, w: 3, t: 0.4, col: MLC });
  yield 0.4;
  for (let i = 0; i < 3; i++) { eShootB(q.x, q.y, a, 170, 13, { col: MLC, kind: 'bolt' }); yield 0.12; }
  yield 1.6;
}
function drawTrueEye(c, q, x, y) {
  const a = Math.atan2(G.p.y - q.y, G.p.x - q.x), t = G.t;
  for (let i = -1; i <= 1; i++) oLine(c, x + i * 3, y + 4, x + i * 4 + Math.sin(t * 5 + i) * 2, y + 11, '#5a8a84', 1);
  oEllipse(c, x, y, 7, 6, q.flash > 0 ? '#ffffff' : '#e8fff8');
  c.fillStyle = '#2a9a8a'; c.beginPath(); c.arc(x + Math.cos(a) * 2.5, y + Math.sin(a) * 2, 3, 0, TAU); c.fill();
  c.fillStyle = '#0a2a26'; c.beginPath(); c.arc(x + Math.cos(a) * 3, y + Math.sin(a) * 2.4, 1.4, 0, TAU); c.fill();
  c.fillStyle = '#ffffff'; c.fillRect(x - 3, y - 3, 1, 1);
  light(q.x, q.y, 26, MLC);
}
function* mlTrueEyes(e) {
  e.eyesT = G.t;
  bossSay(e, '[Tre Veri Occhi di Cthulhu si staccano dal corpo]', true);
  for (let i = 0; i < 3; i++) addClone(e, e.x, e.y - 22, { frac: 0.03, life: 16, col: MLC, r: 8, oa: i / 3 * TAU, move: trueEyeMove, mk: trueEyeAct, drawAs: drawTrueEye, barY: 12 });
  yield 0.8;
}
BOSSES.moonlord.partTag = 'OCCHI DEL SIGNORE DELLA LUNA';
BOSSES.moonlord.onPartDead = (e, q) => {
  (e.sockets = e.sockets || []).push([q.ox, q.oy]);
  bossSay(e, ['[La mano sinistra si accartoccia]', '[La mano destra si accartoccia]', '[L\'occhio della fronte esplode]'][q.slot] || '[Un occhio si spegne]');
};
BOSSES.moonlord.phases = [
  PH(1, 'Il Risveglio', null, [
    { f: mlBolts, w: 2 },
    { f: e => gHoming(e, 5, 80, 14, MLC, 1.6, 6), w: 1.3 },
    { f: e => (mlHeadAlive(e) ? gBeam(e, { tele: 1.0, len: 420, w: 9, dmg: 20, dur: 1.4, sweep: 0.9, col: MLC, from: [e.x, e.y - 37] }) : mlBolts(e)), w: 1.5 },
    { f: e => gRingIn(e, { n: 12, r: 92, col: MLC, kind: 'orb', dmg: 13 }), w: 1.1 },
    { f: e => gSummon(e, 'demoneye', 4, 50), w: 0.6 },
  ], { gap: 0.75, onEnter: mlParts, until: e => !!e.parts && e.parts.every(q => q.dead) }),
  PH(0.66, 'Il Cuore Esposto', '[L\'occhio nel petto si spalanca]', [
    { f: mlTrueEyes, w: 1.2, when: e => countOwn(e, 'bossclone') === 0 && G.t - (e.eyesT ?? -99) > 20 },
    { f: e => gBeam(e, { tele: 1.0, len: 420, w: 10, dmg: 22, dur: 1.8, sweep: 1.1, col: MLC, from: [e.x, e.y - 9] }), w: 1.4 },
    { f: mlBolts, w: 1.6 },
    { f: e => gRingIn(e, { n: 14, r: 96, col: MLC, kind: 'orb', dmg: 13 }), w: 1.2 },
    { f: e => gHoming(e, 6, 80, 14, MLC, 1.6, 6), w: 1 },
  ], { gap: 0.6, aura: MLC }),
  PH(0.33, 'Il Signore della Luna', '[Il Signore della Luna ruggisce: il cielo si spacca in due]', [
    { f: e => gBoth(gBeams(e, { n: 2, len: 380, w: 8, dmg: 20, sweep: 0.75, dur: 3.6, col: MLC, ofs: [0, -9] }), mlBolts(e)), w: 1.4 },
    { f: e => gRadial(e, 20, 90, 12, MLC, 'bolt', 4, 0.35, 0.15), w: 1.2 },
    { f: function* (e) { yield* gRingIn(e, { n: 14, r: 96, col: MLC, kind: 'orb' }); yield* gRingIn(e, { n: 14, r: 96, col: '#c9fff6', kind: 'orb' }); }, w: 1 },
    { f: e => gHoming(e, 7, 80, 14, MLC, 1.6, 6), w: 1 },
    { f: e => gRain(e, 10, { area: 150, r: 16, tele: 0.9, dmg: 16, col: MLC, onFire: t => hazard(t.x, t.y, 13, 3, 7, 'moon') }), w: 1.2 },
  ], { gap: 0.5, aura: '#aafff0' }),
];

// =============================================================================
// IL SEMINTERRATO (Isaac) — La Mamma
// =============================================================================
const MOMR = '#c41e2a';
function momDoorPos(p, side) {
  const a = side * Math.PI / 2 - Math.PI / 2;
  return G.stage.clampPos(p.x + Math.cos(a) * 165, p.y + Math.sin(a) * 118);
}
const twoSides = () => { const a = Math.floor(rnd(4)); return [a, (a + 1 + Math.floor(rnd(3))) % 4]; };
function* momStomp(e, n = 1, creep = false) {
  for (let i = 0; i < n; i++) {
    yield* gSlam(e, { tele: i ? 0.75 : 1.05, r: 30, dmg: 24, ring: 0 });
    if (creep) hazard(e.x, e.y, 22, 4.5, 7, 'blood');
    if (i < n - 1) { e.air = true; e.hidden = true; e.rise = true; e.tx = e.x; e.ty = e.y; e.airT = e.airMax = 0.18; yield 0.18; }
  }
  // il piede resta a terra un attimo: è il momento di colpirlo
  e.takeMul = 1.4; yield 1.6; e.takeMul = 1;
  e.air = true; e.hidden = true; e.rise = true; e.tx = e.x; e.ty = e.y; e.airT = e.airMax = 0.35;
  yield 0.4;
}
// come in Isaac, l'occhio e la mano che escono dalla porta si possono colpire: il danno va alla Mamma
function momDoorPart(e, d) {
  addPart(e, d.x - e.x, d.y - e.y, 1, { fixed: true, shield: false, share: 1, floor: 0, life: d.t, r: 11, col: MOMR, drawPart: drawDoorHit });
}
function drawDoorHit(c, q, x, y) {
  if (q.flash > 0) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 13, 0, TAU); c.stroke(); c.lineWidth = 1; }
}
function* gDoorEye(e, sides, o = {}) {
  const { n = 5, spread = 0.16, spd = 125, dmg = 14, angry = false, waves = 1 } = o;
  const doors = sides.map(s => { const [x, y] = momDoorPos(G.p, s); const d = addDoor(x, y, 'eye', 1.1 + waves * 0.45, { angry }); momDoorPart(e, d); return d; });
  yield 0.55;
  for (let w = 0; w < waves; w++) {
    for (const d of doors) {
      const a = Math.atan2(G.p.y - d.y, G.p.x - d.x);
      for (let i = 0; i < n; i++) eShootB(d.x, d.y, a + (i - (n - 1) / 2) * spread, spd, dmg, { col: MOMR, kind: 'orb', r: 4 });
    }
    sfx('shot');
    yield 0.45;
  }
}
function* gDoorHand(e, sides, o = {}) {
  const { dmg = 16, tt = 0.85, len = 200 } = o;
  const hands = sides.map(s => {
    const [x, y] = momDoorPos(G.p, s), a = Math.atan2(G.p.y - y, G.p.x - x);
    tele({ kind: 'line', x1: x, y1: y, x2: x + Math.cos(a) * len, y2: y + Math.sin(a) * len, w: 9, t: tt, col: '#f0c4ac' });
    const d = addDoor(x, y, 'hand', tt + 0.9, { a, len });
    momDoorPart(e, d);
    return d;
  });
  yield tt;
  for (const d of hands) {
    d.reach = 0;
    const x2 = d.x + Math.cos(d.a) * d.len, y2 = d.y + Math.sin(d.a) * d.len;
    // la mano afferra e trascina verso la porta
    forPls(() => {
      hurtPlayer(dmg, e);
      const [nx, ny] = norm(d.x - G.p.x, d.y - G.p.y);
      G.p.rx += nx * 380; G.p.ry += ny * 380; G.p.slowT = Math.max(G.p.slowT || 0, 1.2);
      fxText(G.p.x, G.p.y - 14, 'AFFERRATO!', '#ffb0a0', 0.8);
    }, onSeg(d.x, d.y, x2, y2, 9));
  }
  shake(4); sfx('hit');
  yield 0.7;
}
function* momDoorSummon(e, type, n) {
  const [x, y] = momDoorPos(G.p, Math.floor(rnd(4)));
  addDoor(x, y, 'eye', 1.4, {});
  yield 0.5;
  for (let i = 0; i < n; i++) spawnEnemy(type, x + rnd(-8, 8), y + rnd(-8, 8));
  fxParticles(x, y, MOMR, 10, 60, 0.4);
  yield 0.5;
}
function momHeartIn(e) {
  // il Cuore della Mamma emerge dal pavimento vicino a te
  e.heart = true; e.hidden = false; e.air = false; e.rise = false; e.takeMul = 1;
  [e.x, e.y] = G.stage.clampPos(G.p.x + rnd(-40, 40), G.p.y - 92);
  e.r = 16;
  fxParticles(e.x, e.y, MOMR, 40, 160, 0.8, 2); fxRing(e.x, e.y, 6, 70, MOMR, 0.5, 4); shake(9); sfx('boom');
}
function* momBeat(e) {
  for (let i = 0; i < 3; i++) {
    e.beat = 0.35;
    shock(e.x, e.y, { spd: 115, dmg: 16, col: '#e0303a', gaps: gapsToward(e.x, e.y, 2, 0.32), max: 320, w: 3 });
    sfx('boom'); shake(3);
    yield 0.75;
  }
}
function* momCreep(e) {
  const p = G.p;
  for (let i = 0; i < 6; i++) {
    const a = rnd(TAU), d = i ? rnd(30, 110) : 0, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    tele({ kind: 'circle', x, y, r: 20, t: 0.8, col: MOMR, fire: t => { hazard(t.x, t.y, 20, 5, 7, 'blood'); fxParticles(t.x, t.y, MOMR, 8, 60, 0.4); } });
    yield 0.08;
  }
  yield 0.8;
}
BOSSES.mom.hideOnTrans = true;
BOSSES.mom.phases = [
  PH(1, 'La Mamma', null, [
    { f: e => momStomp(e, 1), w: 3, shout: ['Isaac!', 'Dove sei?!'] },
    { f: e => gDoorEye(e, [Math.floor(rnd(4))], { n: 5, spread: 0.13 }), w: 1.5 },
    { f: e => gDoorHand(e, [Math.floor(rnd(4))]), w: 1.3, shout: ['Vieni qui!'] },
    { f: e => momDoorSummon(e, 'gaper', 3), w: 0.8, shout: ['Aiutatemi a trovarlo!'] },
  ], { gap: 0.8 }),
  PH(0.66, 'ISAAC!', 'ISAAC! VIENI QUI SUBITO!', [
    { f: e => momStomp(e, 3, true), w: 2.5 },
    { f: e => gDoorEye(e, [0, 1, 2, 3], { n: 3, spread: 0.2, waves: 2, angry: true }), w: 1.4, shout: ['Ti vedo!'] },
    { f: e => gDoorHand(e, twoSides()), w: 1.2, shout: ['Non scappare!'] },
    { f: e => momDoorSummon(e, pick(['ifly', 'clotty']), 4), w: 0.8 },
  ], { gap: 0.65, aura: MOMR }),
  PH(0.33, 'Il Cuore della Mamma', '[Il pavimento si apre: il cuore della Mamma batte all\'impazzata]', [
    { f: momBeat, w: 2 },
    { f: e => gRadial(e, 14, 85, 13, MOMR, 'orb', 4, 0.32, 0.2), w: 1.4 },
    { f: momCreep, w: 1 },
    { f: e => gRingIn(e, { n: 14, r: 92, col: '#8e1e24', kind: 'orb', dmg: 13 }), w: 1 },
    { f: e => gDoorHand(e, twoSides()), w: 0.8 },
  ], { gap: 0.55, aura: '#ff3a4a', onEnter: momHeartIn }),
];

// =============================================================================
// FINALE — La Cucitrice
// =============================================================================
const CUC = '#e2b04a';
function* cucStitch(e) {
  // Cucitura: tre file di punti attraversano lo schermo vicino a te, poi gli spilli schizzano ai lati
  const p = G.p;
  for (let i = 0; i < 3; i++) {
    const a = rnd(TAU), off = rnd(-50, 50), nx = -Math.sin(a), ny = Math.cos(a);
    const cx = p.x + nx * off, cy = p.y + ny * off, L = 260;
    const x1 = cx - Math.cos(a) * L, y1 = cy - Math.sin(a) * L, x2 = cx + Math.cos(a) * L, y2 = cy + Math.sin(a) * L;
    tele({ kind: 'line', x1, y1, x2, y2, w: 5, t: 0.9 + i * 0.25, col: CUC, fire: () => {
      hitLine(x1, y1, x2, y2, 5, 18, e);
      G.fx.push({ k: 'line', x1, y1, x2, y2, col: CUC, w: 2, life: 0.5, max: 0.5 });
      for (let k = 0; k < 8; k++) eShootB(x1 + (x2 - x1) * k / 7, y1 + (y2 - y1) * k / 7, a + Math.PI / 2 * (k % 2 ? 1 : -1), 70, 12, { col: CUC, kind: 'pin', life: 2 });
      sfx('shot');
    } });
  }
  yield 1.6;
}
function* cucAllEndings(e) {
  // tre maschere in fila, più veloci
  e.mask = 'badelineboss'; yield* gTeleport(e, 110); yield* gBeam(e, { tele: 0.45, len: 300, w: 5, dmg: 18, dur: 0.25, col: '#ff3050' });
  e.mask = 'hades'; yield* gSpin(e, { dur: 1.2, r: 34, dmg: 16, spd: 140, col: '#e0303a' });
  e.mask = 'mom'; yield* gRain(e, 6, { area: 100, r: 18, tele: 0.75, dmg: 16, col: '#c41e2a', onFire: t => hazard(t.x, t.y, 14, 3, 7, 'blood') });
}
BOSSES.cucitrice.sprPhase = 2;
BOSSES.cucitrice.phases = [
  PH(1, 'La Sarta', null, [
    { f: function* (e) { e.mask = 'gabriel'; bossSay(e, '«PREPARATI!» …così diceva lui, vero?'); yield* gAimed(e, 5, 0.7, 220, 15, '#ffe680', 'spear', 3, 0.4); }, w: 1.5 },
    { f: function* (e) { e.mask = 'hades'; yield* gSpin(e, { dur: 1.8, r: 34, dmg: 16, spd: 130, col: '#e0303a' }); }, w: 1.2 },
    { f: function* (e) { e.mask = 'badelineboss'; yield* gTeleport(e, 110); yield* gBeam(e, { tele: 0.6, len: 300, w: 5, dmg: 18, dur: 0.3, col: '#ff3050' }); }, w: 1.3 },
    { f: function* (e) { e.mask = 'mom'; yield* gRain(e, 7, { area: 120, r: 18, tele: 0.9, dmg: 16, col: '#c41e2a' }); }, w: 1.1 },
    { f: function* (e) { e.mask = 'hollowknight'; yield* gSpikes(e, linePts(e.x, e.y, angTo(e), 8, 26), { r: 14, tele: 0.7, dmg: 18, col: '#ff9a2a' }); }, w: 1.1 },
    { f: function* (e) { e.mask = null; yield* cucStitch(e); }, w: 1.3, shout: ['Un punto. Due punti. Tre.'] },
  ], { gap: 0.7 }),
  PH(0.66, 'Il Telaio', 'Basta orli. Ora… cucio te.', [
    { f: function* (e) { e.mask = null; yield* gBeams(e, { n: 3, len: 260, w: 5, dmg: 18, sweep: 0.7, dur: 3.6, col: CUC }); }, w: 1.3, shout: ['Fili d\'oro.'] },
    { f: function* (e) { e.mask = 'moonlord'; yield* gBeam(e, { tele: 0.9, len: 400, w: 9, dmg: 20, dur: 1.2, sweep: 1.0, col: '#7ff0e0' }); }, w: 1.1 },
    { f: function* (e) { e.mask = 'escribar'; yield* gPurge(e, { t: 2.5, r: 28, dmg: 26, col: '#8e2b3a', label: 'RIFUGIATI NELL\'ORLO DORATO!' }); }, w: 1.1 },
    { f: function* (e) { e.mask = 'gabriel'; yield* gRingIn(e, { n: 12, r: 90, kind: 'sword', col: '#fff2b0', dmg: 15 }); }, w: 1.1 },
    { f: function* (e) { e.mask = null; yield* gWall(e, { kind: 'pin', col: CUC, gap: 3, spd: 85, dmg: 13 }); }, w: 1.1 },
    { f: e => gRadial(e, 24, 95, 12, CUC, 'pin', 3, 0.4, 0.13), w: 0.9 },
  ], { gap: 0.6, aura: CUC, onEnter: e => {
    const c = G.center || G.p;
    G.arena = { x: c.x, y: c.y, r: 230, target: 175, base: 230, boss: true, own: e };
    banner('IL TELAIO SI CHIUDE', 'L\'arena si restringe: resta dentro l\'orlo dorato', 2.4, CUC);
  } }),
  PH(0.33, 'L\'Ultimo Filo', 'Va bene. Se deve finire… che finisca con un bel ricamo!', [
    { f: function* (e) { e.mask = 'hollowknight'; yield* gBoth(gSpikes(e, linePts(e.x, e.y, angTo(e), 8, 24), { r: 13, tele: 0.75, dmg: 18, col: '#ff9a2a' }), gBeams(e, { n: 2, len: 240, w: 5, dmg: 18, sweep: 0.8, dur: 2.6, col: CUC })); }, w: 1.3 },
    { f: function* (e) { e.mask = 'gabriel'; yield* gBoth(gRingIn(e, { n: 12, r: 92, kind: 'sword', col: '#fff2b0', dmg: 15 }), gAimed(e, 3, 0.4, 210, 14, '#ffe680', 'spear', 2, 0.6)); }, w: 1.2 },
    { f: function* (e) { e.mask = 'escribar'; yield* gPurge(e, { t: 2.2, r: 26, dmg: 28, col: '#8e2b3a', label: 'L\'ULTIMO ORLO!' }); yield* gRadial(e, 20, 95, 12, CUC, 'pin', 2, 0.4, 0.15); }, w: 1.1 },
    { f: cucAllEndings, w: 1.2, shout: ['Tutti i finali, insieme!'] },
    { f: e => gRadial(e, 28, 90, 12, CUC, 'pin', 4, 0.35, 0.11), w: 0.9 },
  ], { gap: 0.5, aura: '#fff2b0', onEnter: e => { if (G.arena && G.arena.boss) G.arena.target = 135; } }),
];

// =============================================================================
// MINI-BOSS — due fasi ciascuno
// =============================================================================
BOSSES.falseknight.phases = [
  PH(1, 'La Mazza', null, [
    { f: e => gSlam(e, { tele: 1.0, r: 38, dmg: 20, ring: 10, ringSpd: 95 }), w: 2 },
    { f: e => gArc(e, { r: 52, half: 0.9, dmg: 20, tele: 0.55 }), w: 2 },
    { f: e => gSpikes(e, linePts(e.x, e.y, angTo(e), 6, 28), { r: 14, tele: 0.7, dmg: 16 }), w: 1 },
  ], { gap: 0.8 }),
  PH(0.5, 'Il Verme nella Corazza', '[La corazza si incrina: dentro si agita un verme terrorizzato]', [
    { f: function* (e) { for (let i = 0; i < 3; i++) yield* gSlam(e, { tele: 0.62, r: 34, dmg: 18, ring: 8, ringSpd: 100 }); }, w: 2 },
    { f: function* (e) { yield* gArc(e, { r: 52, half: 0.9, dmg: 20, tele: 0.45 }); yield* gArc(e, { r: 52, half: 0.9, dmg: 20, tele: 0.35 }); }, w: 1.5 },
    { f: function* (e) { yield* gSlam(e, { tele: 0.8, r: 36, dmg: 20, ring: 0 }); shock(e.x, e.y, { spd: 120, dmg: 14, col: '#ff9a2a', gaps: gapsToward(e.x, e.y, 2, 0.4), max: 220 }); yield* gRain(e, 6, { area: 110, r: 14, tele: 0.9, dmg: 14, col: '#a89a7a' }); }, w: 1.3 },
    { f: e => gStagger(e, 1.8, '[Il verme è esposto: colpiscilo!]'), w: 0.9 },
  ], { gap: 0.6, aura: '#ff9a2a' }),
];

function* smThrow(e, n = 1) {
  // la spada torna indietro come un boomerang
  const a0 = angTo(e);
  for (let i = 0; i < n; i++) { const a = a0 + (n > 1 ? (i - (n - 1) / 2) * 0.5 : 0); eShootB(e.x, e.y, a, 270, 16, { col: '#c9ced8', kind: 'blade', ax: -Math.cos(a) * 320, ay: -Math.sin(a) * 320, life: 1.9, r: 5 }); }
  sfx('shot');
  yield 1.2;
}
BOSSES.swordsmachine.phases = [
  PH(1, 'Spadacchina', null, [
    { f: e => gDash(e, { tele: 0.5, spd: 420, dur: 0.45, times: 2 }), w: 2 },
    { f: e => smThrow(e, 1), w: 1.5 },
    { f: e => gAimed(e, 5, 0.8, 160, 10, '#ffd27a', 'orb', 1, 0.5), w: 1 },
  ], { gap: 0.8 }),
  PH(0.5, 'Furia', '> DANNO CRITICO. MODALITÀ FURIA ATTIVATA.', [
    { f: e => gSpin(e, { dur: 1.8, r: 26, dmg: 14, spd: 115, col: '#ff3a2a' }), w: 1.6 },
    { f: e => smThrow(e, 2), w: 1.4 },
    { f: e => gAimed(e, 5, 0.8, 170, 10, '#ffd27a', 'orb', 2, 0.35), w: 1.2 },
    { f: e => gDash(e, { tele: 0.36, spd: 480, dur: 0.38, times: 3, gap: 0.12, col: '#ff3a2a' }), w: 1.4 },
  ], { gap: 0.55, aura: '#ff3a2a' }),
];

// Megera chiama le sorelle: Aletto si lancia contro di te, Tisifone ti segue a distanza
function drawSister(c, q, x, y) {
  const s = SPR.megaera; if (!s) return;
  const flip = (q.face || 1) < 0, X = Math.round(x - s.w / 2), Y = Math.round(y + 10 - s.h);
  c.drawImage(q.flash > 0 ? (flip ? s.flipWhite : s.white) : (flip ? s.flip : s.img), X, Y);
  const key = 'tint_' + q.tint;
  if (!s[key]) { s[key] = tinted(s.img, q.tint); s[key + 'F'] = tinted(s.flip, q.tint); }
  c.globalAlpha *= 0.45; c.drawImage(flip ? s[key + 'F'] : s[key], X, Y); c.globalAlpha = 1;
  txt(c, q.label, x, y + 12, q.tint, 8, 'center');
}
function sisterMove(q, dt) {
  if (q.dash > 0) { q.dash -= dt; return; }
  const want = q.label === 'TISIFONE' ? 110 : 60, d = Math.hypot(G.p.x - q.x, G.p.y - q.y), [nx, ny] = norm(G.p.x - q.x, G.p.y - q.y);
  const k = d > want + 15 ? 1 : d < want - 15 ? -1 : 0;
  q.vx = (nx * k - ny * 0.5) * 55; q.vy = (ny * k + nx * 0.5) * 55;
}
function* sisterAct(q) {
  yield rnd(0.6, 1.4);
  const [dx, dy] = norm(G.p.x - q.x, G.p.y - q.y);
  if (q.label === 'ALETTO') {
    tele({ kind: 'line', x1: q.x, y1: q.y, x2: q.x + dx * 190, y2: q.y + dy * 190, w: 6, t: 0.55, col: q.tint });
    yield 0.55;
    q.dash = 0.45; q.vx = dx * 420; q.vy = dy * 420;
    for (let i = 0; i < 4; i++) { hitCircle(q.x, q.y, 10, 16, q.own); yield 0.1; }
  } else {
    laserFrom(q.own, q.x, q.y - 8, Math.atan2(G.p.y - q.y + 8, G.p.x - q.x), { len: 120, w: 5, dmg: 16, t: 0.5, col: q.tint });
    yield 0.6;
  }
  yield 1.3;
}
function* megSisters(e) {
  bossSay(e, 'Aletto! Tisifone! Venite a vedere!', true);
  for (const [label, tint, s] of [['ALETTO', '#ff8a3a', -1], ['TISIFONE', '#6aff8a', 1]]) {
    addClone(e, e.x + s * 40, e.y, { frac: 0.18, life: 15, col: tint, tint, label, r: 9, move: sisterMove, mk: sisterAct, drawAs: drawSister, barY: 30, dash: 0 });
  }
  yield 0.8;
}
BOSSES.megaera.phases = [
  PH(1, 'La Frusta', null, [
    { f: e => gBeam(e, { tele: 0.45, len: 90, w: 5, dmg: 16, dur: 0.15, col: '#c94a6a' }), w: 2 },
    { f: e => gRain(e, 5, { area: 90, r: 18, tele: 1.0, dmg: 16, col: '#c94a6a' }), w: 1.5 },
    { f: e => gDash(e, { tele: 0.5, spd: 400, dur: 0.4 }), w: 1.2 },
  ], { gap: 0.8 }),
  PH(0.5, 'Le Sorelle Furie', 'Basta giocare. Sorelle!', [
    { f: megSisters, w: 1.4, when: e => countOwn(e, 'bossclone') === 0 },
    { f: function* (e) { const a = angTo(e); for (const d of [-0.5, 0.5, 0]) yield* gBeam(e, { tele: 0.3, len: 100, w: 5, dmg: 16, dur: 0.12, col: '#c94a6a', ang: a + d }); }, w: 1.6, shout: ['Assaggia la frusta!'] },
    { f: e => gRain(e, 7, { area: 110, r: 18, tele: 0.9, dmg: 16, col: '#c94a6a' }), w: 1.2 },
    { f: e => gRingIn(e, { n: 12, r: 88, col: '#c94a6a', kind: 'orb', dmg: 12 }), w: 1 },
  ], { gap: 0.6, aura: '#c94a6a' }),
];

BOSSES.oshiroboss.phases = [
  PH(1, 'Il Signor Oshiro', null, [
    { f: e => gDash(e, { tele: 0.55, spd: 380, dur: 0.6, times: 3, gap: 0.15, col: '#ff6a3a' }), w: 2.5 },
    { f: e => gSummon(e, 'dustbunny', 6, 30), w: 1 },
  ], { gap: 0.8 }),
  PH(0.5, 'L\'Albergo è Chiuso', 'FUORI! FUORI DAL MIO ALBERGO!', [
    { f: e => gDash(e, { tele: 0.42, spd: 420, dur: 0.55, times: 4, gap: 0.1, col: '#ff6a3a', onEnd: e => hazard(e.x, e.y, 16, 3.5, 7, 'dust') }), w: 2.2 },
    { f: e => gRingIn(e, { n: 12, r: 88, col: '#c9c4d0', kind: 'orb', dmg: 12 }), w: 1.2, shout: ['Polvere! Ovunque!'] },
    { f: function* (e) { yield* gSummon(e, 'dustbunny', 8, 34); yield* gRadial(e, 12, 80, 11, '#ff9a6a', 'orb', 2, 0.4); }, w: 1 },
  ], { gap: 0.55, aura: '#ff6a3a' }),
];

BOSSES.conciergeboss.phases = [
  PH(1, 'Il Portinaio', null, [
    { f: e => gSlam(e, { tele: 1.0, r: 46, dmg: 22, ring: 8, ringSpd: 90 }), w: 2 },
    { f: e => gDash(e, { tele: 0.7, spd: 360, dur: 0.6 }), w: 1.5 },
    { f: function* (e) { yield* gArc(e, { r: 40, half: 1.0, dmg: 18, tele: 0.4 }); yield* gArc(e, { r: 44, half: 1.1, dmg: 20, tele: 0.3 }); }, w: 1.3 },
  ], { gap: 0.8 }),
  PH(0.5, 'Aura Infuocata', '[Il Portinaio ruggisce: il suo corpo prende fuoco]', [
    { f: function* (e) { for (let i = 0; i < 2; i++) { yield* gSlam(e, { tele: 0.8, r: 42, dmg: 22, ring: 0 }); shock(e.x, e.y, { spd: 120, dmg: 15, col: FIRE, gaps: gapsToward(e.x, e.y, 2, 0.4), max: 240 }); } }, w: 2 },
    { f: e => gFireCharge(e, 1, { spd: 400, tt: 0.6, col: '#ff4a2a' }), w: 1.5 },
    { f: e => gRain(e, 5, { area: 100, r: 16, tele: 0.9, dmg: 16, col: FIRE, onFire: t => hazard(t.x, t.y, 14, 3.5, 7, 'fire') }), w: 1 },
  ], { gap: 0.6, aura: '#ff4a2a', onEnter: e => { e.aura = { r: 30, dmg: 8, col: FIRE }; } }),
];

BOSSES.tenpiedadboss.phases = [
  PH(1, 'Ten Piedad', null, [
    { f: e => gSlam(e, { tele: 1.0, r: 42, dmg: 22, ring: 10 }), w: 2 },
    { f: e => gRain(e, 6, { area: 110, r: 16, tele: 1.0, dmg: 16, col: '#a89a7a' }), w: 1.5 },
    { f: e => gSpikes(e, linePts(e.x, e.y, angTo(e), 7, 26), { r: 14, tele: 0.75, dmg: 18, col: '#c9b48a' }), w: 1.2 },
  ], { gap: 0.8 }),
  PH(0.5, 'Senza Pietà', '[Ten Piedad urla: la terra si spacca sotto i suoi pugni]', [
    { f: function* (e) { for (let i = 0; i < 2; i++) { yield* gSlam(e, { tele: 0.8, r: 40, dmg: 22, ring: 0 }); shock(e.x, e.y, { spd: 110, dmg: 15, col: '#c9b48a', gaps: gapsToward(e.x, e.y, 2, 0.4), max: 240 }); } }, w: 1.8 },
    { f: e => gRain(e, 9, { area: 130, r: 16, tele: 0.9, dmg: 16, col: '#a89a7a' }), w: 1.3 },
    { f: e => { const a = angTo(e); return gSpikes(e, [0, 1, 2, 3].flatMap(k => linePts(e.x, e.y, a + k * Math.PI / 2, 6, 26)), { r: 13, tele: 0.8, dmg: 18, col: '#c9b48a' }); }, w: 1.2 },
    { f: e => gRingIn(e, { n: 12, r: 90, col: '#a89a7a', kind: 'orb', dmg: 13 }), w: 1 },
  ], { gap: 0.6, aura: '#ff8a2a' }),
];

function* eocCircle(e) {
  // gira attorno al bersaglio, poi tre cariche rapide da angoli diversi
  e.mv = 'stay';
  for (let i = 0; i < 3; i++) {
    const a = rnd(TAU);
    fxParticles(e.x, e.y, '#e0303a', 8, 60, 0.3);
    [e.x, e.y] = G.stage.clampPos(G.p.x + Math.cos(a) * 130, G.p.y + Math.sin(a) * 100);
    yield* gDash(e, { tele: 0.4, spd: 460, dur: 0.5, col: '#e0303a', gap: 0.05 });
  }
}
BOSSES.eocboss.phases = [
  PH(1, 'L\'Occhio', null, [
    { f: e => gDash(e, { tele: 0.45, spd: 420, dur: 0.5, times: 3, gap: 0.1 }), w: 2.5 },
    { f: e => gSummon(e, 'demoneye', 4, 30), w: 1 },
    { f: e => gAimed(e, 3, 0.3, 150, 12, '#e0303a', 'orb', 2, 0.4), w: 0.8 },
  ], { gap: 0.8 }),
  PH(0.5, 'La Bocca', '[L\'iride si strappa: al suo posto, una bocca piena di denti]', [
    { f: e => gDash(e, { tele: 0.34, spd: 480, dur: 0.42, times: 5, gap: 0.05, col: '#e0303a' }), w: 2.5 },
    { f: function* (e) { yield* gSummon(e, 'demoneye', 6, 34); yield* gRadial(e, 10, 80, 12, '#e0303a', 'orb', 1); }, w: 1 },
    { f: eocCircle, w: 1.2 },
  ], { gap: 0.5, aura: '#e0303a', onEnter: e => { e.mouth = true; } }),
];

BOSSES.monstroboss.phases = [
  PH(1, 'Monstro', null, [
    { f: e => gSlam(e, { tele: 1.0, r: 34, dmg: 22, ring: 0 }), w: 2 },
    { f: e => gAimed(e, 9, 1.0, 120, 12, '#c41e2a', 'orb', 1, 0.6), w: 2 },
  ], { gap: 0.8 }),
  PH(0.5, 'Monstro Infuriato', '[Monstro si gonfia di rabbia]', [
    { f: function* (e) { for (let i = 0; i < 3; i++) yield* gSlam(e, { tele: 0.5, r: 26, dmg: 18, ring: 6, ringSpd: 90, ringCol: '#c41e2a' }); }, w: 2 },
    { f: function* (e) { yield* gSlam(e, { tele: 1.0, r: 36, dmg: 22, ring: 14, ringSpd: 100, ringCol: '#c41e2a' }); for (let i = 0; i < 4; i++) { const a = rnd(TAU); hazard(e.x + Math.cos(a) * 30, e.y + Math.sin(a) * 30, 14, 4, 7, 'blood'); } }, w: 1.5 },
    { f: e => gAimed(e, 9, 1.0, 125, 12, '#c41e2a', 'orb', 2, 0.45), w: 1.5 },
  ], { gap: 0.55, aura: '#c41e2a' }),
];

// =============================================================================
// DISEGNI DELLE NUOVE FASI
// =============================================================================
// Signore della Luna: gli occhi distrutti restano orbite vuote che sanguinano
BOSSES.moonlord.draw = (c, e, x, y) => {
  bossSprite(c, e, x, y, 'moonlord', { noFlip: true });
  if (e.sockets) for (const [ox, oy] of e.sockets) {
    const sx = x + ox, sy = y + oy;
    oEllipse(c, sx, sy, 5, 4, '#1a0a14');
    c.fillStyle = '#5a1e2a'; c.fillRect(sx - 2, sy - 1, 4, 2);
    c.fillStyle = '#2a8a7a'; c.fillRect(sx - 1, sy + 4, 1, 3 + Math.round(Math.sin(G.t * 2 + ox) + 1)); c.fillRect(sx + 2, sy + 4, 1, 2);
  }
};
// La Mamma: il piede (fasi 1-2) e il Cuore (fase 3)
function drawMomHeart(c, e, x, y) {
  const t = G.t, beat = e.beat > 0 ? e.beat / 0.35 : 0;
  if (e.beat > 0) e.beat -= 1 / 60;
  const s = 1 + 0.09 * beat + 0.03 * Math.max(0, Math.sin(t * 7));
  const hx = x, hy = y - 22, f = e.flash > 0 ? '#ffffff' : null;
  c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(x, y + 4, 20, 6, 0, 0, TAU); c.fill();
  // arterie in cima: aorta ad arco, polmonare, vena cava
  oLine(c, hx - 2 * s, hy - 14 * s, hx - 4 * s, hy - 27 * s, f || '#c84a50', 6);
  oLine(c, hx - 4 * s, hy - 27 * s, hx - 13 * s, hy - 29 * s, f || '#c84a50', 6);
  oLine(c, hx - 13 * s, hy - 29 * s, hx - 15 * s, hy - 22 * s, f || '#c84a50', 5);
  oLine(c, hx + 5 * s, hy - 14 * s, hx + 9 * s, hy - 26 * s, f || '#b8303a', 5);
  oLine(c, hx + 11 * s, hy - 11 * s, hx + 17 * s, hy - 19 * s, f || '#8e2b5a', 4);
  for (const [ax, ay] of [[-15, -22], [9, -26], [17, -19]]) { c.fillStyle = '#2a0a10'; c.beginPath(); c.ellipse(hx + ax * s, hy + ay * s, 2, 1.5, 0, 0, TAU); c.fill(); }
  // corpo del cuore: un'unica sagoma (niente cuciture tra i lobi)
  const path = () => {
    c.beginPath();
    c.moveTo(hx - 4 * s, hy - 16 * s);
    c.bezierCurveTo(hx - 18 * s, hy - 22 * s, hx - 23 * s, hy - 2 * s, hx - 12 * s, hy + 10 * s);
    c.bezierCurveTo(hx - 6 * s, hy + 16 * s, hx + 1 * s, hy + 22 * s, hx + 4 * s, hy + 21 * s);
    c.bezierCurveTo(hx + 16 * s, hy + 12 * s, hx + 23 * s, hy - 8 * s, hx + 12 * s, hy - 16 * s);
    c.bezierCurveTo(hx + 6 * s, hy - 20 * s, hx, hy - 18 * s, hx - 4 * s, hy - 16 * s);
    c.closePath();
  };
  path(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.fillStyle = f || '#9e1420'; c.fill(); c.lineWidth = 1;
  if (!f) {
    c.save(); path(); c.clip();
    c.fillStyle = '#7a0e18'; c.beginPath(); c.ellipse(hx + 10 * s, hy + 6 * s, 12 * s, 16 * s, -0.3, 0, TAU); c.fill();
    c.fillStyle = '#c42a34'; c.beginPath(); c.ellipse(hx - 8 * s, hy - 7 * s, 7 * s, 9 * s, -0.4, 0, TAU); c.fill();
    c.fillStyle = '#e0505a'; c.beginPath(); c.ellipse(hx - 10 * s, hy - 9 * s, 3 * s, 4.5 * s, -0.4, 0, TAU); c.fill();
    c.fillStyle = '#ffb0b8'; c.fillRect(Math.round(hx - 11 * s), Math.round(hy - 12 * s), 2, 2);
    // solco coronarico e vene
    c.strokeStyle = '#5a0a12'; c.lineWidth = 2; c.beginPath(); c.moveTo(hx + 7 * s, hy - 13 * s); c.quadraticCurveTo(hx + 1 * s, hy + 2 * s, hx + 3 * s, hy + 18 * s); c.stroke();
    c.lineWidth = 1; c.strokeStyle = '#6a1a5a';
    c.beginPath(); c.moveTo(hx - 9 * s, hy - 2 * s); c.lineTo(hx - 5 * s, hy + 4 * s); c.lineTo(hx - 7 * s, hy + 11 * s); c.moveTo(hx - 5 * s, hy + 4 * s); c.lineTo(hx + 1 * s, hy + 7 * s); c.moveTo(hx + 13 * s, hy - 6 * s); c.lineTo(hx + 10 * s, hy + 3 * s); c.stroke();
    c.restore();
  }
  light(e.x, e.y - 22, 60 + 30 * beat, '#ff3a4a');
}
BOSSES.mom.draw = (c, e, x, y) => { if (e.heart) drawMomHeart(c, e, x, y); else bossSprite(c, e, x, y, 'mom', { noFlip: true }); };
// L'Occhio di Cthulhu nella seconda fase: al posto dell'iride, una bocca con i denti
{
  const base = BOSSES.eocboss.draw;
  BOSSES.eocboss.draw = (c, e, x, y) => {
    base(c, e, x, y);
    if (!e.mouth || e.flash > 0) return;
    const s = SPR.eoc, fx = (e.face || 1) < 0 ? -1 : 1;
    const mx = Math.round(x + fx * (33 - s.w / 2)), my = Math.round(y + e.r - s.h + 15);
    c.fillStyle = INK; c.beginPath(); c.arc(mx, my, 8, 0, TAU); c.fill();
    c.fillStyle = '#5a0a12'; c.beginPath(); c.arc(mx, my, 7, 0, TAU); c.fill();
    c.fillStyle = '#1a0408'; c.beginPath(); c.arc(mx, my, 4, 0, TAU); c.fill();
    c.fillStyle = '#f2ead8';
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU + Math.sin(G.t * 10) * 0.05;
      const bx = mx + Math.cos(a) * 6, by = my + Math.sin(a) * 6;
      c.beginPath(); c.moveTo(bx + Math.cos(a + 1.4) * 1.6, by + Math.sin(a + 1.4) * 1.6); c.lineTo(bx - Math.cos(a + 1.4) * 1.6, by - Math.sin(a + 1.4) * 1.6); c.lineTo(mx + Math.cos(a) * 3, my + Math.sin(a) * 3); c.fill();
    }
  };
}

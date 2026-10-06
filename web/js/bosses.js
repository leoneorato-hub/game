'use strict';
function eShootB(x, y, a, spd, dmg, o = {}) { o.force = true; eShoot(x, y, a, spd, dmg, o); }
// =============================================================================
// BOSS (Alfa 2) — i boss finali dei giochi indie e i loro mini-boss.
// Ogni boss è uno "script" a generatori: `yield s` aspetta s secondi mentre il
// boss continua a muoversi. Gli attacchi sono sempre telegrafati (cerchi e
// linee rosse che si chiudono) così si possono leggere e schivare.
// =============================================================================

// --- Telegrafi -------------------------------------------------------------------
function tele(o) { o.max = o.t; G.teles.push(o); return o; }
function updateTeles(dt) {
  for (const o of G.teles) { o.t -= dt; if (o.t <= 0 && !o.done) { o.done = true; o.fire && o.fire(o); } }
  G.teles = G.teles.filter(o => !o.done);
}
function drawTeles(c) {
  for (const o of G.teles) {
    const k = 1 - o.t / o.max;
    const col = o.col || '#ff3a4a';
    c.globalAlpha = 0.18 + 0.3 * k;
    c.fillStyle = col; c.strokeStyle = col;
    if (o.kind === 'circle') {
      const x = Math.round(o.x - camX), y = Math.round(o.y - camY);
      c.beginPath(); c.arc(x, y, o.r, 0, TAU); c.fill();
      c.globalAlpha = 0.9; c.lineWidth = 1;
      c.beginPath(); c.arc(x, y, o.r, 0, TAU); c.stroke();
      c.beginPath(); c.arc(x, y, Math.max(1, o.r * (1 - k)), 0, TAU); c.stroke();
    } else if (o.kind === 'line') {
      const [dx, dy] = norm(o.x2 - o.x1, o.y2 - o.y1);
      const len = Math.hypot(o.x2 - o.x1, o.y2 - o.y1);
      c.save(); c.translate(Math.round(o.x1 - camX), Math.round(o.y1 - camY)); c.rotate(Math.atan2(dy, dx));
      c.fillRect(0, -o.w, len, o.w * 2);
      c.globalAlpha = 0.9; c.fillRect(0, -1, len * k, 2);
      c.restore();
    } else if (o.kind === 'arc') {
      const x = Math.round(o.x - camX), y = Math.round(o.y - camY);
      c.beginPath(); c.moveTo(x, y); c.arc(x, y, o.r, o.a - o.half, o.a + o.half); c.closePath(); c.fill();
    }
  }
  c.globalAlpha = 1; c.lineWidth = 1;
}

// --- Colpi verso il giocatore --------------------------------------------------------
// (Alfa 4) colpiscono ogni giocatore vivo nell'area, non solo il primo
function hitCircle(x, y, r, dmg, src) {
  let hit = false;
  forPls(() => { hurtPlayer(dmg, src); hit = true; }, p => !(p.flyHigh > 0) && d2(x, y, p.x, p.y) < (r + p.r) ** 2);
  return hit;
}
function hitLine(x1, y1, x2, y2, w, dmg, src) {
  const [dx, dy] = norm(x2 - x1, y2 - y1), len = Math.hypot(x2 - x1, y2 - y1);
  let hit = false;
  forPls(() => { hurtPlayer(dmg, src); hit = true; }, p => {
    const t = clamp((p.x - x1) * dx + (p.y - y1) * dy, 0, len);
    const px = x1 + dx * t - p.x, py = y1 + dy * t - p.y;
    return px * px + py * py < (w + p.r) ** 2;
  });
  return hit;
}
const angTo = e => Math.atan2(G.p.y - e.y, G.p.x - e.x);

// --- Battute dei boss in combattimento -------------------------------------------------
function bossSay(e, text, big) {
  e.bubble = { text, t: big ? 2.6 : 1.6, max: big ? 2.6 : 1.6 };
  voiceBlips(e.def.voice || 'boss', text, 10);
}

// --- Mattoni degli attacchi (generatori) ------------------------------------------------
function* gRadial(e, n, spd, dmg, col, kind = 'orb', waves = 1, gap = 0.35, spin = 0.2) {
  let off = rnd(TAU);
  for (let w = 0; w < waves; w++) {
    for (let i = 0; i < n; i++) eShootB(e.x, e.y, off + i / n * TAU, spd, dmg, { col, kind });
    off += spin; yield gap;
  }
}
function* gAimed(e, n, arc, spd, dmg, col, kind = 'orb', waves = 1, gap = 0.25) {
  for (let w = 0; w < waves; w++) {
    const a0 = angTo(e);
    for (let i = 0; i < n; i++) eShootB(e.x, e.y, a0 + (n > 1 ? (i / (n - 1) - 0.5) * arc : 0), spd, dmg, { col, kind });
    sfx('shot'); yield gap;
  }
}
function* gDash(e, o = {}) {
  const { tele: tt = 0.55, spd = 430, dur = 0.5, times = 1, gap = 0.25, col } = o;
  for (let i = 0; i < times; i++) {
    const [dx, dy] = norm(G.p.x - e.x, G.p.y - e.y);
    e.mv = 'stay'; e.face = dx;
    tele({ kind: 'line', x1: e.x, y1: e.y, x2: e.x + dx * spd * dur, y2: e.y + dy * spd * dur, w: e.r * 0.7, t: tt, col });
    yield tt;
    e.mv = 'dash'; e.dvx = dx * spd; e.dvy = dy * spd; e.trail = 0.6;
    yield dur;
    e.mv = e.def.mv || 'chase';
    o.onEnd?.(e);
    yield gap;
  }
}
function* gSlam(e, o = {}) {
  const { tele: tt = 0.9, r = 40, dmg = 24, ring = 12, ringSpd = 110, col, ringCol = '#ff9a5a' } = o;
  const tx = G.p.x, ty = G.p.y;
  e.mv = 'stay'; e.air = true; e.hidden = true; e.tx = tx; e.ty = ty; e.airT = tt; e.airMax = tt;
  tele({ kind: 'circle', x: tx, y: ty, r, t: tt, col });
  yield tt;
  e.x = tx; e.y = ty; e.air = false; e.hidden = false;
  hitCircle(tx, ty, r, dmg, e);
  fxRing(tx, ty, 6, r + 10, '#ffffff', 0.35, 3); fxParticles(tx, ty, '#c9c4b8', 18, 120, 0.5, 2);
  shake(7); sfx('boom');
  if (ring) for (let i = 0; i < ring; i++) eShootB(tx, ty, i / ring * TAU, ringSpd, dmg * 0.6, { col: ringCol, kind: 'orb' });
  e.mv = e.def.mv || 'chase';
  yield 0.5;
}
function* gRain(e, n, o = {}) {
  const { area = 120, r = 16, tele: tt = 0.9, dmg = 16, col, stagger = 0.05, onFire } = o;
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU), d = i === 0 ? 0 : rnd(10, area);
    const x = G.p.x + Math.cos(a) * d, y = G.p.y + Math.sin(a) * d;
    tele({ kind: 'circle', x, y, r, t: tt, col, fire: t => { hitCircle(t.x, t.y, t.r, dmg, e); fxRing(t.x, t.y, 2, t.r + 4, col || '#ffd27a', 0.3, 2); fxParticles(t.x, t.y, col || '#ffd27a', 6, 70, 0.35); onFire?.(t); } });
    yield stagger;
  }
  yield tt;
}
function* gSpikes(e, pts, o = {}) {
  const { r = 16, tele: tt = 0.8, dmg = 18, col } = o;
  for (const [x, y] of pts) tele({ kind: 'circle', x, y, r, t: tt, col, fire: t => { hitCircle(t.x, t.y, t.r, dmg, e); fxParticles(t.x, t.y, col || '#ff9a2a', 8, 90, 0.4); } });
  yield tt;
}
function* gBeam(e, o = {}) {
  const { tele: tt = 0.7, len = 340, w = 7, dmg = 22, dur = 0.55, sweep = 0, col = '#ffe680', from } = o;
  const a = o.ang ?? angTo(e);
  const sx = from ? from[0] : e.x, sy = from ? from[1] : e.y;
  e.mv = 'stay';
  tele({ kind: 'line', x1: sx, y1: sy, x2: sx + Math.cos(a) * len, y2: sy + Math.sin(a) * len, w, t: tt, col });
  yield tt;
  e.beam = { a, len, w, dmg, t: dur, sweep, col, k: 0, ox: from ? from[0] - e.x : 0, oy: from ? from[1] - e.y : 0 };
  shake(4); sfx('boom');
  yield dur;
  e.beam = null;
  e.mv = e.def.mv || 'chase';
}
function* gSummon(e, type, n, r = 40) {
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + rnd(0.4);
    spawnEnemy(type, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
    fxParticles(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, '#c9a6ff', 6, 40, 0.4);
  }
  yield 0.4;
}
function* gTeleport(e, dist = 80) {
  fxParticles(e.x, e.y, e.def.col || '#ffffff', 16, 90, 0.4);
  e.hidden = true; e.fade = 1;
  yield 0.3;
  const a = rnd(TAU);
  e.x = G.p.x + Math.cos(a) * dist; e.y = G.p.y + Math.sin(a) * dist;
  [e.x, e.y] = G.stage.clampPos(e.x, e.y);
  e.hidden = false;
  fxParticles(e.x, e.y, e.def.col || '#ffffff', 16, 90, 0.4);
  yield 0.25;
}
function* gHoming(e, n, spd, dmg, col, turn = 2.2, life = 5) {
  for (let i = 0; i < n; i++) { eShootB(e.x, e.y, angTo(e) + rnd(-1.2, 1.2), spd, dmg, { col, kind: 'orb', homing: turn, life, r: 4 }); yield 0.15; }
}
function* gSpin(e, o = {}) {
  const { dur = 1.8, r = 32, dmg = 16, spd = 150, col = '#ffd23f' } = o;
  e.spin = { r, dmg, col, k: 0 }; e.mv = 'chase'; e.spdOv = spd;
  yield dur;
  e.spin = null; e.spdOv = null;
  e.mv = e.def.mv || 'chase';
  yield 0.3;
}
function* gArc(e, o = {}) {
  const { r = 44, half = 1.1, dmg = 20, tele: tt = 0.4, col } = o;
  const a = angTo(e);
  e.mv = 'stay';
  tele({ kind: 'arc', x: e.x, y: e.y, r, a, half, t: tt, col });
  yield tt;
  forPls(() => hurtPlayer(dmg, e), p => {
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
    const da = Math.abs(((Math.atan2(dy, dx) - a + Math.PI * 3) % TAU) - Math.PI);
    return d < r + p.r && da < half;
  });
  fxArc(e.x, e.y, a, half, r * 0.85, e.def.col || '#ffffff', 0.15, 4);
  e.mv = e.def.mv || 'chase';
  yield 0.2;
}
function* gStagger(e, dur, text) {
  e.mv = 'stay'; e.stunned = dur; e.takeMul = 2;
  if (text) bossSay(e, text);
  yield dur;
  e.stunned = 0; e.takeMul = e.def.takeMul ?? 1;
  e.mv = e.def.mv || 'chase';
}
const circlePts = (x, y, n, r, off = 0) => Array.from({ length: n }, (_, i) => [x + Math.cos(off + i / n * TAU) * r, y + Math.sin(off + i / n * TAU) * r]);
const linePts = (x, y, a, n, step) => Array.from({ length: n }, (_, i) => [x + Math.cos(a) * step * (i + 1), y + Math.sin(a) * step * (i + 1)]);

// --- IA comune dei boss -------------------------------------------------------------------
function bossMove(e, dt) {
  const p = G.p, def = e.def;
  const spd = e.spdOv || def.spd || 50;
  const [nx, ny] = norm(p.x - e.x, p.y - e.y);
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  switch (e.mv) {
    case 'dash': e.vx = e.dvx; e.vy = e.dvy; break;
    case 'stay': e.vx = e.vy = 0; break;
    case 'keep': { const want = def.keep || 120; const k = d > want + 20 ? 1 : d < want - 20 ? -1 : 0; e.vx = (nx * k - ny * 0.6) * spd; e.vy = (ny * k + nx * 0.6) * spd; break; }
    case 'path': {
      const h = G.hist; let pt = null;
      for (let i = h.length - 1; i >= 0; i--) if (h[i].t <= G.t - 0.9) { pt = h[i]; break; }
      if (pt) { const [ax, ay] = norm(pt.x - e.x, pt.y - e.y); e.vx = ax * spd * 1.3; e.vy = ay * spd * 1.3; } else { e.vx = nx * spd; e.vy = ny * spd; }
      break;
    }
    default: e.vx = d > 18 ? nx * spd : 0; e.vy = d > 18 ? ny * spd : 0;
  }
  if (Math.abs(e.vx) > 1) e.face = Math.sign(e.vx);
  if (e.trail > 0) { e.trail -= dt; if (G.frame % 2 === 0) G.fx.push({ k: 'ghost', x: e.x, y: e.y, life: 0.25, max: 0.25, e }); }
  if (e.spin) { e.spin.k -= dt; if (e.spin.k <= 0) { e.spin.k = 0.25; hitCircle(e.x, e.y, e.spin.r, e.spin.dmg, e); } }
  if (e.beam) {
    const b = e.beam;
    b.a += b.sweep * dt; b.k -= dt;
    const sx = e.x + b.ox, sy = e.y + b.oy;
    if (b.k <= 0) { b.k = 0.3; hitLine(sx, sy, sx + Math.cos(b.a) * b.len, sy + Math.sin(b.a) * b.len, b.w, b.dmg, e); }
  }
}

function bossAI(e, dt) {
  const def = e.def;
  if (def.phase2 && !e.p2 && e.hp < e.maxHp * 0.5) {
    e.p2 = true; e.co = null; e.wait = 0.8; e.mv = def.mv || 'chase'; e.beam = null; e.spin = null; e.spdOv = null;
    def.onPhase2?.(e);
    if (def.p2line) bossSay(e, typeof def.p2line === 'function' ? def.p2line() : def.p2line, true);
    shake(6); fxRing(e.x, e.y, 10, 80, def.col || '#ffffff', 0.6, 3);
  }
  bossMove(e, dt);
  if (e.wait > 0) { e.wait -= dt; return; }
  if (!e.co) {
    const pool = def.patterns.filter(pt => (!pt.p2 || e.p2) && pt !== e.lastPat);
    const tot = pool.reduce((a, pt) => a + (pt.w || 1), 0);
    let r = rnd(tot), pick0 = pool[0];
    for (const pt of pool) { r -= pt.w || 1; if (r <= 0) { pick0 = pt; break; } }
    e.lastPat = pick0;
    e.co = pick0.f(e);
    if (pick0.shout && Math.random() < 0.6) bossSay(e, pick(pick0.shout));
  }
  const res = e.co.next();
  if (res.done) { e.co = null; e.wait = (def.gap ?? 0.8) * (e.p2 ? 0.7 : 1); }
  else e.wait = res.value || 0;
}

function bossDraw(c, e, x, y) {
  const def = e.def;
  if (e.air) {
    const k = 1 - e.airT / e.airMax;
    e.airT = Math.max(0, e.airT - 1 / 60);
    const sx = Math.round(e.tx - camX), sy = Math.round(e.ty - camY);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(sx, sy + 4, e.r * (0.4 + k * 0.8), e.r * (0.2 + k * 0.4), 0, 0, TAU); c.fill();
    c.globalAlpha = 0.5 + 0.5 * k;
    def.draw(c, e, sx, sy - 140 * (1 - k));
    c.globalAlpha = 1;
    return;
  }
  if (e.hidden) return;
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, y + e.r * 0.8, e.r * 0.9, e.r * 0.3, 0, 0, TAU); c.fill();
  if (e.stunned > 0) { c.globalAlpha = 0.7 + 0.3 * Math.sin(G.t * 30); }
  def.draw(c, e, x, y);
  c.globalAlpha = 1;
  if (e.beam) {
    const b = e.beam, sx = x + b.ox, sy = y + b.oy;
    c.save(); c.translate(sx, sy); c.rotate(b.a);
    c.fillStyle = b.col; c.globalAlpha = 0.45; c.fillRect(0, -b.w - 2, b.len, (b.w + 2) * 2);
    c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(0, -Math.max(1, b.w / 3), b.len, Math.max(2, b.w / 1.5));
    c.restore();
  }
  if (e.spin) { c.strokeStyle = e.spin.col; c.lineWidth = 2; for (let i = 0; i < 3; i++) { const a = G.t * 14 + i * 2.1; c.beginPath(); c.arc(x, y, e.spin.r, a, a + 0.9); c.stroke(); } c.lineWidth = 1; }
  if (e.stunned > 0) txt(c, '★', x, y - e.r - 18, '#ffd23f', 8, 'center');
  if (e.bubble) {
    const b = e.bubble;
    b.t -= 1 / 60; if (b.t <= 0) e.bubble = null;
    else { const w = tw(c, b.text) + 10; c.globalAlpha = Math.min(1, b.t * 3); patch(c, x - w / 2, y - e.r - 34, w, 14, def.col || '#ffffff'); txt(c, b.text, x, y - e.r - 31, def.col || '#ffffff', 8, 'center'); c.globalAlpha = 1; }
  }
}

// --- Disegno: piccoli aiuti ------------------------------------------------------------------
function oEllipse(c, x, y, rx, ry, col, rot = 0) { c.fillStyle = INK; c.beginPath(); c.ellipse(x, y, rx + 1, ry + 1, rot, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); }
function oPoly(c, pts, col) {
  c.fillStyle = INK; c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.stroke();
  c.fillStyle = col; c.fill(); c.lineWidth = 1;
}
function oLine(c, x1, y1, x2, y2, col, w = 2) { c.strokeStyle = INK; c.lineWidth = w + 2; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); c.lineWidth = 1; }
const fl = e => (e.flash > 0 ? '#ffffff' : null);

// =============================================================================
// DEFINIZIONI
// =============================================================================
const BOSSES = {
  // ---------------------------------------------------------------- HOLLOWNEST
  hollowknight: {
    name: 'Il Cavaliere Cavo', title: 'Vaso Puro, Prigione della Luce', hp: 3200, r: 13, spd: 62, col: '#ff9a2a', voice: 'radiance', home: 'knight',
    phase2: true, p2line: '[Le catene cedono. L\'Infezione trabocca.]',
    patterns: [
      { f: function* (e) { yield* gDash(e, { tele: 0.5, spd: 470, dur: 0.45, col: '#ff9a2a', gap: 0 }); yield* gArc(e, { r: 40, dmg: 20, tele: 0.18, col: '#f4f1e8' }); }, w: 2 },
      { f: function* (e) { for (let i = 0; i < 3; i++) yield* gArc(e, { r: 42, half: 1.0, dmg: 18, tele: 0.32, col: '#f4f1e8' }); }, w: 2 },
      { f: e => gRadial(e, 12, 85, 14, '#ff9a2a', 'orb', 2, 0.4), w: 1.2 },
      { f: e => gSpikes(e, linePts(e.x, e.y, angTo(e), 7, 26), { r: 14, tele: 0.75, dmg: 18, col: '#ff9a2a' }), w: 1.5, p2: true },
      { f: e => gStagger(e, 1.6, '[Si trafigge con il proprio Aculeo]'), w: 0.8, p2: true },
      { f: e => gRain(e, 8, { area: 130, r: 16, tele: 0.9, dmg: 16, col: '#ff9a2a' }), w: 1.2, p2: true },
    ],
    draw(c, e, x, y) {
      const t = G.t, bob = Math.round(Math.sin(t * 3)), f = fl(e);
      const cl = [[x - 13, y - 6], [x + 13, y - 6], [x + 15, y + 14], [x + 9, y + 11], [x + 5, y + 15], [x - 1, y + 11], [x - 6, y + 15], [x - 11, y + 11], [x - 15, y + 14]];
      oPoly(c, cl, f || '#3c3c4a');
      c.fillStyle = '#0b0910'; c.fillRect(x - 6, y - 6, 12, 14);
      const inf = e.p2 ? 6 : 3;
      for (let i = 0; i < inf; i++) { const a = i * 2.3 + t; c.fillStyle = Math.sin(t * 6 + i) > 0 ? '#ff9a2a' : '#c86a1a'; c.beginPath(); c.arc(x + Math.cos(a) * 7, y + 3 + Math.sin(a * 1.3) * 5, 2 + (i % 2), 0, TAU); c.fill(); }
      oEllipse(c, x, y - 15 + bob, 9, 8, f || '#f4f1e8');
      oLine(c, x - 6, y - 21 + bob, x - 10, y - 33 + bob, f || '#f4f1e8', 3);
      oLine(c, x + 6, y - 21 + bob, x + 8, y - 27 + bob, f || '#f4f1e8', 3);
      c.fillStyle = '#0b0910'; c.beginPath(); c.ellipse(x - 4, y - 14 + bob, 2.5, 3.5, 0, 0, TAU); c.ellipse(x + 4, y - 14 + bob, 2.5, 3.5, 0, 0, TAU); c.fill();
      if (e.p2) { c.fillStyle = '#ff9a2a'; c.fillRect(x + 3, y - 15 + bob, 2, 2); c.strokeStyle = '#ff9a2a'; c.beginPath(); c.moveTo(x + 4, y - 20 + bob); c.lineTo(x + 2, y - 10 + bob); c.stroke(); }
      const a = angTo(e);
      oLine(c, x + Math.cos(a) * 8, y + Math.sin(a) * 8, x + Math.cos(a) * 30, y + Math.sin(a) * 30, '#c9c4b8', 2);
    },
  },
  falseknight: {
    name: 'Il Falso Cavaliere', mini: true, hp: 900, r: 12, spd: 34, col: '#ff9a2a', spr: 'falseknight', voice: 'grunt',
    patterns: [
      { f: e => gSlam(e, { tele: 1.0, r: 38, dmg: 20, ring: 10, ringSpd: 95 }), w: 2 },
      { f: e => gArc(e, { r: 52, half: 0.9, dmg: 20, tele: 0.55 }), w: 2 },
      { f: e => gSpikes(e, linePts(e.x, e.y, angTo(e), 6, 28), { r: 14, tele: 0.7, dmg: 16 }), w: 1 },
    ],
  },

  // ---------------------------------------------------------------- INFERNO (ULTRAKILL)
  gabriel: {
    name: 'Gabriele', title: 'Giudice dell\'Inferno', hp: 3400, r: 12, spd: 90, col: '#ffe680', voice: 'gabriel', home: 'v1',
    phase2: true, p2line: () => (G.char.id === 'v1' ? 'MACCHINA! TI FARÒ A PEZZI E SPARGERÒ I TUOI RESTI TRA LE STELLE!' : 'TI FARÒ A PEZZI, CREATURA PROFANA!'),
    patterns: [
      { f: function* (e) { yield* gTeleport(e, 46); for (let i = 0; i < 3; i++) yield* gArc(e, { r: 40, half: 1.0, dmg: 18, tele: 0.26, col: '#ffe680' }); }, w: 2.2, shout: ['PREPARATI!', 'GIUDIZIO!', 'MUORI!'] },
      { f: e => gAimed(e, 3, 0.5, 230, 16, '#ffe680', 'spear', 3, 0.45), w: 2, shout: ['TROPPO LENTO!'] },
      { f: e => gDash(e, { tele: 0.4, spd: 560, dur: 0.35, times: 2, col: '#ffe680' }), w: 1.5, shout: ['SCHIACCIATO!'] },
      { f: e => gRadial(e, 16, 120, 14, '#fff2b0', 'spear', 2, 0.5, 0.2), w: 1.3, p2: true, shout: ['IL PARADISO TI GUARDA!'] },
      { f: function* (e) { for (let i = 0; i < 3; i++) { yield* gTeleport(e, 90); yield* gAimed(e, 5, 0.9, 200, 14, '#ffe680', 'spear', 1, 0.2); } }, w: 1.5, p2: true },
    ],
    draw(c, e, x, y) {
      const t = G.t, f = fl(e), hov = Math.round(Math.sin(t * 2.5) * 2);
      y -= 4 + hov;
      c.strokeStyle = `rgba(255,230,128,${0.6 + 0.3 * Math.sin(t * 6)})`; c.lineWidth = 3;
      for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(x + s * 4, y - 6); c.lineTo(x + s * (22 + i * 6), y - 18 + i * 14); c.stroke(); }
      c.lineWidth = 1;
      oPoly(c, [[x - 7, y - 8], [x + 7, y - 8], [x + 10, y + 14], [x - 10, y + 14]], f || '#efe6d2');
      c.fillStyle = '#e2b04a'; c.fillRect(x - 7, y - 8, 14, 6); c.fillRect(x - 1, y - 2, 2, 14);
      oEllipse(c, x, y - 14, 6, 6, f || '#f4ecd0');
      c.fillStyle = '#ffd23f'; c.fillRect(x - 3, y - 15, 2, 1); c.fillRect(x + 1, y - 15, 2, 1);
      c.strokeStyle = '#ffe680'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y - 24, 7, 2.5, 0, 0, TAU); c.stroke(); c.lineWidth = 1;
      const a = angTo(e);
      oLine(c, x + Math.cos(a) * 6, y + Math.sin(a) * 6, x + Math.cos(a) * 26, y + Math.sin(a) * 26, '#ffd23f', 2);
    },
  },
  swordsmachine: {
    name: 'Spadacchina', mini: true, hp: 850, r: 9, spd: 52, col: '#ffd23f', spr: 'swordsmachine', voice: 'robot',
    patterns: [
      { f: e => gDash(e, { tele: 0.5, spd: 420, dur: 0.45, times: 2 }), w: 2 },
      { f: e => gAimed(e, 1, 0, 200, 16, '#c9ced8', 'blade', 1, 0.6), w: 1.5 },
      { f: e => gAimed(e, 5, 0.8, 160, 10, '#ffd27a', 'orb', 1, 0.5), w: 1 },
    ],
  },

  // ---------------------------------------------------------------- TARTARO (Hades)
  hades: {
    name: 'Ade', title: 'Signore degli Inferi', hp: 3600, r: 15, spd: 44, col: '#e0303a', voice: 'hades', home: 'zagreus',
    phase2: true, p2line: 'Mi stai mettendo alla prova. Pessima idea.',
    patterns: [
      { f: e => gSpin(e, { dur: 2, r: 34, dmg: 16, spd: 120, col: '#e2b04a' }), w: 2, shout: ['Basta così.'] },
      { f: e => gHoming(e, 4, 90, 14, '#e0303a', 2.0, 5), w: 1.6, shout: ['Non c\'è via d\'uscita.'] },
      { f: e => gDash(e, { tele: 0.6, spd: 380, dur: 0.6, col: '#e0303a' }), w: 1.3 },
      { f: e => gSummon(e, 'wretch', 4, 46), w: 1, shout: ['Servitori.'] },
      { f: function* (e) { e.cloak = 1; bossSay(e, 'Dove guardi, ragazzo?'); yield* gTeleport(e, 30); e.cloak = 0; yield* gArc(e, { r: 46, half: 1.4, dmg: 22, tele: 0.3, col: '#e0303a' }); }, w: 1.4, p2: true },
      { f: e => gRadial(e, 18, 100, 14, '#ff6a6a', 'orb', 3, 0.35, 0.17), w: 1.2, p2: true },
    ],
    draw(c, e, x, y) {
      const t = G.t, f = fl(e);
      if (e.cloak) c.globalAlpha = 0.25;
      oPoly(c, [[x - 12, y - 8], [x + 12, y - 8], [x + 16, y + 16], [x - 16, y + 16]], f || '#4a1a2a');
      c.fillStyle = '#7e1820'; c.fillRect(x - 12, y - 8, 4, 22); c.fillStyle = '#e2b04a'; c.fillRect(x - 12, y + 2, 24, 2);
      oEllipse(c, x, y - 16, 8, 8, f || '#5a3a4a');
      c.fillStyle = '#1a1018'; c.beginPath(); c.ellipse(x, y - 10, 7, 5, 0, 0, Math.PI); c.fill();
      c.fillStyle = Math.sin(t * 8) > 0 ? '#ff4a3a' : '#ff8a5a'; c.fillRect(x - 4, y - 18, 3, 2); c.fillRect(x + 1, y - 18, 3, 2);
      c.fillStyle = '#e2b04a'; for (let i = -3; i <= 3; i++) c.fillRect(x + i * 2.4 - 1, y - 26 - (i % 2 ? 0 : 2), 2, 4);
      const a = e.spin ? t * 14 : angTo(e) - 0.4;
      oLine(c, x - Math.cos(a) * 14, y - Math.sin(a) * 14, x + Math.cos(a) * 34, y + Math.sin(a) * 34, '#e2b04a', 2);
      c.globalAlpha = 1;
    },
  },
  megaera: {
    name: 'Megera la Furia', mini: true, hp: 900, r: 10, spd: 58, col: '#c94a6a', spr: 'megaera', voice: 'fury',
    patterns: [
      { f: e => gBeam(e, { tele: 0.45, len: 90, w: 5, dmg: 16, dur: 0.15, col: '#c94a6a' }), w: 2 },
      { f: e => gRain(e, 5, { area: 90, r: 18, tele: 1.0, dmg: 16, col: '#c94a6a' }), w: 1.5 },
      { f: e => gDash(e, { tele: 0.5, spd: 400, dur: 0.4 }), w: 1.2 },
    ],
  },

  // ---------------------------------------------------------------- MONTE CELESTE
  badelineboss: {
    name: 'Badeline', title: 'Una Parte di Te', hp: 3000, r: 10, spd: 78, col: '#c96aff', voice: 'badeline', home: 'madeline', mv: 'path',
    phase2: true, p2line: () => (G.char.id === 'madeline' ? 'Perché non ti arrendi?! Lo faccio per proteggerti!' : 'Non sai nemmeno chi sei. Io sì.'),
    patterns: [
      { f: e => gAimed(e, 3, 0.4, 150, 14, '#c96aff', 'orb', 3, 0.3), w: 2, shout: ['Sei patetica.', 'Arrenditi.'] },
      { f: function* (e) { yield* gTeleport(e, 110); yield* gBeam(e, { tele: 0.7, len: 300, w: 5, dmg: 18, dur: 0.35, col: '#ff3050' }); }, w: 2 },
      { f: e => gRadial(e, 10, 90, 12, '#c96aff', 'orb', 2, 0.4), w: 1 },
      { f: e => gSummon(e, 'seeker', 2, 50), w: 0.8, p2: true },
      { f: function* (e) { for (let i = 0; i < 3; i++) { yield* gTeleport(e, 100); yield* gBeam(e, { tele: 0.45, len: 280, w: 4, dmg: 16, dur: 0.2, col: '#ff3050' }); } }, w: 1.5, p2: true },
    ],
    draw(c, e, x, y) {
      const t = G.t;
      for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(150,60,200,${0.25 - i * 0.03})`; c.beginPath(); c.arc(x - (e.face || 1) * (4 + i * 4), y - 16 + Math.sin(t * 5 + i) * 3, 5 - i * 0.5, 0, TAU); c.fill(); }
      const s = SPR.badeline, sc = 2;
      const img = e.flash > 0 ? s.white : ((e.face || 1) < 0 ? s.flip : s.img);
      c.drawImage(img, x - s.w * sc / 2, y - s.h * sc / 2 - 2 + Math.round(Math.sin(t * 4)), s.w * sc, s.h * sc);
    },
  },
  oshiroboss: {
    name: 'Il Signor Oshiro (furioso)', mini: true, hp: 800, r: 9, spd: 40, col: '#ff6a3a', spr: 'oshiro', voice: 'oshiro',
    patterns: [
      { f: e => gDash(e, { tele: 0.55, spd: 380, dur: 0.6, times: 3, gap: 0.15, col: '#ff6a3a' }), w: 2.5 },
      { f: e => gSummon(e, 'dustbunny', 6, 30), w: 1 },
    ],
  },

  // ---------------------------------------------------------------- DEAD CELLS
  handofking: {
    name: 'La Mano del Re', title: 'Guardiano della Sala del Trono', hp: 3600, r: 14, spd: 48, col: '#ff8a2a', voice: 'hand', home: 'prisoner',
    phase2: true, p2line: 'Per il Re! FIAMME!',
    patterns: [
      { f: e => gDash(e, { tele: 0.6, spd: 420, dur: 0.55, col: '#ffd23f' }), w: 2, shout: ['Fermati!'] },
      { f: function* (e) { for (let i = 0; i < 2; i++) yield* gBeam(e, { tele: 0.45, len: 110, w: 6, dmg: 20, dur: 0.15, col: '#ffd23f' }); }, w: 2 },
      { f: e => gSpikes(e, circlePts(G.p.x, G.p.y, 6, 48, rnd(TAU)).concat([[G.p.x, G.p.y]]), { r: 16, tele: 0.85, dmg: 18, col: '#ff6a2a' }), w: 1.5, shout: ['Brucia!'] },
      { f: e => gSlam(e, { tele: 0.85, r: 44, dmg: 22, ring: 14, ringSpd: 120, ringCol: '#ff6a2a' }), w: 1.5, p2: true },
      { f: e => gRain(e, 10, { area: 140, r: 16, tele: 0.8, dmg: 16, col: '#ff6a2a' }), w: 1.2, p2: true },
    ],
    draw(c, e, x, y) {
      const f = fl(e);
      oPoly(c, [[x - 11, y - 8], [x + 11, y - 8], [x + 12, y + 14], [x - 12, y + 14]], f || '#2a2830');
      c.fillStyle = '#d9a83a'; c.fillRect(x - 11, y - 8, 22, 3); c.fillRect(x - 2, y - 5, 4, 19);
      oEllipse(c, x, y - 15, 7, 7, f || '#3a3844');
      c.fillStyle = '#ff6a2a'; c.fillRect(x - 4, y - 16, 8, 2);
      c.fillStyle = '#c41e2a'; for (let i = 0; i < 5; i++) c.fillRect(x - 2 + i, y - 28 + Math.abs(i - 2), 1, 7);
      const s = e.face || 1;
      oEllipse(c, x + s * 12, y + 2, 7, 11, f || '#8e2b3a');
      c.fillStyle = '#d9a83a'; c.beginPath(); c.arc(x + s * 12, y + 2, 3, 0, TAU); c.fill();
      const a = angTo(e);
      oLine(c, x - s * 6, y, x - s * 6 + Math.cos(a) * 34, y + Math.sin(a) * 34, '#c9ced8', 2);
      if (e.p2) { c.fillStyle = `rgba(255,106,42,${0.3 + 0.2 * Math.sin(G.t * 10)})`; c.beginPath(); c.arc(x, y, 22, 0, TAU); c.fill(); }
    },
  },
  conciergeboss: {
    name: 'Il Portinaio', mini: true, hp: 1000, r: 12, spd: 36, col: '#ff4a2a', spr: 'concierge', voice: 'grunt',
    patterns: [
      { f: e => gSlam(e, { tele: 1.0, r: 46, dmg: 22, ring: 8, ringSpd: 90 }), w: 2 },
      { f: e => gDash(e, { tele: 0.7, spd: 360, dur: 0.6 }), w: 1.5 },
    ],
  },

  // ---------------------------------------------------------------- CVSTODIA (Blasphemous)
  escribar: {
    name: 'Escribar', title: 'L\'Ultimo dei Supremi', hp: 3800, r: 16, spd: 30, col: '#e2c46a', voice: 'escribar', home: 'penitent', mv: 'keep', keep: 70,
    phase2: true, p2line: 'Il Miracolo mi ha scelto. Inginocchiati!',
    patterns: [
      { f: e => gRain(e, 9, { area: 150, r: 15, tele: 1.0, dmg: 16, col: '#fff2b0' }), w: 2, shout: ['Luce su di te.'] },
      { f: e => gArc(e, { r: 70, half: 1.0, dmg: 22, tele: 0.65, col: '#e2c46a' }), w: 1.5 },
      { f: e => gSummon(e, 'condemned', 4, 50), w: 1 },
      { f: e => gAimed(e, 7, 1.2, 130, 12, '#c41e2a', 'orb', 2, 0.5), w: 1.3, shout: ['Sanguina.'] },
      { f: e => gBeam(e, { tele: 0.9, len: 360, w: 9, dmg: 22, dur: 1.1, sweep: 1.1, col: '#fff2b0' }), w: 1.6, p2: true },
      { f: e => gSpikes(e, circlePts(e.x, e.y, 10, 70, rnd(TAU)).concat(circlePts(e.x, e.y, 14, 120)), { r: 14, tele: 0.9, dmg: 16, col: '#fff2b0' }), w: 1.2, p2: true },
    ],
    draw(c, e, x, y) {
      const t = G.t, f = fl(e), hov = Math.round(Math.sin(t * 1.6) * 3);
      y += hov - 4;
      oPoly(c, [[x - 10, y - 16], [x + 10, y - 16], [x + 20, y + 20], [x - 20, y + 20]], f || '#5a1e24');
      c.fillStyle = '#3e1218'; c.fillRect(x - 3, y - 12, 6, 32);
      c.fillStyle = '#d9b43a'; c.fillRect(x - 16, y + 14, 32, 2);
      oEllipse(c, x, y - 22, 8, 9, f || '#e8d27a');
      c.fillStyle = '#5a3d22'; c.fillRect(x - 5, y - 24, 3, 2); c.fillRect(x + 2, y - 24, 3, 2);
      c.fillStyle = '#c41e2a'; c.fillRect(x - 4, y - 22, 1, 4 + Math.round(Math.sin(t * 2) * 2)); c.fillRect(x + 3, y - 22, 1, 3);
      c.strokeStyle = '#5a3d22'; c.lineWidth = 2; for (let i = 0; i < 7; i++) { const a = -Math.PI + i / 6 * Math.PI; c.beginPath(); c.moveTo(x + Math.cos(a) * 8, y - 28 + Math.sin(a) * 4); c.lineTo(x + Math.cos(a) * 13, y - 30 + Math.sin(a) * 8); c.stroke(); } c.lineWidth = 1;
      c.strokeStyle = `rgba(255,242,176,${0.4 + 0.3 * Math.sin(t * 3)})`; c.beginPath(); c.arc(x, y - 24, 16, 0, TAU); c.stroke();
    },
  },
  tenpiedadboss: {
    name: 'Ten Piedad', mini: true, hp: 1000, r: 12, spd: 30, col: '#ff8a2a', spr: 'tenpiedad', voice: 'grunt',
    patterns: [
      { f: e => gSlam(e, { tele: 1.0, r: 42, dmg: 22, ring: 10 }), w: 2 },
      { f: e => gRain(e, 6, { area: 110, r: 16, tele: 1.0, dmg: 16, col: '#a89a7a' }), w: 1.5 },
    ],
  },

  // ---------------------------------------------------------------- TERRARIA
  moonlord: {
    name: 'Il Signore della Luna', title: 'Il Signore della Luna si è risvegliato!', hp: 4200, r: 20, spd: 26, col: '#7ff0e0', voice: 'moonlord', home: 'terrarian', mv: 'keep', keep: 130,
    phase2: true, p2line: '[L\'occhio nel petto si spalanca]',
    patterns: [
      { f: function* (e) { for (const s of [-1, 1]) { const hx = e.x + s * 38, hy = e.y - 12; for (let i = 0; i < 3; i++) eShootB(hx, hy, Math.atan2(G.p.y - hy, G.p.x - hx) + (i - 1) * 0.2, 150, 14, { col: '#7ff0e0', kind: 'orb' }); yield 0.3; } }, w: 2 },
      { f: e => gHoming(e, 5, 80, 14, '#7ff0e0', 1.6, 6), w: 1.5 },
      { f: e => gBeam(e, { tele: 1.0, len: 420, w: 10, dmg: 24, dur: 1.4, sweep: 0.9, col: '#7ff0e0' }), w: 1.6 },
      { f: e => gSummon(e, 'demoneye', 5, 50), w: 0.8 },
      { f: function* (e) { for (const s of [-1, 1]) yield* gBeam(e, { tele: 0.6, len: 300, w: 6, dmg: 18, dur: 0.4, col: '#7ff0e0', from: [e.x + s * 38, e.y - 12] }); }, w: 1.5, p2: true },
      { f: e => gRadial(e, 20, 90, 12, '#7ff0e0', 'orb', 3, 0.4, 0.15), w: 1.2, p2: true },
    ],
    draw(c, e, x, y) {
      const t = G.t, f = fl(e);
      for (const s of [-1, 1]) {
        const hx = x + s * 44, hy = y + 8 + Math.round(Math.sin(t * 2 + s) * 3);
        oLine(c, x + s * 12, y, hx, hy, '#9ab0b0', 4);
        oEllipse(c, hx, hy, 9, 9, f || '#b8c8c4');
        oEllipse(c, hx, hy, 5, 4, '#e8fff8'); c.fillStyle = '#2a8a7a'; c.beginPath(); c.arc(hx + Math.cos(angTo(e)) * 2, hy + Math.sin(angTo(e)) * 1.5, 2, 0, TAU); c.fill();
      }
      oPoly(c, [[x - 14, y - 4], [x + 14, y - 4], [x + 18, y + 24], [x - 18, y + 24]], f || '#a8b8b4');
      c.strokeStyle = '#7a8a86'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x - 10, y + 2 + i * 5); c.lineTo(x + 10, y + 2 + i * 5); c.stroke(); }
      if (e.p2) { oEllipse(c, x, y + 8, 6, 5, '#e8fff8'); c.fillStyle = '#2a8a7a'; c.beginPath(); c.arc(x, y + 8, 2.5, 0, TAU); c.fill(); }
      oEllipse(c, x, y - 18, 15, 16, f || '#b8c8c4');
      for (let i = -2; i <= 2; i++) oLine(c, x + i * 4, y - 8, x + i * 5 + Math.sin(t * 3 + i) * 2, y + 2, '#8aa09c', 2);
      c.fillStyle = '#1a2a2a'; c.beginPath(); c.ellipse(x - 6, y - 22, 3, 4, 0, 0, TAU); c.ellipse(x + 6, y - 22, 3, 4, 0, 0, TAU); c.fill();
      oEllipse(c, x, y - 28, 4, 4, '#e8fff8'); c.fillStyle = '#2a8a7a'; c.beginPath(); c.arc(x, y - 28, 2, 0, TAU); c.fill();
    },
  },
  eocboss: {
    name: 'L\'Occhio di Cthulhu', mini: true, hp: 950, r: 11, spd: 46, col: '#e0303a', spr: 'eoc', voice: 'moonlord',
    patterns: [
      { f: e => gDash(e, { tele: 0.45, spd: 420, dur: 0.5, times: 3, gap: 0.1 }), w: 2.5 },
      { f: e => gSummon(e, 'demoneye', 4, 30), w: 1 },
    ],
  },

  // ---------------------------------------------------------------- IL SEMINTERRATO (Isaac)
  mom: {
    name: 'La Mamma', title: 'Isaac e sua madre vivevano da soli…', hp: 4000, r: 18, spd: 0, col: '#e0303a', voice: 'mom', home: 'isaac', mv: 'stay',
    phase2: true, p2line: 'ISAAC! VIENI QUI SUBITO!',
    init(e) { e.hidden = true; },
    patterns: [
      { f: function* (e) { yield* gSlam(e, { tele: 1.1, r: 30, dmg: 24, ring: 0 }); e.takeMul = 1.4; yield 1.3; e.takeMul = 1; e.air = true; e.hidden = true; e.tx = e.x; e.ty = e.y; e.airT = 0.01; e.airMax = 0.3; yield 0.4; }, w: 3, shout: ['Isaac!', 'Dove sei?!'] },
      { f: e => gSummon(e, 'gaper', 3, 120), w: 1, shout: ['Aiutatemi a trovarlo!'] },
      { f: function* (e) { const a = rnd(TAU), d = 170; const hx = G.p.x + Math.cos(a) * d, hy = G.p.y + Math.sin(a) * d; for (let i = 0; i < 6; i++) eShootB(hx, hy, Math.atan2(G.p.y - hy, G.p.x - hx) + (i - 2.5) * 0.15, 120, 14, { col: '#c41e2a', kind: 'orb' }); G.fx.push({ k: 'img', spr: 'B_momeye_0', x: hx, y: hy, life: 0.9, max: 0.9 }); yield 0.8; }, w: 1.5 },
      { f: e => gRain(e, 6, { area: 120, r: 18, tele: 0.9, dmg: 16, col: '#c41e2a' }), w: 1.3, p2: true },
    ],
    draw(c, e, x, y) {
      const f = fl(e);
      oPoly(c, [[x - 10, y - 60], [x + 10, y - 60], [x + 11, y - 6], [x - 11, y - 6]], f || '#e8b8a0');
      oPoly(c, [[x - 16, y - 8], [x + 12, y - 8], [x + 16, y + 6], [x - 18, y + 8]], f || '#c41e2a');
      c.fillStyle = '#8e1e24'; c.fillRect(x + 8, y + 4, 4, 10);
      c.fillStyle = '#ffffff'; c.fillRect(x - 12, y - 6, 6, 1);
    },
  },
  monstroboss: {
    name: 'Monstro', mini: true, hp: 950, r: 12, spd: 30, col: '#c41e2a', spr: 'monstro', voice: 'grunt', mv: 'stay',
    patterns: [
      { f: e => gSlam(e, { tele: 1.0, r: 34, dmg: 22, ring: 0 }), w: 2 },
      { f: e => gAimed(e, 9, 1.0, 120, 12, '#c41e2a', 'orb', 1, 0.6), w: 2 },
    ],
  },

  // ---------------------------------------------------------------- FINALE
  cucitrice: {
    name: 'La Cucitrice', title: 'Colei che Ricuce i Finali', hp: 5200, r: 14, spd: 54, col: '#e2b04a', voice: 'cucitrice', mv: 'keep', keep: 80,
    phase2: true, p2line: 'Basta orli. Ora… cucio te.',
    patterns: [
      { f: function* (e) { e.mask = 'gabriel'; bossSay(e, '«PREPARATI!» …così diceva lui, vero?'); yield* gAimed(e, 5, 0.7, 220, 15, '#ffe680', 'spear', 3, 0.4); }, w: 1.5 },
      { f: function* (e) { e.mask = 'hades'; yield* gSpin(e, { dur: 1.8, r: 34, dmg: 16, spd: 130, col: '#e0303a' }); }, w: 1.2 },
      { f: function* (e) { e.mask = 'badelineboss'; yield* gTeleport(e, 110); yield* gBeam(e, { tele: 0.6, len: 300, w: 5, dmg: 18, dur: 0.3, col: '#ff3050' }); }, w: 1.3 },
      { f: function* (e) { e.mask = 'mom'; yield* gRain(e, 7, { area: 120, r: 18, tele: 0.9, dmg: 16, col: '#c41e2a' }); }, w: 1.2 },
      { f: function* (e) { e.mask = 'hollowknight'; yield* gSpikes(e, linePts(e.x, e.y, angTo(e), 8, 26), { r: 14, tele: 0.7, dmg: 18, col: '#ff9a2a' }); }, w: 1.2 },
      { f: function* (e) { e.mask = 'moonlord'; yield* gBeam(e, { tele: 0.9, len: 400, w: 9, dmg: 22, dur: 1.2, sweep: 1.0, col: '#7ff0e0' }); }, w: 1.3, p2: true },
      { f: e => gRadial(e, 24, 95, 12, '#e2b04a', 'pin', 3, 0.4, 0.13), w: 1.3, p2: true },
    ],
    draw(c, e, x, y) {
      const t = G.t, f = fl(e), hov = Math.round(Math.sin(t * 2) * 3);
      y += hov - 6;
      for (let i = 0; i < 3; i++) { const a = t * 1.5 + i * 2.1; const sx = x + Math.cos(a) * 26, sy = y - 8 + Math.sin(a) * 10; c.strokeStyle = 'rgba(226,176,74,.5)'; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(sx, sy); c.stroke(); c.drawImage(SPR.spool.img, Math.round(sx - 3), Math.round(sy - 3)); }
      oPoly(c, [[x - 6, y - 10], [x + 6, y - 10], [x + 14, y + 22], [x + 6, y + 16], [x, y + 24], [x - 6, y + 16], [x - 14, y + 22]], f || '#5a2a4a');
      c.strokeStyle = '#e2b04a'; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(x, y - 10); c.lineTo(x, y + 20); c.stroke(); c.setLineDash([]);
      oLine(c, x - 6, y - 6, x - 22, y + 10 + Math.sin(t * 3) * 3, '#c9ced8', 2);
      oLine(c, x + 6, y - 6, x + 24, y + 6 + Math.cos(t * 3) * 3, '#c9ced8', 2);
      oEllipse(c, x, y - 18, 7, 9, f || '#efe6d8');
      c.strokeStyle = '#8e2b3a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 3, y - 21); c.lineTo(x + 3, y - 15); c.moveTo(x + 3, y - 21); c.lineTo(x - 3, y - 15); c.stroke();
      if (e.mask) txt(c, BOSSES[e.mask].name.split(' ')[0].toUpperCase(), x, y + 26, '#a89a88', 8, 'center');
    },
  },
};

// Registra boss e mini-boss come tipi di nemico
for (const [id, def] of Object.entries(BOSSES)) {
  ETYPES[id] = {
    hp: def.hp, spd: def.spd || 40, dmg: def.mini ? 14 : 18, r: def.r, xp: def.mini ? 40 : 0,
    boss: !def.mini, elite: !!def.mini, name: def.name, kbRes: 0.95, blood: def.col,
    init(e) { e.def = def; e.mv = def.mv || 'chase'; e.wait = 1; e.noSep = true; e.takeMul = def.takeMul; def.init?.(e); if (def.mini) { const n = G.players ? G.players.length : 1; e.hp = e.maxHp = def.hp * (1 + G.t / 300) * (1 + 0.55 * (n - 1)) * (G.curse || 1); } },
    ai: bossAI,
    draw: def.spr ? (c, e, x, y) => bossDraw(c, e, x, y) : (c, e, x, y) => bossDraw(c, e, x, y),
  };
  if (def.spr) def.draw = (c, e, x, y) => {
    const fr = Math.floor(G.t * 5) % 2 && SPR[def.spr + '_b'] ? def.spr + '_b' : def.spr;
    const s = SPR[fr];
    const img = e.flash > 0 ? ((e.face || 1) < 0 ? s.flipWhite : s.white) : ((e.face || 1) < 0 ? s.flip : s.img);
    c.strokeStyle = `rgba(226,176,74,${0.5 + 0.3 * Math.sin(G.t * 6)})`; c.beginPath(); c.ellipse(x, y + e.r, e.r + 8, (e.r + 8) * 0.35, 0, 0, TAU); c.stroke();
    c.drawImage(img, Math.round(x - s.w / 2), Math.round(y + e.r - s.h));
  };
}

// --- Alfa 3: i boss usano gli sprite dipinti (con variante di seconda fase) ----------
function bossSprite(c, e, x, y, id, o = {}) {
  const key = 'B_' + id + (e.p2 && SPR['B_' + id + '_p2'] ? '_p2' : (Math.floor(G.t * 3) % 2 ? '_1' : '_0'));
  const s = SPR[key];
  const flip = !o.noFlip && (e.face || 1) < 0;
  const img = e.flash > 0 ? (flip ? s.flipWhite : s.white) : (flip ? s.flip : s.img);
  const bob = e.p2 ? Math.round(Math.sin(G.t * 6)) : 0;
  c.drawImage(img, Math.round(x - s.w / 2), Math.round(y + e.r - s.h + (o.oy || 0) + bob));
  return s;
}
BOSSES.hollowknight.draw = (c, e, x, y) => {
  bossSprite(c, e, x, y, 'hollowknight', { noFlip: true });
  const a = angTo(e), s = SPR.W_nail;
  c.save(); c.translate(x + 6, y - 8); c.rotate(a); if (Math.cos(a) < 0) c.scale(1, -1); c.drawImage(s.img, -2, -s.h / 2, s.w * 1.3, s.h * 1.3); c.restore();
};
BOSSES.gabriel.draw = (c, e, x, y) => { bossSprite(c, e, x, y, 'gabriel'); };
BOSSES.hades.draw = (c, e, x, y) => { if (e.cloak) c.globalAlpha = 0.22; bossSprite(c, e, x, y, 'hades'); c.globalAlpha = 1; };
BOSSES.handofking.draw = (c, e, x, y) => { bossSprite(c, e, x, y, 'handofking'); if (e.p2) { c.fillStyle = `rgba(255,106,42,${0.2 + 0.15 * Math.sin(G.t * 10)})`; c.beginPath(); c.arc(x, y - 8, 30, 0, TAU); c.fill(); } };
BOSSES.escribar.draw = (c, e, x, y) => { bossSprite(c, e, x, y, 'escribar', { noFlip: true, oy: Math.round(Math.sin(G.t * 1.6) * 3) }); };
BOSSES.moonlord.draw = (c, e, x, y) => { bossSprite(c, e, x, y, 'moonlord', { noFlip: true }); };
BOSSES.mom.draw = (c, e, x, y) => { bossSprite(c, e, x, y, 'mom', { noFlip: true }); };
BOSSES.cucitrice.draw = (c, e, x, y) => {
  const t = G.t;
  for (let i = 0; i < 3; i++) { const a = t * 1.5 + i * 2.1; const sx = x + Math.cos(a) * 30, sy = y - 24 + Math.sin(a) * 12; c.strokeStyle = 'rgba(226,176,74,.5)'; c.beginPath(); c.moveTo(x, y - 30); c.lineTo(sx, sy); c.stroke(); c.drawImage(SPR.spool.img, Math.round(sx - 6), Math.round(sy - 7)); }
  bossSprite(c, e, x, y, 'cucitrice', { noFlip: true, oy: Math.round(Math.sin(t * 2) * 3) });
  if (e.mask) txt(c, BOSSES[e.mask].name.split(' ')[0].toUpperCase(), x, y + e.r + 4, '#a89a88', 8, 'center');
};
BOSSES.badelineboss.draw = (c, e, x, y) => {
  const t = G.t;
  for (let i = 0; i < 7; i++) { c.fillStyle = `rgba(150,60,200,${0.28 - i * 0.035})`; c.beginPath(); c.arc(x - (e.face || 1) * (6 + i * 5), y - 30 + Math.sin(t * 5 + i) * 3, 7 - i * 0.7, 0, TAU); c.fill(); }
  const moving = Math.abs(e.vx) + Math.abs(e.vy) > 5;
  const s = SPR['badeline' + (moving ? '_w' + (Math.floor(t * 10) % 4) : (Math.sin(t * 3) > 0 ? '_i1' : '_i0'))];
  const sc = 1.6, flip = (e.face || 1) < 0;
  const img = e.flash > 0 ? (flip ? s.flipWhite : s.white) : (flip ? s.flip : s.img);
  c.drawImage(img, Math.round(x - s.w * sc / 2), Math.round(y + e.r - s.h * sc), s.w * sc, s.h * sc);
};

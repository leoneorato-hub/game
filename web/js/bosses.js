'use strict';
function eShootB(x, y, a, spd, dmg, o = {}) { o.force = true; eShoot(x, y, a, spd, dmg, o); }
// =============================================================================
// BOSS (Alfa 2) — i boss finali dei giochi indie e i loro mini-boss.
// Ogni boss è uno "script" a generatori: `yield s` aspetta s secondi mentre il
// boss continua a muoversi. Gli attacchi sono sempre telegrafati (cerchi e
// linee rosse che si chiudono) così si possono leggere e schivare.
// Alfa 5: qui vivono il motore delle fasi e i mattoni degli attacchi; i copioni
// di ogni boss, divisi in fasi, sono in boss_phases.js.
// =============================================================================

// --- Telegrafi -------------------------------------------------------------------
// Alfa 5: i telegrafi ricordano il boss che li ha creati e si annullano se muore o cambia fase
let TELE_OWNER = null;
function tele(o) { o.max = o.t; if (TELE_OWNER && !o.own) o.own = TELE_OWNER; G.teles.push(o); return o; }
function updateTeles(dt) {
  for (const o of G.teles) {
    if (o.own && (o.own.dead || o.own.trans > 0)) { o.done = true; continue; }
    o.t -= dt; if (o.t <= 0 && !o.done) { o.done = true; o.fire && o.fire(o); }
  }
  G.teles = G.teles.filter(o => !o.done);
  updateBossFx(dt);
}
function drawTeles(c) {
  drawBossFx(c);
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
    } else if (o.kind === 'safe') {
      // tutto lo schermo si tinge di rosso tranne le zone sicure (dorate) che restringono il tempo
      c.globalAlpha = 0.12 + 0.3 * k;
      c.fillStyle = o.col || '#c41e2a';
      c.beginPath(); c.rect(0, 0, W, H);
      for (const z of o.zones) { c.moveTo(Math.round(z.x - camX) + z.r, Math.round(z.y - camY)); c.arc(Math.round(z.x - camX), Math.round(z.y - camY), z.r, 0, TAU, true); }
      c.fill('evenodd');
      c.globalAlpha = 0.9;
      for (const z of o.zones) {
        const x = Math.round(z.x - camX), y = Math.round(z.y - camY);
        c.strokeStyle = '#ffe680'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, z.r, 0, TAU); c.stroke(); c.lineWidth = 1;
        c.fillStyle = 'rgba(255,230,128,.18)'; c.beginPath(); c.arc(x, y, z.r * (0.4 + 0.6 * k), 0, TAU); c.fill();
      }
      txt(c, o.label || 'RIFUGIATI NELLA LUCE!', W / 2, H / 2 - 70, '#ffe680', 16, 'center');
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
  e.mv = 'stay'; e.air = true; e.hidden = true; e.rise = false; e.tx = tx; e.ty = ty; e.airT = tt; e.airMax = tt;
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

// =============================================================================
// ALFA 5 — nuovi mattoni per i boss a fasi
// =============================================================================
const angDiff = (a, b) => ((a - b + Math.PI * 3) % TAU) - Math.PI;
const tgtPls = () => (G.players ? G.players.filter(pl => !pl.down).map(pl => pl.p) : [G.p]);
// prova per forPls: il giocatore tocca il segmento (x1,y1)-(x2,y2)?
function onSeg(x1, y1, x2, y2, w) {
  const [dx, dy] = norm(x2 - x1, y2 - y1), len = Math.hypot(x2 - x1, y2 - y1);
  return p => {
    if (p.flyHigh > 0) return false;
    const t = clamp((p.x - x1) * dx + (p.y - y1) * dy, 0, len);
    const px = x1 + dx * t - p.x, py = y1 + dy * t - p.y;
    return px * px + py * py < (w + p.r) ** 2;
  };
}

// Muro di proiettili con un varco: compare sospeso (telegrafo), poi avanza tutto insieme
function* gWall(e, o = {}) {
  const { n = 30, step = 14, gap = 3, spd = 85, dmg = 14, col = '#ffe680', kind = 'orb', dist = 190, hold = 0.7, ang } = o;
  const p = G.p, a = ang ?? Math.atan2(p.y - e.y, p.x - e.x);
  const px = -Math.sin(a), py = Math.cos(a);
  const cx = p.x - Math.cos(a) * dist, cy = p.y - Math.sin(a) * dist;
  const gc = Math.round(rnd(-5, 5));
  for (let i = -n / 2; i <= n / 2; i++) {
    if (Math.abs(i - gc) <= gap / 2) continue;
    eShootB(cx + px * i * step, cy + py * i * step, a, spd, dmg, { col, kind, wait: hold, life: hold + (dist * 2 + 120) / spd });
  }
  // il varco è segnato da un cerchio dorato sulla linea del muro
  tele({ kind: 'circle', x: cx + px * gc * step, y: cy + py * gc * step, r: 9, t: hold, col: '#ffe680' });
  sfx('bell');
  yield hold + 0.2;
}

// Anello di lame che si chiude su ogni giocatore, con un varco da cui uscire
function* gRingIn(e, o = {}) {
  const { n = 14, r = 92, spd = 120, dmg = 14, col = '#fff2b0', kind = 'spear', hold = 0.85, gapN = 3 } = o;
  for (const p of tgtPls()) {
    const off = rnd(TAU), g0 = Math.floor(rnd(n));
    for (let i = 0; i < n; i++) {
      if ((i - g0 + n) % n < gapN) continue;
      const a = off + i / n * TAU;
      eShootB(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, a + Math.PI, spd, dmg, { col, kind, wait: hold, life: hold + r / spd + 0.05 });
    }
    const ga = off + (g0 + (gapN - 1) / 2) / n * TAU;
    tele({ kind: 'circle', x: p.x + Math.cos(ga) * r, y: p.y + Math.sin(ga) * r, r: 10, t: hold, col: '#ffe680' });
  }
  sfx('shot');
  yield hold + 0.3;
}

// Purificazione: tutto lo schermo diventa letale tranne alcune zone sicure (una vicino a ogni giocatore)
function* gPurge(e, o = {}) {
  const { t = 2.5, r = 30, dmg = 28, col = '#c41e2a', label, extra = 1, near = [55, 105], onFire } = o;
  const zones = [];
  for (const p of tgtPls()) { const a = rnd(TAU), d = rnd(near[0], near[1]); zones.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r }); }
  for (let i = 0; i < extra; i++) { const a = rnd(TAU), d = rnd(120, 170); zones.push({ x: G.p.x + Math.cos(a) * d, y: G.p.y + Math.sin(a) * d, r }); }
  for (const z of zones) {
    [z.x, z.y] = G.stage.clampPos(z.x, z.y);
    if (G.arena) { const [nx, ny] = norm(z.x - G.arena.x, z.y - G.arena.y), l = Math.hypot(z.x - G.arena.x, z.y - G.arena.y); if (l > G.arena.r - z.r - 8) { z.x = G.arena.x + nx * (G.arena.r - z.r - 8); z.y = G.arena.y + ny * (G.arena.r - z.r - 8); } }
  }
  tele({ kind: 'safe', zones, t, col, label, fire: () => {
    forPls(() => hurtPlayer(dmg, e), p => !(p.flyHigh > 0) && !zones.some(z => d2(z.x, z.y, p.x, p.y) < (z.r - 2) ** 2));
    G.flashW = Math.max(G.flashW || 0, 0.25); shake(8); sfx('boom');
    for (const z of zones) fxRing(z.x, z.y, z.r, z.r + 30, '#ffe680', 0.4, 2);
    onFire?.(zones);
  } });
  yield t + 0.3;
}

// Pozze ostili (fuoco, sangue, luce, Infezione…): fanno male finché ci stai sopra
function hazard(x, y, r, t, dmg, kind = 'fire', o = {}) {
  if (!G.bhz) G.bhz = [];
  if (G.bhz.length > 70) G.bhz.shift();
  const h = Object.assign({ x, y, r, t, max: t, dmg, kind, k: 0, arm: 0.45, seed: rnd(TAU) }, o);
  G.bhz.push(h);
  return h;
}
// Onda d'urto ad anello che si allarga, con dei varchi
function shock(x, y, o = {}) {
  if (!G.bshock) G.bshock = [];
  const s = Object.assign({ x, y, r: 8, spd: 120, w: 3, dmg: 16, max: 280, col: '#ffd27a', gaps: [], hit: [] }, o);
  G.bshock.push(s);
  return s;
}
// varchi casuali (uno sempre verso il giocatore ± un po', così è leggibile)
function gapsToward(x, y, n = 2, half = 0.3) {
  const a0 = Math.atan2(G.p.y - y, G.p.x - x) + rnd(-0.8, 0.8);
  return Array.from({ length: n }, (_, i) => ({ a: a0 + i * TAU / n, half }));
}
// Porte (la Mamma): compaiono ai lati del giocatore
function addDoor(x, y, kind, t, o = {}) {
  if (!G.bdoors) G.bdoors = [];
  const d = Object.assign({ x, y, kind, t, max: t }, o);
  G.bdoors.push(d);
  return d;
}

function updateBossFx(dt) {
  // c'è un mini-boss in campo? (l'orda si dirada un po' per rendere leggibili i suoi attacchi)
  if (G.frame % 15 === 0) G.miniOn = G.enemies.some(e => !e.dead && e.def && e.def.mini);
  if (G.bhz && G.bhz.length) {
    for (const h of G.bhz) {
      h.t -= dt; h.k -= dt;
      if (h.k <= 0 && h.max - h.t >= h.arm) { h.k = 0.5; hitCircle(h.x, h.y, h.r * 0.8, h.dmg, null); }
    }
    G.bhz = G.bhz.filter(h => h.t > 0);
  }
  if (G.bshock && G.bshock.length) {
    for (const s of G.bshock) {
      s.r += s.spd * dt;
      forPls(() => { s.hit.push(G.p); hurtPlayer(s.dmg, null); }, p => {
        if (p.flyHigh > 0 || s.hit.includes(p)) return false;
        const d = Math.hypot(p.x - s.x, p.y - s.y);
        if (Math.abs(d - s.r) > s.w + p.r) return false;
        const a = Math.atan2(p.y - s.y, p.x - s.x);
        return !s.gaps.some(g => Math.abs(angDiff(a, g.a)) < g.half);
      });
    }
    G.bshock = G.bshock.filter(s => s.r < s.max);
  }
  if (G.bdoors && G.bdoors.length) { for (const d of G.bdoors) { d.t -= dt; if (d.reach !== undefined) d.reach = Math.min(1, d.reach + dt * 5); } G.bdoors = G.bdoors.filter(d => d.t > 0); }
  // arena del boss che si stringe (La Cucitrice)
  const A = G.arena;
  if (A && A.boss) {
    if (!A.own || A.own.dead) G.arena = null;
    else {
      if (A.r > A.target) A.r = Math.max(A.target, A.r - 7 * dt);
      forPls(() => arenaClamp(G.p, true));
    }
  }
}

const HZ = {
  fire: ['#7a1e0a', '#e0501a', '#ffd23f'], blood: ['#4a0a10', '#9e1420', '#ff5a6a'], light: ['#6a5418', '#d9b84a', '#fff2b0'],
  infection: ['#6a2a06', '#e07a1a', '#ffc46a'], void: ['#14081e', '#4a1e6a', '#d08aff'], dust: ['#3a3640', '#7a7484', '#d0ccd8'],
  moon: ['#0a3a34', '#2a9a8a', '#aafff0'],
};
function drawBossFx(c) {
  if (G.arena && G.arena.boss) drawArena(c);
  if (G.bhz) for (const h of G.bhz) {
    const x = Math.round(h.x - camX), y = Math.round(h.y - camY);
    if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
    const P = HZ[h.kind] || HZ.fire, age = h.max - h.t, armed = age >= h.arm;
    const k = Math.min(1, age / h.arm), fade = Math.min(1, h.t / 0.5), r = h.r * (0.45 + 0.55 * k);
    c.globalAlpha = (armed ? 0.55 : 0.25) * fade;
    c.fillStyle = P[0]; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.globalAlpha = (armed ? 0.55 : 0.25) * fade;
    c.fillStyle = P[1]; c.beginPath(); c.arc(x, y, r * 0.7, 0, TAU); c.fill();
    c.globalAlpha = 0.85 * fade; c.strokeStyle = P[2]; c.setLineDash([3, 3]); c.lineDashOffset = -G.t * 14;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
    // fiammelle che salgono, bolle che scoppiano, scintille
    const n = Math.max(3, Math.round(h.r / 3.5));
    for (let i = 0; i < n; i++) {
      const s = h.seed + i * 2.399, rr = r * (0.2 + 0.7 * ((i * 0.618) % 1));
      const fx = Math.round(x + Math.cos(s) * rr), fy = Math.round(y + Math.sin(s) * rr);
      const ph = (G.t * (h.kind === 'fire' ? 2.6 : 1.1) + i * 0.37) % 1;
      if (h.kind === 'fire' || h.kind === 'infection') {
        c.fillStyle = ph < 0.4 ? P[2] : P[1]; c.globalAlpha = fade * (1 - ph * 0.6);
        c.fillRect(fx, fy - Math.round(ph * 7), 2, 3 - Math.round(ph * 2));
      } else if (h.kind === 'light' || h.kind === 'moon') {
        c.fillStyle = P[2]; c.globalAlpha = fade * (1 - ph); c.fillRect(fx, fy - Math.round(ph * 10), 1, 2);
      } else {
        c.strokeStyle = P[2]; c.globalAlpha = 0.7 * fade * (1 - ph); c.beginPath(); c.arc(fx, fy, 1 + ph * 2.5, 0, TAU); c.stroke();
      }
    }
    c.globalAlpha = 1;
    if (h.kind !== 'blood' && h.kind !== 'dust' && h.kind !== 'void') light(h.x, h.y, r * 1.4, P[2]);
  }
  if (G.bshock) for (const s of G.bshock) {
    const x = Math.round(s.x - camX), y = Math.round(s.y - camY), k = s.r / s.max;
    const N = Math.max(24, Math.min(96, Math.round(s.r / 3)));
    c.globalAlpha = 0.95 * (1 - k * 0.5);
    for (const [col, lw, dr] of [[INK, s.w * 2 + 2, 0], [s.col, s.w * 2, 0], ['#ffffff', 1, -s.w * 0.5]]) {
      c.strokeStyle = col; c.lineWidth = lw;
      c.beginPath();
      let open = false;
      for (let i = 0; i <= N; i++) {
        const a = i / N * TAU, inGap = s.gaps.some(g => Math.abs(angDiff(a, g.a)) < g.half);
        const px = x + Math.cos(a) * (s.r + dr), py = y + Math.sin(a) * (s.r + dr);
        if (inGap) { open = false; continue; }
        if (!open) { c.moveTo(px, py); open = true; } else c.lineTo(px, py);
      }
      c.stroke();
    }
    c.lineWidth = 1; c.globalAlpha = 1;
  }
  if (G.bdoors) for (const d of G.bdoors) drawDoor(c, d);
}

// Porta con l'occhio della Mamma (sprite) oppure con la mano che afferra
function drawDoor(c, d) {
  const x = Math.round(d.x - camX), y = Math.round(d.y - camY);
  const k = Math.min(1, (d.max - d.t) / 0.25, d.t / 0.25);
  c.globalAlpha = k;
  const key = d.kind === 'eye' ? (d.angry ? 'B_momeye_p2' : 'B_momeye_' + (Math.floor(G.t * 3) % 2)) : 'B_momeye_0';
  const s = SPR[key];
  if (s) c.drawImage(s.img, x - s.w / 2, y - s.h / 2);
  if (d.kind === 'hand') {
    // l'occhio si chiude: buio nella porta, poi il braccio esce verso il bersaglio
    c.fillStyle = '#1a0a0c'; c.fillRect(x - 9, y - 6, 18, 12);
    const L = (d.len || 0) * (d.reach !== undefined ? d.reach : 0.08), a = d.a;
    const hx = x + Math.cos(a) * L, hy = y + Math.sin(a) * L;
    oLine(c, x, y, hx, hy, '#e8b8a0', 6);
    c.fillStyle = '#c99a86'; c.fillRect(Math.round((x + hx) / 2) - 1, Math.round((y + hy) / 2) - 1, 2, 2);
    oEllipse(c, hx, hy, 6, 5, '#f0c4ac', a);
    for (let i = -1.5; i <= 1.5; i++) {
      const fa = a + i * 0.32;
      oLine(c, hx + Math.cos(fa) * 4, hy + Math.sin(fa) * 4, hx + Math.cos(fa) * (d.reach >= 1 ? 7 : 10), hy + Math.sin(fa) * (d.reach >= 1 ? 7 : 10), '#f0c4ac', 2);
    }
    c.fillStyle = '#c41e2a'; c.fillRect(Math.round(hx + Math.cos(a) * 9) - 1, Math.round(hy + Math.sin(a) * 9) - 1, 2, 2);
  }
  c.globalAlpha = 1;
}

// --- Punti deboli, riflessi e inseguitrici ------------------------------------------------
// I punti deboli seguono il boss (la posizione la aggiorna bossMove); finché uno con
// `shield` è vivo, il boss è invulnerabile. Con `share` il danno si vede anche sulla barra.
ETYPES.bosspart = {
  hp: 100, spd: 0, dmg: 0, r: 8, xp: 0, name: 'Punto Debole', kbRes: 1,
  init(e) { e.harmless = true; e.anchored = true; e.noSep = true; e.noXp = true; },
  ai(e, dt) {
    if (!e.own || e.own.dead || (e.life !== undefined && (e.life -= dt) <= 0)) { vanish(e); return; }
    e.vx = e.vy = 0;
    if (!(e.own.trans > 0)) e.act?.(e, dt);
  },
  draw(c, e, x, y) {
    if (e.drawPart) { e.drawPart(c, e, x, y); return; }
    const col = e.col || '#ffffff', k = 0.5 + 0.5 * Math.sin(G.t * 8 + e.x);
    c.strokeStyle = col; c.globalAlpha = 0.5 + 0.4 * k; c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, e.r + 2 + k * 2, 0, TAU); c.stroke();
    c.globalAlpha = 1; c.lineWidth = 1;
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(x, y, e.r + 6, -Math.PI / 2, -Math.PI / 2 + TAU * e.hp / e.maxHp); c.stroke();
    c.strokeStyle = col; c.lineWidth = 1; c.stroke(); c.lineWidth = 1;
    light(e.x, e.y, 26, col);
  },
};
function addPart(boss, ox, oy, frac, o = {}) {
  const q = spawnEnemy('bosspart', boss.x + ox, boss.y + oy);
  q.hp = q.maxHp = boss.maxHp * frac;
  Object.assign(q, { own: boss, ox, oy, shield: true, share: 0, floor: 0, col: boss.def.col }, o);
  q.onDamaged = (q, d) => {
    if (!q.share || boss.dead || boss.immune && q.shield === false) return;
    boss.hp = Math.max(boss.maxHp * q.floor, boss.hpFloor || 0, boss.hp - d * q.share);
    boss.flash = 0.07;
    if (boss.hp <= 0) killEnemy(boss, {});
  };
  (boss.parts = boss.parts || []).push(q);
  return q;
}
// Riflessi/servitori del boss con un proprio piccolo copione (generatore `mk`)
ETYPES.bossclone = {
  hp: 100, spd: 60, dmg: 0, r: 9, xp: 0, name: 'Riflesso', kbRes: 1,
  init(e) { e.harmless = true; e.noSep = true; e.noXp = true; e.anchored = true; e.wait = 0.7; e.born = 0.5; },
  ai(e, dt) {
    if (!e.own || e.own.dead || (e.life -= dt) <= 0) { vanish(e); return; }
    if (e.born > 0) e.born -= dt;
    if (e.own.trans > 0) { e.vx = e.vy = 0; return; }
    e.move?.(e, dt);
    if (Math.abs(e.vx) > 1) e.face = Math.sign(e.vx);
    if (e.wait > 0) { e.wait -= dt; return; }
    if (!e.co) e.co = e.mk(e);
    TELE_OWNER = e.own;
    const r = e.co.next();
    TELE_OWNER = null;
    if (r.done) { e.co = null; e.wait = e.gap ?? 0.8; } else e.wait = r.value || 0;
  },
  draw(c, e, x, y) {
    if (e.born > 0) c.globalAlpha = 1 - e.born / 0.5;
    e.drawAs?.(c, e, x, y);
    c.globalAlpha = 1;
    if (e.hp < e.maxHp) bar(c, x - 10, y - (e.barY || 26), 20, 2, e.hp / e.maxHp, e.col || '#e0303a');
  },
};
function vanish(e) { if (e.dead) return; e.dead = true; e.noXp = true; fxParticles(e.x, e.y - 6, e.col || '#c96aff', 14, 90, 0.5); }
function addClone(boss, x, y, o = {}) {
  [x, y] = G.stage.clampPos(x, y);
  const q = spawnEnemy('bossclone', x, y);
  q.hp = q.maxHp = boss.maxHp * (o.frac || 0.04);
  Object.assign(q, { own: boss, life: 12, col: boss.def.col }, o);
  fxParticles(x, y - 6, q.col, 16, 80, 0.5);
  return q;
}
// Inseguitrici (Celeste): ripercorrono il TUO percorso con qualche istante di ritardo
ETYPES.bosschaser = {
  hp: 1, spd: 0, dmg: 0, r: 6, xp: 0, name: 'Inseguitrice', kbRes: 1,
  init(e) { e.harmless = true; e.noSep = true; e.noXp = true; e.anchored = true; e.immune = true; e.born = 0.6; },
  ai(e, dt) {
    if (!e.own || e.own.dead || e.own.trans > 0 || (e.life -= dt) <= 0 || !e.pl || e.pl.down) { vanish(e); return; }
    const hist = e.pl === G.cur ? G.hist : e.pl.hist;
    let pt = null;
    for (let i = hist.length - 1; i >= 0; i--) if (hist[i].t <= G.t - e.delay) { pt = hist[i]; break; }
    if (pt) { e.vx = (pt.x - e.x) * 12; e.vy = (pt.y - e.y) * 12; e.face = pt.fl ? -1 : 1; } else e.vx = e.vy = 0;
    if (e.born > 0) { e.born -= dt; return; }
    hitCircle(e.x, e.y, e.r, e.hit || 14, e);
    if (G.frame % 3 === 0) G.fx.push({ k: 'p', x: e.x + rnd(-4, 4), y: e.y - rnd(4, 14), vx: 0, vy: -12, life: 0.4, max: 0.4, col: '#c96aff', size: 1 });
  },
  draw(c, e, x, y) { c.globalAlpha = e.born > 0 ? 0.3 : 0.85; e.drawAs?.(c, e, x, y); c.globalAlpha = 1; },
};
function addChaser(boss, pl, delay, o = {}) {
  const q = spawnEnemy('bosschaser', pl.p.x, pl.p.y);
  Object.assign(q, { own: boss, pl, delay, life: 9 }, o);
  return q;
}

// Due (o più) copioni insieme: il boss fa due cose alla volta
function* gBoth(...gens) {
  const st = gens.map(g => ({ g, w: 0, done: false }));
  while (st.some(s => !s.done)) {
    for (const s of st) if (!s.done && s.w <= 0) { const r = s.g.next(); if (r.done) s.done = true; else s.w = r.value || 0; }
    const live = st.filter(s => !s.done);
    if (!live.length) break;
    const step = Math.max(1 / 60, Math.min(...live.map(s => s.w)));
    for (const s of live) s.w -= step;
    yield step;
  }
}
// Più fasci che ruotano insieme attorno al boss
function* gBeams(e, o = {}) {
  const { n = 3, len = 320, w = 6, dmg = 18, sweep = 0.7, dur = 3.2, tele: tt = 0.9, col = '#fff2b0', off = rnd(TAU), ofs, stay = true, keepMv, spd } = o;
  const sx = ofs ? ofs[0] : 0, sy = ofs ? ofs[1] : 0;
  if (stay) e.mv = 'stay';
  for (let i = 0; i < n; i++) { const a = off + i / n * TAU; tele({ kind: 'line', x1: e.x + sx, y1: e.y + sy, x2: e.x + sx + Math.cos(a) * len, y2: e.y + sy + Math.sin(a) * len, w, t: tt, col }); }
  yield tt;
  e.beams = Array.from({ length: n }, (_, i) => ({ a: off + i / n * TAU, sweep, len, w, dmg, col, ox: sx, oy: sy, age: 0 }));
  if (spd) e.spdOv = spd;
  shake(4); sfx('boom');
  yield dur;
  e.beams = null; if (spd) e.spdOv = null;
  if (!keepMv) e.mv = e.def.mv || 'chase';
  yield 0.3;
}
// Parata: il boss si illumina e para tutto; poi risponde con un fendente circolare
function* gCounter(e, o = {}) {
  const { dur = 1.1, r = 58, dmg = 20, col = '#ffffff', text } = o;
  e.mv = 'stay'; e.parry = dur; e.takeMul = 0.1;
  if (text) bossSay(e, text);
  yield dur;
  e.parry = 0; e.takeMul = e.def.takeMul ?? 1;
  tele({ kind: 'circle', x: e.x, y: e.y, r, t: 0.45, col });
  yield 0.45;
  hitCircle(e.x, e.y, r, dmg, e);
  fxArc(e.x, e.y, 0, Math.PI, r * 0.9, col, 0.2, 4); fxRing(e.x, e.y, 8, r, col, 0.3, 3); shake(5); sfx('boom');
  e.mv = e.def.mv || 'chase';
  yield 0.35;
}
// Scudo frontale (La Mano del Re): il danno dal davanti è quasi nullo, alle spalle è maggiore
function guardMul(e) {
  if (!e.guarding) return 1;
  const a = Math.atan2(G.p.y - e.y, G.p.x - e.x);
  if (Math.abs(angDiff(a, e.guardA)) < 1.05) {
    e.guardHits = (e.guardHits || 0) + 1;
    if ((G.frame + e.guardHits) % 5 === 0) fxParticles(e.x + Math.cos(e.guardA) * 18, e.y - 8 + Math.sin(e.guardA) * 18, '#ffe680', 2, 60, 0.2);
    return 0.35;
  }
  return 1.3;
}
function* gGuard(e, o = {}) {
  const { dur = 3.2, turn = 0.9, spd = 26, onTick } = o;
  e.guard = guardMul; e.guarding = true; e.guardA = e.faceA ?? angTo(e); e.guardHits = 0; e.spdOv = spd; e.mv = 'chase';
  let t = 0;
  while (t < dur) { yield 0.2; t += 0.2; onTick?.(e, t); }
  e.guarding = false; e.spdOv = null;
}

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
  e.faceA = Math.atan2(p.y - e.y, p.x - e.x);
  if (e.guarding) { const da = angDiff(e.faceA, e.guardA); e.guardA += clamp(da, -0.9 * dt, 0.9 * dt); }
  if (e.parts) for (const q of e.parts) {
    if (!q.dead && q.orbit) { q.oa += q.orbit * dt; q.ox = Math.cos(q.oa) * q.rad; q.oy = Math.sin(q.oa) * q.rad * 0.75; }
    if (!q.dead && !q.fixed) { q.x = e.x + q.ox; q.y = e.y + q.oy; }
    if (q.dead && !q.gone) { q.gone = true; fxParticles(q.x, q.y, q.col || '#ffffff', 22, 130, 0.6, 2); fxRing(q.x, q.y, 4, 40, q.col || '#ffffff', 0.4, 3); shake(6); sfx('boom'); def.onPartDead?.(e, q); }
  }
  if (e.aura) { e.auraK = (e.auraK || 0) - dt; if (e.auraK <= 0) { e.auraK = 0.5; hitCircle(e.x, e.y, e.aura.r, e.aura.dmg, e); } }
  if (G.arena && G.arena.boss) arenaClamp(e, false);
  if (e.beams) {
    for (const b of e.beams) {
      b.age = (b.age || 0) + dt;
      b.a += b.sweep * dt * Math.min(1, b.age / 0.6); b.k = (b.k || 0) - dt;
      const sx = e.x + (b.ox || 0), sy = e.y + (b.oy || 0);
      if (b.k <= 0) { b.k = 0.3; hitLine(sx, sy, sx + Math.cos(b.a) * b.len, sy + Math.sin(b.a) * b.len, b.w, b.dmg, e); }
    }
  }
  if (e.trail > 0) { e.trail -= dt; if (G.frame % 2 === 0) G.fx.push({ k: 'ghost', x: e.x, y: e.y, life: 0.25, max: 0.25, e }); }
  if (e.spin) { e.spin.k -= dt; if (e.spin.k <= 0) { e.spin.k = 0.25; hitCircle(e.x, e.y, e.spin.r, e.spin.dmg, e); } }
  if (e.beam) {
    const b = e.beam;
    b.a += b.sweep * dt; b.k -= dt;
    const sx = e.x + b.ox, sy = e.y + b.oy;
    if (b.k <= 0) { b.k = 0.3; hitLine(sx, sy, sx + Math.cos(b.a) * b.len, sy + Math.sin(b.a) * b.len, b.w, b.dmg, e); }
  }
}

// Alfa 5: fasi. Ogni boss ha def.phases = [{ at, name, line, patterns, gap, onEnter, aura }]:
// quando la vita scende sotto `at` parte una transizione (invulnerabile, onda d'urto, titolo).
function startPhase(e, k) {
  const def = e.def, P = def.phases[k];
  e.phase = k; e.p2 = k >= (def.sprPhase ?? 1);
  e.co = null; e.beam = null; e.beams = null; e.spin = null; e.spdOv = null; e.cloak = 0; e.air = false; e.rise = false; e.hidden = !!def.hideOnTrans; e.stunned = 0;
  e.guarding = false; e.parry = 0; e.mask = null;
  e.mv = def.mv || 'chase'; e.takeMul = def.takeMul ?? 1;
  e.trans = def.mini ? 1.1 : 1.9; e.transMax = e.trans;
  G.eprojs = []; G.bdoors = [];
  for (const q of G.enemies) if (q.own === e && !q.dead) vanish(q);
  e.parts = null;
  forPls(() => { const p = G.p, [nx, ny] = norm(p.x - e.x, p.y - e.y); if (d2(p.x, p.y, e.x, e.y) < 110 * 110) { p.rx += nx * 420; p.ry += ny * 420; } });
  // l'onda della nuova fase spazza via i nemici comuni intorno al boss: la scena resta leggibile
  for (const q of G.enemies) if (!q.dead && !q.boss && !q.elite && !q.anchored && !q.prop && q.own !== e && d2(q.x, q.y, e.x, e.y) < 190 * 190) killEnemy(q, { src: 'phase' });
  fxRing(e.x, e.y, 10, 140, def.col || '#ffffff', 0.7, 4); fxParticles(e.x, e.y, def.col || '#ffffff', 40, 200, 0.9, 2);
  shake(9); sfx('boom'); G.flashW = 0.35;
  const line = typeof P.line === 'function' ? P.line(e) : P.line;
  if (line) bossSay(e, line, true);
  if (def.mini) banner((def.name || '').toUpperCase() + ' · FASE ' + (k + 1), P.name || '', 1.8, def.col || '#e0303a');
  else G.titleCard = { name: P.name || def.name, title: 'FASE ' + (k + 1) + ' DI ' + def.phases.length, t: 2.2, max: 2.2, col: def.col };
}
function bossPhases(e, dt) {
  const def = e.def, ph = def.phases;
  if (e.phase === undefined) { e.phase = 0; ph[0].onEnter?.(e); }
  // invulnerabile durante la transizione o finché esistono punti deboli da distruggere
  e.immune = e.trans > 0 || !!(e.parts && e.parts.some(q => !q.dead && q.shield));
  if (e.trans > 0) {
    e.trans -= dt; e.vx = e.vy = 0;
    if (G.frame % 3 === 0) fxParticles(e.x + rnd(-e.r, e.r), e.y + rnd(-e.r, e.r), def.col || '#ffffff', 1, 60, 0.5);
    if (e.trans <= 0) { def.phases[e.phase].onEnter?.(e); e.wait = 0.4; }
    return true;
  }
  const nx = e.phase + 1;
  e.hpFloor = nx < ph.length ? e.maxHp * ph[nx].at - 1 : 0;
  if (nx < ph.length && (e.hp <= e.maxHp * ph[nx].at || ph[e.phase].until?.(e))) {
    e.hp = Math.min(e.hp, e.maxHp * ph[nx].at);
    startPhase(e, nx);
    return true;
  }
  return false;
}

function bossAI(e, dt) {
  const def = e.def;
  if (bossPhases(e, dt)) { bossMove(e, dt); e.vx = e.vy = 0; return; }
  bossMove(e, dt);
  if (e.wait > 0) { e.wait -= dt; return; }
  const P = def.phases[e.phase];
  if (!e.co) {
    // copione a caso (pesato), mai lo stesso due volte di fila, solo quelli possibili ora (`when`)
    const ok = P.patterns.filter(pt => !pt.when || pt.when(e));
    const pool0 = ok.filter(pt => pt !== e.lastPat);
    const pool = pool0.length ? pool0 : ok.length ? ok : P.patterns;
    const tot = pool.reduce((a, pt) => a + (pt.w || 1), 0);
    let r = rnd(tot), pick0 = pool[0];
    for (const pt of pool) { r -= pt.w || 1; if (r <= 0) { pick0 = pt; break; } }
    e.lastPat = pick0;
    TELE_OWNER = e;
    e.co = pick0.f(e);
    TELE_OWNER = null;
    if (pick0.shout && Math.random() < 0.6) bossSay(e, pick(pick0.shout));
  }
  TELE_OWNER = e;
  const res = e.co.next();
  TELE_OWNER = null;
  if (res.done) { e.co = null; e.wait = P.gap ?? def.gap ?? 0.8; }
  else e.wait = res.value || 0;
}

function bossDraw(c, e, x, y) {
  const def = e.def;
  if (e.air) {
    if (e.rise && e.airT <= 0) return;
    const k = e.rise ? e.airT / e.airMax : 1 - e.airT / e.airMax;
    e.airT = Math.max(0, e.airT - 1 / 60);
    const sx = Math.round(e.tx - camX), sy = Math.round(e.ty - camY);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(sx, sy + 4, e.r * (0.4 + k * 0.8), e.r * (0.2 + k * 0.4), 0, 0, TAU); c.fill();
    c.globalAlpha = 0.5 + 0.5 * k;
    def.draw(c, e, sx, sy - 140 * (1 - k));
    c.globalAlpha = 1;
    return;
  }
  if (e.hidden) {
    // un boss nascosto (la Mamma) parla da fuori scena: la nuvoletta va sotto la sua barra
    if (e.bubble) { const b = e.bubble; b.t -= 1 / 60; if (b.t <= 0) e.bubble = null; else { const w = tw(c, b.text) + 10; c.globalAlpha = Math.min(1, b.t * 3); patch(c, W / 2 - w / 2, 84, w, 14, def.col || '#ffffff'); txt(c, b.text, W / 2, 87, def.col || '#ffffff', 8, 'center'); c.globalAlpha = 1; } }
    return;
  }
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, y + e.r * 0.8, e.r * 0.9, e.r * 0.3, 0, 0, TAU); c.fill();
  // aura delle fasi avanzate: un alone che pulsa sotto il boss e scintille che salgono
  const P = def.phases && def.phases[e.phase];
  if (P && e.phase >= 1) {
    const ac = P.aura || def.col || '#ffffff', k = 0.5 + 0.5 * Math.sin(G.t * (3 + e.phase * 2));
    c.globalAlpha = 0.18 + 0.14 * k; c.fillStyle = ac;
    c.beginPath(); c.ellipse(x, y + e.r * 0.8, e.r * (1.6 + e.phase * 0.5), e.r * (0.55 + e.phase * 0.15), 0, 0, TAU); c.fill();
    c.globalAlpha = 1;
    if (e.phase >= 2 && G.frame % 4 === 0) G.fx.push({ k: 'p', x: e.x + rnd(-e.r * 1.5, e.r * 1.5), y: e.y + rnd(-e.r, e.r * 0.5), vx: rnd(-6, 6), vy: -rnd(30, 60), life: 0.7, max: 0.7, col: ac, size: 2 });
    light(e.x, e.y - e.r, 60 + 20 * e.phase, ac);
  }
  if (e.cloak) { c.fillStyle = 'rgba(10,0,10,.55)'; c.beginPath(); c.ellipse(x, y + e.r * 0.8, e.r * 1.1, e.r * 0.35, 0, 0, TAU); c.fill(); }
  if (e.stunned > 0) { c.globalAlpha = 0.7 + 0.3 * Math.sin(G.t * 30); }
  if (e.trans > 0 && Math.floor(e.trans * 14) % 2 === 0) { const sv = e.flash; e.flash = 1; def.draw(c, e, x, y); e.flash = sv; }
  else def.draw(c, e, x, y);
  c.globalAlpha = 1;
  if (e.trans > 0) {
    const k = 1 - e.trans / e.transMax;
    c.strokeStyle = def.col || '#ffffff'; c.globalAlpha = 0.7 * (1 - k); c.lineWidth = 3;
    c.beginPath(); c.arc(x, y - e.r * 0.5, e.r * 1.5 + k * 40, 0, TAU); c.stroke();
    c.lineWidth = 1; c.globalAlpha = 1;
  }
  if (e.guarding) {
    const a = e.guardA ?? e.faceA ?? 0;
    c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(x, y - 6, e.r + 11, a - 1.05, a + 1.05); c.stroke();
    c.strokeStyle = '#ffe680'; c.lineWidth = 3; c.globalAlpha = 0.7 + 0.3 * Math.sin(G.t * 12);
    c.beginPath(); c.arc(x, y - 6, e.r + 11, a - 1.05, a + 1.05); c.stroke(); c.lineWidth = 1; c.globalAlpha = 1;
    light(e.x + Math.cos(a) * 20, e.y - 6 + Math.sin(a) * 20, 30, '#ffe680');
  }
  if (e.parry > 0) {
    c.strokeStyle = '#ffffff'; c.globalAlpha = 0.5 + 0.5 * Math.sin(G.t * 30); c.lineWidth = 2;
    c.beginPath(); c.arc(x, y - e.r * 0.6, e.r + 8, 0, TAU); c.stroke(); c.lineWidth = 1; c.globalAlpha = 1;
    light(e.x, e.y - e.r, 50, '#ffffff');
  }
  if (e.aura) {
    const r = e.aura.r;
    c.globalAlpha = 0.2 + 0.1 * Math.sin(G.t * 9); c.fillStyle = e.aura.col || '#ff6a2a';
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = 1;
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + G.t * 1.5, ph = (G.t * 2.2 + i * 0.31) % 1; c.fillStyle = ph < 0.5 ? '#ffd23f' : '#ff6a2a'; c.fillRect(Math.round(x + Math.cos(a) * r * 0.92), Math.round(y + Math.sin(a) * r * 0.92 - ph * 8), 2, 3); }
    light(e.x, e.y, r * 1.6, e.aura.col || '#ff6a2a');
  }
  if (e.beams) for (const b of e.beams) {
    const sx = x + (b.ox || 0), sy = y + (b.oy || 0);
    c.save(); c.translate(sx, sy); c.rotate(b.a);
    c.fillStyle = b.col; c.globalAlpha = 0.4; c.fillRect(0, -b.w - 2, b.len, (b.w + 2) * 2);
    c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(0, -Math.max(1, b.w / 3), b.len, Math.max(2, b.w / 1.5));
    c.restore();
    light(e.x + (b.ox || 0) + Math.cos(b.a) * b.len * 0.5, e.y + (b.oy || 0) + Math.sin(b.a) * b.len * 0.5, b.len * 0.4, b.col);
  }
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
    name: 'Il Falso Cavaliere', mini: true, hp: 1000, r: 12, spd: 34, col: '#ff9a2a', spr: 'falseknight', voice: 'grunt',
  },

  // ---------------------------------------------------------------- INFERNO (ULTRAKILL)
  gabriel: {
    name: 'Gabriele', title: 'Giudice dell\'Inferno', hp: 3000, r: 12, spd: 90, col: '#ffe680', voice: 'gabriel', home: 'v1',
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
  },

  // ---------------------------------------------------------------- TARTARO (Hades)
  hades: {
    name: 'Ade', title: 'Signore degli Inferi', hp: 3300, r: 15, spd: 44, col: '#e0303a', voice: 'hades', home: 'zagreus',
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
    name: 'Megera la Furia', mini: true, hp: 1000, r: 10, spd: 58, col: '#c94a6a', spr: 'megaera', voice: 'fury',
  },

  // ---------------------------------------------------------------- MONTE CELESTE
  badelineboss: {
    name: 'Badeline', title: 'Una Parte di Te', hp: 3000, r: 10, spd: 78, col: '#c96aff', voice: 'badeline', home: 'madeline', mv: 'path',
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
  },

  // ---------------------------------------------------------------- DEAD CELLS
  handofking: {
    name: 'La Mano del Re', title: 'Guardiano della Sala del Trono', hp: 3300, r: 14, spd: 48, col: '#ff8a2a', voice: 'hand', home: 'prisoner',
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
    name: 'Il Portinaio', mini: true, hp: 780, r: 12, spd: 36, col: '#ff4a2a', spr: 'concierge', voice: 'grunt',
  },

  // ---------------------------------------------------------------- CVSTODIA (Blasphemous)
  escribar: {
    name: 'Escribar', title: 'L\'Ultimo dei Supremi', hp: 3300, r: 16, spd: 30, col: '#e2c46a', voice: 'escribar', home: 'penitent', mv: 'keep', keep: 70,
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
    name: 'Ten Piedad', mini: true, hp: 820, r: 12, spd: 30, col: '#ff8a2a', spr: 'tenpiedad', voice: 'grunt',
  },

  // ---------------------------------------------------------------- TERRARIA
  moonlord: {
    name: 'Il Signore della Luna', title: 'Il Signore della Luna si è risvegliato!', hp: 3300, r: 20, spd: 26, col: '#7ff0e0', voice: 'moonlord', home: 'terrarian', mv: 'keep', keep: 100,
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
    name: 'L\'Occhio di Cthulhu', mini: true, hp: 800, r: 11, spd: 46, col: '#e0303a', spr: 'eoc', voice: 'moonlord',
  },

  // ---------------------------------------------------------------- IL SEMINTERRATO (Isaac)
  mom: {
    name: 'La Mamma', title: 'Isaac e sua madre vivevano da soli…', hp: 3100, r: 18, spd: 0, col: '#e0303a', voice: 'mom', home: 'isaac', mv: 'stay',
    init(e) { e.hidden = true; },
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
  },

  // ---------------------------------------------------------------- FINALE
  cucitrice: {
    name: 'La Cucitrice', title: 'Colei che Ricuce i Finali', hp: 4000, r: 14, spd: 54, col: '#e2b04a', voice: 'cucitrice', mv: 'keep', keep: 80,
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
    hp: def.hp, spd: def.spd || 40, dmg: 11, r: def.r, xp: def.mini ? 40 : 0,
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

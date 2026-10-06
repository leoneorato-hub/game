'use strict';
// =============================================================================
// ENGINE — stato di gioco, griglia spaziale, combattimento, entità, effetti.
// =============================================================================

const W = 640, H = 360, TAU = Math.PI * 2;
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pick = a => a[Math.floor(Math.random() * a.length)];
const d2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
function norm(x, y) { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; }
function cardinal(dx, dy) { return Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx) || 1, 0] : [0, Math.sign(dy) || 1]; }
function fmtTime(t) { t = Math.max(0, Math.floor(t)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }

// Impostazioni (persistono per il singolo giocatore, se il browser lo consente)
const SET = { vol: 0.5, shake: true, dmgNums: false, autoAbility: true, assist: false, speed: 1 };
try { Object.assign(SET, JSON.parse(localStorage.getItem('pe_settings') || '{}')); } catch (e) { /* storage non disponibile */ }
function saveSettings() { try { localStorage.setItem('pe_settings', JSON.stringify(SET)); } catch (e) { /* ignora */ } }

// Tempi della run in versione alfa (il GDD prevede 30 minuti)
const TIMES = { elites: [90, 180, 270], boss: 360, cont: 600 };

let G = null;          // stato della run
let MODE = 'menu';     // menu | play | levelup | pause | panic | cine | end

// --- Griglia spaziale ----------------------------------------------------------
const GRID = {
  cs: 64, map: new Map(),
  key(cx, cy) { return (cx + 32768) * 65536 + (cy + 32768); },
  build(list) {
    this.map.clear();
    for (const e of list) {
      if (e.dead) continue;
      const k = this.key(Math.floor(e.x / this.cs), Math.floor(e.y / this.cs));
      let b = this.map.get(k);
      if (!b) { b = []; this.map.set(k, b); }
      b.push(e);
    }
  },
  query(x, y, r, fn) {
    const cs = this.cs;
    const x0 = Math.floor((x - r - 24) / cs), x1 = Math.floor((x + r + 24) / cs);
    const y0 = Math.floor((y - r - 24) / cs), y1 = Math.floor((y + r + 24) / cs);
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const b = this.map.get(this.key(cx, cy));
      if (!b) continue;
      for (const e of b) {
        if (e.dead || e.hidden) continue;
        const rr = r + e.r;
        if (d2(x, y, e.x, e.y) <= rr * rr) fn(e);
      }
    }
  },
};

function nearest(x, y, r, filter) {
  let best = null, bd = Infinity;
  GRID.query(x, y, r, e => {
    if (filter && !filter(e)) return;
    const d = d2(x, y, e.x, e.y);
    if (d < bd) { bd = d; best = e; }
  });
  return best;
}
function enemiesIn(x, y, r) { const out = []; GRID.query(x, y, r, e => out.push(e)); return out; }

// Punto più affollato (per granate, incantesimi ad area…)
function densest(x, y, r) {
  const cand = enemiesIn(x, y, r);
  if (!cand.length) return null;
  let best = cand[0], bc = -1;
  for (let i = 0; i < Math.min(14, cand.length); i++) {
    const e = cand[Math.floor(Math.random() * cand.length)];
    let c = 0; GRID.query(e.x, e.y, 40, () => c++);
    if (c > bc) { bc = c; best = e; }
  }
  return best;
}

// Direzione cardinale con più nemici (Spirito Vendicativo, Verdiales…)
function densestCardinal(x, y, r, min = 1) {
  const c = [0, 0, 0, 0];
  GRID.query(x, y, r, e => {
    const dx = e.x - x, dy = e.y - y;
    if (Math.abs(dx) >= Math.abs(dy)) c[dx >= 0 ? 0 : 1]++; else c[dy >= 0 ? 2 : 3]++;
  });
  let bi = -1, bc = min - 1;
  for (let i = 0; i < 4; i++) if (c[i] > bc) { bc = c[i]; bi = i; }
  return bi < 0 ? null : [[1, 0], [-1, 0], [0, 1], [0, -1]][bi];
}

// --- Possesso di armi / passivi ------------------------------------------------
function getW(id) { return G.weapons.find(w => w.id === id); }
function getP(id) { return G.passives.find(p => p.id === id) || G.charms.find(p => p.id === id); }
function owned(id) {
  if (id.startsWith('boon:')) return Object.values(G.boons).some(b => b && b.god === id.slice(5));
  if (id.startsWith('scroll:')) return (G.p.scrolls?.[id.slice(7)] || 0) >= 3;
  return !!(getW(id) || getP(id));
}
function plvl(id) { const p = getP(id); return p ? p.lvl : 0; }
function lvMul(w, per) { return 1 + per * (w.lvl - 1); }
function cdOf(base) { return base * G.s.cd; }

// --- Effetti visivi --------------------------------------------------------------
function fxParticles(x, y, col, n = 6, spd = 60, life = 0.4, size = 1) {
  if (G.fx.length > 900) return;
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU), s = rnd(spd * 0.3, spd);
    G.fx.push({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, col, size });
  }
}
function fxRing(x, y, r0, r1, col, life = 0.3, w = 2) { G.fx.push({ k: 'ring', x, y, r0, r1, col, life, max: life, w }); }
function fxArc(x, y, ang, half, r, col, life = 0.12, w = 3) { G.fx.push({ k: 'arc', x, y, ang, half, r, col, life, max: life, w }); }
function fxLine(x1, y1, x2, y2, col, life = 0.1, w = 1) { G.fx.push({ k: 'line', x1, y1, x2, y2, col, life, max: life, w }); }
function fxBolt(x1, y1, x2, y2, col = '#bfe4ff', life = 0.14) {
  const pts = [[x1, y1]], n = 5;
  for (let i = 1; i < n; i++) pts.push([x1 + (x2 - x1) * i / n + rnd(-6, 6), y1 + (y2 - y1) * i / n + rnd(-6, 6)]);
  pts.push([x2, y2]);
  G.fx.push({ k: 'bolt', pts, col, life, max: life });
}
function fxText(x, y, txt, col = '#fff', life = 0.7, big = false) { G.fx.push({ k: 'text', x, y, txt, col, life, max: life, big }); }
function banner(txt, sub = '', t = 2.4, col = '#e2b04a') { G.banner = { txt, sub, t, max: t, col }; }
function shake(a) { if (SET.shake) G.shakeT = Math.max(G.shakeT, a); }

// --- Audio (sintesi minimale, parte dopo il primo input) --------------------------
let AC = null;
const sfxLast = {};
function audioInit() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } }
function sfx(name) {
  if (!AC || SET.vol <= 0) return;
  const now = AC.currentTime;
  if (sfxLast[name] && now - sfxLast[name] < 0.045) return;
  sfxLast[name] = now;
  const S = {
    hit: [['square', 180, 90, 0.04, 0.05]],
    pick: [['triangle', 880, 1320, 0.05, 0.05]],
    lvl: [['square', 523, 523, 0.08, 0.08], ['square', 659, 659, 0.08, 0.08, 0.08], ['square', 784, 784, 0.12, 0.08, 0.16]],
    hurt: [['sawtooth', 220, 60, 0.18, 0.12]],
    evo: [['triangle', 392, 784, 0.4, 0.12], ['square', 523, 1046, 0.4, 0.06, 0.1]],
    boom: [['sawtooth', 120, 40, 0.25, 0.12]],
    shot: [['square', 660, 330, 0.04, 0.03]],
    bell: [['sine', 196, 190, 1.2, 0.2], ['sine', 392, 380, 0.9, 0.08]],
    train: [['sawtooth', 90, 70, 0.6, 0.08]],
    ui: [['square', 440, 660, 0.04, 0.04]],
  }[name];
  if (!S) return;
  for (const [type, f0, f1, dur, vol, delay = 0] of S) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, now + delay);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + delay + dur);
    g.gain.setValueAtTime(vol * SET.vol, now + delay);
    g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(now + delay); o.stop(now + delay + dur + 0.02);
  }
}

// --- Statistiche --------------------------------------------------------------------
function recalc() {
  const c = G.char, p = G.p;
  const s = { might: 0.9, area: 1, cd: 1, speed: 1, magnet: 1, luck: 1, growth: 1, duration: 1, armor: c.armor || 0, hpMul: 1, hpAdd: 0, units: 0, anxMul: 1 };
  const U = (typeof META !== 'undefined' && META.up) || {};
  s.hpMul += 0.05 * (U.hp || 0); s.units += Math.floor((U.hp || 0) / 2); s.might += 0.04 * (U.might || 0); s.magnet += 0.15 * (U.magnet || 0);
  s.speed += 0.03 * (U.speed || 0); s.growth += 0.05 * (U.growth || 0); s.luck += 0.06 * (U.luck || 0);
  for (const it of G.passives) PASSIVES[it.id].stat?.(s, it.lvl);
  for (const it of G.charms) PASSIVES[it.id].stat?.(s, it.lvl);
  c.stats?.(s);
  G.s = s;
  const oldMax = p.maxHp;
  if (c.hpMode === 'hp') p.maxHp = Math.round((c.hp + s.hpAdd) * s.hpMul);
  else if (c.hpMode === 'masks' || c.hpMode === 'hearts') p.maxHp = c.hp + s.units * (c.hpMode === 'hearts' ? 2 : 1) + (p.extraUnits || 0);
  else p.maxHp = 100;
  if (oldMax && p.maxHp > oldMax) p.hp += p.maxHp - oldMax;
  p.hp = Math.min(p.hp, p.maxHp);
}

// --- Danno ai nemici ----------------------------------------------------------------
function hurtEnemy(e, dmg, o = {}) {
  if (e.dead || e.immune) return 0;
  let d = dmg * G.s.might;
  if (G.char.dmgMul) d *= G.char.dmgMul(o.src, e);
  if (G.dmgBuffT > 0) d *= G.dmgBuff;
  G.char.preHit?.(e, o);
  if (o.mul) d *= o.mul;
  let crit = !!o.crit;
  if (owned('frost')) o.critChance = (o.critChance || 0) + 0.08;
  if (!crit && o.critChance && Math.random() < o.critChance) crit = true;
  if (crit) d *= o.critMul || 2;
  if (e.takeMul !== undefined) d *= e.takeMul;
  if (e.guard) d *= e.guard(e, o);
  if (e.bunkerT > 0) d *= 1.3;
  e.hp -= d;
  e.flash = 0.07; e.pop = 0.12;
  if (crit && owned('frost') && !e.boss) e.freezeT = Math.max(e.freezeT, 1);
  if (o.kb && !e.boss) {
    const k = o.kb * (1 - (e.kbRes || 0));
    e.kx += (o.kx || 0) * k; e.ky += (o.ky || 0) * k;
  }
  if (o.stun && !e.boss) e.stun = Math.max(e.stun, o.stun);
  if (o.slow) { e.slow = Math.max(e.slow, o.slow); e.slowT = Math.max(e.slowT, o.slowT || 1); }
  if (o.freeze && !e.boss) { e.freezeT = Math.max(e.freezeT, o.freeze); }
  if (o.burn) { e.burnT = 2; e.burnD = o.burn; }
  G.dmgDealt += d;
  e.onDamaged?.(e, d);
  G.char.postHit?.(e, d, o);
  if (G.passives.length && !o.relicEcho) relicOnHit(e, d, o);
  if (e.linkT > 0) e.linkT -= 0.01;
  if (SET.dmgNums || crit) fxText(e.x + rnd(-4, 4), e.y - e.r - 4, crit ? Math.round(d) + '!' : Math.round(d), crit ? '#ffd23f' : '#fff', 0.5);
  if (!o.silent) { sfx('hit'); if (G.fx.length < 700) for (let i = 0; i < 2; i++) { const a = Math.atan2(o.ky || rnd(-1, 1), o.kx || rnd(-1, 1)) + rnd(-0.9, 0.9), sp = rnd(60, 140); G.fx.push({ k: 'spark', x: e.x, y: e.y - 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.18, max: 0.18, col: crit ? '#ffd23f' : '#fff6e0' }); } }
  if (e.hp <= 0) killEnemy(e, o);
  return d;
}

function killEnemy(e, o = {}) {
  if (e.dead) return;
  e.dead = true;
  G.kills++;
  fxParticles(e.x, e.y, e.blood || '#cfc6b8', e.elite ? 18 : 5, 70, 0.35);
  if (!e.noXp) dropGem(e.x, e.y, e.xp);
  if (!e.elite && !e.boss) {
    const luck = G.s.luck;
    if (Math.random() < 0.006 * luck) dropPickup('food', e.x, e.y);
    else if (Math.random() < 0.0025 * luck) dropPickup('yarn', e.x, e.y);
    else if (Math.random() < 0.003 * luck) dropPickup('strawberry', e.x, e.y);
  }
  if (e.elite && !e.boss) { dropPickup('chest', e.x, e.y); G.elitesKilled++; }
  e.onDeath?.(e);
  relicOnKill(e);
  G.char.onKill?.(e, o);
  if (e.boss) G.stage.onBossDeath?.(e);
}

// --- Danno al giocatore -------------------------------------------------------------
function hurtPlayer(amount, src) {
  const p = G.p;
  if (p.invuln > 0 || G.over || SET.assist || MODE !== 'play') return;
  if (src && src.weakT > 0) amount *= 0.7;
  amount *= G.dmgTakenMul;
  if (G.char.preHurt && G.char.preHurt(amount, src) === false) return;
  const mode = G.char.hpMode;
  const heavy = amount >= 22;
  if (mode === 'hp') {
    const a = Math.max(1, amount - G.s.armor);
    p.hp -= a;
    G.char.onHurt?.(a);
  } else if (mode === 'masks') {
    let n = heavy ? 2 : 1;
    if (G.overcharmed) n *= 2;
    p.hp -= n;
    G.char.onHurt?.(n);
  } else if (mode === 'hearts') {
    let n = heavy ? 2 : 1;
    const sh = Math.min(p.shield || 0, n);
    p.shield -= sh; n -= sh;
    p.hp -= n;
    G.char.onHurt?.(n);
  } else if (mode === 'anxiety') {
    p.hp += amount * 2.2 * G.s.anxMul;
    G.char.onHurt?.(amount);
  }
  p.invuln = G.char.iframes || 0.6;
  G.hitT = 0;
  eventHurt();
  G.hurtFlash = 0.15;
  { const low = mode === 'anxiety' ? p.hp > 70 : p.hp < p.maxHp * 0.35; if (low && (G.barkLowT || 0) < G.t) { G.barkLowT = G.t + 15; bark('low'); } }
  shake(3);
  sfx('hurt');
  fxParticles(p.x, p.y, '#ff4a5a', 8, 80, 0.3);
  if (mode === 'anxiety') { if (p.hp >= 100) G.char.panic(); }
  else if (p.hp <= 0) killPlayer();
}

function healPlayer(n) {
  const p = G.p;
  const cap = p.maxHp - (p.hard || 0);
  if (G.char.hpMode === 'anxiety') { p.hp = Math.max(0, p.hp - n); return; }
  const before = p.hp;
  p.hp = Math.min(cap, p.hp + n);
  if (p.hp > before) fxText(p.x, p.y - 14, '+' + (Math.round((p.hp - before) * 10) / 10), '#6aff8a', 0.6);
}

function killPlayer() {
  if (G.char.onDeath && G.char.onDeath()) return;
  endRun(false);
}

// --- Nemici ---------------------------------------------------------------------------
function spawnEnemy(type, x, y, extra = {}) {
  const T = ETYPES[type];
  const sc = 1 + G.t / 240 + G.nodes * 0.15;
  const e = {
    type, x, y, vx: 0, vy: 0, kx: 0, ky: 0, r: T.r, spr: T.spr,
    hp: T.hp * (T.boss ? 1 : sc), maxHp: 0, spd: T.spd * (1 + Math.min(0.3, G.t / 1400)) * (owned('pact') ? 1.15 : 1), dmg: T.dmg * 0.8 * (1 + G.t / 700),
    xp: T.xp, elite: !!T.elite, boss: !!T.boss, kbRes: T.kbRes || (T.elite ? 0.8 : 0), blood: T.blood,
    flash: 0, stun: 0, slow: 0, slowT: 0, freezeT: 0, burnT: 0, burnD: 0, doomT: 0, chill: 0, weakT: 0, t: 0,
    ai: T.ai || AI.chase, draw: T.draw, hitT: 0, ...extra,
  };
  if (T.boss) e.hp = T.hp * (0.6 + Math.min(G.level, 40) * 0.02) * (1 + G.nodes * 0.2);
  e.maxHp = e.hp;
  T.init?.(e);
  G.enemies.push(e);
  return e;
}

function updateEnemies(dt) {
  const p = G.p;
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.lastSrcT > 0) e.lastSrcT -= dt;
    if (e.bunkerT > 0) e.bunkerT -= dt;
    if (e.weakT > 0) e.weakT -= dt;
    // Stati
    if (e.burnT > 0) {
      e.burnT -= dt; e.burnTick = (e.burnTick || 0) - dt;
      if (e.burnTick <= 0) { e.burnTick = 0.3; hurtEnemy(e, e.burnD, { silent: true }); if (e.dead) continue; fxParticles(e.x, e.y - 3, '#ff8a2a', 1, 20, 0.3); }
    }
    if (e.doomT > 0) {
      e.doomT -= dt;
      if (e.doomT <= 0) {
        fxText(e.x, e.y - 10, '☠', '#ff3a3a', 0.6);
        hurtEnemy(e, e.doomDmg, { silent: true });
        if (e.dead) continue;
        if (e.doomRepeat > 0) { e.doomRepeat--; e.doomT = 1.1; }
      }
    }
    let mv = 1;
    if (e.slowT > 0) { e.slowT -= dt; mv *= 1 - e.slow; } else e.slow = 0;
    if (G.auraSlow && d2(e.x, e.y, p.x, p.y) < G.auraSlow.r * G.auraSlow.r) mv *= 1 - G.auraSlow.v;
    if (e.freezeT > 0) { e.freezeT -= dt; mv = 0; }
    if (e.stun > 0) { e.stun -= dt; mv = 0; }
    if (e.pull) {
      const [nx, ny] = norm(p.x - e.x, p.y - e.y);
      e.x += nx * 520 * dt; e.y += ny * 520 * dt;
      if (d2(e.x, e.y, p.x, p.y) < 18 * 18 || (e.pull.t -= dt) <= 0) { const cb = e.pull.cb; e.pull = null; cb?.(e); }
      continue;
    }
    if (mv > 0) e.ai(e, dt);
    e.x += (e.vx * mv + e.kx) * dt;
    e.y += (e.vy * mv + e.ky) * dt;
    const decay = Math.min(1, dt * 9);
    e.kx -= e.kx * decay; e.ky -= e.ky * decay;
    if (e.dead) continue;
    // Separazione leggera
    if (!e.boss && !e.noSep && ((G.frame + (e.r * 7 | 0)) & 1)) {
      GRID.query(e.x, e.y, e.r, o => {
        if (o === e || o.boss) return;
        const dx = e.x - o.x, dy = e.y - o.y;
        const dd = dx * dx + dy * dy, rr = e.r + o.r;
        if (dd > 0.01 && dd < rr * rr) { const l = Math.sqrt(dd); const push = (rr - l) * 0.5; e.x += dx / l * push; e.y += dy / l * push; }
      });
    }
    // Blocchi del Terrariano
    for (const b of G.blocks) {
      const dx = e.x - b.x, dy = e.y - b.y, rr = e.r + 5;
      if (dx * dx + dy * dy < rr * rr) {
        const l = Math.hypot(dx, dy) || 1;
        e.x = b.x + dx / l * rr; e.y = b.y + dy / l * rr;
        b.hp -= e.dmg * dt * 2;
        e.bunkerT = 0.5;
      }
    }
    G.stage.constrainEnemy?.(e);
    // Contatto
    if (!e.harmless && e.stun <= 0 && e.freezeT <= 0 && !e.hidden) {
      const rr = e.r + p.r;
      if (d2(e.x, e.y, p.x, p.y) < rr * rr) hurtPlayer(e.dmg, e);
    }
    // Riposizionamento di chi resta troppo indietro (come in VS)
    if (!e.elite && !e.boss && !e.anchored && d2(e.x, e.y, p.x, p.y) > 560 * 560) {
      const a = Math.atan2(p.y - e.y, p.x - e.x) + rnd(-0.6, 0.6);
      const pos = G.stage.spawnPos(a);
      if (pos) { e.x = pos[0]; e.y = pos[1]; }
    }
  }
}

// --- Proiettili del giocatore ----------------------------------------------------------
function shoot(o) {
  const pr = Object.assign({ r: 3, pierce: 0, life: 1, hit: new Set(), col: '#fff', kind: 'dot', vx: 0, vy: 0, dmg: 10, homing: 0, rot: 0 }, o);
  G.projs.push(pr);
  return pr;
}

function updateProjs(dt) {
  for (const pr of G.projs) {
    if (pr.dead) continue;
    pr.life -= dt;
    if (pr.update) pr.update(pr, dt);
    if (pr.homing) {
      const t = nearest(pr.x, pr.y, 140);
      if (t) {
        const sp = Math.hypot(pr.vx, pr.vy);
        const [nx, ny] = norm(t.x - pr.x, t.y - pr.y);
        pr.vx += (nx * sp - pr.vx) * Math.min(1, pr.homing * dt);
        pr.vy += (ny * sp - pr.vy) * Math.min(1, pr.homing * dt);
        const [ux, uy] = norm(pr.vx, pr.vy); pr.vx = ux * sp; pr.vy = uy * sp;
      }
    }
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    pr.rot += dt * 12;
    if (!pr.noHit) {
      GRID.query(pr.x, pr.y, pr.r, e => {
        if (pr.dead || pr.hit.has(e)) return;
        pr.hit.add(e);
        const [kx, ky] = norm(pr.vx, pr.vy);
        hurtEnemy(e, pr.dmg, { kx, ky, kb: pr.kb || 40, src: pr.src, crit: pr.crit, critChance: pr.critChance, freeze: pr.freeze, burn: pr.burn, stun: pr.stun });
        pr.onHit?.(pr, e);
        if (pr.pierce-- <= 0) {
          if (owned('cmirror') && !pr.bounced && !pr.noHit) {
            pr.bounced = true; pr.pierce = 0;
            const n = nearest(pr.x, pr.y, 120, x => !pr.hit.has(x));
            if (n) { const sp = Math.hypot(pr.vx, pr.vy) || 200; const [nx, ny] = norm(n.x - pr.x, n.y - pr.y); pr.vx = nx * sp; pr.vy = ny * sp; pr.life = Math.max(pr.life, 0.5); if (owned('frost')) pr.freeze = 1; }
            else pr.dead = true;
          } else pr.dead = true;
        }
      });
    }
    if (pr.life <= 0 && !pr.dead) { pr.dead = true; pr.onEnd?.(pr); }
  }
}

// Colpo a raggio (hitscan / fascio): colpisce chi sta entro width dal segmento
function beamHit(x, y, dx, dy, length, width, dmg, o = {}) {
  const mx = x + dx * length / 2, my = y + dy * length / 2;
  const hits = [];
  GRID.query(mx, my, length / 2 + width, e => {
    const ex = e.x - x, ey = e.y - y;
    const t = clamp(ex * dx + ey * dy, 0, length);
    const px = x + dx * t - e.x, py = y + dy * t - e.y;
    const rr = width + e.r;
    if (px * px + py * py <= rr * rr) hits.push(e);
  });
  for (const e of hits) hurtEnemy(e, dmg, Object.assign({ kx: dx, ky: dy }, o));
  return hits;
}

function aoe(x, y, r, dmg, o = {}, col = '#fff') {
  const hits = enemiesIn(x, y, r);
  for (const e of hits) { const [kx, ky] = norm(e.x - x, e.y - y); hurtEnemy(e, dmg, Object.assign({ kx, ky }, o)); }
  if (col) fxRing(x, y, r * 0.3, r, col, 0.3, 2);
  return hits;
}

function arcHit(x, y, dx, dy, range, half, dmg, o = {}) {
  const cosL = Math.cos(half);
  const hits = [];
  GRID.query(x, y, range, e => {
    const ex = e.x - x, ey = e.y - y, l = Math.hypot(ex, ey);
    if (l < e.r + 3 || (ex * dx + ey * dy) / l >= cosL) hits.push(e);
  });
  for (const e of hits) hurtEnemy(e, dmg, Object.assign({ kx: dx, ky: dy }, o));
  return hits;
}

function chainLightning(x, y, n, range, dmg, o = {}, exclude) {
  const done = new Set(exclude ? [exclude] : []);
  let cx = x, cy = y;
  for (let i = 0; i < n; i++) {
    const t = nearest(cx, cy, range, e => !done.has(e));
    if (!t) break;
    done.add(t);
    fxBolt(cx, cy, t.x, t.y);
    hurtEnemy(t, dmg, Object.assign({ silent: true }, o));
    cx = t.x; cy = t.y;
  }
}

// --- Proiettili nemici -----------------------------------------------------------------
function eShoot(x, y, ang, spd, dmg, o = {}) {
  if (!o.force && G.eprojs.length > 70) return;
  G.eprojs.push(Object.assign({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, r: 3, dmg, life: 4, col: '#ff5a6a', kind: 'orb' }, o));
}
function updateEProjs(dt) {
  const p = G.p;
  for (const b of G.eprojs) {
    if (b.dead) continue;
    b.life -= dt;
    if (b.homing) {
      const sp = Math.hypot(b.vx, b.vy);
      const [nx, ny] = norm(p.x - b.x, p.y - b.y);
      b.vx += (nx * sp - b.vx) * Math.min(1, b.homing * dt); b.vy += (ny * sp - b.vy) * Math.min(1, b.homing * dt);
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.life <= 0) { b.dead = true; continue; }
    for (const bl of G.blocks) if (d2(b.x, b.y, bl.x, bl.y) < 49) { b.dead = true; bl.hp -= 10; }
    const rr = b.r + p.r;
    if (!b.dead && d2(b.x, b.y, p.x, p.y) < rr * rr) { b.dead = true; hurtPlayer(b.dmg, b); }
  }
}

// --- Gemme e pickup --------------------------------------------------------------------
function dropGem(x, y, v) {
  v *= 1 + G.t / 240;
  if (G.gems.length > 420) {
    const g = G.gems[Math.floor(Math.random() * G.gems.length)];
    g.v += v; return;
  }
  G.gems.push({ x: x + rnd(-3, 3), y: y + rnd(-3, 3), v, fly: false, vx: 0, vy: 0 });
}
function dropPickup(kind, x, y, extra = {}) { G.pickups.push(Object.assign({ kind, x, y, t: 0 }, extra)); }

function xpNeed(n) { return 6 + 8 * n + 0.45 * n * n; }

function updateGems(dt) {
  const p = G.p;
  const mag = 50 * G.s.magnet;
  for (const g of G.gems) {
    if (g.dead) continue;
    const dd = d2(g.x, g.y, p.x, p.y);
    if (!g.fly && dd < mag * mag) g.fly = true;
    if (g.fly) {
      // Inseguimento diretto: velocità scalare crescente, nessuna inerzia laterale
      // (prima la velocità si accumulava e le gemme orbitavano intorno al giocatore).
      g.spd = Math.min(560, (g.spd || 60) + 1100 * dt);
      const d = Math.sqrt(dd), step = g.spd * dt;
      if (d <= step + p.r + 4) { g.x = p.x; g.y = p.y; }
      else { g.x += (p.x - g.x) / d * step; g.y += (p.y - g.y) / d * step; }
      if (d <= step + p.r + 4) {
        g.dead = true;
        G.thread += g.v * 0.15; G.gemsTaken = (G.gemsTaken || 0) + 1;
        G.xp += g.v * G.s.growth * (G.char.xpMul ? G.char.xpMul() : 1) * (G.xpEventMul || 1) * (owned('pact') && owned('collector') ? 1.15 : 1);
        sfx('pick');
      }
    }
  }
  while (G.xp >= G.xpNext) {
    G.xp -= G.xpNext; G.level++; G.xpNext = xpNeed(G.level); G.pendingLv++;
  }
  for (const k of G.pickups) {
    if (k.dead) continue;
    k.t += dt;
    k.update?.(k, dt);
    if (k.life !== undefined && (k.life -= dt) <= 0) { k.dead = true; continue; }
    if (d2(k.x, k.y, p.x, p.y) < (p.r + 7) * (p.r + 7)) collectPickup(k);
  }
}

function collectPickup(k) {
  const p = G.p;
  switch (k.kind) {
    case 'food':
      if (G.char.noFood) { if (!k.warned) { fxText(k.x, k.y - 8, 'SOLO SANGUE', '#ff5a6a', 0.8); k.warned = true; } return; }
      k.dead = true;
      if (G.char.hpMode === 'hp') healPlayer(p.maxHp * 0.3);
      else if (G.char.hpMode === 'anxiety') healPlayer(35);
      else healPlayer(2);
      sfx('pick');
      break;
    case 'yarn':
      k.dead = true;
      for (const g of G.gems) g.fly = true;
      banner('GOMITOLO', 'Tutti i frammenti arrivano a te', 1.2, '#f2a0b8');
      break;
    case 'chest':
      k.dead = true; openChest(); break;
    case 'strawberry':
      k.dead = true; G.straw++;
      fxText(k.x, k.y - 10, 'FRAGOLA! (non serve a nulla)', '#ff7a8a', 1.2);
      sfx('pick');
      break;
    default:
      if (G.char.onPickup?.(k)) k.dead = true;
      else if (G.stage.onPickup?.(k)) k.dead = true;
  }
}

// --- Strappi (forzieri) ed evoluzioni -----------------------------------------------------
function evoReady(rule) {
  const w = getW(rule.w);
  if (!w || w.evo || w.lvl < (WEAPONS[rule.w].max || 8)) return false;
  return rule.req.every(r => owned(r));
}
function openChest() {
  const rule = EVOS.find(r => r.char === G.char.id && evoReady(r));
  if (rule) { startEvolution(rule); return; }
  if (Math.random() < 0.22 && relicChoices(1).length) { offerRelic(); return; }
  const n = Math.random() < 0.15 * G.s.luck ? 3 : 1;
  const got = [];
  for (let i = 0; i < n; i++) {
    const opts = buildOptions(1, true);
    if (!opts.length) break;
    applyOption(opts[0]);
    got.push(opts[0].name);
  }
  if (!got.length) { healPlayer(G.char.hpMode === 'hp' ? G.p.maxHp * 0.3 : 2); got.push('Cura'); }
  G.char.onChest?.();
  banner('STRAPPO APERTO', got.join(' · '), 2.2);
  sfx('lvl');
}
function startEvolution(rule) {
  const w = getW(rule.w);
  for (const id of rule.consume || []) {
    const i = G.weapons.findIndex(x => x.id === id);
    if (i >= 0) G.weapons.splice(i, 1);
  }
  w.evo = true;
  w.t = 0;
  G.cine = { t: 1.6, max: 1.6, rule, a: WEAPONS[rule.w], b: rule.req.map(r => WEAPONS[r] || PASSIVES[r]).filter(Boolean)[0] };
  MODE = 'cine';
  sfx('evo');
}

// --- Abilità passive dei personaggi: blocchi del Terrariano ecc. -------------------------
function updateBlocks(dt) {
  for (const b of G.blocks) { b.life -= dt; if (b.life <= 0 || b.hp <= 0) { b.dead = true; fxParticles(b.x, b.y, '#8a6a4a', 4, 40, 0.3); } }
  G.blocks = G.blocks.filter(b => !b.dead);
}

// --- Fine run --------------------------------------------------------------------------
function endRun(win, reason) {
  if (G.over) return;
  G.over = true;
  G.win = win;
  G.reason = reason;
  MODE = 'end';
  META.thread += Math.floor(G.thread);
  if (win && G.mode === 'story') { META.beaten[G.stage.id] = true; if (G.stage.id === 'finale') META.storyDone[G.char.id] = true; }
  saveMeta();
  if (win) {
    try {
      const best = JSON.parse(localStorage.getItem('pe_best') || '{}');
      const key = G.char.id + ':' + G.stage.id;
      if (!best[key] || best[key] > G.t) best[key] = G.t;
      localStorage.setItem('pe_best', JSON.stringify(best));
    } catch (e) { /* ignora */ }
  }
  UI.showEnd();
}

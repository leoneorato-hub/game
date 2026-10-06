'use strict';
// =============================================================================
// LIVELLI — nemici, comportamenti, pericoli ambientali e boss (GDD §4).
// =============================================================================

const AI = {
  chase(e) { const p = G.p; const [nx, ny] = norm(p.x - e.x, p.y - e.y); e.vx = nx * e.spd; e.vy = ny * e.spd; },
  moth(e) {
    const p = G.p; const [nx, ny] = norm(p.x - e.x, p.y - e.y);
    const w = Math.sin(e.t * 5 + e.seed) * 0.9;
    e.vx = (nx - ny * w) * e.spd; e.vy = (ny + nx * w) * e.spd;
  },
  pin(e, dt) {
    const p = G.p;
    e.cd = (e.cd ?? rnd(1, 3)) - dt;
    if (e.dashT > 0) { e.dashT -= dt; e.vx = e.dx * e.spd * 3.2; e.vy = e.dy * e.spd * 3.2; return; }
    AI.chase(e); e.vx *= 0.6; e.vy *= 0.6;
    if (e.cd <= 0 && d2(e.x, e.y, p.x, p.y) < 200 * 200) {
      e.cd = 3;
      if (Math.random() < 0.5) { [e.dx, e.dy] = norm(p.x - e.x, p.y - e.y); e.dashT = 0.45; }
      else eShoot(e.x, e.y, Math.atan2(p.y - e.y, p.x - e.x), 110, e.dmg * 0.8, { col: '#d6453d', kind: 'pin' });
    }
  },
  ticket(e) { if (e.dx === undefined) { [e.dx, e.dy] = norm(G.p.x - e.x, G.p.y - e.y); } e.vx = e.dx * e.spd; e.vy = e.dy * e.spd; if (e.t > 9) { e.dead = true; } },
  inspector(e, dt) {
    const p = G.p;
    const want = Math.atan2(p.y - e.y, p.x - e.x);
    e.face = e.face ?? want;
    let da = ((want - e.face + Math.PI * 3) % TAU) - Math.PI;
    e.face += clamp(da, -1.3 * dt, 1.3 * dt);
    AI.chase(e);
    e.cd = (e.cd ?? 2) - dt;
    if (e.cd <= 0 && d2(e.x, e.y, p.x, p.y) < 180 * 180) { e.cd = 3.2; eShoot(e.x, e.y, want, 120, e.dmg * 0.8, { col: '#f2c230', kind: 'ticket' }); }
  },
  suitcase(e) {
    const p = G.p;
    if (!e.awake) { e.vx = e.vy = 0; if (d2(e.x, e.y, p.x, p.y) < 70 * 70) { e.awake = true; e.spd *= 2.4; fxText(e.x, e.y - 10, '!', '#f2efe6', 0.5); } return; }
    AI.chase(e);
  },
  chorister(e, dt) {
    const p = G.p;
    AI.chase(e);
    const close = d2(e.x, e.y, p.x, p.y) < 110 * 110;
    if (close) { e.vx *= 0.3; e.vy *= 0.3; }
    e.cd = (e.cd ?? rnd(1, 3)) - dt;
    e.cd2 = (e.cd2 ?? rnd(3, 6)) - dt;
    if (e.cd <= 0 && close) {
      e.cd = 3;
      const a0 = Math.atan2(p.y - e.y, p.x - e.x);
      for (const o of [-0.25, 0, 0.25]) eShoot(e.x, e.y, a0 + o, 80, e.dmg * 0.7, { col: '#c9a6ff', kind: 'note', life: 5 });
    }
    if (e.cd2 <= 0 && close) { e.cd2 = 9; G.zones.push({ type: 'silence', x: e.x, y: e.y, r: 46, t: 4 }); fxRing(e.x, e.y, 4, 46, '#8a7aa0', 0.5); }
  },
  ringer(e, dt) {
    const p = G.p;
    if (e.air > 0) {
      e.air -= dt; e.hidden = true; e.vx = e.vy = 0;
      if (e.air <= 0) {
        e.hidden = false; e.x = e.tx; e.y = e.ty;
        fxRing(e.x, e.y, 4, 22, '#6b4e2e', 0.3);
        if (d2(e.x, e.y, p.x, p.y) < 22 * 22) hurtPlayer(e.dmg * 1.3, e);
      }
      return;
    }
    AI.chase(e);
    e.cd = (e.cd ?? rnd(2, 4)) - dt;
    if (e.cd <= 0 && d2(e.x, e.y, p.x, p.y) < 180 * 180) { e.cd = 3.5; e.air = 0.9; e.tx = p.x; e.ty = p.y; }
  },
  candle(e, dt) {
    const p = G.p;
    if (e.fuse !== undefined) {
      e.vx = e.vy = 0; e.fuse -= dt;
      if (e.fuse <= 0) {
        e.dead = true;
        fxRing(e.x, e.y, 4, 28, '#ff8a2a', 0.35); fxParticles(e.x, e.y, '#ffd23f', 12, 90, 0.4);
        if (d2(e.x, e.y, p.x, p.y) < 28 * 28) { hurtPlayer(e.dmg * 1.5, e); G.p.slowT = 2; }
        for (const o of enemiesIn(e.x, e.y, 28)) if (o !== e && !o.boss) hurtEnemy(o, 30, { silent: true });
      }
      return;
    }
    AI.chase(e);
    if (d2(e.x, e.y, p.x, p.y) < 22 * 22) e.fuse = 0.5;
  },
  clapper(e, dt) {
    e.ax = e.ax ?? e.x; e.ay = e.ay ?? e.y; e.axis = e.axis ?? rnd(Math.PI);
    const s = Math.sin(e.t * 2.2) * 46;
    e.vx = e.vy = 0;
    e.x = e.ax + Math.cos(e.axis) * s; e.y = e.ay + Math.sin(e.axis) * s;
    for (const o of enemiesIn(e.x, e.y, 6)) if (o !== e && !o.boss && !o.elite) hurtEnemy(o, 40 * dt * 10, { silent: true });
    if (e.t > 25) e.dead = true;
  },
  anchor(e) { e.vx = e.vy = 0; },
  darner(e, dt) {
    AI.chase(e);
    e.cd = (e.cd ?? 4) - dt;
    if (e.cd <= 0) {
      e.cd = 6;
      const vic = enemiesIn(e.x, e.y, 110).filter(o => !o.elite && !o.boss && o.type !== 'chimera').slice(0, 4);
      if (vic.length >= 2) {
        let hp = 0;
        for (const o of vic) { hp += o.hp; o.noXp = true; o.dead = true; fxLine(e.x, e.y, o.x, o.y, '#e2b04a', 0.4, 1); }
        const c = spawnEnemy('chimera', e.x + rnd(-16, 16), e.y + rnd(-16, 16));
        c.hp = c.maxHp = hp * 1.2 + 40;
        fxText(e.x, e.y - 20, 'CUCITI!', '#e2b04a', 0.8);
      }
    }
  },
  driver(e, dt) {
    AI.chase(e);
    e.cd = (e.cd ?? 5) - dt;
    if (e.cd <= 0) {
      e.cd = 7;
      const p = G.p;
      const list = enemiesIn(p.x, p.y, 340).filter(o => !o.elite && !o.boss).slice(0, 24);
      list.forEach((o, i) => { const a = i / list.length * TAU; fxParticles(o.x, o.y, '#a9e0c4', 3, 30, 0.3); o.x = p.x + Math.cos(a) * 115; o.y = p.y + Math.sin(a) * 115; o.stun = 0.4; });
      banner('«PROSSIMA FERMATA: QUI.»', 'Il Macchinista Fantasma chiama la fermata', 1.6, '#a9e0c4');
    }
  },
  abbess(e, dt) {
    AI.chase(e);
    e.cd = (e.cd ?? 3) - dt;
    if (e.cd <= 0) {
      e.cd = 6;
      fxRing(e.x, e.y, 6, 90, '#d9a83a', 0.6, 3);
      sfx('bell');
      if (d2(e.x, e.y, G.p.x, G.p.y) < 90 * 90) { G.invertT = 3; banner('RINTOCCO DISTORTO', 'Comandi invertiti per 3 secondi', 1.4, '#d9a83a'); }
    }
  },
  cont(e, dt) {
    const p = G.p;
    const [nx, ny] = norm(p.x - e.x, p.y - e.y);
    const sp = G.char.speed * 0.95;
    e.vx = nx * sp; e.vy = ny * sp;
    e.count = (e.count ?? 10) - dt;
    if (d2(e.x, e.y, p.x, p.y) < (e.r + p.r) ** 2) endRun(false, 'continue');
    if (e.count <= 0) endRun(false, 'continue');
  },
};

const ETYPES = {
  // Stage 1
  moth: { spr: 'moth', hp: 6, spd: 62, dmg: 6, r: 4, xp: 1, ai: AI.moth, blood: '#cfc6b8', init: e => { e.seed = rnd(TAU); } },
  doll: { spr: 'doll', hp: 20, spd: 40, dmg: 9, r: 5, xp: 2, blood: '#b0413e',
    onDeath: null, init: e => { e.onDeath = d => { for (let i = 0; i < 2; i++) spawnEnemy('dollSmall', d.x + rnd(-6, 6), d.y + rnd(-6, 6)); }; } },
  dollSmall: { spr: 'doll_small', hp: 6, spd: 55, dmg: 5, r: 3, xp: 1, blood: '#b0413e' },
  pin: { spr: 'pin', hp: 14, spd: 48, dmg: 8, r: 4, xp: 2, ai: AI.pin, blood: '#c9ced8' },
  chimera: { spr: 'chimera', hp: 80, spd: 34, dmg: 14, r: 8, xp: 8, blood: '#8a3a5e', kbRes: 0.6 },
  darner: { spr: 'darner', hp: 520, spd: 32, dmg: 16, r: 9, xp: 30, elite: true, ai: AI.darner, blood: '#6a4c7a', name: 'Il Rammendatore' },
  anchor: { spr: 'spool', hp: 380, spd: 0, dmg: 0, r: 8, xp: 10, ai: AI.anchor, kbRes: 1, init: e => { e.harmless = true; e.anchored = true; e.big = 2; e.noSep = true; } },
  spola: { hp: 5200, spd: 30, dmg: 22, r: 18, xp: 0, boss: true, ai: null, name: 'Madre Spola, la Tessitrice dei Finali' },
  // Stage 2
  commuter: { spr: 'commuter', hp: 18, spd: 38, dmg: 8, r: 5, xp: 1, blood: '#4f5d6e' },
  ticket: { spr: 'ticket', hp: 5, spd: 110, dmg: 6, r: 3, xp: 1, ai: AI.ticket, blood: '#f0e6b0', init: e => { e.noSep = true; } },
  inspector: { spr: 'inspector', hp: 30, spd: 40, dmg: 10, r: 5, xp: 3, ai: AI.inspector, blood: '#22305a',
    init: e => { e.guard = (en, o) => { if (o.kx === undefined) return 1; const fx = Math.cos(en.face), fy = Math.sin(en.face); if (fx * o.kx + fy * o.ky < -0.35) { fxParticles(en.x + fx * 6, en.y + fy * 6, '#f2c230', 2, 40, 0.2); return 0.25; } return 1; }; } },
  suitcase: { spr: 'suitcase', hp: 26, spd: 40, dmg: 12, r: 5, xp: 3, ai: AI.suitcase, blood: '#7a5530' },
  driver: { spr: 'driver', hp: 640, spd: 36, dmg: 16, r: 9, xp: 30, elite: true, ai: AI.driver, blood: '#1d2a4a', name: 'Il Macchinista Fantasma' },
  capo: { hp: 6200, spd: 44, dmg: 26, r: 14, xp: 0, boss: true, name: 'Il Capostazione dell\'Ultima Corsa' },
  // Stage 3
  chorister: { spr: 'chorister', hp: 24, spd: 34, dmg: 9, r: 5, xp: 2, ai: AI.chorister, blood: '#4a3b5c' },
  ringer: { spr: 'ringer', hp: 22, spd: 46, dmg: 10, r: 5, xp: 2, ai: AI.ringer, blood: '#6b4e2e' },
  candle: { spr: 'candle', hp: 10, spd: 56, dmg: 8, r: 4, xp: 1, ai: AI.candle, blood: '#efe6d2' },
  clapper: { spr: 'clapper', hp: 200, spd: 0, dmg: 14, r: 5, xp: 4, ai: AI.clapper, kbRes: 1, blood: '#8c6a2f', init: e => { e.noSep = true; e.anchored = true; } },
  abbess: { spr: 'abbess', hp: 700, spd: 34, dmg: 16, r: 9, xp: 30, elite: true, ai: AI.abbess, blood: '#8c6a2f', name: 'La Badessa del Rintocco' },
  bronzo: { hp: 7000, spd: 0, dmg: 20, r: 26, xp: 0, boss: true, name: 'Il Grande Bronzo Afono' },
  // Minuto 10
  cont: { hp: 1e9, spd: 0, dmg: 999, r: 14, xp: 0, boss: true, ai: AI.cont, name: 'IL CONTINUE', init: e => { e.immune = true; e.noSep = true; } },
};

// --- Boss 1: Madre Spola ----------------------------------------------------------------
ETYPES.spola.init = e => {
  const p = G.p;
  G.arena = { x: p.x, y: clamp(p.y, -180, 180), r: 260, base: 260 };
  e.x = G.arena.x; e.y = G.arena.y - 120;
  e.anchors = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const an = spawnEnemy('anchor', G.arena.x + Math.cos(a) * 200, G.arena.y + Math.sin(a) * 200);
    an.hp = an.maxHp = 380 * (0.6 + G.level * 0.04);
    e.anchors.push(an);
  }
  e.cd = 2; e.unr = 12;
  for (const o of G.enemies) if (!o.boss && !o.anchored && d2(o.x, o.y, G.arena.x, G.arena.y) > 250 * 250) { o.dead = true; o.noXp = true; }
};
ETYPES.spola.ai = (e, dt) => {
  const p = G.p;
  AI.chase(e);
  const alive = e.anchors.filter(a => !a.dead).length;
  if (alive) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.0015 * alive * dt);
  const phase = Math.min(3, Math.floor((1 - e.hp / e.maxHp) * 4));
  G.arena.r = alive ? G.arena.base - phase * 32 : G.arena.base;
  e.cd -= dt;
  if (e.cd <= 0) {
    e.cd = 2.8 - phase * 0.3;
    const n = 12 + phase * 2, off = rnd(TAU);
    for (let i = 0; i < n; i++) eShoot(e.x, e.y, off + i / n * TAU, 85 + phase * 10, 12, { col: '#e2b04a', kind: 'pin' });
  }
  e.unr -= dt;
  if (e.unr <= 0) {
    e.unr = 18;
    const cand = G.weapons.filter(w => !w.disabled).sort((a, b) => b.order - a.order);
    if (cand.length) {
      const w = cand[0];
      w.disabled = true;
      G.unravel = { w, t: 15 };
      dropPickup('unravel', e.x, e.y, { vx: rnd(-60, 60), vy: rnd(-60, 60), w });
      banner('SFILACCIAMENTO', 'Madre Spola ha preso «' + weaponName(w) + '»: recupera il gomitolo!', 2.4, '#e2b04a');
    }
  }
};
ETYPES.spola.draw = (c, e, x, y) => {
  const t = G.t;
  c.strokeStyle = 'rgba(226,176,74,.7)'; c.lineWidth = 1;
  for (const a of e.anchors) if (!a.dead) { c.beginPath(); c.moveTo(x, y); c.lineTo(Math.round(a.x - camX), Math.round(a.y - camY)); c.stroke(); }
  c.strokeStyle = '#3a2418'; c.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + Math.sin(t * 3 + i) * 0.15, l = 26 + Math.sin(t * 4 + i) * 3;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l * 0.6, y + Math.sin(a) * l * 0.6 - 6); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  c.fillStyle = INK; c.beginPath(); c.ellipse(x, y, 17, 14, 0, 0, TAU); c.fill();
  c.fillStyle = '#6b4a2a'; c.beginPath(); c.ellipse(x, y, 16, 13, 0, 0, TAU); c.fill();
  c.fillStyle = '#8c6a2f'; c.fillRect(x - 12, y - 2, 24, 3);
  c.fillStyle = INK; c.beginPath(); c.arc(x, y - 12, 9, 0, TAU); c.fill();
  c.fillStyle = e.flash > 0 ? '#ffffff' : '#efe6d8'; c.beginPath(); c.arc(x, y - 12, 8, 0, TAU); c.fill();
  c.fillStyle = INK; c.fillRect(x - 4, y - 14, 2, 2); c.fillRect(x + 2, y - 14, 2, 2);
  c.strokeStyle = '#a89a88'; c.beginPath(); c.moveTo(x + 1, y - 19); c.lineTo(x - 1, y - 10); c.lineTo(x + 2, y - 6); c.stroke();
};

// --- Boss 2: il Capostazione -----------------------------------------------------------------
ETYPES.capo.init = e => { e.takeMul = 0.1; e.cd = 3; e.whistle = 8; e.stunT = 0; };
ETYPES.capo.ai = (e, dt) => {
  const p = G.p;
  if (e.stunT > 0) { e.stunT -= dt; e.vx = e.vy = 0; e.takeMul = 1; return; }
  e.takeMul = 0.1;
  e.whistle -= dt;
  if (e.whistle <= 0) {
    e.whistle = 10;
    for (let i = 0; i < 6; i++) { const a = rnd(TAU); spawnEnemy('commuter', e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40); }
    fxText(e.x, e.y - 26, 'FIIIIII!', '#f2efe6', 0.8); sfx('ui');
  }
  if (e.tele > 0) {
    e.tele -= dt; e.vx = e.vy = 0;
    if (e.tele <= 0) e.charge = 0.6;
    return;
  }
  if (e.charge > 0) { e.charge -= dt; e.vx = e.cdx * 430; e.vy = e.cdy * 430; return; }
  AI.chase(e);
  e.cd -= dt;
  if (e.cd <= 0) { e.cd = 3.4; e.tele = 0.75; [e.cdx, e.cdy] = norm(p.x - e.x, p.y - e.y); }
};
ETYPES.capo.draw = (c, e, x, y) => {
  if (e.tele > 0) { c.strokeStyle = 'rgba(255,60,60,.6)'; c.setLineDash([4, 3]); c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + e.cdx * 260, y + e.cdy * 260); c.stroke(); c.setLineDash([]); }
  const fl = e.flash > 0;
  c.fillStyle = INK; c.fillRect(x - 9, y - 18, 18, 34);
  c.fillStyle = fl ? '#fff' : '#22305a'; c.fillRect(x - 8, y - 17, 16, 32);
  c.fillStyle = '#d9a83a'; c.fillRect(x - 8, y - 6, 16, 2); c.fillRect(x - 1, y - 4, 2, 10);
  c.fillStyle = '#14101a'; c.fillRect(x - 6, y + 15, 4, 4); c.fillRect(x + 2, y + 15, 4, 4);
  c.fillStyle = INK; c.beginPath(); c.arc(x, y - 26, 10, 0, TAU); c.fill();
  c.fillStyle = fl ? '#fff' : '#efe6d2'; c.beginPath(); c.arc(x, y - 26, 9, 0, TAU); c.fill();
  c.strokeStyle = '#14101a'; c.lineWidth = 1;
  const a1 = G.t * 2, a2 = G.t * 0.3;
  c.beginPath(); c.moveTo(x, y - 26); c.lineTo(x + Math.cos(a1) * 7, y - 26 + Math.sin(a1) * 7); c.stroke();
  c.beginPath(); c.moveTo(x, y - 26); c.lineTo(x + Math.cos(a2) * 5, y - 26 + Math.sin(a2) * 5); c.stroke();
  c.fillStyle = '#22305a'; c.fillRect(x - 9, y - 38, 18, 4); c.fillStyle = '#d9a83a'; c.fillRect(x - 10, y - 35, 20, 2);
  if (e.stunT > 0) { c.fillStyle = '#ffd23f'; for (let i = 0; i < 3; i++) { const a = G.t * 5 + i * 2.1; c.fillRect(x + Math.cos(a) * 12, y - 42 + Math.sin(a) * 3, 2, 2); } }
};

// --- Boss 3: il Grande Bronzo ------------------------------------------------------------------
ETYPES.bronzo.init = e => { e.x = 0; e.y = 0; e.takeMul = 0.5; e.res = 0; e.state = 'idle'; e.cd = 2; e.noSep = true; e.kbRes = 1;
  e.onDamaged = (en, d) => { if (en.state === 'idle') { en.res += d / (en.maxHp * 0.13); if (en.res >= 1) { en.state = 'lift'; en.st = 3.2; en.immune = true; banner('ENTRA SOTTO LA CAMPANA!', 'Il Bronzo sta per rintoccare', 2.6, '#d9a83a'); } } };
};
ETYPES.bronzo.ai = (e, dt) => {
  const p = G.p;
  e.vx = e.vy = 0;
  if (e.state === 'idle') {
    e.cd -= dt;
    if (e.cd <= 0) { e.cd = 2.4; const n = 10, off = rnd(TAU); for (let i = 0; i < n; i++) eShoot(e.x, e.y, off + i / n * TAU, 70, 12, { col: '#d9a83a', kind: 'note', life: 6 }); sfx('bell'); }
  } else if (e.state === 'lift') {
    e.st -= dt;
    if (e.st <= 0) {
      e.immune = false; sfx('bell'); shake(8);
      fxRing(0, 0, 30, 700, '#d9a83a', 0.8, 4);
      if (d2(p.x, p.y, 0, 0) < 46 * 46) {
        e.state = 'inside'; e.st = 8; e.takeMul = 3; G.insideBell = true;
        banner('DENTRO IL BRONZO', 'Il cuore di cera è esposto: colpiscilo!', 2, '#ffd23f');
      } else {
        e.state = 'idle'; e.res = 0; e.takeMul = 0.5;
        p.invuln = 0; hurtPlayer(Math.max(40, p.maxHp * 0.5), e);
      }
      for (const o of G.enemies) if (!o.boss && d2(o.x, o.y, 0, 0) > 50 * 50) { o.dead = true; o.noXp = true; }
    }
  } else if (e.state === 'inside') {
    e.st -= dt;
    if (e.st <= 0) { e.state = 'idle'; e.res = 0; e.takeMul = 0.5; G.insideBell = false; banner('LA CAMPANA SI SOLLEVA', '', 1.2, '#d9a83a'); }
  }
};
ETYPES.bronzo.draw = (c, e, x, y) => {
  const lift = e.state === 'lift' ? Math.min(1, (3.2 - e.st) / 0.6) * 22 : 0;
  if (e.state === 'lift') { c.strokeStyle = 'rgba(255,210,63,.8)'; c.setLineDash([3, 3]); c.beginPath(); c.arc(x, y, 46, 0, TAU); c.stroke(); c.setLineDash([]); }
  if (e.state === 'inside') {
    c.fillStyle = INK; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill();
    c.fillStyle = e.flash > 0 ? '#fff' : '#ffd8a0'; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill();
    c.fillStyle = '#ff8a2a'; c.fillRect(x - 1, y - 12, 2, 4);
    return;
  }
  const by = y - lift;
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, y + 10, 30, 8, 0, 0, TAU); c.fill();
  c.fillStyle = INK;
  c.beginPath(); c.moveTo(x - 12, by - 30); c.quadraticCurveTo(x - 16, by - 4, x - 30, by + 12); c.lineTo(x + 30, by + 12); c.quadraticCurveTo(x + 16, by - 4, x + 12, by - 30); c.closePath(); c.fill();
  c.fillStyle = e.flash > 0 ? '#ffe0a0' : '#8c6a2f';
  c.beginPath(); c.moveTo(x - 11, by - 29); c.quadraticCurveTo(x - 15, by - 4, x - 28, by + 11); c.lineTo(x + 28, by + 11); c.quadraticCurveTo(x + 15, by - 4, x + 11, by - 29); c.closePath(); c.fill();
  c.fillStyle = '#b08a3f'; c.fillRect(x - 24, by + 4, 48, 3);
  c.fillStyle = '#5f8a6a'; c.fillRect(x - 6, by - 20, 3, 18); c.fillRect(x + 6, by - 14, 2, 12);
  c.fillStyle = '#6b4a2a'; c.fillRect(x - 4, by - 36, 8, 7);
};

// =============================================================================
// STAGE
// =============================================================================
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; }

function buildTile(base, dark, light, kind) {
  const c = makeCanvas(32, 32), x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 40; i++) { x.fillStyle = Math.random() < 0.5 ? dark : light; x.fillRect(Math.floor(rnd(32)), Math.floor(rnd(32)), 1, 1); }
  if (kind === 'stone') { x.fillStyle = dark; x.fillRect(0, 15, 32, 1); x.fillRect(15, 0, 1, 15); x.fillRect(7, 16, 1, 16); x.fillRect(23, 16, 1, 16); }
  if (kind === 'tile') { x.fillStyle = dark; for (let i = 0; i < 32; i += 8) { x.fillRect(i, 0, 1, 32); x.fillRect(0, i, 32, 1); } }
  if (kind === 'snow') { x.fillStyle = light; for (let i = 0; i < 6; i++) x.fillRect(Math.floor(rnd(30)), Math.floor(rnd(30)), 2, 1); }
  if (kind === 'grass') { x.fillStyle = dark; x.fillRect(0, 26, 32, 6); x.fillStyle = light; for (let i = 0; i < 10; i++) x.fillRect(Math.floor(rnd(32)), Math.floor(rnd(24)), 1, 2); }
  if (kind === 'ceramic') { x.fillStyle = dark; for (let i = 0; i < 32; i += 16) { x.fillRect(i, 0, 1, 32); x.fillRect(0, i, 32, 1); } }
  return c;
}
let TILES = null;
function initTiles() {
  TILES = {
    hk: buildTile('#24304a', '#1b2438', '#34445f', 'stone'),
    hades: buildTile('#4a1f24', '#38161a', '#5e2a2e', 'tile'),
    celeste: buildTile('#9aa6bf', '#8290aa', '#c4cee0', 'snow'),
    terra: buildTile('#3a5226', '#2e421e', '#4e6a32', 'grass'),
    blas: buildTile('#5a4428', '#46341e', '#6e5534', 'stone'),
    station: buildTile('#b9c2c0', '#a3adab', '#cfd6d4', 'ceramic'),
  };
}

function seamDash(c, x1, y1, x2, y2, col) {
  c.strokeStyle = col; c.lineWidth = 1; c.setLineDash([2, 2]);
  c.beginPath(); c.moveTo(x1 + 0.5, y1 + 0.5); c.lineTo(x2 + 0.5, y2 + 0.5); c.stroke(); c.setLineDash([]);
}

const STAGES = {
  // ---------------------------------------------------------------------------- 1
  telaio: {
    id: 'telaio', name: 'Il Telaio dei Mondi', tagline: '«Qui la Cucitrice tesse. Ogni filo è una strada.»',
    desc: 'Una banda di tessuto infinita fatta di toppe di mondi diversi. Navette grandi come cattedrali attraversano le corsie.',
    hazards: ['Navette: corsie che si illuminano, poi vengono spazzate', 'Strappi nel tessuto: ci cadono i nemici'],
    elite: 'darner', boss: 'spola', bossSub: 'Distruggi i Rocchetti-Ancora: finché esistono, si rigenera',
    bg: '#120c16',
    table(t) { return t < 60 ? [['moth', 7], ['doll', 3]] : t < 150 ? [['moth', 4], ['doll', 4], ['pin', 2]] : [['moth', 3], ['doll', 4], ['pin', 3]]; },
    init() { G.lanes = [-240, -80, 80, 240]; G.shuttle = null; G.shuttleT = 14; G.holes = []; G.holeT = 16; },
    clampPos(x, y) { return [x, clamp(y, -320, 320)]; },
    spawnPos(a) { const p = G.p; let x = p.x + Math.cos(a) * 380, y = p.y + Math.sin(a) * 260; y = clamp(y, -315, 315); if (G.arena) { const [nx, ny] = norm(x - G.arena.x, y - G.arena.y); x = G.arena.x + nx * (G.arena.r - 10); y = G.arena.y + ny * (G.arena.r - 10); } return [x, y]; },
    constrainPlayer(p) { p.y = clamp(p.y, -322, 322); arenaClamp(p, true); },
    constrainEnemy(e) { e.y = clamp(e.y, -326, 326); },
    update(dt) {
      const p = G.p;
      if (!G.bossE) {
        G.shuttleT -= dt;
        if (G.shuttleT <= 0 && !G.shuttle) {
          G.shuttleT = 11;
          let lane = pick(G.lanes);
          if (Math.random() < 0.6) lane = G.lanes.reduce((a, b) => Math.abs(b - p.y) < Math.abs(a - p.y) ? b : a);
          G.shuttle = { y: lane, warn: 2, x: null, dir: Math.random() < 0.5 ? 1 : -1, hitP: false };
        }
      }
      const s = G.shuttle;
      if (s) {
        if (s.warn > 0) { s.warn -= dt; if (s.warn <= 0) { s.x = s.dir > 0 ? camX - 120 : camX + W + 120; sfx('train'); } }
        else {
          s.x += s.dir * 1100 * dt;
          GRID.query(s.x, s.y, 40, e => { if (Math.abs(e.y - s.y) < 22 && !e.anchored) hurtEnemy(e, e.boss ? 200 : 999, { silent: true }); });
          if (!s.hitP && Math.abs(p.y - s.y) < 22 && Math.abs(p.x - s.x) < 44 && !(p.flyT > 0)) { s.hitP = true; hurtPlayer(26, null); }
          if ((s.dir > 0 && s.x > camX + W + 160) || (s.dir < 0 && s.x < camX - 160)) G.shuttle = null;
        }
      }
      G.holeT -= dt;
      if (G.holeT <= 0 && !G.bossE) {
        G.holeT = 16;
        const a = rnd(TAU);
        G.holes.push({ x: p.x + Math.cos(a) * rnd(90, 200), y: clamp(p.y + Math.sin(a) * rnd(60, 140), -300, 300), r: 0, life: 9 });
      }
      for (const h of G.holes) {
        h.life -= dt; h.r = Math.min(20, h.r + dt * 40); if (h.life < 1) h.r = 20 * h.life;
        GRID.query(h.x, h.y, h.r - 3, e => { if (!e.elite && !e.boss && !e.anchored) { e.noXp = true; killEnemy(e); fxParticles(h.x, h.y, '#2a1838', 3, 20, 0.3); } });
        if (h.r > 8 && d2(p.x, p.y, h.x, h.y) < (h.r - 3) ** 2 && !(p.flyT > 0)) {
          const a = rnd(TAU); p.x += Math.cos(a) * 90; p.y = clamp(p.y + Math.sin(a) * 90, -300, 300);
          p.invuln = 0; hurtPlayer(6, null);
          banner('RICUCITO ALTROVE', 'Sei caduto in uno Strappo', 1.2, '#c94a6a');
        }
      }
      G.holes = G.holes.filter(h => h.life > 0);
    },
    drawFloor(c) {
      const x0 = Math.floor(camX / 32) - 1, y0 = Math.floor(camY / 32) - 1;
      const kinds = ['hk', 'hades', 'celeste', 'terra', 'blas'];
      for (let tx = x0; tx < x0 + W / 32 + 3; tx++) for (let ty = y0; ty < y0 + H / 32 + 3; ty++) {
        const px = tx * 32 - camX, py = ty * 32 - camY;
        if (ty * 32 > 330 || ty * 32 + 32 < -330) { c.fillStyle = '#120c16'; c.fillRect(px, py, 32, 32); continue; }
        const pk = (hash2(Math.floor(tx / 3), Math.floor(ty / 3))) % kinds.length;
        c.drawImage(TILES[kinds[pk]], px, py);
        const right = (hash2(Math.floor((tx + 1) / 3), Math.floor(ty / 3))) % kinds.length;
        const down = (hash2(Math.floor(tx / 3), Math.floor((ty + 1) / 3))) % kinds.length;
        if (right !== pk && (tx + 1) % 3 === 0) seamDash(c, px + 31, py, px + 31, py + 32, '#e2b04a');
        if (down !== pk && (ty + 1) % 3 === 0) seamDash(c, px, py + 31, px + 32, py + 31, '#e2b04a');
      }
      for (const edge of [-330, 330]) {
        const y = Math.round(edge - camY);
        c.fillStyle = '#8e2b3a'; c.fillRect(0, edge < 0 ? y - 10 : y, W, 10);
        c.fillStyle = '#e2b04a'; for (let i = -((camX | 0) % 6); i < W; i += 6) c.fillRect(i, edge < 0 ? y - 1 : y, 3, 1);
        c.fillStyle = '#5a1e24'; for (let i = -((camX | 0) % 4); i < W; i += 4) c.fillRect(i, edge < 0 ? y + 1 : y - 3, 1, 2);
      }
      for (const lane of G.lanes) {
        const y = Math.round(lane - camY);
        c.fillStyle = 'rgba(226,176,74,.10)'; c.fillRect(0, y - 20, W, 40);
        seamDash(c, 0, y - 20, W, y - 20, 'rgba(226,176,74,.35)'); seamDash(c, 0, y + 20, W, y + 20, 'rgba(226,176,74,.35)');
      }
      for (const h of G.holes) {
        const x = Math.round(h.x - camX), y = Math.round(h.y - camY);
        c.fillStyle = '#05030a'; c.beginPath(); c.ellipse(x, y, h.r, h.r * 0.7, 0, 0, TAU); c.fill();
        c.strokeStyle = '#e2b04a'; c.setLineDash([2, 3]); c.beginPath(); c.ellipse(x, y, h.r + 2, h.r * 0.7 + 2, 0, 0, TAU); c.stroke(); c.setLineDash([]);
      }
      const s = G.shuttle;
      if (s && s.warn > 0) {
        const y = Math.round(s.y - camY);
        c.fillStyle = `rgba(255,255,255,${0.25 + 0.25 * Math.sin(G.t * 20)})`; c.fillRect(0, y - 20, W, 40);
        c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); c.stroke();
      }
    },
    drawOver(c) {
      const s = G.shuttle;
      if (s && s.x !== null && s.warn <= 0) {
        const x = Math.round(s.x - camX), y = Math.round(s.y - camY);
        c.fillStyle = INK; c.beginPath(); c.ellipse(x, y, 62, 18, 0, 0, TAU); c.fill();
        c.fillStyle = '#8c6a2f'; c.beginPath(); c.ellipse(x, y, 60, 16, 0, 0, TAU); c.fill();
        c.fillStyle = '#b08a3f'; c.fillRect(x - 50, y - 4, 100, 3);
        c.fillStyle = '#c94a6a'; c.fillRect(x - 14, y - 10, 28, 20);
        c.fillStyle = '#f2a0b8'; for (let i = -12; i < 14; i += 4) c.fillRect(x + i, y - 10, 1, 20);
      }
      if (G.arena) drawArena(c);
    },
    hud(c, x, y) {
      const s = G.shuttle;
      if (s && s.warn > 0) { hudPanel(c, x, y, 'NAVETTA IN ARRIVO', 'Corsia ' + (G.lanes.indexOf(s.y) + 1) + ' · ' + s.warn.toFixed(1) + 's', '#ffffff'); return true; }
      if (G.unravel) { hudPanel(c, x, y, 'SFILACCIATO', weaponName(G.unravel.w) + ' · ' + G.unravel.t.toFixed(0) + 's', '#e2b04a'); return true; }
      if (!G.bossE) { hudPanel(c, x, y, 'PROSSIMA NAVETTA', G.shuttleT.toFixed(0) + 's', '#e2b04a'); return true; }
      return false;
    },
    onPickup(k) {
      if (k.kind !== 'unravel') return false;
      if (G.unravel) { G.unravel.w.disabled = false; G.unravel = null; banner('RIAVVOLTO', 'L\'arma è di nuovo tua', 1.2, '#e2b04a'); }
      return true;
    },
  },

  // ---------------------------------------------------------------------------- 2
  capolinea: {
    id: 'capolinea', name: 'Capolinea Eterno', tagline: '«Prossima fermata: la stessa. Non c\'è un fuori.»',
    desc: 'Una stazione della metropolitana che si ripete all\'infinito. I treni passano secondo un orario che puoi leggere sul tabellone.',
    hazards: ['Treni: il tabellone mostra binario e secondi all\'arrivo', 'Ora di punta: ondate di Pendolari'],
    elite: 'driver', boss: 'capo', bossSub: 'Subisce poco danno: attiralo sui binari quando arriva il treno',
    bg: '#1a1f24',
    table(t) { return t < 60 ? [['commuter', 7], ['ticket', 3]] : t < 150 ? [['commuter', 5], ['ticket', 2], ['inspector', 2], ['suitcase', 1]] : [['commuter', 4], ['ticket', 2], ['inspector', 3], ['suitcase', 1]]; },
    init() { G.trainT = 22; G.trains = []; G.rushT = 80; G.trainPlan = null; },
    clampPos(x, y) { return [x, y]; },
    spawnPos(a) { const p = G.p; return [p.x + Math.cos(a) * 380, p.y + Math.sin(a) * 260]; },
    constrainPlayer() {},
    trackNear(y, off = 0) { return (Math.round(y / 240) + off) * 240; },
    trackName(ty) { return ((((ty / 240) % 9) + 9) % 9) + 1; },
    update(dt) {
      const p = G.p, st = STAGES.capolinea;
      G.trainT -= dt;
      if (!G.trainPlan && G.trainT <= 3.5) {
        const offs = Math.random() < 0.65 ? 0 : pick([-1, 1]);
        const tracks = [st.trackNear(p.y, offs)];
        if (G.bossE && G.bossE.hp < G.bossE.maxHp * 0.5) tracks.push(st.trackNear(p.y, offs === 0 ? pick([-1, 1]) : 0));
        G.trainPlan = { tracks, dir: Math.random() < 0.5 ? 1 : -1 };
      }
      if (G.trainT <= 0 && G.trainPlan) {
        for (const ty of G.trainPlan.tracks) G.trains.push({ y: ty, x: G.trainPlan.dir > 0 ? camX - 600 : camX + W + 600, dir: G.trainPlan.dir, hitP: false, hitB: false });
        G.trainPlan = null;
        G.trainT = G.bossE ? 8 : 13;
        sfx('train');
      }
      for (const tr of G.trains) {
        tr.x += tr.dir * 900 * dt;
        const x0 = tr.dir > 0 ? tr.x - 560 : tr.x, x1 = tr.dir > 0 ? tr.x : tr.x + 560;
        GRID.query((x0 + x1) / 2, tr.y, 290, e => {
          if (Math.abs(e.y - tr.y) < 18 && e.x > x0 && e.x < x1) {
            if (e.type === 'capo') { if (!tr.hitB) { tr.hitB = true; e.hp -= e.maxHp * 0.22; e.flash = 0.3; e.stunT = 5; G.dmgDealt += e.maxHp * 0.22; fxText(e.x, e.y - 40, 'DERAGLIATO!', '#ffd23f', 1.2, true); shake(8); sfx('boom'); if (e.hp <= 0) killEnemy(e); } }
            else if (!e.boss) hurtEnemy(e, 999, { silent: true });
          }
        });
        if (!tr.hitP && Math.abs(p.y - tr.y) < 16 && p.x > x0 && p.x < x1 && !(p.flyT > 0)) { tr.hitP = true; hurtPlayer(30, null); }
      }
      G.trains = G.trains.filter(tr => (tr.dir > 0 ? tr.x - 600 < camX + W + 100 : tr.x + 600 > camX - 100));
      G.rushT -= dt;
      if (G.rushT <= 0 && !G.bossE) {
        G.rushT = 80;
        banner('ORA DI PUNTA', 'Una marea di Pendolari sta arrivando', 1.8, '#f2c230');
        for (let i = 0; i < 28; i++) { const side = i % 2 ? 1 : -1; spawnEnemy('commuter', p.x + side * rnd(330, 400), p.y + rnd(-150, 150)); }
      }
    },
    drawFloor(c) {
      const x0 = Math.floor(camX / 32) - 1, y0 = Math.floor(camY / 32) - 1;
      for (let tx = x0; tx < x0 + W / 32 + 3; tx++) for (let ty = y0; ty < y0 + H / 32 + 3; ty++) c.drawImage(TILES.station, tx * 32 - camX, ty * 32 - camY);
      const k0 = Math.floor((camY - 30) / 240), k1 = Math.ceil((camY + H + 30) / 240);
      for (let k = k0; k <= k1; k++) {
        const y = Math.round(k * 240 - camY);
        c.fillStyle = '#3a3a3a'; c.fillRect(0, y - 18, W, 36);
        c.fillStyle = '#2a2a2a'; for (let i = -((camX | 0) % 12); i < W; i += 12) c.fillRect(i, y - 14, 5, 28);
        c.fillStyle = '#9aa4b8'; c.fillRect(0, y - 8, W, 2); c.fillRect(0, y + 6, W, 2);
        c.fillStyle = '#f2c230'; for (let i = -((camX | 0) % 8); i < W; i += 8) { c.fillRect(i, y - 24, 5, 3); c.fillRect(i, y + 21, 5, 3); }
        const plan = G.trainPlan;
        if (plan && plan.tracks.includes(k * 240) && G.trainT < 3.2 && Math.sin(G.t * 18) > 0) {
          c.fillStyle = 'rgba(255,40,40,.35)'; c.fillRect(0, y - 18, W, 36);
          c.fillStyle = '#ff2a2a'; for (let i = -((camX | 0) % 40); i < W; i += 40) c.fillRect(i, y - 22, 3, 3);
        }
        const by = y + 120;
        const sx0 = Math.floor(camX / 420) - 1;
        for (let s = sx0; s < sx0 + 4; s++) {
          const sx = Math.round(s * 420 + 60 - camX);
          const dest = ['HALLOWNEST — RITARDO 10.000 ANNI', 'INFERNO, CERCHIO 7 — SOPPRESSO', 'MONTE CELESTE — BINARIO 2', 'CVSTODIA — PER GRAZIA RICEVUTA', 'IL SEMINTERRATO — SOLO ANDATA', 'ISOLA DEL PRIGIONIERO — CAPOLINEA'][(hash2(s, k) % 6)];
          c.fillStyle = INK; c.fillRect(sx - 1, by - 9, 132, 13);
          c.fillStyle = '#14202a'; c.fillRect(sx, by - 8, 130, 11);
          txt(c, dest, sx + 3, by - 6, '#ffb030', 8);
        }
      }
    },
    drawOver(c) {
      for (const tr of G.trains) {
        const y = Math.round(tr.y - camY);
        const x0 = Math.round((tr.dir > 0 ? tr.x - 560 : tr.x) - camX);
        c.fillStyle = INK; c.fillRect(x0 - 1, y - 17, 562, 34);
        for (let i = 0; i < 4; i++) {
          const cx = x0 + i * 140;
          c.fillStyle = '#c9ced8'; c.fillRect(cx, y - 16, 136, 32);
          c.fillStyle = '#c0392b'; c.fillRect(cx, y + 4, 136, 4);
          c.fillStyle = '#2a3a4a'; for (let j = 8; j < 130; j += 18) c.fillRect(cx + j, y - 12, 12, 10);
        }
        c.fillStyle = '#ffe680'; c.fillRect(tr.dir > 0 ? x0 + 556 : x0, y - 6, 4, 12);
      }
    },
    hud(c, x, y) {
      const st = STAGES.capolinea;
      const plan = G.trainPlan;
      const tracks = plan ? plan.tracks : [st.trackNear(G.p.y)];
      const label = plan ? 'BINARIO ' + tracks.map(t => st.trackName(t)).join(' + ') : 'TABELLONE ORARI';
      hudPanel(c, x, y, label, (plan ? 'Treno tra ' : 'Prossimo treno tra ') + Math.max(0, G.trainT).toFixed(1) + 's', plan ? '#ff5a4a' : '#ffb030');
      return true;
    },
  },

  // ---------------------------------------------------------------------------- 3
  pozzo: {
    id: 'pozzo', name: 'Il Pozzo delle Campane Capovolte', tagline: '«Ogni rintocco ti porta più giù.»',
    desc: 'Terrazze ad anello che scendono a spirale in un abisso. A ogni Rintocco l\'arena si stringe; le onde di risonanza si evitano solo sulle Rune del Silenzio.',
    hazards: ['Rintocco: l\'anello crolla e l\'arena si restringe', 'Onde di risonanza: stai su una Runa del Silenzio', 'Coristi Muti: nelle zone di silenzio le tue armi tacciono'],
    elite: 'abbess', boss: 'bronzo', bossSub: 'Colpirlo carica la Risonanza: quando si alza, entra sotto la campana',
    bg: '#07060a',
    table(t) { return t < 60 ? [['candle', 5], ['chorister', 3], ['ringer', 2]] : t < 150 ? [['candle', 4], ['chorister', 3], ['ringer', 3], ['clapper', 1]] : [['candle', 4], ['chorister', 3], ['ringer', 3], ['clapper', 1.5]]; },
    init() { G.ringR = [620, 500, 390, 300]; G.depth = 0; G.tollT = 100; G.waveT = 30; G.wave = null; G.runes = []; },
    radius() { return G.ringR[Math.min(G.depth, 3)]; },
    clampPos(x, y) { const R = STAGES.pozzo.radius() - 16; const l = Math.hypot(x, y); return l > R ? [x / l * R, y / l * R] : [x, y]; },
    spawnPos(a) { const p = G.p; return STAGES.pozzo.clampPos(p.x + Math.cos(a) * 380, p.y + Math.sin(a) * 260); },
    constrainPlayer(p) {
      const R = G.insideBell ? 42 : STAGES.pozzo.radius() - 8;
      const l = Math.hypot(p.x, p.y);
      if (l > R) { p.x = p.x / l * R; p.y = p.y / l * R; }
    },
    constrainEnemy(e) { if (e.boss) return; const R = STAGES.pozzo.radius() - 4; const l = Math.hypot(e.x, e.y); if (l > R) { e.x = e.x / l * R; e.y = e.y / l * R; } },
    update(dt) {
      const p = G.p, st = STAGES.pozzo;
      if (G.depth < 3 && !G.bossE) {
        G.tollT -= dt;
        if (G.tollT <= 0) {
          G.tollT = 100; G.depth++;
          const R = st.radius();
          for (const e of G.enemies) if (!e.boss && Math.hypot(e.x, e.y) > R) { e.dead = true; e.noXp = true; }
          banner('RINTOCCO', 'L\'anello crolla. Scendi più in basso.', 2, '#d9a83a');
          fxRing(0, 0, R, R + 60, '#d9a83a', 0.8, 4); shake(6); sfx('bell');
        }
      }
      G.waveT -= dt;
      if (G.waveT <= 3 && !G.runes.length && !G.wave) {
        const R = st.radius();
        for (let i = 0; i < 6; i++) { const a = rnd(TAU), r = rnd(40, R * 0.8); G.runes.push({ x: p.x * 0.5 + Math.cos(a) * r * 0.5, y: p.y * 0.5 + Math.sin(a) * r * 0.5 }); }
        G.runes.push({ x: p.x + rnd(-70, 70), y: p.y + rnd(-70, 70) });
        G.runes = G.runes.map(r => { const [x, y] = st.clampPos(r.x, r.y); return { x, y }; });
      }
      if (G.waveT <= 0 && !G.wave) { G.wave = { r: 0, hitP: false }; sfx('bell'); }
      if (G.wave) {
        const wv = G.wave, prev = wv.r;
        wv.r += 210 * dt;
        const pd = Math.hypot(p.x, p.y);
        if (!wv.hitP && pd >= prev && pd < wv.r) {
          wv.hitP = true;
          const safe = G.runes.some(r => d2(r.x, r.y, p.x, p.y) < 16 * 16) || p.flyT > 0 || G.insideBell;
          if (!safe) { p.invuln = 0; hurtPlayer(Math.max(16, p.maxHp * 0.2), null); }
          else fxText(p.x, p.y - 18, 'SILENZIO', '#bfe4ff', 0.8);
        }
        for (const e of G.enemies) { if (e.boss || e.dead) continue; const d = Math.hypot(e.x, e.y); if (d >= prev && d < wv.r) e.stun = 1; }
        if (wv.r > st.radius()) { G.wave = null; G.runes = []; G.waveT = 30; }
      }
    },
    drawFloor(c) {
      const R = STAGES.pozzo.radius();
      c.fillStyle = '#07060a'; c.fillRect(0, 0, W, H);
      const cx = -camX, cy = -camY;
      const dark = G.depth * 0.12;
      for (let r = 620; r > 0; r -= 40) {
        if (r > R + 40) continue;
        const band = Math.floor(r / 40) % 2;
        const base = band ? [74, 66, 58] : [60, 52, 46];
        const k = 1 - dark;
        c.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`;
        c.beginPath(); c.arc(cx, cy, Math.min(r, R), 0, TAU); c.fill();
      }
      c.strokeStyle = 'rgba(140,106,47,.5)'; c.lineWidth = 1;
      for (let r = 80; r < R; r += 80) { c.setLineDash([2, 4]); c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); }
      c.setLineDash([]);
      c.strokeStyle = '#8c6a2f'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * TAU, x = cx + Math.cos(a) * (R - 10), y = cy + Math.sin(a) * (R - 10);
        if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
        c.fillStyle = '#efe6d2'; c.fillRect(x - 1, y - 3, 2, 4);
        c.fillStyle = Math.sin(G.t * 9 + i) > 0 ? '#ffd23f' : '#ff8a2a'; c.fillRect(x - 1, y - 5, 2, 2);
      }
      for (const z of G.runes) {
        const x = Math.round(z.x - camX), y = Math.round(z.y - camY);
        c.fillStyle = `rgba(191,228,255,${0.25 + 0.15 * Math.sin(G.t * 6)})`; c.beginPath(); c.arc(x, y, 16, 0, TAU); c.fill();
        c.strokeStyle = '#bfe4ff'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 16, 0, TAU); c.stroke();
        c.fillStyle = '#e8f4ff'; c.fillRect(x - 3, y, 7, 1); c.fillRect(x, y - 3, 1, 7);
      }
    },
    drawOver(c) {
      if (G.wave) { c.strokeStyle = 'rgba(217,168,58,.85)'; c.lineWidth = 4; c.beginPath(); c.arc(-camX, -camY, G.wave.r, 0, TAU); c.stroke(); c.lineWidth = 1; }
      if (G.insideBell) {
        c.fillStyle = 'rgba(5,3,10,.86)';
        c.beginPath(); c.rect(0, 0, W, H); c.arc(-camX, -camY, 48, 0, TAU, true); c.fill();
        c.strokeStyle = '#8c6a2f'; c.lineWidth = 3; c.beginPath(); c.arc(-camX, -camY, 48, 0, TAU); c.stroke(); c.lineWidth = 1;
      }
    },
    hud(c, x, y) {
      if (G.waveT < 4 || G.wave) { hudPanel(c, x, y, 'ONDA DI RISONANZA', G.wave ? 'IN CORSO' : 'Raggiungi una runa · ' + Math.max(0, G.waveT).toFixed(1) + 's', '#bfe4ff'); return true; }
      if (G.depth < 3 && !G.bossE) { hudPanel(c, x, y, 'RINTOCCO ' + (G.depth + 1) + '/3', 'L\'anello crolla tra ' + G.tollT.toFixed(0) + 's', '#d9a83a'); return true; }
      if (G.bossE && G.bossE.type === 'bronzo') { hudPanel(c, x, y, 'RISONANZA', Math.round((G.bossE.res || 0) * 100) + '%', '#d9a83a'); return true; }
      return false;
    },
  },
};

function arenaClamp(o, isPlayer) {
  const a = G.arena;
  if (!a) return;
  const dx = o.x - a.x, dy = o.y - a.y, l = Math.hypot(dx, dy);
  if (l > a.r - 6) {
    o.x = a.x + dx / l * (a.r - 6); o.y = a.y + dy / l * (a.r - 6);
    if (isPlayer) { G.ringHurt = (G.ringHurt || 0) - 1 / 60; if (G.ringHurt <= 0) { G.ringHurt = 1; hurtPlayer(8, null); } }
  }
}
function drawArena(c) {
  const a = G.arena;
  const x = Math.round(a.x - camX), y = Math.round(a.y - camY);
  c.fillStyle = 'rgba(10,6,14,.55)';
  c.beginPath(); c.rect(0, 0, W, H); c.arc(x, y, a.r, 0, TAU, true); c.fill();
  c.strokeStyle = '#e2b04a'; c.lineWidth = 2; c.setLineDash([4, 3]);
  c.beginPath(); c.arc(x, y, a.r, 0, TAU); c.stroke(); c.setLineDash([]); c.lineWidth = 1;
}

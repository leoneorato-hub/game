'use strict';
// =============================================================================
// MONDI (Alfa 2) — la Scala dei Finali: un mondo per ogni gioco indie, con i
// suoi nemici, il suo mini-boss e il suo boss finale. A metà run l'ambiente
// cambia (Infezione, Luna di Sangue…). Qui vivono anche gli eventi della run
// (zona da cucire, consegna, incontri, taglie) e le Reliquie combinabili.
// =============================================================================

// --- Comportamenti aggiuntivi -------------------------------------------------------
AI.shooter = (e, dt) => {
  const p = G.p, d = Math.hypot(p.x - e.x, p.y - e.y), want = e.keep || 110;
  const [nx, ny] = norm(p.x - e.x, p.y - e.y), k = d > want + 15 ? 1 : d < want - 15 ? -0.7 : 0;
  e.vx = (nx * k - ny * 0.4 * (e.side || 1)) * e.spd; e.vy = (ny * k + nx * 0.4 * (e.side || 1)) * e.spd;
  e.cd = (e.cd ?? rnd(1, 2.5)) - dt;
  if (e.cd <= 0 && d < 240) { e.cd = e.rate || 2.6; e.shot(e); }
};
AI.charger = (e, dt) => {
  const p = G.p;
  if (e.chg > 0) { e.chg -= dt; e.vx = e.dx * e.spd * 3.4; e.vy = e.dy * e.spd * 3.4; return; }
  if (e.wind > 0) { e.wind -= dt; e.vx = e.vy = 0; if (e.wind <= 0) { [e.dx, e.dy] = norm(p.x - e.x, p.y - e.y); e.chg = 0.65; } return; }
  AI.chase(e); e.vx *= 0.5; e.vy *= 0.5;
  e.cd = (e.cd ?? rnd(1, 3)) - dt;
  if (e.cd <= 0 && d2(e.x, e.y, p.x, p.y) < 150 * 150) { e.cd = 3; e.wind = 0.45; e.flash = 0.2; }
};
AI.hopper = (e, dt) => {
  e.hop = (e.hop ?? rnd(1)) - dt;
  if (e.hop <= 0) { e.hop = 1.1; [e.dx, e.dy] = norm(G.p.x - e.x, G.p.y - e.y); e.hopT = 0.35; }
  if (e.hopT > 0) { e.hopT -= dt; e.vx = e.dx * e.spd * 2.6; e.vy = e.dy * e.spd * 2.6; e.z = Math.sin((0.35 - e.hopT) / 0.35 * Math.PI) * 6; }
  else { e.vx = e.vy = 0; e.z = 0; }
};
AI.lobber = (e, dt) => {
  AI.shooter(e, dt);
};
AI.flee = (e) => { const p = G.p; const [nx, ny] = norm(e.x - p.x, e.y - p.y); const w = Math.sin(e.t * 2) * 0.8; e.vx = (nx - ny * w) * e.spd; e.vy = (ny + nx * w) * e.spd; };

function lob(e, r = 18, dmg) {
  const p = G.p;
  tele({ kind: 'circle', x: p.x + rnd(-10, 10), y: p.y + rnd(-10, 10), r, t: 1.0, col: '#ff8a2a', fire: t => { hitCircle(t.x, t.y, t.r, dmg ?? e.dmg, e); fxParticles(t.x, t.y, '#ffb36a', 8, 80, 0.35); sfx('boom'); } });
}
const aimShot = (n, arc, spd, col, kind = 'orb') => e => { const a = Math.atan2(G.p.y - e.y, G.p.x - e.x); for (let i = 0; i < n; i++) eShoot(e.x, e.y, a + (n > 1 ? (i / (n - 1) - 0.5) * arc : 0), spd, e.dmg * 0.8, { col, kind }); };

Object.assign(ETYPES, {
  // Hallownest
  husk: { spr: 'husk', hp: 18, spd: 36, dmg: 9, r: 5, xp: 1, blood: '#ff9a2a' },
  vengefly: { spr: 'vengefly', hp: 8, spd: 58, dmg: 7, r: 5, xp: 1, ai: AI.moth, blood: '#cfd8e8', init: e => { e.seed = rnd(TAU); } },
  aspid: { spr: 'aspid', hp: 14, spd: 40, dmg: 8, r: 4, xp: 2, ai: AI.shooter, blood: '#ff9a2a', init: e => { e.shot = aimShot(3, 0.5, 95, '#ff9a2a'); e.rate = 2.8; } },
  // Inferno
  filth: { spr: 'filth', hp: 12, spd: 50, dmg: 8, r: 4, xp: 1, blood: '#c41e2a' },
  stray: { spr: 'stray', hp: 16, spd: 38, dmg: 8, r: 5, xp: 2, ai: AI.shooter, blood: '#c41e2a', init: e => { e.shot = aimShot(1, 0, 120, '#ff4a2a'); e.rate = 3.2; e.keep = 130; } },
  maurice: { spr: 'maurice', hp: 40, spd: 22, dmg: 10, r: 6, xp: 4, ai: AI.shooter, blood: '#8a8a92', init: e => { e.shot = en => { for (let i = 0; i < 8; i++) eShoot(en.x, en.y, i / 8 * TAU + en.t, 80, en.dmg * 0.7, { col: '#ff3a2a' }); }; e.rate = 3.5; e.keep = 150; } },
  // Tartaro
  wretch: { spr: 'wretch', hp: 26, spd: 34, dmg: 10, r: 5, xp: 2, blood: '#5a8a5a' },
  numbskull: { spr: 'numbskull', hp: 10, spd: 60, dmg: 7, r: 4, xp: 1, ai: AI.moth, blood: '#6aff9a', init: e => { e.seed = rnd(TAU); } },
  witch: { spr: 'witch', hp: 18, spd: 32, dmg: 8, r: 5, xp: 2, ai: AI.shooter, blood: '#c96aff', init: e => { e.shot = en => eShoot(en.x, en.y, Math.atan2(G.p.y - en.y, G.p.x - en.x), 70, en.dmg * 0.8, { col: '#7aff9a', homing: 1.4, life: 5, r: 4 }); e.rate = 3.2; } },
  // Celeste
  seeker: { spr: 'seeker', hp: 22, spd: 40, dmg: 10, r: 5, xp: 2, ai: AI.charger, blood: '#7a3aa0' },
  dustbunny: { spr: 'dustbunny', hp: 6, spd: 62, dmg: 6, r: 4, xp: 1, ai: AI.moth, blood: '#6a6a7a', init: e => { e.seed = rnd(TAU); } },
  snowball: { spr: 'snowball', hp: 4, spd: 120, dmg: 7, r: 3, xp: 1, ai: AI.ticket, blood: '#f2f6ff', init: e => { e.noSep = true; } },
  // Dead Cells
  zombie: { spr: 'zombie', hp: 20, spd: 36, dmg: 9, r: 5, xp: 1, blood: '#6a9a5a' },
  archer: { spr: 'archer', hp: 16, spd: 34, dmg: 9, r: 5, xp: 2, ai: AI.shooter, blood: '#4a5a3a', init: e => { e.shot = aimShot(1, 0, 190, '#c9a06a', 'spear'); e.rate = 2.4; e.keep = 140; } },
  grenadier: { spr: 'grenadier', hp: 22, spd: 30, dmg: 12, r: 5, xp: 3, ai: AI.lobber, blood: '#5a3a2a', init: e => { e.shot = en => lob(en, 20); e.rate = 3.4; e.keep = 130; } },
  // Cvstodia
  condemned: { spr: 'condemned', hp: 22, spd: 36, dmg: 9, r: 5, xp: 1, blood: '#c41e2a' },
  candlebearer: { spr: 'candlebearer', hp: 18, spd: 34, dmg: 8, r: 5, xp: 2, ai: AI.shooter, blood: '#ffd23f', init: e => { e.shot = aimShot(3, 0.6, 80, '#ffd23f'); e.rate = 3; } },
  stoner: { spr: 'stoner', hp: 24, spd: 28, dmg: 11, r: 5, xp: 3, ai: AI.lobber, blood: '#8a7a5a', init: e => { e.shot = en => lob(en, 18); e.rate = 3.2; e.keep = 140; } },
  // Terraria
  tzombie: { spr: 'tzombie', hp: 22, spd: 34, dmg: 9, r: 5, xp: 1, blood: '#6a9a5a' },
  demoneye: { spr: 'demoneye', hp: 12, spd: 56, dmg: 8, r: 4, xp: 1, ai: AI.moth, blood: '#e0303a', init: e => { e.seed = rnd(TAU); } },
  slime: { spr: 'slime', hp: 16, spd: 40, dmg: 8, r: 5, xp: 1, ai: AI.hopper, blood: '#4a7aff' },
  // Seminterrato
  gaper: { spr: 'gaper', hp: 18, spd: 38, dmg: 9, r: 5, xp: 1, blood: '#c41e2a' },
  ifly: { spr: 'ifly', hp: 5, spd: 66, dmg: 6, r: 3, xp: 1, ai: AI.moth, blood: '#1a1418', init: e => { e.seed = rnd(TAU); } },
  clotty: { spr: 'clotty', hp: 16, spd: 30, dmg: 8, r: 4, xp: 2, ai: AI.shooter, blood: '#c41e2a', init: e => { e.shot = en => { for (let i = 0; i < 4; i++) eShoot(en.x, en.y, i / 4 * TAU + Math.PI / 4, 85, en.dmg * 0.7, { col: '#c41e2a' }); }; e.rate = 2.6; e.keep = 90; } },
  // Taglia (evento)
  bounty: { spr: 'husk', hp: 160, spd: 70, dmg: 6, r: 6, xp: 0, ai: AI.flee, blood: '#ffd23f', init: e => { e.golden = true; e.anchored = true; e.harmless = true; } },
});

// --- Piastrelle ------------------------------------------------------------------
function tileKind(spec) {
  const c = makeCanvas(32, 32), x = c.getContext('2d');
  const { base, dark, light, kind } = spec;
  x.fillStyle = base; x.fillRect(0, 0, 32, 32);
  const dot = (col, n, s = 1) => { x.fillStyle = col; for (let i = 0; i < n; i++) x.fillRect(Math.floor(rnd(32)), Math.floor(rnd(32)), s, s); };
  dot(dark, 30); dot(light, 18);
  if (kind === 'cobble') { for (let i = 0; i < 7; i++) { const cx = rnd(32), cy = rnd(32), r = rnd(3, 6); x.fillStyle = light; x.beginPath(); x.ellipse(cx, cy, r, r * 0.7, 0, 0, TAU); x.fill(); x.fillStyle = dark; x.fillRect(cx - r, cy + r * 0.6, r * 2, 1); } }
  if (kind === 'bricks') { x.fillStyle = dark; for (let r = 0; r < 4; r++) { x.fillRect(0, r * 8 + 7, 32, 1); for (let k = 0; k < 3; k++) x.fillRect(((k * 12) + (r % 2) * 6) % 32, r * 8, 1, 8); } }
  if (kind === 'marble') { x.strokeStyle = light; x.beginPath(); x.moveTo(rnd(32), 0); for (let i = 0; i < 4; i++) x.lineTo(rnd(32), i * 10 + 8); x.stroke(); x.fillStyle = dark; x.fillRect(0, 31, 32, 1); x.fillRect(31, 0, 1, 32); }
  if (kind === 'greek') { x.fillStyle = dark; x.fillRect(0, 0, 32, 2); x.fillRect(0, 30, 32, 2); x.fillStyle = light; for (let i = 0; i < 32; i += 8) { x.fillRect(i, 3, 6, 1); x.fillRect(i + 5, 3, 1, 3); x.fillRect(i + 2, 5, 4, 1); } }
  if (kind === 'snow') { dot('#ffffff', 10); x.fillStyle = light; for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(rnd(32), rnd(32), rnd(4, 9), rnd(2, 3), 0, 0, TAU); x.fill(); } }
  if (kind === 'grass') { x.fillStyle = dark; for (let i = 0; i < 26; i++) x.fillRect(Math.floor(rnd(32)), Math.floor(rnd(32)), 1, 2); x.fillStyle = light; for (let i = 0; i < 12; i++) x.fillRect(Math.floor(rnd(32)), Math.floor(rnd(32)), 1, 2); }
  if (kind === 'sand') { dot(light, 30); x.fillStyle = dark; x.fillRect(0, 15, 32, 1); x.fillRect(0, 31, 32, 1); x.fillRect(10, 0, 1, 15); x.fillRect(24, 16, 1, 15); }
  if (kind === 'dirt') { dot(dark, 30, 2); x.fillStyle = light; for (let i = 0; i < 4; i++) x.fillRect(Math.floor(rnd(30)), Math.floor(rnd(30)), 2, 1); }
  if (kind === 'void') { dot('#2a2240', 6); }
  return c;
}

// --- Particelle d'ambiente -----------------------------------------------------------
function updateAmbient(dt) {
  const A = G.world?.amb;
  if (!A) return;
  const m = G.mood2 && G.world.mood2?.amb ? G.world.mood2.amb : A;
  G.amb = G.amb || [];
  while (G.amb.length < m.n) {
    G.amb.push({ x: camX + rnd(-20, W + 20), y: camY + (m.type === 'embers' || m.type === 'spores' ? H + 10 : m.type === 'snow' || m.type === 'ash' ? -10 : rnd(H)), vx: rnd(-8, 8), vy: 0, t: rnd(TAU), life: rnd(4, 9), col: pick(m.cols), s: Math.random() < 0.3 ? 2 : 1 });
  }
  const wind = G.wind ? G.wind.x * 160 : 0;
  for (const a of G.amb) {
    a.t += dt; a.life -= dt;
    if (m.type === 'snow') { a.vy = 30; a.vx = 12 * Math.sin(a.t) + wind; }
    else if (m.type === 'ash') { a.vy = 14; a.vx = 6 * Math.sin(a.t * 0.7); }
    else if (m.type === 'embers') { a.vy = -28; a.vx = 10 * Math.sin(a.t * 2); }
    else if (m.type === 'spores') { a.vy = -10; a.vx = 6 * Math.sin(a.t); }
    else { a.vy = 4 * Math.sin(a.t * 0.8); a.vx = 5 * Math.cos(a.t * 0.6); }
    a.x += a.vx * dt; a.y += a.vy * dt;
    if (a.x < camX - 40 || a.x > camX + W + 40 || a.y < camY - 40 || a.y > camY + H + 40) a.life = 0;
  }
  G.amb = G.amb.filter(a => a.life > 0);
}
function drawAmbient(c) {
  for (const a of G.amb || []) {
    c.globalAlpha = Math.min(1, a.life) * (0.5 + 0.5 * Math.sin(a.t * 3) ** 2);
    c.fillStyle = a.col; c.fillRect(Math.round(a.x - camX), Math.round(a.y - camY), a.s, a.s);
  }
  c.globalAlpha = 1;
}

// --- Fabbrica dei mondi ----------------------------------------------------------------
const STORY_TIMES = { elites: [150], boss: 300, cont: 480 };

function makeWorld(d) {
  let tiles = null;
  const st = {
    id: d.id, name: d.name, game: d.game, tagline: d.tagline, desc: d.desc, hazards: d.hazards, elite: d.mini, boss: d.boss, bossSub: d.bossSub,
    bg: d.bg, dark: d.dark, story: true, world: d,
    table: d.table,
    init() {
      if (!tiles) tiles = d.tiles.map(tileKind);
      G.world = d; G.mood2 = false; G.moodK = 0; G.amb = []; G.wind = null; G.windT = 18;
      d.init?.();
    },
    clampPos(x, y) { return [x, y]; },
    spawnPos(a) { const p = G.p; return [p.x + Math.cos(a) * 380, p.y + Math.sin(a) * 260]; },
    constrainPlayer() {},
    update(dt) {
      if (!G.mood2 && d.mood2 && (G.elitesKilled > 0 || G.t > 230)) { G.mood2 = true; banner(d.mood2.name, d.mood2.sub, 2.6, d.mood2.col || '#e2b04a'); sfx('bell'); }
      if (G.mood2) G.moodK = Math.min(1, G.moodK + dt * 0.4);
      if (d.wind) {
        G.windT -= dt;
        if (!G.wind && G.windT <= 0) { const a = pick([0, Math.PI, Math.PI / 2, -Math.PI / 2]); G.wind = { x: Math.cos(a), y: Math.sin(a), t: 5 }; banner('VENTO!', 'Le raffiche della Cresta Dorata ti spingono', 1.4, '#bfe4ff'); }
        if (G.wind) {
          const p = G.p;
          if (!(p.flyT > 0)) { p.x += G.wind.x * 48 * dt; p.y += G.wind.y * 48 * dt; }
          for (const e of G.enemies) if (!e.boss) { e.x += G.wind.x * 30 * dt; e.y += G.wind.y * 30 * dt; }
          if ((G.wind.t -= dt) <= 0) { G.wind = null; G.windT = 20; }
        }
      }
      if (d.pools) {
        G.poolT = (G.poolT ?? 12) - dt;
        if (G.poolT <= 0) { G.poolT = 14; const a = rnd(TAU); G.zones.push({ type: d.pools.type, x: G.p.x + Math.cos(a) * rnd(60, 160), y: G.p.y + Math.sin(a) * rnd(60, 120), r: d.pools.r, t: 12, k: 0 }); }
      }
      d.update?.(dt);
    },
    drawFloor(c) {
      const x0 = Math.floor(camX / 32) - 1, y0 = Math.floor(camY / 32) - 1;
      for (let tx = x0; tx < x0 + W / 32 + 3; tx++) for (let ty = y0; ty < y0 + H / 32 + 3; ty++) {
        const h = hash2(tx, ty);
        c.drawImage(tiles[h % tiles.length], tx * 32 - camX, ty * 32 - camY);
      }
      // oggetti di scena (deterministici per cella)
      const cs = 48;
      const cx0 = Math.floor((camX - 20) / cs), cy0 = Math.floor((camY - 30) / cs);
      for (let gx = cx0; gx < cx0 + W / cs + 2; gx++) for (let gy = cy0; gy < cy0 + H / cs + 3; gy++) {
        const h = hash2(gx * 7 + 3, gy * 13 + 5);
        const props = G.mood2 && d.mood2?.props ? d.mood2.props : d.props;
        let acc = 0; const r = (h % 1000) / 1000;
        for (const pr of props) {
          acc += pr.ch;
          if (r < acc) {
            const px = gx * cs + 8 + ((h >> 10) % 32), py = gy * cs + 8 + ((h >> 15) % 32);
            const s = SPR[pr.spr];
            const flick = pr.light ? 0.5 + 0.5 * Math.sin(G.t * 5 + gx) : 0;
            c.drawImage(s.img, Math.round(px - camX - s.w / 2), Math.round(py - camY - s.h));
            if (pr.light) G.lights.push({ x: px, y: py - s.h / 2, r: pr.light.r * (0.9 + 0.1 * flick), col: pr.light.col });
            break;
          }
        }
      }
      for (const z of G.zones) {
        if (z.type !== 'slowpool' && z.type !== 'lava') continue;
        const x = Math.round(z.x - camX), y = Math.round(z.y - camY), a = Math.min(1, z.t, (12 - z.t) * 2);
        c.globalAlpha = a * 0.75;
        c.fillStyle = z.type === 'lava' ? '#c43a1a' : '#c86a1a'; c.beginPath(); c.ellipse(x, y, z.r, z.r * 0.6, 0, 0, TAU); c.fill();
        c.fillStyle = z.type === 'lava' ? '#ffb03a' : '#ff9a2a'; c.beginPath(); c.ellipse(x, y, z.r * 0.6, z.r * 0.35, 0, 0, TAU); c.fill();
        c.globalAlpha = 1;
        if (z.type === 'lava') G.lights.push({ x: z.x, y: z.y, r: z.r * 2, col: '#ff6a2a' });
      }
      d.drawFloor?.(c);
    },
    drawOver(c) {
      if (G.moodK > 0 && d.mood2?.tint) { c.globalAlpha = G.moodK; c.fillStyle = d.mood2.tint; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      if (G.wind) { c.strokeStyle = 'rgba(220,240,255,.35)'; for (let i = 0; i < 14; i++) { const y = (i * 53 + G.t * 40) % H, x = (i * 97 + G.t * 300 * G.wind.x) % W; c.beginPath(); c.moveTo((x + W) % W, (y + H) % H); c.lineTo((x + W) % W + G.wind.x * 24, (y + H) % H + G.wind.y * 24); c.stroke(); } }
      d.drawOver?.(c);
    },
    hud(c, x, y) { return false; },
  };
  return st;
}

const WORLDS = {
  hallownest: {
    id: 'hallownest', name: 'Hallownest: il Crocevia Dimenticato', game: 'Hollow Knight', tagline: '«Nessuna luce scende qui. Solo l\'Infezione, e il silenzio.»',
    desc: 'Pietra blu, lanterne di lucciole e insetti svuotati che vagano ancora per le strade del regno caduto.',
    hazards: ['Pozze d\'Infezione: rallentano', 'Dopo il mini-boss l\'Infezione si diffonde'],
    mini: 'falseknight', boss: 'hollowknight', bossSub: 'Nella seconda fase si trafigge da solo: è il momento di colpire',
    bg: '#0b0f1a', dark: 0.62,
    tiles: [{ base: '#1e2840', dark: '#151d30', light: '#2c3858', kind: 'cobble' }, { base: '#222c46', dark: '#182036', light: '#34405e', kind: 'bricks' }],
    props: [{ spr: 'p_stalag', ch: 0.08 }, { spr: 'p_lamp', ch: 0.025, light: { r: 46, col: '#9fe0ff' } }, { spr: 'p_lumafly', ch: 0.03, light: { r: 30, col: '#9fe0ff' } }, { spr: 'p_infect', ch: 0.02, light: { r: 20, col: '#ff9a2a' } }],
    amb: { type: 'dust', n: 50, cols: ['#9fb0d0', '#c9d8f0', '#6a7a9a'] },
    pools: { type: 'slowpool', r: 26 },
    mood2: { name: 'L\'INFEZIONE SI DIFFONDE', sub: 'La Radianza sussurra più forte', col: '#ff9a2a', tint: 'rgba(255,120,30,.10)', props: [{ spr: 'p_infect', ch: 0.09, light: { r: 22, col: '#ff9a2a' } }, { spr: 'p_stalag', ch: 0.06 }, { spr: 'p_lamp', ch: 0.02, light: { r: 46, col: '#ffb070' } }], amb: { type: 'spores', n: 60, cols: ['#ff9a2a', '#ffd27a', '#c86a1a'] } },
    table: t => (t < 90 ? [['husk', 6], ['vengefly', 4]] : [['husk', 5], ['vengefly', 4], ['aspid', 3]]),
  },
  inferno: {
    id: 'inferno', name: 'Inferno, Strato VI: Eresia', game: 'ULTRAKILL', tagline: '«Il sangue è carburante. Qui ce n\'è in abbondanza.»',
    desc: 'Marmo rosso e colonne d\'oro su un mare di braci. Le crepe di lava si aprono sotto i piedi.',
    hazards: ['Crepe di lava: bruciano', 'Dopo il mini-boss il sangue ribolle'],
    mini: 'swordsmachine', boss: 'gabriel', bossSub: 'Si teletrasporta e colpisce in tre tempi: muoviti di lato',
    bg: '#1a0808', dark: 0.35,
    tiles: [{ base: '#4a1414', dark: '#360e0e', light: '#6a2020', kind: 'marble' }, { base: '#3e1212', dark: '#2a0a0a', light: '#5a1a1a', kind: 'marble' }],
    props: [{ spr: 'p_pillar_gold', ch: 0.03 }, { spr: 'p_lava', ch: 0.05, light: { r: 30, col: '#ff6a2a' } }, { spr: 'p_skulls', ch: 0.04 }],
    amb: { type: 'embers', n: 60, cols: ['#ff8a2a', '#ffd23f', '#ff4a2a'] },
    pools: { type: 'lava', r: 22 },
    mood2: { name: 'IL SANGUE RIBOLLE', sub: 'Lo Strato reagisce alla tua presenza', col: '#ff4a2a', tint: 'rgba(200,0,20,.12)' },
    table: t => (t < 90 ? [['filth', 7], ['stray', 3]] : [['filth', 5], ['stray', 4], ['maurice', 1]]),
  },
  tartaro: {
    id: 'tartaro', name: 'Gli Inferi: il Tartaro', game: 'Hades', tagline: '«Non c\'è via d\'uscita dalla Casa di Ade. Eppure, eccoti.»',
    desc: 'Pavimenti greci, canali dello Stige color sangue e fuochi di anime verdi. Le camere non finiscono mai.',
    hazards: ['Dopo il mini-boss il Tartaro lascia il posto ad Asfodelo'],
    mini: 'megaera', boss: 'hades', bossSub: 'Nella seconda fase diventa invisibile: guarda la sua ombra',
    bg: '#0a1210', dark: 0.48,
    tiles: [{ base: '#1c2a24', dark: '#141e1a', light: '#2a3c34', kind: 'greek' }, { base: '#182420', dark: '#101a16', light: '#26362e', kind: 'cobble' }],
    props: [{ spr: 'p_column', ch: 0.04 }, { spr: 'p_soulfire', ch: 0.035, light: { r: 34, col: '#3ad08a' } }, { spr: 'p_skulls', ch: 0.02 }],
    amb: { type: 'dust', n: 40, cols: ['#6affb0', '#3ad08a', '#9affd0'] },
    mood2: { name: 'ASFODELO', sub: 'Il pavimento si fa di lava e ossa', col: '#ff8a2a', tint: 'rgba(255,100,30,.12)', props: [{ spr: 'p_lava', ch: 0.06, light: { r: 30, col: '#ff6a2a' } }, { spr: 'p_column', ch: 0.03 }, { spr: 'p_skulls', ch: 0.04 }], amb: { type: 'embers', n: 50, cols: ['#ff8a2a', '#ffd23f'] } },
    table: t => (t < 90 ? [['wretch', 6], ['numbskull', 4]] : [['wretch', 5], ['numbskull', 3], ['witch', 3]]),
  },
  celeste: {
    id: 'celeste', name: 'Monte Celeste: la Cresta Dorata', game: 'Celeste', tagline: '«La montagna mostra a ognuno ciò che si porta dentro.»',
    desc: 'Neve, cristalli e raffiche di vento. Più sali, più la montagna ti somiglia.',
    hazards: ['Raffiche di vento: ti spingono', 'Dopo il mini-boss si entra nel Tempio Specchio'],
    mini: 'oshiroboss', boss: 'badelineboss', bossSub: 'Ti insegue sul tuo stesso percorso: non tornare sui tuoi passi',
    bg: '#1a2238', dark: 0.18, wind: true,
    tiles: [{ base: '#c8d4e8', dark: '#a8b8d0', light: '#e8f0ff', kind: 'snow' }, { base: '#bccae0', dark: '#9aaac4', light: '#dce6f8', kind: 'snow' }],
    props: [{ spr: 'p_pine', ch: 0.05 }, { spr: 'p_drift', ch: 0.06 }, { spr: 'p_crystal', ch: 0.025, light: { r: 22, col: '#7ac0ff' } }],
    amb: { type: 'snow', n: 90, cols: ['#ffffff', '#e8f0ff', '#cfe0ff'] },
    mood2: { name: 'IL TEMPIO SPECCHIO', sub: '«Sei sicura di voler entrare?»', col: '#c96aff', tint: 'rgba(90,30,140,.28)', props: [{ spr: 'p_crystal', ch: 0.05, light: { r: 26, col: '#c96aff' } }, { spr: 'p_drift', ch: 0.03 }], amb: { type: 'dust', n: 60, cols: ['#c96aff', '#ff7ad9', '#7a3aa0'] } },
    table: t => (t < 90 ? [['dustbunny', 6], ['snowball', 3]] : [['dustbunny', 4], ['seeker', 4], ['snowball', 3]]),
  },
  deadcells: {
    id: 'deadcells', name: 'L\'Isola: dai Quartieri al Trono', game: 'Dead Cells', tagline: '«Si muore. Si ricomincia. Si muore un po\' meglio.»',
    desc: 'Mura muschiose, catene e gabbie. Le torce indicano la strada verso la Sala del Trono.',
    hazards: ['Dopo il mini-boss si arriva alla Sala del Trono'],
    mini: 'conciergeboss', boss: 'handofking', bossSub: 'Nella seconda fase incendia l\'arena: tieniti in movimento',
    bg: '#0c120c', dark: 0.5,
    tiles: [{ base: '#2a3226', dark: '#1e241c', light: '#3a4634', kind: 'bricks' }, { base: '#262e22', dark: '#1a2018', light: '#36422e', kind: 'cobble' }],
    props: [{ spr: 'p_torch', ch: 0.03, light: { r: 40, col: '#ffb03a' } }, { spr: 'p_chain', ch: 0.04 }, { spr: 'p_cage', ch: 0.025 }],
    amb: { type: 'spores', n: 45, cols: ['#7aff9a', '#3fc8b8', '#aaffcc'] },
    mood2: { name: 'LA SALA DEL TRONO', sub: 'Oro, stendardi e una guardia che non dorme', col: '#ffd23f', tint: 'rgba(255,200,60,.08)', props: [{ spr: 'p_torch', ch: 0.05, light: { r: 44, col: '#ffd23f' } }, { spr: 'p_pillar_gold', ch: 0.03 }] },
    table: t => (t < 90 ? [['zombie', 7], ['archer', 3]] : [['zombie', 5], ['archer', 3], ['grenadier', 3]]),
  },
  cvstodia: {
    id: 'cvstodia', name: 'Cvstodia: i Muri di Santo Silenzio', game: 'Blasphemous', tagline: '«Il Miracolo dona. Il Miracolo prende.»',
    desc: 'Arenaria, altari d\'oro e candele che non si spengono mai. I penitenti marciano in processione.',
    hazards: ['Dopo il mini-boss inizia la Processione: cenere e sangue'],
    mini: 'tenpiedadboss', boss: 'escribar', bossSub: 'Fa piovere luce: guarda i cerchi a terra',
    bg: '#140c08', dark: 0.42,
    tiles: [{ base: '#5a4630', dark: '#463624', light: '#6e5a40', kind: 'sand' }, { base: '#544028', dark: '#40301e', light: '#6a5236', kind: 'bricks' }],
    props: [{ spr: 'p_candles', ch: 0.05, light: { r: 30, col: '#ffd27a' } }, { spr: 'p_altar', ch: 0.02, light: { r: 24, col: '#ffe680' } }, { spr: 'p_blood', ch: 0.05 }],
    amb: { type: 'ash', n: 50, cols: ['#a89a88', '#c9b8a0', '#7a6a5a'] },
    mood2: { name: 'LA PROCESSIONE', sub: '«Ogni passo è penitenza.» — Deogracias', col: '#c41e2a', tint: 'rgba(160,20,30,.12)', amb: { type: 'ash', n: 70, cols: ['#c41e2a', '#a89a88'] } },
    table: t => (t < 90 ? [['condemned', 7], ['candlebearer', 3]] : [['condemned', 5], ['candlebearer', 3], ['stoner', 3]]),
  },
  terraria: {
    id: 'terraria', name: 'La Superficie, di notte', game: 'Terraria', tagline: '«Ti senti osservato…»',
    desc: 'Erba, alberi e fiori sotto un cielo stellato. Di notte escono gli zombie; poi sorge la Luna di Sangue.',
    hazards: ['Dopo il mini-boss sorge la Luna di Sangue'],
    mini: 'eocboss', boss: 'moonlord', bossSub: 'Il raggio della morte gira: muoviti nella stessa direzione',
    bg: '#0a1020', dark: 0.5,
    tiles: [{ base: '#2c4a22', dark: '#203818', light: '#3c602e', kind: 'grass' }, { base: '#4a3622', dark: '#3a2a1a', light: '#5e4630', kind: 'dirt' }, { base: '#2e4c24', dark: '#223a1a', light: '#3e6230', kind: 'grass' }],
    props: [{ spr: 'p_tree', ch: 0.05 }, { spr: 'p_flower', ch: 0.06 }, { spr: 'p_torch', ch: 0.012, light: { r: 40, col: '#ffd27a' } }],
    amb: { type: 'dust', n: 40, cols: ['#ffffff', '#ffe680', '#bfe4ff'] },
    mood2: { name: 'UNA LUNA DI SANGUE STA SORGENDO…', sub: 'Più nemici, più esperienza', col: '#e0303a', tint: 'rgba(170,0,20,.2)' },
    init() { G.xpEventMul = 1; },
    update() { if (G.mood2) { G.spawnMul = 1.4; G.xpEventMul = 1.3; } },
    table: t => (t < 90 ? [['tzombie', 6], ['demoneye', 4]] : [['tzombie', 4], ['demoneye', 3], ['slime', 4]]),
  },
  basement: {
    id: 'basement', name: 'Il Seminterrato', game: 'The Binding of Isaac', tagline: '«Isaac e sua madre vivevano da soli in una piccola casa sulla collina…»',
    desc: 'Pietra marrone, rocce, macchie di sangue e mosche. Più scendi, più diventa buio.',
    hazards: ['Dopo il mini-boss si scende nelle Profondità'],
    mini: 'monstroboss', boss: 'mom', bossSub: 'Guarda l\'ombra del piede: quando colpisce il suolo, colpiscilo',
    bg: '#120a06', dark: 0.5,
    tiles: [{ base: '#4a3424', dark: '#3a281a', light: '#5e4430', kind: 'dirt' }, { base: '#46301e', dark: '#362414', light: '#5a402a', kind: 'cobble' }],
    props: [{ spr: 'p_rock', ch: 0.06 }, { spr: 'p_poop', ch: 0.03 }, { spr: 'p_blood', ch: 0.05 }],
    amb: { type: 'dust', n: 35, cols: ['#8a6a4a', '#a88a6a'] },
    mood2: { name: 'LE PROFONDITÀ', sub: 'Più buio. Più denti.', col: '#c41e2a', tint: 'rgba(40,0,10,.3)' },
    table: t => (t < 90 ? [['gaper', 6], ['ifly', 5]] : [['gaper', 5], ['ifly', 4], ['clotty', 3]]),
  },
  finale: {
    id: 'finale', name: 'Titoli di Coda', game: 'Patchwork Eternity', tagline: '«Ogni finale è solo un punto di cucitura.»',
    desc: 'Il vuoto dietro la coperta. I nomi scorrono sotto i tuoi piedi; i nemici di tutti i mondi tornano per l\'ultima volta.',
    hazards: ['Nemici di tutti i mondi', 'La Cucitrice indossa le maschere dei boss che hai battuto'],
    mini: 'falseknight', boss: 'cucitrice', bossSub: 'Cambia maschera: riconosci l\'attacco del boss che imita',
    bg: '#06040a', dark: 0.3,
    tiles: [{ base: '#0c0a14', dark: '#08060e', light: '#14101e', kind: 'void' }],
    props: [{ spr: 'spool', ch: 0.015 }],
    amb: { type: 'dust', n: 60, cols: ['#e2b04a', '#efe6d2', '#8e2b3a'] },
    mood2: { name: 'L\'ULTIMO ORLO', sub: 'La coperta si sta chiudendo', col: '#e2b04a', tint: 'rgba(226,176,74,.06)' },
    drawFloor(c) {
      const names = ['TEAM CHERRY', 'ARSI "HAKITA" PATALA', 'SUPERGIANT GAMES', 'MADDY THORSON', 'MOTION TWIN', 'THE GAME KITCHEN', 'RE-LOGIC', 'EDMUND McMILLEN', 'E TUTTI QUELLI CHE HANNO RICOMINCIATO'];
      const off = (G.t * 18) % 60;
      for (let i = -2; i < 9; i++) {
        const wy = Math.floor(camY / 60) * 60 + i * 60 - off;
        const n = names[((Math.floor((camY + i * 60) / 60) % names.length) + names.length) % names.length];
        txt(c, n, W / 2, Math.round(wy - camY), 'rgba(226,176,74,.25)', 16, 'center', false);
      }
    },
    table: t => (t < 90 ? [['husk', 2], ['filth', 2], ['wretch', 2], ['dustbunny', 2], ['zombie', 2], ['condemned', 2], ['tzombie', 2], ['gaper', 2]] : [['aspid', 2], ['stray', 2], ['witch', 2], ['seeker', 2], ['archer', 2], ['stoner', 2], ['slime', 2], ['clotty', 2], ['wretch', 2]]),
  },
};
for (const [id, d] of Object.entries(WORLDS)) STAGES[id] = makeWorld(d);

// Ordine della Storia
const STORY = [
  { id: 'telaio', chap: 'Prologo', label: 'Il Telaio dei Mondi' },
  { id: 'hallownest', chap: 'Capitolo I', label: 'Hallownest' },
  { id: 'inferno', chap: 'Capitolo II', label: 'L\'Inferno' },
  { id: 'tartaro', chap: 'Capitolo III', label: 'Gli Inferi' },
  { id: 'celeste', chap: 'Capitolo IV', label: 'Monte Celeste' },
  { id: 'deadcells', chap: 'Capitolo V', label: 'L\'Isola' },
  { id: 'cvstodia', chap: 'Capitolo VI', label: 'Cvstodia' },
  { id: 'terraria', chap: 'Capitolo VII', label: 'La Superficie' },
  { id: 'basement', chap: 'Capitolo VIII', label: 'Il Seminterrato' },
  { id: 'finale', chap: 'Finale', label: 'Titoli di Coda' },
];
// Nativo di ogni mondo (per gli incontri)
const WORLD_NATIVE = { hallownest: 'knight', inferno: 'v1', tartaro: 'zagreus', celeste: 'madeline', deadcells: 'prisoner', cvstodia: 'penitent', terraria: 'terrarian', basement: 'isaac' };

// =============================================================================
// RELIQUIE DEL MULTIVERSO (oggetti con un "trucco" che si combinano tra loro)
// =============================================================================
const RELICS = {
  needle: { name: 'Ago Infilato', icon: ['knife', '#c9ced8', '#e2b04a'], line: () => 'I colpi a volte cuciono due nemici: il danno a uno passa (30%) all\'altro', relic: true },
  button: { name: 'Bottone Esplosivo', icon: ['coin', '#c94a6a', '#5a1e24'], line: () => 'Il 12% dei nemici uccisi esplode', relic: true },
  cmirror: { name: 'Specchio Incrinato', icon: ['shield', '#bfe4ff', '#6b7085'], line: () => 'I proiettili rimbalzano una volta sul nemico più vicino', relic: true },
  frost: { name: 'Lacrima Gelata', icon: ['crystal', '#bfe8ff', '#3a86d0'], line: () => 'I colpi critici congelano · +8% critico', relic: true },
  pact: { name: 'Patto della Cucitrice', icon: ['scroll', '#e2b04a', '#8e2b3a'], line: () => '+30% danno, ma i nemici sono più veloci del 15%', relic: true, stat: s => { s.might += 0.3; } },
  collector: { name: 'Ditale del Collezionista', icon: ['magnet', '#ffd23f', '#8a5a2a'], line: () => '+60% magnetismo · ogni 150 frammenti +2% danno', relic: true, stat: s => { s.magnet += 0.6; s.might += Math.min(0.3, Math.floor((G?.gemsTaken || 0) / 150) * 0.02); } },
};
Object.assign(PASSIVES, Object.fromEntries(Object.entries(RELICS).map(([k, v]) => [k, Object.assign({ max: 1 }, v)])));
SYN.push(
  { char: '*', a: 'needle', b: 'button', name: 'Cucito Esplosivo', desc: 'I nemici cuciti esplodono insieme' },
  { char: '*', a: 'cmirror', b: 'frost', name: 'Schegge di Ghiaccio', desc: 'I proiettili che rimbalzano congelano' },
  { char: '*', a: 'pact', b: 'collector', name: 'Avidità Cucita', desc: 'I frammenti danno +15% esperienza' },
);

function relicOnHit(e, d, o) {
  if (o.relicEcho) return;
  if (owned('needle')) {
    if (!e.link && Math.random() < 0.18) {
      const n = nearest(e.x, e.y, 70, x => x !== e && !x.link);
      if (n) { e.link = n; e.linkT = 4; n.link = e; n.linkT = 4; }
    }
    if (e.link && !e.link.dead && e.linkT > 0) { fxLine(e.x, e.y, e.link.x, e.link.y, '#e2b04a', 0.12, 1); hurtEnemy(e.link, d * 0.3 / G.s.might, { silent: true, relicEcho: true }); }
  }
}
function relicOnKill(e) {
  const linked = e.link && !e.link.dead && owned('needle') && owned('button');
  if ((owned('button') && Math.random() < 0.12) || linked) {
    aoe(e.x, e.y, 30, 22, { silent: true, relicEcho: true }, '#c94a6a');
    fxParticles(e.x, e.y, '#ff8a6a', 10, 90, 0.35);
    if (linked) { const l = e.link; setTimeout(() => { if (G && !l.dead) { aoe(l.x, l.y, 30, 22, { silent: true, relicEcho: true }, '#c94a6a'); } }, 120); }
  }
}

// =============================================================================
// EVENTI DELLA RUN
// =============================================================================
const EVENT_ORDER = ['capture', 'encounter', 'escort', 'bounty'];

function startEvent() {
  const p = G.p;
  const kind = EVENT_ORDER[G.evIdx++ % EVENT_ORDER.length];
  const at = (dmin, dmax) => { const a = rnd(TAU), d = rnd(dmin, dmax); return G.stage.clampPos(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); };
  if (kind === 'capture') {
    const [x, y] = at(150, 210);
    G.event = { kind, x, y, r: 44, need: 10, prog: 0, t: 40, title: 'RAMMENDO', sub: 'Resta nel cerchio per cucire lo strappo' };
    banner('EVENTO: RAMMENDO', 'Resta nel cerchio 10 secondi. I nemici proveranno a fermarti.', 2.4, '#e2b04a');
  } else if (kind === 'escort') {
    const [ax, ay] = at(110, 150);
    const a2 = rnd(TAU);
    const [bx, by] = G.stage.clampPos(ax + Math.cos(a2) * 380, ay + Math.sin(a2) * 300);
    G.event = { kind, ax, ay, bx, by, carried: false, hits: 0, t: 75, title: 'CONSEGNA', sub: 'Porta il Rocchetto d\'Oro all\'altare' };
    banner('EVENTO: IL ROCCHETTO D\'ORO', 'Portalo all\'altare. Mentre lo porti sei più lento e le armi rallentano.', 2.8, '#ffd23f');
  } else if (kind === 'encounter') {
    const native = WORLD_NATIVE[G.stage.id];
    let npc = native && native !== G.char.id ? native : pick(Object.keys(CHARS).filter(id => id !== G.char.id));
    const [x, y] = at(130, 180);
    G.event = { kind, npc, x, y, t: 45, title: 'INCONTRO', sub: CHARS[npc].name + ' ti aspetta' };
    banner('UN VOLTO NOTO', CHARS[npc].name + ' è finito anche lui nella coperta', 2.4, '#5fb3ff');
  } else {
    const [x, y] = at(170, 220);
    const types = G.stage.table(G.t).map(t => t[0]);
    const b = spawnEnemy('bounty', x, y);
    b.spr = types[0] && SPR[ETYPES[types[0]].spr] ? ETYPES[types[0]].spr : 'husk';
    b.hp = b.maxHp = 140 + G.t * 0.8;
    G.event = { kind, e: b, t: 25, title: 'TAGLIA', sub: 'Il nemico d\'oro scappa: prendilo!' };
    banner('TAGLIA!', 'Un nemico d\'oro sta scappando con un tesoro', 2.2, '#ffd23f');
  }
}

function updateEvent(dt) {
  if (G.bossE || G.won) { if (G.event) endEvent(false, true); return; }
  if (!G.event) {
    G.evT -= dt;
    if (G.evT <= 0) { G.evT = 62; startEvent(); }
    return;
  }
  const ev = G.event, p = G.p;
  ev.t -= dt;
  if (ev.kind === 'capture') {
    const inside = d2(p.x, p.y, ev.x, ev.y) < ev.r * ev.r;
    if (inside) ev.prog += dt;
    G.spawnBoost = inside ? 1.6 : 1;
    if (ev.prog >= ev.need) { endEvent(true); dropPickup('chest', ev.x, ev.y); fxRing(ev.x, ev.y, 4, 60, '#e2b04a', 0.6, 3); }
  } else if (ev.kind === 'escort') {
    if (!ev.carried && d2(p.x, p.y, ev.ax, ev.ay) < 14 * 14) { ev.carried = true; sfx('pick'); banner('PRESO!', 'Tre colpi e lo fai cadere', 1.2, '#ffd23f'); }
    if (ev.carried) { ev.ax = p.x; ev.ay = p.y - 14; if (d2(p.x, p.y, ev.bx, ev.by) < 20 * 20) { endEvent(true); offerRelic(); for (let i = 0; i < 12; i++) dropGem(ev.bx + rnd(-20, 20), ev.by + rnd(-20, 20), 3); } }
  } else if (ev.kind === 'encounter') {
    if (d2(p.x, p.y, ev.x, ev.y) < 16 * 16) {
      const npc = ev.npc;
      G.event = null; G.evT = 62;
      startDialog(encounterLines(G.char.id, npc), () => offerGift(npc));
      return;
    }
  } else if (ev.kind === 'bounty') {
    if (ev.e.dead) { endEvent(true); for (let i = 0; i < 26; i++) dropGem(ev.e.x + rnd(-24, 24), ev.e.y + rnd(-24, 24), 3); dropPickup('chest', ev.e.x, ev.e.y); }
    else if (d2(ev.e.x, ev.e.y, p.x, p.y) > 500 * 500) { ev.e.x = p.x + (ev.e.x - p.x) * 0.6; ev.e.y = p.y + (ev.e.y - p.y) * 0.6; }
  }
  if (G.event && ev.t <= 0) endEvent(false);
}
function endEvent(ok, silent) {
  const ev = G.event;
  if (!ev) return;
  if (ev.kind === 'bounty' && !ev.e.dead) { ev.e.dead = true; ev.e.noXp = true; }
  G.event = null; G.spawnBoost = 1;
  if (!silent) { banner(ok ? 'EVENTO COMPLETATO' : 'EVENTO FALLITO', ok ? 'Ricompensa a terra' : 'Andrà meglio la prossima volta', 1.8, ok ? '#7aff9a' : '#a89a88'); if (ok) sfx('lvl'); }
}
function eventHurt() { const ev = G.event; if (ev && ev.kind === 'escort' && ev.carried && ++ev.hits >= 3) { ev.carried = false; ev.hits = 0; ev.ay += 14; banner('CADUTO!', 'Il Rocchetto è a terra: riprendilo', 1.2, '#ff5a6a'); } }
const carrying = () => G.event && G.event.kind === 'escort' && G.event.carried;

function drawEvent(c) {
  const ev = G.event;
  if (!ev) return;
  const blink = 0.6 + 0.4 * Math.sin(G.t * 6);
  if (ev.kind === 'capture') {
    const x = Math.round(ev.x - camX), y = Math.round(ev.y - camY);
    c.fillStyle = 'rgba(226,176,74,.12)'; c.beginPath(); c.arc(x, y, ev.r, 0, TAU); c.fill();
    c.strokeStyle = '#e2b04a'; c.setLineDash([3, 3]); c.lineDashOffset = -G.t * 10; c.beginPath(); c.arc(x, y, ev.r, 0, TAU); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
    c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, ev.r - 4, -Math.PI / 2, -Math.PI / 2 + TAU * ev.prog / ev.need); c.stroke(); c.lineWidth = 1;
    G.lights.push({ x: ev.x, y: ev.y, r: ev.r + 20, col: '#e2b04a' });
  } else if (ev.kind === 'escort') {
    const bx = Math.round(ev.bx - camX), by = Math.round(ev.by - camY);
    c.drawImage(SPR.p_altar_goal.img, bx - 3, by - 6);
    c.strokeStyle = `rgba(255,210,63,${blink})`; c.beginPath(); c.arc(bx, by, 20, 0, TAU); c.stroke();
    G.lights.push({ x: ev.bx, y: ev.by, r: 40, col: '#ffd23f' });
    c.drawImage(SPR.p_relic.img, Math.round(ev.ax - camX - 3), Math.round(ev.ay - camY - 3 + (ev.carried ? 0 : Math.sin(G.t * 4) * 2)));
    G.lights.push({ x: ev.ax, y: ev.ay, r: 28, col: '#ffd23f' });
  } else if (ev.kind === 'encounter') {
    const ch = CHARS[ev.npc];
    drawSpr(c, ch.spr, ev.x, ev.y, ev.x > G.p.x);
    txt(c, '!', Math.round(ev.x - camX), Math.round(ev.y - camY - 22 + Math.sin(G.t * 5) * 2), '#ffd23f', 16, 'center');
    G.lights.push({ x: ev.x, y: ev.y, r: 34, col: '#5fb3ff' });
  } else if (ev.kind === 'bounty' && !ev.e.dead) {
    G.lights.push({ x: ev.e.x, y: ev.e.y, r: 26, col: '#ffd23f' });
  }
}
function eventTarget() {
  const ev = G.event;
  if (!ev) return null;
  if (ev.kind === 'capture') return [ev.x, ev.y];
  if (ev.kind === 'escort') return ev.carried ? [ev.bx, ev.by] : [ev.ax, ev.ay];
  if (ev.kind === 'encounter') return [ev.x, ev.y];
  if (ev.kind === 'bounty') return [ev.e.x, ev.e.y];
  return null;
}
function eventHud(c, x, y) {
  const ev = G.event;
  if (!ev) return false;
  let sub = ev.sub;
  if (ev.kind === 'capture') sub = 'Nel cerchio: ' + ev.prog.toFixed(1) + '/' + ev.need + 's';
  if (ev.kind === 'escort') sub = ev.carried ? 'All\'altare! Colpi: ' + ev.hits + '/3' : 'Raccogli il Rocchetto d\'Oro';
  hudPanel(c, x, y, ev.title + ' · ' + Math.max(0, ev.t).toFixed(0) + 's', sub, '#ffd23f');
  return true;
}

// --- Doni e reliquie -----------------------------------------------------------------
function relicChoices(n) {
  const pool = Object.keys(RELICS).filter(k => !owned(k));
  return pool.sort(() => Math.random() - 0.5).slice(0, n);
}
function offerRelic() {
  const ids = relicChoices(2);
  if (!ids.length) { dropPickup('chest', G.p.x, G.p.y - 20); return; }
  UI.openChoice('Una Reliquia del Multiverso', 'Scegline una: hanno trucchi che si combinano tra loro', ids.map(id => ({
    icon: RELICS[id].icon, name: RELICS[id].name, line: RELICS[id].line(), act: () => giveRelic(id),
  })));
}
function giveRelic(id) {
  if (!getP(id)) G.passives.push({ id, lvl: 1, order: G.order++, relic: true });
  recalc();
  banner('RELIQUIA: ' + RELICS[id].name.toUpperCase(), RELICS[id].line(), 2.2, '#ffd23f');
}
function offerGift(npc) {
  const opts = [
    { icon: ['heart', '#e0303a', '#5a1e24'], name: 'Un po\' di riposo', line: 'Cura completa', act: () => { const p = G.p; if (G.char.hpMode === 'anxiety') p.hp = 0; else p.hp = p.maxHp - (p.hard || 0); } },
    { icon: ['star', '#ffd23f', '#8a5a2a'], name: 'Un consiglio', line: '+1 livello subito', act: () => { G.pendingLv++; } },
  ];
  const rel = relicChoices(1)[0];
  if (rel) opts.push({ icon: RELICS[rel].icon, name: RELICS[rel].name, line: RELICS[rel].line(), act: () => giveRelic(rel) });
  UI.openChoice('Il dono di ' + CHARS[npc].name, 'Scegli cosa accettare', opts);
}

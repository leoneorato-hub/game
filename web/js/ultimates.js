'use strict';
// =============================================================================
// ULTIMATE (Alfa 4) — una mossa definitiva per personaggio, ispirata a una
// mossa vera del suo gioco. Si compra nella Merceria, si carica uccidendo,
// infliggendo e subendo danno, si usa con E (pad: Y). Ogni ultimate ha un
// "cut-in" a tutto schermo come nei picchiaduro.
// =============================================================================

const ULTS = {
  knight: {
    name: 'Urlo dell\'Abisso', col: '#d8d4ff', from: 'Hollow Knight · Abyss Shriek',
    desc: 'Tre urla del Vuoto che risalgono dall\'Abisso: enormi danni tutt\'intorno, invulnerabile.',
    dur: 1.7, start(A) { A.hits = [0.25, 0.75, 1.25]; },
    update(A, dt, p) {
      while (A.hits.length && A.k >= A.hits[0]) {
        A.hits.shift();
        aoe(p.x, p.y - 10, 165 * G.s.area, 130 * ultMul(), { kb: 220, stun: 0.6, ultSrc: true }, '#1a1220');
        fxRing(p.x, p.y - 10, 10, 180 * G.s.area, '#f2efe6', 0.45, 3);
        for (let i = 0; i < 40; i++) { const a = rnd(TAU), r = rnd(20, 160); G.fx.push({ k: 'p', x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r * 0.7, vx: 0, vy: -rnd(60, 140), life: 0.7, max: 0.7, col: Math.random() < 0.6 ? '#0b0910' : '#f2efe6', size: 2 }); }
        shake(9); sfx('boom'); G.flashW = 0.25;
      }
    },
    draw(c, A, x, y) {
      c.globalAlpha = 0.5 * Math.sin(Math.min(1, A.k / A.dur) * Math.PI);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.32 + Math.sin(G.t * 9 + i) * 0.05, L = 60 + 40 * Math.sin(A.k * 6 + i);
        c.strokeStyle = i % 2 ? '#0b0910' : '#f2efe6'; c.lineWidth = 5 - Math.abs(i - 3);
        c.beginPath(); c.moveTo(x, y - 10); c.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + Math.sin(G.t * 12 + i) * 6, y - 10 + Math.sin(a) * L * 0.5, x + Math.cos(a) * L, y - 10 + Math.sin(a) * L); c.stroke();
      }
      c.lineWidth = 1; c.globalAlpha = 1;
    },
  },
  v1: {
    name: 'Railcannon Elettrico', col: '#7ec8ff', from: 'ULTRAKILL · Electric Railcannon',
    desc: 'Carica e spara un raggio che attraversa lo schermo, poi rimbalza in fulmini a catena.',
    dur: 1.1, start(A, p) { const t = densest(p.x, p.y, 320) || nearest(p.x, p.y, 400); A.a = t ? Math.atan2(t.y - p.y, t.x - p.x) : Math.atan2(p.fy, p.fx); },
    update(A, dt, p) {
      if (A.k < 0.45) { if (Math.random() < 0.8) G.fx.push({ k: 'p', x: p.x + Math.cos(A.a) * 14 + rnd(-6, 6), y: p.y - 6 + Math.sin(A.a) * 14 + rnd(-6, 6), vx: 0, vy: 0, life: 0.2, max: 0.2, col: '#bfe4ff', size: 1 }); return; }
      if (!A.fired) {
        A.fired = true;
        const dx = Math.cos(A.a), dy = Math.sin(A.a);
        const hits = beamHit(p.x, p.y - 6, dx, dy, 680, 12, 480 * ultMul(), { kb: 300, ultSrc: true });
        for (const e of hits.slice(0, 6)) chainLightning(e.x, e.y, 4, 120, 90 * ultMul(), { ultSrc: true }, e);
        G.recoilT = 0.4; p.rx -= dx * 260; p.ry -= dy * 260;
        shake(12); sfx('boom'); G.flashW = 0.35;
      }
    },
    draw(c, A, x, y) {
      if (!A.fired) { c.strokeStyle = `rgba(126,200,255,${0.4 + 0.4 * Math.sin(G.t * 40)})`; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + Math.cos(A.a) * 640, y - 6 + Math.sin(A.a) * 640); c.stroke(); return; }
      const k = clamp(1 - (A.k - 0.45) / 0.6, 0, 1);
      const ex = x + Math.cos(A.a) * 680, ey = y - 6 + Math.sin(A.a) * 680;
      for (const [w, col] of [[18 * k, 'rgba(60,140,255,.5)'], [10 * k, '#7ec8ff'], [4 * k, '#ffffff']]) { c.strokeStyle = col; c.lineWidth = Math.max(1, w); c.beginPath(); c.moveTo(x, y - 6); c.lineTo(ex, ey); c.stroke(); }
      c.lineWidth = 1;
      light(G.p.x + Math.cos(A.a) * 120, G.p.y + Math.sin(A.a) * 120, 160 * k, '#7ec8ff');
    },
  },
  zagreus: {
    name: 'Chiamata dell\'Olimpo', col: '#ffe066', from: 'Hades · Chiamata degli Dei',
    desc: 'Il dio del tuo primo dono interviene di persona: Zeus, Poseidone, Ares, Afrodite, Demetra o Artemide.',
    dur: 2.6, start(A) { const b = G.boons.attack || G.boons.special || G.boons.cast; A.god = b ? b.god : 'zeus'; A.tick = 0; banner(GODS[A.god].name.toUpperCase() + ' RISPONDE!', ULT_GOD_LINE[A.god], 2, GODS[A.god].col); },
    update(A, dt, p) {
      const g = A.god, m = ultMul();
      A.tick -= dt;
      if (A.tick > 0) return;
      if (g === 'zeus') { A.tick = 0.12; const t = pick(foesIn(p.x, p.y, 280)); if (t) { fxBolt(t.x + rnd(-12, 12), t.y - 170, t.x, t.y, '#ffe066', 0.2); aoe(t.x, t.y, 22, 70 * m, { stun: 0.4, ultSrc: true }, '#fff2b0'); sfx('shot'); } }
      else if (g === 'poseidon') { A.tick = 0.8; aoe(p.x, p.y, 150 * G.s.area, 110 * m, { kb: 420, ultSrc: true }, '#4ac0ff'); fxRing(p.x, p.y, 20, 170, '#bfe8ff', 0.6, 4); shake(6); sfx('boom'); }
      else if (g === 'ares') { A.tick = 0.1; const a = A.k * 7; for (let i = 0; i < 3; i++) { const aa = a + i * TAU / 3, x = p.x + Math.cos(aa) * 70, y = p.y + Math.sin(aa) * 50; aoe(x, y, 22, 26 * m, { silent: true, ultSrc: true }, null); fxParticles(x, y, '#e0303a', 2, 40, 0.3); } }
      else if (g === 'aphrodite') { A.tick = 0.6; for (const e of foesIn(p.x, p.y, 220)) { e.weakT = 8; hurtEnemy(e, 45 * m, { silent: true, ultSrc: true }); } fxRing(p.x, p.y, 10, 220, '#ff7ad9', 0.6, 3); }
      else if (g === 'demeter') { A.tick = 0.5; for (const e of foesIn(p.x, p.y, 240)) { e.freezeT = Math.max(e.freezeT, e.boss ? 0.6 : 2.2); hurtEnemy(e, 40 * m, { silent: true, ultSrc: true }); } fxParticles(p.x, p.y, '#bfe8ff', 30, 200, 0.6); }
      else { A.tick = 0.3; const n = 12, off = A.k * 3; for (let i = 0; i < n; i++) { const a = off + i / n * TAU; shoot({ x: p.x, y: p.y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, r: 3, pierce: 3, dmg: 40 * m, crit: Math.random() < 0.5, critMul: 3, life: 1.2, kind: 'arrow', col: '#7aff9a', src: 'ult' }); } }
      p.ultInv = Math.max(p.ultInv || 0, g === 'poseidon' || g === 'demeter' ? 0.3 : 0.15);
    },
    draw(c, A, x, y) {
      const col = GODS[A.god].col;
      c.globalAlpha = 0.35 + 0.2 * Math.sin(G.t * 10);
      c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(x, y - 30, 9 + Math.sin(G.t * 6) * 2, 0, TAU); c.stroke(); c.lineWidth = 1;
      c.globalAlpha = 1;
      light(G.p.x, G.p.y - 20, 90, col);
    },
  },
  madeline: {
    name: 'Spinta di Badeline', col: '#ff7ad9', from: 'Celeste · Capitolo 6, "Riflesso"',
    desc: 'Badeline ti lancia: una raffica di scatti invulnerabili che attraversano i nemici, e lei scatta con te.',
    dur: 4.2, start(A, p) { A.tick = 0; p.charges = 2; },
    update(A, dt, p) {
      p.ultInv = 0.2;
      A.tick -= dt;
      if (A.tick > 0 || p.dash) return;
      A.tick = 0.42;
      const t = nearest(p.x, p.y, 260);
      const [dx, dy] = t ? norm(t.x - p.x, t.y - p.y) : [p.fx || 1, p.fy || 0];
      p.dash = { dx, dy, sp: 520, t: 0.2, dmg: 60 * ultMul(), hit: new Set(), slot: 'ult' };
      p.fx = dx; p.fy = dy;
      fxParticles(p.x, p.y, '#ff9ad9', 8, 80, 0.3);
      // Badeline scatta in diagonale opposta
      const bx = p.x - dy * 40, by = p.y + dx * 40;
      G.fx.push({ k: 'img', spr: SPR.badeline_i0 ? 'badeline_i0' : 'badeline', x: bx, y: by - 6, life: 0.35, max: 0.35 });
      beamHit(bx, by, dx, dy, 110, 10, 50 * ultMul(), { silent: true, ultSrc: true });
      fxLine(bx, by, bx + dx * 110, by + dy * 110, '#c96aff', 0.25, 3);
      sfx('shot');
    },
    draw(c, A, x, y) { c.globalAlpha = 0.25 + 0.15 * Math.sin(G.t * 20); c.fillStyle = '#ff7ad9'; c.beginPath(); c.arc(x, y - 6, 16, 0, TAU); c.fill(); c.globalAlpha = 1; light(G.p.x, G.p.y, 60, '#ff7ad9'); },
  },
  prisoner: {
    name: 'Runa dell\'Omuncolo', col: '#ff5aa8', from: 'Dead Cells · Homunculus Rune',
    desc: 'La testa-fiamma si stacca e divora i nemici uno dopo l\'altro; ogni morso ti cura.',
    dur: 7, start(A, p) { p.headless = true; A.h = { x: p.x, y: p.y - 16, bite: 0 }; },
    update(A, dt, p) {
      const h = A.h;
      const t = nearest(h.x, h.y, 260);
      const tx = t ? t.x : p.x, ty = t ? t.y : p.y - 16;
      const [nx, ny] = norm(tx - h.x, ty - h.y), d = Math.hypot(tx - h.x, ty - h.y);
      h.x += nx * Math.min(d, 320 * dt); h.y += ny * Math.min(d, 320 * dt);
      h.bite -= dt;
      if (t && d < 14 && h.bite <= 0) { h.bite = 0.2; hurtEnemy(t, 38 * ultMul(), { ultSrc: true, kb: 60, kx: nx, ky: ny }); healPlayer(G.char.hpMode === 'hp' ? 1.2 : 0); fxParticles(h.x, h.y, '#ff5aa8', 4, 60, 0.3); }
      if (Math.random() < 0.6) G.fx.push({ k: 'p', x: h.x + rnd(-3, 3), y: h.y + rnd(-3, 3), vx: 0, vy: -20, life: 0.35, max: 0.35, col: '#ff5aa8', size: 2 });
      if (A.k > A.dur - 0.05) p.headless = false;
    },
    end(A, p) { p.headless = false; },
    draw(c, A) { const h = A.h; drawSpr(c, SPR.homunculus ? 'homunculus' : 'prisoner', h.x, h.y, h.x < G.p.x); light(h.x, h.y, 40, '#ff5aa8'); },
  },
  penitent: {
    name: 'Mattutino del Guardiano', col: '#ffd27a', from: 'Blasphemous · Aubade of the Nameless Guardian',
    desc: 'Il Guardiano Senza Nome scende dal cielo e colpisce tre volte il suolo. Sei invulnerabile.',
    dur: 2.6, start(A) { A.hits = [0.7, 1.4, 2.1]; },
    update(A, dt, p) {
      p.ultInv = 0.2;
      while (A.hits.length && A.k >= A.hits[0]) {
        A.hits.shift();
        aoe(p.x, p.y - 4, 175 * G.s.area, 190 * ultMul(), { kb: 260, stun: 0.8, ultSrc: true }, '#ffd27a');
        fxRing(p.x, p.y, 14, 190, '#fff2b0', 0.5, 4);
        fxParticles(p.x, p.y, '#ffe680', 30, 220, 0.6, 2);
        shake(10); sfx('bell'); G.flashW = 0.3;
      }
    },
    draw(c, A, x, y) {
      const s = SPR.penitent_i0 || SPR.penitent;
      const k = Math.min(1, A.k / 0.4) * Math.min(1, (A.dur - A.k) / 0.3);
      const slam = A.hits.length ? Math.max(0, 1 - Math.abs(((A.k + 0.35) % 0.7) - 0.35) / 0.35) : 0;
      const sc = 3.4;
      c.globalAlpha = 0.55 * k;
      c.drawImage(goldOf(SPR.penitent_i0 ? 'penitent_i0' : 'penitent'), Math.round(x - s.w * sc / 2), Math.round(y - s.h * sc - 20 + slam * 16), s.w * sc, s.h * sc);
      c.globalAlpha = 1;
      light(G.p.x, G.p.y - 50, 140 * k, '#ffd27a');
    },
  },
  terrarian: {
    name: 'Ultimo Prisma', col: '#ffffff', from: 'Terraria · Last Prism',
    desc: 'Un fascio arcobaleno che si stringe e cresce di potenza, inseguendo i nemici più vicini.',
    dur: 5.2, start(A, p) { A.a = Math.atan2(p.fy || 0, p.fx || 1); A.tick = 0; },
    update(A, dt, p) {
      const t = densest(p.x, p.y, 300) || nearest(p.x, p.y, 380);
      if (t) { const want = Math.atan2(t.y - p.y, t.x - p.x); let d = ((want - A.a + Math.PI * 3) % TAU) - Math.PI; A.a += clamp(d, -2.2 * dt, 2.2 * dt); }
      A.tick -= dt;
      if (A.tick <= 0) { A.tick = 0.1; const ramp = Math.min(1, A.k / 2); beamHit(p.x, p.y - 8, Math.cos(A.a), Math.sin(A.a), 420, 6 + ramp * 8, (14 + ramp * 30) * ultMul(), { silent: true, ultSrc: true }); }
    },
    draw(c, A, x, y) {
      const ramp = Math.min(1, A.k / 2), cols = ['#ff4a4a', '#ffb03a', '#ffe066', '#7aff9a', '#4ac0ff', '#c96aff'];
      const ox = x + Math.cos(A.a) * 10, oy = y - 8 + Math.sin(A.a) * 10;
      const fx = x + Math.cos(A.a) * (60 + 60 * (1 - ramp)), fy = y - 8 + Math.sin(A.a) * (60 + 60 * (1 - ramp));
      cols.forEach((col, i) => { const sp = (i - 2.5) * (1 - ramp) * 0.25 + Math.sin(G.t * 8 + i) * 0.03; c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(A.a + sp) * 70, oy + Math.sin(A.a + sp) * 70); c.lineTo(fx, fy); c.stroke(); });
      const ex = x + Math.cos(A.a) * 420, ey = y - 8 + Math.sin(A.a) * 420;
      for (const [w, col] of [[(6 + 8 * ramp) * 2, 'rgba(255,255,255,.25)'], [6 + 8 * ramp, cols[Math.floor(G.t * 12) % 6]], [2 + 3 * ramp, '#ffffff']]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(fx, fy); c.lineTo(ex, ey); c.stroke(); }
      c.lineWidth = 1;
      c.fillStyle = '#ffffff'; c.fillRect(Math.round(ox) - 2, Math.round(oy) - 2, 4, 4);
      light(G.p.x + Math.cos(A.a) * 150, G.p.y + Math.sin(A.a) * 150, 150, cols[Math.floor(G.t * 6) % 6]);
    },
  },
  isaac: {
    name: 'Mega Laser', col: '#ff5a5a', from: 'The Binding of Isaac · Mega Blast',
    desc: 'Isaac spalanca la bocca: un laser gigantesco per cinque secondi, sempre nella direzione in cui ti muovi.',
    dur: 5, start(A, p) { A.a = Math.atan2(p.fy || 0, p.fx || 1); A.tick = 0; },
    update(A, dt, p) {
      if (p.moving) { const want = Math.atan2(p.my, p.mx); let d = ((want - A.a + Math.PI * 3) % TAU) - Math.PI; A.a += clamp(d, -3 * dt, 3 * dt); }
      else { const t = nearest(p.x, p.y, 300); if (t) { const want = Math.atan2(t.y - p.y, t.x - p.x); let d = ((want - A.a + Math.PI * 3) % TAU) - Math.PI; A.a += clamp(d, -1.6 * dt, 1.6 * dt); } }
      A.tick -= dt;
      if (A.tick <= 0) { A.tick = 0.1; beamHit(p.x, p.y - 8, Math.cos(A.a), Math.sin(A.a), 620, 17, 42 * ultMul(), { silent: true, ultSrc: true, kb: 40 }); }
      if (G.frame % 4 === 0) shake(2);
    },
    draw(c, A, x, y) {
      const ex = x + Math.cos(A.a) * 620, ey = y - 8 + Math.sin(A.a) * 620, w = 1 + 0.12 * Math.sin(G.t * 40);
      for (const [lw, col] of [[38 * w, 'rgba(200,20,30,.35)'], [26 * w, '#c41e2a'], [16 * w, '#ff5a5a'], [7 * w, '#ffffff']]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x + Math.cos(A.a) * 6, y - 8 + Math.sin(A.a) * 6); c.lineTo(ex, ey); c.stroke(); }
      c.lineWidth = 1;
      light(G.p.x + Math.cos(A.a) * 100, G.p.y + Math.sin(A.a) * 100, 200, '#ff3a3a');
    },
  },
};
const ULT_GOD_LINE = {
  zeus: '«Lascia fare allo zio, nipote!»', poseidon: '«Onda anomala in arrivo!»', ares: '«Che la Rovina banchetti.»',
  aphrodite: '«Nessuno resiste al mio fascino, tesoro.»', demeter: '«L\'inverno arriva per tutti.»', artemis: '«Non sbaglio mai un colpo.»',
};
const ultMul = () => 1 + G.level * 0.035;
const ultOwned = id => !!(META.ult && META.ult[id]);

function tryUltimate() {
  const p = G.p, id = G.char.id, U = ULTS[id];
  if (!U || p.ultA) return;
  if (!ultOwned(id)) { if ((G.ultHintT || 0) < G.t) { G.ultHintT = G.t + 4; fxText(p.x, p.y - 26, 'ULTIMATE: comprala nella Merceria', '#a89a88', 1.2); } return; }
  if ((p.ult || 0) < 100) { fxText(p.x, p.y - 26, 'ULTIMATE ' + Math.floor(p.ult) + '%', '#a89a88', 0.6); return; }
  p.ult = 0;
  const A = p.ultA = { id, k: 0, dur: U.dur };
  U.start?.(A, p);
  p.ultInv = Math.max(p.ultInv || 0, 0.5);
  G.cur.ultUses++;
  G.cutin = { pl: G.cur, name: U.name, col: U.col, t: 1.1, max: 1.1, spr: G.char.spr };
  bark('evo');
  sfx('evo');
}
function updateUltimate(dt) {
  const p = G.p, A = p.ultA;
  if (!A) return;
  A.k += dt;
  ULTS[A.id].update(A, dt, p);
  if (A.k >= A.dur) { ULTS[A.id].end?.(A, p); p.ultA = null; }
}
function drawUltimate(c, x, y) {
  const A = G.p.ultA;
  if (A && ULTS[A.id].draw) ULTS[A.id].draw(c, A, x, y);
}
// Cut-in: una fascia diagonale con il personaggio ingrandito e il nome della mossa
function drawCutin(c) {
  const C = G.cutin;
  if (!C) return;
  C.t -= 1 / 60;
  if (C.t <= 0) { G.cutin = null; return; }
  const k = 1 - C.t / C.max;
  const inK = Math.min(1, k / 0.18), outK = Math.min(1, C.t / 0.2);
  const a = Math.min(inK, outK);
  const y = H / 2 - 40;
  c.save();
  c.globalAlpha = 0.9 * a;
  c.fillStyle = INK; c.fillRect(0, y - 2, W, 84);
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, C.col); g.addColorStop(1, 'rgba(20,12,24,0)');
  c.fillStyle = g; c.globalAlpha = 0.55 * a; c.fillRect(0, y, W, 80);
  c.globalAlpha = a;
  for (let i = 0; i < 14; i++) { const lx = ((i * 97 + k * 1400) % (W + 100)) - 50; c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(W - lx, y + (i * 23) % 76, 30, 1); }
  const s = SPR[C.spr + '_i0'] || SPR[C.spr];
  if (s) { const sc = 2.6, sx = -40 + 140 * Math.min(1, k / 0.25) + k * 20; c.drawImage(s.img, Math.round(sx), Math.round(y + 80 - s.h * sc), s.w * sc, s.h * sc); }
  txt(c, 'ULTIMATE', 170 + k * 10, y + 14, '#efe6d2', 8);
  txt(c, C.name.toUpperCase(), 170 + k * 10, y + 28, C.col, 16);
  if (coop()) txt(c, C.pl.label, 170 + k * 10, y + 52, C.pl.col, 8);
  c.restore();
}

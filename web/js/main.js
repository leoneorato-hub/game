'use strict';
// =============================================================================
// MAIN — input (tastiera, gamepad, touch), ciclo di gioco, avvio delle run.
// =============================================================================

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');

const INPUT = {
  keys: {}, pressed: {},
  touch: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 },
  abilityTouch: false, abilityTouchEdge: false,
  pad: { x: 0, y: 0, a: false, aEdge: false, prev: {} },
};

const MOVE_KEYS = { KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };

addEventListener('keydown', e => {
  audioInit();
  if (!e.repeat) INPUT.pressed[e.code] = true;
  INPUT.keys[e.code] = true;
  const inGame = MODE === 'play' || MODE === 'panic' || MODE === 'cine';
  if (inGame && (MOVE_KEYS[e.code] || e.code === 'Space' || e.code === 'Tab')) e.preventDefault();
  if (inGame) {
    if ((e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Tab') && MODE === 'play') { UI.openPause(); e.preventDefault(); }
    return;
  }
  // Menu e overlay
  if (MODE === 'levelup') {
    const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
    if (n !== undefined) { UI.choose(n); e.preventDefault(); return; }
    if (e.code === 'KeyR') { UI.reroll(); return; }
    if (e.code === 'KeyX') { UI.skip(); return; }
  }
  if (UI.current === 's-chars') {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 8) { const id = Object.keys(CHARS)[n - 1]; UI.pickChar(id); document.querySelector(`.char-card[data-id="${id}"]`)?.focus(); return; }
  }
  const dir = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.code];
  const tag = document.activeElement?.tagName;
  if (dir && !(tag === 'INPUT' && document.activeElement.type === 'range' && dir[1] === 0)) { navMove(dir[0], dir[1]); e.preventDefault(); }
  if (e.code === 'Escape' && UI.back) { UI.back(); e.preventDefault(); }
  if ((e.code === 'Escape' || e.code === 'KeyP') && MODE === 'pause' && UI.current === 's-pause') { UI.resume(); e.preventDefault(); }
});
addEventListener('keyup', e => { INPUT.keys[e.code] = false; });
addEventListener('blur', () => { INPUT.keys = {}; if (MODE === 'play') UI.openPause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && MODE === 'play') UI.openPause(); });

// --- Touch: joystick virtuale sulla metà sinistra + pulsante abilità ------------------------
function canvasPoint(t) {
  const r = cv.getBoundingClientRect();
  return [(t.clientX - r.left) / r.width * W, (t.clientY - r.top) / r.height * H];
}
cv.addEventListener('touchstart', e => {
  audioInit();
  if (G) G.touch = true;
  document.body.classList.add('touch');
  for (const t of e.changedTouches) {
    const [x, y] = canvasPoint(t);
    if (MODE === 'panic') { INPUT.abilityTouch = true; INPUT.abilityTouchEdge = true; continue; }
    if (!INPUT.touch.active) INPUT.touch = { active: true, id: t.identifier, ox: x, oy: y, dx: 0, dy: 0 };
  }
  e.preventDefault();
}, { passive: false });
cv.addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (t.identifier !== INPUT.touch.id) continue;
    const [x, y] = canvasPoint(t);
    let dx = (x - INPUT.touch.ox) / 24, dy = (y - INPUT.touch.oy) / 24;
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    INPUT.touch.dx = dx; INPUT.touch.dy = dy;
  }
  e.preventDefault();
}, { passive: false });
const touchEnd = e => {
  for (const t of e.changedTouches) if (t.identifier === INPUT.touch.id) INPUT.touch = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  if (MODE === 'panic') INPUT.abilityTouch = false;
};
cv.addEventListener('touchend', touchEnd);
cv.addEventListener('touchcancel', touchEnd);
const tAb = document.getElementById('t-ability');
tAb.addEventListener('touchstart', e => { INPUT.abilityTouch = true; INPUT.abilityTouchEdge = true; e.preventDefault(); }, { passive: false });
tAb.addEventListener('touchend', e => { INPUT.abilityTouch = false; e.preventDefault(); }, { passive: false });
tAb.addEventListener('mousedown', () => { INPUT.abilityTouch = true; INPUT.abilityTouchEdge = true; });
tAb.addEventListener('mouseup', () => { INPUT.abilityTouch = false; });
document.getElementById('t-pause').addEventListener('click', () => { if (MODE === 'play') UI.openPause(); });

// --- Gamepad ---------------------------------------------------------------------------------
function pollPad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = [...pads].find(Boolean);
  const P = INPUT.pad;
  P.aEdge = false;
  if (!gp) { P.x = P.y = 0; P.a = false; return; }
  const dz = v => (Math.abs(v) < 0.2 ? 0 : v);
  P.x = dz(gp.axes[0] || 0) + (gp.buttons[15]?.pressed ? 1 : 0) - (gp.buttons[14]?.pressed ? 1 : 0);
  P.y = dz(gp.axes[1] || 0) + (gp.buttons[13]?.pressed ? 1 : 0) - (gp.buttons[12]?.pressed ? 1 : 0);
  const btn = i => !!gp.buttons[i]?.pressed;
  const edge = i => btn(i) && !P.prev[i];
  P.a = btn(0); P.aEdge = edge(0);
  if (MODE === 'play') {
    if (edge(9) || edge(8)) UI.openPause();
  } else if (MODE !== 'panic' && MODE !== 'cine') {
    if (edge(12)) navMove(0, -1); if (edge(13)) navMove(0, 1); if (edge(14)) navMove(-1, 0); if (edge(15)) navMove(1, 0);
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    P.stickT = (P.stickT || 0) - 1;
    if (P.stickT <= 0 && (Math.abs(ax) > 0.6 || Math.abs(ay) > 0.6)) { P.stickT = 12; Math.abs(ax) > Math.abs(ay) ? navMove(Math.sign(ax), 0) : navMove(0, Math.sign(ay)); }
    if (edge(0)) document.activeElement?.click();
    if (edge(1) && UI.back) UI.back();
    if (edge(9) && MODE === 'pause') UI.resume();
    if (MODE === 'levelup' && edge(3)) UI.reroll();
  }
  for (let i = 0; i < gp.buttons.length; i++) P.prev[i] = btn(i);
}

function moveVec() {
  let x = 0, y = 0;
  for (const [k, [dx, dy]] of Object.entries(MOVE_KEYS)) if (INPUT.keys[k]) { x += dx; y += dy; }
  x += INPUT.touch.dx + INPUT.pad.x; y += INPUT.touch.dy + INPUT.pad.y;
  const l = Math.hypot(x, y);
  if (l > 1) { x /= l; y /= l; }
  return [x, y];
}
const abilityHeld = () => !!INPUT.keys.Space || INPUT.abilityTouch || INPUT.pad.a;
const abilityPressed = () => !!INPUT.pressed.Space || INPUT.abilityTouchEdge || INPUT.pad.aEdge;

// --- Avvio run ---------------------------------------------------------------------------------
function startRun(charId, stageId) {
  if (!TILES) initTiles();
  const ch = CHARS[charId];
  G = {
    char: ch, stage: STAGES[stageId],
    p: { x: 0, y: 0, r: 5, hp: 0, maxHp: 0, invuln: 1.2, fx: 1, fy: 0, mx: 0, my: 0, moving: false, still: 0, rx: 0, ry: 0, vx: 0, vy: 0, jumpT: 0, flyHigh: 0, flyT: 0, slowT: 0 },
    t: 0, frame: 0, kills: 0, level: 1, xp: 0, xpNext: xpNeed(1), pendingLv: 0,
    weapons: [], passives: [], charms: [], boons: { attack: null, special: null, cast: null },
    enemies: [], projs: [], eprojs: [], gems: [], pickups: [], fx: [], zones: [], blocks: [], coins: [], pillars: [], flies: [], hist: [],
    dmgDealt: 0, thread: 0, straw: 0, nodes: 0, elitesKilled: 0, order: 0, spawnAcc: 0, firedElite: [],
    dmgTakenMul: 1, prayerLock: 0, shakeT: 0, hitT: 99, invertT: 0, rerolls: ch.id === 'isaac' ? 4 : 2,
    banner: null, bossE: null, won: false, over: false, touch: document.body.classList.contains('touch'),
  };
  ch.init(G.p);
  G.weapons.push({ id: ch.start, lvl: 1, t: 0.6, cdMax: 1, order: G.order++ });
  recalc();
  G.p.hp = ch.hpMode === 'anxiety' ? 0 : G.p.maxHp;
  if (ch.id === 'isaac') G.ist = isaacStats();
  G.stage.init();
  banner(G.stage.name.toUpperCase(), G.stage.tagline, 3, '#e2b04a');
  MODE = 'play';
  UI.hideAll();
}

// --- Aggiornamento ------------------------------------------------------------------------------
function update(dt) {
  const p = G.p, ch = G.char;
  G.t += dt; G.frame++;
  G.dmgTakenMul = 1; G.auraSlow = null;
  if (G.invertT > 0) G.invertT -= dt;
  if (G.shakeT > 0) G.shakeT = Math.max(0, G.shakeT - dt * 20);
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  G.hitT += dt;
  p.invuln = Math.max(0, p.invuln - dt);
  p.jumpT -= dt; p.flyHigh -= dt; if (p.slowT > 0) p.slowT -= dt;

  // Movimento
  let [mx, my] = moveVec();
  if (G.invertT > 0) { mx = -mx; my = -my; }
  p.moving = !!(mx || my);
  if (p.moving) { const [nx, ny] = norm(mx, my); p.mx = nx; p.my = ny; p.fx = nx; p.fy = ny; p.still = 0; } else p.still += dt;
  const focusing = p.focusT > 0;
  const spd = ch.speed * G.s.speed * (ch.speedMul ? ch.speedMul() : 1) * (p.flyT > 0 ? 1.6 : 1) * (p.slowT > 0 ? 0.6 : 1) * (focusing ? 0 : 1);
  if (p.dash) {
    const d = p.dash;
    p.x += d.dx * d.sp * dt; p.y += d.dy * d.sp * dt;
    if (d.dmg > 0) for (const e of enemiesIn(p.x, p.y, 14)) if (!d.hit.has(e)) { d.hit.add(e); hurtEnemy(e, d.dmg, { kx: d.dx, ky: d.dy, kb: 120, src: ch.start, slot: d.slot }); }
    d.t -= dt;
    if (d.t <= 0) {
      p.dash = null;
      if (ch.id === 'madeline' && getW('dash')?.evo) { aoe(p.x, p.y, 32 * G.s.area, 25, { src: 'dash' }, '#ff7ad9'); fxParticles(p.x, p.y, '#ff9ad9', 10, 90, 0.35); }
    }
    p.vx = 0; p.vy = 0;
  } else {
    p.vx = mx * spd; p.vy = my * spd;
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  p.x += p.rx * dt; p.y += p.ry * dt;
  p.rx -= p.rx * Math.min(1, dt * 10); p.ry -= p.ry * Math.min(1, dt * 10);
  G.stage.constrainPlayer(p);
  G.hist.push({ x: p.x, y: p.y, t: G.t, fl: p.fx < 0 });
  while (G.hist.length && G.hist[0].t < G.t - 2.5) G.hist.shift();

  ch.ability(dt, abilityHeld(), abilityPressed());
  ch.update(dt);

  GRID.build(G.enemies);
  G.silenced = G.zones.some(z => z.type === 'silence' && d2(z.x, z.y, p.x, p.y) < z.r * z.r);
  if (!G.silenced) for (const w of G.weapons) if (!w.disabled) WEAPONS[w.id].update(w, dt);
  for (const co of G.coins) co.life -= dt;
  G.coins = G.coins.filter(co => co.life > 0);

  updateProjs(dt);
  updateEnemies(dt);
  updateEProjs(dt);
  for (const z of G.zones) {
    z.t -= dt;
    if (z.type === 'fire') { z.k -= dt; if (z.k <= 0) { z.k = 0.3; for (const e of enemiesIn(z.x, z.y, z.r)) hurtEnemy(e, z.dmg, { silent: true, src: z.src, burn: z.dmg * 0.5 }); } }
  }
  G.zones = G.zones.filter(z => z.t > 0);
  updateBlocks(dt);
  G.stage.update(dt);

  if (G.unravel) {
    G.unravel.t -= dt;
    if (G.unravel.t <= 0) { G.unravel.w.disabled = false; G.unravel = null; G.pickups.forEach(k => { if (k.kind === 'unravel') k.dead = true; }); }
  }

  spawner(dt);
  events();
  updateGems(dt);
  G.thread += 0;

  for (const f of G.fx) { f.life -= dt; if (f.k === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.92; f.vy *= 0.92; } }
  G.fx = G.fx.filter(f => f.life > 0);
  G.enemies = G.enemies.filter(e => !e.dead);
  G.projs = G.projs.filter(x => !x.dead);
  G.eprojs = G.eprojs.filter(x => !x.dead);
  G.gems = G.gems.filter(x => !x.dead);
  G.pickups = G.pickups.filter(x => !x.dead);

  if (G.bossE && G.bossE.dead && !G.won && G.bossE.type !== 'cont') {
    G.won = true; G.winT = 3;
    for (const e of G.enemies) if (e.anchored && e.type === 'anchor') { e.dead = true; }
    G.arena = null; G.insideBell = false;
    if (G.unravel) { G.unravel.w.disabled = false; G.unravel = null; }
    banner('VITTORIA', ETYPES[G.bossE.type].name + ' è stato scucito', 3, '#ffd23f');
    fxParticles(G.bossE.x, G.bossE.y, '#ffd23f', 60, 200, 1.2, 2);
    shake(8); sfx('evo');
  }
  if (G.winT !== undefined && G.won) { G.winT -= dt; if (G.winT <= 0) endRun(true); }

  if (G.pendingLv > 0 && MODE === 'play' && !G.over) UI.openLevelUp();
}

function spawner(dt) {
  if (G.won) return;
  const alive = G.enemies.length;
  G.spawnAcc += dt * (1.6 + G.t / 30) * (G.spawnMul || 1) * (G.bossE ? 0.35 : 1);
  while (G.spawnAcc >= 1) {
    G.spawnAcc -= 1;
    if (alive >= 330) { G.spawnAcc = 0; break; }
    const table = G.stage.table(G.t);
    const tot = table.reduce((a, [, w]) => a + w, 0);
    let r = rnd(tot), type = table[0][0];
    for (const [t, w] of table) { r -= w; if (r <= 0) { type = t; break; } }
    const p = G.p;
    if (type === 'ticket') {
      const a = rnd(TAU);
      const [x, y] = G.stage.spawnPos(a);
      const [dx, dy] = norm(p.x - x, p.y - y);
      for (let i = 0; i < 5; i++) { const e = spawnEnemy('ticket', x - dy * i * 8, y + dx * i * 8); e.dx = dx; e.dy = dy; }
    } else if (type === 'clapper' || type === 'suitcase') {
      const a = rnd(TAU), d = rnd(110, 170);
      const [x, y] = G.stage.clampPos(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
      spawnEnemy(type, x, y);
    } else {
      const [x, y] = G.stage.spawnPos(rnd(TAU));
      spawnEnemy(type, x, y);
    }
  }
}

function events() {
  const st = G.stage;
  TIMES.elites.forEach((t, i) => {
    if (G.t >= t && !G.firedElite[i] && !G.bossE) {
      G.firedElite[i] = true;
      const [x, y] = st.spawnPos(rnd(TAU));
      spawnEnemy(st.elite, x, y);
      banner('ÉLITE: ' + ETYPES[st.elite].name.toUpperCase(), 'Sconfiggilo per aprire uno Strappo', 2.2, '#e0303a');
    }
  });
  if (G.t >= TIMES.boss && !G.bossE) {
    const [x, y] = st.spawnPos(rnd(TAU));
    G.bossE = spawnEnemy(st.boss, x, y);
    banner(ETYPES[st.boss].name.toUpperCase(), st.bossSub, 3.6, '#e0303a');
    shake(6); sfx('boom');
  }
  if (G.t >= TIMES.cont && !G.contE && !G.won) {
    const [x, y] = st.spawnPos(rnd(TAU));
    G.contE = spawnEnemy('cont', x, y);
    banner('IL CONTINUE', 'Non puoi vincere. Puoi solo scappare.', 3, '#ff5a4a');
  }
}

ETYPES.cont.draw = (c, e, x, y) => {
  const n = Math.max(0, Math.ceil(e.count ?? 10));
  c.globalAlpha = 0.9;
  txt(c, String(n), x, y - 18, '#ff5a4a', 32, 'center');
  c.globalAlpha = 1;
};

// --- Attacco di panico --------------------------------------------------------------------------
function updatePanic(dt) {
  const P = G.panic, p = G.p;
  P.t -= dt; P.ph += dt;
  P.fv += (abilityHeld() ? 2.6 : -1.9) * dt;
  P.fv = clamp(P.fv, -1.3, 1.3);
  P.fy += P.fv * dt;
  if (P.fy < 0) { P.fy = 0; P.fv = 0; } if (P.fy > 1) { P.fy = 1; P.fv = 0; }
  const boxC = 0.5 + 0.3 * Math.sin(P.ph * 1.3);
  if (Math.abs(P.fy - boxC) < P.size / 2) P.prog += dt / 3; else P.prog -= dt / 6;
  if (P.prog >= 1) {
    p.hp = 40; p.invuln = 2.5; p.panicWins++;
    MODE = 'play'; G.panic = null;
    aoe(p.x, p.y, 70, 20, { kb: 260 }, '#ff7ad9');
    banner('…OK. SONO ANCORA QUI.', p.panicWins === 1 ? 'Ora puoi trovare il passivo Accettazione' : 'Madeline', 2.2, '#ff7ad9');
  } else if (P.prog <= 0 || P.t <= 0) {
    G.panic = null;
    endRun(false, 'panic');
  }
}

// --- Ciclo ---------------------------------------------------------------------------------------
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  pollPad();
  if (G) {
    if (MODE === 'play') {
      if (G.hitStop > 0) G.hitStop -= dt;
      else update(dt * (SET.assist ? SET.speed : 1));
    } else if (MODE === 'panic') updatePanic(dt);
    else if (MODE === 'cine') {
      G.cine.t -= dt;
      if (G.cine.t <= 0) { const r = G.cine.rule; G.cine = null; MODE = 'play'; banner('RICUCITURA: ' + r.into.toUpperCase(), r.desc, 2.4, '#ffd23f'); }
    }
  }
  render(ctx);
  INPUT.pressed = {};
  INPUT.abilityTouchEdge = false;
  requestAnimationFrame(frame);
}

// --- Avvio ----------------------------------------------------------------------------------------
function boot() {
  initTiles();
  UI.initTitle();
  UI.show('s-title');
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  requestAnimationFrame(frame);
}
if (document.fonts && document.fonts.load) {
  Promise.race([Promise.all([document.fonts.load('8px "Silkscreen"'), document.fonts.load('16px "Silkscreen"')]), new Promise(r => setTimeout(r, 1500))]).then(boot, boot);
} else boot();

'use strict';
// =============================================================================
// MAIN — input (tastiera, gamepad, touch), ciclo di gioco, avvio delle run.
// =============================================================================

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');

const INPUT = {
  keys: {}, pressed: {},
  touch: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 },
  abilityTouch: false, abilityTouchEdge: false, ultTouchEdge: false,
};

const GAME_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'KeyI', 'KeyJ', 'KeyK', 'KeyL', 'KeyU', 'KeyO', 'KeyY', 'Numpad8', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad0', 'NumpadEnter', 'Enter', 'ShiftRight', 'ControlRight', 'Slash', 'Period', 'KeyQ', 'KeyE']);
const DLG_KEYS = ['Space', 'Enter', 'KeyE', 'NumpadEnter', 'KeyU', 'Numpad0'];
// direzioni dei menu per tutte le tastiere della co-op
const NAV_KEYS = { KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], KeyI: [0, -1], KeyK: [0, 1], KeyJ: [-1, 0], KeyL: [1, 0], Numpad8: [0, -1], Numpad5: [0, 1], Numpad4: [-1, 0], Numpad6: [1, 0] };

addEventListener('keydown', e => {
  audioInit();
  if (!e.repeat) INPUT.pressed[e.code] = true;
  INPUT.keys[e.code] = true;
  if (MODE === 'dialog') {
    delete INPUT.pressed[e.code];
    if (DLG_KEYS.includes(e.code)) { if (!e.repeat) advanceDialog(); e.preventDefault(); }
    if (e.code === 'Escape') { DLG.i = DLG.lines.length - 1; DLG.shown = DLG.text.length; advanceDialog(); e.preventDefault(); }
    return;
  }
  const inGame = MODE === 'play' || MODE === 'panic' || MODE === 'cine';
  if (inGame && GAME_KEYS.has(e.code)) e.preventDefault();
  if (inGame) {
    if ((e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Tab') && MODE === 'play') { UI.openPause(); e.preventDefault(); }
    return;
  }
  if (UI.current === 's-lobby' && UI.lobbyKey(e)) { e.preventDefault(); return; }
  // Menu e overlay
  if (MODE === 'choice') {
    const n = { Digit1: 0, Digit2: 1, Digit3: 2 }[e.code];
    if (n !== undefined) { document.querySelectorAll('#ch-cards .lv-card')[n]?.click(); e.preventDefault(); return; }
  }
  if ((MODE === 'levelup' || MODE === 'choice') && e.repeat) { e.preventDefault(); return; }
  if (MODE === 'levelup') {
    const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
    if (n !== undefined) { UI.choose(n); e.preventDefault(); return; }
    if (e.code === 'KeyR') { UI.reroll(); return; }
    if (e.code === 'KeyX') { UI.skip(); return; }
    if (['KeyU', 'Numpad0'].includes(e.code)) { document.activeElement?.click(); e.preventDefault(); return; }
  }
  if (UI.current === 's-chars') {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 8) { const id = Object.keys(CHARS)[n - 1]; if (UI.sel.char !== id) UI.pickChar(id); document.querySelector(`.char-card[data-id="${id}"]`)?.focus(); return; }
  }
  const dir = NAV_KEYS[e.code];
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
const tUlt = document.getElementById('t-ult');
if (tUlt) { tUlt.addEventListener('touchstart', e => { INPUT.ultTouchEdge = true; e.preventDefault(); }, { passive: false }); tUlt.addEventListener('mousedown', () => { INPUT.ultTouchEdge = true; }); }

// --- Gamepad: menu, dialoghi e pausa (il movimento in gioco passa da readInput) -----------
function padMenus() {
  for (let i = 0; i < 4; i++) {
    const P = PADS[i];
    if (!P.on) continue;
    if (MODE === 'dialog') { if (P.aEdge) { advanceDialog(); P.aEdge = false; P.ybEdge = false; } continue; }
    if (MODE === 'play') { if (P.startEdge) UI.openPause(); continue; }
    if (MODE === 'panic' || MODE === 'cine') continue;
    if (UI.current === 's-lobby') { UI.lobbyPad(i, P); continue; }
    if (P.uEdge) navMove(0, -1); if (P.dEdge) navMove(0, 1); if (P.lEdge) navMove(-1, 0); if (P.rEdge) navMove(1, 0);
    if (P.aEdge) document.activeElement?.click();
    if (P.bEdge && UI.back) UI.back();
    if (P.startEdge && MODE === 'pause') UI.resume();
    if (MODE === 'levelup' && P.ybEdge) UI.reroll();
  }
}

// Usate dalle abilità (attacco di panico ecc.): input del giocatore attivo
const curIn = () => (G && G.cur && G.cur.in) || { x: 0, y: 0, held: false, pressed: false };
const abilityHeld = () => !!curIn().held;
const abilityPressed = () => !!curIn().pressed;

// --- Avvio run ---------------------------------------------------------------------------------
// party: id del personaggio (singolo) oppure [{ char, dev }] per la co-op
const STORY20 = { elites: [300, 600, 900], boss: 1080, cont: 1320, mood: 600, moodKills: 2, horde: true };
const ENDLESS_T = { elites: [150], boss: 300, cont: Infinity, mood: 200, moodKills: 1, horde: true };
function startRun(party, stageId, mode = 'story') {
  if (!TILES) initTiles();
  if (typeof party === 'string') party = [{ char: party, dev: 'solo' }];
  G = {
    stage: STAGES[stageId], players: [], cur: null,
    t: 0, frame: 0, kills: 0, level: 1, xp: 0, xpNext: xpNeed(1), pendingLv: 0, lvQueue: [],
    enemies: [], projs: [], eprojs: [], gems: [], pickups: [], fx: [], zones: [], blocks: [],
    dmgDealt: 0, thread: 0, straw: 0, nodes: 0, elitesKilled: 0, spawnAcc: 0, firedElite: [],
    shakeT: 0, invertT: 0, banner: null, bossE: null, won: false, over: false, touch: document.body.classList.contains('touch'),
    mode, teles: [], lights: [], amb: [], evT: 45, evIdx: Math.floor(rnd(4)), event: null, spawnBoost: 1, gemsTaken: 0,
    segStart: 0, loop: 0, hordeT: 150, brkT: 6, curse: 1, center: { x: 0, y: 0 },
  };
  party.forEach((m, i) => G.players.push(makeSlot(i, m.char, m.dev)));
  const n = G.players.length;
  G.players.forEach((pl, i) => {
    loadPl(pl);
    const ch = pl.char;
    const a = n > 1 ? -Math.PI / 2 + i / n * TAU : 0;
    G.p.x = n > 1 ? Math.cos(a) * 22 : 0; G.p.y = n > 1 ? Math.sin(a) * 16 : 0; G.p.pl = pl;
    G.rerolls += (META.up.reroll || 0);
    ch.init(G.p);
    G.weapons.push({ id: ch.start, lvl: 1, t: 0.6, cdMax: 1, order: G.order++ });
    recalc();
    G.p.hp = ch.hpMode === 'anxiety' ? 0 : G.p.maxHp;
    G.p.revives = powerLvl('revival');
    if (ch.id === 'isaac') G.ist = isaacStats();
    if (ch.id === 'v1') { G.activeGun = 'revolver'; G.gunT = 2.6; }
    savePl(pl);
  });
  loadPl(G.players[0]);
  G.curse = G.s.curse || 1;
  const stg = STAGES[stageId];
  G.times = mode === 'endless' ? ENDLESS_T : mode === 'story' ? STORY20 : (stg.story ? STORY_TIMES : TIMES);
  const sc = STORY.find(x => x.id === stageId);
  G.chapter = mode === 'story' && sc ? sc.chap.toUpperCase() + ' · ' + sc.label.toUpperCase() : mode === 'endless' ? 'ENDLESS · PUNTO 1' : '';
  if (mode === 'endless') { G.order8 = endlessOrder(stageId); G.loop = 1; }
  G.stage.init();
  updateCenter();
  MODE = 'play';
  UI.hideAll();
  const ch = G.char;
  const intro = [];
  if (mode === 'endless') intro.push(...ENDLESS_INTRO.map(l => [l[0], fillVars(l[1])]));
  else if (CHAPTER_INTRO[stageId]) intro.push(['cucitrice', fillVars(CHAPTER_INTRO[stageId])]);
  if (WORLD_NATIVE[stageId] === ch.id && HOME_ARRIVE[ch.id]) intro.push(...HOME_ARRIVE[ch.id]);
  else intro.push([CHAR_SELECT[ch.id][0][0] === 'deogracias' || CHAR_SELECT[ch.id][0][0] === 'guide' ? (ch.id === 'penitent' ? 'penitent' : 'terrarian') : ch.id, pick(CHAR_ARRIVE[ch.id])]);
  if (n > 1) intro.push(...coopIntro());
  startDialog(intro, () => banner(G.stage.name.toUpperCase(), n > 1 ? n + ' giocatori · rianimate i compagni a terra restando vicini' : G.stage.tagline, 3, '#e2b04a'));
}
const segT = () => G.t - (G.segStart || 0);

// --- Aggiornamento ------------------------------------------------------------------------------
function updatePlayer(pl, dt) {
  const p = G.p, ch = G.char;
  const IN = pl.in = readInput(pl);
  G.dmgTakenMul = 1; G.auraSlow = null;
  if (G.recoilT > 0) G.recoilT -= dt; if (G.switchAnim > 0) G.switchAnim -= dt;
  if (p.castT > 0) p.castT -= dt; if (p.atk) p.atk.t -= dt;
  G.hitT += dt;
  p.invuln = Math.max(0, p.invuln - dt);
  if (p.ultInv > 0) p.ultInv -= dt;
  p.jumpT -= dt; p.flyHigh -= dt; if (p.slowT > 0) p.slowT -= dt;
  // rigenerazione della Merceria
  if (G.s.regen > 0 && ch.hpMode !== 'anxiety') {
    p.regenAcc += G.s.regen * dt * (ch.hpMode === 'hp' ? 1 : 0.02);
    if (p.regenAcc >= 1) { const n = Math.floor(p.regenAcc); p.regenAcc -= n; if (p.hp < p.maxHp - (p.hard || 0)) p.hp = Math.min(p.maxHp - (p.hard || 0), p.hp + n); }
  }

  // Movimento
  let mx = IN.x, my = IN.y;
  if (G.invertT > 0) { mx = -mx; my = -my; }
  p.moving = !!(mx || my);
  if (p.moving) { const [nx, ny] = norm(mx, my); p.mx = nx; p.my = ny; p.fx = nx; p.fy = ny; p.still = 0; } else p.still += dt;
  const focusing = p.focusT > 0;
  const inPool = G.zones.some(z => z.type === 'slowpool' && d2(z.x, z.y, p.x, p.y) < z.r * z.r * 0.5);
  const spd = ch.speed * G.s.speed * (ch.speedMul ? ch.speedMul() : 1) * (p.flyT > 0 ? 1.6 : 1) * (p.slowT > 0 || inPool ? 0.6 : 1) * (focusing ? 0 : 1) * (carrying() === pl ? 0.75 : 1);
  if (p.dash) {
    const d = p.dash;
    p.x += d.dx * d.sp * dt; p.y += d.dy * d.sp * dt;
    if (d.dmg > 0) for (const e of enemiesIn(p.x, p.y, 14)) if (!d.hit.has(e)) { d.hit.add(e); hurtEnemy(e, d.dmg, { kx: d.dx, ky: d.dy, kb: 120, src: ch.start, slot: d.slot }); }
    d.t -= dt;
    if (d.t <= 0) {
      p.dash = null;
      if (d.blast) { aoe(p.x, p.y, d.blast.r, d.blast.dmg, { kb: 120, src: ch.start }, '#ff9aa8'); fxParticles(p.x, p.y, '#ffd0d8', 6, 70, 0.25); }
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
  if (p.moving && (G.stepT = (G.stepT || 0) - dt) <= 0) { G.stepT = 0.22; G.fx.push({ k: 'p', x: p.x + rnd(-3, 3), y: p.y + 8, vx: -p.mx * 10, vy: -6, life: 0.35, max: 0.35, col: 'rgba(200,190,170,.6)', size: 2 }); }
  while (G.hist.length && G.hist[0].t < G.t - 2.5) G.hist.shift();

  ch.ability(dt, IN.held, IN.pressed);
  ch.update(dt);
  if (IN.sw && ch.id === 'v1') switchGun();
  if (IN.ult) tryUltimate();
  updateUltimate(dt);

  G.silenced = G.zones.some(z => z.type === 'silence' && d2(z.x, z.y, p.x, p.y) < z.r * z.r);
  if (ch.id === 'v1') { G.gunT -= dt; if (G.gunT <= 0) switchGun(); }
  const wdt = carrying() === pl ? dt * 0.75 : dt;
  if (!G.silenced) for (const w of G.weapons) {
    if (w.disabled) continue;
    if (ch.id === 'v1' && WEAPONS[w.id].gun && w.id !== G.activeGun) { w.t = Math.max(0, w.t - wdt); continue; }
    WEAPONS[w.id].update(w, wdt);
  }
  for (const co of G.coins) co.life -= dt;
  G.coins = G.coins.filter(co => co.life > 0);
  for (const z of G.zones) if (z.type === 'lava' && !(p.flyT > 0) && d2(z.x, z.y, p.x, p.y) < z.r * z.r * 0.4) hurtPlayer(10, null);
}

function update(dt) {
  G.t += dt; G.frame++;
  if (G.invertT > 0) G.invertT -= dt;
  if (G.shakeT > 0) G.shakeT = Math.max(0, G.shakeT - dt * 20);
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }

  GRID.build(G.enemies);
  for (const pl of G.players) {
    if (pl.down) { pl.in = readInput(pl); continue; }
    usePl(pl);
    updatePlayer(pl, dt);
    for (const z of G.zones) if (!z.pl) z.pl = pl;
  }
  usePl(leadPl());
  updateSquad(dt);
  updateCenter();

  updateProjs(dt);
  updateEnemies(dt);
  updateEProjs(dt);
  for (const z of G.zones) {
    z.t -= dt;
    if (z.type === 'fire') { z.k -= dt; if (z.k <= 0) { z.k = 0.3; const hit = () => { for (const e of enemiesIn(z.x, z.y, z.r)) hurtEnemy(e, z.dmg, { silent: true, src: z.src, burn: z.dmg * 0.5 }); }; if (coop() && z.pl && z.pl !== G.cur) withPl(z.pl, hit); else hit(); } }
  }
  G.zones = G.zones.filter(z => z.t > 0);
  updateBlocks(dt);
  G.stage.update(dt);
  updateTeles(dt);
  updateEvent(dt);
  updateAmbient(dt);
  updateProps(dt);
  G.idleBark = (G.idleBark ?? 40) - dt; if (G.idleBark <= 0) { G.idleBark = 38 + rnd(20); if (!G.bark) bark('idle'); }

  if (G.unravel) {
    G.unravel.t -= dt;
    if (G.unravel.t <= 0) { G.unravel.w.disabled = false; G.unravel = null; G.pickups.forEach(k => { if (k.kind === 'unravel') k.dead = true; }); }
  }

  spawner(dt);
  events();
  updateHordes(dt);
  updateGems(dt);

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
    shake(8); sfx('evo'); G.flashW = 0.8; G.hitStop = 0.4;
    for (const e of G.enemies) if (!e.boss && !e.prop) { e.dead = true; e.noXp = true; fxParticles(e.x, e.y, e.blood || '#fff', 3, 40, 0.3); }
    G.eprojs = []; G.teles = [];
    if (G.contE) { G.contE.dead = true; G.contE = null; }
    // tutti i giocatori a terra si rialzano
    for (const pl of G.players) if (pl.down) { pl.down = false; withPl(pl, () => { G.p.hp = G.char.hpMode === 'anxiety' ? 30 : Math.max(1, Math.ceil(G.p.maxHp * 0.4)); G.p.invuln = 2; }); }
    if (G.mode === 'endless') for (let i = 0; i < 3; i++) dropPickup(i ? 'pk_purse' : 'chest', G.bossE.x + (i - 1) * 16, G.bossE.y);
  }
  if (G.winT !== undefined && G.won) {
    G.winT -= dt;
    if (G.winT <= 0 && !G.afterWin) {
      G.afterWin = true;
      const lines = bossDefeatLines(G.bossE.type);
      bark('boss');
      if (G.mode === 'endless') { startDialog([...lines, ...endlessFragment()], () => nextLoop()); }
      else {
        const fin = G.stage.id === 'finale' && G.mode === 'story' ? ENDINGS[G.char.id] : [];
        startDialog([...lines, ...fin], () => endRun(true));
      }
    }
  }

  if (G.pendingLv > 0 && MODE === 'play' && !G.over) UI.openLevelUp();
}

function spawner(dt) {
  if (G.won) return;
  const n = G.players.length;
  const alive = G.enemies.length;
  const t = Math.min(G.t, 1500);
  const rate = 1.4 + Math.min(t, 600) / 36 + Math.max(0, t - 600) / 85;
  G.spawnAcc += dt * rate * (1 + 0.35 * (n - 1)) * (G.curse || 1) * (G.spawnMul || 1) * (G.spawnBoost || 1) * (G.bossE ? 0.15 : G.miniOn ? 0.55 : 1);
  const cap = 300 + 40 * (n - 1);
  while (G.spawnAcc >= 1) {
    G.spawnAcc -= 1;
    if (alive >= cap) { G.spawnAcc = 0; break; }
    const table = spawnTable();
    const tot = table.reduce((a, [, w]) => a + w, 0);
    let r = rnd(tot), type = table[0][0];
    for (const [tt, w] of table) { r -= w; if (r <= 0) { type = tt; break; } }
    const p = G.center;
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
      const e = spawnEnemy(type, x, y);
      // dopo il minuto 12, alcuni nemici sono "rinforzati": più grandi, più resistenti, più esperienza
      if (segT() > 720 && Math.random() < Math.min(0.25, (segT() - 720) / 2400) && !ETYPES[type].elite) { e.big = 1.3; e.hp *= 3.2; e.maxHp = e.hp; e.xp *= 4; e.dmg *= 1.3; e.armored = true; }
    }
  }
}
// Tabella dei nemici: quella del mondo, più "intrusi" da altri mondi nelle run lunghe
function spawnTable() {
  const base = G.stage.table(segT());
  const t = segT();
  if (!G.stage.world || t < 420) return base;
  if (!G.intruders || G.intrudersFor !== G.stage.id) {
    const others = Object.keys(WORLDS).filter(k => k !== G.stage.id && k !== 'finale');
    G.intruders = pick(others); G.intrudersFor = G.stage.id;
  }
  const extra = WORLDS[G.intruders].table(999).map(([k, w]) => [k, w * (t < 840 ? 0.25 : 0.5)]);
  return base.concat(extra);
}

function events() {
  const st = G.stage;
  const T = G.times;
  const t = segT();
  T.elites.forEach((et, i) => {
    if (t >= et && !G.firedElite[i] && !G.bossE) {
      G.firedElite[i] = true;
      // nella Storia da 20 minuti il mini-boss di metà run arriva da un altro mondo
      let type = st.elite;
      if (G.mode === 'story' && st.world && i === 1) { const o = WORLDS[pick(Object.keys(WORLDS).filter(k => k !== st.id && k !== 'finale'))]; type = o.mini; }
      const [x, y] = st.spawnPos(rnd(TAU));
      const el = spawnEnemy(type, x, y);
      if (i === 2) { el.hp *= 1.5; el.maxHp = el.hp; }
      const isMini = !!BOSSES[type];
      banner((isMini ? 'MINI-BOSS: ' : 'ÉLITE: ') + ETYPES[type].name.toUpperCase(), i === 1 && G.mode === 'story' ? 'Un intruso da un\'altra toppa' : 'Sconfiggilo per aprire uno Strappo', 2.4, '#e0303a');
      if (isMini) { G.titleCard = { name: ETYPES[type].name, title: 'MINI-BOSS', t: 2.2, max: 2.2, col: BOSSES[type].col }; sfx('boom'); el.wait = 1.5; }
    }
  });
  if (t >= T.boss - 30 && !G.bossWarn && !G.bossE) { G.bossWarn = true; banner('IL BOSS SI AVVICINA', 'Trenta secondi: preparati', 2.4, '#e0303a'); sfx('bell'); }
  if (t >= T.boss && !G.bossE) {
    const c = G.center;
    const [x, y] = st.spawnPos(rnd(TAU));
    const near = BOSSES[st.boss] ? G.stage.clampPos(c.x + Math.cos(rnd(TAU)) * 150, c.y + Math.sin(rnd(TAU)) * 110) : [x, y];
    G.bossE = spawnEnemy(st.boss, near[0], near[1]);
    G.bossE.wait = 1.2;
    for (const e of G.enemies) if (!e.boss && !e.elite && !e.anchored && !e.prop && d2(e.x, e.y, c.x, c.y) < 200 * 200) { e.dead = true; e.noXp = true; fxParticles(e.x, e.y, '#ffffff', 3, 40, 0.3); }
    G.eprojs = [];
    shake(6); sfx('boom'); G.flashW = 0.5;
    const def = BOSSES[st.boss];
    const title = def ? (def.title || '') : 'BOSS';
    const lines = bossIntroLines(st.boss);
    startDialog(lines, () => {
      G.titleCard = { name: ETYPES[st.boss].name, title, t: 3.2, max: 3.2, col: def?.col };
      banner('', st.bossSub, 3.6, '#e0303a');
    });
  }
  if (t >= T.cont && !G.contE && !G.won) {
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

function switchGun() {
  const guns = G.weapons.filter(w => WEAPONS[w.id].gun).map(w => w.id);
  G.gunT = 2.6;
  if (guns.length < 2) return;
  const i = guns.indexOf(G.activeGun);
  G.activeGun = guns[(i + 1) % guns.length];
  G.switchAnim = 0.25;
  G.p.style += 18;
  fxText(G.p.x, G.p.y - 20, 'SWITCH: ' + WEAPONS[G.activeGun].name.split(' ')[0].toUpperCase(), '#7ec8ff', 0.7);
  sfx('ui');
}

// --- Attacco di panico --------------------------------------------------------------------------
function updatePanic(dt) {
  const P = G.panic;
  const pl = P.pl || (P.pl = G.players.find(x => x.char.id === 'madeline' && !x.down && x.p.hp >= 99) || G.cur);
  withPl(pl, () => {
    const p = G.p;
    pl.in = readInput(pl);
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
      if (coop() || G.p.revives > 0) { MODE = 'play'; downPlayer(); }
      else endRun(false, 'panic');
    }
  });
}

// --- Ciclo ---------------------------------------------------------------------------------------
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  pollPads();
  padMenus();
  if (!G && MODE === 'dialog') updateDialog(dt);
  if (G) {
    if (MODE === 'play') {
      if (G.hitStop > 0) G.hitStop -= dt;
      else update(dt * (SET.assist ? SET.speed : 1));
    } else if (MODE === 'panic') updatePanic(dt);
    else if (MODE === 'dialog') updateDialog(dt);
    else if (MODE === 'cine') {
      G.cine.t -= dt;
      if (G.cine.t <= 0) { const r = G.cine.rule; G.cine = null; MODE = 'play'; banner('RICUCITURA: ' + r.into.toUpperCase(), r.desc, 2.4, '#ffd23f'); bark('evo'); }
    }
  }
  render(ctx);
  UI.tick(dt);
  INPUT.pressed = {};
  INPUT.abilityTouchEdge = false; INPUT.ultTouchEdge = false;
  requestAnimationFrame(frame);
}

// --- Avvio ----------------------------------------------------------------------------------------
function boot() {
  initTiles();
  document.getElementById('dlg').addEventListener('click', () => advanceDialog());
  UI.openTitle();
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  requestAnimationFrame(frame);
}
if (document.fonts && document.fonts.load) {
  Promise.race([Promise.all([document.fonts.load('8px "Silkscreen"'), document.fonts.load('16px "Silkscreen"')]), new Promise(r => setTimeout(r, 1500))]).then(boot, boot);
} else boot();

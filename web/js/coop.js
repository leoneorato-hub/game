'use strict';
// =============================================================================
// CO-OP LOCALE (Alfa 4) — da 1 a 4 giocatori sullo stesso schermo.
// Il motore è nato per un giocatore solo (G.p, G.char, G.weapons…): invece di
// riscriverlo, ogni giocatore ha uno "slot" con il proprio stato e, quando è il
// suo turno di aggiornarsi (o di subire danno, o di essere disegnato), il suo
// slot viene caricato in G. Così armi, abilità e passivi funzionano identici.
// =============================================================================

// Campi di G che appartengono al singolo giocatore
const PKEYS = ['p', 'char', 's', 'weapons', 'passives', 'charms', 'boons', 'rerolls', 'activeGun', 'gunT', 'recoilT', 'switchAnim',
  'ist', 'guilt', 'overcharmed', 'flies', 'coins', 'pillars', 'hist', 'pillsKnown', 'guppy', 'guppyAnnounced', 'flyT', 'prayerLock',
  'priedieuT', 'moonT', 'moonDone', 'order', 'barkLowT', 'bark', 'stepT', 'hitT', 'dmgBuffT', 'dmgBuff', 'auraSlow', 'dmgTakenMul', 'silenced'];

const PCOL = ['#ff5a6a', '#5fb3ff', '#7aff9a', '#ffd23f'];

// --- Dispositivi ------------------------------------------------------------------------
// 'solo' unisce tastiera completa, primo gamepad e touch (giocatore singolo).
const DEVICES = {
  solo: { ult1: 'E', name: 'Tastiera / Pad', up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], ab: ['Space'], ult: ['KeyE'], sw: ['KeyQ'], pad: 0, touch: true, hint: 'WASD/Frecce · SPAZIO abilità · E ultimate · Q cambia arma' },
  kb1: { ult1: 'E', name: 'Tastiera A', up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], ab: ['Space'], ult: ['KeyE'], sw: ['KeyQ'], hint: 'WASD · SPAZIO · E ultimate · Q' },
  kb2: { ult1: '/', name: 'Tastiera B', up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], ab: ['Enter', 'Period'], ult: ['Slash', 'Minus'], sw: ['Quote', 'Backslash'], hint: 'FRECCE · INVIO o . abilità · / o - ultimate · \' cambia arma' },
  kb3: { ult1: 'O', name: 'Tastiera C', up: ['KeyI'], down: ['KeyK'], left: ['KeyJ'], right: ['KeyL'], ab: ['KeyU'], ult: ['KeyO'], sw: ['KeyY'], hint: 'IJKL · U · O ultimate · Y' },
  kb4: { ult1: '↵', name: 'Tastierino', up: ['Numpad8'], down: ['Numpad5'], left: ['Numpad4'], right: ['Numpad6'], ab: ['Numpad0'], ult: ['NumpadEnter'], sw: ['NumpadDecimal'], hint: 'TASTIERINO 8456 · 0 · INVIO ultimate · ,' },
  pad0: { name: 'Gamepad 1', pad: 0, hint: 'Stick · A abilità · Y ultimate · X cambia arma' },
  pad1: { name: 'Gamepad 2', pad: 1, hint: 'Stick · A · Y ultimate · X' },
  pad2: { name: 'Gamepad 3', pad: 2, hint: 'Stick · A · Y ultimate · X' },
  pad3: { name: 'Gamepad 4', pad: 3, hint: 'Stick · A · Y ultimate · X' },
};
// Stato dei gamepad (aggiornato una volta per fotogramma)
const PADS = [0, 1, 2, 3].map(() => ({ x: 0, y: 0, a: false, aEdge: false, yb: false, ybEdge: false, xb: false, xbEdge: false, start: false, startEdge: false, b: false, bEdge: false, l: false, lEdge: false, r: false, rEdge: false, u: false, uEdge: false, d: false, dEdge: false, on: false, prev: {} }));
function pollPads() {
  const list = navigator.getGamepads ? [...navigator.getGamepads()] : [];
  // co-op: ogni gamepad resta legato al suo indice (se uno si scollega, gli altri non cambiano eroe)
  const real = [0, 1, 2, 3].map(i => list[i] || null);
  if (!real[0]) real[0] = list.find(Boolean) || null;
  const dz = v => (Math.abs(v) < 0.22 ? 0 : v);
  PADS.forEach((P, i) => {
    const gp = real[i];
    const btn = k => !!(gp && gp.buttons[k] && gp.buttons[k].pressed);
    const set = (name, k, val) => { const v = val !== undefined ? val : btn(k); P[name + 'Edge'] = v && !P.prev[name]; P[name] = v; P.prev[name] = v; };
    P.on = !!gp;
    if (!gp) { P.x = P.y = 0; for (const n of ['a', 'yb', 'xb', 'start', 'b', 'l', 'r', 'u', 'd']) set(n, -1, false); return; }
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    P.x = clamp(dz(ax) + (btn(15) ? 1 : 0) - (btn(14) ? 1 : 0), -1, 1);
    P.y = clamp(dz(ay) + (btn(13) ? 1 : 0) - (btn(12) ? 1 : 0), -1, 1);
    set('a', 0); set('b', 1); set('xb', 2); set('yb', 3); set('start', -1, btn(9) || btn(8));
    set('l', -1, btn(14) || ax < -0.6); set('r', -1, btn(15) || ax > 0.6); set('u', -1, btn(12) || ay < -0.6); set('d', -1, btn(13) || ay > 0.6);
    if (btn(5) || btn(4)) { const v = true; P.xbEdge = P.xbEdge || (v && !P.prev.sh); P.prev.sh = v; } else P.prev.sh = false;
  });
}
const anyKey = list => (list || []).some(k => INPUT.keys[k]);
const anyPressed = list => (list || []).some(k => INPUT.pressed[k]);

// Lettura dell'input di un giocatore: movimento, abilità (tenuta/premuta), ultimate, cambio arma
function readInput(pl) {
  const D = DEVICES[pl.dev] || DEVICES.solo;
  let x = 0, y = 0;
  if (anyKey(D.left)) x -= 1; if (anyKey(D.right)) x += 1; if (anyKey(D.up)) y -= 1; if (anyKey(D.down)) y += 1;
  let held = anyKey(D.ab), pressed = anyPressed(D.ab), ult = anyPressed(D.ult), sw = anyPressed(D.sw);
  if (D.pad !== undefined) {
    const P = PADS[D.pad];
    if (P.on) { x += P.x; y += P.y; held = held || P.a; pressed = pressed || P.aEdge; ult = ult || P.ybEdge; sw = sw || P.xbEdge; }
  }
  if (D.touch) {
    x += INPUT.touch.dx; y += INPUT.touch.dy;
    held = held || INPUT.abilityTouch; pressed = pressed || INPUT.abilityTouchEdge; ult = ult || INPUT.ultTouchEdge;
  }
  const l = Math.hypot(x, y);
  if (l > 1) { x /= l; y /= l; }
  return { x, y, held, pressed, ult, sw };
}

// --- Slot giocatore e cambio di contesto ------------------------------------------------------
function makeSlot(idx, charId, dev) {
  const ch = CHARS[charId];
  return {
    idx, dev, col: PCOL[idx], label: 'P' + (idx + 1), down: false, reviveK: 0, kills: 0, dmg: 0, ultUses: 0,
    p: { x: idx * 18 - 27 * 0, y: 0, r: 5, hp: 0, maxHp: 0, invuln: 1.2, fx: 1, fy: 0, mx: 0, my: 0, moving: false, still: 0, rx: 0, ry: 0, vx: 0, vy: 0, jumpT: 0, flyHigh: 0, flyT: 0, slowT: 0, ult: 0, revives: 0, regenAcc: 0, pl: null },
    char: ch, s: null, weapons: [], passives: [], charms: [], boons: { attack: null, special: null, cast: null },
    rerolls: (ch.id === 'isaac' ? 4 : 2), activeGun: null, gunT: 0, recoilT: 0, switchAnim: 0, ist: null, guilt: null, overcharmed: false,
    flies: [], coins: [], pillars: [], hist: [], pillsKnown: {}, guppy: false, guppyAnnounced: false, flyT: 0, prayerLock: 0, priedieuT: 60,
    moonT: 0, moonDone: false, order: 0, barkLowT: 0, bark: null, stepT: 0, hitT: 99, dmgBuffT: 0, dmgBuff: 1, auraSlow: null, dmgTakenMul: 1, silenced: false,
  };
}
// l'oggetto p di uno slot non cambia mai: non lo salvo, così un G.p temporaneo non può "sporcare" lo slot
function savePl(pl) { if (!pl) return; for (const k of PKEYS) if (k !== 'p') pl[k] = G[k]; }
function loadPl(pl) { for (const k of PKEYS) G[k] = pl[k]; G.cur = pl; }
function usePl(pl) { if (G.cur === pl) return; if (G.cur) savePl(G.cur); loadPl(pl); }
function withPl(pl, fn) {
  const prev = G.cur;
  if (prev === pl) return fn();
  usePl(pl);
  try { return fn(); } finally { usePl(prev); }
}
const alivePls = () => G.players.filter(pl => !pl.down);
const coop = () => G && G.players && G.players.length > 1;
function leadPl() { return G.players.find(pl => !pl.down) || G.players[0]; }
function nearestPl(x, y, alive = true) {
  let best = null, bd = Infinity;
  for (const pl of G.players) {
    if (alive && pl.down) continue;
    const d = d2(x, y, pl.p.x, pl.p.y);
    if (d < bd) { bd = d; best = pl; }
  }
  return best || G.players[0];
}
// Esegue fn nel contesto di ogni giocatore vivo che soddisfa test(p)
// setTimeout che ricorda di chi era il colpo (danno, statistiche e crediti al giocatore giusto)
function later(fn, ms) {
  const g = G, me = G && G.cur;
  setTimeout(() => {
    if (!G || G !== g || G.over) return;
    if (me && G.players) { if (me.down) return; withPl(me, fn); } else fn();
  }, ms);
}
function forPls(fn, test) {
  const prev = G.cur;
  for (const pl of G.players) {
    if (pl.down || (test && !test(pl.p))) continue;
    usePl(pl); fn(pl);
  }
  usePl(prev);
}

// --- Squadra: rianimazione, telecamera, separazione -------------------------------------------
function downPlayer() {
  const pl = G.cur, p = G.p;
  if (p.revives > 0) {
    p.revives--;
    p.hp = G.char.hpMode === 'anxiety' ? 0 : Math.ceil(p.maxHp * 0.5); p.invuln = 2.5;
    banner('RIANIMAZIONE', (coop() ? pl.label + ' · ' : '') + 'L\'Ago d\'Oro ricuce ' + G.char.name, 2, '#ffd23f');
    fxRing(p.x, p.y, 4, 60, '#ffd23f', 0.6, 3); sfx('evo');
    return;
  }
  if (!coop()) { endRun(false); return; }
  pl.down = true; pl.reviveK = 0; p.hp = 0; p.dash = null;
  if (p.ultA) { ULTS[p.ultA.id].end?.(p.ultA, p); p.ultA = null; }
  p.headless = false;
  fxParticles(p.x, p.y, pl.col, 30, 120, 0.8, 2); shake(6); sfx('boom');
  if (!alivePls().length) { endRun(false); return; }
  banner(pl.label + ' È A TERRA', 'Stagli vicino per ricucirlo', 2.2, pl.col);
}
function updateSquad(dt) {
  if (!coop()) return;
  // rianimazione: un compagno vivo vicino al giocatore a terra
  for (const pl of G.players) {
    if (!pl.down) continue;
    const helper = G.players.find(o => !o.down && d2(o.p.x, o.p.y, pl.p.x, pl.p.y) < 26 * 26);
    pl.reviveK = helper ? pl.reviveK + dt / 2.5 : Math.max(0, pl.reviveK - dt / 5);
    if (helper && Math.random() < 0.3) G.fx.push({ k: 'p', x: pl.p.x + rnd(-8, 8), y: pl.p.y + rnd(-8, 4), vx: 0, vy: -20, life: 0.5, max: 0.5, col: '#ffd23f', size: 1 });
    if (pl.reviveK >= 1) {
      pl.down = false; pl.reviveK = 0;
      withPl(pl, () => { const p = G.p; p.hp = G.char.hpMode === 'anxiety' ? 30 : (G.char.hpMode === 'hp' ? p.maxHp * 0.4 : Math.max(1, Math.ceil(p.maxHp * 0.4))); p.invuln = 2.5; });
      banner(pl.label + ' È DI NUOVO IN PIEDI', CHARS[pl.char.id].name + ' è stato ricucito', 1.8, pl.col);
      fxRing(pl.p.x, pl.p.y, 4, 50, pl.col, 0.6, 3); sfx('evo');
    }
  }
  // lo schermo è uno solo: i giocatori non possono allontanarsi troppo
  const live = alivePls();
  if (live.length < 2) return;
  const MW = W - 64, MH = H - 150;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const pl of live) { x0 = Math.min(x0, pl.p.x); x1 = Math.max(x1, pl.p.x); y0 = Math.min(y0, pl.p.y); y1 = Math.max(y1, pl.p.y); }
  if (x1 - x0 > MW) { const c = (x0 + x1) / 2; for (const pl of live) pl.p.x = clamp(pl.p.x, c - MW / 2, c + MW / 2); }
  if (y1 - y0 > MH) { const c = (y0 + y1) / 2; for (const pl of live) pl.p.y = clamp(pl.p.y, c - MH / 2, c + MH / 2); }
  // i giocatori a terra seguono il gruppo (vengono trascinati ai bordi)
  for (const pl of G.players) if (pl.down) { pl.p.x = clamp(pl.p.x, G.center.x - W / 2 + 24, G.center.x + W / 2 - 24); pl.p.y = clamp(pl.p.y, G.center.y - H / 2 + 70, G.center.y + H / 2 - 90); }
}
function updateCenter() {
  const live = alivePls().length ? alivePls() : G.players;
  // centro del riquadro che contiene tutti (non la media): così nessuno esce dallo schermo
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const pl of live) { x0 = Math.min(x0, pl.p.x); x1 = Math.max(x1, pl.p.x); y0 = Math.min(y0, pl.p.y); y1 = Math.max(y1, pl.p.y); }
  G.center = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 + (live.length > 1 ? 10 : 0), mx: 0, my: 0 };
  if (live.length === 1) { G.center.mx = live[0].p.mx; G.center.my = live[0].p.my; G.center.moving = live[0].p.moving; }
}

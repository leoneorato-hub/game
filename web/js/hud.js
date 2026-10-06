'use strict';
// =============================================================================
// RENDER + HUD — "Il Banco del Sarto" (GDD §5): centro libero, 4 isole di UI.
// =============================================================================

let camX = 0, camY = 0;
const FONT = '"Silkscreen", "Courier New", monospace';

function drawSpr(c, name, x, y, flip, white, scale = 1) {
  const s = SPR[name];
  if (!s) return;
  const img = white ? (flip ? s.flipWhite : s.white) : (flip ? s.flip : s.img);
  const w = s.w * scale, h = s.h * scale;
  c.drawImage(img, Math.round(x - camX - w / 2), Math.round(y - camY - h / 2), w, h);
}
function blueOf(name) { const s = SPR[name]; if (!s.blue) s.blue = tinted(s.img, '#9fdcff'); return s.blue; }

function txt(c, s, x, y, col = '#fff', size = 8, align = 'left', shadow = true) {
  c.font = size + 'px ' + FONT;
  c.textAlign = align; c.textBaseline = 'top';
  s = String(s);
  if (shadow) { c.fillStyle = INK; c.fillText(s, x + 1, y + 1); c.fillText(s, x, y + 1); c.fillText(s, x + 1, y); }
  c.fillStyle = col; c.fillText(s, x, y);
}
function tw(c, s, size = 8) { c.font = size + 'px ' + FONT; return c.measureText(String(s)).width; }

function bar(c, x, y, w, h, frac, col, bg = '#2a1f2e') {
  c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2);
  c.fillStyle = bg; c.fillRect(x, y, w, h);
  c.fillStyle = col; c.fillRect(x, y, Math.round(w * clamp(frac, 0, 1)), h);
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x, y, Math.round(w * clamp(frac, 0, 1)), 1);
}
function stitchRect(c, x, y, w, h, col) {
  c.strokeStyle = col; c.lineWidth = 1; c.setLineDash([2, 2]);
  c.lineDashOffset = -Math.floor(performance.now() / 500);
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  c.setLineDash([]); c.lineDashOffset = 0;
}
function patch(c, x, y, w, h, col = '#e2b04a') {
  c.fillStyle = 'rgba(20,14,24,.82)'; c.fillRect(x, y, w, h);
  c.fillStyle = INK; c.fillRect(x, y - 1, w, 1); c.fillRect(x, y + h, w, 1); c.fillRect(x - 1, y, 1, h); c.fillRect(x + w, y, 1, h);
  stitchRect(c, x + 2, y + 2, w - 4, h - 4, col);
}
function hudPanel(c, x, y, title, sub, col) {
  const w = Math.max(tw(c, title), tw(c, sub)) + 14;
  patch(c, x - w, y, w, 26, col);
  txt(c, title, x - w + 7, y + 5, col);
  txt(c, sub, x - w + 7, y + 15, '#efe6d2');
}

// --- Luci ------------------------------------------------------------------------------
const LC = makeCanvas(W, H), LX = LC.getContext('2d');
const GLOW = {};
function glowSprite(col) {
  if (GLOW[col]) return GLOW[col];
  const c = makeCanvas(64, 64), x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (GLOW[col] = c);
}
const HOLE = (() => { const c = makeCanvas(64, 64), x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c; })();
function applyLighting(c) {
  const dark = (G.stage.dark || 0) * (G.mood2 && G.world?.mood2?.dark !== undefined ? 1 : 1);
  if (dark <= 0.01) return;
  LX.globalCompositeOperation = 'source-over';
  LX.clearRect(0, 0, W, H);
  LX.fillStyle = `rgba(6,3,12,${dark})`; LX.fillRect(0, 0, W, H);
  LX.globalCompositeOperation = 'destination-out';
  for (const l of G.lights) {
    const x = l.x - camX, y = l.y - camY;
    if (x < -l.r || x > W + l.r || y < -l.r || y > H + l.r) continue;
    LX.drawImage(HOLE, x - l.r, y - l.r, l.r * 2, l.r * 2);
  }
  c.drawImage(LC, 0, 0);
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.22;
  for (const l of G.lights) {
    if (!l.col) continue;
    const x = l.x - camX, y = l.y - camY;
    if (x < -l.r || x > W + l.r || y < -l.r || y > H + l.r) continue;
    c.drawImage(glowSprite(l.col), x - l.r * 0.8, y - l.r * 0.8, l.r * 1.6, l.r * 1.6);
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}
const light = (x, y, r, col) => { if (G.lights.length < 220) G.lights.push({ x, y, r, col }); };

// --- Mondo ----------------------------------------------------------------------------------
function render(c) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.imageSmoothingEnabled = false;
  if (!G) { drawMenuBg(c); return; }
  const p = G.p;
  // telecamera morbida con un leggero anticipo nella direzione di marcia
  G.cam = G.cam || { x: p.x, y: p.y };
  const lead = p.moving ? 18 : 0;
  G.cam.x += (p.x + p.mx * lead - G.cam.x) * 0.12;
  G.cam.y += (p.y + p.my * lead * 0.6 - G.cam.y) * 0.12;
  let sx = 0, sy = 0;
  if (G.shakeT > 0) { sx = rnd(-G.shakeT, G.shakeT); sy = rnd(-G.shakeT, G.shakeT); }
  camX = Math.round(G.cam.x - W / 2 + sx); camY = Math.round(G.cam.y - H / 2 + sy);
  G.lights = [];

  c.fillStyle = G.stage.bg; c.fillRect(0, 0, W, H);
  G.stage.drawFloor(c);

  for (const z of G.zones) {
    const x = Math.round(z.x - camX), y = Math.round(z.y - camY);
    if (z.type === 'fire') {
      c.fillStyle = 'rgba(255,106,42,.28)'; c.beginPath(); c.arc(x, y, z.r, 0, TAU); c.fill();
      for (let i = 0; i < 3; i++) { c.fillStyle = Math.random() < 0.5 ? '#ffd23f' : '#ff6a2a'; c.fillRect(x + rnd(-z.r, z.r) * 0.7, y + rnd(-z.r, z.r) * 0.7, 2, 2); }
      light(z.x, z.y, z.r * 1.6, '#ff6a2a');
    } else if (z.type === 'silence') {
      c.fillStyle = 'rgba(70,60,90,.45)'; c.beginPath(); c.arc(x, y, z.r, 0, TAU); c.fill();
      c.strokeStyle = '#8a7aa0'; c.setLineDash([2, 3]); c.beginPath(); c.arc(x, y, z.r, 0, TAU); c.stroke(); c.setLineDash([]);
    }
  }
  drawTeles(c);
  for (const pl of G.pillars) {
    const x = Math.round(pl.x - camX), y = Math.round(pl.y - camY);
    c.fillStyle = 'rgba(255,242,176,.35)'; c.fillRect(x - 6, y - 60, 12, 66);
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x - 2, y - 60, 4, 66);
    light(pl.x, pl.y - 20, 40, '#fff2b0');
  }
  if (G.guilt) { drawSpr(c, 'guilt', G.guilt.x, G.guilt.y + Math.sin(G.t * 4) * 2, false); light(G.guilt.x, G.guilt.y, 24, '#ff6aa0'); }
  drawEvent(c);
  for (const g of G.gems) {
    const big = g.v >= 5;
    const s = SPR[(big ? 'gemb_' : 'gem_') + G.char.gem];
    const bob = g.fly ? 0 : Math.round(Math.sin(G.t * 4 + g.x) * 1);
    c.drawImage(s.img, Math.round(g.x - camX - s.w / 2), Math.round(g.y - camY - s.h / 2) + bob);
    if (big) light(g.x, g.y, 14, null);
  }
  for (const k of G.pickups) {
    const spr = k.kind === 'food' ? (G.char.id === 'isaac' ? 'heart' : 'food') : k.kind === 'unravel' ? 'yarn' : k.kind;
    const bob = Math.sin(k.t * 4) * 1.5;
    if (k.kind === 'chest') { c.fillStyle = `rgba(226,176,74,${0.25 + 0.2 * Math.sin(k.t * 6)})`; c.beginPath(); c.arc(Math.round(k.x - camX), Math.round(k.y - camY), 10, 0, TAU); c.fill(); light(k.x, k.y, 36, '#ffd23f'); }
    if (k.kind === 'unravel') { k.x += (k.vx || 0) / 60; k.y += (k.vy || 0) / 60; if (G.arena) arenaClamp(k, false); }
    if (k.kind === 'food' && G.char.noFood) c.globalAlpha = 0.45;
    drawSpr(c, spr, k.x, k.y + bob, false);
    c.globalAlpha = 1;
  }
  for (const b of G.blocks) {
    const x = Math.round(b.x - camX), y = Math.round(b.y - camY);
    c.fillStyle = INK; c.fillRect(x - 5, y - 5, 10, 10);
    c.fillStyle = '#8a6a4a'; c.fillRect(x - 4, y - 4, 8, 8);
    c.fillStyle = '#a8865e'; c.fillRect(x - 4, y - 4, 8, 2);
    c.fillStyle = '#6b4e2e'; c.fillRect(x - 1, y - 2, 1, 6);
  }
  for (const co of G.coins) {
    const s = SPR.coin_v1;
    const z = Math.sin(Math.min(1, (1.4 - co.life) / 1.4) * Math.PI) * 10;
    c.drawImage(s.img, Math.round(co.x - camX - 2), Math.round(co.y - camY - 2 - z));
    light(co.x, co.y - z, 12, '#ffd23f');
  }

  // Nemici
  for (const e of G.enemies) {
    if (e.dead || e.draw) continue;
    const s = SPR[e.spr]; if (!s) continue;
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.beginPath(); c.ellipse(Math.round(e.x - camX), Math.round(e.y - camY + s.h / 2 - 1), s.w / 2 - 1, 2, 0, 0, TAU); c.fill();
  }
  for (const e of G.enemies) {
    if (e.dead) continue;
    const x = Math.round(e.x - camX), y = Math.round(e.y - camY);
    if (x < -70 || x > W + 70 || y < -70 || y > H + 70) continue;
    if (e.draw) { e.draw(c, e, x, y); if (e.boss || e.elite) light(e.x, e.y, 46, e.def?.col || null); continue; }
    if (e.hidden) {
      const k = 1 - e.air / 0.9;
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(Math.round(e.tx - camX), Math.round(e.ty - camY), 4 + k * 6, 2 + k * 3, 0, 0, TAU); c.fill();
      continue;
    }
    if (e.elite) { c.strokeStyle = `rgba(226,176,74,${0.5 + 0.3 * Math.sin(G.t * 6)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y + 6, e.r + 4, (e.r + 4) * 0.45, 0, 0, TAU); c.stroke(); }
    const s = SPR[e.spr];
    const sc = e.big || 1;
    const flip = (e.vx || 0) < 0;
    let img = e.flash > 0 ? (flip ? s.flipWhite : s.white) : (flip ? s.flip : s.img);
    if (e.freezeT > 0) img = blueOf(e.spr);
    if (e.golden) img = goldOf(e.spr);
    const moving = Math.abs(e.vx) + Math.abs(e.vy) > 5;
    const step = moving ? Math.abs(Math.sin(e.t * 10 + e.r)) : 0;
    let w = s.w * sc * (1 + step * 0.06), h = s.h * sc * (1 - step * 0.08);
    if (e.pop > 0) { e.pop -= 1 / 60; w *= 1.18; h *= 0.88; }
    if (e.t < 0.35) { const k = e.t / 0.35; h *= k; c.globalAlpha = k; }
    const z = e.z || 0;
    c.drawImage(img, Math.round(x - w / 2), Math.round(y + s.h * sc / 2 - h - z), Math.round(w), Math.round(h));
    c.globalAlpha = 1;
    if (e.golden) { light(e.x, e.y, 30, '#ffd23f'); if (Math.random() < 0.3) fxParticles(e.x + rnd(-5, 5), e.y + rnd(-5, 5), '#fff2b0', 1, 10, 0.4); }
    if (e.link && !e.link.dead && e.linkT > 0 && e.link.x < e.x) { c.strokeStyle = 'rgba(226,176,74,.6)'; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(x, y); c.lineTo(Math.round(e.link.x - camX), Math.round(e.link.y - camY)); c.stroke(); c.setLineDash([]); }
    if (e.fuse !== undefined) { c.fillStyle = Math.sin(G.t * 30) > 0 ? '#fff' : '#ff8a2a'; c.fillRect(x - 1, y - s.h / 2 - 4, 3, 3); }
    if (e.wind > 0) { c.fillStyle = '#ff3a4a'; c.fillRect(x - 1, y - s.h / 2 - 5, 2, 3); }
    if (e.doomT > 0) txt(c, '☠', x - 3, y - s.h / 2 - 10, '#ff3a3a', 8);
    if (e.weakT > 0) { c.fillStyle = '#ff7ad9'; c.fillRect(x - 1, y - s.h / 2 - 3, 2, 2); }
    if (e.stun > 0) { c.fillStyle = '#ffd23f'; c.fillRect(x - 3 + Math.round(Math.sin(G.t * 10) * 3), y - s.h / 2 - 4, 2, 2); }
    if ((e.elite || (e.anchored && e.type === 'anchor') || e.golden) && e.hp < e.maxHp) bar(c, x - 10, y - s.h * sc / 2 - 6, 20, 2, e.hp / e.maxHp, e.golden ? '#ffd23f' : e.anchored ? '#e2b04a' : '#e0303a');
  }

  for (const w of G.weapons) WEAPONS[w.id].draw?.(w, c);
  drawPlayer(c);

  for (const pr of G.projs) {
    if (pr.dead) continue;
    const x = Math.round(pr.x - camX), y = Math.round(pr.y - camY);
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
    switch (pr.kind) {
      case 'spirit': case 'shade': {
        const a = Math.atan2(pr.vy, pr.vx), r = pr.r;
        c.save(); c.translate(x, y); c.rotate(a);
        c.fillStyle = pr.kind === 'shade' ? 'rgba(20,10,30,.9)' : 'rgba(220,232,255,.8)';
        c.beginPath(); c.moveTo(r, 0); c.lineTo(-r * 0.4, -r * 0.8); c.lineTo(-r * 2.4, 0); c.lineTo(-r * 0.4, r * 0.8); c.fill();
        c.fillStyle = pr.kind === 'shade' ? '#d08aff' : '#ffffff'; c.beginPath(); c.arc(r * 0.2, 0, r * 0.45, 0, TAU); c.fill();
        c.restore(); light(pr.x, pr.y, 34, pr.kind === 'shade' ? '#d08aff' : '#cfe0ff'); break;
      }
      case 'tear': {
        const r = pr.r;
        c.fillStyle = INK; c.beginPath(); c.arc(x, y, r + 1, 0, TAU); c.fill();
        c.fillStyle = '#7fb8ff'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        c.fillStyle = '#e0f0ff'; c.fillRect(x - 1, y - r + 1, 1, 1);
        if (G.frame % 3 === 0) light(pr.x, pr.y, 12, null); break;
      }
      case 'wave': c.fillStyle = 'rgba(226,196,106,.85)'; c.fillRect(x - 5, y - 9, 10, 14); c.fillStyle = '#fff2b0'; c.fillRect(x - 2, y - 11, 4, 16); light(pr.x, pr.y, 26, '#ffe680'); break;
      case 'boomerang': c.save(); c.translate(x, y); c.rotate(pr.rot); c.drawImage(icon('boomerang', pr.col), -5, -5); c.restore(); break;
      case 'star': drawStarSpr(c, x, y, pr.rot); light(pr.x, pr.y, 22, '#ffd23f'); break;
      case 'bee': c.drawImage(SPR.bee.img, x - 2, y - 2); break;
      case 'core': c.fillStyle = INK; c.fillRect(x - 3, y - 3, 6, 6); c.fillStyle = pr.col; c.fillRect(x - 2, y - 2, 4, 4); light(pr.x, pr.y, 16, pr.col); break;
      case 'arrow': case 'nail': { const [dx, dy] = norm(pr.vx, pr.vy); c.strokeStyle = pr.col; c.lineWidth = pr.kind === 'arrow' ? 2 : 1; c.beginPath(); c.moveTo(x - dx * 5, y - dy * 5); c.lineTo(x + dx * 2, y + dy * 2); c.stroke(); c.lineWidth = 1; break; }
      case 'beam': case 'blade': { const [dx, dy] = norm(pr.vx, pr.vy); c.strokeStyle = pr.col; c.lineWidth = 3; c.beginPath(); c.moveTo(x - dx * 8 - dy * 4, y - dy * 8 + dx * 4); c.lineTo(x + dx * 2, y + dy * 2); c.lineTo(x - dx * 8 + dy * 4, y - dy * 8 - dx * 4); c.stroke(); c.lineWidth = 1; light(pr.x, pr.y, 20, pr.col); break; }
      case 'stone': c.fillStyle = INK; c.fillRect(x - 2, y - 2, 5, 5); c.fillStyle = '#e0303a'; c.fillRect(x - 1, y - 1, 3, 3); break;
      default: c.fillStyle = INK; c.fillRect(x - pr.r, y - pr.r, pr.r * 2 + 1, pr.r * 2 + 1); c.fillStyle = pr.col; c.fillRect(x - pr.r + 1, y - pr.r + 1, pr.r * 2 - 1, pr.r * 2 - 1);
        if (pr.r >= 3) light(pr.x, pr.y, 14, pr.col);
    }
  }
  for (const b of G.eprojs) {
    if (b.dead) continue;
    const x = Math.round(b.x - camX), y = Math.round(b.y - camY);
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
    light(b.x, b.y, 16, b.col);
    if (b.kind === 'spear' || b.kind === 'pin') {
      const [dx, dy] = norm(b.vx, b.vy), L = b.kind === 'spear' ? 9 : 5;
      c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(x - dx * L, y - dy * L); c.lineTo(x + dx * 3, y + dy * 3); c.stroke();
      c.strokeStyle = b.col; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#ffffff'; c.fillRect(x + Math.round(dx * 2), y + Math.round(dy * 2), 1, 1);
      c.lineWidth = 1; continue;
    }
    if (b.kind === 'blade') { c.save(); c.translate(x, y); c.rotate(G.t * 18); c.fillStyle = INK; c.fillRect(-6, -2, 12, 4); c.fillRect(-2, -6, 4, 12); c.fillStyle = b.col; c.fillRect(-5, -1, 10, 2); c.fillRect(-1, -5, 2, 10); c.restore(); continue; }
    c.fillStyle = INK; c.beginPath(); c.arc(x, y, b.r + 1, 0, TAU); c.fill();
    c.fillStyle = b.col; c.beginPath(); c.arc(x, y, b.r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x - 1, y - b.r + 1, 1, 1);
    if (b.kind === 'note') { c.fillStyle = INK; c.fillRect(x + 1, y - 6, 1, 6); }
  }
  G.stage.drawOver?.(c);
  drawFx(c);
  drawAmbient(c);
  light(p.x, p.y, 100 + Math.sin(G.t * 3) * 3, null);
  if (G.bossE && !G.bossE.dead) light(G.bossE.x, G.bossE.y, 60, G.bossE.def?.col || null);
  applyLighting(c);
  if (G.moonT > 0) { c.fillStyle = 'rgba(160,0,20,.18)'; c.fillRect(0, 0, W, H); }
  if (G.hurtFlash > 0) G.hurtFlash -= 1 / 60; if (G.flashW > 0) G.flashW -= 1 / 30;
  if (G.hurtFlash > 0) { c.fillStyle = `rgba(255,40,60,${G.hurtFlash})`; c.fillRect(0, 0, W, H); }
  if (G.flashW > 0) { c.fillStyle = `rgba(255,255,255,${G.flashW})`; c.fillRect(0, 0, W, H); }
  if (MODE === 'dialog') { c.fillStyle = '#000'; c.fillRect(0, 0, W, 26); c.fillRect(0, H - 26, W, 26); }
  else drawHUD(c);
  if (G.titleCard) drawTitleCard(c);
  if (MODE === 'panic') drawPanic(c);
  if (MODE === 'cine') drawCine(c);
  if (G.touch) drawTouch(c);
}

function goldOf(name) { const s = SPR[name]; if (!s.gold) s.gold = tinted(s.img, '#ffd23f'); return s.gold; }

function drawTitleCard(c) {
  const T = G.titleCard;
  T.t -= 1 / 60;
  if (T.t <= 0) { G.titleCard = null; return; }
  const a = Math.min(1, T.t / 0.5, (T.max - T.t) / 0.4);
  c.globalAlpha = a;
  c.fillStyle = 'rgba(6,3,12,.55)'; c.fillRect(0, H / 2 - 44, W, 88);
  txt(c, T.title, W / 2, H / 2 - 30, '#a89a88', 8, 'center');
  txt(c, T.name.toUpperCase(), W / 2, H / 2 - 16, T.col || '#efe6d2', 32, 'center');
  const wline = Math.min(260, (T.max - T.t) * 500);
  c.fillStyle = T.col || '#e2b04a';
  c.fillRect(W / 2 - wline, H / 2 + 22, wline * 2, 1);
  c.fillRect(W / 2 - 3, H / 2 + 20, 6, 5);
  c.globalAlpha = 1;
}

function drawStarSpr(c, x, y, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.drawImage(icon('star', '#ffd23f', '#ff7ad9'), -5, -5);
  c.restore();
}

function playerFrame() {
  const p = G.p, ch = G.char;
  let name = ch.spr;
  if (ch.id === 'madeline') name = p.charges <= 0 ? 'madeline_blue' : (getW('dash')?.evo && p.charges >= 2 ? 'madeline_pink' : 'madeline');
  if (ch.id === 'prisoner') name = p.headless ? 'prisoner_headless' : (Math.floor(G.t * 8) % 2 ? 'prisoner_f2' : 'prisoner');
  if (p.moving && !p.dash) { const ph = Math.floor(G.t * 9) % 4; if (ph === 1) name += '_w1'; else if (ph === 3) name += '_w2'; }
  return name;
}

function drawHeld(c, x, y) {
  const p = G.p, ch = G.char;
  const fx = p.fx < 0 ? -1 : 1;
  const hx = x + fx * 3, hy = y - 1;
  if (ch.id === 'v1') {
    const gun = G.activeGun ? WEAPONS[G.activeGun] : null;
    if (!gun) return;
    const e = nearest(p.x, p.y, 260);
    let a = e ? Math.atan2(e.y - p.y, e.x - p.x) : (fx < 0 ? Math.PI : 0);
    if (G.switchAnim > 0) a += G.switchAnim * 20;
    const kick = (G.recoilT || 0) * 30;
    c.save(); c.translate(hx, hy); c.rotate(a); if (Math.cos(a) < 0) c.scale(1, -1);
    c.drawImage(icon('gun', gun.icon[1], gun.icon[2]), 1 - kick, -6, 12, 12);
    if (G.recoilT > 0.04) { c.fillStyle = '#fff2b0'; c.fillRect(13 - kick, -2, 3, 3); }
    c.restore();
    return;
  }
  const A = p.atk;
  if (!A || A.t <= 0) return;
  const k = 1 - A.t / A.dur;
  let ang = A.ang, off = 5;
  if (A.mode === 'swing') ang = A.ang - 1.3 + 2.6 * k;
  else if (A.mode === 'over') ang = (fx > 0 ? -2.4 : -0.7 + Math.PI) + (fx > 0 ? 2.8 : -2.8) * k;
  else if (A.mode === 'stab') off = 3 + Math.sin(k * Math.PI) * 9;
  else if (A.mode === 'spin') ang = k * TAU * 1.5;
  const img = icon(A.tpl, A.col, '#14101a');
  const s = 12 * A.sc;
  c.save(); c.translate(hx + Math.cos(ang) * off * 0.4, hy + Math.sin(ang) * off * 0.4); c.rotate(ang + 0.86);
  c.drawImage(img, -s * 0.2, -s * 0.95, s, s);
  c.restore();
}

function drawHair(c, x, y, flip, col) {
  const p = G.p;
  const head = { x: x + (flip ? 2 : -2), y: y - 9 };
  p.hairPts = p.hairPts || Array.from({ length: 6 }, () => ({ x: head.x, y: head.y }));
  const back = flip ? 1 : -1;
  let prev = head;
  p.hairPts.forEach((h, i) => {
    const tx = prev.x + back * 2.2, ty = prev.y + 1.1 + Math.sin(G.t * 6 + i) * 0.4;
    h.x += (tx - h.x) * 0.5; h.y += (ty - h.y) * 0.5;
    prev = h;
  });
  for (let i = p.hairPts.length - 1; i >= 0; i--) {
    const h = p.hairPts[i], r = 3.4 - i * 0.35;
    c.fillStyle = INK; c.beginPath(); c.arc(h.x - camX, h.y - camY, r + 1, 0, TAU); c.fill();
  }
  for (let i = p.hairPts.length - 1; i >= 0; i--) {
    const h = p.hairPts[i], r = 3.4 - i * 0.35;
    c.fillStyle = col; c.beginPath(); c.arc(h.x - camX, h.y - camY, r, 0, TAU); c.fill();
  }
}

function drawPlayer(c) {
  const p = G.p;
  const ch = G.char;
  const name = playerFrame();
  const flip = p.fx < 0;
  const blink = p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0 && !p.dash;
  const s = SPR[name];
  const breathe = !p.moving && Math.sin(G.t * 3) > 0.6 ? 1 : 0;
  const lift = (p.jumpT > 0 ? 8 : 0) + (p.flyHigh > 0 ? Math.sin((0.9 - p.flyHigh) / 0.9 * Math.PI) * 40 : 0) + (p.castT > 0 ? 2 : 0);
  const x = Math.round(p.x - camX), y = Math.round(p.y - camY);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, y + s.h / 2 - 1, 7, 2, 0, 0, TAU); c.fill();
  if (p.flyT > 0) { c.fillStyle = `rgba(255,210,63,${0.25 + 0.15 * Math.sin(G.t * 12)})`; c.beginPath(); c.arc(x, y - 2, 13, 0, TAU); c.fill(); light(p.x, p.y, 50, '#ffd23f'); }
  if (p.tientoT > 0) { c.strokeStyle = '#c9a43a'; c.setLineDash([1, 2]); c.beginPath(); c.arc(x, y, 15, 0, TAU); c.stroke(); c.setLineDash([]); }
  if (G.auraSlow) { c.strokeStyle = 'rgba(255,242,176,.5)'; c.beginPath(); c.arc(x, y, G.auraSlow.r, 0, TAU); c.stroke(); light(p.x, p.y, G.auraSlow.r, '#fff2b0'); }
  if (p.focusT > 0) {
    const k = p.focusT;
    c.strokeStyle = `rgba(255,255,255,${0.4 + 0.5 * k})`; c.beginPath(); c.arc(x, y, 16 - 10 * k, 0, TAU); c.stroke();
    if (G.frame % 2 === 0) { const a = rnd(TAU); G.fx.push({ k: 'p', x: p.x + Math.cos(a) * 18, y: p.y + Math.sin(a) * 18, vx: -Math.cos(a) * 40, vy: -Math.sin(a) * 40, life: 0.4, max: 0.4, col: '#ffffff', size: 1 }); }
    light(p.x, p.y, 40 + 20 * k, '#ffffff');
  }
  if (ch.id === 'zagreus') { const b = G.boons.attack || G.boons.special || G.boons.cast; if (b) { const col = GODS[b.god].col; c.strokeStyle = col; c.globalAlpha = 0.35 + 0.2 * Math.sin(G.t * 5); c.beginPath(); c.ellipse(x, y + s.h / 2 - 1, 10, 3, 0, 0, TAU); c.stroke(); c.globalAlpha = 1; light(p.x, p.y, 30, col); } }
  if (p.dash) { for (let i = 1; i <= 3; i++) { c.globalAlpha = 0.35 / i; c.drawImage(flip ? s.flip : s.img, x - s.w / 2 - p.dash.dx * 7 * i, y - s.h / 2 - p.dash.dy * 7 * i); } c.globalAlpha = 1; }
  if (!blink) {
    if (ch.id === 'madeline') drawHair(c, p.x, p.y + breathe - lift, flip, p.charges <= 0 ? '#5fb3ff' : (getW('dash')?.evo && p.charges >= 2 ? '#ff7ad9' : '#d1343a'));
    const sqx = p.dash ? 1.15 : 1, sqy = p.dash ? 0.88 : 1;
    const dw = Math.round(s.w * sqx), dh = Math.round(s.h * sqy);
    c.drawImage(flip ? s.flip : s.img, x - Math.floor(dw / 2), y + Math.floor(s.h / 2) - dh + breathe - lift, dw, dh);
    if (ch.id === 'isaac') {
      const hx = x - Math.floor(s.w / 2) + 1, hy = y - Math.floor(s.h / 2) - lift;
      if (owned('brimstone')) c.drawImage(SPR.acc_horns.img, hx + 2, hy - 2);
      if (G.guppy) c.drawImage(SPR.acc_ears.img, hx + 2, hy - 1);
      if (owned('innereye')) c.drawImage(SPR.acc_eye3.img, hx + 5, hy + 1);
      if (owned('onion')) c.drawImage(SPR.acc_cry.img, hx + 2, hy + 8);
    }
    if (ch.id === 'prisoner' && !p.headless) light(p.x, p.y - 12, 34, '#3fc8b8');
    if (ch.id === 'v1') light(p.x, p.y - 10, 20, '#ffd23f');
    drawHeld(c, x, y - lift);
    if (p.castT > 0) {
      const col = p.castCol || '#cfe0ff';
      c.strokeStyle = col; c.globalAlpha = p.castT * 2;
      c.beginPath(); c.arc(x, y - s.h / 2 - 6, 5 + (1 - p.castT) * 6, 0, TAU); c.stroke();
      c.globalAlpha = 1;
      light(p.x, p.y - 14, 30, col);
    }
    if (ch.id === 'zagreus' && p.moving && Math.random() < 0.4) fxParticles(p.x + rnd(-3, 3), p.y + 7, '#ff8a2a', 1, 15, 0.3);
  }
  if (G.overcharmed) { c.fillStyle = '#e0303a'; c.fillRect(x - 1, y - s.h / 2 - 6, 3, 3); }
}

function drawFx(c) {
  for (const f of G.fx) {
    const a = clamp(f.life / f.max, 0, 1);
    if (f.k === 'p') { c.fillStyle = f.col; c.globalAlpha = a; c.fillRect(Math.round(f.x - camX), Math.round(f.y - camY), f.size, f.size); }
    else if (f.k === 'ring') { c.globalAlpha = a; c.strokeStyle = f.col; c.lineWidth = f.w; c.beginPath(); c.arc(Math.round(f.x - camX), Math.round(f.y - camY), f.r0 + (f.r1 - f.r0) * (1 - a), 0, TAU); c.stroke(); }
    else if (f.k === 'arc') { c.globalAlpha = a; c.strokeStyle = f.col; c.lineWidth = f.w; c.beginPath(); c.arc(Math.round(f.x - camX), Math.round(f.y - camY), f.r, f.ang - f.half, f.ang + f.half); c.stroke(); }
    else if (f.k === 'line') { c.globalAlpha = a; c.strokeStyle = f.col; c.lineWidth = f.w; c.beginPath(); c.moveTo(Math.round(f.x1 - camX), Math.round(f.y1 - camY)); c.lineTo(Math.round(f.x2 - camX), Math.round(f.y2 - camY)); c.stroke(); }
    else if (f.k === 'bolt') { c.globalAlpha = a; c.strokeStyle = f.col; c.lineWidth = 1; c.beginPath(); f.pts.forEach(([x, y], i) => i ? c.lineTo(x - camX, y - camY) : c.moveTo(x - camX, y - camY)); c.stroke(); }
    else if (f.k === 'blood') { c.globalAlpha = a; c.fillStyle = f.col; const k = 1 - a; c.fillRect(Math.round(f.x + (G.p.x - f.x) * k - camX), Math.round(f.y + (G.p.y - f.y) * k - camY), 2, 2); }
    else if (f.k === 'ghost') { c.globalAlpha = a * 0.4; c.fillStyle = f.e.def?.col || '#fff'; c.beginPath(); c.ellipse(Math.round(f.x - camX), Math.round(f.y - camY), f.e.r, f.e.r * 1.2, 0, 0, TAU); c.fill(); }
    else if (f.k === 'text') { c.globalAlpha = Math.min(1, a * 2); txt(c, f.txt, Math.round(f.x - camX), Math.round(f.y - camY - (1 - a) * 10), f.col, f.big ? 16 : 8, 'center'); }
  }
  c.globalAlpha = 1; c.lineWidth = 1;
}

// --- HUD -----------------------------------------------------------------------------------
const RING = { x: 42, y: H - 42, r: 31 };
function slotPos(i, n) {
  const max = Math.max(n, 3);
  const a0 = -190, a1 = 15;
  const a = (a0 + (a1 - a0) * (max === 1 ? 0.5 : i / (max - 1))) * Math.PI / 180;
  return [RING.x + Math.cos(a) * RING.r, RING.y + Math.sin(a) * RING.r];
}

function drawHUD(c) {
  const p = G.p, ch = G.char;
  // A — Filo dell'esperienza
  const fr = G.xp / G.xpNext;
  const x0 = 6, x1 = W - 6, len = x1 - x0;
  c.fillStyle = 'rgba(20,14,24,.7)'; c.fillRect(0, 0, W, 9);
  c.fillStyle = '#4a3a2a'; for (let i = x0; i < x1; i += 4) c.fillRect(i, 4, 2, 1);
  const fx = x0 + Math.round(len * fr);
  c.fillStyle = '#e2b04a'; for (let i = x0; i < fx; i += 4) c.fillRect(i, 3, 3, 2);
  c.fillStyle = '#c9ced8'; c.fillRect(fx, 1, 1, 6); c.fillRect(fx - 1, 1, 3, 1);
  txt(c, 'LV ' + G.level, 6, 11, '#e2b04a');
  if (G.chapter) txt(c, G.chapter, 6, 21, '#a89a88');

  // B — Spoletta / timer
  const t = G.t;
  txt(c, fmtTime(t), W / 2, 12, t > G.times.cont - 10 ? '#ff5a4a' : '#efe6d2', 16, 'center');
  const spoolFrac = clamp(1 - t / G.times.cont, 0, 1);
  const sxp = W / 2 - 40;
  c.fillStyle = '#8c6a2f'; c.fillRect(sxp - 3, 13, 7, 2); c.fillRect(sxp - 3, 25, 7, 2);
  c.fillStyle = t > G.times.boss ? '#e0303a' : '#e2b04a'; const sh = Math.round(10 * spoolFrac); c.fillRect(sxp - 2, 25 - sh, 5, sh);
  let next = '';
  if (!G.bossE && !G.won) {
    const el = G.times.elites.find(x => x > t);
    if (el !== undefined && el < G.times.boss) next = 'ÉLITE tra ' + fmtTime(el - t);
    else if (t < G.times.boss) next = 'BOSS tra ' + fmtTime(G.times.boss - t);
  } else if (G.bossE && !G.bossE.dead && t < G.times.cont) next = 'IL CONTINUE tra ' + fmtTime(G.times.cont - t);
  if (next) txt(c, next, W / 2, 30, '#a89a88', 8, 'center');

  // C — Contatori
  let cx = W - 6;
  const kills = '☠ ' + G.kills;
  txt(c, kills, cx, 12, '#efe6d2', 8, 'right');
  if (G.straw) txt(c, 'FRAGOLE ' + G.straw, cx - tw(c, kills) - 10, 12, '#ff7a8a', 8, 'right');
  txt(c, 'FILO ' + Math.floor(G.thread), cx, 22, '#e2b04a', 8, 'right');

  // Barra del boss
  const B = G.bossE;
  if (B && !B.dead && B.type !== 'cont') {
    const bw = 280, bx = W / 2 - bw / 2;
    txt(c, ETYPES[B.type].name.toUpperCase(), W / 2, 42, '#efe6d2', 8, 'center');
    bar(c, bx, 52, bw, 5, B.hp / B.maxHp, '#c41e2a');
    let tag = '';
    if (B.type === 'capo') tag = B.stunT > 0 ? 'STORDITO: DANNO PIENO' : 'DANNO RIDOTTO −90%';
    if (B.type === 'spola') { const a = B.anchors.filter(x => !x.dead).length; tag = a ? 'ROCCHETTI-ANCORA: ' + a + ' (si rigenera)' : 'ANCORE DISTRUTTE'; }
    if (B.type === 'bronzo') tag = B.state === 'inside' ? 'CUORE ESPOSTO ×3' : B.state === 'lift' ? 'SI SOLLEVA!' : 'BRONZO: DANNO −50%';
    if (tag) txt(c, tag, W / 2, 59, '#e2b04a', 8, 'center');
    if (B.type === 'bronzo') bar(c, bx + 60, 69, bw - 120, 2, B.res || 0, '#d9a83a');
  }
  if (B && B.type === 'cont' && !B.dead) txt(c, 'IL CONTINUE · ' + Math.ceil(B.count ?? 10), W / 2, 44, '#ff5a4a', 16, 'center');

  // E — Pannello di contesto
  if (!eventHud(c, W - 6, 36)) G.stage.hud?.(c, W - 6, 36);

  // F — Anello del Telaio
  drawRing(c);
  // G — Risorse native
  drawResources(c, 84, H - 50);
  // H — Passivi
  drawPassives(c, 84, H - 14);

  // Isaac: le 6 statistiche sul bordo sinistro, come nell'originale
  if (ch.id === 'isaac' && G.ist) {
    const s = G.ist;
    const rows = [['DMG', s.dmg * s.dmgMul], ['LACR', s.realTears], ['GITT', s.range], ['V.COL', s.shot], ['VEL', s.speed], ['FORT', s.luck]];
    rows.forEach(([k, v], i) => { txt(c, k, 4, 110 + i * 10, '#a89a88'); txt(c, v.toFixed(2), 34, 110 + i * 10, '#efe6d2'); });
  }

  // Indicatori fuori schermo
  const marks = [];
  for (const e of G.enemies) if (!e.dead && (e.elite || (e.boss && e.type !== 'anchor'))) marks.push([e.x, e.y, '#e0303a']);
  for (const k of G.pickups) if (k.kind === 'chest' || k.kind === 'unravel' || k.kind === 'priedieu') marks.push([k.x, k.y, k.kind === 'priedieu' ? '#e2c46a' : '#e2b04a']);
  if (G.guilt) marks.push([G.guilt.x, G.guilt.y, '#ff6aa0']);
  const et = eventTarget(); if (et) marks.push([et[0], et[1], '#ffd23f']);
  for (const [mx, my, col] of marks) {
    const sx = mx - camX, sy = my - camY;
    if (sx > 0 && sx < W && sy > 0 && sy < H) continue;
    const [dx, dy] = norm(sx - W / 2, sy - H / 2);
    const k = Math.min((W / 2 - 14) / Math.abs(dx || 1e-6), (H / 2 - 14) / Math.abs(dy || 1e-6));
    const ax = W / 2 + dx * k, ay = H / 2 + dy * k;
    c.save(); c.translate(ax, ay); c.rotate(Math.atan2(dy, dx));
    c.fillStyle = INK; c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -5); c.lineTo(-4, 5); c.fill();
    c.fillStyle = col; c.beginPath(); c.moveTo(4, 0); c.lineTo(-3, -3); c.lineTo(-3, 3); c.fill();
    c.restore();
  }

  // Stati che il giocatore deve vedere subito
  if (G.silenced) txt(c, 'SILENZIO — LE TUE ARMI TACCIONO', W / 2, H - 70, '#c9a6ff', 8, 'center');
  if (G.invertT > 0) txt(c, 'COMANDI INVERTITI ' + G.invertT.toFixed(1), W / 2, H - 80, '#d9a83a', 8, 'center');
  if (G.overcharmed) txt(c, 'SOVRACCARICO: DANNO SUBITO ×2', W / 2, H - 90, '#e0303a', 8, 'center');

  // Vignetta cucita (pericolo)
  let danger = 0;
  if (ch.hpMode === 'anxiety') danger = p.hp / 100;
  else danger = 1 - p.hp / p.maxHp;
  if ((ch.hpMode === 'anxiety' && danger > 0.7) || (ch.hpMode !== 'anxiety' && danger > 0.66)) {
    c.globalAlpha = 0.5 + 0.4 * Math.sin(G.t * 6);
    stitchRect(c, 3, 3, W - 6, H - 6, '#e0303a');
    stitchRect(c, 6, 6, W - 12, H - 12, '#e0303a');
    c.globalAlpha = 1;
  }

  // Annunci
  if (G.banner) {
    const b = G.banner, a = Math.min(1, b.t / 0.3, (b.max - b.t) / 0.15 + 0.2);
    c.globalAlpha = clamp(a, 0, 1);
    const w = Math.max(tw(c, b.txt, 16), tw(c, b.sub, 8)) + 24;
    patch(c, W / 2 - w / 2, 78, w, b.sub ? 34 : 24, b.col);
    txt(c, b.txt, W / 2, 83, b.col, 16, 'center');
    if (b.sub) txt(c, b.sub, W / 2, 101, '#efe6d2', 8, 'center');
    c.globalAlpha = 1;
  }
}

function drawRing(c) {
  const ch = G.char;
  const n = ch.maxW;
  // portrait
  c.fillStyle = INK; c.beginPath(); c.arc(RING.x, RING.y, 17, 0, TAU); c.fill();
  c.fillStyle = '#2a1f2e'; c.beginPath(); c.arc(RING.x, RING.y, 16, 0, TAU); c.fill();
  if (ch.id === 'knight') {
    const f = G.p.soul / 99;
    c.save(); c.beginPath(); c.arc(RING.x, RING.y, 15, 0, TAU); c.clip();
    c.fillStyle = '#e8ecf2'; c.fillRect(RING.x - 16, RING.y + 15 - 30 * f, 32, 30 * f);
    c.restore();
    c.strokeStyle = '#6b7085'; for (const k of [1 / 3, 2 / 3]) { const yy = RING.y + 15 - 30 * k; c.beginPath(); c.moveTo(RING.x - 14, yy + 0.5); c.lineTo(RING.x - 9, yy + 0.5); c.stroke(); }
  }
  stitchRect(c, RING.x - 16, RING.y - 16, 32, 32, '#e2b04a');
  const s = SPR[ch.id === 'madeline' && G.p.charges <= 0 ? 'madeline_blue' : ch.spr];
  c.drawImage(s.img, RING.x - s.w, RING.y - s.h + 4, s.w * 2, s.h * 2);
  // Fili delle sinergie
  const pos = {};
  G.weapons.forEach((w, i) => { pos[w.id] = slotPos(i, n); });
  for (const sy of SYN) {
    if (sy.char !== ch.id && sy.char !== '*') continue;
    const pa = pos[sy.a], pb = pos[sy.b];
    if (!owned(sy.a) || !owned(sy.b)) continue;
    const A = pa || passivePos(sy.a), Bp = pb || passivePos(sy.b);
    if (!A || !Bp) continue;
    c.strokeStyle = synColor(sy.name); c.lineWidth = 1;
    c.setLineDash(pa && pb ? [] : [2, 2]);
    c.beginPath(); c.moveTo(A[0], A[1]); c.quadraticCurveTo(RING.x, RING.y - 4, Bp[0], Bp[1]); c.stroke(); c.setLineDash([]);
  }
  for (const r of EVOS) {
    if (r.char !== ch.id || !evoReady(r)) continue;
    const A = pos[r.w]; if (!A) continue;
    c.strokeStyle = `rgba(255,210,63,${0.6 + 0.4 * Math.sin(G.t * 8)})`; c.lineWidth = 2;
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(RING.x, RING.y); c.stroke(); c.lineWidth = 1;
  }
  // Slot armi
  for (let i = 0; i < n; i++) {
    const [x, y] = slotPos(i, n);
    const w = G.weapons[i];
    c.fillStyle = INK; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill();
    c.fillStyle = w ? '#2a1f2e' : 'rgba(42,31,46,.6)'; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill();
    if (!w) { c.strokeStyle = '#5a4a5e'; c.setLineDash([1, 2]); c.beginPath(); c.arc(x, y, 5, 0, TAU); c.stroke(); c.setLineDash([]); continue; }
    const d = WEAPONS[w.id];
    const col = d.tiers ? TIERS[w.lvl - 1].c : d.icon[1];
    c.drawImage(icon(d.icon[0], w.evo ? '#ffd23f' : col, d.icon[2]), Math.round(x - 5), Math.round(y - 5));
    if (w.cdMax > 0.35 && w.t > 0) {
      const f = clamp(w.t / w.cdMax, 0, 1);
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1;
      c.beginPath(); c.arc(x, y, 7.5, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - f)); c.stroke();
    }
    if (d.prayer) { const f = clamp(G.p.fervour / prayerCost(w), 0, 1); c.strokeStyle = f >= 1 ? '#5fb3ff' : 'rgba(95,179,255,.5)'; c.beginPath(); c.arc(x, y, 7.5, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke(); }
    const max = d.max;
    if (max > 1) for (let k = 0; k < max; k++) {
      const a = Math.PI * 0.75 + (k / (max - 1)) * Math.PI * 0.5 - Math.PI;
      const px = x + Math.cos(a + Math.PI) * 10, py = y + Math.sin(a + Math.PI) * 10;
      c.fillStyle = k < w.lvl ? (w.evo || w.lvl >= max ? '#ffd23f' : '#efe6d2') : '#3a2f3e';
      c.fillRect(Math.round(px), Math.round(py), 1, 1);
    }
    if (w.evo) { c.strokeStyle = '#ffd23f'; c.beginPath(); c.arc(x, y, 8.5, 0, TAU); c.stroke(); }
    if (d.gun && G.char.id === 'v1') { if (G.activeGun === w.id) { c.strokeStyle = '#7ec8ff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 9.5, 0, TAU); c.stroke(); c.lineWidth = 1; } else { c.fillStyle = 'rgba(20,14,24,.55)'; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill(); } }
    if (w.disabled || G.silenced) { c.strokeStyle = '#e0303a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 5, y - 5); c.lineTo(x + 5, y + 5); c.stroke(); c.lineWidth = 1; }
    if (d.slot && G.boons[d.slot]) { const g = GODS[G.boons[d.slot].god]; c.fillStyle = INK; c.fillRect(x + 3, y - 9, 5, 5); c.fillStyle = g.col; c.fillRect(x + 4, y - 8, 3, 3); }
  }
}
function synColor(name) { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return ['#5fb3ff', '#ff7ad9', '#7aff9a', '#ffd23f', '#ff8a5a', '#c9a6ff'][h % 6]; }
function passivePos(id) {
  const list = passiveList();
  const i = list.findIndex(p => p.id === id);
  if (i < 0) return null;
  return [84 + (i % 26) * 12 + 5, H - 14 - Math.floor(i / 26) * 12 + 5];
}
function passiveList() { return [...G.passives, ...G.charms]; }

function drawPassives(c, x, y) {
  passiveList().forEach((it, i) => {
    const d = PASSIVES[it.id];
    const px = x + (i % 26) * 12, py = y - Math.floor(i / 26) * 12;
    if (d.relic) { c.fillStyle = '#ffd23f'; c.fillRect(px - 1, py - 1, 12, 12); }
    c.drawImage(icon(d.icon[0], d.icon[1], d.icon[2]), px, py);
    if (d.max > 1 && d.max < 99) { c.fillStyle = it.lvl >= d.max ? '#ffd23f' : '#efe6d2'; for (let k = 0; k < it.lvl; k++) c.fillRect(px + k * 2, py + 11, 1, 1); }
    if (d.charm) { c.fillStyle = G.overcharmed ? '#e0303a' : '#9aa6b8'; c.fillRect(px + 9, py, 2, 2); }
  });
}

function drawResources(c, x, y) {
  const p = G.p, ch = G.char;
  const key = G.touch ? '' : '[SPAZIO] ';
  switch (ch.id) {
    case 'knight': {
      for (let i = 0; i < p.maxHp; i++) {
        const mx = x + i * 10, full = i < p.hp;
        c.fillStyle = INK; c.fillRect(mx, y + 1, 8, 9);
        c.fillStyle = full ? '#f2efe6' : '#3a3550'; c.fillRect(mx + 1, y + 2, 6, 7); c.fillRect(mx, y, 2, 3); c.fillRect(mx + 6, y, 2, 3);
        if (full) { c.fillStyle = INK; c.fillRect(mx + 2, y + 4, 1, 2); c.fillRect(mx + 5, y + 4, 1, 2); }
      }
      txt(c, 'ANIMA ' + Math.floor(p.soul) + '/99', x, y + 13, '#e8ecf2');
      const used = G.charms.reduce((a, cc) => a + PASSIVES[cc.id].charm, 0);
      txt(c, 'TACCHE ' + used + '/' + p.notches, x + 84, y + 13, G.overcharmed ? '#e0303a' : '#9aa6b8');
      txt(c, key + 'FOCUS' + (p.soul >= 33 ? '' : ' (33 Anima)'), x, y + 23, p.soul >= 33 && p.hp < p.maxHp ? '#ffffff' : '#6b6577');
      break;
    }
    case 'v1': {
      const w = 100;
      bar(c, x, y + 2, w, 6, p.hp / p.maxHp, '#e0303a');
      if (p.hard > 0) { const hx = x + Math.round(w * (1 - p.hard / p.maxHp)); c.fillStyle = '#5a1e24'; c.fillRect(hx, y + 2, x + w - hx, 6); c.fillStyle = '#e0303a'; for (let i = hx; i < x + w; i += 3) c.fillRect(i, y + 2, 1, 6); }
      txt(c, Math.ceil(p.hp) + '/' + p.maxHp, x + w + 4, y + 1, '#efe6d2');
      for (let i = 0; i < 3; i++) bar(c, x + i * 18, y + 12, 15, 3, i < p.stam ? 1 : (i === Math.floor(p.stam) ? p.stamT / 1.1 : 0), '#7ec8ff');
      const rk = Math.min(7, Math.floor(p.style / 100));
      const RANKS = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'ULTRAKILL'];
      const RC = ['#7ec8ff', '#7aff9a', '#ffd23f', '#ff8a2a', '#e0303a', '#e0303a', '#e0303a', '#ffd23f'];
      txt(c, RANKS[rk], x + 160, y - 4, RC[rk], 16);
      bar(c, x + 160, y + 13, 60, 2, (p.style % 100) / 100, RC[rk]);
      txt(c, 'XP ×' + (1 + rk * 0.12).toFixed(2), x + 160, y + 18, '#a89a88');
      txt(c, key + 'SCATTO · [Q] CAMBIA ARMA · SOLO SANGUE CURA', x, y + 23, '#6b6577');
      break;
    }
    case 'zagreus': {
      bar(c, x, y + 2, 100, 6, p.hp / p.maxHp, '#c41e2a');
      txt(c, Math.ceil(p.hp) + '/' + p.maxHp, x + 104, y + 1, '#efe6d2');
      for (let i = 0; i < p.dd; i++) { c.fillStyle = INK; c.fillRect(x + i * 9, y + 11, 8, 8); c.fillStyle = '#e0303a'; c.fillRect(x + i * 9 + 1, y + 12, 6, 5); c.fillStyle = INK; c.fillRect(x + i * 9 + 2, y + 14, 1, 1); c.fillRect(x + i * 9 + 5, y + 14, 1, 1); }
      const bs = getW('bloodstone');
      if (bs) for (let i = 0; i < 3; i++) { c.fillStyle = i < bs.ammo ? '#e0303a' : '#3a2f3e'; c.fillRect(x + 40 + i * 5, y + 13, 3, 4); }
      let bx = x + 60;
      for (const slot of ['attack', 'special', 'cast']) {
        const b = G.boons[slot]; if (!b) continue;
        const g = GODS[b.god];
        c.drawImage(icon(g.icon, g.col), bx, y + 10);
        txt(c, SLOT_NAMES[slot][0] + RARITY[b.lvl][0], bx + 11, y + 11, g.col);
        bx += 30;
      }
      txt(c, key + 'SCATTO-COLPO', x, y + 23, '#6b6577');
      break;
    }
    case 'madeline': {
      bar(c, x, y + 2, 100, 6, p.hp / 100, p.hp > 70 ? '#ff4a8a' : '#7a3aa0');
      txt(c, 'ANSIA ' + Math.round(p.hp) + '%', x + 104, y + 1, p.hp > 70 ? '#ff4a8a' : '#d08aff');
      const evo = getW('dash')?.evo;
      for (let i = 0; i < (evo ? 2 : 1); i++) { c.fillStyle = INK; c.fillRect(x + i * 9, y + 11, 8, 6); c.fillStyle = i < p.charges ? (evo ? '#ff7ad9' : '#d1343a') : '#5fb3ff'; c.fillRect(x + i * 9 + 1, y + 12, 6, 4); }
      txt(c, p.charges > 0 ? 'SCATTO PRONTO' : 'RICARICA…', x + 22, y + 11, p.charges > 0 ? '#ff9a9a' : '#5fb3ff');
      txt(c, key + 'SCATTO MANUALE', x, y + 23, '#6b6577');
      break;
    }
    case 'prisoner': {
      bar(c, x, y + 2, 100, 6, p.hp / p.maxHp, '#3fd46a');
      txt(c, Math.ceil(p.hp) + '/' + p.maxHp, x + 104, y + 1, '#efe6d2');
      for (let i = 0; i < p.flaskMax; i++) c.drawImage(icon('flask', i < p.flasks ? '#ff6a6a' : '#3a2f3e', '#14101a'), x + i * 11, y + 9);
      txt(c, String(p.scrolls.red), x + 30, y + 11, '#ff5a5a'); txt(c, String(p.scrolls.purple), x + 42, y + 11, '#c9a6ff'); txt(c, String(p.scrolls.green), x + 54, y + 11, '#6aff8a');
      txt(c, 'PERGAMENE', x + 64, y + 11, '#a89a88');
      txt(c, key + 'FIASCHETTA', x, y + 23, p.flasks ? '#efe6d2' : '#6b6577');
      break;
    }
    case 'penitent': {
      bar(c, x, y + 2, 100, 6, p.hp / p.maxHp, '#c41e2a');
      txt(c, Math.ceil(p.hp) + '/' + p.maxHp, x + 104, y + 1, '#efe6d2');
      bar(c, x, y + 11, 100, 3, p.fervour / 100, '#5fb3ff');
      txt(c, 'FERVORE', x + 104, y + 9, '#5fb3ff');
      for (let i = 0; i < p.flaskMax; i++) c.drawImage(icon('flask', i < p.flasks ? '#c41e2a' : '#3a2f3e', '#14101a'), x + 150 + i * 11, y);
      if (G.guilt) txt(c, 'COLPA: −30% FERVORE', x + 150, y + 11, '#ff6aa0');
      txt(c, key + 'BILE', x, y + 23, p.flasks ? '#efe6d2' : '#6b6577');
      break;
    }
    case 'terrarian': {
      const hearts = Math.ceil(p.maxHp / 20);
      for (let i = 0; i < hearts; i++) {
        const f = clamp((p.hp - i * 20) / 20, 0, 1);
        c.drawImage(icon('heart', f > 0.5 ? '#e0303a' : f > 0 ? '#8e2b3a' : '#3a2f3e'), x + (i % 10) * 10, y - Math.floor(i / 10) * 10);
      }
      bar(c, x, y + 13, 80, 3, p.mana / 100, '#4a7aff');
      txt(c, 'MANA', x + 84, y + 11, '#7aa0ff');
      txt(c, key + 'COSTRUISCI' + (p.buildCd > 0 ? ' ' + p.buildCd.toFixed(1) + 's' : ''), x, y + 23, p.buildCd > 0 ? '#6b6577' : '#efe6d2');
      break;
    }
    case 'isaac': {
      const cont = p.maxHp / 2;
      for (let i = 0; i < cont; i++) {
        const v = clamp(p.hp - i * 2, 0, 2);
        c.drawImage(icon('heart', v === 2 ? '#e0303a' : v === 1 ? '#a8323a' : '#3a2f3e'), x + i * 10, y);
        if (v === 1) { c.fillStyle = '#3a2f3e'; c.fillRect(x + i * 10 + 5, y + 1, 4, 7); }
      }
      for (let i = 0; i < Math.ceil(p.shield / 2); i++) c.drawImage(icon('heart', '#7fb8ff'), x + (cont + i) * 10, y);
      for (let i = 0; i < 6; i++) { c.fillStyle = INK; c.fillRect(x + i * 6, y + 12, 5, 4); c.fillStyle = i < p.charge ? '#ffd23f' : '#3a2f3e'; c.fillRect(x + i * 6 + 1, y + 13, 3, 2); }
      txt(c, 'TESTA DI TAMMY', x + 40, y + 11, p.charge >= 6 ? '#ffd23f' : '#a89a88');
      txt(c, key + 'OGGETTO ATTIVO', x, y + 23, p.charge >= 6 ? '#efe6d2' : '#6b6577');
      break;
    }
  }
}

// --- Attacco di panico (Madeline) ------------------------------------------------------------
function drawPanic(c) {
  const P = G.panic;
  c.fillStyle = 'rgba(8,4,14,.82)'; c.fillRect(0, 0, W, H);
  txt(c, 'RESPIRA.', W / 2, 30, '#ff7ad9', 16, 'center');
  txt(c, 'Theo: «Immagina una piuma. Il tuo respiro la tiene sollevata.»', W / 2, 52, '#efe6d2', 8, 'center');
  const bx = W / 2 - 14, top = 80, hgt = 200;
  patch(c, bx - 6, top - 6, 40, hgt + 12, '#ff7ad9');
  const boxC = 0.5 + 0.3 * Math.sin(P.ph * 1.3);
  const bh = P.size * hgt;
  const by = top + hgt * (1 - boxC) - bh / 2;
  c.fillStyle = 'rgba(255,122,217,.25)'; c.fillRect(bx, by, 28, bh);
  c.strokeStyle = '#ff7ad9'; c.strokeRect(bx + 0.5, by + 0.5, 27, bh - 1);
  const fy = top + hgt * (1 - P.fy);
  c.drawImage(icon('feather', '#ffd23f', '#e2b04a'), bx + 9, fy - 5);
  bar(c, W / 2 - 80, top + hgt + 14, 160, 5, P.prog, '#ff7ad9');
  txt(c, (G.touch ? 'Tieni premuto lo schermo' : 'Tieni premuto SPAZIO') + ' per far salire la piuma. Tienila nel riquadro.', W / 2, top + hgt + 24, '#a89a88', 8, 'center');
  txt(c, P.t.toFixed(1) + 's', W / 2 + 40, top, '#efe6d2');
}

// --- Ricucitura (evoluzione) ------------------------------------------------------------------
function drawCine(c) {
  const C = G.cine, k = 1 - C.t / C.max;
  c.fillStyle = `rgba(8,4,14,${Math.min(0.85, k * 3)})`; c.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2 - 10;
  const a = C.a, b = C.b;
  const ia = icon(a.icon[0], a.icon[1], a.icon[2]);
  const ib = b ? icon(b.icon[0], b.icon[1], b.icon[2]) : ia;
  if (k < 0.45) {
    const m = k / 0.45;
    const off = 120 * (1 - m);
    c.drawImage(ia, cx - off - 20, cy - 20, 40, 40);
    c.drawImage(ib, cx + off - 20, cy - 20, 40, 40);
    txt(c, a.name, cx - off, cy + 26, '#efe6d2', 8, 'center');
    if (b) txt(c, b.name, cx + off, cy + 26, '#efe6d2', 8, 'center');
  } else if (k < 0.6) {
    for (let i = 0; i < 24; i++) { const ang = i / 24 * TAU + k * 8, r = (k - 0.45) * 500; c.fillStyle = i % 2 ? a.icon[1] : '#e2b04a'; c.fillRect(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 3, 3); }
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 30, cy - 30); c.lineTo(cx + 30, cy + 30); c.stroke(); c.lineWidth = 1;
  } else {
    const gi = icon(a.icon[0], '#ffd23f', a.icon[2]);
    const s = 40 + Math.sin(k * 20) * 2;
    c.drawImage(gi, cx - s / 2, cy - s / 2, s, s);
    stitchRect(c, cx - 30, cy - 30, 60, 60, '#ffd23f');
    txt(c, 'RICUCITURA', cx, cy - 58, '#e2b04a', 16, 'center');
    txt(c, C.rule.into.toUpperCase(), cx, cy + 36, '#ffd23f', 16, 'center');
    txt(c, C.rule.desc, cx, cy + 56, '#efe6d2', 8, 'center');
  }
}

// --- Joystick touch --------------------------------------------------------------------------
function drawTouch(c) {
  const T = INPUT.touch;
  if (!T.active) return;
  c.globalAlpha = 0.4;
  c.strokeStyle = '#efe6d2'; c.beginPath(); c.arc(T.ox, T.oy, 24, 0, TAU); c.stroke();
  c.fillStyle = '#efe6d2'; c.beginPath(); c.arc(T.ox + T.dx * 24, T.oy + T.dy * 24, 9, 0, TAU); c.fill();
  c.globalAlpha = 1;
}

// --- Sfondo del menu ---------------------------------------------------------------------------
let menuT = 0;
function drawMenuBg(c) {
  if (!TILES) return;
  menuT += 1 / 60;
  camX = Math.round(menuT * 18); camY = -H / 2 + 20;
  const save = G;
  c.fillStyle = '#120c16'; c.fillRect(0, 0, W, H);
  const kinds = ['hk', 'hades', 'celeste', 'terra', 'blas'];
  const x0 = Math.floor(camX / 32) - 1, y0 = Math.floor(camY / 32) - 1;
  for (let tx = x0; tx < x0 + W / 32 + 3; tx++) for (let ty = y0; ty < y0 + H / 32 + 3; ty++) {
    const px = tx * 32 - camX, py = ty * 32 - camY;
    const pk = hash2(Math.floor(tx / 3), Math.floor(ty / 3)) % kinds.length;
    c.drawImage(TILES[kinds[pk]], px, py);
    if ((tx + 1) % 3 === 0 && hash2(Math.floor((tx + 1) / 3), Math.floor(ty / 3)) % kinds.length !== pk) seamDash(c, px + 31, py, px + 31, py + 32, '#e2b04a');
    if ((ty + 1) % 3 === 0 && hash2(Math.floor(tx / 3), Math.floor((ty + 1) / 3)) % kinds.length !== pk) seamDash(c, px, py + 31, px + 32, py + 31, '#e2b04a');
  }
  c.fillStyle = 'rgba(10,6,14,.55)'; c.fillRect(0, 0, W, H);
  const names = ['knight', 'v1', 'zagreus', 'madeline', 'prisoner', 'penitent', 'terrarian', 'isaac'];
  names.forEach((n, i) => {
    const s = SPR[n];
    const x = ((i * 70 + menuT * 30) % (W + 140)) - 70;
    const y = H - 40 - Math.abs(Math.sin(menuT * 8 + i)) * 2;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + 4, H - 40 + s.h * 2 - 4, s.w * 2 - 8, 3);
    c.drawImage(s.img, Math.round(x), Math.round(y), s.w * 2, s.h * 2);
  });
  void save;
}

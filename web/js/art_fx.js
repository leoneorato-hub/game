'use strict';
// =============================================================================
// ART: ARMI IMPUGNATE, PAVIMENTI DIPINTI, OGGETTI DI SCENA (Alfa 3)
// Le armi puntano a destra con l'impugnatura a sinistra (perno ≈ x 2).
// =============================================================================

function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// --- Armi ------------------------------------------------------------------------------
function blade(name, w, col, o = {}) {
  regPaint(name, w, 9, b => {
    b.rect(0.5, 3, 3.5, 3, o.grip || '#4a3426');
    b.rect(4, 1, 1.6, 7, o.guard || '#8a8f9c');
    b.poly([[5.5, 3], [w - 3, 3], [w - 0.5, 4.5], [w - 3, 6], [5.5, 6]], o.glow ? M.glow(col) : col);
    b.rect(6, 4.2, w - 10, 0.6, M.flat(o.edge || '#ffffff', 4));
    if (o.gem) b.dot(4.5, 4, M.glow(o.gem));
  });
}
blade('W_nail', 22, '#d8d8e0', { grip: '#3a3448', guard: '#5a5468' });
blade('W_nailpure', 24, '#fffbe0', { glow: true, grip: '#3a3448', guard: '#c9c4b8' });
blade('W_stygius', 22, '#a8b0bc', { grip: '#1a1418', guard: '#7e1820', gem: '#ff3030' });
blade('W_excalibur', 26, '#ffe680', { glow: true, guard: '#d9a83a', gem: '#ffffff' });
blade('W_rusty', 20, '#a8642a', { guard: '#6b4a2a', edge: '#d9a080' });
blade('W_kingblade', 24, '#ffd23f', { glow: true, guard: '#8e2b3a' });
blade('W_beekeeper', 20, '#e8c23a', { guard: '#2a1a12', edge: '#2a1a12' });
blade('W_zenith', 26, '#7fffd0', { glow: true, guard: '#3a8a6a', gem: '#ff7ad9' });
TIERS.forEach((t, i) => blade('W_tier' + i, 16 + i, t.c, { glow: i >= 6 }));
regPaint('W_meaculpa', 30, 11, b => {
  b.rect(0.5, 4, 4, 3, '#3a2a1a');
  b.poly([[4.5, 1], [7, 0], [7.5, 5.5], [7, 11], [4.5, 10]], '#5a3d22');
  for (let i = 0; i < 4; i++) b.poly([[5 + i * 0.6, 2 + i * 2.2], [3 + i * 0.4, 1 + i * 2.6], [5.4 + i * 0.6, 3 + i * 2.2]], '#7a5a32');
  b.poly([[7.5, 3.5], [27, 3.5], [29.5, 5.5], [27, 7.5], [7.5, 7.5]], '#c9ccd4');
  b.rect(8, 5.2, 18, 0.7, M.flat('#ffffff', 4));
  b.rect(8, 3.5, 4, 4, '#9a2a2a');
});
regPaint('W_meaculpa_burn', 30, 11, b => { b.rect(0.5, 4, 4, 3, '#3a2a1a'); b.poly([[4.5, 1], [7, 0], [7.5, 5.5], [7, 11], [4.5, 10]], '#5a3d22'); b.poly([[7.5, 3.5], [27, 3.5], [29.5, 5.5], [27, 7.5], [7.5, 7.5]], M.glow('#ff8a2a')); });
regPaint('W_revolver', 16, 10, b => { b.rect(1, 4, 3, 5, '#3a3446'); b.rect(3, 2, 11, 3, '#5f7290'); b.ell(6, 4.5, 2.4, 2, '#4b4f69'); b.rect(13, 2.5, 2.5, 2, '#2a2833'); b.dot(9, 2, M.glow('#f6b955')); });
regPaint('W_shotgun', 20, 9, b => { b.rect(0.5, 3, 5, 4, '#6a4a2a'); b.rect(5, 2, 13, 2.2, '#4b4f69'); b.rect(6, 4.2, 10, 2, '#363346'); b.rect(17, 2, 2.5, 4, '#2a2833'); b.dot(12, 5, M.glow('#ff8a2a')); });
regPaint('W_nailgun', 18, 10, b => { b.rect(1, 4, 3, 5, '#3a3446'); b.rect(3, 2, 13, 3.5, '#4b4f69'); b.ell(8, 6.5, 3, 2.4, '#7ec8ff'); b.rect(15, 3, 2.5, 1.5, '#c9ced8'); });

// --- Pavimenti dipinti -------------------------------------------------------------
function paintTile(spec, seed) {
  const R = seeded(seed * 9301 + 17);
  const { base, dark, light, kind } = spec;
  return paint(32, 32, b => {
    b.rect(-1, -1, 34, 34, M.flat(dark, 2));
    const vary = c => { const [h, s, l] = hexToHsl(c); const [r, g, bb] = hslToRgb(h + (R() - 0.5) * 8, s, l * (0.92 + R() * 0.16)); return '#' + [r, g, bb].map(v => v.toString(16).padStart(2, '0')).join(''); };
    if (kind === 'cobble') for (let i = 0; i < 9; i++) b.ell(R() * 32, R() * 32, 4 + R() * 4, 3 + R() * 3, vary(base), { rot: R() * 3 });
    else if (kind === 'bricks') for (let r = 0; r < 4; r++) for (let k = -1; k < 3; k++) b.rect(k * 12 + (r % 2) * 6 + 0.5, r * 8 + 0.5, 11, 7, vary(base));
    else if (kind === 'marble') { const c0 = vary(base); b.rect(0.5, 0.5, 31, 31, c0); if (R() < 0.6) b.cap(R() * 32, 0, R() * 32, 32, 0.4, M.flat(c0, 3), { keep: true }); }
    else if (kind === 'greek') { b.rect(0.5, 0.5, 15, 15, vary(base)); b.rect(16.5, 0.5, 15, 15, vary(base)); b.rect(0.5, 16.5, 15, 15, vary(base)); b.rect(16.5, 16.5, 15, 15, vary(base)); for (let i = 0; i < 32; i += 8) { b.rect(i + 1, 1.5, 5, 0.8, M.flat(light, 3)); b.rect(i + 5, 1.5, 0.8, 3, M.flat(light, 3)); } }
    // neve (Alfa 4): cumuli morbidi e piatti con un'ombra sottile, niente bande scure
    else if (kind === 'snow') { b.rect(-1, -1, 34, 34, M.flat(base, 3)); for (let i = 0; i < 3; i++) { const x = R() * 32, y = R() * 32, rx = 5 + R() * 6; b.ell(x, y + 1.2, rx, 1.6, M.flat(base, 2)); b.ell(x, y, rx, 2 + R() * 1.5, M.flat(light, 3)); } for (let i = 0; i < 5; i++) b.dot(R() * 32, R() * 32, M.flat('#ffffff', 4)); for (let i = 0; i < 3; i++) b.dot(R() * 32, R() * 32, M.flat(dark, 2)); }
    else if (kind === 'grass') { b.rect(-1, -1, 34, 34, M.flat(base, 2)); for (let i = 0; i < 14; i++) { const x = R() * 32, y = R() * 32; b.poly([[x, y + 3], [x + 0.6, y], [x + 1.4, y + 3]], M.flat(R() < 0.5 ? light : dark, R() < 0.5 ? 3 : 1)); } }
    else if (kind === 'dirt') { b.rect(-1, -1, 34, 34, M.flat(base, 2)); for (let i = 0; i < 7; i++) b.ell(R() * 32, R() * 32, 1.5 + R() * 2, 1 + R() * 1.4, vary(light)); }
    else if (kind === 'sand') { b.rect(0.5, 0.5, 31, 15, vary(base)); b.rect(0.5, 16.5, 15, 15, vary(base)); b.rect(16.5, 16.5, 15, 15, vary(base)); for (let i = 0; i < 6; i++) b.dot(R() * 32, R() * 32, M.flat(light, 3)); }
    else { b.rect(-1, -1, 34, 34, M.flat(base, 2)); for (let i = 0; i < 4; i++) b.dot(R() * 32, R() * 32, M.flat(light, 3)); }
  }, { outline: false });
}

// --- Oggetti di scena dipinti (sostituiscono quelli della v2) ---------------------------
regPaint('p_stalag', 14, 18, b => { b.poly([[7, 0], [12, 17], [2, 17]], '#3a4560'); b.poly([[3, 6], [6, 17], [0.5, 17]], '#2c3650'); });
regPaint('p_lamp', 12, 30, b => { b.rect(5, 10, 2, 19, '#3a4560'); b.rect(3, 27, 6, 3, '#3a4560'); b.ell(6, 6, 4.5, 5, '#5a6a8a'); b.ell(6, 6, 3, 3.6, M.glow('#bfe8ff')); b.rect(2, 0.5, 8, 1.5, '#5a6a8a'); });
regPaint('p_lumafly', 6, 6, b => { b.ell(3, 3, 2.4, 2.4, M.glow('#9fe0ff')); });
regPaint('p_infect', 16, 10, b => { for (let i = 0; i < 4; i++) b.ell(3 + i * 3.4, 6 - (i % 2) * 2, 3 - (i % 2) * 0.6, 3 - (i % 2) * 0.6, M.glow(i % 2 ? '#ffb04a' : '#ff8a2a')); });
regPaint('p_statue', 20, 32, b => { b.rect(2, 26, 16, 6, '#4a5470'); b.poly([[5, 26], [15, 26], [14, 12], [6, 12]], '#6a7490'); b.ell(10, 9, 5.5, 5, '#8a94b0'); b.cap(7, 6, 5, 0, 1.2, '#8a94b0'); b.cap(13, 6, 15, 0, 1.2, '#8a94b0'); b.ell(8, 9, 1, 1.5, M.flat('#2a3040', 1)); b.ell(12, 9, 1, 1.5, M.flat('#2a3040', 1)); });
regPaint('p_pillar_gold', 14, 36, b => { b.rect(1, 0, 12, 4, '#a8822a'); b.rect(2.5, 4, 9, 28, '#e2b04a'); for (let i = 0; i < 3; i++) b.rect(4 + i * 2.5, 5, 0.8, 26, M.flat('#a8822a', 1)); b.rect(1, 32, 12, 4, '#a8822a'); });
regPaint('p_lava', 22, 10, b => { b.ell(11, 5, 10, 4, M.glow('#ff6a2a')); b.ell(10, 5, 6, 2.2, M.glow('#ffd27a')); });
regPaint('p_skulls', 16, 9, b => { for (let i = 0; i < 3; i++) { b.ell(3 + i * 5, 5 - (i % 2), 2.6, 2.4, '#d8d0c0'); b.dot(2 + i * 5, 5 - (i % 2), M.flat('#2a1a1a', 1)); b.dot(4 + i * 5, 5 - (i % 2), M.flat('#2a1a1a', 1)); } });
regPaint('p_column', 14, 32, b => { b.rect(1, 0, 12, 3.5, '#3a5a4a'); b.rect(2.5, 3.5, 9, 25, '#6a8a7a'); for (let i = 0; i < 3; i++) b.rect(4 + i * 2.5, 4, 0.8, 24, M.flat('#3a5a4a', 1)); b.rect(1, 28.5, 12, 3.5, '#3a5a4a'); });
regPaint('p_urn', 12, 14, b => { b.ell(6, 8, 5, 5, '#a8642a'); b.rect(3.5, 1, 5, 3, '#a8642a'); b.rect(1.5, 7, 9, 1.2, M.flat('#2a1a12', 1)); b.ell(6, 8, 1.6, 1.6, M.flat('#e2b04a', 3)); });
regPaint('p_soulfire', 10, 16, b => { b.rect(2, 11, 6, 5, '#3a4a40'); b.ell(5, 7, 3.5, 4.5, M.glow('#3ad08a')); b.poly([[2.5, 6], [5, -0.5], [7.5, 6]], M.glow('#8affc0')); });
regPaint('p_pine', 22, 34, b => { b.rect(10, 26, 2.5, 8, '#4a3a2a'); for (let i = 0; i < 4; i++) b.poly([[11, 1 + i * 6], [20 - i * 0, 12 + i * 5], [2 + i * 0, 12 + i * 5]], '#2a5a4a'); for (let i = 0; i < 4; i++) b.ell(11, 11 + i * 5, 6, 1.4, M.flat('#f2f6ff', 4)); });
regPaint('p_crystal', 12, 18, b => { b.poly([[6, 0], [10, 8], [7, 17], [3, 12]], M.glow('#5aa0ff')); b.poly([[2, 6], [5, 10], [3, 17], [0.5, 11]], M.glow('#9ad0ff')); });
regPaint('p_drift', 22, 8, b => { b.ell(11, 5, 10, 3.4, '#e8f0ff'); b.ell(7, 3.5, 4, 2, '#ffffff'); });
regPaint('p_torch', 8, 20, b => { b.rect(3, 8, 2, 12, '#5a4a3a'); b.rect(1.5, 7, 5, 2, '#3a2a1a'); b.ell(4, 4, 2.6, 3.6, M.glow('#ff8a2a')); b.ell(4, 4.5, 1.3, 2, M.glow('#ffe680')); });
regPaint('p_chain', 6, 20, b => { for (let i = 0; i < 5; i++) b.ell(3, 2 + i * 4, 1.6, 2, '#8a8f9c'); });
regPaint('p_cage', 16, 20, b => { b.rect(0.5, 0.5, 15, 2, '#6a6e7a'); b.rect(0.5, 17.5, 15, 2, '#6a6e7a'); for (let i = 0; i < 4; i++) b.rect(1 + i * 4.3, 2, 1.2, 15.5, '#6a6e7a'); b.ell(8, 15, 3, 1.5, '#d8d0c0'); });
regPaint('p_barrel', 12, 14, b => { b.ell(6, 7, 5.5, 6.5, '#7a5530'); b.rect(0.5, 4, 11, 1, '#4a4e5a'); b.rect(0.5, 10, 11, 1, '#4a4e5a'); });
regPaint('p_banner', 10, 28, b => { b.rect(0.5, 0.5, 9, 2, '#5a4a3a'); b.poly([[1, 2], [9, 2], [9, 24], [5, 21], [1, 24]], '#5a1e24'); b.ell(5, 9, 2.4, 2.4, '#d9b43a'); });
regPaint('p_candles', 18, 14, b => { for (let i = 0; i < 4; i++) { const h = 5 + (i * 7) % 6; b.rect(1.5 + i * 4.2, 13 - h, 2.6, h, '#efe6d2'); b.ell(2.8 + i * 4.2, 13 - h - 1.6, 1, 1.6, M.glow('#ffd23f')); } });
regPaint('p_altar', 20, 18, b => { b.rect(1, 8, 18, 10, '#5a1e24'); b.rect(1, 8, 18, 2, '#7e2a30'); b.rect(3, 12, 14, 1, M.flat('#d9b43a', 3)); b.rect(9, 0.5, 2, 8, '#d9b43a'); b.rect(6.5, 2.5, 7, 2, '#d9b43a'); });
regPaint('p_tree', 28, 44, b => { b.rect(12, 26, 4, 18, '#5a3a1a'); b.cap(14, 30, 7, 24, 1.2, '#5a3a1a'); b.ell(14, 14, 12, 11, '#2a6a2a'); b.ell(8, 20, 7, 6, '#2a6a2a'); b.ell(20, 19, 7, 6, '#2a6a2a'); b.ell(11, 10, 5, 4, '#3b8a3b'); });
regPaint('p_flower', 7, 9, b => { b.cap(3.5, 4, 3.5, 9, 0.5, '#3b8a3b'); for (let i = 0; i < 4; i++) b.ell(3.5 + Math.cos(i * 1.57) * 1.6, 3 + Math.sin(i * 1.57) * 1.6, 1.3, 1.3, '#e0303a'); b.dot(3, 2, M.flat('#ffd23f', 3)); });
regPaint('p_rock', 16, 11, b => { b.ell(8, 6, 7.5, 5, '#5a4a3a'); b.ell(6, 4.5, 3, 2, '#7a6a5a'); });
regPaint('p_tinted', 16, 11, b => { b.ell(8, 6, 7.5, 5, '#5a4a3a'); b.cap(4, 4, 12, 7, 0.6, M.glow('#5fb3ff')); });
regPaint('p_poop', 11, 10, b => { b.ell(5.5, 7.5, 5, 2.4, '#6a4a2a'); b.ell(5.5, 4.5, 3.5, 2, '#7a5a32'); b.ell(5.5, 2, 2, 1.4, '#8a6a3a'); });
regPaint('p_bones', 16, 8, b => { b.cap(2, 4, 13, 3, 0.9, '#d8d0c0'); b.cap(4, 7, 12, 1, 0.8, '#c8c0b0'); b.ell(14, 5, 2, 1.8, '#d8d0c0'); });
regPaint('p_relic', 10, 12, b => { b.rect(2, 2, 6, 8, '#d9a83a'); b.rect(3, 4, 4, 4, M.glow('#ffd23f')); b.rect(1, 1, 8, 1.5, '#8c6a2f'); b.rect(1, 9.5, 8, 1.5, '#8c6a2f'); });
regPaint('p_altar_goal', 14, 16, b => { b.rect(1, 8, 12, 8, '#8c6a2f'); b.rect(1, 8, 12, 1.5, '#e2b04a'); b.ell(7, 4, 3, 3.6, M.glow('#ffd23f')); });

// --- Vignetta e raggi di luce -------------------------------------------------------
const VIGNETTE = (() => { const c = makeCanvas(W, H), x = c.getContext('2d'); const g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(4,2,10,.55)'); x.fillStyle = g; x.fillRect(0, 0, W, H); return c; })();
function drawRays(c, col, n = 4) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = ((i * 190 - camX * 0.35 + G.t * 6) % (W + 260) + W + 260) % (W + 260) - 130;
    const a = 0.05 + 0.03 * Math.sin(G.t * 0.7 + i);
    const g = c.createLinearGradient(x, 0, x + 120, H);
    g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0));
    c.fillStyle = g;
    c.beginPath(); c.moveTo(x, -10); c.lineTo(x + 40 + (i % 2) * 20, -10); c.lineTo(x + 180, H + 10); c.lineTo(x + 120, H + 10); c.closePath(); c.fill();
  }
  c.restore();
}

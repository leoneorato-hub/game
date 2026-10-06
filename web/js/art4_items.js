'use strict';
// =============================================================================
// ART4 · OGGETTI (items) — orb di esperienza per personaggio (4 tier × 2 frame),
// pickup speciali, oggetti distruttibili (luci di scena), icone delle Ultimate
// e icone dei potenziamenti della Merceria.
// Pixel-art originale a griglie di caratteri con palette esplicite: luce
// dall'alto a sinistra, 3-5 toni per materiale, contorno di 1 px selettivo.
// =============================================================================
(() => {
  const OUT = '#1a1220';
  const RGB = {};
  const rgb = h => RGB[h] || (RGB[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);

  // ---- micro-motore a griglie ------------------------------------------------
  const buf = (w, h) => Array.from({ length: h }, () => new Array(w).fill(null));
  function put(B, x0, y0, rows) {
    for (let j = 0; j < rows.length; j++) {
      const y = y0 + j; if (y < 0 || y >= B.length) continue;
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const ch = row[i]; if (ch === '.' || ch === ' ') continue;
        const x = x0 + i; if (x < 0 || x >= B[0].length) continue;
        B[y][x] = ch === '_' ? null : ch;
      }
    }
    return B;
  }
  const G = rows => put(buf(Math.max(...rows.map(r => r.length)), rows.length), 0, 0, rows);
  const dot = (B, x, y, ch) => { if (y >= 0 && y < B.length && x >= 0 && x < B[0].length) B[y][x] = ch; };
  const clone = B => B.map(r => r.slice());
  // riempie un'ellisse: f è un carattere o fn(nx, ny, x, y) → carattere|null
  function ell(B, cx, cy, rx, ry, f) {
    for (let y = 0; y < B.length; y++) for (let x = 0; x < B[0].length; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      const ch = typeof f === 'function' ? f(nx, ny, x, y) : f;
      if (ch) B[y][x] = ch;
    }
    return B;
  }
  // tono di una sfera (luce in alto a sinistra): T = toni dal più scuro al più chiaro
  function sph(T, nx, ny, o = {}) {
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    let l = 0.5 * nz + 0.55 * (-0.62 * nx - 0.78 * ny) + (o.bias || 0);
    const n = T.length;
    let k = Math.floor((l + 0.35) / 1.25 * n);
    k = Math.max(0, Math.min(n - 1, k));
    if (o.rim && nx * nx + ny * ny > 0.72 && nx + ny > 0.5) k = Math.max(k, o.rim); // luce riflessa
    return T[k];
  }
  // bake: B (griglia di caratteri) → canvas. o.ol colore del contorno, o.olc {ch: colore|null}
  // o.W/o.H dimensione finale (centrata), o.over [[x,y,col]] pixel finali senza contorno
  function bake(B, pal, o = {}) {
    const h = B.length, w = B[0].length;
    const W = o.W || w + 2, H = o.H || h + 2;
    const ox = o.ox ?? Math.floor((W - w) / 2), oy = o.oy ?? Math.floor((H - h) / 2);
    const c = makeCanvas(W, H), g = c.getContext('2d');
    const id = g.createImageData(W, H), D = id.data;
    const set = (x, y, hx) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const v = rgb(hx), i = (y * W + x) * 4; D[i] = v[0]; D[i + 1] = v[1]; D[i + 2] = v[2]; D[i + 3] = 255; };
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : B[y][x]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = B[y][x]; if (ch && pal[ch]) set(x + ox, y + oy, pal[ch]); }
    if (o.ol !== false) {
      const N = o.diag ? [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]] : [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (let y = -oy; y < H - oy; y++) for (let x = -ox; x < W - ox; x++) {
        const me = at(x, y); if (me && pal[me]) continue;
        let col = null;
        for (const [dx, dy] of N) {
          const ch = at(x + dx, y + dy); if (!ch || !pal[ch]) continue;
          const oc = o.olc && ch in o.olc ? o.olc[ch] : (o.ol || OUT);
          if (oc) { col = oc; break; }
        }
        if (col) set(x + ox, y + oy, col);
      }
    }
    if (o.over) for (const [x, y, col] of o.over) set(x + ox, y + oy, col);
    g.putImageData(id, 0, 0);
    return c;
  }
  const reg = (name, cv) => regSprite(name, cv);
  // scintilla a croce (per i frame _s): pixel finali senza contorno
  function glint(x, y, big, col = '#ffffff', arm = '#fff6d0') {
    const p = [[x, y, col], [x - 1, y, arm], [x + 1, y, arm], [x, y - 1, arm], [x, y + 1, arm]];
    if (big) p.push([x - 2, y, arm], [x + 2, y, arm], [x, y - 2, arm], [x, y + 2, arm]);
    return p;
  }
  // rampa → palette 'a'..'e'
  const P5 = (a, b, c, d, e, extra) => Object.assign({ a, b, c, d, e }, extra || {});
  const up = (pal, map) => { const p = Object.assign({}, pal); for (const k in map) p[k] = pal[map[k]]; return p; };

  // ===========================================================================
  // 1) ORB DI ESPERIENZA — gem_<k>_<t> e gem_<k>_<t>_s
  // ===========================================================================
  const GEMS = {};

  // ---------------------------------------------------------------- GEO (Hollow Knight)
  {
    const pal = P5('#2c3244', '#5b6680', '#93a0b6', '#c9d1dd', '#f4f1e8', { k: '#16141e', l: '#2a2836', m: '#413e52', n: '#5c5970', W: '#ffffff' });
    const olc = { k: '#0c0a12', l: '#0c0a12', m: '#0c0a12', n: '#0c0a12' };
    const ol = '#141826';
    GEMS.geo = [
      { B: G([
        '.edd..',
        'eeddc.',
        'dddcbb',
        'cccbba',
        '.bbaa.']), pal, ol, olc, g: [4, 1, 0], pulse: { c: 'd' } },
      { B: G([
        '..eedd..',
        '.eeedcc.',
        'eedddcbc',
        'ddcbbccb',
        '.ccccbba',
        '..bbaaa.']), pal, ol, olc, g: [6, 1, 0], pulse: { c: 'd' } },
      { B: G([
        '...eeddd..',
        '.eeeeddcc.',
        'eeedddccbc',
        'eddbbbdcbb',
        'dddcccbbcb',
        '.cccbbbcba',
        '..bbbbbaa.',
        '...aaaa...']), pal, ol, olc, g: [7, 1, 1], pulse: { c: 'd' } },
      { B: G([
        '.....ee.......',
        '....eedd..ed..',
        '...eddcd.eddc.',
        '..nedcccnddcb.',
        '.nnmdcbmmmccm.',
        'nnmmmbmmmmmmml',
        'nmmmmmmmmmlmll',
        'mmmlmmmlmmllll',
        'mmlllmlllllllk',
        '.llllllkllkkk.',
        '..lkkkkkkkkk..']), pal, ol, olc, g: [10, 1, 1], pulse: { c: 'd', m: 'n' } },
    ];
  }

  // ---------------------------------------------------------------- BLOOD (ULTRAKILL)
  {
    const pal = P5('#3a0610', '#7e0e1c', '#c41e2a', '#ff4545', '#ffa090', { W: '#ffffff' });
    const ol = '#1c0308';
    const orb = buf(13, 13);
    ell(orb, 6.5, 6.5, 6.5, 6.5, (nx, ny) => sph('abcd', nx, ny, { rim: 2 }));
    put(orb, 3, 2, ['.ee', 'eWe', 'ee.']);
    GEMS.blood = [
      { B: G([
        '..c..',
        '.cdc.',
        '.dcc.',
        'cedcb',
        'cdccb',
        '.bbb.']), pal, ol, g: [3, 1, 0], pulse: { c: 'd', b: 'c' } },
      { B: G([
        '...c...',
        '..cdc..',
        '..dcc..',
        '.dccbc.',
        'cedccbb',
        'cddcccb',
        '.cccbb.',
        '..bbb..']), pal, ol, g: [5, 2, 0], pulse: { c: 'd', b: 'c' } },
      { B: G([
        '....c....',
        '...cdc...',
        '...dcc...',
        '..dccbc..',
        '.deccccb.',
        'cdWdcccbb',
        'cdecccbbb',
        'cddcccbbb',
        '.ccccbbb.',
        '..bbbbb..']), pal, ol, g: [6, 3, 1], pulse: { c: 'd', b: 'c' } },
      { B: orb, pal, ol, g: [10, 2, 1], pulse: { c: 'd', b: 'c' } },
    ];
  }

  // registrazione orb (dopo le definizioni)
  function regGems() {
    for (const k in GEMS) GEMS[k].forEach((d, t) => {
      const base = bake(d.B, d.pal, { ol: d.ol, olc: d.olc, W: d.W, H: d.H, diag: d.diag });
      const sp = bake(d.B, d.pulse ? up(d.pal, d.pulse) : d.pal, { ol: d.ol, olc: d.olc, W: d.W, H: d.H, diag: d.diag, over: d.g ? glint(d.g[0], d.g[1], d.g[2], '#ffffff', d.ga || '#fff6d0') : null });
      reg('gem_' + k + '_' + t, base);
      reg('gem_' + k + '_' + t + '_s', sp);
      if (t === 0) reg('gem_' + k, base);
      if (t === 2) reg('gemb_' + k, base);
    });
  }
  regGems();
})();

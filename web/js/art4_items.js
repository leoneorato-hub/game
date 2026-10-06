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


  // ---- forme procedurali ------------------------------------------------------
  // prisma di cristallo verticale (punta in alto): base in basso a sinistra (x, y)
  // T = 'abcde' (scuro → chiaro); lean = spostamento in px per riga (+ destra)
  function shard(B, x, y, w, h, lean = 0, T = 'abcde') {
    const half = (w - 1) / 2, tipEven = w % 2 ? 0 : 0.5;
    for (let j = 0; j < h; j++) {
      const yy = y - j, f = h - 1 - j, sx = x + Math.round(lean * j);
      for (let i = 0; i < w; i++) {
        const d = Math.abs(i - half);
        if (d > f + tipEven) continue;               // punta
        if (j === 0 && w >= 4 && d > half - 1) continue; // base smussata
        let ch;
        if (i === 0) ch = T[3];
        else if (i === 1 && w > 3) ch = f < h * 0.6 ? T[4] : T[3];
        else if (i === w - 1) ch = T[1];
        else ch = T[2];
        if (f === 0) ch = T[4];
        if (j === 0) ch = i === 0 ? T[2] : T[1];
        dot(B, sx + i, yy, ch);
      }
    }
    return B;
  }
  // rombo sfaccettato (TL, TR, BL, BR) con filo di luce sul bordo in alto a sinistra
  function diamond(B, cx, cy, rx, ry, F, edge) {
    for (let y = 0; y < B.length; y++) for (let x = 0; x < B[0].length; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, q = Math.abs(dx) / rx + Math.abs(dy) / ry;
      if (q > 1) continue;
      let ch = dx <= 0 ? (dy <= 0 ? F[0] : F[2]) : (dy <= 0 ? F[1] : F[3]);
      if (edge && q > 1 - 1.15 / Math.min(rx, ry) && dx <= 0.5 && dy <= 0.5) ch = edge;
      B[y][x] = ch;
    }
    return B;
  }
  // moneta vista di fronte: bordo smussato (luce in alto a sinistra) + faccia incisa
  function coinFace(B, cx, cy, r, T, inner = 0.68) {
    ell(B, cx, cy, r, r, (nx, ny) => {
      const d = Math.hypot(nx, ny), s = -0.7 * nx - 0.7 * ny;   // > 0 verso la luce
      if (d > inner) return s > 0.25 ? T[4] : s > -0.3 ? T[3] : s > -0.75 ? T[2] : T[1];
      if (d > inner - 0.2) return s > 0.1 ? T[1] : s < -0.4 ? T[3] : T[2]; // incisione
      return s > 0.35 ? T[3] : s < -0.35 ? T[1] : T[2];
    });
    return B;
  }

  // ---------------------------------------------------------------- DARKNESS (Hades)
  {
    const pal = P5('#1c0a30', '#3e1a6c', '#7030b4', '#ac64ee', '#ecd0ff', { W: '#ffffff', k: '#120822', l: '#24162e', m: '#3a2a44', n: '#ff7ad9' });
    const ol = '#0c0416';
    const t0 = shard(buf(5, 7), 0, 6, 5, 7);
    const t1 = shard(shard(buf(8, 9), 0, 8, 5, 9), 4, 8, 4, 6, 0.25);
    const t2 = buf(11, 11);
    shard(t2, 0, 10, 4, 6, -0.2); shard(t2, 6, 10, 4, 7, 0.25); shard(t2, 3, 10, 5, 11);
    const t3 = buf(15, 14);
    shard(t3, 0, 12, 4, 7, -0.25); shard(t3, 10, 12, 4, 8, 0.3); shard(t3, 7, 12, 4, 10, 0.12); shard(t3, 2, 12, 5, 12, -0.08); shard(t3, 5, 12, 5, 14);
    put(t3, 1, 11, ['.mmmllmlmllmm.', 'lmllklllkkkkll', '.kkkkkkkkkkkk.']);
    GEMS.darkness = [
      { B: t0, pal, ol, g: [3, 1, 0], pulse: { c: 'd', b: 'c' } },
      { B: t1, pal, ol, g: [3, 1, 0], pulse: { c: 'd', b: 'c' } },
      { B: t2, pal, ol, g: [6, 1, 1], pulse: { c: 'd', b: 'c' } },
      { B: t3, pal, ol, g: [8, 1, 1], pulse: { c: 'd', b: 'c' } },
    ];
  }

  // ---------------------------------------------------------------- CRYSTAL (Celeste)
  {
    const pal = P5('#0a3a2a', '#14874e', '#2ed26a', '#8cff9c', '#eafff0', { W: '#ffffff', t: '#1aa89a', T: '#5ff0d8',
      q: '#13226a', r: '#2a4ad0', s: '#4a8cff', u: '#9ad2ff', v: '#eaf8ff' });
    const ol = '#06281c';
    const t0 = diamond(buf(5, 7), 2.5, 3.5, 2.6, 3.6, 'dcba', 'e');
    const t1 = diamond(buf(7, 9), 3.5, 4.5, 3.6, 4.6, 'dcba', 'e');
    const t2 = diamond(buf(9, 11), 4.5, 5.5, 4.6, 5.6, 'dcba', 'e');
    diamond(t2, 4.5, 5.5, 2.1, 2.7, 'TtTt');
    // Cuore di Cristallo (blu, sfaccettato)
    const t3 = G([
      '..uuu...sss..',
      '.uvvuu.ssssr.',
      'uvvuuusssssrr',
      'uvuuusssssrrr',
      'uuuusuusrrrrr',
      '.uusuuuusrrr.',
      '..suuuuuusr..',
      '...ssuuurr...',
      '....ssurr....',
      '.....srr.....',
      '......r......']);
    GEMS.crystal = [
      { B: t0, pal, ol, g: [3, 1, 0], pulse: { c: 'd', b: 'c' } },
      { B: t1, pal, ol, g: [4, 2, 0], pulse: { c: 'd', b: 'c' } },
      { B: t2, pal, ol, g: [5, 2, 1], pulse: { c: 'd', b: 'c', t: 'T' } },
      { B: t3, pal, ol: '#0a1240', g: [10, 2, 1], ga: '#d8f0ff', pulse: { s: 'u', r: 's' } },
    ];
  }

  // ---------------------------------------------------------------- CELL (Dead Cells)
  {
    const pal = P5('#0a1850', '#1d48bc', '#3a8cff', '#8ad4ff', '#e6fbff', { W: '#ffffff', k: '#081040', h: '#3ae6ff', H: '#b4fcff' });
    const ol = '#060c2c';
    const cell = (n, core) => {
      const B = buf(n, n), r = n / 2;
      ell(B, r, r, r, r, (nx, ny) => {
        const d = Math.hypot(nx, ny), s = -0.7 * nx - 0.7 * ny;
        if (d < core) return d < core * 0.5 && n > 7 ? 'k' : 'b';
        if (d > 0.72) return s > 0.3 ? 'e' : s > -0.45 ? 'd' : 'c';
        return s > 0.2 ? 'd' : 'c';
      });
      return B;
    };
    const ring = (n, R, step) => { const p = [], c = n / 2 - 0.5; for (let i = 0; i < 360; i += step) { const a = i * Math.PI / 180; p.push([Math.round(c + Math.cos(a) * R), Math.round(c + Math.sin(a) * R)]); } return p; };
    const halo = (cx, cy, R, step, col) => ring(0, R, step).map(([x, y]) => [x + cx, y + cy, col]);
    const t0 = cell(5, 0.35), t1 = cell(7, 0.4), t2 = cell(9, 0.42), t3 = cell(11, 0.42);
    GEMS.cell = [
      { B: t0, pal, ol, g: [3, 1, 0], pulse: { c: 'd', b: 'c' } },
      { B: t1, pal, ol, g: [4, 1, 0], pulse: { c: 'd', b: 'c' } },
      { B: t2, pal, ol, W: 13, H: 13, haloR: 5.6, g: [6, 1, 0], pulse: { c: 'd', b: 'c' } },
      { B: t3, pal, ol, W: 16, H: 16, haloR: 7.2, g: [8, 1, 1], pulse: { c: 'd', b: 'c' } },
    ];
    for (const d of GEMS.cell) if (d.haloR) d.halo = halo((d.B.length) / 2 - 0.5, (d.B.length) / 2 - 0.5, d.haloR, d.haloR > 6 ? 30 : 45, '#3ae6ff');
  }

  // ---------------------------------------------------------------- TEAR (Blasphemous)
  {
    const pal = P5('#4a2606', '#a46a12', '#e2a830', '#ffdc6e', '#fff6d0', { W: '#ffffff', r: '#c41e2a' });
    const ol = '#2a1404';
    GEMS.tear = [
      { B: G([
        '..c..',
        '..c..',
        '.cdc.',
        'cdedb',
        'cdeeb',
        '.cdb.']), pal, ol, g: [3, 1, 0], pulse: { c: 'd', d: 'e' } },
      { B: G([
        '...c...',
        '...c...',
        '..cdc..',
        '.cdedb.',
        'cdeWedb',
        'cdeeedb',
        '.cdddb.',
        '..bbb..']), pal, ol, g: [5, 2, 0], pulse: { c: 'd', d: 'e' } },
      { B: G([
        '....c....',
        '....c....',
        '...cdc...',
        '...cdc...',
        '..cdedb..',
        '.cdeeedb.',
        'cdeeWeedb',
        'cdeWWWedb',
        'cdeeWeedb',
        '.cdeeedb.',
        '..bdddb..',
        '...bbb...']), pal, ol, g: [6, 3, 1], pulse: { c: 'd', d: 'e' } },
      { B: G([
        '......c......',
        '......c......',
        '.....cdc.....',
        '.....cdc.....',
        '....cdedb....',
        '...cdeeedb...',
        '..cdeeWeedb..',
        '.cdeeeWeeedb.',
        '.cdeWWWWWedb.',
        '.cdeeeWeeedb.',
        '.cddeeWeeddb.',
        '..cddeeeddb..',
        '...bbdddbb...',
        '.....bbb.....']), pal, ol, g: [9, 3, 1], pulse: { c: 'd', d: 'e' }, rays: true },
    ];
  }

  // ---------------------------------------------------------------- COIN (Terraria)
  {
    const C = { // rame, argento, oro, platino
      p: ['#4a1e0c', '#8e4420', '#c8692e', '#ee9a5a', '#ffd2a8'],
      s: ['#2e3442', '#6c7686', '#a8b2c0', '#dce2ea', '#ffffff'],
      g: ['#5a3606', '#ac7410', '#e6b422', '#ffe462', '#fff8c8'],
      t: ['#344456', '#7a90a4', '#bcd2de', '#e6f6ff', '#ffffff'],
    };
    const mk = (n, key) => { const T = '01234'; const B = coinFace(buf(n, n), n / 2, n / 2, n / 2, T); return { B, pal: Object.fromEntries(C[key].map((c, i) => [String(i), c])), ol: '#1a0e08' }; };
    const tiers = [mk(5, 'p'), mk(7, 's'), mk(9, 'g'), mk(12, 't')];
    tiers.forEach((d, i) => { d.g = [[3, 1, 0], [4, 1, 0], [6, 1, 1], [8, 1, 1]][i]; d.pulse = { 2: '3', 1: '2' }; });
    GEMS.coin = tiers;
  }

  // ---------------------------------------------------------------- PENNY (Isaac)
  {
    const C = {
      p: ['#5a2c06', '#a8601a', '#e09a2a', '#ffcc4a', '#fff0a8'],
      n: ['#2c323e', '#666f80', '#a6b0c0', '#d8e0ea', '#ffffff'],
      d: ['#2e3a56', '#6a80a6', '#aec4e2', '#e0ecff', '#ffffff'],
      l: ['#6a4206', '#c08a12', '#f2c62a', '#ffe874', '#fffbe0'],
    };
    // moneta in 3/4: faccia ellittica + spessore sotto
    const mk = (w, h, th, key) => {
      const B = buf(w, h), ry = (h - th) / 2;
      ell(B, w / 2, ry + th, w / 2, ry, (nx, ny) => (nx > 0.3 ? '0' : '1'));
      ell(B, w / 2, ry, w / 2, ry, (nx, ny) => {
        const d = Math.hypot(nx, ny), s = -0.7 * nx - 0.7 * ny;
        if (d > 0.7) return s > 0.2 ? '4' : s > -0.5 ? '3' : '2';
        return s > 0.3 ? '3' : s < -0.3 ? '1' : '2';
      });
      return { B, pal: Object.assign(Object.fromEntries(C[key].map((c, i) => [String(i), c])), { g: '#1f7a32', G: '#5ad06a' }), ol: OUT };
    };
    const tiers = [mk(6, 5, 1, 'p'), mk(8, 7, 2, 'n'), mk(10, 9, 2, 'd'), mk(13, 12, 2, 'l')];
    // quadrifoglio sul Penny Fortunato
    put(tiers[3].B, 4, 1, ['.G.G.', 'GgGgG', '.GgG.', 'GgGgG', '.G.G.']);
    tiers.forEach((d, i) => { d.g = [[4, 1, 0], [5, 1, 0], [7, 1, 1], [9, 1, 1]][i]; d.pulse = { 2: '3' }; });
    GEMS.penny = tiers;
  }

  // registrazione orb (dopo le definizioni)
  function regGems() {
    for (const k in GEMS) GEMS[k].forEach((d, t) => {
      const over0 = (d.halo || []).slice(), over1 = (d.halo2 || d.halo || []).slice();
      const base = bake(d.B, d.pal, { ol: d.ol, olc: d.olc, W: d.W, H: d.H, diag: d.diag, over: over0 });
      if (d.g) over1.push(...glint(d.g[0], d.g[1], d.g[2], '#ffffff', d.ga || '#fff6d0'));
      const sp = bake(d.B, d.pulse ? up(d.pal, d.pulse) : d.pal, { ol: d.ol, olc: d.olc, W: d.W, H: d.H, diag: d.diag, over: over1 });
      reg('gem_' + k + '_' + t, base);
      reg('gem_' + k + '_' + t + '_s', sp);
      if (t === 0) reg('gem_' + k, base);
      if (t === 2) reg('gemb_' + k, base);
    });
  }
  regGems();
})();

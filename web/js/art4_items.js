'use strict';
(() => {
// =============================================================================
// ART4 · OGGETTI (items) — orb di esperienza per personaggio (4 tier × 2 frame),
// pickup speciali, oggetti distruttibili (luci di scena), icone delle Ultimate
// e icone dei potenziamenti della Merceria.
// Pixel-art originale a griglie di caratteri con palette esplicite: luce
// dall'alto a sinistra, 3-5 toni per materiale, contorno di 1 px selettivo.
// Registra solo tramite regSprite (SPR); nessun nome globale nuovo.
// =============================================================================
  const OUT = '#1a1220';
  const RGB = {};
  const rgb = h => RGB[h] || (RGB[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);

  // ---- micro-motore a griglie ------------------------------------------------
  const buf = (w, h) => Array.from({ length: h }, () => new Array(w).fill(null));
  // stampa righe di caratteri: '.'/' ' trasparente, '_' cancella
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
  function line(B, x0, y0, x1, y1, ch) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) { dot(B, x0, y0, ch); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    return B;
  }
  const path = (B, pts, ch) => { for (let i = 1; i < pts.length; i++) line(B, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], ch); return B; };
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
  // profondità a 4 vicini: 1 = bordo della forma
  function dep4(B) {
    const h = B.length, w = B[0].length;
    const D = B.map(r => r.map(c => (c ? 99 : 0)));
    for (let it = 0; it < 10; it++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!D[y][x]) continue;
      const n = Math.min(y > 0 ? D[y - 1][x] : 0, y < h - 1 ? D[y + 1][x] : 0, x > 0 ? D[y][x - 1] : 0, x < w - 1 ? D[y][x + 1] : 0);
      if (n + 1 < D[y][x]) D[y][x] = n + 1;
    }
    return D;
  }
  // tono di sfera: luce in alto a sinistra. T = toni dal più scuro al più chiaro (4 o 5)
  function sph(T, nx, ny) {
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const l = 0.45 * nz + 0.5 * (-0.6 * nx - 0.8 * ny) + 0.1;
    if (T.length >= 5) return l > 0.74 ? T[4] : l > 0.4 ? T[3] : l > 0.02 ? T[2] : l > -0.28 ? T[1] : T[0];
    return l > 0.45 ? T[3] : l > 0.05 ? T[2] : l > -0.28 ? T[1] : T[0];
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
  // scintilla a croce (frame _s): pixel finali senza contorno
  function glint(x, y, big, col = '#ffffff', arm = '#fff6d0') {
    const p = [[x, y, col], [x - 1, y, arm], [x + 1, y, arm], [x, y - 1, arm], [x, y + 1, arm]];
    if (big) p.push([x - 2, y, arm], [x + 2, y, arm], [x, y - 2, arm], [x, y + 2, arm]);
    return p;
  }
  const P5 = (a, b, c, d, e, extra) => Object.assign({ a, b, c, d, e }, extra || {});
  const pal5 = (arr, keys = '01234', extra) => Object.assign(Object.fromEntries(arr.map((c, i) => [keys[i], c])), extra || {});
  const up = (pal, map) => { const p = Object.assign({}, pal); for (const k in map) p[k] = pal[map[k]]; return p; };

  // ---- forme procedurali ------------------------------------------------------
  // prisma di cristallo (punta in alto): base in basso a sinistra (x, y); T 'abcde'
  function shard(B, x, y, w, h, lean = 0, T = 'abcde') {
    const half = (w - 1) / 2, tipEven = w % 2 ? 0 : 0.5;
    for (let j = 0; j < h; j++) {
      const yy = y - j, f = h - 1 - j, sx = x + Math.round(lean * j);
      for (let i = 0; i < w; i++) {
        const d = Math.abs(i - half);
        if (d > f + tipEven) continue;
        if (j === 0 && w >= 4 && d > half - 1) continue;
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
  // rombo sfaccettato (TL, TR, BL, BR) con filo di luce in alto a sinistra
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
  // moneta frontale (Terraria): bordo smussato + solco inciso + faccia, toni '0'..'4'
  function coin(n, groove) {
    const B = ell(buf(n, n), n / 2, n / 2, n / 2, n / 2, '2'), D = dep4(B), c = n / 2;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!B[y][x]) continue;
      const s = (c - x - 0.5) + (c - y - 0.5), d = D[y][x];
      if (d === 1) B[y][x] = s > 1.5 ? '4' : s > -1.5 ? '3' : s > -n * 0.55 ? '2' : '1';
      else if (d === 2 && groove) B[y][x] = s > 0.5 ? '1' : s < -0.5 ? '3' : '2';
      else B[y][x] = s > n * 0.3 ? '3' : '2';
    }
    return B;
  }

  // ===========================================================================
  // 1) ORB DI ESPERIENZA — gem_<k>_<t> e gem_<k>_<t>_s (+ gem_<k>, gemb_<k>)
  // ===========================================================================
  const GEMS = {};

  // ---------------------------------------------------------------- GEO (Hollow Knight)
  // frammenti di conchiglia fossile color osso/grigio-azzurro; t3 = deposito di Geo
  {
    const pal = P5('#2c3244', '#5b6680', '#93a0b6', '#c9d1dd', '#f4f1e8', { k: '#1a1826', l: '#302d40', m: '#4a4762', n: '#6e6a88' });
    const ol = '#141826';
    GEMS.geo = [
      { B: G([
        '.edd..',
        'eeddc.',
        'dddcbb',
        'cccbba',
        '.bbaa.']), pal, ol, g: [4, 1, 0], pulse: { c: 'd' } },
      { B: G([
        '..eedd..',
        '.eeedcc.',
        'eedddcbc',
        'ddcbbccb',
        '.ccccbba',
        '..bbaaa.']), pal, ol, g: [6, 1, 0], pulse: { c: 'd' } },
      { B: G([
        '...eeddd..',
        '.eeeeddcc.',
        'eeedddccbc',
        'eddbbbdcbb',
        'dddcccbbcb',
        '.cccbbbcba',
        '..bbbbbaa.',
        '...aaaa...']), pal, ol, g: [7, 1, 1], pulse: { c: 'd' } },
      { B: G([
        '....eed.......',
        '...eeddc..ed..',
        '..kddccbkeddc.',
        '.nmkbbbkmkcbk.',
        'nnmmkkkmmmkkml',
        'nmmmmmmmeedmll',
        'nmmmlmmkddcbll',
        'mmllmmmkcbbkll',
        'mlllllllkkklkk',
        '.llllllllllkk.',
        '..lkkkkkkkkk..']), pal, ol, g: [4, 1, 1], pulse: { c: 'd', m: 'n' } },
    ];
  }

  // ---------------------------------------------------------------- BLOOD (ULTRAKILL)
  {
    const pal = P5('#3a0610', '#7e0e1c', '#c41e2a', '#ff4545', '#ffa090', { W: '#ffffff' });
    const ol = '#1c0308';
    const orb = ell(buf(13, 13), 6.5, 6.5, 6.5, 6.5, (nx, ny) => sph('abcde', nx, ny));
    put(orb, 2, 2, ['.ee', 'eWe', '.e.']);
    put(orb, 9, 10, ['d']);
    GEMS.blood = [
      { B: G([
        '..c..',
        '.cdc.',
        '.dcc.',
        'cedcb',
        'cdccb',
        '.bbb.']), pal, ol, g: [3, 1, 0], pulse: { b: 'c' } },
      { B: G([
        '...c...',
        '..cdc..',
        '..dcc..',
        '.dccbc.',
        'cedccbb',
        'cddcccb',
        '.cccbb.',
        '..bbb..']), pal, ol, g: [5, 2, 0], pulse: { b: 'c' } },
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
        '..bbbbb..']), pal, ol, g: [6, 3, 1], pulse: { b: 'c' } },
      { B: orb, pal, ol, g: [10, 2, 1], pulse: { b: 'c', a: 'b' } },
    ];
  }

  // ---------------------------------------------------------------- DARKNESS (Hades)
  {
    const pal = P5('#1c0a30', '#3e1a6c', '#7030b4', '#ac64ee', '#ecd0ff', { k: '#120822', l: '#24162e', m: '#3a2a44' });
    const ol = '#0c0416';
    const t0 = shard(buf(5, 7), 0, 6, 5, 7);
    const t1 = shard(shard(buf(8, 9), 0, 8, 5, 9), 4, 8, 4, 6, 0.25);
    const t2 = buf(11, 11);
    shard(t2, 0, 10, 4, 6, -0.2); shard(t2, 6, 10, 4, 7, 0.25); shard(t2, 3, 10, 5, 11);
    const t3 = buf(13, 14);
    shard(t3, 0, 12, 3, 6, -0.25); shard(t3, 9, 12, 4, 7, 0.3); shard(t3, 6, 12, 4, 10, 0.1); shard(t3, 1, 12, 4, 11, -0.1); shard(t3, 3, 12, 5, 14);
    put(t3, 0, 11, ['.mmmllmlmllm.', 'lmllklllkkkkl', '.kkkkkkkkkkk.']);
    GEMS.darkness = [
      { B: t0, pal, ol, g: [3, 1, 0], pulse: { b: 'c' } },
      { B: t1, pal, ol, g: [3, 1, 0], pulse: { b: 'c' } },
      { B: t2, pal, ol, g: [6, 1, 1], pulse: { b: 'c' } },
      { B: t3, pal, ol, g: [6, 1, 1], pulse: { b: 'c' } },
    ];
  }

  // ---------------------------------------------------------------- CRYSTAL (Celeste)
  {
    const pal = P5('#0a3a2a', '#14874e', '#2ed26a', '#8cff9c', '#eafff0', { t: '#1aa89a', T: '#5ff0d8',
      q: '#14246e', r: '#2848c8', s: '#4a8cff', u: '#9ad2ff', v: '#eaf8ff' });
    const ol = '#06281c';
    const t0 = diamond(buf(5, 7), 2.5, 3.5, 2.6, 3.6, 'dcba', 'e');
    const t1 = diamond(buf(7, 9), 3.5, 4.5, 3.6, 4.6, 'dcba', 'e');
    const t2 = diamond(buf(9, 11), 4.5, 5.5, 4.6, 5.6, 'dcba', 'e');
    diamond(t2, 4.5, 5.5, 2.1, 2.7, 'TtTt');
    // Cuore di Cristallo (lato A, blu): quattro facce + riflesso sul lobo sinistro
    const t3 = buf(13, 12);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 13; x++) {
      const px = x + 0.5, py = y + 0.5;
      const inL = (px - 3.5) ** 2 + (py - 3.6) ** 2 <= 3.6 ** 2, inR = (px - 9.5) ** 2 + (py - 3.6) ** 2 <= 3.6 ** 2;
      const inT = py >= 3.6 && Math.abs(px - 6.5) <= (12 - py) * 0.78;
      if (!(inL || inR || inT)) continue;
      const left = px < 6.5, top = py < 6 - Math.abs(px - 6.5) * 0.35;
      t3[y][x] = top ? (left ? 'u' : 's') : (left ? 's' : 'r');
    }
    put(t3, 1, 1, ['.vv', 'vv.', 'v..']);
    put(t3, 6, 0, ['_']);
    dot(t3, 9, 9, 'q'); dot(t3, 8, 10, 'q');
    GEMS.crystal = [
      { B: t0, pal, ol, g: [3, 1, 0], pulse: { b: 'c' } },
      { B: t1, pal, ol, g: [4, 2, 0], pulse: { b: 'c' } },
      { B: t2, pal, ol, g: [5, 2, 1], pulse: { b: 'c', t: 'T' } },
      { B: t3, pal, ol: '#0a1240', g: [10, 2, 1], ga: '#d8f0ff', pulse: { r: 's' } },
    ];
  }

  // ---------------------------------------------------------------- CELL (Dead Cells)
  // sfera blu luminosa con nucleo scuro; dal tier 2 un alone ciano
  {
    const pal = P5('#0a1850', '#1d48bc', '#3a8cff', '#8ad4ff', '#e6fbff', { k: '#081040', W: '#ffffff' });
    const ol = '#060c2c';
    const cell = (n, core) => {
      const B = ell(buf(n, n), n / 2, n / 2, n / 2, n / 2, 'c'), D = dep4(B), c = n / 2;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (!B[y][x]) continue;
        const dx = x + 0.5 - c, dy = y + 0.5 - c, s = -dx - dy, r = Math.hypot(dx - 0.6, dy - 0.6);
        if (D[y][x] === 1) B[y][x] = s > 1 ? 'e' : s > -2.5 ? 'd' : 'c';
        else if (r < core * 0.4 && n >= 11) B[y][x] = 'a';
        else if (r < core) B[y][x] = 'b';
        else B[y][x] = s > 1.2 ? 'd' : 'c';
      }
      if (n >= 7) { const h = Math.floor(n * 0.3); dot(B, h, h, 'W'); if (n >= 9) dot(B, h + 1, h, 'e'); }
      return B;
    };
    const halo = (n, R, step, col) => {
      const p = [], c = n / 2 - 0.5;
      for (let i = 0; i < 360; i += step) { const a = (i + 22.5) * Math.PI / 180; p.push([Math.round(c + Math.cos(a) * R), Math.round(c + Math.sin(a) * R), col]); }
      return p;
    };
    GEMS.cell = [
      { B: cell(5, 1.1), pal, ol, g: [3, 1, 0], pulse: { c: 'd' } },
      { B: cell(7, 1.6), pal, ol, g: [4, 1, 0], pulse: { c: 'd' } },
      { B: cell(9, 2.1), pal, ol, W: 13, H: 13, halo: halo(9, 5.6, 45, '#3ae6ff'), g: [6, 1, 0], pulse: { c: 'd' } },
      { B: cell(11, 2.6), pal, ol, W: 16, H: 16, halo: halo(11, 7.1, 30, '#3ae6ff'), halo2: halo(11, 7.1, 30, '#b4fcff'), g: [8, 1, 1], pulse: { c: 'd' } },
    ];
  }

  // ---------------------------------------------------------------- TEAR (Blasphemous)
  // Lacrime d'Espiazione: gocce d'oro luminose; t3 = grande lacrima-grano di rosario
  {
    const pal = P5('#4a2606', '#a46a12', '#e2a830', '#ffdc6e', '#fff6d0', { W: '#ffffff' });
    const ol = '#2a1404';
    const rays = (cx, cy, R, col) => [[cx, cy - R, col], [cx, cy + R, col], [cx - R, cy, col], [cx + R, cy, col], [cx - R + 1, cy - R + 1, col], [cx + R - 1, cy - R + 1, col], [cx - R + 1, cy + R - 1, col], [cx + R - 1, cy + R - 1, col]];
    GEMS.tear = [
      { B: G([
        '..c..',
        '.cdc.',
        'cdedb',
        'cdeeb',
        '.cdb.']), pal, ol, g: [3, 1, 0], pulse: { c: 'd', d: 'e' } },
      { B: G([
        '...c...',
        '..cdc..',
        '..cdb..',
        '.cdedb.',
        'cdeWedb',
        'cdeeedb',
        '.cdddb.',
        '..bbb..']), pal, ol, g: [5, 2, 0], pulse: { c: 'd', d: 'e' } },
      { B: G([
        '....c....',
        '...cdc...',
        '...cdb...',
        '..cdedb..',
        '.cdeeedb.',
        '.cdeWeedb',
        'cdeWWWedb',
        'cdeeWeedb',
        'cddeeeddb',
        '.cdddddb.',
        '..bbbbb..']), pal, ol, g: [6, 3, 1], pulse: { c: 'd', d: 'e' } },
      { B: G([
        '.....c.....',
        '....cdb....',
        '...cdedb...',
        '..cdeeedb..',
        '.cdeeWeedb.',
        '.cdeeWeedb.',
        'cdeWWWWWedb',
        'cdeeeWeeedb',
        'cddeeWeeddb',
        '.cddeeeddb.',
        '..bcdddcb..',
        '...bbbbb...']), pal, ol, W: 15, H: 17, halo: rays(6, 8, 7, '#ffdc6e'), halo2: rays(6, 8, 7, '#fff6d0'), g: [8, 3, 1], pulse: { c: 'd', d: 'e' } },
    ];
  }

  // ---------------------------------------------------------------- COIN (Terraria)
  // rame, argento, oro, platino
  {
    const C = [
      ['#4a1e0c', '#8e4420', '#c8692e', '#ee9a5a', '#ffd2a8'],
      ['#2e3442', '#6c7686', '#a8b2c0', '#dce2ea', '#ffffff'],
      ['#5a3606', '#ac7410', '#e6b422', '#ffe462', '#fff8c8'],
      ['#344456', '#7a90a4', '#bcd2de', '#e6f6ff', '#ffffff'],
    ];
    const n = [5, 7, 9, 12];
    GEMS.coin = n.map((sz, i) => ({ B: coin(sz, sz >= 7), pal: pal5(C[i]), ol: '#1a0e08', g: [[3, 1, 0], [5, 1, 0], [6, 1, 1], [9, 2, 1]][i], pulse: { 2: '3' } }));
  }

  // ---------------------------------------------------------------- PENNY (Isaac)
  // Penny, Nickel, Dime, Penny Fortunato (quadrifoglio)
  {
    const C = [
      ['#5a2c06', '#a8601a', '#e09a2a', '#ffcc4a', '#fff0a8'],
      ['#2c323e', '#666f80', '#a6b0c0', '#d8e0ea', '#ffffff'],
      ['#2e3a56', '#6a80a6', '#aec4e2', '#e0ecff', '#ffffff'],
      ['#6a4206', '#c08a12', '#f2c62a', '#ffe874', '#fffbe0'],
    ];
    // moneta in 3/4: faccia ellittica + spessore sotto
    const mk = (w, fh, th, i) => {
      const B = buf(w, fh + th);
      ell(B, w / 2, fh / 2 + th, w / 2, fh / 2, (nx) => (nx > 0.35 ? '0' : '1'));
      const F = ell(buf(w, fh), w / 2, fh / 2, w / 2, fh / 2, '2'), D = dep4(F);
      for (let y = 0; y < fh; y++) for (let x = 0; x < w; x++) {
        if (!F[y][x]) continue;
        const s = (w / 2 - x - 0.5) + (fh / 2 - y - 0.5), d = D[y][x];
        B[y][x] = d === 1 ? (s > 0.8 ? '4' : s > -1.5 ? '3' : '2') : d === 2 && w >= 8 ? (s > 0 ? '1' : '3') : (s > w * 0.25 ? '3' : '2');
      }
      return { B, pal: pal5(C[i], '01234', { g: '#1f7a32', G: '#5ad06a' }), ol: OUT };
    };
    const tiers = [mk(6, 5, 1, 0), mk(8, 6, 2, 1), mk(10, 8, 2, 2), mk(13, 11, 2, 3)];
    put(tiers[3].B, 4, 3, ['.G.G.', 'GgGgG', '..g..', 'GgGgG', '.G.G.']);
    tiers.forEach((d, i) => { d.g = [[4, 1, 0], [5, 1, 0], [7, 1, 1], [9, 1, 1]][i]; d.pulse = { 2: '3' }; });
    GEMS.penny = tiers;
  }

  for (const k in GEMS) GEMS[k].forEach((d, t) => {
    const over0 = (d.halo || []).slice(), over1 = (d.halo2 || d.halo || []).slice();
    if (d.g) over1.push(...glint(d.g[0], d.g[1], d.g[2], '#ffffff', d.ga || '#fff6d0'));
    const o = { ol: d.ol, olc: d.olc, W: d.W, H: d.H };
    const base = bake(d.B, d.pal, Object.assign({ over: over0 }, o));
    const sp = bake(d.B, d.pulse ? up(d.pal, d.pulse) : d.pal, Object.assign({ over: over1 }, o));
    reg('gem_' + k + '_' + t, base);
    reg('gem_' + k + '_' + t + '_s', sp);
    // compatibilità: gem_<k> = tier 0, gemb_<k> = tier 2 (stesso oggetto, niente doppioni)
    if (t === 0) SPR['gem_' + k] = SPR['gem_' + k + '_0'];
    if (t === 2) SPR['gemb_' + k] = SPR['gem_' + k + '_2'];
  });

  // ===========================================================================
  // 2) PICKUP SPECIALI
  // ===========================================================================
  const GOLD = { a: '#5a3606', b: '#a8700e', c: '#e2b030', d: '#ffe06a', e: '#fff6c8', W: '#ffffff' };

  // Rosario: anello di grani granata + croce d'oro (ripulisce lo schermo)
  {
    const B = buf(14, 14);
    for (let i = 1; i < 10; i++) {
      const a = Math.PI / 2 + i / 10 * Math.PI * 2;
      put(B, Math.round(7 + Math.cos(a) * 5.2 - 1), Math.round(4.4 + Math.sin(a) * 3.9 - 1), ['Qq', 'qR']);
    }
    put(B, 4, 8, [
      '..cb..',
      '..dc..',
      'deWdcc',
      'bcdcbb',
      '..dc..',
      '..cb..']);
    reg('pk_rosary', bake(B, Object.assign({ R: '#7a1424', q: '#c8303a', Q: '#ff8a80' }, GOLD), { ol: '#2a0a10' }));
  }

  // Clessidra di Crono: blocca i nemici (sabbia di ghiaccio)
  reg('pk_hourglass', bake(G([
    '.dddddddd.',
    'dccccccccb',
    'c.hSSSSg.b',
    'c.hSSSsg.b',
    'c..hSsg..b',
    'c...Sg...b',
    'c...Sg...b',
    'c..hSGg..b',
    'c.hGSGGg.b',
    'c.hGsSGg.b',
    'c.hsSSsg.b',
    'c.hSSSSg.b',
    'dccccccccb',
    '.bbbbbbbb.']), Object.assign({ h: '#d8f4ff', g: '#5a88b0', G: '#24405e', s: '#5ac8ff', S: '#d0f6ff' }, GOLD), { ol: '#1a1430' }));

  // Bomba (Isaac): corpo grigio scuro, tappo, miccia accesa
  {
    const B = buf(12, 13);
    ell(B, 6, 8.5, 5.6, 4.6, (nx, ny) => sph('01234', nx, ny));
    put(B, 2, 5, ['.W', 'W4']);
    put(B, 4, 2, ['.kKk', 'kKKKk']);
    put(B, 7, 0, ['..y', '.fY', 'f..']);
    reg('pk_bomb', bake(B, { 0: '#16161e', 1: '#2c2c38', 2: '#46465a', 3: '#6e6e86', 4: '#a8a8bc', W: '#e8e8f4', k: '#1e1a20', K: '#4a4450', f: '#c89a60', Y: '#ffd23f', y: '#fff2a0' },
      { olc: { Y: '#c83a1a', y: '#c83a1a' }, over: [[11, 0, '#ff7a2a'], [10, 0, '#fff2a0'], [11, 1, '#ffd23f'], [12, 0, '#ffd23f'], [11, -1, '#ffd23f']] }));
  }

  // Borsellino di filo d'oro (piccolo) e sacco grande
  {
    const VEL = { 0: '#3a0a14', 1: '#7a1a2a', 2: '#b02a3a', 3: '#e05a5a', 4: '#ff9a8a' };
    const B = buf(10, 11);
    ell(B, 5, 7.4, 4.9, 3.6, (nx, ny) => sph('01234', nx, ny));
    put(B, 1, 1, ['.344332.', '..3221..', 'dcbddcbc', '.d....b.']);
    reg('pk_purse', bake(B, Object.assign({}, VEL, GOLD)));
    const BB = buf(14, 14);
    ell(BB, 7, 9.2, 6.9, 4.8, (nx, ny) => sph('01234', nx, ny));
    put(BB, 2, 0, [
      '..334332..',
      '.32232221.',
      '..322221..',
      '...3221...',
      'dcbcddcbcd',
      'd..b..b..c']);
    put(BB, 4, 7, ['.rrr.', 'rRxRr', 'rxRxr', 'rRxRr', '.rrr.']);
    reg('pk_purse_big', bake(BB, Object.assign({ 0: '#3a2410', 1: '#6e4a24', 2: '#a87a44', 3: '#d8b07a', 4: '#f2dcae', r: '#7a1a2a', R: '#b02a3a', x: '#ffe06a' }, GOLD)));
  }

  // Sfera dell'Ultimate: energia bianco-oro vorticante
  {
    const B = ell(buf(12, 12), 6, 6, 6, 6, (nx, ny) => {
      const r = Math.hypot(nx, ny), a = Math.atan2(ny, nx), sw = Math.sin(a * 2 + r * 7.5);
      if (r < 0.26) return 'W';
      if (r > 0.84) return (nx + ny < 0.2) ? (sw > 0 ? 'd' : 'c') : (sw > 0 ? 'c' : 'b');
      return sw > 0.5 ? (r < 0.6 ? 'W' : 'e') : sw > -0.1 ? 'd' : sw > -0.7 ? 'c' : 'b';
    });
    reg('pk_ultorb', bake(B, GOLD, { ol: '#6a4008', W: 16, H: 16, over: [[1, 2, '#fff6c8'], [14, 3, '#ffe06a'], [2, 13, '#ffe06a'], [13, 13, '#fff6c8'], [8, 0, '#ffffff'], [15, 8, '#ffffff']] }));
  }

  // Ago d'oro con filo rosso: gettone di rianimazione
  {
    const B = G([
      '...........dd.',
      '..........d.c.',
      '.........dcc..',
      '........dc....',
      '.......dc.....',
      '......dc......',
      '.....dc.......',
      '....dc........',
      '...dc.........',
      '..dc..........',
      '.dc...........',
      '.c............',
      'b.............',
      '..............']);
    // il filo rosso esce dalla cruna e si chiude a cuore
    path(B, [[11, 1], [13, 3], [13, 6]], 'R');
    put(B, 7, 7, [
      '.RR.RR.',
      'R..R..R',
      'R.....R',
      '.R...R.',
      '..R.R..',
      '...R...']);
    dot(B, 13, 4, 'r'); dot(B, 12, 7, 'r');
    reg('pk_revive', bake(B, Object.assign({ R: '#e0303a', r: '#8e1424' }, GOLD)));
  }

  // Calamita da sarta: ferro di cavallo rosso con punte d'argento e filo avvolto
  reg('pk_magnet', bake(G([
    '...443322...',
    '..44332221..',
    '.4433222211.',
    '443......211',
    '432......210',
    'dcb......cbb',
    'cbb......bba',
    '432......210',
    '432......210',
    'Sst......sst',
    'Sst......sst',
    'sst......stt']), Object.assign({ 0: '#3a0a10', 1: '#7a1420', 2: '#c41e2a', 3: '#ff4a4a', 4: '#ff9a90', S: '#ffffff', s: '#b4c0d0', t: '#5a6476' }, GOLD)));

  // ===========================================================================
  // 3) OGGETTI DISTRUTTIBILI (luci di scena) — <nome> e <nome>_b (tremolio)
  // ===========================================================================
  const FIRE = { y: '#fff2a0', Y: '#ffd23f', O: '#ff8a2a', R: '#d8401a', W: '#ffffff' };
  const FIRE_OL = { y: '#a8301a', Y: '#a8301a', O: '#7a1e10', R: '#5a1408', W: '#a8301a' };
  const IRON = { k: '#16141e', m: '#34323f', n: '#57556a', N: '#8c8aa0' };
  const brk = (name, fa, fb) => { reg(name, fa); reg(name + '_b', fb); };

  // Lanterna a lumafly (Hollow Knight): bulbo di vetro con lucciole, palo di ferro
  {
    const L = { g: '#3a7ea6', G: '#86d4ee', H: '#d4f6ff', Y: '#ffffff', y: '#f6ffd0' };
    const mk = flies => {
      const B = G([
        '....Nm....',
        '...nmmk...',
        '..knmmkk..',
        '.kHHGGGgk.',
        'kHHGGGGGgk',
        'kHGGGGGGgk',
        'kGGGGGGGgk',
        'kGGGGGGggk',
        'kgGGGGGggk',
        '.kgGGGggk.',
        '..kkkkkk..',
        '..nmmmmk..',
        '...nmmk...',
        '....nk....',
        '....nk....',
        '....nk....',
        '....nk....',
        '....nk....',
        '....nk....',
        '...nmmk...',
        '..nmmmmk..',
        '.nmmmmmmk.']);
      for (const [x, y, c] of flies) dot(B, x, y, c);
      return bake(B, Object.assign({}, IRON, L));
    };
    brk('brk_lumafly', mk([[3, 5, 'Y'], [6, 6, 'Y'], [4, 8, 'y'], [7, 8, 'Y'], [5, 4, 'y'], [2, 7, 'y']]), mk([[4, 5, 'Y'], [6, 4, 'y'], [3, 7, 'Y'], [6, 8, 'Y'], [5, 7, 'y'], [7, 6, 'y']]));
  }

  // Urna del Tartaro (Hades): terracotta rossa con fasce d'oro e meandro nero
  {
    const U = { 0: '#3a0e0e', 1: '#7a1e18', 2: '#b23a24', 3: '#e0643a', 4: '#ff9a64', k: '#1a1012' };
    const rows = [
      '..dddccccb..',
      '...322221...',
      '...322221...',
      '..33222211..',
      '.4332222211.',
      'dcccccccccbb',
      'kckkkckkkckk',
      'kkkckkkckkkc',
      'dcccccccccbb',
      '433322222110',
      '.4332222211.',
      '.3322222110.',
      '..32222211..',
      '...322211...',
      '...dcccb....',
      '..bbbbbbbb..'];
    const A = G(rows), Bf = G(rows);
    dot(Bf, 2, 4, 'e'); dot(Bf, 1, 9, 'e');
    brk('brk_urn', bake(A, Object.assign({}, U, GOLD)), bake(Bf, Object.assign({}, U, GOLD)));
  }

  // Candelabro (Blasphemous): ferro brunito e oro, tre ceri
  {
    const mk = k => {
      const B = buf(16, 22);
      const fl = k ? ['.y.', '.Yy', 'YWY', 'OWO', '.O.'] : ['.y.', 'yY.', 'YWO', 'OWO', '.O.'];
      const fs = k ? ['y..', 'YY.', 'OWO', '.O.'] : ['.y.', '.YY', 'OWO', '.O.'];
      put(B, 6, 0, fl); put(B, 1, 4, fs); put(B, 12, 4, fs.map(r => r.split('').reverse().join('')));
      put(B, 7, 5, ['wv', 'wv', 'wv', 'wv']);
      put(B, 2, 8, ['wv', 'wv', 'wv']); put(B, 12, 8, ['wv', 'wv', 'wv']);
      put(B, 5, 9, ['dccccb']);
      put(B, 0, 11, ['dccb', '.cb.']); put(B, 11, 11, ['.dccb', '..cb.']);
      path(B, [[1, 13], [2, 14], [5, 14], [6, 13]], 'b'); path(B, [[13, 13], [12, 14], [10, 14], [9, 13]], 'b');
      put(B, 7, 10, ['dc', 'dc', 'dc', 'cb', 'dc', 'ec', 'dc', 'dc', 'cb']);
      put(B, 5, 19, ['.dddcb', 'dccccbb']);
      put(B, 4, 21, ['bbbbbbbb']);
      return bake(B, Object.assign({ w: '#f2ead6', v: '#c0ae8c' }, GOLD, { b: '#6a4a14', c: '#b0821e', d: '#e8c050', e: '#fff0a0' }, FIRE), { olc: FIRE_OL });
    };
    brk('brk_candelabra', mk(0), mk(1));
  }

  // Vaso di coccio (Terraria)
  {
    const P = { 0: '#3a1a0c', 1: '#6e3418', 2: '#a8582a', 3: '#d88a4a', 4: '#f8be80', s: '#5a2a12' };
    const mk = k => {
      const B = buf(14, 14);
      ell(B, 7, 8.6, 6.6, 5.4, (nx, ny) => sph('01234', nx, ny));
      put(B, 3, 0, ['.433332.', '43222211', '.332221.', '..3221..']);
      put(B, 1, 7, ['s.ss.ss.ss.s']);
      for (let x = 2; x < 13; x += 3) dot(B, x, 10, 's');
      if (k) { dot(B, 4, 5, 'W'); }
      return bake(B, Object.assign({}, P, { W: '#fff0d8' }));
    };
    brk('brk_pot', mk(0), mk(1));
  }

  // Roccia colorata (Isaac): masso sfaccettato dalla tinta blu scura con la "X" in alto a destra
  {
    const R = { 0: '#101626', 1: '#222e4c', 2: '#384a72', 3: '#566c9a', 4: '#8aa0ca', x: '#e8f0ff', X: '#a8bce4' };
    const mk = k => {
      const B = buf(16, 13);
      const inR = (x, y) => { const px = x + 0.5, py = y + 0.5; return ((px - 8) / 7.9) ** 2 + ((py - 8) / 5.6) ** 2 <= 1 || ((px - 5.5) / 4.2) ** 2 + ((py - 4.6) / 3.6) ** 2 <= 1 || ((px - 11) / 3.6) ** 2 + ((py - 5.2) / 3.2) ** 2 <= 1; };
      for (let y = 0; y < 13; y++) for (let x = 0; x < 16; x++) {
        if (!inR(x, y)) continue;
        const nx = (x + 0.5 - 7.5) / 8, ny = (y + 0.5 - 7) / 6, r = Math.hypot(nx, ny);
        let l;
        if (r < 0.42) l = 0.35;                         // faccia superiore
        else { const ac = (Math.floor((Math.atan2(ny, nx) + Math.PI) / (Math.PI * 2 / 7)) + 0.5) * (Math.PI * 2 / 7) - Math.PI; l = -(0.6 * Math.cos(ac) + 0.8 * Math.sin(ac)) * (r > 0.8 ? 1 : 0.7); }
        B[y][x] = l > 0.55 ? '4' : l > 0.15 ? '3' : l > -0.3 ? '2' : l > -0.7 ? '1' : '0';
      }
      path(B, [[5, 7], [7, 8], [7, 10]], '1'); path(B, [[7, 8], [10, 7]], '1');
      put(B, 11, 2, k ? ['X.x', '.x.', 'x.X'] : ['x.X', '.x.', 'X.x']);
      return bake(B, R);
    };
    brk('brk_rock', mk(0), mk(1));
  }

  // Cassa di legno con angolari di ferro
  {
    const C = { 0: '#3a1e0c', 1: '#6e3e1a', 2: '#a0622a', 3: '#d08a44', 4: '#f0b878', k: '#2a2a36', s: '#7a7e90', S: '#c8ccd8' };
    const rows = [
      'Ss3333333333ss',
      's4333333333311',
      '33222222222211',
      '33222222223211',
      '33222222232211',
      '33111111321111',
      '33222223222211',
      '33222232222211',
      '33111321111111',
      '33223222222211',
      '33232222222211',
      '33322222222211',
      's1111111111110',
      'sk0000000000kk'];
    const A = G(rows), Bf = G(rows);
    dot(Bf, 0, 0, 'S'); dot(Bf, 1, 0, 'S'); dot(Bf, 0, 1, 'S');
    dot(A, 0, 0, 's');
    brk('brk_crate', bake(A, C), bake(Bf, C));
  }

  // Braciere di ferro con fuoco
  {
    const mk = k => {
      const B = buf(14, 20);
      put(B, 1, 0, k ? [
        '.....y......',
        '....yY...y..',
        '.y..YY..yY..',
        '.Yy.YOy.YO..',
        '.YYyYWOyYO.y',
        '.YOYWWWOOOYY',
        'yOWWWWWWOOOO',
        'OOWWWWWWWOOR',
        'ROOOOOOOOORR'] : [
        '......y.....',
        '..y..yY.....',
        '..Yy.YY..y..',
        '..YO.YOy.Yy.',
        'y.YOyWOYyYO.',
        'YYOWWWWOOYO.',
        'OOWWWWWWOOOy',
        'ROWWWWWWWOOO',
        'RROOOOOOOOOR']);
      put(B, 0, 8, [
        'kmnNNNNNNNNnmk',
        '.knnnnnnnnmmk.',
        '..kmmmmmmmmk..',
        '...kkmmmmkk...',
        '.....kmnk.....',
        '.....kmnk.....',
        '.....kNnk.....',
        '....kmmmmk....',
        '...kmk..kmk...',
        '..kmk....kmk..',
        '.kmk......kmk.',
        'kkk........kkk']);
      return bake(B, Object.assign({}, IRON, FIRE), { olc: FIRE_OL });
    };
    brk('brk_brazier', mk(0), mk(1));
  }

  // Bombola rossa (ULTRAKILL): cilindro sci-fi con spia luminosa e fascia di pericolo
  {
    const T = { 0: '#2a060a', 1: '#6a0e16', 2: '#b3262f', 3: '#e0484a', 4: '#ff8a80', k: '#16141e', m: '#3a3a48', n: '#6a6e80', N: '#a8acbc', Y: '#ffd23f', G: '#ff5a4a', H: '#ffd0b0', W: '#ffffff' };
    const mk = k => {
      const B = G([
        '...nNNNm....'.slice(0, 12),
        '..nNNNNNmk..',
        '.kmnnnnnmmk.',
        '.kkkkkkkkkk.',
        '.2344222110.',
        '.2342222110.',
        '.234kkkk110.',
        '.23kGGGGk10.',
        '.23kGHHGk10.',
        '.23kGHHGk10.',
        '.23kGGGGk10.',
        '.234kkkk110.',
        '.2342222110.',
        '.YkYYkYYkYk.',
        '.kYYkYYkYYk.',
        '.2342222110.',
        '.kkkkkkkkkk.',
        '.kmnnnnnmmk.',
        '..knnnnnmk..',
        '..kkkkkkkk..']);
      if (k) { put(B, 4, 7, ['WGGW', 'GWWG', 'GWWG', 'WGGW']); }
      return bake(B, T, { olc: {} });
    };
    brk('brk_terminal', mk(0), mk(1));
  }

  // Lanterna di montagna (Celeste): lanterna calda col tettuccio su un palo di legno,
  // base di pietre e una fila di bandierine di preghiera della vetta
  {
    const L = { 1: '#4a2a14', 2: '#7a4a22', 3: '#b07a40', 4: '#d8a868', k: '#2a1a14', y: '#fff2b0', Y: '#ffd27a', O: '#ff9a3a', W: '#ffffff', s: '#4a4a5a', S: '#7a7a8c', T: '#a8a8b8', r: '#e0303a', g: '#3fbf5a', b: '#4a8cff', w: '#f2efe6' };
    const mk = k => {
      const B = G([
        '.....43.....',
        '...443322...',
        '.4433222211.',
        '..11111111..',
        '...kOYYOk...',
        '...kYyyYk...',
        '...kYWWYk...',
        '...kYyyYk...',
        '...kOYYOk...',
        '..32222221..',
        '....3221....',
        '.....32.....',
        '.....32.....',
        '.....32.....',
        '.....32.....',
        '.....32.....',
        '.....32.....',
        '.....32.....',
        '.....32.....',
        '....3221....',
        '..TSS3SSs...',
        '.TSSSSSsss..']);
      // bandierine sul filo teso dal tetto
      path(B, [[10, 3], [11, 5]], 'k');
      put(B, 10, 4, k ? ['.r', 'g.'] : ['r.', '.g']);
      if (k) put(B, 4, 5, ['.YyY.', 'YyWyY', '.YyY.']);
      return bake(B, L, { olc: { O: '#7a3a10', Y: '#7a3a10', y: '#7a3a10', W: '#7a3a10' } });
    };
    brk('brk_lantern', mk(0), mk(1));
  }

  // ===========================================================================
  // 4) ICONE DELLE ULTIMATE (18×18)
  // ===========================================================================
  const U18 = (name, B, pal, o = {}) => reg(name, bake(Array.isArray(B[0]) ? B : G(B), pal, Object.assign({ W: 18, H: 18 }, o)));

  // Urlo dell'Abisso: volto di Vuoto (maschera del Cavaliere in negativo) che urla,
  // con lingue d'ombra che salgono orlate di bianco
  U18('ult_knight', [
    '.....w....w.....',
    '..w..Kw..wK..w..',
    '..Kw.KK..KK.wK..',
    '...KwKKwwKKwK...',
    '..KKKKKKKKKKKK..',
    '.KKkkkkkkkkkkKK.',
    '.KkWWkkkkkkWWkK.',
    'KkkWWWkkkkWWWkkK',
    'KkkkWWWkkWWWkkkK',
    'KkkkkWkkkkWkkkkK',
    '.KkkkkWWWWkkkkK.',
    '.KkkkWkkkkWkkkK.',
    '..KkkWkkkkWkkK..',
    '...KkWkkkkWkK...',
    '....KkWWWWkK....',
    '.....KKKKKK.....'], { k: '#0b0910', K: '#2e2840', W: '#f4f0ff', w: '#c8c0e8' }, { ol: '#9a90c0', olc: { w: null } });

  // Railcannon elettrico: cannone di V1 e raggio blu con fulmini
  U18('ult_v1', [
    '.............wcB',
    '............wcB.',
    '.....y.....wcB..',
    '....y.y...wcB...',
    '.......y.wcB....',
    '........wcB.y...',
    '.......wcB.y.y..',
    '......wcB.....y.',
    '.....wcB........',
    '...mnwB.........',
    '..mnNmk.........',
    '.mnNmkk.........',
    'mnbbmk..........',
    'nmbmk...........',
    'kmmk............',
    '.kk.............'], { w: '#ffffff', c: '#9fe4ff', B: '#3a86ff', y: '#bff0ff', m: '#3a3a48', n: '#6a6e80', N: '#a8acbc', k: '#16141e', b: '#4ab0ff' }, { olc: { w: '#1a3a8a', c: '#1a3a8a', B: '#0e1e5a', y: null } });

  // Chiamata dell'Olimpo: corona d'alloro d'oro (due rami di foglie) e fulmine di Zeus
  {
    const B = buf(16, 16);
    for (const sgn of [-1, 1]) {
      for (let i = 0; i <= 14; i++) {           // ramo
        const a = Math.PI / 2 + sgn * (0.35 + i / 14 * 2.25);
        dot(B, Math.round(7.5 + Math.cos(a) * 6.2 - 0.5), Math.round(8 + Math.sin(a) * 6.2 - 0.5), 'b');
      }
      for (let i = 0; i < 5; i++) {             // foglie a coppie
        const a = Math.PI / 2 + sgn * (0.6 + i * 0.47);
        const x = 7.5 + Math.cos(a) * 6.2 - 0.5, y = 8 + Math.sin(a) * 6.2 - 0.5;
        const tx = -Math.sin(a) * sgn, ty = Math.cos(a) * sgn;           // tangente verso l'alto
        const ox = Math.cos(a), oy = Math.sin(a);
        dot(B, Math.round(x + ox * 1.2 + tx), Math.round(y + oy * 1.2 + ty), 'd');
        dot(B, Math.round(x + ox * 1.2), Math.round(y + oy * 1.2), 'c');
        dot(B, Math.round(x - ox * 1.2 + tx), Math.round(y - oy * 1.2 + ty), 'c');
      }
    }
    put(B, 6, 14, ['RqR', '.R.']);
    put(B, 5, 3, [
      '....ee',
      '...ed.',
      '..edd.',
      '.edddd',
      '...dd.',
      '..dd..',
      '..d...',
      '.d....']);
    U18('ult_zagreus', B, Object.assign({}, GOLD, { e: '#ffffff', R: '#8e1424', q: '#e0303a' }), {});
  }

  // Spinta di Badeline: due comete (Madeline rosa, Badeline viola) con scie spezzate
  U18('ult_madeline', [
    '..........ppp...',
    '.........pPPPp..',
    '........pPWPPp..',
    '.......pPPPPp...',
    '......pPPPpp....',
    '.....pPp........',
    '....pP.......vv.',
    '...p.......vvVVv',
    '..pP......vVVWVv',
    '.pP......vVVVVv.',
    '........vVVVvv..',
    '.......vVv......',
    '......vV........',
    '.....v..........',
    '...vV...........',
    '..vV............'], { p: '#c8408a', P: '#ff7ad9', W: '#ffffff', v: '#4a1e7a', V: '#a050d8' }, {});

  // Runa dell'Omuncolo: la testa di fiamma magenta vola via lasciando una scia
  U18('ult_prisoner', [
    '................',
    '.........mmmm...',
    '.......mMMLLMm..',
    '......mMMLLLMMm.',
    '.....mMMMMcMMMm.',
    '....mMMMMcccMMm.',
    '...mMMMMMMcMMMm.',
    '..mMMMMMMMMMMm..',
    '.mMMMMMMMMMMm...',
    'mMM.mMMMMMmm....',
    'mM..mMMMmm......',
    'm..mMM.mm.......',
    '..mMm...........',
    '.mm.............',
    '.m..............',
    '................'], { m: '#a01e6a', M: '#ff5aa8', L: '#ffb8dc', c: '#ffc23a' }, {});

  // Mattutino del Guardiano: gigante spettrale d'oro col cappuccio a punta (capirote),
  // occhi di luce, che impugna una grande spada levata
  U18('ult_penitent', [
    '......yd.....T..',
    '......ydc...TS..',
    '.....yddc...TS..',
    '.....yddcc..TS..',
    '....ydddcc..TS..',
    '....dkkkkc..TS..',
    '....dkWkWc..TS..',
    '....dkkkkc..TS..',
    '..yyddddddccTSc.',
    '.ydddddddddGGGGc',
    '.dddddddddddcHc.',
    '.ddcddddddcccHc.',
    '.dd.dddddd.cc...',
    '.d..dddddd..c...',
    '....dd..dd......',
    '....d....d......'], { y: '#fff4c8', d: '#ffd27a', c: '#c8902a', k: '#5a3606', W: '#ffffff', S: '#f0f6ff', T: '#9ab0d0', G: '#e2b030', H: '#8a5a1a' }, { ol: '#4a2a06' });

  // Ultimo Prisma: prisma di vetro e raggi arcobaleno che convergono
  U18('ult_terrarian', [
    '...............W',
    '.............WwW',
    '...........rowW.',
    '.........roygw..',
    '.......roygbv...',
    '.....roygbv.....',
    '....oygbv.......',
    '...hHHv.........',
    '..hHHHH.........',
    '.hHWHHHg........',
    'hHHHHHHgg.......',
    '.gHHHHggg.......',
    '..gHHggg........',
    '...gggg.........',
    '....gg..........',
    '................'], { r: '#ff3a3a', o: '#ff9a2a', y: '#ffe63a', g: '#7ac0e0', b: '#3a8aff', v: '#a04aff', h: '#e8faff', H: '#b8e8ff', W: '#ffffff', w: '#fff6f0' },
    { olc: { r: '#5a0a10', o: '#5a2a0a', y: '#5a4a0a', b: '#0a1a5a', v: '#2a0a5a', w: null, W: null } });

  // Mega Laser: occhio in lacrime di Isaac che spara un raggio rosso e bianco
  U18('ult_isaac', [
    '................',
    '.pppp...........',
    'psssspp.....RR..',
    'ssssssp..RRRrrRR',
    'sWWWksspRrrrrrrr',
    'sWWkkkspRrWWWWWW',
    'sWWkkkspWWWWWWWW',
    'ssWkkssprWWWWWWW',
    'ssssssspRrrrrrrr',
    'stssssp..RRRrrRR',
    'stsssp......RR..',
    '.tspp...........',
    '.tt.............',
    '..t.............',
    '................',
    '................'], { p: '#c08a8a', s: '#f2d4cc', W: '#ffffff', k: '#1a0a10', t: '#5ab8e8', R: '#8e1424', r: '#ff4a4a' }, {});

  // ===========================================================================
  // 5) ICONE DEI POTENZIAMENTI (Merceria, 16×16)
  // ===========================================================================
  const PU = (id, rows, pal, o = {}) => { const cv = bake(G(rows), pal, Object.assign({ W: 16, H: 16 }, o)); reg('pu_' + id, cv); return cv; };
  const STEEL = { s: '#3a4050', S: '#7a8494', t: '#b8c0cc', T: '#e8eef6', W: '#ffffff' };
  const RED = { r: '#7a1420', R: '#c41e2a', q: '#ff5a5a', Q: '#ffb0a8' };

  PU('might', [
    '...........TW.',
    '..........TtS.',
    '.........TtS..',
    '........TtS...',
    '.......TtS....',
    '......TtS.....',
    '..d..TtS......',
    '..dcTtS.......',
    '...dcS........',
    '...rdc........',
    '..rRcdc.......',
    '.rR...dc......',
    'rR............',
    'R.............'], Object.assign({}, STEEL, GOLD, RED));
  PU('armor', [
    '.dddddddddddc.',
    'dcTTTTTTTTtScb',
    'dTtTtTtTtTtSsb',
    'dTttttttttSSsb',
    'dtTtTtTtTtSssb',
    'dttttttttSSssb',
    '.dtTtTtTtSsSb.',
    '.dtttttttSSsb.',
    '..dtTtTtSssb..',
    '..dtttttSSsb..',
    '...dtTtSssb...',
    '....dttSsb....',
    '.....dcbb.....',
    '......bb......'], Object.assign({}, STEEL, GOLD));
  const heart = [
    '..qqq....qqq..',
    '.qQQRR..qRRRr.',
    'qQQRRRRqRRRRrr',
    'qQRRRRRRRRRRrr',
    'qRRRRRRRRRRRrr',
    'RRRRRRRRRRRRrr',
    '.RRRRRRRRRRrr.',
    '..RRRRRRRRrr..',
    '...RRRRRRrr...',
    '....RRRRrr....',
    '.....RRrr.....',
    '......rr......'];
  { const B = G(['..............', '..............'].concat(heart)); put(B, 1, 0, ['BB.......YY.', 'Bb.......Yy.', '..t.....t...', '...t...t....']); reg('pu_maxhp', bake(B, Object.assign({ B: '#5ab0ff', b: '#2a5ac8', Y: '#ffe06a', y: '#c8901a' }, RED, STEEL), { W: 16, H: 16 })); }
  { const B = G(['..............', '..............'].concat(heart)); put(B, 4, 4, ['..WG..', '..Wg..', 'WWWGGG', 'GGWggg', '..Gg..', '..gg..']); reg('pu_recovery', bake(B, Object.assign({}, RED, { g: '#2a8a3a', G: '#6aff8a', W: '#e8ffe8' }), { W: 16, H: 16 })); }
  PU('cooldown', [
    '.dddddddddd.',
    'dccccccccccb',
    '.c.hSSSSg.b.',
    '.c..hSsg..b.',
    '.c...Sg...b.',
    '.c...Sg...b.',
    '.c..hSGg..b.',
    '.c.hGSGGg.b.',
    '.c.hsSSsg.b.',
    '.c.hSSSSg.b.',
    'dccccccccccb',
    '.bbbbbbbbbb.'], Object.assign({ h: '#d8f4ff', g: '#5a88b0', G: '#24405e', s: '#5ac8ff', S: '#d0f6ff' }, GOLD));
  PU('area', [
    '....dddddd....',
    '..dd......cc..',
    '.d...eeee...c.',
    '.d..e....d..c.',
    'd..e..WW..d..b',
    'd..e.WddW.d..b',
    'd..e.WddW.d..b',
    'd..e..WW..d..b',
    '.c..d....c..b.',
    '.c...dddd...b.',
    '..cc......bb..',
    '....bbbbbb....'], Object.assign({}, GOLD, { W: '#ffffff' }));
  PU('speed', [
    '..............',
    '........TW....',
    '........TtW...',
    '.........TtW..',
    'w.ww.dddddtTW.',
    '.....ccccctTt.',
    'w.ww.bbbbbtt..',
    '.........ts...',
    '........ts....',
    '........s.....'], Object.assign({}, STEEL, GOLD, { w: '#9fe4ff' }), { olc: { w: null } });
  PU('duration', [
    '....dddddd....',
    '..ddeeeeeecc..',
    '.deeeeWeeeecc.',
    '.deeeeseeeeec.',
    'deeeeeseeeeecb',
    'deeeeeseeeeecb',
    'deWeeessseWecb',
    'deeeeeeeeeeecb',
    'deeeeeeeeeeecb',
    '.ceeeeeeeeecb.',
    '.cceeeWeeeccb.',
    '..ccceeeccbb..',
    '....bbbbbb....'], Object.assign({}, GOLD, { e: '#fff6e0', s: '#2a1a3a', W: '#c8902a' }));
  {
    const B = buf(14, 14);
    const needle = (x, y) => { // punta in alto a destra, cruna in basso a sinistra
      for (let i = 0; i < 7; i++) { dot(B, x + i, y - i, 'T'); dot(B, x + i + 1, y - i, 't'); }
      dot(B, x + 7, y - 7, 'W'); dot(B, x - 1, y + 1, 't'); dot(B, x, y + 1, 's'); dot(B, x - 1, y + 2, 's'); dot(B, x, y + 2, null);
    };
    needle(2, 8); needle(6, 10);
    path(B, [[0, 11], [1, 12], [0, 13]], 'R'); path(B, [[4, 13], [3, 13]], 'R');
    reg('pu_amount', bake(B, Object.assign({}, STEEL, RED), { W: 16, H: 16, olc: {} }));
  }
  PU('move', [
    '...3333.......',
    '...3222.......',
    '...3221.......',
    '...3dcb.......',
    '...3221.......',
    '..32221.......',
    '..322221......',
    '.3222222111...',
    '.32xx2222221..',
    '.32xx22222211.',
    '.322222222221.',
    '.dddddddddddb.',
    '.bbbbbbbbbbbb.'], Object.assign({ 1: '#5a2e14', 2: '#8a4a22', 3: '#c07a3e', x: '#d8b878' }, GOLD));
  PU('magnet', [
    '...443322...',
    '..44332221..',
    '.4433222211.',
    '443......211',
    '432......210',
    'dcb......cbb',
    'cbb......bba',
    '432......210',
    'Sst......sst',
    'Sst......sst',
    'sst......stt'], Object.assign({ 0: '#3a0a10', 1: '#7a1420', 2: '#c41e2a', 3: '#ff4a4a', 4: '#ff9a90', S: '#ffffff', s: '#b4c0d0', t: '#5a6476' }, GOLD));
  PU('luck', [
    '..ggg..ggg....',
    '.gGGGggGGGg...',
    '.gGWGGgGGGg...',
    '.gGGGGgGGgg...',
    '..ggGGGGgg....',
    '.ggggGGgggg...',
    'gGGGGgGGGGGg..',
    'gGWGGgGGGGGg..',
    'gGGGgg.gGGgg..',
    '.ggg.k..ggg...',
    '......k.......',
    '.......k......',
    '........k.....'], { g: '#1f7a32', G: '#5ad06a', W: '#c8ffc8', k: '#2a5a2a' });
  PU('growth', [
    '..............',
    '.e....e....e..',
    '.dc..ddc..dc..',
    '.ddc.dRc.ddc..',
    '.dddcddcdddc..',
    '.ddddddddddc..',
    '.dRddBddRddc..',
    '.ddddddddddc..',
    '.ccccccccccb..',
    '..bbbbbbbbb...'], Object.assign({}, GOLD, RED, { B: '#3a8aff' }));
  PU('greed', [
    '....bccb....',
    '.....dc.....',
    '....3221....',
    '...dccccb...',
    '..32222221..',
    '.3222dd2221.',
    '322dc22c2221',
    '3222dd222221',
    '32222cd22221',
    '3222dd222221',
    '.32222222211',
    '..11111111..'], Object.assign({ 1: '#5a3418', 2: '#8a5a2a', 3: '#b8844a' }, GOLD));
  PU('curse', [
    '...pppppp...',
    '..pPPPPPPp..',
    '.pPPPPPPPPp.',
    '.pPPPPPPPPp.',
    '.PkkPPPkkPp.',
    '.PkRkPkRkPp.',
    '.PkkPPPkkPp.',
    '..PPPkPPPp..',
    '...PPPPPp...',
    '...PkPkPp...',
    '...pPpPpp...'], { p: '#6a3a8a', P: '#d8c8f0', k: '#1a0a24', R: '#ff3a8a' });
  PU('revival', [
    '.........ee.',
    '........edd.',
    '...w...edc..',
    '..wWw.edc...',
    '.wWWWedc....',
    'wWWWedcw....',
    'wWWedcWw....',
    '.wedcWWw....',
    '.edcwWw.....',
    'edc..w......',
    'dc..........',
    'c...........'], Object.assign({}, GOLD, { w: '#a8b8d8', W: '#ffffff' }));
  PU('reroll', [
    '.....TT.....',
    '...TTTTTT...',
    '.TTTTkkTTTT.',
    'TTTTTkkTTTTT',
    'ttTTTTTTTTss',
    'ttttTTTTssss',
    'ttttttssssss',
    'tkttttskssss',
    'ttttttssssss',
    'ttttkts sskss'.replace(' ', ''),
    '.tttttsssss.',
    '...tttsss...',
    '.....ts.....'], { T: '#ffffff', t: '#c8ccd8', s: '#8a90a4', k: '#c41e2a' });
  PU('skip', [
    '..............',
    'd....d....dd..',
    'dd...dd...dc..',
    'ddd..ddd..dc..',
    'dddd.dddd.dc..',
    'ddddcddddcdc..',
    'ddddcddddcdc..',
    'dddd.dddd.dc..',
    'ddc..ddc..dc..',
    'dc...dc...dc..',
    'c....c....cb..'], Object.assign({}, GOLD));
  // alias usati dalla Merceria (shop.js usa l'id 'hp')
  SPR.pu_hp = SPR.pu_maxhp;
})();

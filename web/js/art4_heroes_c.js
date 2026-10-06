'use strict';
// =============================================================================
// ART4 · EROI (heroes-web) — Zagreus (Hades) e il Terrariano (Terraria).
// Pixel-art originale a griglie di caratteri, composta a strati:
// mantello → braccio dietro → gambe/piedi → gonna/busto → testa → braccio davanti.
// Arti generati con un "pennello a colonne" pixel-perfetto (niente AA).
// Frame: _i0 _i1 _bl _w0.._w3 _hu · SPR[nome] = SPR[nome+'_i0'] · HERO_META.
// =============================================================================
(() => {
  const META = (window.HERO_META = window.HERO_META || {});
  const OUT = '#1a1220';

  // ---- micro-motore a griglie ------------------------------------------------
  const buf = (w, h) => Array.from({ length: h }, () => new Array(w).fill(null));
  // stampa righe di caratteri; '.'/' ' trasparente, '_' cancella
  function put(B, x0, y0, rows, map) {
    for (let j = 0; j < rows.length; j++) {
      const y = y0 + j, row = rows[j];
      if (y < 0 || y >= B.length) continue;
      for (let i = 0; i < row.length; i++) {
        let ch = row[i];
        if (ch === '.' || ch === ' ') continue;
        if (map && map[ch] !== undefined) ch = map[ch];
        const x = x0 + i;
        if (x < 0 || x >= B[0].length) continue;
        B[y][x] = ch === '_' ? null : ch;
      }
    }
  }
  const dot = (B, x, y, ch) => { if (y >= 0 && y < B.length && x >= 0 && x < B[0].length) B[y][x] = ch; };
  // arto: segmento da (x0,y0) a (x1,y1); per ogni riga una fascia di colonne `cols`
  // (da sinistra a destra: luce → ombra). Pixel interi, nessun anti-aliasing.
  function limb(B, x0, y0, x1, y1, cols) {
    const n = Math.max(1, Math.abs(y1 - y0), Math.abs(x1 - x0));
    for (let k = 0; k <= n; k++) {
      const t = k / n, y = Math.round(y0 + (y1 - y0) * t), x = Math.round(x0 + (x1 - x0) * t);
      for (let i = 0; i < cols.length; i++) if (cols[i] !== '.') dot(B, x + i, y, cols[i]);
    }
  }
  // come limb ma la fascia è verticale (avambracci orizzontali): cols dall'alto in basso
  function limbH(B, x0, y0, x1, y1, cols) {
    const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k++) {
      const t = k / n, y = Math.round(y0 + (y1 - y0) * t), x = Math.round(x0 + (x1 - x0) * t);
      for (let i = 0; i < cols.length; i++) if (cols[i] !== '.') dot(B, x, y + i, cols[i]);
    }
  }
  const HEXC = {};
  const rgb = h => HEXC[h] || (HEXC[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  // pal[ch] = colore · outl[ch] = colore del contorno (null = nessuno, assente = OUT)
  function bake(B, pal, outl) {
    const h = B.length, w = B[0].length;
    const c = makeCanvas(w, h), g = c.getContext('2d');
    const id = g.createImageData(w, h), D = id.data;
    const set = (x, y, hx) => { const v = rgb(hx), i = (y * w + x) * 4; D[i] = v[0]; D[i + 1] = v[1]; D[i + 2] = v[2]; D[i + 3] = 255; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = B[y][x]; if (ch && pal[ch]) set(x, y, pal[ch]); }
    const N = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (B[y][x] && pal[B[y][x]]) continue;
      let col = null;
      for (const [dx, dy] of N) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const ch = B[yy][xx];
        if (!ch || !pal[ch]) continue;
        const o = outl[ch];
        if (o === null) continue;
        col = o || OUT;
        if (dy === 1) break; // il pixel sotto decide (contorno superiore più coerente)
      }
      if (col) set(x, y, col);
    }
    g.putImageData(id, 0, 0);
    return c;
  }
  const FR = ['_i0', '_i1', '_bl', '_w0', '_w1', '_w2', '_w3', '_hu'];
  function regHero(name, make, pal, outl, meta) {
    for (const suf of FR) regSprite(name + suf, bake(make(suf), pal, outl));
    SPR[name] = SPR[name + '_i0'];
    META[name] = meta;
  }

  // ===========================================================================
  // ZAGREUS (Hades) — 32×44
  // Capelli neri ricci con corona d'alloro, occhio destro rosso (sclera nera,
  // dal padre) e sinistro verde (dalla madre), petto nudo con bandoliera,
  // spallaccio d'oro col teschio, mantello nero foderato di rosso, chitone
  // rosso dall'orlo bianco "a fiamma", piedi avvolti dal fuoco dello Stige.
  // ===========================================================================
  const ZW = 32, ZH = 44;
  const ZPAL = {
    // pelle
    A: '#ffd8b8', a: '#f2b18c', s: '#d68a68', d: '#a55a4a', D: '#6e3138', q: '#8a2a34',
    // capelli
    h: '#4b3d63', n: '#2a2036', N: '#150e1d',
    // alloro
    L: '#b7e36a', l: '#5faa3a', v: '#2c6430',
    // occhi: 1 rosso, 0 sclera nera, 2 verde, 3 bianco
    1: '#ff3434', 0: '#1a0c12', 2: '#46e27a', 3: '#f6f0e8',
    // oro
    Y: '#fff3a6', y: '#f3c24e', o: '#c4862a', O: '#7a4a16',
    // mantello nero / fodera rossa / chitone
    c: '#3c2438', C: '#231420', g: '#5a3652', R: '#ec4a4e', r: '#b8222e', m: '#7a1428', M: '#4a0e1e',
    // orlo bianco a fiamma
    W: '#fff6ea', w: '#ffc2a0',
    // cuoio (bandoliera, cintura, bracciali)
    B: '#2e2030', b: '#5a4258',
    // fuoco dello Stige
    F: '#fff2b0', f: '#ffb43c', E: '#ff5a26', e: '#d81e2c', Z: '#82101e',
  };
  const ZOUT = {
    A: '#3c1820', a: '#3c1820', s: '#3c1820', d: '#3c1820', D: '#3c1820', q: '#3c1820',
    h: '#0c0710', n: '#0c0710', N: '#0c0710',
    L: '#163a1c', l: '#163a1c', v: '#163a1c',
    Y: '#3a2008', y: '#3a2008', o: '#3a2008', O: '#3a2008',
    W: '#5a1424', w: '#5a1424',
    F: null, f: null, E: null, e: null, Z: null,
  };

  // testa (14×13), origine (9,2)
  const Z_HEAD = [
    '....NN.NNN....',
    '...NnhNnhhNN..',
    '..NhhnnhhLnLN.',
    '.NnhnnnLlvLlvL',
    'NvLlvLlvhhnnN.',
    'NlnhhnnhnnaAa.',
    'NhnnnhnsNNaNN.',
    '.NnhnsdA01a32a',
    'NnhnhddsaaaaAs',
    'NhnnhNdsaaaas.',
    '.NhnNNDsaqqs..',
    '..NN...Dsaas..',
    '........DDs...',
  ];
  const Z_BLINK = ['ddadd']; // (17,9)

  // busto nudo (13×12), origine (9,14)
  const Z_TORSO = [
    '......dss....',
    '....dsaAas...',
    '..dsaAAAaasd.',
    '.dsaAAAaaAAsd',
    '.dsaAAasaAAsd',
    '.dsaaasdsaasd',
    '..dsaasassad.',
    '..dsasaasasd.',
    '..dsaasaasd..',
    '..dsasdsasd..',
    '..BBBoYoBBB..',
    '..BbbOoObbB..',
  ];
  // chitone (13×7), origine (9,26)
  const Z_SKIRT = [
    '..mrRrrrrrm..',
    '..mrRrrmrrrm.',
    '.mrRrrrmrrrrm',
    '.mrWrrrmWrrrm',
    '.mWWwrrWWwrWm',
    '.WWWWwWWWWwWW',
  ];
  // mantello (dietro), origine (5,14)
  const Z_CAPE = [
    '....CCCCCC.....',
    '...CccccccC....',
    '..Ccgcccccc....',
    '..Ccgccccc.....',
    '.Cccgcccc......',
    '.Cccgccc.......',
    '.Ccgcccc.......',
    '.Ccgccc........',
    'Cccgccc........',
    'Cccgccc........',
    'Ccgccmc........',
    'Ccgccmc........',
    'Ccgcmrc........',
    'CcgmrRc........',
    'CcmrRRc........',
    'CmrRRrc........',
    'MrRRrm.........',
    '.MrrmM.........',
    '..MM...........',
  ];
  // lembo del mantello sulla spalla dietro, origine (8,14)
  const Z_DRAPE = [
    '..CCCC',
    '.CcccgR',
    'CccgcR.',
    'CccgR..',
    'CccR...',
    'CcR....',
  ];
  // spallaccio d'oro col teschio, origine (18,14)
  const Z_PAULD = [
    '.OooO.',
    'OyYyoO',
    'OY0y0O',
    'OoyOyO',
    '.OoOo.',
  ];
  // fiamme ai piedi (6×6), 4 varianti
  const Z_FIRE = [
    ['..Z....', '.ZeZ...', '.eEe.Z.', 'ZeEfZeZ', 'eEfFeEe', 'eEFFfEe', 'eFFFFfe', '.eeeee.'],
    ['....Z..', '...ZeZ.', 'Z..eEe.', 'eZ.ZfeZ', 'eEeEfEe', 'eEfFFEe', 'eFFFFfe', '.eeeee.'],
    ['.......', '..Z...Z', '.ZeZ.Ze', '.eEeZeE', 'ZeffEfe', 'eEFFfEe', 'efFFFFe', '.eeeee.'],
    ['...Z...', '..ZeZ..', '..eEeZ.', 'ZeEfeEZ', 'eEfFfEe', 'eFFFfEe', 'eFFFFfe', '.eeeee.'],
  ];

  // pose delle gambe: [anca vicina x, piede vicino x, piede vicino y, anca lontana x, piede lontano x, piede lontano y, dy busto]
  const Z_LEGS = {
    st: [16, 17, 39, 12, 11, 39, 0],
    w0: [16, 19, 39, 12, 9, 39, 0],
    w1: [16, 16, 37, 12, 13, 39, -1],
    w2: [16, 13, 39, 12, 15, 39, 0],
    w3: [16, 17, 39, 12, 11, 37, -1],
  };
  function zagFrame(suf) {
    const B = buf(ZW, ZH);
    const walk = suf[1] === 'w', ph = walk ? +suf[2] : -1;
    const L = Z_LEGS[walk ? 'w' + ph : 'st'];
    let dy = L[6];
    if (suf === '_i1') dy = 1;
    const hurt = suf === '_hu';
    const hx = hurt ? -1 : 0, hy = hurt ? 1 : 0;
    const fire = walk ? ph : (suf === '_i1' ? 1 : suf === '_hu' ? 2 : 0);
    const by = dy + hy;
    // mantello (svolazza indietro camminando)
    put(B, 5 + hx - (walk && ph % 2 ? 1 : 0), 14 + by, Z_CAPE);
    // braccio dietro
    limb(B, 8 + hx, 16 + by, 8 + hx, 23 + by, ['s', 'd']);
    put(B, 8 + hx, 24 + by, ['sd']);
    // gambe: lontana più scura, vicina più chiara
    limb(B, L[3], 31, L[4], L[5], ['s', 'd', 'D']);
    limb(B, L[0], 31, L[1], L[2], ['A', 'a', 's', 'd']);
    // fuoco ai piedi
    const fA = Z_FIRE[fire % 4], fB = Z_FIRE[(fire + 2) % 4];
    put(B, L[4] - 2, L[5] - 3, fB);
    put(B, L[1] - 2, L[2] - 3, fA);
    // chitone + busto + bandoliera
    put(B, 9 + hx, 26 + by, Z_SKIRT);
    put(B, 9 + hx, 14 + by, Z_TORSO);
    limb(B, 19 + hx, 18 + by, 13 + hx, 24 + by, ['B', 'b']);
    put(B, 8 + hx, 14 + by, Z_DRAPE);
    // testa
    put(B, 9 + hx * 2, 2 + by, Z_HEAD);
    if (suf === '_bl' || hurt) put(B, 17 + hx * 2, 9 + by, Z_BLINK);
    // braccio davanti: spalla → gomito → pugno
    limb(B, 20 + hx, 17 + by, 21 + hx, 21 + by, ['a', 's', 'd']);
    limb(B, 21 + hx, 21 + by, 21 + hx, 22 + by, ['a', 's', 'd']);
    put(B, 21 + hx, 23 + by, ['oyo']);
    put(B, 21 + hx, 24 + by, ['Aas', 'asd']);
    put(B, 18 + hx, 14 + by, Z_PAULD);
    return B;
  }
  regHero('zagreus', zagFrame, ZPAL, ZOUT, { hand: [22, 25], head: [16, 2] });

  // ===========================================================================
  // IL TERRARIANO (Terraria) — 28×40
  // Il personaggio iniziale "classico": testa grande, capelli castani con ciuffo,
  // occhio bianco con iride, tunica verde oliva senza maniche sopra la camicia
  // color crema a maniche lunghe, cintura con fibbia di rame, pantaloni marroni
  // e scarponi grossi. Proporzioni tozze alla Terraria.
  // ===========================================================================
  const TW = 28, TH = 38;
  const TPAL = {
    S: '#f8cfa2', s: '#e3a677', d: '#b4704c', D: '#7a4434',
    H: '#c48a4e', h: '#9a5f30', n: '#73411f', N: '#4a2612',
    w: '#ffffff', i: '#2f56b0',
    G: '#a6cc66', g: '#6f9c3c', k: '#456e2c', K: '#2b4824',
    U: '#f6edd4', u: '#d2bf98', v: '#9c8a6a',
    P: '#a8764a', p: '#7c5030', q: '#56341e',
    B: '#7a5436', b: '#4e3420', x: '#2e1f14',
    L: '#5c3a20', C: '#ffbf7a', c: '#c8723a',
  };
  const TOUT = {
    S: '#3e1e18', s: '#3e1e18', d: '#3e1e18', D: '#3e1e18',
    H: '#2a140a', h: '#2a140a', n: '#2a140a', N: '#2a140a',
    G: '#1c2c16', g: '#1c2c16', k: '#1c2c16', K: '#1c2c16',
    U: '#3a3020', u: '#3a3020', v: '#3a3020',
  };
  // testa (14×14), origine (7,2)
  const T_HEAD = [
    '...NN.NNN......',
    '..NhhNnhhNN....',
    '.NhHHhhhhhnNN..',
    '.NhHhhhhhhhhnN.',
    'NnhhhhnhhhhhhnN',
    'NnhhhnhhhnhhhnN',
    'NnnhnnhhnnhhnN.',
    'NnnnnnnnSnSnN..',
    'NnnnnndsSSwiSn.',
    'NnnnnndsSSwiSs.',
    '.NnnnNdsSSSSss.',
    '..NNNNdsSSSSs..',
    '......ddsssss..',
    '.......dddd....',
  ];
  // busto (12×10), origine (8,16)
  const T_TORSO = [
    '.gGGUuUGGk..',
    'gGGGGUGGGgk.',
    'gGGGGGGGggk.',
    'gGGGGGGgggk.',
    'gGGGGGGgggk.',
    'kgGGGGGggkk.',
    'LLLLLcCcLLL.',
    'gGGGGGGGggk.',
    'gGGGgGGGggkk',
    'kggkggkggkkk',
  ];
  const T_SHOE = ['BBBb..', 'BBBBBb', 'bbbbbx'];
  const T_SHOE_FAR = ['bbbx..', 'bbbbbx', 'xxxxxx'];
  // [anca vicina x, piede vicino x, piede vicino y, anca lontana x, piede lontano x, piede lontano y, dy busto]
  const T_LEGS = {
    st: [14, 15, 34, 10, 10, 34, 0],
    w0: [14, 17, 34, 10, 8, 34, 0],
    w1: [14, 14, 33, 10, 11, 34, -1],
    w2: [14, 12, 34, 10, 13, 34, 0],
    w3: [14, 15, 34, 10, 10, 33, -1],
  };
  function terrFrame(suf) {
    const B = buf(TW, TH);
    const walk = suf[1] === 'w', ph = walk ? +suf[2] : -1;
    const Lg = T_LEGS[walk ? 'w' + ph : 'st'];
    let dy = Lg[6];
    if (suf === '_i1') dy = 1;
    const hurt = suf === '_hu';
    const hx = hurt ? -1 : 0, by = dy + (hurt ? 1 : 0);
    const sw = walk ? (ph === 0 ? 1 : ph === 2 ? -1 : 0) : 0; // oscillazione braccia
    // braccio dietro
    limb(B, 8 + hx, 17 + by, 7 + hx - sw, 23 + by, ['u', 'v']);
    put(B, 7 + hx - sw, 24 + by, ['sd']);
    // gambe e scarponi
    limb(B, Lg[3], 25, Lg[4], Lg[5] - 1, ['p', 'q', 'q']);
    put(B, Lg[4] - 1, Lg[5], T_SHOE_FAR);
    limb(B, Lg[0], 25, Lg[1], Lg[2] - 1, ['P', 'p', 'q']);
    put(B, Lg[1] - 1, Lg[2], T_SHOE);
    // busto e testa
    put(B, 8 + hx, 16 + by, T_TORSO);
    put(B, 7 + hx * 2, 2 + by, T_HEAD);
    if (suf === '_bl' || hurt) put(B, 17 + hx * 2, 10 + by, hurt ? ['DS', 'SD'] : ['SS', 'DD']);
    // braccio davanti: manica crema, avambraccio in avanti, pugno pronto
    limb(B, 17 + hx, 17 + by, 17 + hx + sw, 20 + by, ['U', 'u', 'v']);
    limbH(B, 18 + hx + sw, 21 + by, 19 + hx + sw, 21 + by, ['U', 'u']);
    put(B, 20 + hx + sw, 21 + by, ['Ss', 'sd']);
    return B;
  }
  regHero('terrarian', terrFrame, TPAL, TOUT, { hand: [21, 22], head: [13, 2] });
})();

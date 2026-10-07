'use strict';
// =============================================================================
// ART4 · EROI (heroes-web) — Zagreus (Hades) e il Terrariano (Terraria).
// Pixel-art originale a griglie di caratteri, composta a strati:
// mantello → braccio dietro → gambe/piedi → gonna/busto → testa → braccio davanti.
// Arti generati con un "pennello a colonne" pixel-perfetto (niente AA).
// Frame: _i0 _i1 _bl _w0.._w3 _hu · SPR[nome] = SPR[nome+'_i0'] · HERO_META.
// Revisione (art director): ciclo di camminata corretto (contatto/passo
// speculari, piede sollevato giusto), pugno davanti fermo sul punto `hand`
// in tutti i fotogrammi (l'arma resta in mano), mantello con fodera rossa
// visibile, palette più fedeli (capelli neri, tunica oliva), testa del
// Terrariano con la frangia di Terraria.
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
  // sposta le righe dal basso verso sinistra (mantello che svolazza)
  const sweep = (rows, from, every) => rows.map((r, j) => {
    const k = j < from ? 0 : 1 + Math.floor((j - from) / every);
    return k ? r.slice(k) + '.'.repeat(k) : r;
  });
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
  // padTop: righe trasparenti aggiunte in alto (margine per i passi, quando il corpo sale)
  function regHero(name, make, pal, outl, meta, padTop = 0) {
    for (const suf of FR) {
      const B = make(suf);
      for (let k = 0; k < padTop; k++) B.unshift(new Array(B[0].length).fill(null));
      regSprite(name + suf, bake(B, pal, outl));
    }
    SPR[name] = SPR[name + '_i0'];
    META[name] = { hand: [meta.hand[0], meta.hand[1] + padTop], head: [meta.head[0], meta.head[1] + padTop] };
  }

  // ===========================================================================
  // ZAGREUS (Hades) — 32×45 (griglia 32×44 + 1 riga di margine in alto)
  // Capelli neri ricci con corona d'alloro, occhio destro rosso (sclera nera,
  // dal padre) e sinistro verde (dalla madre), petto nudo con bandoliera,
  // spallaccio d'oro col teschio sulla spalla sinistra, mantello nero foderato
  // di rosso, chitone rosso dall'orlo bianco "a fiamma", piedi nel fuoco dello Stige.
  // ===========================================================================
  const ZW = 32, ZH = 44;
  const ZPAL = {
    // pelle
    A: '#f8cca4', a: '#e6a67c', s: '#c8805c', d: '#975440', D: '#62303a',
    // capelli (neri, riflessi violacei)
    h: '#3f3350', n: '#251c30', N: '#120c18',
    // alloro
    L: '#b4e070', l: '#5ea83c', v: '#2a5e2e',
    // occhi: 1 rosso, 0 sclera nera, 2 verde, 3 bianco
    1: '#ff3b3b', 0: '#1a0c12', 2: '#4ae27e', 3: '#f6f0e8',
    // oro
    Y: '#fff1a0', y: '#f0c04c', o: '#c08428', O: '#764814',
    // mantello nero / fodera rossa / chitone
    c: '#36161f', C: '#1f0c13', g: '#58222f', R: '#ee4a4c', r: '#bc2430', m: '#7e1628', M: '#4c0e1e',
    // orlo bianco a fiamma
    W: '#fbefdc', w: '#f2b49a',
    // cuoio (bandoliera, cintura)
    B: '#2c1e2c', b: '#56404f',
    // fuoco dello Stige
    F: '#fff2b0', f: '#ffb43c', E: '#ff5a26', e: '#d81e2c', Z: '#82101e',
  };
  const ZOUT = {
    A: '#3c1820', a: '#3c1820', s: '#3c1820', d: '#3c1820', D: '#3c1820',
    h: '#0a0610', n: '#0a0610', N: '#0a0610',
    L: '#163a1c', l: '#163a1c', v: '#163a1c',
    Y: '#3a2008', y: '#3a2008', o: '#3a2008', O: '#3a2008',
    W: '#5a1424', w: '#5a1424', R: '#3a0a16', r: '#3a0a16', m: '#3a0a16', M: '#3a0a16',
    F: null, f: null, E: null, e: null, Z: null,
  };

  // testa (14×13), origine (9,2): corona d'alloro che scende verso la fronte
  const Z_HEAD = [
    '....NN.NNN....',
    '...NnhNnhhNN..',
    '..NLnnhhnhhnN.',
    '.NnLlvhnnLnhnN',
    'NnhnvlLlvLlnLN',
    'NhnhhnnvlLlvlL',
    'NhnnnhnsNNaNN.',
    '.NnhnsdA01a32a',
    'NnhnhddsaaaaAs',
    'NhnnhNdsaaaas.',
    '.NhnNNDsasds..',
    '..NN...Dsaas..',
    '........DDs...',
  ];
  const Z_BLINK = ['ddadd']; // (17,9)
  const Z_OUCH = ['Dd.dD']; // occhi strizzati (colpito)

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
  // chitone (13×6), origine (9,26)
  const Z_SKIRT = [
    '..mrRrrrrrm..',
    '..mrRrrmrrrm.',
    '.mrRrrrmrrrrm',
    '.mrWrrrmWrrrm',
    '.mWWwrrWWwrWm',
    '.WWWWwWWWWwWW',
  ];
  // mantello (dietro, appeso alla spalla destra), origine (4,14):
  // esterno nero a sinistra, fodera rossa visibile verso il corpo
  const Z_CAPE = [
    '.....CCCCC...',
    '...CCcccccC..',
    '..CccgccRr...',
    '..CccgcRrm...',
    '.CccgcRrm....',
    '.CccgcRrm....',
    '.CcgccRrm....',
    '.CcgcRrm.....',
    'CccgcRrm.....',
    'CccgcRrm.....',
    'CcgcRRrm.....',
    'CcgcRrm......',
    'CcgcRrm......',
    'CcgRRrm......',
    'CcRRrmM......',
    'CMRrrmM......',
    '.MrrmM.......',
    '..MM.........',
  ];
  const Z_CAPE_FLAP = sweep(Z_CAPE, 9, 4);
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
  // fiamme ai piedi (7×8), 4 varianti
  const Z_FIRE = [
    ['..Z....', '.ZeZ...', '.eEe.Z.', 'ZeEfZeZ', 'eEfFeEe', 'eEFFfEe', 'eFFFFfe', '.eeeee.'],
    ['....Z..', '...ZeZ.', 'Z..eEe.', 'eZ.ZfeZ', 'eEeEfEe', 'eEfFFEe', 'eFFFFfe', '.eeeee.'],
    ['.......', '..Z...Z', '.ZeZ.Ze', '.eEeZeE', 'ZeffEfe', 'eEFFfEe', 'efFFFFe', '.eeeee.'],
    ['...Z...', '..ZeZ..', '..eEeZ.', 'ZeEfeEZ', 'eEfFfEe', 'eFFFfEe', 'eFFFFfe', '.eeeee.'],
  ];

  // pose delle gambe: [anca vicina x, piede vicino x, piede vicino y, anca lontana x, piede lontano x, piede lontano y, dy busto]
  // contatto (w0: avanti la vicina) → passo (w1: si alza la lontana) →
  // contatto (w2: avanti la lontana) → passo (w3: si alza la vicina)
  const Z_LEGS = {
    st: [15, 17, 39, 13, 11, 39, 0],
    w0: [15, 18, 39, 13, 10, 39, 0],
    w1: [15, 15, 39, 13, 14, 37, -1],
    w2: [15, 11, 39, 13, 17, 39, 0],
    w3: [15, 16, 37, 13, 13, 39, -1],
  };
  const Z_HAND = [23, 24]; // pugno davanti: fisso in tutti i fotogrammi
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
    // braccio dietro: oscilla opposto alla gamba lontana
    const sw = walk ? [1, 0, -1, 0][ph] : (hurt ? -1 : 0);
    // mantello (svolazza indietro nei passi e quando è colpito)
    put(B, 4 + hx, 14 + by, (walk && ph % 2) || hurt ? Z_CAPE_FLAP : Z_CAPE);
    // braccio dietro
    limb(B, 8 + hx, 16 + by, 8 + hx + sw, 23 + by, ['s', 'd']);
    put(B, 8 + hx + sw, 24 + by, ['sd']);
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
    if (suf === '_bl') put(B, 17 + hx * 2, 9 + by, Z_BLINK);
    if (hurt) put(B, 17 + hx * 2, 9 + by, Z_OUCH);
    // braccio davanti: spalla → gomito → pugno fermo su Z_HAND
    const [px, py] = Z_HAND;
    limb(B, 20 + hx, 18 + by, 21 + hx, 21 + by, ['a', 's', 'd']);
    limb(B, 21 + hx, 21 + by, px - 1, py - 2, ['A', 'a', 's']);
    put(B, px - 1, py - 1, ['oyo']);
    put(B, px - 1, py, ['Aas', 'asd']);
    put(B, 18 + hx, 14 + by, Z_PAULD);
    return B;
  }
  regHero('zagreus', zagFrame, ZPAL, ZOUT, { hand: Z_HAND, head: [16, 2] }, 1);

  // ===========================================================================
  // IL TERRARIANO (Terraria) — 28×41 (griglia 28×40 + 1 riga di margine in alto)
  // Il personaggio iniziale "classico" (alla Guida): testa grande, capelli
  // castani con la frangia che scende sulla fronte, occhio bianco con iride,
  // tunica verde oliva a maniche corte sopra la camicia color crema a maniche
  // lunghe, cintura con fibbia di rame, pantaloni marroni e scarponi grossi.
  // Profilo laterale e proporzioni tozze alla Terraria.
  // ===========================================================================
  const TW = 28, TH = 40;
  const TPAL = {
    S: '#f6c79c', s: '#e0a072', d: '#b06c48', D: '#7a4434',
    H: '#c98a52', h: '#9c5a2e', n: '#713c1e', N: '#4a2412',
    w: '#ffffff', i: '#34406a',
    G: '#a3bf55', g: '#7d9a3a', k: '#58722c', K: '#3a4e22',
    U: '#f2e6c6', u: '#cdb88e', v: '#968260',
    P: '#9a6a40', p: '#76492a', q: '#52301c',
    B: '#6a4428', b: '#4a2e1a', x: '#2a1a10',
    L: '#4e301a', C: '#ffbf7a', c: '#c8723a',
  };
  const TOUT = {
    S: '#3e1e18', s: '#3e1e18', d: '#3e1e18', D: '#3e1e18',
    H: '#2a140a', h: '#2a140a', n: '#2a140a', N: '#2a140a',
    G: '#1c2c16', g: '#1c2c16', k: '#1c2c16', K: '#1c2c16',
    U: '#3a3020', u: '#3a3020', v: '#3a3020',
  };
  // testa (16×14), origine (7,2): frangia a ciocche sulla fronte
  const T_HEAD = [
    '....NN.NNN.....',
    '...NhhNhHHN....',
    '..NhHHHHhhhN...',
    '.NhHHhhhhhhhNN.',
    'NhhHhhhhhhhhhhN',
    'NhhhhhhhhhhhhhhN',
    'NnhhhhhhnhhhShhN',
    'NnnhhnnhSShSShN.',
    'NnnnnnhdSSSwiS..',
    'NnnnnnhdSSSwiSs.',
    '.NnnnnNdsSSSSs..',
    '..NnnNNdsSSSs...',
    '...NN..ddsss....',
    '.......ddd......',
  ];
  // busto (11×10), origine (8,16)
  const T_TORSO = [
    '..gGUuUGg..',
    '.gGGGUGGgk.',
    'gGGgggggggk',
    'gGgggggggkk',
    'gggggggggkk',
    'LLLLLcCcLLL',
    'gGgggggggkk',
    'gggggggggkk',
    'ggggggggkkk',
    'kkkkkkkkkkK',
  ];
  const T_SHOE = ['BBBBb..', 'BBBBBBb', 'bbbbbbx'];
  const T_SHOE_FAR = ['bbbx..', 'bbbbbx', 'xxxxxx'];
  // [anca vicina x, piede vicino x, piede vicino y, anca lontana x, piede lontano x, piede lontano y, dy busto]
  const T_LEGS = {
    st: [13, 14, 36, 11, 10, 36, 0],
    w0: [13, 16, 36, 11, 9, 36, 0],
    w1: [13, 13, 36, 11, 12, 34, -1],
    w2: [13, 9, 36, 11, 16, 36, 0],
    w3: [13, 14, 34, 11, 11, 36, -1],
  };
  const T_HAND = [20, 23]; // pugno davanti: fisso in tutti i fotogrammi
  // braccio davanti: parte alta (segue il busto) e avambraccio+pugno (fermi)
  const T_ARM_UP = ['KgGk', 'KggK', 'KkkK', '.vUu'];
  const T_ARM_LO = ['..vUu.', '...vUS', '....sd'];
  function terrFrame(suf) {
    const B = buf(TW, TH);
    const walk = suf[1] === 'w', ph = walk ? +suf[2] : -1;
    const Lg = T_LEGS[walk ? 'w' + ph : 'st'];
    let dy = Lg[6];
    if (suf === '_i1') dy = 1;
    const hurt = suf === '_hu';
    const hx = hurt ? -1 : 0, by = dy + (hurt ? 1 : 0);
    // braccio dietro: avanti quando la gamba lontana è indietro (w0) e viceversa
    const sw = walk ? [1, 0, -1, 0][ph] : 0;
    limb(B, 9 + hx, 17 + by, 8 + hx + sw, 19 + by, ['k', 'K']);
    limb(B, 8 + hx + sw, 20 + by, 8 + hx + sw * 2, 22 + by, ['u', 'v']);
    put(B, 8 + hx + sw * 2, 23 + by, ['sd']);
    // gambe e scarponi
    limb(B, Lg[3], 26, Lg[4], Lg[5] - 1, ['p', 'q', 'q']);
    put(B, Lg[4] - 1, Lg[5], T_SHOE_FAR);
    limb(B, Lg[0], 26, Lg[1], Lg[2] - 1, ['P', 'P', 'p', 'q']);
    put(B, Lg[1] - 1, Lg[2], T_SHOE);
    // busto e testa
    put(B, 8 + hx, 16 + by, T_TORSO);
    put(B, 7 + hx * 2, 2 + by, T_HEAD);
    if (suf === '_bl') put(B, 18 + hx * 2, 10 + by, ['SS', 'dd']);
    if (hurt) put(B, 18 + hx * 2, 10 + by, ['dD', 'Ss']);
    // braccio davanti: manica corta oliva (staccata dal busto da una linea scura),
    // avambraccio crema piegato in avanti, pugno pronto fermo su T_HAND
    const [px, py] = T_HAND;
    put(B, 15, 20, T_ARM_UP.slice(3)); // gomito fermo: niente buchi quando il busto sale
    put(B, 14 + hx, 17 + by, T_ARM_UP);
    put(B, px - 5, py - 2, T_ARM_LO);
    return B;
  }
  regHero('terrarian', terrFrame, TPAL, TOUT, { hand: T_HAND, head: [14, 2] }, 1);

})();

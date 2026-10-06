'use strict';
// =============================================================================
// ART4 · EROI dai riferimenti dell'utente (heroes-ref-a)
// Il Cavaliere (Hollow Knight), Madeline + varianti + Badeline (Celeste), Isaac
// (The Binding of Isaac). Pixel-art "a mano" su griglie di caratteri alla
// risoluzione nativa dei riferimenti; i fotogrammi d'animazione si ottengono
// modificando le righe (gambe, respiro, occhi). Contorno di 1 px automatico.
// Frame: _i0 _i1 _bl _w0.._w3 _hu · SPR[nome] = SPR[nome+'_i0'] · HERO_META.
// Revisione: gambe del Cavaliere leggibili (3 righe, orlo staccato, gamba vicina
// con filo di luce), manina pulita; Badeline senza zaino e con i capelli che
// fluttuano verso l'alto (come in Celeste).
// =============================================================================
(() => {
  const META = (window.HERO_META = window.HERO_META || {});

  // --- mini-toolkit a griglia -------------------------------------------------------
  // '.' trasparente · '_' (solo in stamp) cancella il pixel sotto
  const toG = rows => rows.map(r => r.split(''));
  const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
  const clone = g => g.map(r => r.slice());
  function stamp(dst, src, dx = 0, dy = 0) {
    if (typeof src[0] === 'string') src = toG(src);
    for (let y = 0; y < src.length; y++) for (let x = 0; x < src[y].length; x++) {
      const ch = src[y][x];
      if (ch === '.' || ch === ' ') continue;
      const X = x + dx, Y = y + dy;
      if (Y >= 0 && Y < dst.length && X >= 0 && X < dst[0].length) dst[Y][X] = ch === '_' ? '.' : ch;
    }
    return dst;
  }
  // ritaglia le righe [y0, y1) come nuova griglia
  const rowsOf = (g, y0, y1) => g.slice(y0, y1).map(r => r.slice());
  // sostituisce caratteri dentro un rettangolo
  function recolor(g, x0, y0, x1, y1, map) {
    for (let y = Math.max(0, y0); y <= Math.min(g.length - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(g[0].length - 1, x1); x++)
        if (map[g[y][x]] !== undefined) g[y][x] = map[g[y][x]];
    return g;
  }
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  // cuoce la griglia: colori + contorno di 1 px (4-vicini) attorno ai pixel che non
  // sono già "inchiostro" (caratteri in noOut)
  function bake(g, pal, ink, noOut = '') {
    const h = g.length, w = g[0].length;
    const c = makeCanvas(w, h), cx = c.getContext('2d');
    const id = cx.createImageData(w, h), D = id.data;
    const put = (x, y, col) => { const [r, gg, b] = hex(col), i = (y * w + x) * 4; D[i] = r; D[i + 1] = gg; D[i + 2] = b; D[i + 3] = 255; };
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? '.' : g[y][x]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const col = pal[g[y][x]]; if (col) put(x, y, col); }
    if (ink) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (pal[g[y][x]]) continue;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const ch = at(x + dx, y + dy);
        if (pal[ch] && noOut.indexOf(ch) < 0) { put(x, y, ink); break; }
      }
    }
    cx.putImageData(id, 0, 0);
    return c;
  }
  // registra i fotogrammi di un eroe (tutti della stessa misura) + metadati
  function regHero(name, frames, pal, ink, noOut, meta) {
    for (const suf of ['_i0', '_i1', '_bl', '_w0', '_w1', '_w2', '_w3', '_hu'])
      regSprite(name + suf, bake(frames[suf], pal, ink, noOut));
    SPR[name] = SPR[name + '_i0'];
    META[name] = meta;
  }
  // "respiro": le righe sopra `row` scendono di 1 px (la riga `row` sparisce)
  function squash(g, row) {
    const out = clone(g);
    for (let y = row; y > 0; y--) out[y] = g[y - 1].slice();
    out[0] = Array(g[0].length).fill('.');
    return out;
  }
  // sposta un blocco di righe [y0,y1) di (dx,dy) su una griglia della stessa misura
  function moveRows(g, y0, y1, dx, dy) {
    const out = clone(g);
    for (let y = y0; y < y1; y++) out[y] = Array(g[0].length).fill('.');
    const part = rowsOf(g, y0, y1);
    return stamp(out, part, dx, y0 + dy);
  }

  // =================================================================================
  // IL CAVALIERE — dal riferimento 2.png (griglia 12 px → 1 px). Guscio bianco con
  // corna, occhi neri enormi (volto girato a destra), mantello ardesia, gambe nere.
  // Canvas 24×41. Il chiodo NON è disegnato (lo disegna il motore alla mano).
  // =================================================================================
  const KN_PAL = {
    K: '#1a1220', // contorno del guscio
    W: '#ecebe8', w: '#dcdad6', s: '#c9c7c4', g: '#9d9ba0', m: '#6f6c76', // guscio
    E: '#07060b', // occhi
    b: '#0b0a10', // Vuoto: gambe, pieghe del mantello
    c: '#646d8c', C: '#4b5270', n: '#1d2234', k: '#272832', // mantello
    h: '#16141e', H: '#3d3a4c', // manina che spunta
    L: '#0b0a10', q: '#3d4058', // gambe del Vuoto (nere, senza contorno) + filo di luce sulla gamba vicina
  };
  // riferimento ripulito (senza chiodo né firma), 20 colonne
  const KN_UP = [
    '...KK...........KK..',
    '..KsKK.........KKwK.',
    '..KssK.........KWWK.',
    '.KsWK...........KWwK',
    '.KsWK...........KWwK',
    '.KsWK...........KWwK',
    '..KWWK.........KWwK.',
    '..KWWWKKKKKKKKKWWwK.',
    '...KWWWWWWWWWWWWWK..',
    '..KwKKWWWWWWWWWWWWK.',
    '..KwWWWWWWWWWWWWWWK.',
    '..KwWWWWWWWWWWWWWWK.',
    '.KgwWWWWWWWWWWWWWWK.',
    '.KgwWWWWWWWWWWWWWWK.',
    '.KgwWWWWWEEWWWWWWEK.',
    '.KgwWWWWEEEEWWWWEEK.',
    '..KgwWWWEEEEWWWWEEK.',
    '..KgwWWWEEEEWWWWEEK.',
    '..KgwwWWEEEEWWWWEEK.',
    '..KggwwWWEEWWWWWWEK.',
    '...KggwwwWWWWWWwwK..',
    '....KKggwwwwwwwKK...',
    '.....nKKKKKKKKK.....',
    '...bnnbnnnbnbnb.....',
    '...bCbcccbccbcCb....',
    '...bbCCccbccbccb....',
    '..bnnCCcbccbcbcb....',
    '..bnnnCbcccbcbccb...',
    '.bnnnbbccccbcbccbHh.',
    '.bbbbCCCCcbcbkbCbhh.',
    '.bnnnnCCCcbcbkbbCb..',
    'bnnnnnCCCbcbkkkbCb..',
    'bnnnnnCbbccbkkkbnb..',
    'bnnnnbbCCcbbbkkbnb..',
    'bbbbbCCCCbbbbbkbnb..',
    'bnnnnnnCCbbbkkkbb...',
    '.bnnnnnnbbnnkkkb....',
  ];
  // gambe: 3 righe (4 nel passaggio, corpo su di 1). q = filo di luce sulla gamba vicina,
  // così si capisce quale gamba è avanti nei due contatti.
  const KN_LEGS = {
    idle: ['......qLL....LLL....', '......qLL....LLL....', '......qLLL...LLLL...'],
    // contatto A: gamba vicina avanti, lontana indietro
    c0: ['......LLL..qLL......', '.....LLL....qLL.....', '....LLLL.....qLLL...'],
    // contatto B: gamba lontana avanti, vicina indietro
    c1: ['......qLL..LLL......', '.....qLL....LLL.....', '....qLLL.....LLLL...'],
    // passaggio A: vicina a terra sotto il corpo, lontana sollevata dietro
    p0: ['.....LLL.qLL........', '.....LLL..qLL.......', '......LL..qLL.......', '..........qLLL......'],
    // passaggio B: lontana a terra, vicina sollevata dietro
    p1: ['.....qLL.LLL........', '.....qLL..LLL.......', '......qL..LLL.......', '..........LLLL......'],
  };
  function knFrame(legs, o = {}) {
    const G = blank(24, 41);
    const up = toG(KN_UP);
    const lift = o.lift || 0;
    stamp(G, up, 2 + (o.dx || 0), 1 - lift);
    stamp(G, legs, 2, 1 + 37 - lift);
    return G;
  }
  const KN_EYES = (G, oy, closed, dx = 0) => {
    // cancella gli occhi e li ridisegna chiusi
    recolor(G, 9 + dx, 15 + oy, 20 + dx, 22 + oy, { E: 'W' });
    if (closed === 'blink') stamp(G, ['EEEE....EE', '.EE.......'], 10 + dx, 19 + oy);
    // colpito: occhi strizzati a "> <"
    else stamp(G, ['E.......E', 'EEE....EE', '.EEE..EE.', 'EEE....EE', 'E.......E'], 10 + dx, 16 + oy);
    return G;
  };
  // il retro del mantello sventola all'indietro (righe y0..y1 del canvas, colonne < xs)
  function flare(G, y0, y1, xs) {
    for (let y = y0; y < y1; y++) for (let x = 0; x < xs; x++) G[y][x] = G[y][x + 1];
    return G;
  }
  {
    const L = KN_LEGS, F = {};
    F._i0 = knFrame(L.idle);
    F._i1 = squash(F._i0, 1 + 29);
    F._bl = KN_EYES(clone(F._i0), -1, 'blink');
    F._w0 = flare(knFrame(L.c0), 30, 38, 7);
    F._w1 = flare(knFrame(L.p0, { lift: 1 }), 32, 37, 6);
    F._w2 = flare(knFrame(L.c1), 30, 38, 7);
    F._w3 = flare(knFrame(L.p1, { lift: 1 }), 32, 37, 6);
    // colpito: testa e mantello arretrano di 1 px e si schiacciano, occhi strizzati
    F._hu = KN_EYES(squash(moveRows(F._i0, 0, 1 + 37, -1, 0), 1 + 28), 0, 'hurt', -1);
    regHero('knight', F, KN_PAL, '#1a1220', 'KbLq', { hand: [20, 29], head: [12, 1] });
  }

  // =================================================================================
  // MADELINE — dal riferimento 3.png (griglia 6 px → 1 px). Capelli rossi con il
  // ciuffo-antenna, piumino turchese a fasce, pantaloni viola, zaino marrone.
  // Accorciata di 7 righe (antenna, giacca, gambe) per stare in 28×46.
  // La coda di capelli la disegna il motore: qui la chioma è compatta.
  // =================================================================================
  const MD_UP = [
    '.............r..............',
    '..............RR............',
    '................R...........',
    '...........oooorroo.........',
    '.........oorRRRRrrroo.......',
    '........orRRRRRRRrRRro......',
    '.......orHRRRRRRRRRRRRo.....',
    '.......oRRHHRRRRRRRRRHRo....',
    '.......orrrRRHHHRRRRHRRRo...',
    '.......orrRRRRRRRRrRRRooo...',
    '......orrRRRRRRRrSrRRRro....',
    '......orrrrRRRRrSSrRRrRo....',
    '......orrrRRRroooSrRRoRRo...',
    '......orrrRrpSsEessreooo....',
    '......orrrroSSseessreoo.....',
    '.....orrrrroSsseessseo......',
    '....oooooooorrsssssSsr......',
    '...oopBBBppooSsssmmsso......',
    '...oBooppooopooossssoo......',
    '..ooBooooBBopttTooooTto.....',
    '..opBotttopBoTtttTpTttoo....',
    '..ooBoTtttoBpoptttpttpoo....',
    '...ootttTTopBoTTppppTTopo...',
    '...oottttoooBottttTtttopo...',
    '..ooTTtToooooootttTttooooo..',
    '..oottttttTssSotttTttosSTo..',
    '..oottttttpssBoTppppToBSpo..',
    '..ooTttttTpssSotttTttosSpo..',
    '...ooooooooooottttTttoooo...',
    '...oBppooopTttttttTttto.....',
    '..ooooooppppppTTppppTpo.....',
    '..opBopopTTtttttttTttto.....',
    '..oBoBooTTttttttttpttto.....',
    '..oBoopoooooooooooooooo.....',
    '..ooBpppopppppoooppppo......',
    '...oooooopppppoooppppo......',
  ];
  // gambe: 9 righe a riposo/contatto, 10 nel passaggio (corpo su di 1 px)
  const MD_LEGS = {
    idle: [
      '........opppppo.oppppo......',
      '........oppppo..opppo.......',
      '.......ooppoo...ooppo.......',
      '.......opppo...ooooo........',
      '......oooooo...oooppo.......',
      '......ooppoo...ooooppo......',
      '......oppppo...ooooooo......',
      '......oooooo................',
    ],
    c0: [
      '........opppppo.oppppo......',
      '........oppppo...oppppo.....',
      '.......oppppo.....oppppo....',
      '......ooppoo.......ooppo....',
      '.....oppo..........ooooo....',
      '....ooooo..........oppppo...',
      '....oppppo.........opppppo..',
      '....oooooo.........ooooooo..',
    ],
    c1: [
      '........opppppo.oppppo......',
      '........oppppo..oppppo......',
      '.......oppppo....oppppo.....',
      '.......oppoo......ooppo.....',
      '......oooo.........ooooo....',
      '.....opppo.........oppppo...',
      '.....ooooo.........opppppo..',
      '...................ooooooo..',
    ],
    p0: [
      '........opppppo.oppppo......',
      '........oppppo..opppo.......',
      '........ooppoo..opppo.......',
      '.........oppo...opppo.......',
      '........ooooo...opppo.......',
      '........oppppo..ooooo.......',
      '........ooooooo.oppppo......',
      '................opppppo.....',
      '................ooooooo.....',
    ],
    p1: [
      '........opppppo.oppppo......',
      '........oppppo..opppo.......',
      '........oppppo..oppppo......',
      '........opppo....ooppo......',
      '........opppo....ooooo......',
      '........ooooo....oppppo.....',
      '........oppppo...ooooooo....',
      '........opppppo.............',
      '........ooooooo.............',
    ],
  };
  const MD_PAL = {
    o: '#301234', p: '#4c1c55', t: '#6fc0bc', T: '#486397', s: '#fcc7a2', S: '#d2606c', B: '#7e3e3e',
    R: '#f25656', r: '#a11942', H: '#fcc7a2', e: '#4c1c55', E: '#4c1c55', m: '#a11942',
  };
  function mdFrame(legs, o = {}, up = MD_UP, upY = 2) {
    const G = blank(28, 46);
    const lift = o.lift || 0;
    stamp(G, up, 0, upY - lift);
    stamp(G, legs, 0, 38 - lift);
    return G;
  }
  // occhio vicino: colonne 15-16, righe 15-17 · occhio lontano: colonna 20 · bocca 17-18 riga 19
  function mdEyes(G, kind, dx = 0, dy = 0) {
    const x0 = 15 + dx, y0 = 15 + dy;
    if (kind === 'blink') stamp(G, ['ss...s', 'ss...s', 'oo...o'], x0, y0);
    else {
      // colpito: occhi strizzati, guance arrossate, bocca aperta
      stamp(G, ['ss...s', 'oo...o', 'SS...S'], x0, y0);
      stamp(G, ['oo', 'mm'], x0 + 2, y0 + 4);
    }
    return G;
  }
  function madelineFrames(up = MD_UP, upY = 2, upB = up) {
    const L = MD_LEGS, F = {};
    F._i0 = mdFrame(L.idle, {}, up, upY);
    F._i1 = squash(mdFrame(L.idle, {}, upB, upY), 29);
    F._bl = mdEyes(clone(F._i0), 'blink');
    F._w0 = mdFrame(L.c0, {}, up, upY);
    F._w1 = mdFrame(L.p0, { lift: 1 }, upB, upY);
    F._w2 = mdFrame(L.c1, {}, up, upY);
    F._w3 = mdFrame(L.p1, { lift: 1 }, upB, upY);
    F._hu = mdEyes(squash(moveRows(F._i0, 0, 36, -1, 0), 26), 'hurt', -1, 1);
    return F;
  }
  const MD_F = madelineFrames();
  const MD_META = { hand: [23, 28], head: [15, 5], hair: [8, 12] };
  regHero('madeline', MD_F, MD_PAL, '#301234', 'o', MD_META);
  regHero('madeline_blue', MD_F, Object.assign({}, MD_PAL, { R: '#5fb3ff', r: '#2c64c8', H: '#c4ecff' }), '#301234', 'o', MD_META);
  regHero('madeline_pink', MD_F, Object.assign({}, MD_PAL, { R: '#ff7ad9', r: '#b8329a', H: '#ffd2f2' }), '#301234', 'o', MD_META);
  // BADELINE — il riflesso. Come in Celeste: niente zaino (stessa sagoma di Madeline ma
  // senza zaino, braccio sinistro libero), capelli viola che FLUTTUANO verso l'alto/dietro
  // in ciocche che ondeggiano (variante B nei fotogrammi di respiro e di passaggio), pelle
  // lavanda pallida, giacca viola, pantaloni e stivali quasi neri, occhi rossi che brillano.
  // Griglia di 38 righe (2 in più in cima per le ciocche), stampata a y = 0.
  const BD_LEFT = { // colonne 0-12 delle righe di MD_UP 15-35: via lo zaino, spalla e fianco
    15: '.....orrrrroS', 16: '....oooooooor',
    17: '.....ottttToo', 18: '....otTtttTop', 19: '....otttttTop', 20: '....oTtttTtpo',
    21: '....otttttTpp', 22: '....ottTTtTop', 23: '....otttttoop', 24: '...oTTtTttToo',
    25: '...ottttttTss', 26: '...ottttttpss', 27: '...oTttttTpss', 28: '...oooooooooo',
    29: '......oppppTt', 30: '......otppppp', 31: '......otTTttt', 32: '......otTTttt',
    33: '......ooooooo', 34: '........opppp', 35: '........opppp',
  };
  const BD_TOP_A = [ // righe 0-8 (= MD_UP -2..6): ciocca che sale all'indietro, niente antenna
    '..ooo.......................',
    '.oRRRo..oo..................',
    '.orRRRooRRo.................',
    '.orrRRRRRRo.................',
    '..orrRRRRRo.................',
    '...orrRRRRRoooooooo.........',
    '....orrRRRRrRRRRrrroo.......',
    '.....orrRRRRRRRRRrRRro......',
    '......orrHRRRRRRRRRRRRo.....',
  ];
  const BD_TOP_B = [ // le punte ondeggiano: più basse di 1 e piegate in avanti
    '............................',
    '...ooo..oo..................',
    '..oRRRooRRo.................',
    '.orrRRRRRRo.................',
    '.orrRRRRRo..................',
  ];
  // ciocca bassa dietro la nuca, sollevata
  const BD_WISP_A = { 9: '..oo', 10: '.oRRo', 11: '.orRRo', 12: '..orRRr', 13: '...orrr' };
  const BD_WISP_B = { 10: '..oo', 11: '.oRRo', 12: '.orRRRr', 13: '..orrrr' };
  function bdUp(top, wisp) {
    const rows = ['.'.repeat(28), '.'.repeat(28)].concat(MD_UP.map((r, i) => (BD_LEFT[i] ? BD_LEFT[i] + r.slice(13) : r)));
    top.forEach((r, i) => { rows[i] = r; });
    for (const k in wisp) rows[k] = wisp[k] + rows[k].slice(wisp[k].length);
    const g = toG(rows);
    g[28][13] = 'S'; g[28][22] = 's'; // i pugni stringono il nulla (niente spallacci dello zaino)
    return g;
  }
  const BD_A = bdUp(BD_TOP_A, BD_WISP_A);
  const BD_B = bdUp(BD_TOP_A.map((r, i) => BD_TOP_B[i] || r), BD_WISP_B);
  regHero('badeline', madelineFrames(BD_A, 0, BD_B), {
    o: '#1a0b22', p: '#2a1f38', t: '#6c4aa6', T: '#43287a', s: '#e4d0f2', S: '#a585c6', B: '#3d2552',
    R: '#a64ad6', r: '#5c1e88', H: '#e6b0ff', e: '#ff2448', E: '#ffc0ca', m: '#7a2a78',
  }, '#1a0b22', 'o', { hand: [23, 28], head: [15, 5] });

  // =================================================================================
  // ISAAC — dal riferimento 6.png (pixel ~10.25 px, contorno doppio → qui 1 px).
  // Testone rosa calvo, occhioni neri con riflesso, lacrime azzurre sulle guance,
  // bocca aperta col labbro dei denti, corpicino minuscolo. Viso frontale come nel riferimento.
  // =================================================================================
  const IS_HEAD = [
    '............................',
    '............................',
    '..........aaaaaaab..........',
    '........alllaaaaaaab........',
    '......alllaaaaaaaaaaab......',
    '.....allaaaaaaaaaaaaaab.....',
    '....allaaaaaaaaaaaaaaabb....',
    '....alaaaaaaaaaaaaaaaabb....',
    '...baaaaaaaaaaaaaaaaaaabb...',
    '...baaaaaaaaaaaaaaaaaaabb...',
    '..baaaaaaaaaaaaaaaaaaaaabb..',
    '..baaaaaaaaaaaaaaaaaaaaabb..',
    '..baaaaaaaaaaaaaaaaaaaaabb..',
    '..baaaaaaaaaaaaaaaaaaaaabc..',
    '..caaaaaaaaaaaaaaaaaaaaabc..',
    '...baaaaaaaaaaaaaaaaaaabc...',
    '...caaaaaaaaaaaaaaaaaaabc...',
    '....baaaaaaaaaaaaaaaaabc....',
    '....caaaaaaaaaaaaaaaaabc....',
    '.....caaaaaaaaaaaaaabbc.....',
    '......cbbaaaaaaaaaabbc......',
    '........cbbbaaaabbbc........',
    '..........cbbbbbbc..........',
    '.......kkkkkkkkkkkkkk.......',
  ];
  const IS_BODY = {
    // spalle+braccia (righe 24-27) e gambe (righe 28-30); riga 31 = contorno
    arms: [
      '.......aakbbbbbbbbkaa.......',
      '.......abkaaaaaaaakab.......',
      '.......abkaaaaaaaakab.......',
      '.......bb.aaaaaaaa.bb.......',
    ],
    idle: ['..........aaabbaaa..........', '..........aab..aab..........', '..........abb..abb..........'],
    c0: ['..........aaabbaaa..........', '.........aab....aab.........', '........abb......abb........'],
    c1: ['..........aaabbaaa..........', '..........aab...aab.........', '.........abb.....abb........'],
    p0: ['..........aaabbaaa..........', '..........aab..aab..........', '..........abb..abb..........', '...............abb..........'],
    p1: ['..........aaabbaaa..........', '..........aab..aab..........', '..........abb..abb..........', '..........abb...............'],
  };
  const IS_EYE = ['.eeee.', 'ewweee', 'ewweee', 'eeeeee', 'eeeeee', '.eeee.'];
  const IS_MOUTH = ['.mmmm.', 'mmmmmm', 'mnnnnm', 'mmmmmm'];
  // lacrime: forma base + allungamento (k = 0/1)
  const IS_TEAR_L = k => ['.tut', 'tttT', '.ttT', '..tTT', k ? '...tT' : '...TT', k ? '....T' : ''];
  const IS_TEAR_R = k => ['tut.', 'Tttt', 'Ttt.', 'TTt..'.slice(0, 3), k ? 'tT' : 'TT', k ? 'T.' : ''];
  function isFace(G, o = {}) {
    const dy = o.dy || 0, dx = o.dx || 0;
    if (o.eyes === 'blink') {
      stamp(G, ['......', '......', '......', 'eeeeee', '.eeee.'], 4 + dx, 11 + dy);
      stamp(G, ['......', '......', '......', 'eeeeee', '.eeee.'], 18 + dx, 11 + dy);
    } else if (o.eyes === 'hurt') {
      stamp(G, ['ee....', '.eee..', '...eee', '.eee..', 'ee....'], 4 + dx, 11 + dy);
      stamp(G, ['....ee', '..eee.', 'eee...', '..eee.', '....ee'], 18 + dx, 11 + dy);
    } else {
      stamp(G, IS_EYE, 4 + dx, 11 + dy);
      stamp(G, IS_EYE, 18 + dx, 11 + dy);
    }
    if (o.eyes === 'hurt') stamp(G, ['.mmmm.', 'mmmmmm', 'mnnnnm', 'mmmmmm', 'mmmmmm', '.mmmm.'], 11 + dx, 15 + dy);
    else stamp(G, IS_MOUTH, 11 + dx, 14 + dy);
    const k = o.tear || 0;
    stamp(G, IS_TEAR_L(k).filter(r => r), 4 + dx, 17 + dy);
    stamp(G, IS_TEAR_R(k).filter(r => r), 19 + dx, 17 + dy);
    return G;
  }
  function isFrame(legs, o = {}) {
    const G = blank(28, 32);
    const lift = o.lift || 0;
    // gambe prima (sotto), poi braccia e testa
    stamp(G, legs, 0, 28 - lift);
    stamp(G, IS_BODY.arms, 0, 24 - lift + (o.armDy || 0));
    stamp(G, IS_HEAD, 0, (o.headDy || 0) - lift);
    isFace(G, { dy: (o.headDy || 0) - lift, eyes: o.eyes, tear: o.tear });
    return G;
  }
  {
    const L = IS_BODY, F = {};
    F._i0 = isFrame(L.idle);
    F._i1 = isFrame(L.idle, { headDy: 1, tear: 1 });
    F._bl = isFrame(L.idle, { eyes: 'blink' });
    F._w0 = isFrame(L.c0, { tear: 0 });
    F._w1 = isFrame(L.p0, { lift: 1, tear: 1 });
    F._w2 = isFrame(L.c1, { tear: 0 });
    F._w3 = isFrame(L.p1, { lift: 1, tear: 1 });
    F._hu = isFrame(L.idle, { headDy: 1, eyes: 'hurt', tear: 1 });
    regHero('isaac', F, {
      k: '#1a1220', a: '#ecc8c3', b: '#d79f9c', c: '#b9726f', l: '#f9e4df',
      e: '#0c0710', w: '#ffffff', m: '#0c0710', n: '#f4ecec',
      t: '#8fcfe6', T: '#4f8fbf', u: '#e8fbff',
    }, '#1a1220', 'k', { hand: [20, 27], head: [13, 1] });
  }
})();

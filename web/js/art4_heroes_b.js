'use strict';
// =============================================================================
// ART4 · EROI (riferimenti dell'utente) — Il Prigioniero (Dead Cells) e il
// Penitente (Blasphemous). Pixel-art disegnata a mano come griglie di caratteri
// a strati (braccio dietro → gambe → busto → braccio davanti → testa), con
// contorno selettivo di 1 px. Frame: _i0 _i1 _bl _w0.._w3 _hu.
// =============================================================================
(() => {
  const OUTC = '#1a1220';
  window.HERO_META = window.HERO_META || {};

  // ---- micro-motore a griglie ------------------------------------------------
  const buf = (w, h) => Array.from({ length: h }, () => new Array(w).fill(null));
  // part = { x, y, rows: [...] }; '.'/' ' trasparente, '_' cancella
  function stamp(B, part, dx = 0, dy = 0, map) {
    const x0 = (part.x || 0) + dx, y0 = (part.y || 0) + dy;
    for (let j = 0; j < part.rows.length; j++) {
      const y = y0 + j, row = part.rows[j];
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
  const HEX = {};
  function rgb(hex) { return HEX[hex] || (HEX[hex] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]); }
  // pal[ch] = colore; outl[ch] = colore del contorno (null = nessun contorno)
  function bake(B, pal, outl = {}) {
    const h = B.length, w = B[0].length;
    const c = makeCanvas(w, h), g = c.getContext('2d');
    const id = g.createImageData(w, h), D = id.data;
    const put = (x, y, hex) => { const v = rgb(hex), i = (y * w + x) * 4; D[i] = v[0]; D[i + 1] = v[1]; D[i + 2] = v[2]; D[i + 3] = 255; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = B[y][x]; if (ch && pal[ch]) put(x, y, pal[ch]); }
    const N = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (B[y][x]) continue;
      for (const [dx, dy] of N) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const ch = B[yy][xx];
        if (!ch) continue;
        const o = outl[ch];
        if (o === null) continue;
        put(x, y, o || OUTC);
        break;
      }
    }
    g.putImageData(id, 0, 0);
    return c;
  }
  function regHero(name, frames) {
    for (const suf in frames) regSprite(name + suf, frames[suf]);
    SPR[name] = SPR[name + '_i0'];
  }

  // ===========================================================================
  // IL PRIGIONIERO (Dead Cells) — 32×46
  // ===========================================================================
  const PW = 32, PH = 46;
  const PPAL = {
    // fiamma magenta
    D: '#8e1f52', F: '#c63a6e', L: '#e8608f', W: '#ffa6c6', e: '#ff7fae',
    // croce d'oro
    y: '#eba23c', Y: '#ffe08a', o: '#b9682a',
    // sciarpa / tunica rossa
    R: '#d8553c', r: '#b53029', n: '#86203a', m: '#5c1535',
    // spallaccio ardesia
    P: '#93a9bf', p: '#647a92', q: '#3f4f62', k: '#1d2549',
    // fascia del petto
    H: '#55687c', h: '#3b4b5b',
    // azzurro (guanti, stivali, maniche)
    B: '#e0f7f4', b: '#a5dcdf', c: '#679fb2', x: '#4d6480',
    // pantaloni beige e pieghe viola
    A: '#f3cca7', a: '#e0ab89', s: '#b8826f', g: '#6a3d5a', v: '#3d183b',
    // brace del collo (senza testa)
    E: '#ff9a4a', u: '#ffd27a', Z: '#7a6878',
  };
  const POUT = { D: '#4a0c2a', F: '#4a0c2a', L: '#4a0c2a', W: '#4a0c2a', e: null, y: '#4a0c2a', Y: '#4a0c2a', o: '#4a0c2a', u: null, Z: null };

  const FLAME_A = { x: 9, y: 3, rows: [
    '......F.......',
    '.....DFF......',
    '....DFLF......',
    '...DFLFF......',
    '...DFLF.......',
    '..DFLLFF......',
    '..DFFLLFFD....',
    '...DFFLLLFFD..',
    '..DFLLWLyLFFD.',
    '.DFLLWLoyoLFF.',
    '.DFLLLyyYyyFF.',
    '.DFLLLLoyoLFF.',
    '.DFFLLLLyLFFD.',
    '..DDFFLLFFDD..',
  ] };
  const FLAME_B = { x: 9, y: 3, rows: [
    '......FF......',
    '.....DFL......',
    '....DFLF......',
    '....DFLFF.....',
    '...DFLFF......',
    '...DFLLFF.....',
    '..DFFLLFFF....',
    '..DFFLLLFFD...',
    '..DFLLWLyLFFD.',
    '.DFLLWLoyoLFFD',
    '.DFLLLyyYyyFF.',
    '.DFLLLLoyoLFF.',
    '..DFLLLLyLFFD.',
    '..DDFFLLFFDD..',
  ] };
  const P_TORSO = { x: 8, y: 15, rows: [
    '.RRrrrrrrrrrrn.',
    'RRrrmmmmmmmmrrn',
    'RRrrrrrrrrrrrrn',
    'nRRrrrrrrrrrrnm',
    'mnRrrrrrrrrrnm.',
    '.mmnrrrrrrrnmh.',
    '.hhhmmnrrnmmhh.',
    '.Hhhhhmmmmhhhk.',
    '.kkkkkkkkkkkkk.',
    '..Rrrrrrrrrrn..',
    '..mmmmmmmmmmm..',
    '..ggggRrrrngg..',
    '......mmmmmm...',
    '......mRrrrn...',
    '......mRrrrn...',
    '......mrrrrn...',
    '......mrrrrn...',
    '......mrrrrn...',
    '......mrrrrn...',
    '......mrrrrn...',
    '.......mmmm....',
  ] };
  const P_PAULDRON = { x: 2, y: 14, rows: [
    '...qkk..',
    '.PPPpkk.',
    'PPPPppkk',
    'PPPpppkk',
    'PPpppqkk',
    'Pppppqkk',
    'pppppqkk',
    'ppppqkk.',
    'qqqqkkk.',
    '.kkkkk..',
  ] };
  // braccio dietro (sotto lo spallaccio): manica azzurra → fascia viola →
  // avambraccio color pelle con lacci viola → guanto azzurro (come nel riferimento)
  const P_BACKARM = { x: 2, y: 22, rows: [
    '..bb..',
    '..bbc.',
    '.vvv..',
    '.Aag..',
    '.gAa..',
    'Bba...',
    'bBc...',
    '.cc...',
  ] };
  const P_FRONTARM = { x: 20, y: 17, rows: [
    '.Bb......',
    '.bbc.....',
    '.bbc.....',
    '.bbc.....',
    '..vvv....',
    '..vAAa...',
    '...gAas..',
    '....AAgs.',
    '.....Bbb.',
    '.....bBc.',
    '.....cbc.',
  ] };
  const P_LEGS_IDLE = { x: 0, y: 26, rows: [
    '.........Aaaas....aaas..........',
    '........AAaaasv..Aaaass.........',
    '.......AAagaasv..Aaaaass........',
    '.......Aagaaas...AAagaass.......',
    '......AAgaaaas....Aaagaas.......',
    '......Aagaaaas....Aaaagaas......',
    '.....AAgaaaaas....AAaaagas......',
    '.....Aagaaaass.....Aaaaagas.....',
    '....AAgaaaaass.....Aaaaaagss....',
    '....Aggaaaasss.....AAaaaaggs....',
    '....ggaaaasss.......Aaaaaaggg...',
    '....vgggggggv.......vgggggggv...',
    '.....vvvvvvv.........vvvvvvv....',
    '......rrm..............rrm......',
    '......mmm..............mmm......',
    '......rrm..............rrm......',
    '....Bbbbc.............Bbbbc.....',
    '...Bbbbbc.............Bbbbbbc...',
    '..xbbbbbc.............Bbbbbbbx..',
  ] };

  // camminata: le due gambe a sbuffo dell'idle, separate, spostate e alzate
  // (così i pantaloni restano larghi e le gambe restano due anche in moto)
  const P_LEG_B = { x: 0, y: 26, rows: P_LEGS_IDLE.rows.map(r => r.slice(0, 16)) };
  const P_LEG_F = { x: 16, y: 26, rows: P_LEGS_IDLE.rows.map(r => r.slice(16)) };
  // L = { dx, lift }: il piede alzato accorcia la coscia (le prime righe spariscono sotto il busto)
  function stampLegI(B, part, L) {
    const dx = L.dx || 0, lift = L.lift || 0;
    for (let j = lift; j < part.rows.length; j++) stamp(B, { x: part.x + dx, y: part.y + j - lift, rows: [part.rows[j]] });
  }
  const P_WALK = [
    [{ dx: 0 }, { dx: 0 }],
    [{ dx: 1, lift: 2 }, { dx: 0 }],
    [{ dx: 2 }, { dx: -2 }],
    [{ dx: 0 }, { dx: -1, lift: 2 }],
  ];

  function prisonerFrame(flame, legs, o) {
    const B = buf(PW, PH);
    const by = o.by || 0, bx = o.bx || 0, fy = by + (o.fy || 0);
    stamp(B, P_BACKARM, Math.max(0, bx) + (o.swing || 0), by);
    if (Array.isArray(legs)) { stampLegI(B, P_LEG_B, legs[0]); stampLegI(B, P_LEG_F, legs[1]); } else stamp(B, legs);
    stamp(B, P_TORSO, bx, by);
    stamp(B, P_PAULDRON, bx, by);
    stamp(B, P_FRONTARM, bx, by);
    if (flame) {
      const map = o.blink ? { y: 'L', Y: 'L', o: 'L' } : null;
      // nel colpo la fiamma viene "spinta" indietro (in cima più che in basso)
      const tilt = o.hurt ? (j => [-Math.round((flame.rows.length - j) / 6), j < 2 ? 1 : 0]) : (() => [0, 0]);
      for (let j = 0; j < flame.rows.length; j++) { const [dx, dy] = tilt(j); stamp(B, { x: flame.x + dx, y: flame.y + j + dy, rows: [flame.rows[j]] }, bx, fy, map); }
      if (o.blink) stamp(B, { x: 15, y: 13, rows: ['oyyyo'] }, bx + (o.hurt ? -1 : 0), fy);
    } else {
      // collo senza testa: un moncherino che cova una brace
      stamp(B, { x: 12, y: 9, rows: ['....Z.', '...Z..', '....Z.', '...u..', '..EuE.', '.mEEEm', 'mmnnnm'] }, bx, by);
    }
    return bake(B, PPAL, POUT);
  }
  function prisonerSet(flame) {
    const f = (legs, o) => prisonerFrame(flame, legs, o);
    return {
      _i0: f(P_LEGS_IDLE, {}),
      _i1: f(P_LEGS_IDLE, { by: 1 }),
      _bl: f(P_LEGS_IDLE, { blink: 1 }),
      _w0: f(P_WALK[0], { swing: 1 }),
      _w1: f(P_WALK[1], { by: -1 }),
      _w2: f(P_WALK[2], {}),
      _w3: f(P_WALK[3], { by: -1 }),
      _hu: f(P_LEGS_IDLE, { by: 1, blink: 1, hurt: 1 }),
    };
  }
  regHero('prisoner', prisonerSet(FLAME_A));
  regHero('prisoner_f2', prisonerSet(FLAME_B));
  regHero('prisoner_headless', prisonerSet(null));
  const PMETA = { hand: [26, 26], head: [15, 3], glow: '#e8608f' };
  HERO_META.prisoner = PMETA; HERO_META.prisoner_f2 = PMETA;
  HERO_META.prisoner_headless = { hand: [26, 26], head: [15, 12], glow: '#ff9a4a' };

  // l'Omuncolo: solo la testa-fiamma che vola
  {
    const B = buf(16, 16);
    stamp(B, FLAME_A, -8, -2);
    regSprite('homunculus', bake(B, PPAL, POUT));
  }

  // ===========================================================================
  // IL PENITENTE (Blasphemous) — 30×46 (il capirote lo rende alto)
  // Capirote d'acciaio avvolto da tre giri di spine, maschera con due fori per
  // gli occhi e una fessura per la bocca, corazza argentata, spallaccio sulla
  // spalla davanti, panno chiaro che scende dalla spalla dietro, cintura di
  // cuoio con cingolo rosso a cordoni, pantaloni viola a sbuffo, ginocchiere e
  // schinieri (riferimento dell'utente 5.png, senza la spada).
  // ===========================================================================
  const NW = 30, NH = 46;
  const NPAL = {
    // acciaio verdastro (6 toni) + spine
    0: '#101a1c', 1: '#1e3236', 2: '#34494c', 3: '#587070', 4: '#88a29f', 5: '#b2c9c2', 6: '#eef8ee', X: '#0a1012', T: '#6f8c88',
    // stoffa viola/vinaccia
    k: '#24121c', p: '#3a1f30', m: '#5c2842', M: '#7c4670', L: '#a5719b',
    // stinchi/stivali vinaccia
    V: '#a04a5c', v: '#7a3046', u: '#4e1c2c',
    // cingolo rosso
    R: '#e02a30', r: '#a8161f', d: '#5a0c18',
    // panno chiaro sulla spalla
    C: '#ece0d2', c: '#c8b8aa', w: '#978684', W: '#5e4b4e',
    // cuoio arancio (guanti, punte dei piedi) e cintura
    O: '#f2946a', o: '#cf6646', b: '#8a3a32', n: '#4a2a24',
  };
  const NOUT = { X: null, T: null };
  // capirote: tre spire di spine che salgono a destra; le punte (T) sporgono
  // dalla sagoma senza contorno, come nel riferimento
  const N_SPIRE = { x: 9, y: 3, rows: [
    '.......5....',
    '......54....',
    '......40T...',
    '.....T042...',
    '......532...',
    '......432...',
    '.....5400T..',
    '....T0032...',
    '.....54321..',
    '....554321T.',
    '....5432000T',
    '..T00003221.',
  ] };
  // elmo-maschera scuro: due fori per gli occhi e la fessura della bocca
  const N_HEAD = { x: 10, y: 15, rows: [
    'T0122333210T',
    '.0123344431.',
    '.01233X44X1.',
    '.01234X33X1.',
    '.0122343031.',
    '..01222110..',
  ] };
  // panno attorno al collo che scende dalla spalla dietro
  const N_CLOTH = [
    { x: 2, y: 18, rows: [
      '.........cCC.',
      '......wcCCCc.',
      '....wcCCcCCc.',
      '..WwcCCcwcCw.',
      '.WwcCcw.Wcw..',
      'W.wcCw...W...',
      '..WcW........',
      '..W..........',
    ] },
    { x: 2, y: 18, rows: [
      '.........cCC.',
      '.......wcCCc.',
      '...WwcCCcCCc.',
      '.WwcCCcwwcCw.',
      'W.WcCcw..Wc..',
      '..wcCw....W..',
      '.WcW.........',
      '.W...........',
    ] },
  ];
  // corazza, cintura di cuoio con fibbia, cingolo rosso e cordoni
  const N_BODY = { x: 9, y: 20, rows: [
    '..n23455n...',
    '.2345666543.',
    '23456666543.',
    '234566655431',
    '123455554321',
    '.n12333221n.',
    '.n01111100n.',
    'nnnnnOonnnnn',
    'dRRRRRRRRRRd',
    'drRRRdRrrrrd',
    '.dd.rRdR.dd.',
    '....R.r.....',
    '....r.R.....',
    '....d.r.....',
    '....R.d.....',
    '....r.......',
  ] };
  const N_PAULDRON = { x: 19, y: 19, rows: [
    '..2345.',
    '.234565',
    '2345664',
    '2345543',
    '.234432',
    '..1221.',
  ] };
  // braccio dietro: manica viola, gomitiera, guanto
  const N_BACKARM = { x: 5, y: 22, rows: [
    '...pmM',
    '..pmM.',
    '..pmM.',
    '.p234.',
    '.pmM..',
    'oOOb..',
    'ooOo..',
    '.bo...',
  ] };
  // braccio davanti: esce dallo spallaccio, gomitiera, pugno pronto per l'arma
  const N_FRONTARM = { x: 21, y: 24, rows: [
    '.mMMp',
    '.mMMp',
    '.2342',
    '.mMMp',
    '..mML',
    '..OOOo',
    '..oOOb',
    '...bo.',
  ] };

  // --- gambe parametriche: anca → ginocchio → caviglia ----------------------
  const ROWS_THIGH = ['LMMMMmmp', 'LMMMMmmp', 'LMMMMmp', 'LMMMmmp', 'LMMMmp', 'LMMmmp', 'LMMmmp', 'LMMmp', 'LMMmp', 'LMmmp'];
  const ROWS_KNEE = ['23452', '12321'];
  const ROWS_SHIN = ['Vvvu', 'Vvvu', 'Vvvu', 'Vvuu'];
  const FOOT_R = ['2342.', 'uvVOO', 'nbboo'];
  const flipS = r => r.split('').reverse().join('');
  const BACKMAP = { L: 'M', M: 'm', m: 'p', p: 'k', V: 'v', v: 'u', u: 'n', 5: '4', 4: '3', 3: '2', O: 'o' };
  // L = { h, k, a: centri x di anca/ginocchio/caviglia, dir: ±1 piede, lift, back }
  function stampLegP(B, L, hipY) {
    const lift = L.lift || 0, map = L.back ? BACKMAP : null;
    const footY = NH - 3 - lift, shinY = footY - ROWS_SHIN.length, kneeY = shinY - ROWS_KNEE.length;
    const nT = kneeY - hipY;
    const put = (row, cx, y) => stamp(B, { x: cx - (row.length >> 1), y, rows: [row] }, 0, 0, map);
    for (let j = 0; j < nT; j++) {
      const t = nT > 1 ? j / (nT - 1) : 0;
      const ti = Math.min(ROWS_THIGH.length - 1, Math.round(j * (ROWS_THIGH.length - 1) / Math.max(1, nT - 1)));
      put(ROWS_THIGH[ti], Math.round(L.h + (L.k - L.h) * t), hipY + j);
    }
    ROWS_KNEE.forEach((r, j) => put(r, L.k, kneeY + j));
    ROWS_SHIN.forEach((r, j) => put(r, Math.round(L.k + (L.a - L.k) * (j + 1) / ROWS_SHIN.length), shinY + j));
    FOOT_R.forEach((r, j) => {
      const row = L.dir < 0 ? flipS(r) : r;
      stamp(B, { x: L.a - 2 + (L.dir < 0 ? -1 : 0), y: footY + j, rows: [row] }, 0, 0, map);
    });
  }
  const N_IDLE = [{ h: 12, k: 9, a: 8, dir: -1, back: 1 }, { h: 18, k: 21, a: 22, dir: 1 }];
  // camminata vista di 3/4: contatto a Λ (gamba vicina avanti), passaggio con il
  // piede alzato, contatto opposto (gamba vicina indietro), passaggio
  const N_WALK = [
    [{ h: 13, k: 10, a: 8, dir: 1, back: 1 }, { h: 17, k: 20, a: 22, dir: 1 }],
    [{ h: 14, k: 14, a: 13, dir: 1, back: 1, lift: 2 }, { h: 16, k: 16, a: 16, dir: 1 }],
    [{ h: 15, k: 17, a: 19, dir: 1, back: 1 }, { h: 15, k: 13, a: 11, dir: 1 }],
    [{ h: 14, k: 14, a: 14, dir: 1, back: 1 }, { h: 16, k: 17, a: 17, dir: 1, lift: 2 }],
  ];
  function penitentFrame(legs, o) {
    const B = buf(NW, NH);
    const by = o.by || 0, bx = o.bx || 0;
    stamp(B, N_BACKARM, bx + (o.swing || 0), by);
    for (const L of legs) stampLegP(B, L, 28 + by);
    stamp(B, N_BODY, bx, by);
    stamp(B, N_CLOTH[o.wave ? 1 : 0], Math.max(0, bx), by);
    const hx = bx + (o.hurt ? -1 : 0), hy = by;
    // nel colpo il capirote viene spinto all'indietro
    if (o.hurt) { for (let j = 0; j < N_SPIRE.rows.length; j++) stamp(B, { x: N_SPIRE.x - Math.round((N_SPIRE.rows.length - 1 - j) / 6), y: N_SPIRE.y + j, rows: [N_SPIRE.rows[j]] }, hx, hy); }
    else stamp(B, N_SPIRE, hx, hy);
    stamp(B, N_HEAD, hx, hy, o.blink ? { X: '3' } : null);
    stamp(B, N_PAULDRON, bx, by);
    stamp(B, N_FRONTARM, bx + (o.fswing || 0), by);
    return bake(B, NPAL, NOUT);
  }
  regHero('penitent', {
    _i0: penitentFrame(N_IDLE, {}),
    _i1: penitentFrame(N_IDLE, { by: 1, wave: 1 }),
    _bl: penitentFrame(N_IDLE, { blink: 1 }),
    _w0: penitentFrame(N_WALK[0], { wave: 1, swing: 1 }),
    _w1: penitentFrame(N_WALK[1], { by: -1 }),
    _w2: penitentFrame(N_WALK[2], { wave: 1, swing: -1 }),
    _w3: penitentFrame(N_WALK[3], { by: -1 }),
    _hu: penitentFrame(N_IDLE, { by: 1, bx: -1, hurt: 1, blink: 1 }),
  });
  HERO_META.penitent = { hand: [24, 30], head: [16, 3] };
})();

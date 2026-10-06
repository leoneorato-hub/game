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

  const FLAME_A = { x: 9, y: 1, rows: [
    '.....F........',
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
  const FLAME_B = { x: 9, y: 1, rows: [
    '.......F......',
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
  const P_BACKARM = { x: 2, y: 22, rows: [
    '..bb..',
    '..bbc.',
    '.vvv..',
    '.Bbc..',
    '.bbc..',
    'Aag...',
    'gAa...',
    '.gg...',
  ] };
  const P_FRONTARM = { x: 20, y: 17, rows: [
    '.Bb......',
    '.bbc.....',
    '.bbc.....',
    '.bbc.....',
    '..vvv....',
    '..vBbb...',
    '...cBbb..',
    '....cbbc.',
    '.....AAa.',
    '.....aga.',
    '.....sas.',
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

  // gamba a sbuffo generica (per la camminata): 19 righe, fianco → orlo → fasce → stivale
  const P_LEG = [
    '..Aaaas....',
    '.AAaaass...',
    '.Aagaass...',
    '.Aaagass...',
    'AAaaagass..',
    'Aaaaagass..',
    'AAaaaagas..',
    'Aaaaaagass.',
    'AAaaaaagss.',
    'Aaaaaaaggs.',
    'Aaaaaaasgs.',
    'vggggggggv.',
    '.vvvvvvvv..',
    '...rrm.....',
    '...mmm.....',
    '...rrm.....',
    '..Bbbbc....',
    '..Bbbbbbc..',
    '.xbbbbbbbc.',
  ];
  // stampa righe con uno spostamento per riga: fn(j) -> [dx, dy]
  function stampF(B, rows, x, y, fn) {
    for (let j = 0; j < rows.length; j++) { const [dx, dy] = fn(j); stamp(B, { x: x + dx, y: y + j + dy, rows: [rows[j]] }); }
  }
  // L = { x, sh (spostamento del piede), lift (piede alzato), up (corpo sollevato, piede a terra) }
  function stampLeg(B, L) {
    const sh = L.sh || 0, lift = L.lift || 0, up = L.up || 0;
    const fx = j => Math.round(sh * Math.min(j, 12) / 12);
    if (up && !lift) stamp(B, { x: L.x + fx(13), y: 26 + 13 - up, rows: [P_LEG[13]] });
    stampF(B, P_LEG, L.x, 26, j => {
      if (lift && j >= 9) return [fx(j) - (j >= 13 ? 1 : 0), -lift - up];
      return [fx(j), j < 13 ? -up : 0];
    });
  }
  const P_WALK = [
    [{ x: 5, sh: -3 }, { x: 15, sh: 3 }],
    [{ x: 7, lift: 2, up: 1 }, { x: 15, up: 1 }],
    [{ x: 6, sh: 2 }, { x: 15, sh: -2 }],
    [{ x: 7, up: 1 }, { x: 15, lift: 2, up: 1 }],
  ];

  function prisonerFrame(flame, legs, o) {
    const B = buf(PW, PH);
    const by = o.by || 0, bx = o.bx || 0, fy = by + (o.fy || 0);
    stamp(B, P_BACKARM, Math.max(0, bx) + (o.swing || 0), by);
    if (Array.isArray(legs)) { stampLeg(B, legs[0]); stampLeg(B, legs[1]); } else stamp(B, legs);
    stamp(B, P_TORSO, bx, by);
    stamp(B, P_PAULDRON, bx, by);
    stamp(B, P_FRONTARM, bx, by);
    if (flame) {
      const map = o.blink ? { y: 'L', Y: 'L', o: 'L' } : null;
      // nel colpo la fiamma viene "spinta" indietro (in cima più che in basso)
      const tilt = o.hurt ? (j => [-Math.round((14 - j) / 6), j < 3 ? 1 : 0]) : (() => [0, 0]);
      for (let j = 0; j < flame.rows.length; j++) { const [dx, dy] = tilt(j); stamp(B, { x: flame.x + dx, y: flame.y + j + dy, rows: [flame.rows[j]] }, bx, fy, map); }
      if (o.blink) stamp(B, { x: 15, y: 12, rows: ['oyyyo'] }, bx + (o.hurt ? -1 : 0), fy);
      if (o.spark) stamp(B, o.spark, bx, fy);
    } else {
      // collo senza testa: un moncherino che cova una brace
      stamp(B, { x: 12, y: 9, rows: ['....Z.', '...Z..', '....Z.', '...u..', '..EuE.', '.mEEEm', 'mmnnnm'] }, bx, by);
    }
    return bake(B, PPAL, POUT);
  }
  function prisonerSet(flame, spark) {
    const f = (legs, o) => prisonerFrame(flame, legs, Object.assign({ spark }, o));
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
  regHero('prisoner', prisonerSet(FLAME_A, { x: 19, y: 3, rows: ['e'] }));
  regHero('prisoner_f2', prisonerSet(FLAME_B, { x: 11, y: 5, rows: ['e'] }));
  regHero('prisoner_headless', prisonerSet(null));
  const PMETA = { hand: [26, 26], head: [14, 1], glow: '#e8608f' };
  HERO_META.prisoner = PMETA; HERO_META.prisoner_f2 = PMETA;
  HERO_META.prisoner_headless = { hand: [26, 26], head: [15, 12], glow: '#ff9a4a' };

  // l'Omuncolo: solo la testa-fiamma che vola
  {
    const B = buf(16, 18);
    stamp(B, FLAME_A, -8, 1);
    stamp(B, { x: 1, y: 13, rows: ['e....', '.e...'] });
    regSprite('homunculus', bake(B, PPAL, POUT));
  }

  // ===========================================================================
  // IL PENITENTE (Blasphemous) — 30×46 (il capirote lo rende alto)
  // ===========================================================================
  const NW = 30, NH = 46;
  const NPAL = {
    // acciaio verdastro (6 toni) + spine nere
    0: '#121e1e', 1: '#1e3636', 2: '#364e4e', 3: '#5a7272', 4: '#8aa2a2', 5: '#a9c1bd', 6: '#eaf6ea', X: '#0c1414',
    // stoffa viola/vinaccia
    k: '#24121c', p: '#361e2a', m: '#5c2842', M: '#774468', L: '#a3709a',
    // gambe vinaccia
    v: '#8e3a52',
    // cingolo rosso
    R: '#e3242a', r: '#b0141e', d: '#5e0c18',
    // panno chiaro sulla spalla
    C: '#e6dacf', c: '#c3b5aa', w: '#958787', W: '#5e4b4e',
    // cuoio arancio (guanti, piedi) e cintura
    O: '#f2946a', o: '#d26a4a', b: '#8a3a32', n: '#4a2c24',
  };
  const NOUT = { X: null };
  const N_SPIRE = { x: 14, y: 1, rows: [
    '..5....',
    '..42...',
    '..42...',
    '..51...',
    '.X02...',
    '..431..',
    '..531..',
    '..400X.',
    '.4531..',
    'X0032..',
    '.45321.',
    '.443000X',
    '2453321',
  ] };
  const N_HEAD = { x: 11, y: 14, rows: [
    'X10201020X',
    '.11234431.',
    '.11230401.',
    '.11234431.',
    '.01233021.',
    '..012221..',
  ] };
  const N_CLOTH = { x: 2, y: 17, rows: [
    '..........cC.',
    '.......wcCCCc',
    '....WwcCCCCcw',
    '.WwwcCCCcww..',
    'W.WwccCcw....',
    '...Ww.wW.....',
  ] };
  const N_CLOTH2 = { x: 2, y: 17, rows: [
    '..........cC.',
    '.......wcCCCc',
    '..WwwwcCCCCcw',
    'WwwccCCCcww..',
    '..WwcCcw.....',
    '.....W.......',
  ] };
  const N_BODY = { x: 10, y: 19, rows: [
    '...123321...',
    '.2345665432.',
    '234566554321',
    '234555443321',
    '1n123332210n',
    '.n10111100n.',
    '.nn000000nn.',
    'dRRRRRRRRRRd',
    'drrRRdRRrrrd',
    '.dd.RdR.ddd.',
    '....r.R.....',
    '....R.r.....',
    '....d.R.....',
    '....R.d.....',
    '....r.R.....',
  ] };
  const N_PAULDRON = { x: 19, y: 18, rows: [
    '..2344.',
    '.234554',
    '2345653',
    '2345543',
    '.23332.',
    '..111..',
  ] };
  const N_BACKARM = { x: 6, y: 21, rows: [
    '..pmM',
    '..pmM',
    '.pmM.',
    '.p23.',
    '.pmM.',
    'oOOb.',
    'ooO..',
    '.bo..',
  ] };
  const N_FRONTARM = { x: 21, y: 23, rows: [
    'mMMp.',
    'mMMp.',
    '.234.',
    '.mMp.',
    '.mML.',
    '..OOo',
    '..ooO',
    '...bo',
  ] };
  const N_LEG = [
    'LMMMMmp.',
    'LMMMMmp.',
    'LMMMmmp.',
    '.LMMmmp.',
    '.LMMmmp.',
    '.LMMmp..',
    '.LMMmp..',
    '..MMmp..',
    '.34541..',
    '.23431..',
    '.vMmp...',
    '.vMmp...',
    '.vMmp...',
    '.vMmp...',
    '.vmmp...',
    '.23442..',
    '.oOOOOo.',
    '.booooOO',
  ];
  function stampLegN(B, L) {
    const sh = L.sh || 0, lift = L.lift || 0, up = L.up || 0;
    const fx = j => Math.round(sh * Math.min(j, 10) / 10);
    if (up && !lift) stamp(B, { x: L.x + fx(10), y: 27 + 10 - up, rows: [N_LEG[10]] });
    stampF(B, N_LEG, L.x, 27, j => {
      if (lift && j >= 7) return [fx(j) - (j >= 10 ? 1 : 0), -lift - up];
      return [fx(j), j < 10 ? -up : 0];
    });
  }
  const N_IDLE = [{ x: 8, sh: -4 }, { x: 15, sh: 5 }];
  const N_WALK = [
    [{ x: 8, sh: -5 }, { x: 15, sh: 5 }],
    [{ x: 10, sh: -1, lift: 2, up: 1 }, { x: 14, sh: 1, up: 1 }],
    [{ x: 10, sh: 2 }, { x: 13, sh: -2 }],
    [{ x: 10, sh: -1, up: 1 }, { x: 14, sh: 1, lift: 2, up: 1 }],
  ];
  function penitentFrame(legs, o) {
    const B = buf(NW, NH);
    const by = o.by || 0, bx = o.bx || 0;
    stamp(B, N_BACKARM, bx + (o.swing || 0), by);
    stampLegN(B, legs[0]); stampLegN(B, legs[1]);
    stamp(B, N_BODY, bx, by);
    stamp(B, o.wave ? N_CLOTH2 : N_CLOTH, Math.max(0, bx), by);
    stamp(B, N_PAULDRON, bx, by);
    stamp(B, N_FRONTARM, bx, by);
    const hx = bx + (o.hurt ? -1 : 0), hy = by + (o.hurt ? 1 : 0);
    if (o.hurt) { for (let j = 0; j < N_SPIRE.rows.length; j++) stamp(B, { x: N_SPIRE.x - Math.round((13 - j) / 7), y: N_SPIRE.y + j, rows: [N_SPIRE.rows[j]] }, hx, hy); }
    else stamp(B, N_SPIRE, hx, hy);
    stamp(B, N_HEAD, hx, hy, o.blink ? { 0: '1' } : null);
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
  HERO_META.penitent = { hand: [24, 29], head: [16, 1] };
})();

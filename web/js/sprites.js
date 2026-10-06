'use strict';
// =============================================================================
// SPRITES — pixel-art definita come griglie di caratteri.
// Ogni sprite riceve in automatico il contorno d'inchiostro di 1 px (#1a1220):
// è la "Regola della Cucitura" del GDD (§2.2) che amalgama gli stili.
// =============================================================================

const INK = '#1a1220';
const SPR = {};

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function rasterize(rows, pal, outline = true) {
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const o = outline ? 1 : 0;
  const c = makeCanvas(w + o * 2, h + o * 2);
  const x = c.getContext('2d');
  const solid = [];
  for (let y = 0; y < h; y++) {
    for (let i = 0; i < rows[y].length; i++) {
      const ch = rows[y][i];
      if (ch === '.' || ch === ' ') continue;
      const col = pal[ch];
      if (!col) continue;
      solid.push([i + o, y + o, col]);
    }
  }
  if (outline) {
    x.fillStyle = INK;
    for (const [px, py] of solid) x.fillRect(px - 1, py - 1, 3, 3);
  }
  for (const [px, py, col] of solid) { x.fillStyle = col; x.fillRect(px, py, 1, 1); }
  return c;
}

function tinted(src, color) {
  const c = makeCanvas(src.width, src.height);
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

function flipped(src) {
  const c = makeCanvas(src.width, src.height);
  const x = c.getContext('2d');
  x.translate(src.width, 0); x.scale(-1, 1);
  x.drawImage(src, 0, 0);
  return c;
}

function defSprite(name, rows, pal, outline = true) {
  const img = rasterize(rows, pal, outline);
  const white = tinted(img, '#ffffff');
  SPR[name] = { img, white, flip: flipped(img), flipWhite: flipped(white), w: img.width, h: img.height };
  return SPR[name];
}

// --- PERSONAGGI ---------------------------------------------------------------

defSprite('knight', [
  'w........w',
  'w........w',
  'ww......ww',
  '.wwwwwwww.',
  'wwwwwwwwww',
  'wwddwwddww',
  'wwddwwddww',
  'wwddwwddww',
  '.wwwwwwww.',
  '..gggggg..',
  '.gggggggg.',
  'gggggggggg',
  'gggggggggg',
  '.ggdd.ddg.',
], { w: '#f2efe6', d: '#0b0910', g: '#6b7085' });

defSprite('v1', [
  '...ssss...',
  '..ssyyss..',
  '..ssssss..',
  '...ssss...',
  'yy.bbbb.yy',
  'yybbbbbbyy',
  '.ycbbbbbsy',
  '..cbbbbbs.',
  '..c.bb..s.',
  '...bbbb...',
  '...b..b...',
  '...s..s...',
  '..ss..ss..',
], { s: '#9aa4b8', y: '#ffd23f', b: '#3d6fd6', c: '#7ec8ff' });

defSprite('zagreus', [
  '.lhhhhhl..',
  '.hhhhhhh..',
  '.hsssssh..',
  '.hsRsGsh..',
  '..sssss...',
  '..rssssr..',
  '.rrraaarr.',
  'rrrrsrrrrr',
  'srrrsrrrrs',
  '..rrrrrr..',
  '..ss..ss..',
  '..ss..ss..',
  '.ff...ff..',
  'f.f..f.f..',
], { l: '#2e3a22', h: '#141014', s: '#e0b48a', R: '#e0303a', G: '#3fd46a', r: '#b3262f', a: '#d9a83a', f: '#ff8a2a' });

const MADELINE_ROWS = [
  '..RRRRR...',
  '.RRRRRRR..',
  'RRssssRR..',
  'RRsdsdsR..',
  'R.sssss...',
  'R..sss....',
  '..jjjjj...',
  '.jjjjjjj..',
  '.sjjjjjs..',
  '..jjjjj...',
  '..pp.pp...',
  '..pp.pp...',
  '..bb.bb...',
];
const MADELINE_PAL = { s: '#f0c8a0', d: '#2a1a1a', j: '#5d4a9c', p: '#3a3550', b: '#5a3a2a' };
defSprite('madeline', MADELINE_ROWS, { ...MADELINE_PAL, R: '#d1343a' });
defSprite('madeline_blue', MADELINE_ROWS, { ...MADELINE_PAL, R: '#5fb3ff' });
defSprite('madeline_pink', MADELINE_ROWS, { ...MADELINE_PAL, R: '#ff7ad9' });
defSprite('badeline', MADELINE_ROWS, { s: '#c9a6d9', d: '#e0303a', j: '#2a1838', p: '#1f1428', b: '#1f1428', R: '#7a3aa0' });

const PRISONER_BODY = [
  '...nn.....',
  '.mmmmmm...',
  'mmmmmmmm..',
  'smmmommms.',
  '.mmmmmm...',
  '.nn..nn...',
  '.nn..nn...',
  '.oo..oo...',
];
const PRISONER_PAL = { c: '#57d6c8', C: '#e8fff9', m: '#4f6136', n: '#2f3a22', o: '#6b4a2a', s: '#b9a17a' };
defSprite('prisoner', [
  '...c.c....',
  '..cccc.c..',
  '.ccCCcc...',
  '.cCCCCc...',
  '..cccc....',
  ...PRISONER_BODY,
], PRISONER_PAL);
defSprite('prisoner_headless', ['..........', '..........', '..........', '..........', '..........', ...PRISONER_BODY], PRISONER_PAL);
defSprite('homunculus', ['.c.c.', 'ccccc', 'cCCCc', 'cCCCc', '.ccc.'], PRISONER_PAL);

defSprite('penitent', [
  '....m.....',
  '....m.....',
  '...mmm....',
  '..tmmmt...',
  '...mmm....',
  '..mmmmm...',
  '.tmdmdmt..',
  '..mmmmm...',
  '.rrrrrrr..',
  'rrrraarrr.',
  'rrrrarrrr.',
  '.rrrrrrr..',
  '.rr...rr..',
  '.dd...dd..',
], { m: '#b8b8c8', t: '#5a3d22', d: '#14101a', r: '#5a1e24', a: '#c9a43a' });

defSprite('terrarian', [
  '..hhhhh...',
  '.hhhhhhh..',
  '.hsssssh..',
  '.hsdssd...',
  '..sssss...',
  '...sss....',
  '..ggggg...',
  '.ggggggg..',
  '.sggggggs.',
  '..ggggg...',
  '..ppppp...',
  '..pp.pp...',
  '..dd.dd...',
], { h: '#6b3a1f', s: '#e8b98f', d: '#2a1a12', g: '#3b8a3b', p: '#2c4a8a' });

defSprite('isaac', [
  '..ssssss..',
  '.ssssssss.',
  'ssssssssss',
  'sseesseess',
  'sseesseess',
  'sstsssstss',
  'ssssmmssss',
  '.ssssssss.',
  '..ssssss..',
  '...ssss...',
  '..ssssss..',
  '..s.ss.s..',
  '...s..s...',
], { s: '#f2cdbd', e: '#14101a', t: '#7fb8ff', m: '#8a2a3a' });

// Accessori di Isaac: gli oggetti cambiano il suo aspetto, come nell'originale.
defSprite('acc_horns', ['r......r', 'rr....rr'], { r: '#b3262f' }, false);
defSprite('acc_eye3', ['.ee.', 'eppe', '.ee.'], { e: '#f2cdbd', p: '#c33' }, false);
defSprite('acc_ears', ['g......g', 'gg....gg'], { g: '#3a3a3a' }, false);
defSprite('acc_cry', ['t......t', 't......t'], { t: '#7fb8ff' }, false);

// --- NEMICI --------------------------------------------------------------------

defSprite('moth', ['ww...ww', 'wwwkwww', '.wwkww.', '..www..', '.w.w.w.'], { w: '#cfc6b8', k: '#5a4a3a' });
defSprite('doll', ['..bbb..', '.bxbxb.', '.bbbbb.', '..rrr..', 'rrrrrrr', '.rrrrr.', '.r...r.'], { b: '#e8c9a0', x: '#3a2a3a', r: '#b0413e' });
defSprite('doll_small', ['.bb.', 'bxxb', '.rr.', 'rrrr', 'r..r'], { b: '#e8c9a0', x: '#3a2a3a', r: '#b0413e' });
defSprite('pin', ['.hh.', 'hhhh', '.hh.', '..s.', '..s.', '..s.', '..s.'], { h: '#d6453d', s: '#c9ced8' });
defSprite('darner', [
  '....pppp....',
  '...pppppp...',
  '...pxppxp...',
  '...pppppp...',
  's...pppp...s',
  's.cccccccc.s',
  'sccccccccccs',
  's.cccccccc.s',
  's.cccccccc.s',
  '..cccccccc..',
  '..cc....cc..',
  '..cc....cc..',
  '.ccc....ccc.',
], { p: '#e8e0d0', x: '#3a1a2a', c: '#6a4c7a', s: '#c9ced8' });
defSprite('chimera', [
  '.bbb..hh.ww',
  'bxbxbhhhhww',
  '.bbbrr.hh.w',
  'rrrrrrrsssw',
  'rrrrrrrrrr.',
  '.rr.rrr.rr.',
  '.r...r...r.',
], { b: '#e8c9a0', x: '#3a2a3a', r: '#8a3a5e', h: '#d6453d', s: '#c9ced8', w: '#cfc6b8' });

defSprite('commuter', ['..hhh..', '..fff..', '..dfd..', '.ccccc.', 'cccccccb', 'ccccccbb', '.ccccc..', '.c...c..', '.d...d..'],
  { h: '#2a2a2a', f: '#b9c2c0', d: '#3a4450', c: '#4f5d6e', b: '#7a5530' });
defSprite('ticket', ['tttttt', 'txtxtt', 'tttttt'], { t: '#f0e6b0', x: '#c0392b' });
defSprite('inspector', ['..qqq...', '.qqqqq..', '..fff...', '..fdf...', '.qqqqq..', 'qqqqqqqS', 'qqqqqqqS', '.qqqqq.S', '.q...q..'],
  { q: '#22305a', f: '#b9c2c0', d: '#3a4450', S: '#f2c230' });
defSprite('suitcase', ['..hhh....', '.bbbbbbb.', 'bbbbbbbbb', 'bwbwbwbwb', 'bbbbbbbbb'], { h: '#3a2a1a', b: '#7a5530', w: '#f2efe6' });
defSprite('driver', [
  '..nnnnnn..',
  '.nnnnnnnn.',
  'aaaaaaaaaa',
  '..gggggg..',
  '..gyggyg..',
  '..gggggg..',
  '.nnnnnnnn.',
  'nnnnaannnn',
  'nnnnnnnnnn',
  'nnnnnnnnnn',
  '.nnnnnnnn.',
  '..gg..gg..',
], { n: '#1d2a4a', a: '#d9a83a', g: '#a9e0c4', y: '#f2ff7a' });

defSprite('chorister', ['..hhh..', '.hhhhh.', '.hfffh.', '.hdfdh.', '.hfffh.', 'hhhhhhh', 'hhhhhhh', 'hhhhhhh', '.hhhhh.'], { h: '#4a3b5c', f: '#d9c8b0', d: '#2a1a1a' });
defSprite('ringer', ['....hh..', '..hhhhh.', '.hhhhfh.', 'hhhhhff.', 'hhhhhhh.', '.hhhhhh.', '.h...h..', 'hh...hh.'], { h: '#6b4e2e', f: '#d9b890' });
defSprite('candle', ['..y..', '.yoy.', '..d..', '.www.', '.www.', '.www.', '.www.', 'wwwww'], { y: '#ffd23f', o: '#ff7a2a', d: '#3a2a1a', w: '#efe6d2' });
defSprite('clapper', ['.bbb.', 'bbbbb', 'bbbbb', 'bbbbb', '.bbb.'], { b: '#8c6a2f' });
defSprite('abbess', [
  '...bbbb...',
  '..bbbbbb..',
  '.bbffffbb.',
  '.bbfddfbb.',
  '.bbffffbb.',
  'bbbbbbbbbb',
  'bbbbwwbbbb',
  'bbbbwwbbbb',
  'bbbbbbbbbb',
  '.bbbbbbbb.',
  'bbbbbbbbbb',
], { b: '#8c6a2f', f: '#e6d6c0', d: '#2a1a1a', w: '#efe6d2' });

// --- XP (Risonanza Visiva, GDD §2.4) ------------------------------------------

const GEM_SHAPES = {
  geo: { s: ['.w.', 'wcw', '.w.'], b: ['.ww.', 'wccw', 'wccw', '.ww.'], pal: { w: '#e8ecf2', c: '#9aa6b8' } },
  blood: { s: ['.r.', 'rrr', '.r.'], b: ['.r.', 'rrr', 'rRr', '.r.'], pal: { r: '#c41e2a', R: '#ff6670' } },
  darkness: { s: ['.p.', 'pPp', '.p.'], b: ['..p..', '.pPp.', 'pPPPp', '.pPp.', '..p..'], pal: { p: '#7a3aa0', P: '#d08aff' } },
  crystal: { s: ['.c.', 'cCc', '.c.'], b: ['.cc.', 'cCCc', 'cCCc', '.cc.'], pal: { c: '#4aa0ff', C: '#ffc0f0' } },
  cell: { s: ['.b.', 'bBb', '.b.'], b: ['.bb.', 'bBBb', 'bBbb', '.bb.'], pal: { b: '#3a6fe0', B: '#9ad0ff' } },
  tear: { s: ['.y.', 'yYy', '.y.'], b: ['.y.', 'yyy', 'yYy', '.y.'], pal: { y: '#d9b23a', Y: '#fff2b0' } },
  coin: { s: ['ccc', 'cCc', 'ccc'], b: ['.ss.', 'sSSs', 'sSSs', '.ss.'], pal: { c: '#c87533', C: '#f2b27a', s: '#c9ced8', S: '#ffffff' } },
  penny: { s: ['yyy', 'yYy', 'yyy'], b: ['.yy.', 'yYYy', 'yYYy', '.yy.'], pal: { y: '#d9a83a', Y: '#fff2b0' } },
};
for (const [k, g] of Object.entries(GEM_SHAPES)) {
  defSprite('gem_' + k, g.s, g.pal);
  defSprite('gemb_' + k, g.b, g.pal);
}

// --- PICKUP --------------------------------------------------------------------

defSprite('food', ['..w..', '.wpw.', 'wwwww', 'yyyyy', 'yyyyy'], { w: '#f2efe6', p: '#e0303a', y: '#d9a86a' });
defSprite('heart', ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'], { r: '#e0303a' });
defSprite('yarn', ['.rrr.', 'rwrrr', 'rrwrr', 'rrrwr', '.rrr.'], { r: '#c94a6a', w: '#f2a0b8' });
defSprite('chest', ['.aaaaaaa.', 'abbbbbbba', 'aaaaaaaaa', 'abbbybbba', 'abbbbbbba', 'aaaaaaaaa'], { a: '#d9a83a', b: '#8e2b3a', y: '#fff2b0' });
defSprite('strawberry', ['..g..', '.ggg.', 'rrrrr', 'ryrrr', 'rrryr', '.rrr.', '..r..'], { g: '#3fbf5a', r: '#e0303a', y: '#ffe07a' });
defSprite('pill', ['.aab.', 'aaabb', '.aab.'], { a: '#f2efe6', b: '#5fb3ff' });
defSprite('priedieu', ['a....', 'a....', 'aaaaa', 'abbba', 'a...a'], { a: '#8c6a2f', b: '#8e2b3a' });
defSprite('dashcrystal', ['.g.', 'gGg', 'gGg', '.g.'], { g: '#3fd46a', G: '#c8ffd0' });
defSprite('guilt', ['.p.', 'ppp', 'pPp', '.p.'], { p: '#5a1e5a', P: '#ff6aa0' });
defSprite('spool', ['aaaaa', '.rrr.', '.rrr.', '.rrr.', 'aaaaa'], { a: '#8c6a2f', r: '#e2b04a' });
defSprite('bee', ['.ww', 'yky', '.k.'], { w: '#e8f4ff', y: '#ffd23f', k: '#2a1a12' });
defSprite('fly', ['w.w', '.b.', '...'], { w: '#cfe6ff', b: '#3a6fe0' });
defSprite('kevin', ['bbbbbb', 'bkbbkb', 'bbbbbb', 'brrrrb', 'bbbbbb'], { b: '#6a6aa0', k: '#14101a', r: '#e0303a' });
defSprite('weaverling', ['w.w', 'www', 'k.k'], { w: '#f2efe6', k: '#0b0910' });
defSprite('turret', ['..aa..', '.aaaa.', 'bbbbbb', '.b..b.'], { a: '#8a5ad0', b: '#5a3a2a' });
defSprite('coin_v1', ['.yy.', 'yYYy', '.yy.'], { y: '#f2c230', Y: '#fff2b0' });

// --- ICONE (template ricolorabili, 8×8 + contorno) -----------------------------

const ICON_T = {
  sword: ['.......w', '......wa', '.....wa.', '....wa..', 'b..wa...', '.bwa....', '..b.....', '.b.b....'],
  orb: ['..aaaa..', '.awwaaa.', 'aawaaaaa', 'aaaaaaaa', 'aaaaaaba', 'aaaaabba', '.aaabba.', '..aaaa..'],
  bolt: ['....aa..', '...aa...', '..aa....', '.aaaaaa.', '....aa..', '...aa...', '..aa....', '.a......'],
  star: ['...a....', '...a....', 'aaaaaaa.', '.aawaa..', '..aaa...', '.aa.aa..', '.a...a..'],
  shield: ['aaaaaaaa', 'abbbbbba', 'abwbbbba', 'abbbbbba', 'abbbbbba', '.abbbba.', '..abba..', '...aa...'],
  bow: ['..aa...b', '.a....b.', 'a....b..', 'a...b...', 'a..b....', 'a.b.....', '.ab.....', '..aa....'],
  gun: ['aaaaaaa.', 'aawaaaab', 'aaaaaaa.', '..aab...', '..ab....', '..ab....'],
  heart: ['.aa..aa.', 'awaaaaaa', 'aaaaaaaa', 'aaaaaaaa', '.aaaaaa.', '..aaaa..', '...aa...'],
  scroll: ['.aaaaaa.', 'abbbbbba', '.abbbba.', '.awbbba.', '.abbbba.', '.abbbba.', 'abbbbbba', '.aaaaaa.'],
  crystal: ['...a....', '..aaa...', '.aawaa..', 'aawaaaa.', '.aaaaa..', '..aaa...', '...a....'],
  wave: ['..aa....', '.a..a..a', 'a....aa.', '..bb....', '.b..b..b', 'b....bb.'],
  ring: ['..aaaa..', '.a....a.', 'a......a', 'a..bb..a', 'a..bb..a', 'a......a', '.a....a.', '..aaaa..'],
  feather: ['......a.', '.....aa.', '....aaa.', '...aaw..', '..aaa...', '.aaa....', 'aa......', 'b.......'],
  clock: ['.aaaaaa.', 'a.wwww.a', 'a.bbbb.a', '.a.bb.a.', '.a.bb.a.', 'a.bbbb.a', 'a.bbbb.a', '.aaaaaa.'],
  magnet: ['aa....aa', 'aa....aa', 'aa....aa', 'aa....aa', 'aa....aa', '.aa..aa.', '..aaaa..'],
  coin: ['..aaaa..', '.awwaaa.', 'awaabaaa', 'aaabbaaa', 'aaabaaaa', 'aaaaaaaa', '.aaaaaa.', '..aaaa..'],
  eye: ['..aaaa..', '.awwwwa.', 'awwbbwwa', 'awwbbwwa', '.awwwwa.', '..aaaa..'],
  fly: ['aa....aa', 'aaa..aaa', '.aabbaa.', '..bbbb..', '..bbbb..', '.b.bb.b.'],
  skull: ['.aaaaaa.', 'aaaaaaaa', 'abbaabba', 'abbaabba', 'aaaaaaaa', '.aaaaaa.', '.a.aa.a.'],
  bead: ['...a....', '..a.a...', '.a...a..', 'a.....a.', '.a...a..', '..a.a...', '...b....', '..bbb...'],
  pill: ['..aabb..', '.aaabbb.', '.aaabbb.', '..aabb..'],
  ghost: ['..aaaa..', '.aaaaaa.', 'aabaabaa', 'aaaaaaaa', 'aaaaaaaa', 'aaaaaaaa', 'a.aa.aa.'],
  flame: ['...a....', '..aa..a.', '..aaa.a.', '.aabaaa.', '.abbbaa.', 'aabwbbaa', 'aabbbbaa', '.aaaaaa.'],
  block: ['aaaaaaaa', 'abbbbbba', 'abwbbwba', 'abbbbbba', 'ababbaba', 'abaaaaba', 'abbbbbba', 'aaaaaaaa'],
  camera: ['.aa.....', 'aaaaaaaa', 'abbwwbba', 'abwbbwba', 'abbwwbba', 'aaaaaaaa'],
  boomerang: ['aaaaa...', 'aa.aaa..', 'a...aa..', '....aa..', '....aa..', '...aa...'],
  flask: ['..aa....', '..bb....', '.aaaa...', 'abbbba..', 'abwbba..', 'abbbba..', '.aaaa...'],
  laser: ['a.......', 'aa......', '.aa.....', '..aab...', '...abb..', '....abb.', '.....abb', '......ab'],
  knife: ['......aa', '.....awa', '....awa.', '...awa..', '..bwa...', '.bb.....', 'bb......'],
  bee: ['.ww..ww.', '.wwwwww.', 'aabbaabb', 'aabbaabb', '.abbaab.'],
  dna: ['a....b..', '.a..b...', '..ab....', '..ba....', '.b..a...', 'b....a..', '.b..a...', '..ab....'],
};
const ICON_CACHE = {};
function icon(tpl, a, b = '#14101a') {
  const key = tpl + a + b;
  if (!ICON_CACHE[key]) ICON_CACHE[key] = rasterize(ICON_T[tpl] || ICON_T.orb, { a, b, w: '#ffffff' });
  return ICON_CACHE[key];
}
function iconURL(tpl, a, b, scale = 4) {
  const src = icon(tpl, a, b);
  const c = makeCanvas(src.width * scale, src.height * scale);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL();
}
function spriteURL(name, scale = 4) {
  const src = SPR[name].img;
  const c = makeCanvas(src.width * scale, src.height * scale);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL();
}

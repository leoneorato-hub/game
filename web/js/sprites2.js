'use strict';
// =============================================================================
// SPRITES v2 (Alfa 2) — eroi più grandi e ombreggiati, con ciclo di camminata
// (idle / passo A / passo B); nemici, mini-boss e oggetti di scena dei mondi.
// Sovrascrive gli sprite della v1 con lo stesso nome.
// =============================================================================

function defChar(name, top, legs, pal) {
  defSprite(name, [...top, ...legs[0]], pal);
  defSprite(name + '_w1', [...top, ...legs[1]], pal);
  defSprite(name + '_w2', [...top, ...legs[2]], pal);
}

// --- IL CAVALIERE --------------------------------------------------------------
defChar('knight', [
  '.w..........w.',
  '.ww........ww.',
  '..ww......ww..',
  '..wwwwwwwwww..',
  '.wwwwwwwwwwwW.',
  '.wwwwwwwwwwwW.',
  '.wwddwwwwddwW.',
  '.wwdddwwdddwW.',
  '.wwdddwwdddwW.',
  '.wwwddwwwddwW.',
  '..wwwwwwwwWW..',
  '...WWWWWWWW...',
  '..hggggggggG..',
  '.hgggggggggGG.',
  '.hggggggggggG.',
  'hgggggggggggGG',
  '.ggggggggggGG.',
], [
  ['...Gdd..ddG...', '....dd..dd....', '....dd..dd....'],
  ['..Gd....ddG...', '...dd....dd...', '..dd.....dd...'],
  ['...Gdd....dG..', '....dd....dd..', '....dd.....dd.'],
], { w: '#f4f1e8', W: '#c9c4b8', d: '#0b0910', g: '#6b7085', G: '#4a4e63', h: '#8a90a6' });

// --- V1 --------------------------------------------------------------------------
defChar('v1', [
  '....ssss......',
  '...sSSSSs.....',
  '...sSyyys.....',
  '...sSSSSs.....',
  '....sKKs......',
  '.y.bbbbbbb.y..',
  'yybBbbbbbbBby.',
  'yycBbbbbbbBsyy',
  '.ycbbbsbbbbs..',
  '..ccbbsbbbbs..',
  '..c.bbbbbb.s..',
  '....bKKKKb....',
  '....bb..bb....',
], [
  ['....ss..ss....', '....ss..ss....', '...sss..sss...'],
  ['...ss....ss...', '..ss......ss..', '.sss......ss..'],
  ['....ss.ss.....', '....ss.ss.....', '...sss.sss....'],
], { s: '#a6b0c4', S: '#7a8499', y: '#ffd23f', b: '#3d6fd6', B: '#2a4ea8', c: '#7ec8ff', K: '#2a2f3a' });

// --- ZAGREUS -------------------------------------------------------------------
defChar('zagreus', [
  '...LhLhLh.....',
  '..LhhhhhhL....',
  '..hhhhhhhh....',
  '..hsssssSh....',
  '..hsRssGSh....',
  '...ssssSS.....',
  '....sSSS......',
  '..rrsssssr....',
  '.rrrssssrrr...',
  'rrrraaaarrrr..',
  'srrrrrrrrrrs..',
  's.rrrrrrrrr.s.',
  '..rrqrrqrr....',
], [
  ['...ss..ss.....', '..ff....ff....', '..fF....fF....'],
  ['..ss....ss....', '.ff......ff...', '.fF......fF...'],
  ['...ss.ss......', '..ff..ff......', '..fF..fF......'],
], { L: '#3c4a2a', h: '#161018', s: '#d9a77c', S: '#b07f5a', R: '#ff3030', G: '#38e06a', r: '#b3262f', q: '#7e1820', a: '#d9a83a', f: '#ff8a2a', F: '#ffd23f' });

// --- MADELINE (i capelli lunghi sono disegnati a parte, come in Celeste) ---------
const MAD_TOP = [
  '...RRRRR......',
  '..RRRRRRR.....',
  '.RRrsssRRR....',
  '.RRsdsdsRR....',
  '.RRssfssR.....',
  '..R.sss.......',
  '...jjjjj......',
  '..jjJjjjj.....',
  '.sjjJjjjjs....',
  '..jjjjjjj.....',
  '..pppppp......',
];
const MAD_LEGS = [
  ['..pp..pp......', '..pp..pp......', '..bb..bbb.....'],
  ['.pp....pp.....', '.pp.....pp....', '.bb.....bbb...'],
  ['..pp.pp.......', '..pp.pp.......', '..bb.bbb......'],
];
const MAD_PAL = { s: '#f0c8a0', d: '#2a1a1a', f: '#d98a6a', j: '#5d4a9c', J: '#46357a', p: '#2f3050', b: '#5a3a2a' };
defChar('madeline', MAD_TOP, MAD_LEGS, { ...MAD_PAL, R: '#d1343a', r: '#a8222a' });
defChar('madeline_blue', MAD_TOP, MAD_LEGS, { ...MAD_PAL, R: '#5fb3ff', r: '#3a86d0' });
defChar('madeline_pink', MAD_TOP, MAD_LEGS, { ...MAD_PAL, R: '#ff7ad9', r: '#d04aaa' });
defChar('badeline', MAD_TOP, MAD_LEGS, { s: '#c9a6d9', d: '#ff3050', f: '#a87ab8', j: '#2a1838', J: '#1a1024', p: '#1f1428', b: '#1f1428', R: '#7a3aa0', r: '#5a2a80' });

// --- IL PRIGIONIERO (due fotogrammi per la fiamma) --------------------------------
const PRIS_BODY = [
  '....nn........',
  '..mmmmmmM.....',
  '.mmmmmmmmM....',
  'smmmoommmMs...',
  '.mmmmmmmmM....',
  '..mmmmmmM.....',
];
const PRIS_LEGS = [
  ['..nn..nn......', '..nn..nn......', '.oo...oo......'],
  ['.nn....nn.....', '.nn.....nn....', 'oo......oo....'],
  ['..nn.nn.......', '..nn.nn.......', '.oo..oo.......'],
];
const PRIS_PAL = { c: '#3fc8b8', C: '#8af0e0', W: '#f0fffb', n: '#2f3a22', m: '#4f6136', M: '#3a4a26', o: '#6b4a2a', s: '#b9a17a' };
defChar('prisoner', ['....c..c......', '...cc.cc.c....', '..ccCCcc......', '..cCWWCc......', '..cCWWCc......', '...cCCc.......', ...PRIS_BODY], PRIS_LEGS, PRIS_PAL);
defChar('prisoner_f2', ['...c...c......', '..cc.cc.......', '..cCCCcc.c....', '..cCWWCc......', '..cCWWCc......', '...cCCc.......', ...PRIS_BODY], PRIS_LEGS, PRIS_PAL);
defChar('prisoner_headless', ['..............', '..............', '..............', '..............', '..............', '..............', ...PRIS_BODY], PRIS_LEGS, PRIS_PAL);
defSprite('homunculus', ['.c.c.', 'ccccc', 'cCWCc', 'cCWCc', '.ccc.'], PRIS_PAL);

// --- IL PENITENTE -------------------------------------------------------------------
defChar('penitent', [
  '.....m........',
  '.....mM.......',
  '....mmM.......',
  '....mmmM......',
  '...tmmmMt.....',
  '..t.mmmM.t....',
  '...mmmmmM.....',
  '...mdmdmM.....',
  '...mmmmmM.....',
  '..rrrrrrrr....',
  '.rrrraarrrR...',
  'rrrrrarrrrRR..',
  'rrrrrrrrrrRR..',
  '.rrrrrrrrRR...',
], [
  ['..dd...dd.....', '..dd...dd.....', '.ddd...ddd....'],
  ['.dd.....dd....', '.dd......dd...', 'ddd......ddd..'],
  ['..dd..dd......', '..dd..dd......', '.ddd.ddd......'],
], { m: '#c4c4d4', M: '#8a8a9c', t: '#5a3d22', d: '#14101a', r: '#5a1e24', R: '#3e1218', a: '#d9b43a' });

// --- IL TERRARIANO -------------------------------------------------------------------
defChar('terrarian', [
  '..hhhhhh......',
  '.hhhhhhhh.....',
  '.hhssssshh....',
  '.hsdsssdsh....',
  '.hsssssss.....',
  '..sssSss......',
  '...ssss.......',
  '..gggggg......',
  '.gggGGggg.....',
  '.sgggggggs....',
  '..ggggggg.....',
  '..bbbbbbb.....',
  '..ppppppp.....',
], [
  ['..pp..pp......', '..pp..pp......', '..dd..dd......'],
  ['.pp....pp.....', '.pp.....pp....', '.dd.....dd....'],
  ['..pp.pp.......', '..pp.pp.......', '..dd.dd.......'],
], { h: '#6b3a1f', s: '#e8b98f', S: '#c99a70', d: '#2a1a12', g: '#3b8a3b', G: '#2a6a2a', b: '#5a3a1a', p: '#2c4a8a' });

// --- ISAAC ------------------------------------------------------------------------------
defChar('isaac', [
  '...ssssss.....',
  '..ssssssss....',
  '.ssssssssss...',
  '.ssssssssssS..',
  'sseeesseeesS..',
  'sseWesseWesS..',
  'sseeesseeesS..',
  'sstsssssstsS..',
  '.sssmmmmssS...',
  '..ssSSSSSS....',
  '...ssssss.....',
  '..ssssssss....',
  '.s.ssssss.s...',
], [
  ['...ss..ss.....', '...ss..ss.....', '..sss..sss....'],
  ['..ss....ss....', '..ss.....ss...', '.sss.....ss...'],
  ['...ss.ss......', '...ss.ss......', '..sss.sss.....'],
], { s: '#f2cdbd', S: '#d4a898', e: '#14101a', W: '#ffffff', t: '#7fb8ff', m: '#8a2a3a' });

// --- SOR DITALE (mercante della Merceria) ------------------------------------------------
defSprite('ditale', [
  '...aaaaaa...',
  '..aAAAAAAa..',
  '..aAaAaAAa..',
  '..aAAAAAAa..',
  '..aaaaaaaa..',
  '...ssssss...',
  '...sksskS...',
  '...ssmmsS...',
  '..rrrrrrrr..',
  '.rrRrrrrRrr.',
  'srrRrrrrRrrs',
  '..rrrrrrrr..',
  '..pp....pp..',
], { a: '#c9ced8', A: '#9aa0b4', s: '#e8c8a8', S: '#c9a080', k: '#1a1220', m: '#8a4a3a', r: '#8e2b3a', R: '#e2b04a', p: '#2a1f2e' });

// =============================================================================
// NEMICI DEI MONDI
// =============================================================================
// Hallownest
defSprite('husk', ['...wwwww...', '..wwwwwww..', '.wwoowwoow.', '.wwoowwoow.', '..wwwwwww..', '...bbbbb...', '..bbbbbbb..', '.bbbBbbbbb.', '.bbbBbbbbb.', '..bbbbbbb..', '..b.b.b.b..'],
  { w: '#d8d2c4', o: '#ff9a2a', b: '#5a5468', B: '#48425a' });
defSprite('vengefly', ['w..........w', 'ww........ww', '.www.kk.www.', '..wwkkkkww..', '...kkookk...', '...kkkkkk...', '....kkkk....', '.....kk.....'],
  { w: '#cfd8e8', k: '#3a3348', o: '#ff9a2a' });
defSprite('aspid', ['..rrrr..', '.rrRRrr.', 'rrRooRrr', 'rrRRRRrr', '.rrrrrr.', '..r..r..'], { r: '#b3522a', R: '#d9733a', o: '#ffd23f' });
defSprite('falseknight', [
  '......aaaaaa........',
  '.....aAAAAAAa.......',
  '....aAAddddAAa......',
  '....aAdooodAAa..mm..',
  '....aAAddddAAa.mMMm.',
  '.....aaaaaaaa..mMMm.',
  '...pppppppppp...mm..',
  '..pPPPPPPPPPPp..s...',
  '.pPPPPPPPPPPPPp.s...',
  '.pPPPPPPPPPPPPpss...',
  '.pPPPPPPPPPPPPp.....',
  '..pPPPPPPPPPPp......',
  '...pppppppppp.......',
  '...gg......gg.......',
  '..ggg......ggg......',
], { a: '#8a8f9c', A: '#b8bec9', d: '#1a1620', o: '#ff9a2a', p: '#6a6e7c', P: '#8a8f9c', m: '#6b7085', M: '#9aa0b4', s: '#5a4a3a', g: '#4a4e5a' });

// Inferno (ULTRAKILL)
defSprite('filth', ['..fff...', '.fFFFf..', '.fkkFf..', '.fFFFf..', 'ffffffff', '.ffffff.', '.f.ff.f.', '.f....f.'], { f: '#b48a7a', F: '#d0a898', k: '#3a1a1a' });
defSprite('stray', ['...hhh...', '..hhhhh..', '..hyhyh..', '..hhhhh..', '.hhhhhhh.', 'hh.hhh.hh', '...hhh...', '...h.h...', '..hh.hh..'], { h: '#4a3a3a', y: '#ff4a2a' });
defSprite('maurice', ['..ssssss..', '.ssSSSSss.', 'sSSkSSkSSs', 'sSSrSSrSSs', 'sSSSSSSSSs', 'sSkkkkkkSs', '.sSkrrkSs.', '..ssssss..'], { s: '#6a6a70', S: '#8a8a92', k: '#1a1418', r: '#ff3a2a' });
defSprite('swordsmachine', [
  '....ssss........',
  '...sSSSSs.......',
  '...sSyySs.......',
  '....ssss........',
  '..rrrrrrrr......',
  '.rRRRRRRRRr..ccc',
  'rRRRRsRRRRRrcCc.',
  'rRRRRsRRRRRrCc..',
  '.rRRRRRRRRrcc...',
  '..rrrrrrrr.c....',
  '...ss..ss.......',
  '...ss..ss.......',
  '..sss..sss......',
], { s: '#9aa0b4', S: '#c9ced8', y: '#ffd23f', r: '#7e1820', R: '#b3262f', c: '#c9ced8', C: '#ffd23f' });

// Tartaro (Hades)
defSprite('wretch', ['...ggg...', '..gGGGg..', '..gyGyg..', '..gGGGg..', '.ggggggg.', 'gggGGGggg', 'g.gGGGg.c', '..ggggg.c', '..g...g.c', '.gg...gg.'], { g: '#3a6a4a', G: '#5a8a5a', y: '#e0ff6a', c: '#6b4a2a' });
defSprite('numbskull', ['.gg.gg.', 'gwwwwwg', 'wwkwkww', 'wwwwwww', '.wkkkw.', '..www..'], { g: '#6aff9a', w: '#e8e4d8', k: '#1a1418' });
defSprite('witch', ['...pp....', '..ppp....', '.ppppp...', '..pyp....', '.ppppp...', 'ppPPPpp..', 'ppPPPppo.', '.pPPPp...', 'ppppppp..'], { p: '#4a2a5a', P: '#6a3a7a', y: '#ff7ad9', o: '#7aff9a' });
defSprite('megaera', [
  '..w.wwww.w........',
  '...wwwwwww........',
  '...wsssssw........',
  '...wsRssRw........',
  'rr..sssss..rr.....',
  'rrr.kkkkk.rrr.....',
  'rrrrkkkkkrrrr.....',
  '.rrkkkakkkrr..ll..',
  '..skkkkkkks..l..l.',
  '...kkkkkkk..l.....',
  '...kk...kk.l......',
  '...kk...kk........',
  '..kkk...kkk.......',
], { w: '#e8e4f0', s: '#9a7aaa', R: '#ff3050', r: '#8e1e24', k: '#241a2a', a: '#d9a83a', l: '#c94a6a' });

// Monte Celeste
defSprite('seeker', ['.k.kk.k.', '..kkkk..', '.kKKKKk.', 'kKwwwwKk', 'kKwrrwKk', 'kKwwwwKk', '.kKKKKk.', '..k..k..'], { k: '#2a1838', K: '#4a2a5a', w: '#f2efe6', r: '#e0303a' });
defSprite('dustbunny', ['.d.dd.d.', 'dddddddd', 'ddwdddwd', 'dddddddd', '.dd.dd.d'], { d: '#6a6a7a', w: '#f2efe6' });
defSprite('snowball', ['.www.', 'wwwBw', 'wwwww', 'wBwww', '.www.'], { w: '#f2f6ff', B: '#bcd0e8' });
defSprite('oshiro', ['....hhhh......', '...hhhhhh.....', '...gggggg.....', '..gGkggkGg....', '..ggggggg.....', '..gmmmmmg.....', '...ggggg......', '..bbbbbbb.....', '.bbbwbwbbb....', '.bbbwwwbbb....', '..bbbbbbb.....', '...ggggg......', '....ggg.......', '.....g........'],
  { h: '#8a8a9a', g: '#bfd8e8', G: '#9ab8d0', k: '#1a1220', m: '#5a5a6a', b: '#3a4a7a', w: '#f2efe6' });

// Dead Cells
defSprite('zombie', ['..ggg...', '.gGGGg..', '.gkGkg..', '.gGGGg..', '..bbb...', 'gbbbbbg.', 'gbbbbbbg', '.bbbbb..', '.b...b..', '.b...b..'], { g: '#6a9a5a', G: '#8aba6a', k: '#1a1418', b: '#5a4a3a' });
defSprite('archer', ['..hhh....', '.hhhhh.w.', '.hkykh.w.', '.hhhhh..w', '..ggg...w', '.ggggg.w.', 'gggggggw.', '.ggggg.w.', '.g...g...', '.g...g...'], { h: '#3a4a3a', k: '#1a1418', y: '#ffd23f', g: '#4a5a3a', w: '#8a6a3a' });
defSprite('grenadier', ['..mmm....', '.mMMMm...', '.mkMkm...', '..mmm..o.', '.bbbbb.oO', 'bbbbbbb..', 'bbbbbbb..', '.bb.bb...', '.bb.bb...'], { m: '#9aa0b4', M: '#c9ced8', k: '#1a1418', b: '#5a3a2a', o: '#ff8a2a', O: '#ffd23f' });
defSprite('concierge', [
  '......kkkk..........',
  '.....kKKKKk.........',
  '.....kyKKyk.........',
  '.....kKKKKk.........',
  '...ffffffffff.......',
  '..fFFFFFFFFFFf......',
  '.fFFFFFFFFFFFFf.....',
  'fFFFccccccFFFFFf....',
  'fFFFcFFFFcFFFFFf....',
  'fFFFcFFFFcFFFFFf....',
  'fFFFFFFFFFFFFFFf....',
  '.fFFFFFFFFFFFFf.....',
  '..ffffffffffff......',
  '...ff......ff.......',
  '..fff......fff......',
], { k: '#4a4e5a', K: '#6a6e7a', y: '#ff4a2a', f: '#8a5a6a', F: '#b07a8a', c: '#c9ced8' });

// Cvstodia (Blasphemous)
defSprite('condemned', ['...h....', '...hh...', '..hhh...', '..hkk...', '..hhh...', '.bbbbb..', 'bbBbbbb.', '.bbbbb.r', '.b...b.r', '.b...b..'], { h: '#d8c8a8', k: '#1a1418', b: '#6a4a3a', B: '#8a6a4a', r: '#c41e2a' });
defSprite('candlebearer', ['.y.y.y..', '.w.w.w..', '.wwwww..', '..sss...', '..sks...', '.ddddd..', 'dddddddd', '.ddddd..', '.d...d..'], { y: '#ffd23f', w: '#efe6d2', s: '#c9a07a', k: '#1a1418', d: '#3a2a2a' });
defSprite('stoner', ['....rr..', '...rRRr.', '.gg.rr..', 'gGGg....', 'gkGg....', 'gGGGgg..', '.gGGGg..', '..g..g..'], { g: '#8a7a5a', G: '#a89a7a', k: '#1a1418', r: '#6a6a6a', R: '#8a8a8a' });
defSprite('tenpiedad', [
  '..t......t........',
  '..tt....tt........',
  '...tTTTTt.........',
  '..TTTTTTTT........',
  '..TkTTTTkT........',
  '..TTTmmTTT........',
  '.TTTTTTTTTT.......',
  'TTTtTTTTtTTT......',
  'TTttTTTTttTT......',
  'TT.TTTTTT.TT......',
  '...TTTTTT.........',
  '...TT..TT.........',
  '..TTT..TTT........',
], { t: '#5a4a2a', T: '#8a7a5a', k: '#ff8a2a', m: '#2a1a1a' });

// Terraria
defSprite('tzombie', ['..ggg.....', '.gGGGg....', '.gkGkg....', '.gGGGg....', '..bbbbggg.', '.bbbbb....', '.bbbbb....', '..ppp.....', '..p.p.....', '.pp.pp....'], { g: '#6a9a5a', G: '#8aba6a', k: '#1a1418', b: '#3a5a8a', p: '#4a3a2a' });
defSprite('demoneye', ['..wwww..', '.wwrwww.', 'wwwwbbww', 'wrwbkbww', 'wwwwbbww', '.wwwrww.', '..wwww..'], { w: '#f2efe6', r: '#e0303a', b: '#3a6fe0', k: '#0b0910' });
defSprite('slime', ['...bb...', '.bbbbbb.', 'bbwbbbbb', 'bbkbbkbb', 'bbbbbbbb', 'bBBBBBBb'], { b: '#4a7aff', B: '#2a4ab0', w: '#ffffff', k: '#1a1220' });
defSprite('eoc', [
  '.....rrrrrr.......',
  '...rrRRRRRRrr.....',
  '..rRwwwwwwwwRr....',
  '.rRwwwwwrwwwwRr...',
  '.rwwwwwrwwwwwwr...',
  'rwwwwbbbbwwwrww...',
  'rwwwbbkkbbwwwwwT..',
  'rwwwbbkkbbwwwwwTT.',
  'rwwwwbbbbwwwwwwT..',
  '.rwwwwwwwwwrwwr...',
  '.rRwwwwwwwwwwRr...',
  '..rRRwwwwwwRRr....',
  '....rrrrrrrr......',
], { r: '#a8222a', R: '#d84a4a', w: '#f2efe6', b: '#3a6fe0', k: '#0b0910', T: '#c41e2a' });

// Il Seminterrato (Isaac)
defSprite('gaper', ['..ssss..', '.ssssss.', 'skkssskk', 'skkssskk', 'ssrsssrs', '.ssmmss.', '..ssss..', '.bbbbbb.', '.b.bb.b.', '.s....s.'], { s: '#e0b8a8', k: '#1a0a10', r: '#c41e2a', m: '#4a0a1a', b: '#b08a7a' });
defSprite('ifly', ['ww.ww', '.kkk.', 'kkrkk', '.kkk.'], { w: '#c9d8e8', k: '#1a1418', r: '#c41e2a' });
defSprite('clotty', ['..rrr..', '.rRRRr.', 'rRkRkRr', 'rRRRRRr', '.rrrrr.'], { r: '#8e1e24', R: '#c41e2a', k: '#1a0a10' });
defSprite('monstro', [
  '......pppppp........',
  '....ppPPPPPPpp......',
  '...pPPkPPPPkPPp.....',
  '..pPPPPPPPPPPPPp....',
  '.pPPPPPPPPPPPPPPp...',
  '.pPmmmmmmmmmmmPPp...',
  'pPPmwmwmwmwmwmmPPp..',
  'pPPmmmmmmmmmmmmPPp..',
  'pPPPmrmrmrmrmmPPPp..',
  '.pPPPPPPPPPPPPPPp...',
  '..ppPPPPPPPPPPpp....',
  '....pppppppppp......',
], { p: '#c97a8a', P: '#e8a0b0', k: '#1a0a10', m: '#6a1a2a', w: '#f2efe6', r: '#c41e2a' });

// =============================================================================
// OGGETTI DI SCENA (decorazioni dei mondi, senza collisione)
// =============================================================================
defSprite('p_lumafly', ['.y.', 'yYy', '.y.'], { y: '#9fe0ff', Y: '#ffffff' });
defSprite('p_stalag', ['...s...', '..sSs..', '..sSs..', '.ssSss.', '.sSSSs.', 'ssSSSss'], { s: '#3a4560', S: '#56627e' });
defSprite('p_infect', ['..oo...', '.oOOo.o', 'oOYOOoo', '.oOOOo.', '..oo...'], { o: '#c86a1a', O: '#ff9a2a', Y: '#ffd27a' });
defSprite('p_lamp', ['.aaa.', 'aYYYa', 'aYYYa', '.aaa.', '..s..', '..s..', '..s..', '.sss.'], { a: '#5a6a8a', Y: '#bfe8ff', s: '#3a4560' });
defSprite('p_pillar_gold', ['aaaaaa', '.AAAA.', '.aAAa.', '.aAAa.', '.aAAa.', '.aAAa.', '.aAAa.', 'aaaaaa'], { a: '#a8822a', A: '#e2b04a' });
defSprite('p_lava', ['..oo....', '.oYYoo..', 'oYYYYYoo', '.ooYYo..'], { o: '#c43a1a', Y: '#ffb03a' });
defSprite('p_skulls', ['.ww..ww.', 'wkkwwkkw', '.ww..ww.'], { w: '#d8d0c0', k: '#2a1a1a' });
defSprite('p_column', ['gggggg', '.GGGG.', '.gGGg.', '.gGGg.', '.gGGg.', '.gGGg.', 'gggggg'], { g: '#3a5a4a', G: '#6a8a7a' });
defSprite('p_soulfire', ['..g..', '.gGg.', 'gGWGg', '.ggg.'], { g: '#3ad08a', G: '#8affc0', W: '#ffffff' });
defSprite('p_pine', ['...g...', '..gGg..', '.gGwGg.', '..gGg..', '.gGwGg.', 'gGGGGGg', '...b...', '...b...'], { g: '#2a5a4a', G: '#3a7a5a', w: '#f2f6ff', b: '#4a3a2a' });
defSprite('p_crystal', ['.c.c.', 'cCcCc', '.cWc.', 'cCcCc', '.c.c.'], { c: '#3a86d0', C: '#7ac0ff', W: '#ffffff' });
defSprite('p_drift', ['..wwww..', '.wwwwww.', 'wwWWWWww'], { w: '#e8f0ff', W: '#bcd0e8' });
defSprite('p_torch', ['.y.', 'yOy', '.b.', '.b.', 'bbb'], { y: '#ffd23f', O: '#ff6a2a', b: '#5a4a3a' });
defSprite('p_chain', ['.c.', 'c.c', '.c.', 'c.c', '.c.', 'c.c'], { c: '#8a8f9c' });
defSprite('p_cage', ['bbbbb', 'b.b.b', 'b.b.b', 'b.b.b', 'bbbbb'], { b: '#6a6e7a' });
defSprite('p_candles', ['y..y.y', 'w..w.w', 'w.ww.w', 'wwwwww'], { y: '#ffd23f', w: '#efe6d2' });
defSprite('p_altar', ['..aa..', '.aAAa.', 'rrrrrr', 'rRRRRr', 'rRRRRr'], { a: '#d9b43a', A: '#ffe680', r: '#5a1e24', R: '#7e2a30' });
defSprite('p_tree', ['..ggg..', '.gGGGg.', 'gGGgGGg', 'gGGGGGg', '.gGGGg.', '...b...', '...b...', '...b...', '..bbb..'], { g: '#2a6a2a', G: '#3b8a3b', b: '#5a3a1a' });
defSprite('p_flower', ['.r.', 'rYr', '.g.', '.g.'], { r: '#e0303a', Y: '#ffd23f', g: '#3b8a3b' });
defSprite('p_rock', ['..rr..', '.rRRr.', 'rRRRRr', 'rrrrrr'], { r: '#5a4a3a', R: '#7a6a5a' });
defSprite('p_poop', ['..b..', '.bBb.', 'bBBBb', 'bbbbb'], { b: '#6a4a2a', B: '#8a6a3a' });
defSprite('p_blood', ['.rr.r.', 'rrrrrr', '.rrrr.', 'r.rr..'], { r: '#7e1820' }, false);
defSprite('p_relic', ['..y..', '.yYy.', 'yYWYy', '.yYy.', '..y..'], { y: '#c8901a', Y: '#ffd23f', W: '#ffffff' });
defSprite('p_altar_goal', ['..y..', '.yYy.', 'aaaaa', 'aAAAa', 'aAAAa', 'aaaaa'], { y: '#ffd23f', Y: '#ffffff', a: '#8c6a2f', A: '#e2b04a' });

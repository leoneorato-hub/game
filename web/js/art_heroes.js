'use strict';
// =============================================================================
// ART: EROI (Alfa 3) — 26×36 px, ombreggiati, con animazioni:
// _i0/_i1 respiro · _bl battito di ciglia · _w0.._w3 camminata · _hu colpito
// =============================================================================

const WALK = [[2.2, -2.2, 0], [0, 0, -1], [-2.2, 2.2, 0], [0, 0, -1]]; // piede sx, piede dx, sollevamento corpo
const HERO_FRAMES = [
  ['_i0', { ph: -1, br: 0 }], ['_i1', { ph: -1, br: 1 }], ['_bl', { ph: -1, br: 0, blink: 1 }],
  ['_w0', { ph: 0 }], ['_w1', { ph: 1 }], ['_w2', { ph: 2 }], ['_w3', { ph: 3 }], ['_hu', { ph: -1, hurt: 1 }],
];
function defHero(name, w, h, fn, opts) {
  for (const [suf, f] of HERO_FRAMES) {
    const ff = Object.assign({ br: 0 }, f);
    const [lf, rf, lift] = ff.ph >= 0 ? WALK[ff.ph] : [0, 0, 0];
    ff.lf = lf; ff.rf = rf; ff.by = lift + (ff.br ? 1 : 0) + (ff.hurt ? 1 : 0);
    ff.arm = ff.ph >= 0 ? -lf * 0.6 : 0;
    regPaint(name + suf, w, h, b => fn(b, ff), opts);
  }
  SPR[name] = SPR[name + '_i0'];
}

// --- IL CAVALIERE ------------------------------------------------------------------
const KN = { shell: '#e6e1d6', void: '#1c1826', cloak: '#5c6278', cloak2: '#474c63' };
function drawKnight(b, f, pal = KN) {
  const y = f.by, sway = f.ph >= 0 ? (f.ph % 2 ? 0 : (f.ph ? -1 : 1)) : 0;
  // gambe di Vuoto
  b.cap(11, 30 + y, 11 + f.lf, 34, 1.4, pal.void);
  b.cap(15, 30 + y, 15 + f.rf, 34, 1.4, pal.void);
  // mantello (orlo sfrangiato che ondeggia)
  b.poly([[8, 19 + y], [18, 19 + y], [20 + sway, 30 + y], [18 + sway, 29 + y], [16 + sway, 31 + y], [13, 29 + y], [10 + sway, 31 + y], [8 + sway, 29 + y], [6 + sway, 30 + y]], pal.cloak);
  b.poly([[9, 19 + y], [13, 19 + y], [12, 24 + y], [8, 26 + y]], pal.cloak2);
  // testa-guscio con corna
  b.cap(8.5, 8 + y, 6.5, 1.5 + y, 1.5, pal.shell, { r2: 0.9 });
  b.cap(17.5, 8 + y, 19.5, 1.5 + y, 1.5, pal.shell, { r2: 0.9 });
  b.ell(13, 12.5 + y, 7.2, 6.8, pal.shell);
  b.ell(13, 18 + y, 4.5, 2, pal.void);
  // occhi
  if (f.blink) { b.rect(8.5, 12.5 + y, 3, 0.8, M.flat(pal.void, 1)); b.rect(14.5, 12.5 + y, 3, 0.8, M.flat(pal.void, 1)); }
  else { b.ell(10, 12.5 + y, 1.6, 2.6, M.flat(pal.void, 1)); b.ell(16, 12.5 + y, 1.6, 2.6, M.flat(pal.void, 1)); b.dot(9, 11 + y, M.flat('#3a3450', 3)); }
}
defHero('knight', 26, 36, drawKnight);

// --- V1 (dal riferimento: armatura ardesia, ali-dissipatore luminose, ottica gialla) ---
const V1C = { armor: '#4b4f69', armor2: '#363346', plate: '#5f7290', glow: '#f6b955', blue: '#3d6fd6', dark: '#2a2833' };
function drawV1(b, f) {
  const y = f.by, t = f.br ? 1 : 0;
  b.off(5, 2);
  // ali dissipatrici a raggiera (dietro), come nel riferimento
  b.rays(13, 14 + y, 8, 4, 16 + t, 1.8, M.glow(V1C.glow), -Math.PI * 1.02, { len: i => [0.75, 1, 1.1, 0.9, 0.9, 1.1, 1, 0.75][i], jit: i => (i < 4 ? -0.2 : 0.2) });
  for (let i = 0; i < 8; i++) { const a = -Math.PI * 1.02 + i / 8 * TAU + (i < 4 ? -0.2 : 0.2); b.cap(13 + Math.cos(a) * 3, 14 + y + Math.sin(a) * 3, 13 + Math.cos(a) * 6, 14 + y + Math.sin(a) * 6, 1.1, V1C.armor2); }
  // gambe corazzate
  b.cap(10.5, 23 + y, 9.5 + f.lf, 31, 2.2, V1C.armor2);
  b.cap(15.5, 23 + y, 16.5 + f.rf, 31, 2.2, V1C.armor2);
  b.rect(7.5 + f.lf, 31, 4.5, 3, V1C.armor); b.rect(14.5 + f.rf, 31, 4.5, 3, V1C.armor);
  b.ell(10 + f.lf * 0.5, 27 + y, 1.6, 1.4, V1C.plate); b.ell(16 + f.rf * 0.5, 27 + y, 1.6, 1.4, V1C.plate);
  // busto
  b.poly([[7.5, 14 + y], [18.5, 14 + y], [17, 23 + y], [9, 23 + y]], V1C.armor);
  b.rect(10, 18 + y, 6, 5, V1C.armor2);
  b.rect(9, 15.5 + y, 3, 1, M.glow(V1C.glow)); b.rect(14, 15.5 + y, 3, 1, M.glow(V1C.glow));
  // braccia: sinistra Feedbacker blu, destra acciaio (tiene l'arma)
  b.cap(7, 15 + y, 5.5 - f.arm, 22 + y, 1.8, V1C.blue);
  b.ell(5.5 - f.arm, 22.5 + y, 2, 1.8, V1C.blue);
  b.cap(19, 15 + y, 20.5 + f.arm, 21 + y, 1.8, V1C.armor);
  b.ell(7.5, 14.5 + y, 2.6, 2.2, V1C.plate); b.ell(18.5, 14.5 + y, 2.6, 2.2, V1C.plate);
  // testa: elmo con ottica singola
  b.poly([[9, 7 + y], [10, 4 + y], [11, 6 + y]], V1C.armor); b.poly([[17, 7 + y], [16, 4 + y], [15, 6 + y]], V1C.armor);
  b.ell(13, 9 + y, 4.6, 4.4, V1C.armor);
  b.ell(14, 9 + y, 2.4, 2.4, V1C.dark);
  b.ell(14, 9 + y, 1.5, 1.5, M.glow(f.blink ? '#8a6a3a' : V1C.glow));
  b.dot(14, 9 + y, M.flat('#3a2a1a', 1));
}
defHero('v1', 36, 40, drawV1);

// --- ZAGREUS ----------------------------------------------------------------------------
const ZG = { skin: '#d49a6e', hair: '#1c1418', laurel: '#3c5a2a', red: '#a8242c', gold: '#d9a83a', fire: '#ff8a2a' };
function drawZagreus(b, f) {
  const y = f.by;
  // mantello rosso dietro
  b.poly([[9, 13 + y], [17, 13 + y], [20, 28 + y], [6, 28 + y]], ZG.red);
  // gambe
  b.cap(11, 25 + y, 10.5 + f.lf, 33, 1.5, ZG.skin);
  b.cap(15, 25 + y, 15.5 + f.rf, 33, 1.5, ZG.skin);
  // piedi in fiamme
  const fl = f.ph >= 0 ? f.ph : (f.br ? 1 : 0);
  for (const [fx, sx] of [[10.5 + f.lf, 1], [15.5 + f.rf, -1]]) {
    b.ell(fx, 33.5, 2.2, 1.3, M.glow(ZG.fire));
    b.poly([[fx - 1.5, 33], [fx - 0.5 + sx * (fl % 2), 29.5 - fl * 0.4], [fx + 1.5, 33]], M.glow('#ffcf5a'));
  }
  // chitone
  b.poly([[9, 16 + y], [17, 15 + y], [18, 26 + y], [8, 26 + y]], ZG.red);
  b.rect(8.5, 22 + y, 9.5, 1.2, ZG.gold);
  b.poly([[13, 15 + y], [17, 15 + y], [17, 20 + y]], ZG.skin);
  // braccia
  b.cap(8, 16 + y, 6.5 - f.arm, 23 + y, 1.4, ZG.skin);
  b.cap(18, 16 + y, 19.5 + f.arm, 23 + y, 1.4, ZG.skin);
  b.rect(5.5 - f.arm, 21 + y, 2.4, 1.2, ZG.gold); b.rect(18.5 + f.arm, 21 + y, 2.4, 1.2, ZG.gold);
  // testa
  b.ell(13, 9.5 + y, 4.6, 5, ZG.skin);
  b.poly([[8, 9 + y], [9, 4 + y], [12, 3 + y], [16, 3 + y], [18.5, 6 + y], [18, 10 + y], [16.5, 7 + y], [12, 6.5 + y], [9.5, 8 + y]], ZG.hair);
  for (let i = 0; i < 5; i++) b.ell(9 + i * 2.2, 4.6 + y - Math.sin(i / 4 * Math.PI) * 1.2, 0.9, 0.6, ZG.laurel);
  if (!f.blink) { b.dot(11, 10 + y, M.flat('#ff3030', 2)); b.dot(15, 10 + y, M.flat('#38e06a', 2)); }
  else { b.rect(10.5, 10 + y, 1.5, 0.6, M.flat('#7a4a3a', 1)); b.rect(14.5, 10 + y, 1.5, 0.6, M.flat('#7a4a3a', 1)); }
}
defHero('zagreus', 26, 36, drawZagreus);

// --- MADELINE (la treccia lunga è disegnata a parte, in gioco) ------------------------------
const MD = { skin: '#f0c8a0', jacket: '#5d4a9c', pants: '#2f3050', boot: '#6a4430' };
function drawMadeline(b, f, hair = '#d1343a') {
  const y = f.by;
  b.cap(11, 25 + y, 10.5 + f.lf, 32, 1.6, MD.pants);
  b.cap(15, 25 + y, 15.5 + f.rf, 32, 1.6, MD.pants);
  b.rect(8.5 + f.lf, 31.5, 4, 2.5, MD.boot); b.rect(13.5 + f.rf, 31.5, 4, 2.5, MD.boot);
  b.poly([[8.5, 15 + y], [17.5, 15 + y], [18.5, 26 + y], [7.5, 26 + y]], MD.jacket);
  b.rect(12.5, 15 + y, 1, 11, M.flat('#3e2f70', 1));
  b.cap(8.5, 16 + y, 7 - f.arm, 23 + y, 1.5, MD.jacket);
  b.cap(17.5, 16 + y, 19 + f.arm, 23 + y, 1.5, MD.jacket);
  b.ell(7 - f.arm, 23.5 + y, 1.3, 1.2, MD.skin); b.ell(19 + f.arm, 23.5 + y, 1.3, 1.2, MD.skin);
  // testa
  b.ell(13, 10 + y, 4.6, 4.8, hair);
  b.ell(13.5, 11 + y, 3.6, 3.8, MD.skin);
  b.poly([[9, 9 + y], [12, 6 + y], [17, 7 + y], [17.5, 9.5 + y], [13, 8.5 + y], [10, 11 + y]], hair);
  b.ell(9, 7 + y, 2.6, 2.4, hair);
  if (!f.blink) { b.dot(12, 11 + y, M.flat('#2a1a1a', 1)); b.dot(15, 11 + y, M.flat('#2a1a1a', 1)); }
  else { b.dot(12, 11 + y, M.flat('#b07a5a', 1)); b.dot(15, 11 + y, M.flat('#b07a5a', 1)); }
  b.dot(11, 12 + y, M.flat('#d98a6a', 2)); b.dot(16, 12 + y, M.flat('#d98a6a', 2));
}
defHero('madeline', 26, 36, drawMadeline);
defHero('madeline_blue', 26, 36, (b, f) => drawMadeline(b, f, '#5fb3ff'));
defHero('madeline_pink', 26, 36, (b, f) => drawMadeline(b, f, '#ff7ad9'));
defHero('badeline', 26, 36, (b, f) => {
  const save = Object.assign({}, MD);
  Object.assign(MD, { skin: '#c9a6d9', jacket: '#2a1838', pants: '#1f1428', boot: '#1f1428' });
  drawMadeline(b, f, '#7a3aa0');
  if (!f.blink) { b.dot(12, 11 + f.by, M.glow('#ff3050')); b.dot(15, 11 + f.by, M.glow('#ff3050')); }
  Object.assign(MD, save);
});

// --- IL PRIGIONIERO ------------------------------------------------------------------------
const PR = { tunic: '#4f6136', scarf: '#8a2a2a', belt: '#5a3a1a', boot: '#3a2a1a', skin: '#b9a17a', flame: '#3fc8b8' };
function drawPrisoner(b, f, flame = 0) {
  const y = f.by;
  b.poly([[10, 15 + y], [16, 15 + y], [19, 27 + y], [17, 25 + y], [15, 28 + y]], '#2f3a22');
  b.cap(11, 25 + y, 10.5 + f.lf, 32, 1.6, '#2f3a22');
  b.cap(15, 25 + y, 15.5 + f.rf, 32, 1.6, '#2f3a22');
  b.rect(8.5 + f.lf, 31.5, 4, 2.5, PR.boot); b.rect(13.5 + f.rf, 31.5, 4, 2.5, PR.boot);
  b.poly([[8.5, 15 + y], [17.5, 15 + y], [18, 26 + y], [8, 26 + y]], PR.tunic);
  b.rect(8, 21 + y, 10, 1.5, PR.belt); b.dot(12, 21 + y, M.flat('#c9a43a', 3));
  b.cap(8.5, 16 + y, 7 - f.arm, 23 + y, 1.5, PR.tunic);
  b.cap(17.5, 16 + y, 19 + f.arm, 23 + y, 1.5, PR.tunic);
  b.ell(7 - f.arm, 23.5 + y, 1.2, 1.2, PR.skin); b.ell(19 + f.arm, 23.5 + y, 1.2, 1.2, PR.skin);
  b.ell(13, 14.5 + y, 5, 1.8, PR.scarf);
  if (flame >= 0) {
    // la "testa": una fiamma di cellule
    const k = flame;
    b.ell(13, 9 + y, 4, 4.4, M.glow(PR.flame));
    b.poly([[9.5, 9 + y], [10 + k, 2 + y], [12, 6 + y], [13.5 - k, 0.5 + y], [15, 5 + y], [17 - k, 2.5 + y], [16.5, 9 + y]], M.glow(PR.flame));
    b.ell(13, 9.5 + y, 2.2, 2.6, M.glow('#c8fff4'));
    if (!f.blink) b.dot(14, 9 + y, M.flat('#0e3a36', 1));
  }
}
defHero('prisoner', 26, 36, (b, f) => drawPrisoner(b, f, 0));
defHero('prisoner_f2', 26, 36, (b, f) => drawPrisoner(b, f, 1));
defHero('prisoner_headless', 26, 36, (b, f) => drawPrisoner(b, f, -1));
regPaint('homunculus', 12, 14, b => { b.ell(6, 8, 4, 4.4, M.glow(PR.flame)); b.poly([[2.5, 8], [3, 1], [5, 5], [6.5, 0], [8, 4], [10, 1.5], [9.5, 8]], M.glow(PR.flame)); b.ell(6, 8.5, 2, 2.4, M.glow('#c8fff4')); b.dot(7, 8, M.flat('#0e3a36', 1)); });

// --- IL PENITENTE -------------------------------------------------------------------------
const PN = { helm: '#b8bcc8', thorn: '#5a3d22', robe: '#5a1e24', robe2: '#3e1218', gold: '#d9b43a', skin: '#8a6a5a' };
function drawPenitent(b, f) {
  const y = f.by;
  b.poly([[7, 16 + y], [19, 16 + y], [21, 32 + y], [5, 32 + y]], PN.robe2);
  b.cap(11, 28 + y, 10.5 + f.lf, 33, 1.7, '#2a2028');
  b.cap(15, 28 + y, 15.5 + f.rf, 33, 1.7, '#2a2028');
  b.poly([[8, 16 + y], [18, 16 + y], [19.5, 30 + y], [6.5, 30 + y]], PN.robe);
  b.rect(12.5, 18 + y, 1.2, 12, PN.gold);
  b.poly([[9.5, 21 + y], [16.5, 21 + y], [16, 22.5 + y], [10, 22.5 + y]], PN.gold);
  b.ell(7.5, 17 + y, 3, 2.2, '#8a8e9a'); b.ell(18.5, 17 + y, 3, 2.2, '#8a8e9a');
  b.cap(7, 18 + y, 6 - f.arm, 25 + y, 1.6, PN.robe);
  b.cap(19, 18 + y, 20 + f.arm, 25 + y, 1.6, PN.robe);
  // capirote metallico con corona di spine
  b.poly([[13, -0.5 + y], [17.5, 13 + y], [8.5, 13 + y]], PN.helm);
  b.ell(13, 13.5 + y, 4.8, 2.2, PN.helm);
  for (let i = 0; i < 7; i++) { const x = 8 + i * 1.7; b.poly([[x - 0.7, 10.5 + y], [x, 8 + y - (i % 2) * 1.5], [x + 0.7, 10.5 + y]], PN.thorn); }
  b.rect(8.5, 10.5 + y, 9, 1.2, PN.thorn);
  b.rect(10.5, 12.5 + y, 5, 0.9, M.flat('#14101a', 1));
}
defHero('penitent', 26, 36, drawPenitent);

// --- IL TERRARIANO -----------------------------------------------------------------------
const TR = { hair: '#6b3a1f', skin: '#e8b98f', shirt: '#3b8a3b', pants: '#2c4a8a', boot: '#4a2e1a' };
function drawTerrarian(b, f) {
  const y = f.by;
  b.cap(11, 24 + y, 10.5 + f.lf, 32, 1.6, TR.pants);
  b.cap(15, 24 + y, 15.5 + f.rf, 32, 1.6, TR.pants);
  b.rect(8.5 + f.lf, 31.5, 4, 2.5, TR.boot); b.rect(13.5 + f.rf, 31.5, 4, 2.5, TR.boot);
  b.poly([[8.5, 15 + y], [17.5, 15 + y], [17.5, 24 + y], [8.5, 24 + y]], TR.shirt);
  b.rect(8.5, 23 + y, 9, 1.4, '#5a3a1a');
  b.cap(8.5, 16 + y, 7 - f.arm, 23 + y, 1.5, TR.shirt);
  b.cap(17.5, 16 + y, 19 + f.arm, 23 + y, 1.5, TR.shirt);
  b.ell(7 - f.arm, 23.5 + y, 1.3, 1.3, TR.skin); b.ell(19 + f.arm, 23.5 + y, 1.3, 1.3, TR.skin);
  b.rect(9, 6 + y, 8, 8.5, TR.skin);
  b.poly([[8, 10 + y], [8, 4.5 + y], [10, 3 + y], [16, 3 + y], [18, 5 + y], [18, 9 + y], [16.5, 6.5 + y], [10, 6.5 + y], [9.5, 10 + y]], TR.hair);
  if (!f.blink) { b.rect(11, 9.5 + y, 1, 1.5, M.flat('#2a1a12', 1)); b.rect(15, 9.5 + y, 1, 1.5, M.flat('#2a1a12', 1)); b.dot(11, 9 + y, M.flat('#ffffff', 4)); b.dot(15, 9 + y, M.flat('#ffffff', 4)); }
  else { b.rect(11, 10 + y, 1.5, 0.6, M.flat('#a87a5a', 1)); b.rect(14.5, 10 + y, 1.5, 0.6, M.flat('#a87a5a', 1)); }
}
defHero('terrarian', 26, 36, drawTerrarian);

// --- ISAAC ------------------------------------------------------------------------------
const IS = { skin: '#f2cdbd' };
function drawIsaac(b, f) {
  const y = f.by;
  b.cap(11.5, 27 + y, 11 + f.lf, 33, 1.5, IS.skin);
  b.cap(14.5, 27 + y, 15 + f.rf, 33, 1.5, IS.skin);
  b.ell(13, 24 + y, 4, 4.5, IS.skin);
  b.cap(9.5, 22 + y, 8 - f.arm, 27 + y, 1.2, IS.skin);
  b.cap(16.5, 22 + y, 18 + f.arm, 27 + y, 1.2, IS.skin);
  b.ell(13, 12 + y, 8.5, 8, IS.skin);
  if (!f.blink) {
    b.ell(9.8, 12 + y, 2, 2.4, M.flat('#14101a', 1)); b.ell(16.2, 12 + y, 2, 2.4, M.flat('#14101a', 1));
    b.dot(9, 11 + y, M.flat('#ffffff', 4)); b.dot(15, 11 + y, M.flat('#ffffff', 4));
  } else { b.rect(8, 12 + y, 3.5, 0.8, M.flat('#14101a', 1)); b.rect(14.5, 12 + y, 3.5, 0.8, M.flat('#14101a', 1)); }
  // lacrime che scendono
  const k = (f.ph >= 0 ? f.ph : f.br) % 2;
  b.cap(8.5, 14.5 + y, 8.5, 17 + y + k, 0.8, M.glow('#7fb8ff'));
  b.cap(17.5, 14.5 + y, 17.5, 16 + y + (1 - k), 0.8, M.glow('#7fb8ff'));
  b.ell(13, 17 + y, 2, 0.9, M.flat('#8a2a3a', 1));
}
defHero('isaac', 26, 36, drawIsaac);

// Ritratti grandi per selezione e dialoghi (2× con più dettaglio in testa)
function heroPortrait(id) { return SPR[id + '_i0'] || SPR[id]; }

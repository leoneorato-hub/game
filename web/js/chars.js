'use strict';
// =============================================================================
// ROSTER — personaggi, Kit Natii, passivi, sinergie ed evoluzioni (GDD §3).
// =============================================================================

function setCd(w, v) { w.t = v; w.cdMax = v; }
// Posa dell'arma impugnata (mostra visivamente ogni attacco)
function pose(tpl, col, ang, mode = 'swing', dur = 0.16, sc = 1) { G.p.atk = { tpl, col, ang, mode, t: dur, dur, sc }; }
function tick(w, dt) { w.t -= dt; return w.t <= 0; }

// --- Passivi universali (GDD §3.9) ------------------------------------------------
const UNIVERSAL = ['maskfrag', 'thimble', 'mirror', 'scrollfrag', 'spoolp', 'hourglass', 'oldcoin', 'bead', 'shard', 'whitepill'];

const PASSIVES = {
  maskfrag: { name: 'Frammento di Maschera', icon: ['heart', '#f2efe6', '#9aa6b8'], max: 5, line: () => '+10% Vita · +1 Maschera/Cuore ai lv 1-3-5 · −6% Ansia', stat: (s, l) => { s.hpMul += 0.1 * l; s.units += Math.ceil(l / 2); s.anxMul *= 1 - 0.06 * l; } },
  thimble: { name: 'Ditale della Cucitrice', icon: ['shield', '#c9ced8', '#6b7085'], max: 5, line: () => '+1 Armatura', stat: (s, l) => { s.armor += l; } },
  mirror: { name: 'Specchio della Notte', icon: ['orb', '#7a3aa0', '#2a1838'], max: 5, line: () => '+10% Potenza', stat: (s, l) => { s.might += 0.1 * l; } },
  scrollfrag: { name: 'Pergamena Frammentata', icon: ['scroll', '#d9c8a0', '#8a6a3a'], max: 5, line: () => '+10% Area', stat: (s, l) => { s.area += 0.1 * l; } },
  spoolp: { name: 'Spoletta Rapida', icon: ['clock', '#e2b04a', '#8e2b3a'], max: 5, line: () => '−7% Ricarica', stat: (s, l) => { s.cd *= Math.pow(0.93, l); } },
  hourglass: { name: 'Clessidra di Filo', icon: ['clock', '#bfe4ff', '#3a6fe0'], max: 5, line: () => '+12% Durata', stat: (s, l) => { s.duration += 0.12 * l; } },
  oldcoin: { name: 'Moneta Consumata', icon: ['magnet', '#d9a83a', '#8a5a2a'], max: 5, line: () => '+30% Magnetismo', stat: (s, l) => { s.magnet += 0.3 * l; } },
  bead: { name: 'Grano Benedetto', icon: ['bead', '#e2b04a', '#8e2b3a'], max: 5, line: () => '+12% Fortuna', stat: (s, l) => { s.luck += 0.12 * l; } },
  shard: { name: 'Frammento di Cristallo', icon: ['crystal', '#ff9ad9', '#4aa0ff'], max: 5, line: () => '+8% Crescita', stat: (s, l) => { s.growth += 0.08 * l; } },
  whitepill: { name: 'Pillola Bianca', icon: ['pill', '#f2efe6', '#5fb3ff'], max: 5, line: () => '+8% Velocità', stat: (s, l) => { s.speed += 0.08 * l; } },

  // --- Il Cavaliere: amuleti (Tacche) e Minerale Pallido
  soulcatcher: { name: 'Accalappia-Anime', icon: ['orb', '#f2efe6', '#6b7085'], max: 1, charm: 2, line: () => '+3 Anima per colpo d\'Aculeo' },
  shaman: { name: 'Pietra dello Sciamano', icon: ['crystal', '#bfe4ff', '#6b7085'], max: 1, charm: 3, line: () => 'Incantesimi +33% danno e dimensione' },
  grubsong: { name: 'Canto delle Larve', icon: ['heart', '#9fe07a', '#3a6a2a'], max: 1, charm: 1, line: () => '+15 Anima quando subisci danno' },
  elegy: { name: 'Elegia della Larvamosca', icon: ['wave', '#ffe680', '#f2efe6'], max: 1, charm: 3, line: () => 'A Maschere piene, l\'Aculeo spara fasci' },
  quickslash: { name: 'Fendente Rapido', icon: ['sword', '#f2efe6', '#6b7085'], max: 1, charm: 3, line: () => 'Ricarica Aculeo 0,41 → 0,25 s' },
  pale: { name: 'Minerale Pallido', icon: ['crystal', '#f2efe6', '#c9ced8'], max: 1, line: () => 'Catalizzatore: Aculeo → Aculeo Puro' },

  // --- Zagreus: Ricordi
  collar: { name: 'Vecchio Collare Chiodato', icon: ['ring', '#c9ced8', '#5a1e24'], max: 3, line: () => '+20 Vita (dono di Cerbero)', stat: (s, l) => { s.hpAdd += 20 * l; } },
  tooth: { name: 'Dente Fortunato', icon: ['skull', '#f2efe6', '#2a1838'], max: 1, line: () => '+1 Sfida alla Morte (dono di Skelly)' },
  bracer: { name: 'Bracciale dei Mirmidoni', icon: ['shield', '#d9a83a', '#5a1e24'], max: 3, line: () => '+2 Armatura (dono di Achille)', stat: (s, l) => { s.armor += 2 * l; } },
  darkness: { name: 'Oscurità', icon: ['crystal', '#d08aff', '#7a3aa0'], max: 5, line: () => '+6% Potenza · catalizzatore di Stygius', stat: (s, l) => { s.might += 0.06 * l; } },

  // --- Madeline
  cheart: { name: 'Cuore di Cristallo', icon: ['heart', '#4aa0ff', '#ffc0f0'], max: 1, line: () => '+10% Velocità · catalizzatore dello Scatto', stat: s => { s.speed += 0.1; } },
  accept: { name: 'Accettazione', icon: ['ghost', '#ff7ad9', '#7a3aa0'], max: 1, cond: () => G.p.panicWins > 0, line: () => 'L\'Ansia aumenta il danno · riquadro della piuma più grande' },

  // --- Il Prigioniero: Mutazioni
  combo: { name: 'Mutazione: Combo', icon: ['dna', '#e0303a', '#57d6c8'], max: 1, line: () => 'Dopo un\'uccisione: +35% danno per 2 s' },
  necro: { name: 'Mutazione: Necromanzia', icon: ['dna', '#3fd46a', '#57d6c8'], max: 1, line: () => 'Cura 0,6 PV per uccisione' },
  vengeance: { name: 'Mutazione: Vendetta', icon: ['dna', '#ff8a2a', '#57d6c8'], max: 1, line: () => 'Dopo un colpo subito: +60% danno per 3 s' },
  killer: { name: 'Mutazione: Istinto Assassino', icon: ['dna', '#ffd23f', '#57d6c8'], max: 1, line: () => '+15% probabilità di critico' },

  // --- Il Penitente: Rosario
  redwax: { name: 'Grano di Cera Rossa', icon: ['bead', '#e0303a', '#5a1e24'], max: 3, line: () => '+15 Vita', stat: (s, l) => { s.hpAdd += 15 * l; } },
  bluewax: { name: 'Grano di Cera Blu', icon: ['bead', '#5fb3ff', '#22305a'], max: 3, line: () => '+25% Fervore guadagnato' },
  incense: { name: 'Cuore Fumante d\'Incenso', icon: ['flame', '#ff8a2a', '#5a1e24'], max: 1, line: () => 'Cuore della Mea Culpa · catalizzatore' },

  // --- Il Terrariano
  lifecrystal: { name: 'Cristallo di Vita', icon: ['heart', '#ff4a6a', '#8e2b3a'], max: 5, line: () => '+20 Vita (+1 cuore)', stat: (s, l) => { s.hpAdd += 20 * l; } },
  manaflower: { name: 'Fiore di Mana', icon: ['star', '#5fb3ff', '#22305a'], max: 1, line: () => 'Costo mana −30% · rigenerazione +50%' },
  luminite: { name: 'Frammento di Luminite', icon: ['crystal', '#5ff0c0', '#22305a'], max: 1, line: () => 'Catalizzatore dello ZENITH' },
};

// --- Oggetti di Isaac (slot illimitati, ognuno una volta sola) ----------------------
const ISAAC_ITEMS = {
  onion: { name: 'La Cipolla Triste', tag: 'Tears up', icon: ['eye', '#9fd0ff', '#3a6fe0'], apply: s => { s.tears += 0.7; } },
  cricket: { name: 'Testa del Grillo', tag: 'DMG up', icon: ['skull', '#c9a06a', '#3a2a1a'], apply: s => { s.dmg += 0.5; s.dmgMul *= 1.5; } },
  spoon: { name: 'Il Cucchiaio Piegato', tag: 'Psychic shot', icon: ['knife', '#c9ced8', '#7a3aa0'], apply: () => {} },
  innereye: { name: 'L\'Occhio Interiore', tag: 'Triple shot', icon: ['eye', '#f2cdbd', '#3a2a3a'], apply: s => { s.tearsMul *= 0.6; } },
  polyphemus: { name: 'Polifemo', tag: 'Mega tears', icon: ['eye', '#f2efe6', '#e0303a'], apply: s => { s.dmg += 4; s.dmgMul *= 2; s.tearsMul *= 0.5; } },
  brimstone: { name: 'Brimstone', tag: 'Blood laser barrage', icon: ['laser', '#e0303a', '#5a1e24'], apply: () => {} },
  pentagram: { name: 'Pentagramma', tag: 'DMG up', icon: ['star', '#e0303a', '#14101a'], apply: s => { s.dmg += 1; } },
  hormones: { name: 'Ormoni della Crescita', tag: 'Speed + DMG up', icon: ['pill', '#e0303a', '#5fb3ff'], apply: s => { s.dmg += 1; s.speed += 0.3; } },
  wire: { name: 'Gancio di Ferro', tag: 'Range up', icon: ['bow', '#c9ced8', '#6b7085'], apply: s => { s.range += 2; s.shot += 0.2; } },
  guppyhead: { name: 'Testa di Guppy', tag: 'Reusable fly hive', icon: ['fly', '#3a3a3a', '#3a6fe0'], guppy: true, apply: () => {} },
  guppytail: { name: 'Coda di Guppy', tag: 'Cursed?', icon: ['fly', '#3a3a3a', '#d9a83a'], guppy: true, apply: s => { s.luck += 1; } },
  guppypaw: { name: 'Zampa di Guppy', tag: 'Soul up', icon: ['fly', '#3a3a3a', '#bfe4ff'], guppy: true, apply: () => {}, acquire: () => { const p = G.p; if (p.extraUnits > -4) { p.extraUnits -= 2; p.shield += 6; recalc(); } else p.shield += 2; } },
};
for (const [k, v] of Object.entries(ISAAC_ITEMS)) PASSIVES[k] = Object.assign({ max: 1, isaac: true, line: () => '"' + v.tag + '"' }, v);
PASSIVES.soulheart = { name: 'Cuore Anima', icon: ['heart', '#bfe4ff', '#3a6fe0'], max: 99, isaac: true, line: () => '+1 Cuore Anima', acquire: () => { G.p.shield += 2; } };

const PILLS = [
  { n: 'Salute Su', f: () => { G.p.extraUnits += 2; recalc(); healPlayer(2); } },
  { n: 'Lacrime Su', f: () => { G.p.ist.tears += 0.5; } },
  { n: 'Gittata Giù', f: () => { G.p.ist.range = Math.max(3, G.p.ist.range - 1); } },
  { n: 'Velocità Su', f: () => { G.p.ist.speed += 0.15; } },
  { n: 'Brutto Viaggio', f: () => { if (G.p.hp > 2) G.p.hp -= 1; else healPlayer(6); } },
  { n: 'Le Ho Trovate', f: () => {} },
  { n: 'Pubertà', f: () => {} },
  { n: 'Piena Salute', f: () => healPlayer(99) },
];

// --- Divinità per Zagreus -------------------------------------------------------------------
const GODS = {
  zeus: { name: 'Zeus', col: '#ffe066', icon: 'bolt', eff: 'fulmini a catena', quote: 'Ah, nipote! Un paio di fulmini non hanno mai fatto male a nessuno. Beh… a parte i bersagli.' },
  poseidon: { name: 'Poseidone', col: '#4ac0ff', icon: 'wave', eff: 'spinta violenta e +danno', quote: 'Ehi, ehi, nipote! Lascia che lo zio ti dia una bella spinta, eh?' },
  ares: { name: 'Ares', col: '#e0303a', icon: 'skull', eff: 'Rovina: grande danno ritardato', quote: 'Lascia che la Rovina segua i tuoi passi, giovane Zagreus. Io ne godrò.' },
  aphrodite: { name: 'Afrodite', col: '#ff7ad9', icon: 'heart', eff: 'Debolezza: i nemici fanno −30% danno', quote: 'Oh, tesoro… lascia che ti renda semplicemente irresistibile.' },
  demeter: { name: 'Demetra', col: '#bfe8ff', icon: 'crystal', eff: 'Gelo: rallenta a ogni colpo', quote: 'Il gelo non perdona, bambino. E nemmeno io.' },
  artemis: { name: 'Artemide', col: '#7aff9a', icon: 'bow', eff: 'critici ×3', quote: 'Mira al cuore, cugino. Io non sbaglio mai.' },
};
const BOON_NAMES = {
  zeus: { attack: 'Colpo Fulminante', special: 'Fendente Tonante', cast: 'Lancio Elettrico' },
  poseidon: { attack: 'Colpo della Tempesta', special: 'Colpo della Marea', cast: 'Lancio delle Onde' },
  ares: { attack: 'Maledizione dell\'Agonia', special: 'Maledizione della Pena', cast: 'Lame Lacerate' },
  aphrodite: { attack: 'Colpo Spezzacuori', special: 'Colpo del Desiderio', cast: 'Lancio Infatuato' },
  demeter: { attack: 'Colpo Gelido', special: 'Fendente Glaciale', cast: 'Lancio Invernale' },
  artemis: { attack: 'Colpo Letale', special: 'Colpo del Cacciatore', cast: 'Lancio Sottile' },
};
const SLOT_NAMES = { attack: 'Attacco', special: 'Speciale', cast: 'Lancio' };
const RARITY = ['', 'Comune', 'Raro', 'Epico'];

// --- Tier di minerale del Terrariano --------------------------------------------------------
const TIERS = [
  { n: 'Rame', c: '#c87533' }, { n: 'Ferro', c: '#a8a8b0' }, { n: 'Argento', c: '#d8dde6' }, { n: 'Oro', c: '#f2c230' },
  { n: 'Demonite', c: '#8a6ae0' }, { n: 'Pietra Infernale', c: '#ff6a2a' }, { n: 'Consacrato', c: '#ffe680' }, { n: 'Luminite', c: '#5ff0c0' },
];
const tierMul = w => 1 + 0.18 * (w.lvl - 1);

// =============================================================================
// ARMI
// =============================================================================
const NAIL_DMG = [5, 5, 9, 9, 13, 13, 17, 17];
const NAIL_NAMES = ['Vecchio', 'Vecchio', 'Affilato', 'Affilato', 'Canalizzato', 'Canalizzato', 'Spiralato', 'Spiralato'];

function addSoul(n) { G.p.soul = clamp(G.p.soul + n, 0, 99); }
function canSpend(cost) { const p = G.p; const reserve = (p.hp < p.maxHp && p.soul < 88) ? 33 : 0; return p.soul >= cost + reserve; }

const WEAPONS = {
  // ------------------------------------------------------------------ IL CAVALIERE
  nail: {
    name: 'Aculeo', icon: ['sword', '#f2efe6', '#6b7085'], max: 8, evoName: 'Aculeo Puro',
    lines: ['Fendente nelle 4 direzioni. +11 Anima per nemico colpito', '+12% portata', 'Aculeo Affilato: danno 9', '−8% ricarica', 'Aculeo Canalizzato: danno 13', '+12% portata', 'Aculeo Spiralato: danno 17', '−10% ricarica'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const reach = (24 + (w.lvl >= 2 ? 3 : 0) + (w.lvl >= 6 ? 3 : 0)) * G.s.area * (w.evo ? 1.35 : 1);
      const e = nearest(p.x, p.y, reach + 4);
      if (!e) { w.t = 0.05; return; }
      const [dx, dy] = cardinal(e.x - p.x, e.y - p.y);
      const dmg = (w.evo ? 21 : NAIL_DMG[w.lvl - 1]) * 2.0;
      const hits = arcHit(p.x, p.y, dx, dy, reach, 1.0, dmg, { kb: 150, src: 'nail' });
      if (hits.length) {
        addSoul(Math.min(3, hits.length) * (11 + (owned('soulcatcher') ? 3 : 0)));
        p.rx -= dx * 50; p.ry -= dy * 50;
      }
      fxArc(p.x, p.y, Math.atan2(dy, dx), 1.0, reach * 0.85, w.evo ? '#fffbe0' : '#ffffff', 0.12, 3);
      pose('sword', w.evo ? '#fffbe0' : '#e8e4dc', Math.atan2(dy, dx), 'swing', 0.14);
      if (owned('elegy') && p.hp >= p.maxHp) {
        shoot({ x: p.x, y: p.y, vx: dx * 260, vy: dy * 260, r: 5, dmg: dmg * 0.5, pierce: 4, life: 0.6, kind: 'beam', col: '#ffe680', src: 'nail' });
      }
      if (w.evo) shoot({ x: p.x + dx * 10, y: p.y + dy * 10, vx: dx * 200, vy: dy * 200, r: 6, dmg: dmg * 0.4, pierce: 99, life: 0.35, kind: 'beam', col: '#fffbe0', src: 'nail' });
      setCd(w, (owned('quickslash') ? 0.25 : 0.41) * G.s.cd * (w.lvl >= 4 ? 0.92 : 1) * (w.lvl >= 8 ? 0.9 : 1));
    },
  },
  vspirit: {
    name: 'Spirito Vendicativo', icon: ['ghost', '#e8ecff', '#3a6fe0'], max: 8, evoName: 'Anima d\'Ombra',
    lines: ['Costa 33 Anima: spirito perforante verso la corsia più affollata', '+15% danno', '+20% dimensione', '+15% danno', 'Lancia anche nella direzione opposta', '+15% danno', '+20% velocità', '+20% danno'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      if (!canSpend(33)) { w.t = 0.1; return; }
      const p = G.p;
      const dir = densestCardinal(p.x, p.y, 210, 2);
      if (!dir) { w.t = 0.15; return; }
      addSoul(-33);
      const sh = owned('shaman') ? 1.33 : 1;
      const dmg = 15 * 2.0 * lvMul(w, 0.15) * sh * (w.evo ? 2 : 1);
      p.castT = 0.3;
      const r = 7 * sh * (w.lvl >= 3 ? 1.2 : 1) * (w.evo ? 1.4 : 1) * G.s.area;
      const sp = 230 * (w.lvl >= 7 ? 1.2 : 1);
      const dirs = w.lvl >= 5 ? [dir, [-dir[0], -dir[1]]] : [dir];
      for (const [dx, dy] of dirs) shoot({ x: p.x, y: p.y, vx: dx * sp, vy: dy * sp, r, dmg, pierce: 999, life: 1.3, kind: w.evo ? 'shade' : 'spirit', src: 'vspirit', kb: 80 });
      p.rx -= dir[0] * 40; p.ry -= dir[1] * 40;
      setCd(w, 0.7);
    },
  },
  ddive: {
    name: 'Discesa Desolata', icon: ['wave', '#f2efe6', '#6b7085'], max: 8,
    lines: ['Costa 33 Anima: schianto ad area quando sei circondato', '+15% danno', '+15% area', '+15% danno', 'Stordisce più a lungo', '+15% area', '+15% danno', 'Doppia onda d\'urto'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const r = 62 * G.s.area * (1 + (w.lvl >= 3 ? 0.15 : 0) + (w.lvl >= 6 ? 0.15 : 0));
      let n = 0; GRID.query(p.x, p.y, r * 0.8, () => n++);
      if (n < 6 || !canSpend(33)) { w.t = 0.2; return; }
      addSoul(-33);
      const dmg = 30 * 2.0 * lvMul(w, 0.15);
      aoe(p.x, p.y, r, dmg, { kb: 220, stun: w.lvl >= 5 ? 1 : 0.5 }, '#f2efe6');
      if (w.lvl >= 8) later(() => { if (MODE === 'play') aoe(G.p.x, G.p.y, r * 1.4, dmg * 0.5, { kb: 160 }, '#9aa6b8'); }, 200);
      fxParticles(p.x, p.y, '#f2efe6', 16, 120, 0.4);
      p.jumpT = 0.25; shake(4); sfx('boom');
      setCd(w, 1.6);
    },
  },
  weaver: {
    name: 'Canto delle Tessitrici', icon: ['fly', '#f2efe6', '#0b0910'], max: 8,
    lines: ['Evoca 2 piccole Tessitrici che mordono i nemici', '+15% danno', '+1 Tessitrice', '+15% velocità', '+15% danno', '+1 Tessitrice', '+15% danno', '+1 Tessitrice'],
    update(w, dt) {
      const p = G.p;
      w.ents = w.ents || [];
      const n = 2 + Math.floor(w.lvl / 3);
      while (w.ents.length < n) w.ents.push({ x: p.x, y: p.y, cd: 0, a: rnd(TAU) });
      const sp = 150 * (w.lvl >= 4 ? 1.15 : 1);
      for (const s of w.ents) {
        s.cd -= dt; s.a += dt * 3;
        let tx = p.x + Math.cos(s.a) * 18, ty = p.y + Math.sin(s.a) * 18;
        if (!s.tg || s.tg.dead || d2(s.tg.x, s.tg.y, p.x, p.y) > 170 * 170) s.tg = nearest(s.x, s.y, 150);
        if (s.tg) { tx = s.tg.x; ty = s.tg.y; }
        const [nx, ny] = norm(tx - s.x, ty - s.y);
        s.x += nx * sp * dt; s.y += ny * sp * dt;
        s.fx = nx;
        if (s.tg && s.cd <= 0 && d2(s.x, s.y, s.tg.x, s.tg.y) < (s.tg.r + 4) ** 2) {
          hurtEnemy(s.tg, 6 * 2.0 * lvMul(w, 0.12), { silent: true, src: 'weaver' });
          if (owned('grubsong')) addSoul(3);
          s.cd = 0.4;
        }
      }
    },
    draw(w, c) { for (const s of w.ents || []) drawSpr(c, 'weaverling', s.x, s.y, s.fx < 0); },
  },
  cyclone: {
    name: 'Fendente Ciclone', icon: ['ring', '#f2efe6', '#6b7085'], max: 8,
    lines: ['Arte dell\'Aculeo: rotazione quando ≥4 nemici ti circondano', '+15% danno', '+15% area', '−10% ricarica', '+15% danno', '+1 giro', '+15% area', '+20% danno'],
    update(w, dt) {
      const p = G.p;
      if (w.spin > 0) {
        w.spin -= dt; w.st -= dt;
        if (w.st <= 0) {
          w.st = 0.12;
          const r = 42 * G.s.area * (w.lvl >= 3 ? 1.15 : 1) * (w.lvl >= 7 ? 1.15 : 1);
          aoe(p.x, p.y, r, 9 * 2.0 * lvMul(w, 0.15), { kb: 60, src: 'cyclone' }, null);
          fxArc(p.x, p.y, rnd(TAU), 1.4, r * 0.9, '#ffffff', 0.12, 2);
        }
        return;
      }
      if (!tick(w, dt)) return;
      let n = 0; GRID.query(p.x, p.y, 40, () => n++);
      if (n < 4) { w.t = 0.2; return; }
      w.spin = 0.6 + (w.lvl >= 6 ? 0.25 : 0); w.st = 0;
      setCd(w, 3.4 * G.s.cd * (w.lvl >= 4 ? 0.9 : 1));
    },
  },

  // ------------------------------------------------------------------ V1
  revolver: {
    name: 'Revolver Perforante', icon: ['gun', '#9aa4b8', '#3d6fd6'], max: 8, evoName: 'Marksman Ricoshot', gun: true,
    lines: ['Colpo istantaneo; ogni 3° colpo perfora tutta la linea', '+15% danno', '−8% ricarica', '+15% danno', 'Il colpo caricato è più largo', '+15% danno', '−8% ricarica', '+20% danno'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const e = nearest(p.x, p.y, 250);
      if (!e) { w.t = 0.05; return; }
      w.n = (w.n || 0) + 1;
      const dmg = 12 * lvMul(w, 0.15);
      const [dx, dy] = norm(e.x - p.x, e.y - p.y);
      G.recoilT = 0.08; G.fx.push({ k: 'shell', x: p.x, y: p.y - 4, vx: -p.fx * 40 + rnd(-10, 10), vy: -70, life: 0.5, max: 0.5 });
      const coin = G.coins.find(c => c.life > 0 && d2(c.x, c.y, p.x, p.y) < 170 * 170);
      if (coin) {
        coin.life = 0;
        fxLine(p.x, p.y, coin.x, coin.y, '#ffd23f', 0.12, 2);
        const n = 2 + Math.floor((getW('coin')?.lvl || 1) / 2) + (w.evo ? 3 : 0);
        let cx = coin.x, cy = coin.y; const done = new Set();
        for (let i = 0; i < n; i++) {
          const t = nearest(cx, cy, 220, x => !done.has(x));
          if (!t) break;
          done.add(t);
          fxLine(cx, cy, t.x, t.y, '#ffd23f', 0.15, 2);
          hurtEnemy(t, dmg * 2, { crit: true, critMul: 1.5, src: 'coin' });
          cx = t.x; cy = t.y;
        }
        fxText(coin.x, coin.y - 8, 'RICOSHOT', '#ffd23f', 0.6);
        G.p.style += 25;
      } else if (w.n % 3 === 0) {
        beamHit(p.x, p.y, dx, dy, 320, w.lvl >= 5 ? 6 : 3, dmg * 2.5, { src: 'revolver', kb: 60 });
        fxLine(p.x, p.y, p.x + dx * 320, p.y + dy * 320, '#7ec8ff', 0.18, w.lvl >= 5 ? 4 : 2);
      } else {
        hurtEnemy(e, dmg, { kx: dx, ky: dy, kb: 40, src: 'revolver' });
        fxLine(p.x, p.y, e.x, e.y, '#fff2b0', 0.06, 1);
      }
      sfx('shot');
      setCd(w, 0.42 * G.s.cd * (w.lvl >= 3 ? 0.92 : 1) * (w.lvl >= 7 ? 0.92 : 1));
    },
  },
  coin: {
    name: 'Moneta', icon: ['coin', '#f2c230', '#8a5a2a'], max: 8,
    lines: ['Lancia monete: il Revolver le colpisce e rimbalza sui nemici (Ricoshot)', '−10% ricarica', '+1 rimbalzo', '−10% ricarica', '+1 rimbalzo', '−10% ricarica', '+1 rimbalzo', 'Due monete per lancio'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const evo = getW('revolver')?.evo;
      const n = w.lvl >= 8 ? 2 : 1;
      for (let i = 0; i < n; i++) G.coins.push({ x: p.x + p.fx * 18 + rnd(-6, 6), y: p.y + p.fy * 18 - 6 + rnd(-6, 6), life: 1.4, z: 0 });
      setCd(w, (evo ? 0.8 : 2.4) * G.s.cd * Math.pow(0.9, Math.floor(w.lvl / 2)));
    },
  },
  shotgun: {
    name: 'Shotgun · Core Eject', icon: ['gun', '#c9a06a', '#5a3a2a'], max: 8, gun: true,
    lines: ['Rosa di pallettoni a corto raggio', '+1 pallettone', '+15% danno', 'Ogni 3° colpo espelle un nucleo esplosivo', '+1 pallettone', '+15% danno', '−10% ricarica', 'Nucleo più grande'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const e = nearest(p.x, p.y, 110);
      if (!e) { w.t = 0.1; return; }
      w.n = (w.n || 0) + 1;
      const a0 = Math.atan2(e.y - p.y, e.x - p.x);
      const n = 6 + (w.lvl >= 2 ? 1 : 0) + (w.lvl >= 5 ? 1 : 0);
      const dmg = 7 * lvMul(w, 0.12) * (w.lvl >= 3 ? 1.15 : 1);
      for (let i = 0; i < n; i++) {
        const a = a0 + rnd(-0.32, 0.32), sp = rnd(260, 320);
        shoot({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 2, dmg, pierce: 1, life: 0.35, col: '#ffd27a', src: 'shotgun', kb: 70 });
      }
      if (w.lvl >= 4 && w.n % 3 === 0) {
        const big = w.lvl >= 8 ? 1.4 : 1;
        shoot({ x: p.x, y: p.y, vx: Math.cos(a0) * 140, vy: Math.sin(a0) * 140, r: 4, dmg: 10, pierce: 0, life: 0.55, kind: 'core', col: '#ff8a2a', src: 'shotgun',
          onEnd: pr => { aoe(pr.x, pr.y, 46 * big * G.s.area, 32 * lvMul(w, 0.15), { kb: 160, src: 'shotgun' }, '#ff8a2a'); fxParticles(pr.x, pr.y, '#ffb36a', 14, 120, 0.4); sfx('boom'); },
          onHit: pr => { pr.life = 0; } });
      }
      sfx('shot'); G.recoilT = 0.14; for (let i = 0; i < 2; i++) G.fx.push({ k: 'shell', x: p.x, y: p.y - 4, vx: -p.fx * 40 + rnd(-20, 20), vy: -80, life: 0.5, max: 0.5 });
      setCd(w, 1.25 * G.s.cd * (w.lvl >= 7 ? 0.9 : 1));
    },
  },
  nailgun: {
    name: 'Nailgun · Attractor', icon: ['gun', '#7ec8ff', '#22305a'], max: 8, gun: true,
    lines: ['Raffica di chiodi; si surriscalda', '+15% danno', '+ capacità prima del surriscaldamento', '+15% danno', 'Attractor: i chiodi curvano verso i nemici', '+15% danno', '+ capacità', '+20% danno'],
    update(w, dt) {
      const p = G.p;
      if (w.over > 0) { w.over -= dt; w.heat = 0; return; }
      if (!tick(w, dt)) return;
      const e = nearest(p.x, p.y, 230);
      if (!e) { w.heat = Math.max(0, (w.heat || 0) - 0.5); w.t = 0.1; return; }
      w.heat = (w.heat || 0) + 1;
      const cap = 26 + (w.lvl >= 3 ? 8 : 0) + (w.lvl >= 7 ? 8 : 0);
      if (w.heat >= cap) { w.over = 1.2; fxText(p.x, p.y - 16, 'SURRISCALDATO', '#ff8a2a', 0.6); }
      const a = Math.atan2(e.y - p.y, e.x - p.x) + rnd(-0.08, 0.08);
      shoot({ x: p.x, y: p.y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, r: 2, dmg: 3.2 * lvMul(w, 0.15), life: 0.8, kind: 'nail', col: '#c9ced8', src: 'nailgun', homing: w.lvl >= 5 ? 5 : 0 });
      setCd(w, 0.085 * G.s.cd);
    },
  },
  feedbacker: {
    name: 'Feedbacker', icon: ['shield', '#3d6fd6', '#7ec8ff'], max: 8,
    lines: ['Parry automatico: respinge un proiettile (cura e azzera il Danno Duro) o colpisce chi ti tocca', '−8% ricarica', '+20% danno del parry', '−8% ricarica', 'Raggio di parry più ampio', '+20% danno', '−8% ricarica', 'Il proiettile respinto esplode'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const rad = w.lvl >= 5 ? 34 : 26;
      const b = G.eprojs.find(x => !x.dead && d2(x.x, x.y, p.x, p.y) < rad * rad);
      const dmg = 40 * lvMul(w, 0.2);
      const cd = 5 * G.s.cd * Math.pow(0.92, Math.floor(w.lvl / 2));
      if (b) {
        b.dead = true;
        const t = nearest(p.x, p.y, 250);
        const a = t ? Math.atan2(t.y - p.y, t.x - p.x) : rnd(TAU);
        shoot({ x: p.x, y: p.y, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, r: 5, dmg, pierce: 3, life: 1, col: '#7ec8ff', kind: 'orb', src: 'feedbacker',
          onEnd: w.lvl >= 8 ? pr => aoe(pr.x, pr.y, 40, dmg * 0.6, {}, '#7ec8ff') : null });
        p.hard = 0; healPlayer(p.maxHp);
        fxText(p.x, p.y - 18, 'PARRY', '#7ec8ff', 0.8, true);
        p.style += 60; G.hitStop = 0.08; sfx('evo');
        setCd(w, cd); return;
      }
      const e = nearest(p.x, p.y, 20);
      if (e) {
        const [dx, dy] = norm(e.x - p.x, e.y - p.y);
        hurtEnemy(e, dmg * 0.7, { kx: dx, ky: dy, kb: 320, src: 'feedbacker' });
        fxArc(p.x, p.y, Math.atan2(dy, dx), 0.5, 18, '#7ec8ff', 0.12, 3);
        setCd(w, cd * 0.5); return;
      }
      w.t = 0.03;
    },
  },
  whiplash: {
    name: 'Whiplash', icon: ['boomerang', '#c9ced8', '#3d6fd6'], max: 8,
    lines: ['Rampino: trascina addosso a te il nemico più robusto', '+20% danno all\'arrivo', '−10% ricarica', 'Afferra 2 bersagli', '+20% danno', '−10% ricarica', 'Afferra 3 bersagli', 'Il bersaglio esplode in sangue'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const list = foesIn(p.x, p.y, 220).filter(e => !e.boss && !e.pull && d2(e.x, e.y, p.x, p.y) > 50 * 50).sort((a, b) => b.hp - a.hp);
      if (!list.length) { w.t = 0.3; return; }
      const n = 1 + (w.lvl >= 4 ? 1 : 0) + (w.lvl >= 7 ? 1 : 0);
      const dmg = 22 * lvMul(w, 0.2);
      for (const e of list.slice(0, n)) {
        fxLine(p.x, p.y, e.x, e.y, '#c9ced8', 0.3, 1);
        e.pull = { t: 0.45, cb: t => {
          hurtEnemy(t, dmg, { kb: 0, src: 'whiplash' });
          if (owned('shotgun')) aoe(t.x, t.y, 22, dmg, { src: 'shotgun' }, '#ffd27a');
          if (w.lvl >= 8 && !t.dead && !t.elite) { killEnemy(t, { src: 'whiplash' }); }
        } };
      }
      setCd(w, 5.5 * G.s.cd * Math.pow(0.9, Math.floor(w.lvl / 3)));
    },
  },

  // ------------------------------------------------------------------ ZAGREUS
  stygius: {
    name: 'Stygius', icon: ['sword', '#e2b04a', '#b3262f'], max: 8, slot: 'attack', evoName: 'Aspetto di Artù',
    lines: ['Combo a 3 colpi ad arco (slot Attacco)', '+12% danno', '+12% portata', '+12% danno', 'Combo più rapida', '+12% danno', '+12% portata', '+20% danno'],
    update(w, dt) {
      const p = G.p;
      if (w.evo) {
        G.auraSlow = { r: 70 * G.s.area, v: 0.4 };
        G.dmgTakenMul = Math.min(G.dmgTakenMul, 0.8);
      }
      if (!tick(w, dt)) return;
      const range = 30 * G.s.area * (w.lvl >= 3 ? 1.12 : 1) * (w.lvl >= 7 ? 1.12 : 1) * (w.evo ? 1.4 : 1);
      const e = nearest(p.x, p.y, range + 6);
      if (!e) { w.t = 0.05; return; }
      w.step = ((w.step || 0) + 1) % 3;
      const [dx, dy] = norm(e.x - p.x, e.y - p.y);
      const third = w.step === 2;
      const dmg = (third ? 28 : 18) * lvMul(w, 0.12) * (w.evo ? 1.6 : 1);
      arcHit(p.x, p.y, dx, dy, range, third ? 1.3 : 0.95, dmg, { kb: third ? 220 : 60, src: 'stygius', slot: 'attack' });
      fxArc(p.x, p.y, Math.atan2(dy, dx), third ? 1.3 : 0.95, range * 0.85, w.evo ? '#fff2b0' : '#ff9a5a', 0.13, third ? 4 : 3);
      pose('sword', w.evo ? '#fff2b0' : '#e2b04a', Math.atan2(dy, dx), 'swing', 0.15, w.evo ? 1.4 : 1.15);
      const fast = w.lvl >= 5 ? 0.85 : 1;
      setCd(w, (third ? 0.55 : 0.27) * G.s.cd * fast * (w.evo ? 1.2 : 1));
    },
  },
  nova: {
    name: 'Nova Smash', icon: ['ring', '#ff9a5a', '#b3262f'], max: 8, slot: 'special',
    lines: ['Onda d\'urto circolare che respinge (slot Speciale)', '+15% danno', '+10% area', '−8% ricarica', '+15% danno', '+10% area', '−8% ricarica', '+25% danno'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      let n = 0; GRID.query(p.x, p.y, 50, () => n++);
      if (!n) { w.t = 0.15; return; }
      const r = 50 * G.s.area * (1 + (w.lvl >= 3 ? 0.1 : 0) + (w.lvl >= 6 ? 0.1 : 0));
      aoe(p.x, p.y, r, 24 * lvMul(w, 0.15), { kb: 260, src: 'nova', slot: 'special' }, '#ff9a5a');
      pose('sword', '#e2b04a', 0, 'spin', 0.3, 1.15);
      shake(2);
      setCd(w, 3.4 * G.s.cd * Math.pow(0.92, Math.floor(w.lvl / 4 + (w.lvl >= 7 ? 1 : 0))));
    },
  },
  bloodstone: {
    name: 'Cristallo di Sangue', icon: ['crystal', '#e0303a', '#5a1e24'], max: 8, slot: 'cast',
    lines: ['Lancio: il cristallo si conficca nel nemico e torna dopo un po\' (slot Lancio)', '+15% danno', '+1 cristallo', '+15% danno', 'Il cristallo torna prima', '+1 cristallo', '+15% danno', 'Esplode all\'impatto'],
    update(w, dt) {
      const p = G.p;
      w.lodged = w.lodged || [];
      const max = 1 + (w.lvl >= 3 ? 1 : 0) + (w.lvl >= 6 ? 1 : 0);
      for (const l of w.lodged) { l.t -= dt; if (l.e && l.e.dead && l.t > 1) l.t = 1; }
      w.lodged = w.lodged.filter(l => l.t > 0);
      w.ammo = max - w.lodged.length;
      if (!tick(w, dt) || w.ammo <= 0) return;
      const e = nearest(p.x, p.y, 210);
      if (!e) { w.t = 0.1; return; }
      const [dx, dy] = norm(e.x - p.x, e.y - p.y);
      const dmg = 45 * lvMul(w, 0.15);
      const back = w.lvl >= 5 ? 3 : 5;
      shoot({ x: p.x, y: p.y, vx: dx * 300, vy: dy * 300, r: 3, dmg, life: 0.8, kind: 'stone', col: '#e0303a', src: 'bloodstone', slotTag: 'cast',
        onHit: (pr, t) => { w.lodged.push({ e: t, t: back }); pr.stuck = true; if (w.lvl >= 8) aoe(t.x, t.y, 30, dmg * 0.5, { slot: 'cast' }, '#e0303a'); },
        onEnd: pr => { if (!pr.stuck) w.lodged.push({ e: null, t: 1, x: pr.x, y: pr.y }); } });
      setCd(w, 0.9 * G.s.cd);
    },
    draw(w, c) {
      for (const l of w.lodged || []) {
        const x = l.e && !l.e.dead ? l.e.x : l.x, y = l.e && !l.e.dead ? l.e.y - 6 : l.y;
        if (x === undefined) continue;
        c.fillStyle = '#e0303a'; c.fillRect(Math.round(x - camX) - 1, Math.round(y - camY) - 1, 3, 3);
      }
    },
  },

  // ------------------------------------------------------------------ MADELINE
  dash: {
    name: 'Scatto', icon: ['feather', '#d1343a', '#5fb3ff'], max: 8, evoName: 'Doppio Scatto',
    lines: ['Scatta da sola nella direzione in cui ti muovi, ferendo chi attraversi', '+15% danno', '−8% ricarica', '+15% distanza', '+15% danno', '−8% ricarica', '+15% distanza', '+25% danno'],
    update(w, dt) {
      const p = G.p;
      const maxC = w.evo ? 2 : 1;
      if (p.charges < maxC && !p.dash) {
        p.recharge += dt;
        if (p.recharge >= 0.9 * G.s.cd * Math.pow(0.92, Math.floor(w.lvl / 3))) { p.charges = maxC; p.recharge = 0; }
      }
      if (!tick(w, dt)) return;
      if (p.moving && p.charges > 0 && !p.dash) {
        madelineDash(p.mx, p.my);
        setCd(w, 1.25 * G.s.cd * Math.pow(0.92, Math.floor(w.lvl / 3)));
      } else w.t = 0.05;
    },
  },
  badeline: {
    name: 'Badeline · Una Parte di Me', icon: ['ghost', '#7a3aa0', '#e0303a'], max: 8, evoName: 'Insieme',
    lines: ['La tua ombra ripercorre il tuo cammino 1,2 s dopo, ferendo tutto ciò che tocca', '+15% danno', '+20% dimensione', '+15% danno', 'Ripete anche gli scatti', '+20% dimensione', '+15% danno', '+25% danno'],
    update(w, dt) {
      const h = G.hist;
      const tgt = G.t - 1.2;
      let pt = null;
      for (let i = h.length - 1; i >= 0; i--) if (h[i].t <= tgt) { pt = h[i]; break; }
      if (!pt) return;
      w.x = pt.x; w.y = pt.y; w.fl = pt.fl;
      w.tk = (w.tk || 0) - dt;
      const size = 10 * G.s.area * (w.lvl >= 3 ? 1.2 : 1) * (w.lvl >= 6 ? 1.2 : 1);
      if (w.tk <= 0) {
        w.tk = 0.2;
        const dmg = 8 * lvMul(w, 0.15);
        for (const e of enemiesIn(w.x, w.y, size)) hurtEnemy(e, dmg, { silent: true, src: 'badeline' });
        if (pt.dash && w.lvl >= 5) for (const e of enemiesIn(w.x, w.y, 16)) hurtEnemy(e, dmg * 2.5, { silent: true, src: 'badeline' });
      }
      if (w.evo) {
        w.launch = (w.launch || 12) - dt;
        if (w.launch <= 0) {
          w.launch = 12 * G.s.cd;
          const p = G.p;
          p.invuln = Math.max(p.invuln, 1.1); p.flyHigh = 0.9;
          fxText(p.x, p.y - 20, 'INSIEME!', '#ff7ad9', 1, true);
          { const me = G.p, ar = G.s.area; later(() => { { aoe(me.x, me.y, 110 * ar, 70 * lvMul(w, 0.15), { kb: 300, src: 'badeline' }, '#ff7ad9'); shake(6); sfx('boom'); } }, 850); }
        }
      }
    },
    draw(w, c) { if (w.x !== undefined) { c.globalAlpha = 0.8; drawSpr(c, 'badeline', w.x, w.y, w.fl); c.globalAlpha = 1; } },
  },
  kevin: {
    name: 'Blocchi Kevin', icon: ['block', '#6a6aa0', '#e0303a'], max: 8,
    lines: ['Un blocco arrabbiato carica in linea retta verso i nemici', '+15% danno', '+1 Kevin', '−10% ricarica', '+15% danno', '+1 Kevin', '−10% ricarica', '+25% danno'],
    update(w, dt) {
      w.ents = (w.ents || []).filter(k => k.t > 0);
      for (const k of w.ents) {
        k.t -= dt;
        k.x += k.dx * 300 * dt; k.y += k.dy * 300 * dt;
        for (const e of enemiesIn(k.x, k.y, 8)) if (!k.hit.has(e)) { k.hit.add(e); hurtEnemy(e, k.dmg, { kx: k.dx, ky: k.dy, kb: 200, src: 'kevin' }); }
      }
      if (!tick(w, dt)) return;
      const n = 1 + (w.lvl >= 3 ? 1 : 0) + (w.lvl >= 6 ? 1 : 0);
      for (let i = 0; i < n; i++) spawnKevin(w);
      setCd(w, 3.2 * G.s.cd * Math.pow(0.9, Math.floor(w.lvl / 4 + (w.lvl >= 7 ? 1 : 0))));
    },
    draw(w, c) { for (const k of w.ents || []) drawSpr(c, 'kevin', k.x, k.y, false); },
  },
  core: {
    name: 'Nucleo Caldo/Freddo', icon: ['ring', '#ff6a2a', '#5fb3ff'], max: 8,
    lines: ['Aura che alterna fuoco (danno) e ghiaccio (rallenta)', '+15% danno', '+10% area', '+15% danno', '+10% area', 'Il ghiaccio rallenta di più', '+15% danno', '+15% area'],
    update(w, dt) {
      const p = G.p;
      w.phase = (w.phase || 0) + dt;
      w.hot = Math.floor(w.phase / 4) % 2 === 0;
      w.r = 36 * G.s.area * (1 + (w.lvl >= 3 ? 0.1 : 0) + (w.lvl >= 5 ? 0.1 : 0) + (w.lvl >= 8 ? 0.15 : 0)) * (p.flyT > 0 && owned('feather') ? 2 : 1);
      if (!tick(w, dt)) return;
      for (const e of enemiesIn(p.x, p.y, w.r)) {
        if (w.hot) hurtEnemy(e, 6 * lvMul(w, 0.15), { silent: true, src: 'core' });
        else hurtEnemy(e, 2, { silent: true, slow: w.lvl >= 6 ? 0.65 : 0.5, slowT: 0.5, src: 'core' });
      }
      setCd(w, 0.35);
    },
    draw(w, c) {
      if (!w.r) return;
      c.strokeStyle = w.hot ? 'rgba(255,106,42,.55)' : 'rgba(95,179,255,.55)';
      c.setLineDash([3, 3]); c.lineWidth = 1;
      c.beginPath(); c.arc(Math.round(G.p.x - camX), Math.round(G.p.y - camY), w.r, 0, TAU); c.stroke(); c.setLineDash([]);
    },
  },
  theo: {
    name: 'Selfie di Theo', icon: ['camera', '#c9ced8', '#3a3550'], max: 8,
    lines: ['Flash fotografico: stordisce i nemici in un cono', '+0,2 s stordimento', '+15% portata', '−10% ricarica', '+15% danno', 'Cono più ampio', '−10% ricarica', '+0,4 s stordimento'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const range = 90 * G.s.area * (w.lvl >= 3 ? 1.15 : 1);
      const e = nearest(p.x, p.y, range);
      if (!e) { w.t = 0.2; return; }
      const [dx, dy] = norm(e.x - p.x, e.y - p.y);
      const half = w.lvl >= 6 ? 0.8 : 0.6;
      arcHit(p.x, p.y, dx, dy, range, half, 12 * (w.lvl >= 5 ? 1.15 : 1), { stun: 1.2 + (w.lvl >= 2 ? 0.2 : 0) + (w.lvl >= 8 ? 0.4 : 0), src: 'theo' });
      fxArc(p.x, p.y, Math.atan2(dy, dx), half, range * 0.7, '#ffffff', 0.2, 10);
      fxText(p.x, p.y - 18, '#SELFIE', '#c9ced8', 0.6);
      setCd(w, 4.5 * G.s.cd * Math.pow(0.9, Math.floor(w.lvl / 4 + (w.lvl >= 7 ? 1 : 0))));
    },
  },
  feather: {
    name: 'Piuma Dorata', icon: ['feather', '#ffd23f', '#e2b04a'], max: 8,
    lines: ['Ogni tanto voli: +60% velocità e immunità ai pericoli dello stage', '+0,4 s di volo', '−8% ricarica', '+0,4 s di volo', '−8% ricarica', 'Durante il volo ferisci chi tocchi', '+0,4 s di volo', '−8% ricarica'],
    update(w, dt) {
      const p = G.p;
      if (p.flyT > 0 && w.lvl >= 6) for (const e of enemiesIn(p.x, p.y, 10)) hurtEnemy(e, 10, { silent: true, src: 'feather' });
      if (!tick(w, dt)) return;
      p.flyT = (3 + 0.4 * ((w.lvl >= 2) + (w.lvl >= 4) + (w.lvl >= 7))) * G.s.duration;
      fxRing(p.x, p.y, 4, 30, '#ffd23f', 0.4);
      setCd(w, 16 * G.s.cd * Math.pow(0.92, (w.lvl >= 3) + (w.lvl >= 5) + (w.lvl >= 8)));
    },
  },

  // ------------------------------------------------------------------ IL PRIGIONIERO
  rusty: {
    name: 'Spada Arrugginita', icon: ['sword', '#c87533', '#5a3a2a'], max: 8, color: 'red', evoName: 'Lama del Re',
    lines: ['Combo a 3 colpi: il terzo è sempre critico (Brutalità)', '+12% danno', '+12% portata', '+12% danno', 'Combo più rapida', '+12% danno', '+12% portata', '+20% danno'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const range = 28 * G.s.area * (w.lvl >= 3 ? 1.12 : 1) * (w.lvl >= 7 ? 1.12 : 1) * (w.evo ? 1.2 : 1);
      const e = nearest(p.x, p.y, range + 6);
      if (!e) { w.t = 0.05; return; }
      w.step = ((w.step || 0) + 1) % 3;
      const third = w.step === 2;
      const [dx, dy] = norm(e.x - p.x, e.y - p.y);
      const dmg = 13 * lvMul(w, 0.12) * (w.evo ? 1.5 : 1);
      arcHit(p.x, p.y, dx, dy, range, 0.9, dmg, { crit: third, kb: third ? 150 : 50, src: 'rusty' });
      fxArc(p.x, p.y, Math.atan2(dy, dx), 0.9, range * 0.85, w.evo ? '#ffd23f' : '#ffb07a', 0.12, third ? 4 : 2);
      pose('sword', w.evo ? '#ffd23f' : '#c87533', Math.atan2(dy, dx), 'swing', 0.13);
      if (third && w.evo) shoot({ x: p.x, y: p.y, vx: dx * 280, vy: dy * 280, r: 6, dmg: 40, pierce: 99, life: 0.6, kind: 'blade', col: '#ffd23f', src: 'rusty' });
      setCd(w, (third ? 0.5 : 0.3) * G.s.cd * (w.lvl >= 5 ? 0.85 : 1) * (w.evo ? 0.7 : 1));
    },
  },
  icebow: {
    name: 'Arco di Ghiaccio', icon: ['bow', '#bfe8ff', '#8a5ad0'], max: 8, color: 'purple',
    lines: ['Freccia che congela il primo nemico colpito (Tattica)', '+15% danno', '−8% ricarica', '+1 perforazione', '+15% danno', '−8% ricarica', '+15% danno', '+1 perforazione'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const e = nearest(p.x, p.y, 260);
      if (!e) { w.t = 0.1; return; }
      const [dx, dy] = norm(e.x - p.x, e.y - p.y);
      shoot({ x: p.x, y: p.y, vx: dx * 360, vy: dy * 360, r: 3, dmg: 16 * lvMul(w, 0.15), pierce: (w.lvl >= 4) + (w.lvl >= 8), life: 0.9, kind: 'arrow', col: '#bfe8ff', freeze: 1, src: 'icebow' });
      setCd(w, 1.0 * G.s.cd * Math.pow(0.92, (w.lvl >= 3) + (w.lvl >= 6)));
    },
  },
  whip: {
    name: 'Frusta Elettrica', icon: ['bolt', '#8a5ad0', '#ffe066'], max: 8, color: 'purple',
    lines: ['Frustata lunga che scarica elettricità sui vicini (Tattica)', '+15% danno', '+15% portata', '+1 catena', '+15% danno', '+15% portata', '+1 catena', '+25% danno'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const len = 90 * G.s.area * (w.lvl >= 3 ? 1.15 : 1) * (w.lvl >= 6 ? 1.15 : 1);
      const e = nearest(p.x, p.y, len);
      if (!e) { w.t = 0.1; return; }
      const [dx, dy] = norm(e.x - p.x, e.y - p.y);
      const dmg = 10 * lvMul(w, 0.15);
      const hits = beamHit(p.x, p.y, dx, dy, len, 4, dmg, { src: 'whip' });
      fxBolt(p.x, p.y, p.x + dx * len, p.y + dy * len, '#c9a6ff', 0.12);
      for (const h of hits) {
        if (h.freezeT > 0 && owned('icebow')) { h.freezeT = 0; aoe(h.x, h.y, 30, 30, { src: 'whip' }, '#bfe8ff'); fxText(h.x, h.y - 10, 'FRANTUMATO', '#bfe8ff', 0.5); }
      }
      if (hits[0]) chainLightning(hits[0].x, hits[0].y, 1 + (w.lvl >= 4) + (w.lvl >= 7), 50, dmg * 0.6, {}, hits[0]);
      setCd(w, 0.7 * G.s.cd);
    },
  },
  turret: {
    name: 'Doppia Balestromatica', icon: ['block', '#8a5ad0', '#5a3a2a'], max: 8, color: 'purple',
    lines: ['Piazza una torretta che spara al nemico più vicino (Tattica)', '+15% danno', '+1 torretta', '+15% danno', '−10% ricarica', '+1 torretta', '+15% danno', '+25% durata'],
    update(w, dt) {
      w.ents = (w.ents || []).filter(t => t.life > 0);
      const dmg = 8 * lvMul(w, 0.15);
      for (const t of w.ents) {
        t.life -= dt; t.cd -= dt;
        if (t.cd <= 0) {
          const e = nearest(t.x, t.y, 200);
          if (e) { const [dx, dy] = norm(e.x - t.x, e.y - t.y); shoot({ x: t.x, y: t.y - 3, vx: dx * 330, vy: dy * 330, r: 2, dmg, life: 0.7, kind: 'arrow', col: '#c9a6ff', src: 'turret' }); t.cd = 0.45; }
        }
      }
      if (!tick(w, dt)) return;
      const max = 1 + (w.lvl >= 3) + (w.lvl >= 6) + ((G.p.scrolls?.purple || 0) >= 3 ? 1 : 0);
      if (w.ents.length >= max) w.ents.shift();
      w.ents.push({ x: G.p.x, y: G.p.y + 4, life: 8 * G.s.duration * (w.lvl >= 8 ? 1.25 : 1), cd: 0.2 });
      setCd(w, 6.5 * G.s.cd * (w.lvl >= 5 ? 0.9 : 1));
    },
    draw(w, c) { for (const t of w.ents || []) drawSpr(c, 'turret', t.x, t.y, false); },
  },
  grenade: {
    name: 'Granata Incendiaria', icon: ['flame', '#ff8a2a', '#5a1e24'], max: 8, color: 'red',
    lines: ['Granata lanciata sul gruppo più denso: lascia fiamme (Brutalità)', '+15% danno', '+15% area', '−10% ricarica', '+15% danno', '+15% area', '−10% ricarica', 'Due granate'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const n = w.lvl >= 8 ? 2 : 1;
      let any = false;
      for (let i = 0; i < n; i++) {
        const e = densest(p.x, p.y, 180);
        if (!e) break;
        any = true;
        throwFire(p.x, p.y, e.x + rnd(-10, 10), e.y + rnd(-10, 10), 30 * G.s.area * (1 + 0.15 * ((w.lvl >= 3) + (w.lvl >= 6))), 5 * lvMul(w, 0.15), 'grenade');
      }
      if (!any) { w.t = 0.2; return; }
      setCd(w, 3.2 * G.s.cd * Math.pow(0.9, (w.lvl >= 4) + (w.lvl >= 7)));
    },
  },
  homunculus: {
    name: 'Runa dell\'Homunculus', icon: ['flame', '#57d6c8', '#2f3a22'], max: 8, color: 'green',
    lines: ['La tua testa si stacca, vola sul nemico e lo morde (Sopravvivenza)', '+15% danno', '+1 morso', '−10% ricarica', '+15% danno', '+1 morso', '−10% ricarica', '+25% danno'],
    update(w, dt) {
      const p = G.p;
      const h = w.head;
      if (h) {
        h.t -= dt;
        if (h.phase === 'go') {
          if (!h.tg || h.tg.dead) h.phase = 'back';
          else { const [nx, ny] = norm(h.tg.x - h.x, h.tg.y - h.y); h.x += nx * 320 * dt; h.y += ny * 320 * dt; if (d2(h.x, h.y, h.tg.x, h.tg.y) < 100) { h.phase = 'bite'; h.t = 0; } }
        } else if (h.phase === 'bite') {
          if (h.tg && !h.tg.dead) { h.x = h.tg.x; h.y = h.tg.y - 4; }
          if (h.t <= 0) {
            h.bites--; h.t = 0.25;
            for (const e of enemiesIn(h.x, h.y, 14)) hurtEnemy(e, 18 * lvMul(w, 0.15), { src: 'homunculus' });
            if (owned('necro')) healPlayer(0.8);
            fxParticles(h.x, h.y, '#57d6c8', 4, 50, 0.3);
            if (h.bites <= 0 || !h.tg || h.tg.dead) h.phase = 'back';
          }
        } else {
          const [nx, ny] = norm(p.x - h.x, p.y - 8 - h.y); h.x += nx * 340 * dt; h.y += ny * 340 * dt;
          if (d2(h.x, h.y, p.x, p.y - 8) < 64) { w.head = null; p.headless = false; }
        }
        return;
      }
      if (!tick(w, dt)) return;
      const e = nearest(p.x, p.y, 170);
      if (!e) { w.t = 0.2; return; }
      w.head = { x: p.x, y: p.y - 8, tg: e, phase: 'go', bites: 3 + (w.lvl >= 3) + (w.lvl >= 6), t: 0 };
      p.headless = true;
      setCd(w, 4 * G.s.cd * Math.pow(0.9, (w.lvl >= 4) + (w.lvl >= 7)));
    },
    draw(w, c) { if (w.head) drawSpr(c, 'homunculus', w.head.x, w.head.y, false); },
  },

  // ------------------------------------------------------------------ IL PENITENTE
  meaculpa: {
    name: 'Mea Culpa', icon: ['sword', '#c9a43a', '#5a3d22'], max: 8, evoName: 'Mea Culpa Ardente',
    lines: ['Ampi fendenti. Giustizia gli élite indeboliti (Esecuzione) e genera Fervore', '+12% danno', '+12% portata', '−8% ricarica', '+12% danno', 'Esecuzione sotto il 30%', '+12% portata', '+20% danno'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const range = 36 * G.s.area * (w.lvl >= 3 ? 1.12 : 1) * (w.lvl >= 7 ? 1.12 : 1);
      const e = nearest(p.x, p.y, range + 6);
      if (!e) { w.t = 0.05; return; }
      const [dx, dy] = norm(e.x - p.x, e.y - p.y);
      const dmg = 22 * lvMul(w, 0.12);
      const exec = w.lvl >= 6 ? 0.3 : 0.2;
      const elite = enemiesIn(p.x, p.y, range).find(x => x.elite && !x.boss && x.hp < x.maxHp * exec);
      if (elite) {
        p.invuln = Math.max(p.invuln, 0.7);
        G.hitStop = 0.15;
        fxText(elite.x, elite.y - 16, 'ESECUZIONE', '#e2b04a', 1, true);
        fxParticles(elite.x, elite.y, '#c41e2a', 30, 140, 0.6, 2);
        killEnemy(elite, { src: 'meaculpa' });
        if (w.evo) aoe(elite.x, elite.y, 60, 60, { src: 'meaculpa' }, '#ff8a2a');
        addFervour(40); shake(5); sfx('boom');
        setCd(w, 0.5); return;
      }
      const hits = arcHit(p.x, p.y, dx, dy, range, 1.2, dmg, { kb: 90, src: 'meaculpa', burn: w.evo ? 5 : 0 });
      addFervour(Math.min(3, hits.length) * 3);
      w.side = !w.side;
      fxArc(p.x, p.y, Math.atan2(dy, dx) + (w.side ? 0.2 : -0.2), 1.2, range * 0.85, w.evo ? '#ff8a2a' : '#e2c46a', 0.14, 3);
      pose('sword', w.evo ? '#ff8a2a' : '#d9b43a', Math.atan2(dy, dx), 'swing', 0.2, 1.5);
      const fast = G.p.tientoT > 0 && owned('tiento') ? 0.6 : 1;
      setCd(w, 0.62 * G.s.cd * (w.lvl >= 4 ? 0.92 : 1) * fast);
    },
  },
  verdiales: {
    name: 'Verdiales della Borgata Abbandonata', icon: ['wave', '#e2c46a', '#5a3d22'], max: 8, prayer: 40,
    lines: ['Preghiera (40 Fervore): due onde corrono sul terreno', '+15% danno', '−4 Fervore', '+20% gittata', '+15% danno', 'Quattro onde (anche in verticale)', '−4 Fervore', '+25% danno'],
    update(w, dt) {
      if (!prayerReady(w)) return;
      const p = G.p;
      const dirs = w.lvl >= 6 ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 0], [-1, 0]];
      if (!densestCardinal(p.x, p.y, 200, 3)) return;
      castPrayer(w);
      const dmg = 40 * lvMul(w, 0.15);
      for (const [dx, dy] of dirs) shoot({ x: p.x, y: p.y, vx: dx * 240, vy: dy * 240, r: 9, dmg, pierce: 999, life: 1 * (w.lvl >= 4 ? 1.2 : 1), kind: 'wave', col: '#e2c46a', src: 'verdiales', kb: 120 });
    },
  },
  taranto: {
    name: 'Taranto a mia Sorella', icon: ['bolt', '#bfe4ff', '#5a3d22'], max: 8, prayer: 30,
    lines: ['Preghiera (30 Fervore): fulmini cadono sui nemici', '+15% danno', '+1 fulmine', '−3 Fervore', '+15% danno', '+1 fulmine', '+15% danno', '+2 fulmini'],
    update(w, dt) {
      if (!prayerReady(w)) return;
      const p = G.p;
      const list = foesIn(p.x, p.y, 220);
      if (list.length < 3) return;
      castPrayer(w);
      const n = 4 + (w.lvl >= 3) + (w.lvl >= 6) + (w.lvl >= 8 ? 2 : 0);
      const dmg = 45 * lvMul(w, 0.15);
      for (let i = 0; i < n; i++) {
        const t = pick(list);
        later(() => { if (t.dead) return; fxBolt(t.x + rnd(-10, 10), t.y - 160, t.x, t.y, '#ffffff', 0.18); aoe(t.x, t.y, 16, dmg, { stun: 0.3, src: 'taranto' }, '#bfe4ff'); }, i * 80);
      }
      if (owned('debla')) for (const pl of G.pillars) later(() => { { fxBolt(pl.x, pl.y - 160, pl.x, pl.y); aoe(pl.x, pl.y, 18, dmg, { src: 'taranto' }, '#fff2b0'); } }, 100);
    },
  },
  debla: {
    name: 'Debla delle Luci', icon: ['star', '#fff2b0', '#e2b04a'], max: 8, prayer: 35,
    lines: ['Preghiera (35 Fervore): colonne di luce attorno a te', '+15% danno', '+2 colonne', '+25% durata', '+15% danno', '+2 colonne', '−4 Fervore', '+25% danno'],
    update(w, dt) {
      G.pillars = G.pillars.filter(pl => (pl.t -= dt) > 0);
      for (const pl of G.pillars) {
        pl.k -= dt;
        if (pl.k <= 0) { pl.k = 0.4; for (const e of enemiesIn(pl.x, pl.y, 16 * G.s.area)) hurtEnemy(e, pl.dmg, { silent: true, src: 'debla' }); }
      }
      if (!prayerReady(w)) return;
      const p = G.p;
      let n0 = 0; GRID.query(p.x, p.y, 80, () => n0++);
      if (n0 < 5) return;
      castPrayer(w);
      const n = 6 + (w.lvl >= 3 ? 2 : 0) + (w.lvl >= 6 ? 2 : 0);
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU;
        G.pillars.push({ x: p.x + Math.cos(a) * 60, y: p.y + Math.sin(a) * 60, t: 2.2 * G.s.duration * (w.lvl >= 4 ? 1.25 : 1), k: 0, dmg: 14 * lvMul(w, 0.15) });
      }
    },
  },
  tiento: {
    name: 'Tiento ai tuoi Capelli di Spine', icon: ['shield', '#c9a43a', '#5a3d22'], max: 8, prayer: 45,
    lines: ['Preghiera (45 Fervore): −70% danno subito e spine per qualche secondo', '+0,5 s', '−4 Fervore', '+0,5 s', 'Le spine fanno più male', '+0,5 s', '−4 Fervore', '+1 s'],
    update(w, dt) {
      const p = G.p;
      if (p.tientoT > 0) {
        p.tientoT -= dt;
        G.dmgTakenMul = Math.min(G.dmgTakenMul, 0.3);
        w.k = (w.k || 0) - dt;
        if (w.k <= 0) { w.k = 0.3; for (const e of enemiesIn(p.x, p.y, 16)) hurtEnemy(e, w.lvl >= 4 ? 14 : 8, { silent: true, src: 'tiento' }); }
        return;
      }
      if (!prayerReady(w)) return;
      let n = 0; GRID.query(p.x, p.y, 60, () => n++);
      if (p.hp > p.maxHp * 0.6 && n < 12) return;
      castPrayer(w);
      p.tientoT = (5 + 0.5 * ((w.lvl >= 2) + (w.lvl >= 4) + (w.lvl >= 5)) + (w.lvl >= 8 ? 1 : 0)) * G.s.duration;
    },
  },

  // ------------------------------------------------------------------ IL TERRARIANO
  shortsword: {
    name: 'Spada Corta', icon: ['sword', '#c87533', '#5a3a2a'], max: 8, tiers: true, evoName: 'ZENITH',
    lines: ['Affondo rapido verso il nemico più vicino'],
    update(w, dt) {
      const p = G.p;
      if (w.evo) return zenithUpdate(w, dt);
      if (!tick(w, dt)) return;
      const range = 26 * G.s.area;
      const e = nearest(p.x, p.y, range + 4);
      if (!e) { w.t = 0.05; return; }
      const [dx, dy] = norm(e.x - p.x, e.y - p.y);
      beamHit(p.x, p.y, dx, dy, range, 4, 10 * tierMul(w), { kb: 40, src: 'shortsword' });
      fxLine(p.x + dx * 6, p.y + dy * 6, p.x + dx * range, p.y + dy * range, TIERS[w.lvl - 1].c, 0.08, 2);
      pose('sword', TIERS[w.lvl - 1].c, Math.atan2(dy, dx), 'stab', 0.12);
      setCd(w, 0.26 * G.s.cd * (1 - 0.03 * w.lvl));
    },
    draw(w, c) { if (w.evo) zenithDraw(w, c); },
  },
  boomerang: {
    name: 'Boomerang Incantato', icon: ['boomerang', '#5fb3ff', '#22305a'], max: 8, tiers: true,
    lines: ['Va e torna, perforando tutto'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const e = nearest(p.x, p.y, 200);
      if (!e) { w.t = 0.1; return; }
      const n = 1 + (w.lvl >= 4) + (w.lvl >= 8);
      for (let i = 0; i < n; i++) {
        const a = Math.atan2(e.y - p.y, e.x - p.x) + (i - (n - 1) / 2) * 0.5;
        shoot({ x: p.x, y: p.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, r: 5, dmg: 16 * tierMul(w), pierce: 999, life: 1.4, kind: 'boomerang', col: TIERS[w.lvl - 1].c, src: 'boomerang', age: 0,
          update: pr => { pr.age += 1 / 60; if (pr.age > 0.45) { const [nx, ny] = norm(G.p.x - pr.x, G.p.y - pr.y); pr.vx = nx * 300; pr.vy = ny * 300; if (!pr.back) { pr.back = true; pr.hit.clear(); } if (d2(pr.x, pr.y, G.p.x, G.p.y) < 80) pr.dead = true; } } });
      }
      setCd(w, 1.3 * G.s.cd);
    },
  },
  starfury: {
    name: 'Furia Stellare', icon: ['star', '#ffd23f', '#ff7ad9'], max: 8, tiers: true,
    lines: ['Stelle cadono dal cielo sui nemici'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const list = foesIn(p.x, p.y, 200);
      if (!list.length) { w.t = 0.2; return; }
      const n = 1 + Math.floor(w.lvl / 3);
      for (let i = 0; i < n; i++) {
        const t = pick(list);
        const sx = t.x - 70, sy = t.y - 150;
        shoot({ x: sx, y: sy, vx: 70 / 0.35, vy: 150 / 0.35, r: 4, dmg: 0, life: 0.35, kind: 'star', col: '#ffd23f', noHit: true,
          onEnd: pr => { aoe(pr.x, pr.y, 18 * G.s.area, 20 * tierMul(w), { src: 'starfury' }, '#ffd23f'); if (owned('manaflower')) G.p.mana = Math.min(100, G.p.mana + 3); } });
      }
      setCd(w, 1.0 * G.s.cd * (1 - 0.05 * w.lvl));
    },
  },
  waterbolt: {
    name: 'Dardo d\'Acqua', icon: ['orb', '#4ac0ff', '#22305a'], max: 8, tiers: true, mana: 8,
    lines: ['Magia (8 mana): rimbalza da un nemico all\'altro'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const cost = 8 * (owned('manaflower') ? 0.7 : 1);
      const e = nearest(p.x, p.y, 220);
      if (!e || p.mana < cost) { w.t = 0.15; return; }
      p.mana -= cost;
      const [dx, dy] = norm(e.x - p.x, e.y - p.y);
      shoot({ x: p.x, y: p.y, vx: dx * 230, vy: dy * 230, r: 4, dmg: 14 * tierMul(w), pierce: 4 + w.lvl, life: 2.5, kind: 'orb', col: '#4ac0ff', src: 'waterbolt',
        onHit: (pr, t) => { const n = nearest(pr.x, pr.y, 140, x => !pr.hit.has(x)); if (n) { const [nx, ny] = norm(n.x - pr.x, n.y - pr.y); pr.vx = nx * 230; pr.vy = ny * 230; } } });
      setCd(w, 0.9 * G.s.cd);
    },
  },
  beekeeper: {
    name: 'Apicoltore', icon: ['bee', '#ffd23f', '#2a1a12'], max: 8, tiers: true,
    lines: ['Fendente che libera api a ricerca'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const range = 30 * G.s.area;
      const e = nearest(p.x, p.y, range + 6);
      if (!e) { w.t = 0.05; return; }
      const [dx, dy] = norm(e.x - p.x, e.y - p.y);
      const hits = arcHit(p.x, p.y, dx, dy, range, 1.0, 20 * tierMul(w), { kb: 60, src: 'beekeeper' });
      fxArc(p.x, p.y, Math.atan2(dy, dx), 1.0, range * 0.85, '#ffd23f', 0.12, 3);
      pose('bee', TIERS[w.lvl - 1].c, Math.atan2(dy, dx), 'over', 0.25, 1.2);
      if (hits.length) for (let i = 0; i < 1 + Math.floor(w.lvl / 3); i++) {
        const a = rnd(TAU);
        shoot({ x: p.x, y: p.y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, r: 2, dmg: 5 * tierMul(w), life: 2, kind: 'bee', homing: 6, src: 'beekeeper' });
      }
      setCd(w, 0.75 * G.s.cd);
    },
  },
  minishark: {
    name: 'Minishark', icon: ['gun', '#8a9ab0', '#3a4450'], max: 8, tiers: true,
    lines: ['Mitragliatrice ad altissima cadenza'],
    update(w, dt) {
      if (!tick(w, dt)) return;
      const p = G.p;
      const e = nearest(p.x, p.y, 220);
      if (!e) { w.t = 0.1; return; }
      const a = Math.atan2(e.y - p.y, e.x - p.x) + rnd(-0.06, 0.06);
      shoot({ x: p.x, y: p.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, r: 2, dmg: 4 * tierMul(w), life: 0.6, kind: 'nail', col: '#ffe680', src: 'minishark' });
      setCd(w, 0.11 * G.s.cd);
    },
  },

  // ------------------------------------------------------------------ ISAAC
  tears: {
    name: 'Le Lacrime', icon: ['eye', '#7fb8ff', '#22305a'], max: 1,
    lines: ['Spara lacrime solo nelle 4 direzioni cardinali. Ogni oggetto le trasforma'],
    update(w, dt) { isaacTears(w, dt); },
    draw(w, c) {
      for (const f of G.flies) drawSpr(c, 'fly', f.x, f.y, false);
      if (w.beam) {
        const b = w.beam;
        c.fillStyle = 'rgba(224,48,58,.85)';
        for (const [dx, dy] of b.dirs) {
          const x = Math.round(G.p.x - camX), y = Math.round(G.p.y - camY) - 2;
          if (Math.abs(dx) > Math.abs(dy) * 2) c.fillRect(dx > 0 ? x : x - 280, y - 4, 280, 8);
          else if (Math.abs(dy) > Math.abs(dx) * 2) c.fillRect(x - 4, dy > 0 ? y : y - 280, 8, 280);
          else { c.strokeStyle = 'rgba(224,48,58,.85)'; c.lineWidth = 8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx * 280, y + dy * 280); c.stroke(); }
        }
      }
    },
  },
};

// --- Aiuti specifici --------------------------------------------------------------------------
function madelineDash(dx, dy) {
  const p = G.p;
  if (!dx && !dy) { dx = p.fx; dy = p.fy; }
  const w = getW('dash');
  [dx, dy] = norm(dx, dy);
  p.charges--;
  p.dash = { t: 0.15, dx, dy, sp: 440 * (1 + 0.15 * ((w.lvl >= 4) + (w.lvl >= 7))), hit: new Set(), dmg: 22 * lvMul(w, 0.15) * (w.lvl >= 8 ? 1.25 : 1) };
  p.invuln = Math.max(p.invuln, 0.2);
  G.hist.push({ x: p.x, y: p.y, t: G.t, dash: true, fl: dx < 0 });
  fxParticles(p.x, p.y, '#ffffff', 6, 60, 0.25);
  if (owned('kevin')) { const k = getW('kevin'); spawnKevin(k, dx, dy); }
}
function spawnKevin(w, fdx, fdy) {
  const p = G.p;
  let dx = fdx, dy = fdy;
  if (dx === undefined) { const e = nearest(p.x, p.y, 220); if (!e) return; [dx, dy] = cardinal(e.x - p.x, e.y - p.y); }
  else [dx, dy] = cardinal(dx, dy);
  w.ents = w.ents || [];
  w.ents.push({ x: p.x + rnd(-10, 10), y: p.y + rnd(-10, 10), dx, dy, t: 0.8, hit: new Set(), dmg: 28 * lvMul(w, 0.15) * (w.lvl >= 8 ? 1.25 : 1) });
}
function throwFire(x0, y0, x, y, r, dmg, src) {
  shoot({ x: x0, y: y0, vx: (x - x0) / 0.5, vy: (y - y0) / 0.5, r: 3, dmg: 0, life: 0.5, kind: 'core', col: '#ff8a2a', noHit: true,
    onEnd: pr => { G.zones.push({ type: 'fire', x: pr.x, y: pr.y, r, t: 3 * G.s.duration, k: 0, dmg, src }); fxParticles(pr.x, pr.y, '#ff8a2a', 10, 80, 0.4); } });
}
function addFervour(n) {
  const p = G.p;
  const mul = (1 + 0.25 * plvl('bluewax')) * (G.guilt ? 0.7 : 1);
  p.fervour = Math.min(100, p.fervour + n * mul);
}
function prayerReady(w) {
  const cost = prayerCost(w);
  return G.prayerLock <= 0 && G.p.fervour >= cost;
}
function prayerCost(w) {
  const base = WEAPONS[w.id].prayer;
  const cut = { verdiales: 4 * ((w.lvl >= 3) + (w.lvl >= 7)), taranto: 3 * (w.lvl >= 4), debla: 4 * (w.lvl >= 7), tiento: 4 * ((w.lvl >= 3) + (w.lvl >= 7)) }[w.id] || 0;
  return base - cut;
}
function castPrayer(w) {
  G.p.fervour -= prayerCost(w);
  G.prayerLock = 0.8;
  w.cdMax = 1; w.t = 0;
  w.flash = 0.6;
  fxText(G.p.x, G.p.y - 22, WEAPONS[w.id].name.split(' ')[0].toUpperCase(), '#e2c46a', 0.9);
  fxRing(G.p.x, G.p.y, 4, 26, '#e2c46a', 0.35);
  G.p.castT = 0.5; G.p.castCol = '#e2c46a';
}

function zenithUpdate(w, dt) {
  const p = G.p;
  w.swords = (w.swords || []).filter(s => s.t < 1);
  for (const s of w.swords) {
    s.t += dt / s.dur;
    if (s.tg && !s.tg.dead) { s.ex = s.tg.x; s.ey = s.tg.y; }
    const out = s.t < 0.5, v = out ? s.t * 2 : (s.t - 0.5) * 2;
    const ax = out ? p.x : s.ex, ay = out ? p.y : s.ey, zx = out ? s.ex : p.x, zy = out ? s.ey : p.y;
    const mx = (ax + zx) / 2 + (out ? s.cx : -s.cx), my = (ay + zy) / 2 + (out ? s.cy : -s.cy);
    s.x = (1 - v) * (1 - v) * ax + 2 * (1 - v) * v * mx + v * v * zx;
    s.y = (1 - v) * (1 - v) * ay + 2 * (1 - v) * v * my + v * v * zy;
    for (const e of enemiesIn(s.x, s.y, 9)) if (!s.hit.has(e)) { s.hit.add(e); hurtEnemy(e, 45 * tierMul(w), { silent: true, src: 'shortsword' }); }
  }
  if (!tick(w, dt)) return;
  const e = nearest(p.x, p.y, 260);
  if (!e) { w.t = 0.1; return; }
  if (w.swords.length < 7) {
    const list = foesIn(p.x, p.y, 260);
    const tg = pick(list) || e;
    w.swords.push({ tg, ex: tg.x, ey: tg.y, t: 0, dur: 0.55, cx: rnd(-80, 80), cy: rnd(-80, 80), x: p.x, y: p.y, hit: new Set(), col: TIERS[Math.floor(rnd(8))].c });
  }
  setCd(w, 0.16 * G.s.cd);
}
function zenithDraw(w, c) {
  for (const s of w.swords || []) {
    const x = Math.round(s.x - camX), y = Math.round(s.y - camY);
    c.save(); c.translate(x, y); c.rotate(s.t * 14);
    c.drawImage(icon('sword', s.col, '#14101a'), -5, -5);
    c.restore();
  }
}

function isaacStats() {
  const s = { dmg: 3.5, tears: 2.73, range: 6.5, shot: 1, speed: 1, luck: 0, dmgMul: 1, tearsMul: 1 };
  const b = G.p.ist;
  s.dmg += b.dmg; s.tears += b.tears; s.range += b.range; s.shot += b.shot; s.speed += b.speed; s.luck += b.luck;
  for (const it of G.passives) if (ISAAC_ITEMS[it.id]) ISAAC_ITEMS[it.id].apply(s);
  s.realDmg = s.dmg * s.dmgMul * 2.6;
  s.realTears = s.tears * s.tearsMul;
  return s;
}
function isaacTears(w, dt) {
  const p = G.p;
  const st = G.ist;
  const range = st.range * 30;
  // Mosche blu (Guppy)
  for (const f of G.flies) {
    f.life -= dt;
    if (!f.tg || f.tg.dead) f.tg = nearest(f.x, f.y, 150);
    const tx = f.tg ? f.tg.x : p.x + Math.cos(G.t * 3 + f.a) * 16, ty = f.tg ? f.tg.y : p.y + Math.sin(G.t * 3 + f.a) * 16;
    const [nx, ny] = norm(tx - f.x, ty - f.y); f.x += nx * 140 * dt; f.y += ny * 140 * dt;
    if (f.tg && d2(f.x, f.y, f.tg.x, f.tg.y) < (f.tg.r + 3) ** 2) { hurtEnemy(f.tg, 4, { silent: true }); f.life = 0; }
  }
  G.flies = G.flies.filter(f => f.life > 0);
  if (owned('guppyhead')) { G.flyT = (G.flyT || 0) - dt; if (G.flyT <= 0) { G.flyT = 6; for (let i = 0; i < 2; i++) G.flies.push({ x: p.x, y: p.y, life: 8, a: rnd(TAU) }); } }
  if (w.beam) { w.beam.t -= dt; if (w.beam.t <= 0) w.beam = null; }
  if (!tick(w, dt)) return;
  const e = nearest(p.x, p.y, owned('brimstone') ? 260 : range);
  if (!e) { w.t = 0.05; return; }
  const aimed = owned('spoon') && owned('brimstone');
  const [cx, cy] = aimed ? norm(e.x - p.x, e.y - p.y) : cardinal(e.x - p.x, e.y - p.y);
  const triple = owned('innereye');
  if (owned('brimstone')) {
    const dirs = [[cx, cy]];
    if (triple) { const a = Math.atan2(cy, cx); dirs.push([Math.cos(a + 0.25), Math.sin(a + 0.25)], [Math.cos(a - 0.25), Math.sin(a - 0.25)]); }
    w.beam = { t: 0.3, dirs };
    for (const [dx, dy] of dirs) beamHit(p.x, p.y - 2, dx, dy, 280, 5, st.realDmg * 3.2, { src: 'tears', kb: 60 });
    shake(2); sfx('boom');
    setCd(w, Math.max(0.35, 2.4 / st.realTears));
    return;
  }
  const big = owned('polyphemus');
  const sp = 200 * st.shot;
  const spread = triple ? [-0.18, 0, 0.18] : [0];
  for (const off of spread) {
    const a = Math.atan2(cy, cx) + off;
    shoot({ x: p.x, y: p.y - 3, vx: Math.cos(a) * sp + p.vx * 0.3, vy: Math.sin(a) * sp + p.vy * 0.3, r: big ? 5 : 3, dmg: st.realDmg, pierce: big ? 1 : 0, life: range / sp,
      kind: 'tear', col: '#7fb8ff', big, src: 'tears', homing: owned('spoon') ? 5 : 0,
      onHit: () => { if (G.guppy && G.flies.length < 14) G.flies.push({ x: p.x, y: p.y, life: 5, a: rnd(TAU) }); } });
  }
  setCd(w, 1 / st.realTears);
}

// =============================================================================
// PERSONAGGI
// =============================================================================
const CHARS = {
  knight: {
    id: 'knight', name: 'Il Cavaliere', game: 'Hollow Knight', spr: 'knight', gem: 'geo', hpMode: 'masks', hp: 5, speed: 78, iframes: 1.0,
    start: 'nail', weapons: ['nail', 'vspirit', 'ddive', 'weaver', 'cyclone'], passives: [...UNIVERSAL, 'pale'], charms: ['soulcatcher', 'shaman', 'grubsong', 'elegy', 'quickslash'],
    maxW: 5, maxP: 6, diff: 2,
    resource: 'Anima (vaso da 99)', life: '5 Maschere',
    abilityName: 'Focus', abilityHint: 'Tieni premuto da fermo: spende 33 Anima e cura 1 Maschera',
    blurb: 'Muto, minuscolo, inarrestabile. Ogni fendente riempie il vaso d\'Anima; l\'Anima diventa incantesimi o cure. Fermarsi a curarsi in mezzo all\'orda è una scommessa.',
    quote: '…', voice: 'Non parla. Solo un piccolo «Hm!» allo scatto.',
    init(p) { p.soul = 0; p.focusT = 0; p.notches = 5; },
    ability(dt, held) {
      const p = G.p;
      const auto = SET.autoAbility && G.hitT > 1 && p.still > 0.45;
      if ((held || auto) && !p.moving && p.hp < p.maxHp && (p.focusT > 0 || p.soul >= 33)) {
        p.focusT += dt;
        p.soul = Math.max(0, p.soul - 33 * dt / 1.0);
        if (p.focusT >= 1.0) { p.focusT = 0; p.hp = Math.min(p.maxHp, p.hp + 1); fxRing(p.x, p.y, 20, 4, '#ffffff', 0.4); fxText(p.x, p.y - 18, '+1 MASCHERA', '#ffffff', 0.8); sfx('pick'); }
      } else p.focusT = 0;
    },
    update(dt) {
      const p = G.p;
      p.notches = Math.min(11, 5 + Math.floor((G.level - 1) / 5));
      const used = G.charms.reduce((a, c) => a + PASSIVES[c.id].charm, 0);
      G.overcharmed = used > p.notches;
    },
    onHurt() { G.p.focusT = 0; if (owned('grubsong')) addSoul(15); },
  },
  v1: {
    id: 'v1', name: 'V1', game: 'ULTRAKILL', spr: 'v1', gem: 'blood', hpMode: 'hp', hp: 100, speed: 92, iframes: 0.5, noFood: true,
    start: 'revolver', weapons: ['revolver', 'coin', 'shotgun', 'nailgun', 'feedbacker', 'whiplash'], passives: [...UNIVERSAL],
    maxW: 6, maxP: 6, diff: 3,
    resource: 'Stile (D → ULTRAKILL)', life: '100 PV · Danno Duro',
    abilityName: 'Scatto', abilityHint: '3 cariche di stamina, invulnerabile durante lo scatto',
    blurb: 'Una macchina da guerra che si cura solo col sangue: uccidi da vicino per ripararti. Lo Stile moltiplica l\'esperienza, ma solo se cambi spesso arma.',
    quote: 'MANKIND IS DEAD. BLOOD IS FUEL. HELL IS FULL.', voice: 'Nessuna voce. Solo testo di sistema.',
    init(p) { p.hard = 0; p.stam = 3; p.stamT = 0; p.style = 0; p.fresh = {}; },
    ability(dt, held, pressed) {
      const p = G.p;
      if (pressed && p.stam >= 1 && !p.dash) {
        p.stam -= 1;
        const [dx, dy] = p.moving ? [p.mx, p.my] : [p.fx, p.fy];
        p.dash = { t: 0.16, dx, dy, sp: 430, hit: new Set(), dmg: 0 };
        p.invuln = Math.max(p.invuln, 0.22);
        fxParticles(p.x, p.y, '#ffd23f', 6, 60, 0.25);
      }
    },
    update(dt) {
      const p = G.p;
      if (G.hitT > 2) p.hard = Math.max(0, p.hard - 4 * dt);
      p.hp = Math.min(p.hp, p.maxHp - p.hard);
      p.style = Math.max(0, Math.min(799, p.style) - (5 + p.style * 0.012) * dt);
      if (p.stam < 3) { p.stamT += dt; if (p.stamT >= 1.1) { p.stamT = 0; p.stam++; } }
      for (const k in p.fresh) p.fresh[k] = Math.min(1, p.fresh[k] + 0.08 * dt);
    },
    onKill(e, o) {
      const p = G.p;
      if (d2(e.x, e.y, p.x, p.y) < (85 * G.s.area) ** 2) {
        healPlayer(e.elite ? 25 : 3.5);
        for (let i = 0; i < 4; i++) G.fx.push({ k: 'blood', x: e.x, y: e.y, life: 0.4, max: 0.4, col: '#c41e2a' });
      }
      const src = o.src || 'x';
      const f = p.fresh[src] ?? 1;
      p.style += 12 * f * (p.dash ? 1.5 : 1) * (e.elite ? 4 : 1);
      p.fresh[src] = Math.max(0.2, f - 0.05);
    },
    onHurt(a) { const p = G.p; p.hard = Math.min(p.maxHp - 1, p.hard + a * 0.6); p.style *= 0.6; },
    xpMul() { return 1 + Math.min(7, Math.floor(G.p.style / 100)) * 0.12; },
  },
  zagreus: {
    id: 'zagreus', name: 'Zagreus', game: 'Hades', spr: 'zagreus', gem: 'darkness', hpMode: 'hp', hp: 50, speed: 86, iframes: 0.6,
    start: 'stygius', weapons: ['stygius', 'nova', 'bloodstone'], passives: [...UNIVERSAL, 'collar', 'tooth', 'bracer', 'darkness'],
    maxW: 3, maxP: 6, diff: 2, boons: true,
    resource: 'Doni degli Olimpi', life: '50 PV · 2 Sfide alla Morte',
    abilityName: 'Scatto-Colpo', abilityHint: 'Scatto rapido che ferisce chi attraversi',
    blurb: 'Il principe che evade dagli Inferi. Al posto delle armi riceve i Doni degli dei: ogni dio infonde il suo potere in Attacco, Speciale o Lancio. Due dei insieme = Dono Duo.',
    quote: 'Padre, scusa il disturbo, sto solo uscendo. Di nuovo. Non aspettarmi alzato.', voice: 'Arguto, sarcastico, affettuoso.',
    init(p) { p.dd = 2; p.dashCd = 0; },
    ability(dt, held, pressed) {
      const p = G.p;
      p.dashCd -= dt;
      if (pressed && p.dashCd <= 0 && !p.dash) {
        const [dx, dy] = p.moving ? [p.mx, p.my] : [p.fx, p.fy];
        p.dash = { t: 0.14, dx, dy, sp: 460, hit: new Set(), dmg: 15, slot: 'attack' };
        p.invuln = Math.max(p.invuln, 0.2); p.dashCd = 0.45;
        fxParticles(p.x, p.y, '#ff8a2a', 6, 50, 0.3);
      }
    },
    update(dt) { const p = G.p; if (p.ddMax === undefined) p.ddMax = 2; const want = 2 + plvl('tooth'); if (want > p.ddMax) { p.dd += want - p.ddMax; p.ddMax = want; } },
    preHit(e, o) {
      const b = o.slot && G.boons[o.slot];
      if (!b) return;
      o.mul = o.mul || 1;
      if (b.god === 'poseidon') { o.mul *= 1.25 + 0.1 * b.lvl; o.kb = (o.kb || 40) * 3; o.kx = o.kx || 0; o.ky = o.ky || 0; }
      if (b.god === 'aphrodite') o.mul *= 1.35 + 0.1 * b.lvl;
      if (b.god === 'demeter') o.mul *= 1.2 + 0.1 * b.lvl;
      if (b.god === 'artemis') { o.critChance = (o.critChance || 0) + 0.12 + 0.06 * b.lvl; o.critMul = 3; }
    },
    postHit(e, d, o) {
      const b = o.slot && G.boons[o.slot];
      if (!b || e.dead) return;
      if (b.god === 'zeus' && Math.random() < (o.slot === 'attack' ? 0.45 : 1)) chainLightning(e.x, e.y, 1 + b.lvl, 70, 8 + 6 * b.lvl, {}, e);
      if (b.god === 'ares' && e.doomT <= 0) { e.doomT = 1.1; e.doomDmg = 30 + 20 * b.lvl; e.doomRepeat = owned('boon:aphrodite') ? 1 : 0; }
      if (b.god === 'aphrodite') e.weakT = 4;
      if (b.god === 'demeter') { e.chill = Math.min(10, e.chill + 1); e.slow = Math.max(e.slow, 0.06 * e.chill); e.slowT = 3; }
      if (b.god === 'poseidon' && owned('boon:zeus') && Math.random() < 0.3) { fxBolt(e.x, e.y - 140, e.x, e.y, '#ffe066'); hurtEnemy(e, 25, { silent: true }); }
    },
    onDeath() {
      const p = G.p;
      if (p.dd > 0) {
        p.dd--; p.hp = p.maxHp * 0.5; p.invuln = 2;
        banner('SFIDA ALLA MORTE', '«Non oggi, Thanatos. Non oggi.»', 2, '#e0303a');
        aoe(p.x, p.y, 90, 40, { kb: 300 }, '#e0303a');
        return true;
      }
      return false;
    },
  },
  madeline: {
    id: 'madeline', name: 'Madeline', game: 'Celeste', spr: 'madeline', gem: 'crystal', hpMode: 'anxiety', hp: 100, speed: 88, iframes: 0.7,
    start: 'dash', weapons: ['dash', 'badeline', 'kevin', 'core', 'theo', 'feather'], passives: [...UNIVERSAL, 'cheart', 'accept'],
    maxW: 6, maxP: 6, diff: 3,
    resource: 'Scatto (capelli rossi = pronto)', life: 'Barra dell\'Ansia',
    abilityName: 'Scatto', abilityHint: 'Scatto manuale nella direzione di movimento',
    blurb: 'Non è una guerriera: scala la montagna. Non ha punti vita ma una barra d\'Ansia; quando si riempie, solo un respiro a tempo la salva. Badeline la segue ovunque.',
    quote: 'Ok. Ok. Respira. Sono solo… quattrocento cose che vogliono uccidermi. Ce la posso fare.', voice: 'Autoironica, determinata, si incrina sotto pressione.',
    init(p) { p.charges = 1; p.recharge = 0; p.panicWins = 0; p.flyT = 0; },
    ability(dt, held, pressed) { const p = G.p; if (pressed && p.charges > 0 && !p.dash) madelineDash(p.moving ? p.mx : p.fx, p.moving ? p.my : p.fy); },
    update(dt) {
      const p = G.p;
      if (G.hitT > 2) p.hp = Math.max(0, p.hp - 7 * dt);
      if (p.flyT > 0) p.flyT -= dt;
    },
    dmgMul() { return owned('accept') ? 1 + G.p.hp / 200 : 1; },
    onKill(e) { if (Math.random() < 0.03 * G.s.luck) dropPickup('dashcrystal', e.x, e.y); },
    onPickup(k) { if (k.kind === 'dashcrystal') { G.p.charges = getW('dash')?.evo ? 2 : 1; fxRing(k.x, k.y, 2, 14, '#3fd46a', 0.3); sfx('pick'); return true; } return false; },
    panic() {
      const p = G.p;
      if (getW('badeline')?.evo) { p.hp = 55; aoe(p.x, p.y, 90, 50, { kb: 300 }, '#ff7ad9'); banner('RESPIRA', 'Badeline: «Ci sono io. Andiamo.»', 2, '#ff7ad9'); return; }
      G.panic = { t: 9, prog: 0.35, fy: 0.5, fv: 0, ph: 0, size: owned('accept') ? 0.34 : 0.24 };
      MODE = 'panic';
    },
  },
  prisoner: {
    id: 'prisoner', name: 'Il Prigioniero', game: 'Dead Cells', spr: 'prisoner', gem: 'cell', hpMode: 'hp', hp: 100, speed: 84, iframes: 0.6,
    start: 'rusty', weapons: ['rusty', 'icebow', 'whip', 'turret', 'grenade', 'homunculus'], passives: ['combo', 'necro', 'vengeance', 'killer'],
    maxW: 4, maxP: 3, diff: 1, scrolls: true,
    resource: 'Pergamene (Brutalità · Tattica · Sopravvivenza)', life: '100 PV · Fiaschetta',
    abilityName: 'Fiaschetta', abilityHint: 'Bevi per curarti del 45% (si ricarica con gli Strappi)',
    blurb: 'Una massa di cellule in un corpo decapitato. Ogni tre livelli sceglie una Pergamena: il colore decide quali armi diventano devastanti.',
    quote: '[Indica la Cucitrice. Poi il proprio collo vuoto. Poi fa spallucce.]', voice: 'Muto, ma i suoi gesti parlano.',
    init(p) { p.scrolls = { red: 0, purple: 0, green: 0 }; p.flasks = 1; p.flaskMax = 2; p.comboT = 0; p.vengT = 0; },
    ability(dt, held, pressed) {
      const p = G.p;
      const auto = SET.autoAbility && p.hp < p.maxHp * 0.3;
      if ((pressed || auto) && p.flasks > 0 && !p.drinkT && p.hp < p.maxHp) { p.flasks--; p.drinkT = 0.8; fxText(p.x, p.y - 18, 'GLU GLU', '#ff6a6a', 0.6); }
      if (p.drinkT) { p.drinkT -= dt; healPlayer(p.maxHp * 0.45 * dt / 0.8); if (p.drinkT <= 0) p.drinkT = 0; }
    },
    update(dt) { const p = G.p; if (p.comboT > 0) p.comboT -= dt; if (p.vengT > 0) p.vengT -= dt; },
    stats(s) { const p = G.p; s.hpAdd += 10 * (p.scrolls?.green || 0); if (owned('killer')) s.crit = 0.15; },
    dmgMul(src) {
      const p = G.p;
      const col = WEAPONS[src]?.color;
      let m = col ? 1 + 0.15 * p.scrolls[col] : 1;
      if (p.comboT > 0) m *= 1.35;
      if (p.vengT > 0) m *= 1.6;
      return m;
    },
    preHit(e, o) { if (owned('killer')) o.critChance = (o.critChance || 0) + 0.15; },
    onKill() { const p = G.p; if (owned('combo')) p.comboT = 2; if (owned('necro')) healPlayer(0.6); },
    onHurt() { if (owned('vengeance')) G.p.vengT = 3; },
    onChest() { const p = G.p; p.flasks = Math.min(p.flaskMax, p.flasks + 1); },
  },
  penitent: {
    id: 'penitent', name: 'Il Penitente', game: 'Blasphemous', spr: 'penitent', gem: 'tear', hpMode: 'hp', hp: 120, speed: 72, armor: 1, iframes: 0.6,
    start: 'meaculpa', weapons: ['meaculpa', 'verdiales', 'taranto', 'debla', 'tiento'], passives: [...UNIVERSAL, 'redwax', 'bluewax', 'incense'],
    maxW: 5, maxP: 8, diff: 1,
    resource: 'Fervore → Preghiere', life: '120 PV · Bile · 1 Colpa',
    abilityName: 'Fiaschetta di Bile', abilityHint: 'Cura il 35%. Si ricarica agli Inginocchiatoi',
    blurb: 'Lento, corazzato, implacabile. I fendenti generano Fervore; il Fervore si scioglie in Preghiere. Alla prima morte si rialza, ma lascia la sua Colpa sul campo.',
    quote: '«Il dolore, figliolo, parla ogni lingua.» — Deogracias', voice: 'Non parla mai. Narra Deogracias.',
    init(p) { p.fervour = 0; p.flasks = 2; p.flaskMax = 2; p.guiltUsed = false; p.tientoT = 0; G.priedieuT = 60; },
    ability(dt, held, pressed) {
      const p = G.p;
      const auto = SET.autoAbility && p.hp < p.maxHp * 0.3;
      if ((pressed || auto) && p.flasks > 0 && p.hp < p.maxHp && !p.bileT) { p.flasks--; p.bileT = 0.5; healPlayer(p.maxHp * 0.35); fxParticles(p.x, p.y, '#c41e2a', 10, 50, 0.5); }
      if (p.bileT) { p.bileT -= dt; if (p.bileT <= 0) p.bileT = 0; }
    },
    update(dt) {
      const p = G.p;
      G.prayerLock -= dt;
      G.priedieuT -= dt;
      if (G.priedieuT <= 0) { G.priedieuT = 80; const a = rnd(TAU); const pos = G.stage.clampPos(p.x + Math.cos(a) * 160, p.y + Math.sin(a) * 120); dropPickup('priedieu', pos[0], pos[1], { life: 40 }); banner('UN INGINOCCHIATOIO', 'Le tue Fiaschette di Bile possono essere riempite', 1.8, '#e2c46a'); }
      if (G.guilt && d2(p.x, p.y, G.guilt.x, G.guilt.y) < 144) { G.guilt = null; banner('COLPA ESPIATA', 'Il Fervore torna a scorrere', 1.6, '#ff6aa0'); }
    },
    onPickup(k) { if (k.kind === 'priedieu') { const p = G.p; p.flasks = p.flaskMax; healPlayer(p.maxHp * 0.15); fxRing(k.x, k.y, 4, 30, '#e2c46a', 0.5); return true; } return false; },
    onKill(e) { if (e.elite) addFervour(15); },
    onDeath() {
      const p = G.p;
      if (!p.guiltUsed) {
        p.guiltUsed = true; p.hp = p.maxHp * 0.5; p.invuln = 2;
        G.guilt = { x: p.x, y: p.y };
        banner('LA COLPA RESTA', '«Rialzati, Penitente. Ma la tua Colpa ti attende dove sei caduto.»', 2.6, '#ff6aa0');
        return true;
      }
      return false;
    },
  },
  terrarian: {
    id: 'terrarian', name: 'Il Terrariano', game: 'Terraria', spr: 'terrarian', gem: 'coin', hpMode: 'hp', hp: 100, speed: 82, iframes: 0.6,
    start: 'shortsword', weapons: ['shortsword', 'boomerang', 'starfury', 'waterbolt', 'beekeeper', 'minishark'], passives: [...UNIVERSAL, 'lifecrystal', 'manaflower', 'luminite'],
    maxW: 6, maxP: 6, diff: 1,
    resource: 'Tier di minerale · Mana', life: '100 PV (5 cuori)',
    abilityName: 'Costruisci', abilityHint: 'Piazza un muro di blocchi davanti a te',
    blurb: 'Parte con una spada corta di rame e finisce con la spada definitiva. Ogni livello d\'arma è un minerale migliore; quattro spade si fondono nello ZENITH.',
    quote: 'La Guida: «Hai provato a costruire una casa? Le case risolvono quasi tutto.»', voice: 'Silenzioso. Parla la Guida.',
    init(p) { p.mana = 100; p.buildCd = 0; G.moonDone = false; },
    ability(dt, held, pressed) {
      const p = G.p;
      p.buildCd -= dt;
      if (pressed && p.buildCd <= 0) {
        p.buildCd = 5;
        const [fx, fy] = cardinal(p.fx, p.fy);
        for (let i = -2; i <= 2; i++) G.blocks.push({ x: p.x + fx * 22 + (-fy) * i * 9, y: p.y + fy * 22 + fx * i * 9, hp: 80, life: 8 });
        sfx('ui');
      }
    },
    update(dt) {
      const p = G.p;
      p.mana = Math.min(100, p.mana + (8 + (owned('manaflower') ? 4 : 0)) * dt);
      if (!G.moonDone && G.t > 150) { G.moonDone = true; G.moonT = 60; banner('UNA LUNA DI SANGUE STA SORGENDO…', 'Più nemici, più esperienza', 2.6, '#e0303a'); }
      if (G.moonT > 0) { G.moonT -= dt; G.spawnMul = 1.6; G.xpEventMul = 1.5; } else { G.spawnMul = 1; G.xpEventMul = 1; }
    },
  },
  isaac: {
    id: 'isaac', name: 'Isaac', game: 'The Binding of Isaac', spr: 'isaac', gem: 'penny', hpMode: 'hearts', hp: 6, speed: 80, iframes: 0.9,
    start: 'tears', weapons: ['tears'], passives: [...Object.keys(ISAAC_ITEMS)], items: true,
    maxW: 1, maxP: 99, diff: 2,
    resource: 'Le Lacrime (oggetti illimitati)', life: '3 Cuori',
    abilityName: 'Testa di Tammy', abilityHint: 'Oggetto attivo: si carica uccidendo, poi spara lacrime in cerchio',
    blurb: 'Spara solo nelle quattro direzioni, come nel seminterrato. Nessun limite di oggetti: ogni oggetto cambia le lacrime e il suo aspetto, e le combinazioni sono imprevedibili.',
    quote: '*singhiozza*', voice: 'Singhiozza. Narra una voce da favola nera.',
    init(p) { p.ist = { dmg: 0, tears: 0, range: 0, shot: 0, speed: 0, luck: 0 }; p.shield = 0; p.extraUnits = 0; p.charge = 0; G.flies = []; },
    ability(dt, held, pressed) {
      const p = G.p;
      if (pressed && p.charge >= 6) {
        p.charge = 0;
        const n = owned('innereye') ? 16 : 10;
        for (let i = 0; i < n; i++) { const a = i / n * TAU; shoot({ x: p.x, y: p.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, r: 3, dmg: G.ist.realDmg * 2, life: 1, kind: 'tear', col: '#7fb8ff', src: 'tears' }); }
        fxText(p.x, p.y - 18, 'TESTA DI TAMMY', '#7fb8ff', 0.8);
      }
    },
    update() {
      G.ist = isaacStats();
      G.guppy = Object.keys(ISAAC_ITEMS).filter(k => ISAAC_ITEMS[k].guppy && owned(k)).length >= 3;
      if (G.guppy && !G.guppyAnnounced) { G.guppyAnnounced = true; banner('GUPPY!', 'Trasformazione: le lacrime generano mosche blu', 2.2, '#bfe4ff'); sfx('evo'); }
    },
    speedMul() { return G.ist ? G.ist.speed : 1; },
    onKill() { const p = G.p; p.kc = (p.kc || 0) + 1; if (p.kc % 6 === 0) p.charge = Math.min(6, p.charge + 1); if (Math.random() < 0.006 * G.s.luck) dropPickup('pill', G.p.x + rnd(-80, 80), G.p.y + rnd(-60, 60)); },
    onPickup(k) {
      if (k.kind !== 'pill') return false;
      const i = Math.floor(rnd(PILLS.length));
      G.pillsKnown = G.pillsKnown || {};
      G.pillsKnown[i] = true;
      PILLS[i].f();
      banner(PILLS[i].n.toUpperCase(), 'Pillola', 1.4, '#bfe4ff');
      return true;
    },
  },
};

// --- Sinergie (fili nella HUD) ed evoluzioni (Ricuciture) ---------------------------------
const SYN = [
  { char: 'knight', a: 'weaver', b: 'grubsong', name: 'Tessitrici Affamate', desc: 'Ogni morso delle Tessitrici genera Anima' },
  { char: 'knight', a: 'nail', b: 'elegy', name: 'Elegia', desc: 'A Maschere piene l\'Aculeo spara fasci di luce' },
  { char: 'knight', a: 'vspirit', b: 'shaman', name: 'Incantesimi Potenziati', desc: 'Spirito Vendicativo +33% danno e dimensione' },
  { char: 'v1', a: 'revolver', b: 'coin', name: 'Ricoshot', desc: 'Il revolver colpisce le monete e rimbalza sui nemici' },
  { char: 'v1', a: 'whiplash', b: 'shotgun', name: 'A Bruciapelo', desc: 'Chi viene trascinato riceve una scarica di pallettoni' },
  { char: 'zagreus', a: 'boon:zeus', b: 'boon:poseidon', name: 'Tempesta Marina', desc: 'Dono Duo: i nemici spinti vengono colpiti da fulmini' },
  { char: 'zagreus', a: 'boon:ares', b: 'boon:aphrodite', name: 'Maledizione del Desiderio', desc: 'Dono Duo: la Rovina colpisce due volte' },
  { char: 'madeline', a: 'badeline', b: 'dash', name: 'Una Parte di Me', desc: 'Badeline ripete anche i tuoi scatti (lv 5)' },
  { char: 'madeline', a: 'kevin', b: 'dash', name: 'Kevin Arrabbiato', desc: 'Ogni scatto lancia un Kevin nella stessa direzione' },
  { char: 'madeline', a: 'core', b: 'feather', name: 'Volo Rovente', desc: 'In volo l\'aura del Nucleo raddoppia' },
  { char: 'prisoner', a: 'whip', b: 'icebow', name: 'Frantumazione', desc: 'La frusta fa esplodere i nemici congelati' },
  { char: 'prisoner', a: 'turret', b: 'scroll:purple', name: 'Ingegnere', desc: 'Con 3 Pergamene di Tattica: +1 torretta' },
  { char: 'prisoner', a: 'homunculus', b: 'necro', name: 'Testa Vorace', desc: 'I morsi della testa ti curano' },
  { char: 'penitent', a: 'meaculpa', b: 'tiento', name: 'Spine e Lama', desc: 'Durante il Tiento la Mea Culpa colpisce più in fretta' },
  { char: 'penitent', a: 'taranto', b: 'debla', name: 'Luce e Tuono', desc: 'I fulmini cadono anche nelle colonne di luce' },
  { char: 'terrarian', a: 'starfury', b: 'manaflower', name: 'Stelle di Mana', desc: 'Ogni stella caduta restituisce mana' },
  { char: 'isaac', a: 'brimstone', b: 'innereye', name: 'Tre Laser', desc: 'Brimstone spara tre fasci' },
  { char: 'isaac', a: 'brimstone', b: 'spoon', name: 'Laser Psichico', desc: 'Brimstone mira direttamente ai nemici' },
  { char: 'isaac', a: 'polyphemus', b: 'innereye', name: 'Tre Mega Lacrime', desc: 'Tre lacrime giganti' },
];
const EVOS = [
  { char: 'knight', w: 'nail', req: ['pale'], into: 'Aculeo Puro', desc: 'Danno 21, più portata, scie di luce pallida' },
  { char: 'knight', w: 'vspirit', req: ['shaman'], into: 'Anima d\'Ombra', desc: 'Spirito di Vuoto: danno ×2' },
  { char: 'v1', w: 'revolver', req: ['coin'], into: 'Marksman Ricoshot', desc: 'Monete continue, +3 rimbalzi' },
  { char: 'zagreus', w: 'stygius', req: ['darkness'], into: 'Aspetto di Artù', desc: 'Excalibur: aura santa che rallenta e protegge' },
  { char: 'madeline', w: 'dash', req: ['cheart'], into: 'Doppio Scatto', desc: 'Capelli rosa: due scatti' },
  { char: 'madeline', w: 'badeline', req: ['accept'], into: 'Insieme', desc: 'Badeline ti lancia in aria; l\'Ansia non può più fermarti' },
  { char: 'prisoner', w: 'rusty', req: ['combo'], into: 'Lama del Re', desc: 'Combo rapidissima, lame spettrali' },
  { char: 'penitent', w: 'meaculpa', req: ['incense'], into: 'Mea Culpa Ardente', desc: 'Fendenti infuocati, esecuzioni esplosive' },
  { char: 'terrarian', w: 'shortsword', req: ['starfury', 'beekeeper', 'luminite'], consume: ['starfury', 'beekeeper'], into: 'ZENITH', desc: 'Le spade si fondono in un solo slot' },
];

function itemName(id) {
  if (id.startsWith('boon:')) return 'Dono di ' + GODS[id.slice(5)].name;
  if (id === 'scroll:purple') return '3 Pergamene di Tattica';
  return (WEAPONS[id] || PASSIVES[id])?.name || id;
}
function weaponName(w) {
  const d = WEAPONS[w.id];
  if (w.evo) return EVOS.find(r => r.w === w.id)?.into || d.evoName || d.name;
  if (w.id === 'nail') return 'Aculeo ' + NAIL_NAMES[w.lvl - 1];
  if (d.tiers) return w.id === 'shortsword' ? 'Spada Corta di ' + TIERS[w.lvl - 1].n : d.name + ' (' + TIERS[w.lvl - 1].n + ')';
  return d.name;
}

// =============================================================================
// LEVEL-UP: generazione delle opzioni
// =============================================================================
function buildOptions(n = 3, forChest = false) {
  const c = G.char, out = [];
  if (c.scrolls && !forChest && G.level % 3 === 0) {
    return [
      { kind: 'scroll', id: 'red', name: 'Pergamena della Brutalità', line: 'Armi rosse +15% · ' + G.p.scrolls.red + ' → ' + (G.p.scrolls.red + 1), icon: ['scroll', '#e0303a', '#5a1e24'] },
      { kind: 'scroll', id: 'purple', name: 'Pergamena della Tattica', line: 'Armi viola +15% · ' + G.p.scrolls.purple + ' → ' + (G.p.scrolls.purple + 1), icon: ['scroll', '#8a5ad0', '#2a1838'] },
      { kind: 'scroll', id: 'green', name: 'Pergamena della Sopravvivenza', line: 'Armi verdi +15% · +10 Vita', icon: ['scroll', '#3fd46a', '#1f3a22'] },
    ];
  }
  const pool = [];
  for (const id of c.weapons) {
    const w = getW(id), d = WEAPONS[id];
    if (w) { if (!w.evo && w.lvl < d.max) pool.push({ kind: 'weapon', id, wt: 1.5 }); }
    else if (G.weapons.length < c.maxW) pool.push({ kind: 'weapon', id, wt: 1 });
  }
  const pcount = G.passives.filter(p => !PASSIVES[p.id].isaac && !PASSIVES[p.id].relic).length;
  for (const id of c.passives) {
    const d = PASSIVES[id];
    if (d.cond && !d.cond()) continue;
    const p = getP(id);
    if (p) { if (p.lvl < d.max) pool.push({ kind: 'passive', id, wt: 1 }); }
    else if (d.isaac || pcount < c.maxP) pool.push({ kind: 'passive', id, wt: EVOS.some(r => r.char === c.id && r.req.includes(id) && getW(r.w)) ? 1.6 : 0.9 });
  }
  for (const id of c.charms || []) if (!getP(id)) pool.push({ kind: 'charm', id, wt: 0.9 });
  if (G.level >= 4) for (const id of Object.keys(RELICS)) if (!getP(id)) pool.push({ kind: 'passive', id, wt: 0.12 });
  if (c.boons) {
    const slots = ['attack', getW('nova') && 'special', getW('bloodstone') && 'cast'].filter(Boolean);
    const gods = Object.keys(GODS).sort(() => Math.random() - 0.5).slice(0, 3);
    for (const slot of slots) for (const god of gods) {
      const cur = G.boons[slot];
      if (cur && cur.god === god && cur.lvl >= 3) continue;
      pool.push({ kind: 'boon', id: god + ':' + slot, god, slot, wt: cur ? (cur.god === god ? 1.2 : 0.5) : 1.4 });
    }
  }
  const picks = [];
  const used = new Set();
  while (picks.length < n && pool.length) {
    const tot = pool.reduce((a, o) => a + o.wt, 0);
    let r = rnd(tot), i = 0;
    for (; i < pool.length; i++) { r -= pool[i].wt; if (r <= 0) break; }
    const o = pool.splice(Math.min(i, pool.length - 1), 1)[0];
    const key = o.kind === 'boon' ? 'boon' + o.slot : o.id;
    if (used.has(key)) continue;
    used.add(key);
    picks.push(o);
  }
  for (const o of picks) out.push(describeOption(o));
  if (!out.length && c.items) out.push(describeOption({ kind: 'passive', id: 'soulheart' }));
  if (!out.length) out.push(
    { kind: 'filler', id: 'heal', name: 'Pasticcino di Pezza', line: 'Cura il 30%', icon: ['heart', '#e0303a', '#5a1e24'] },
    { kind: 'filler', id: 'thread', name: 'Matassa di Filo', line: '+25 Filo', icon: ['coin', '#e2b04a', '#8a5a2a'] });
  return out;
}

function synergiesFor(id) {
  const c = G.char.id;
  const res = [];
  for (const s of SYN) if (s.char === c || s.char === '*') {
    if (s.a === id && owned(s.b)) res.push(s.name);
    else if (s.b === id && owned(s.a)) res.push(s.name);
  }
  for (const r of EVOS) if (r.char === c) {
    if (r.req.includes(id) && getW(r.w)) res.push('→ ' + r.into);
    if (r.w === id && r.req.every(q => owned(q))) res.push('→ ' + r.into);
  }
  return res;
}

function describeOption(o) {
  if (o.kind === 'weapon') {
    const w = getW(o.id), d = WEAPONS[o.id];
    const lvl = w ? w.lvl : 0;
    const line = d.tiers ? (lvl ? 'Minerale: ' + TIERS[lvl - 1].n + ' → ' + TIERS[lvl].n + ' (+22% danno)' : d.lines[0]) : d.lines[lvl] || d.lines[0];
    const willMax = lvl + 1 >= d.max;
    const evo = EVOS.find(r => r.w === o.id && r.char === G.char.id);
    const evoReadyAfter = evo && willMax && evo.req.every(q => owned(q));
    return { ...o, name: d.tiers && lvl ? weaponName({ id: o.id, lvl: lvl + 1 }) : d.name, line, lvl, max: d.max, isNew: !w, icon: d.tiers ? [d.icon[0], TIERS[lvl].c, d.icon[2]] : d.icon, syn: synergiesFor(o.id), evo: evoReadyAfter, tag: w ? 'ARMA · LV ' + lvl + ' → ' + (lvl + 1) : 'ARMA · NUOVA', group: 'arma' };
  }
  if (o.kind === 'passive' || o.kind === 'charm') {
    const p = getP(o.id), d = PASSIVES[o.id];
    const lvl = p ? p.lvl : 0;
    let warn = '';
    if (o.kind === 'charm') {
      const used = G.charms.reduce((a, c) => a + PASSIVES[c.id].charm, 0);
      if (used + d.charm > G.p.notches) warn = 'SOVRACCARICO: subirai danno doppio';
    }
    const evoRule = EVOS.find(r => r.char === G.char.id && r.req.includes(o.id));
    const evo = evoRule && getW(evoRule.w)?.lvl >= WEAPONS[evoRule.w].max && evoRule.req.every(q => q === o.id || owned(q));
    return { ...o, name: d.name, line: d.line(lvl + 1), lvl, max: d.max, isNew: !p, icon: d.icon, syn: synergiesFor(o.id), evo, warn,
      tag: o.kind === 'charm' ? 'SUPPORTO · AMULETO ' + d.charm + ' TACCHE' : d.relic ? 'RELIQUIA DEL MULTIVERSO' : d.isaac ? 'SUPPORTO · OGGETTO' : p ? 'SUPPORTO · LV ' + lvl + ' → ' + (lvl + 1) : 'SUPPORTO · NUOVO', group: 'supporto' };
  }
  if (o.kind === 'boon') {
    const g = GODS[o.god], cur = G.boons[o.slot];
    const lvl = cur && cur.god === o.god ? cur.lvl : 0;
    const warn = cur && cur.god !== o.god ? 'Sostituisce ' + BOON_NAMES[cur.god][o.slot] : '';
    const duo = SYN.filter(s => s.char === 'zagreus' && (s.a === 'boon:' + o.god || s.b === 'boon:' + o.god) && owned(s.a === 'boon:' + o.god ? s.b : s.a)).map(s => s.name);
    return { ...o, name: BOON_NAMES[o.god][o.slot], line: SLOT_NAMES[o.slot] + ': ' + g.eff, lvl, max: 3, isNew: !lvl, icon: [g.icon, g.col, '#14101a'], syn: duo, warn, tag: g.name.toUpperCase() + ' · ' + RARITY[lvl + 1].toUpperCase(), godQuote: g.quote, godCol: g.col };
  }
  return o;
}

function applyOption(o) {
  const p = G.p;
  if (o.kind === 'weapon') {
    const w = getW(o.id);
    if (w) w.lvl++; else G.weapons.push({ id: o.id, lvl: 1, t: 0.2, cdMax: 1, order: G.order++ });
  } else if (o.kind === 'passive' || o.kind === 'charm') {
    const list = o.kind === 'charm' ? G.charms : G.passives;
    const it = list.find(x => x.id === o.id);
    if (it) it.lvl++; else list.push({ id: o.id, lvl: 1, order: G.order++ });
    PASSIVES[o.id].acquire?.();
  } else if (o.kind === 'boon') {
    const cur = G.boons[o.slot];
    G.boons[o.slot] = cur && cur.god === o.god ? { god: o.god, lvl: cur.lvl + 1 } : { god: o.god, lvl: 1 };
  } else if (o.kind === 'scroll') {
    p.scrolls[o.id]++;
  } else if (o.kind === 'filler') {
    if (o.id === 'heal') healPlayer(G.char.hpMode === 'hp' ? p.maxHp * 0.3 : 2); else G.thread += 25;
  }
  recalc();
}

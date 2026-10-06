'use strict';
// =============================================================================
// MODALITÀ (Alfa 4)
//  · STORIA — ogni capitolo dura 20 minuti: mini-boss del mondo al 5', un
//    intruso da un altro mondo al 10', il mini-boss rinforzato al 15', il boss
//    al 18'. Dal 7' arrivano nemici di altre toppe, dal 12' i "rinforzati".
//  · ENDLESS: IL TELAIO INFINITO — i mondi si susseguono senza fine. Ogni boss
//    battuto strappa alla Cucitrice un ricordo (le Memorie del Telaio, salvate
//    nella Merceria): l'Endless racconta perché il Telaio non vuole finire.
// Qui vivono anche le orde (accerchiamenti, cariche) e gli oggetti
// distruttibili che lasciano cadere cibo, filo e oggetti speciali.
// =============================================================================

// --- Endless: la storia ---------------------------------------------------------------
const ENDLESS_INTRO = [
  ['cucitrice', 'Hai ricucito la mia Scala, {nome}? Non importa. Il Telaio non si ferma. Si ferma solo chi tesse… e io non smetterò.'],
  ['ditale', 'Psst! È il Telaio Infinito. Ogni mondo che chiudete le strappa un ricordo. Raccoglietene abbastanza e forse capiremo perché non vuole finire.'],
];
// Le Memorie del Telaio: una per ogni boss battuto nell'Endless
const LORE = [
  ['cucitrice', 'Ricordo… un laboratorio. Una sarta che riparava le cose finite: bambole, cappotti, storie.'],
  ['cucitrice', 'Un giorno le portarono una storia che stava finendo. Il protagonista era stanco. Il mondo si spegneva. Io non volli lasciarlo spegnere.'],
  ['cucitrice', 'Così cucii la sua ultima pagina a un\'altra storia. E quella a un\'altra ancora. Nessuno sarebbe più arrivato ai titoli di coda.'],
  ['ditale', 'Mia cugina… era brava. Troppo brava. Cuciva così stretto che nessuno riusciva più a uscire dalle toppe.'],
  ['cucitrice', 'Gli eroi dei mondi finiti venivano a cercarmi. Volevano la loro fine. Io davo loro un altro inizio. Non è la stessa cosa?'],
  ['cucitrice', 'Il Continue è nato da me. Una paura con un numero sopra: dieci, nove, otto… Non volevo che arrivasse a zero. Per nessuno.'],
  ['ditale', 'La Merceria era la sua. Io tenevo solo la cassa. Quando lei sparì dentro il Telaio, mi lasciò le forbici e una sola regola: «Mai tagliare l\'ultimo filo».'],
  ['cucitrice', 'Ogni volta che uno di voi vince, sento un filo che si scioglie. Fa male. Ma è un dolore… leggero. Come respirare.'],
  ['cucitrice', 'Forse una storia non finisce quando finisce. Forse finisce quando qualcuno smette di raccontarla.'],
  ['cucitrice', 'Hai capito, adesso? Non è il Telaio che non vuole fermarsi. Sono io che ho paura di vedere cosa c\'è dopo l\'ultima toppa.'],
  ['ditale', 'Se continuate a vincere, il Telaio diventa più leggero. Più largo. Ci passa la luce. Andate avanti… per lei.'],
  ['cucitrice', 'Ultimo ricordo, {nome}: la sarta ero io, e la storia stanca… era la mia. Continua pure. Io, intanto, imparo a lasciar andare.'],
];
function endlessFragment() {
  const k = Math.min(LORE.length - 1, (G.loop || 1) - 1);
  const before = META.lore || 0;
  META.lore = Math.max(before, k + 1); saveMeta();
  const head = k + 1 > before ? [['system', '> MEMORIA DEL TELAIO ' + (k + 1) + '/' + LORE.length + ' RECUPERATA']] : [];
  return [...head, [LORE[k][0], fillVars(LORE[k][1])]];
}
function endlessOrder(startId) {
  const pool = Object.keys(WORLDS).filter(k => k !== 'finale' && k !== startId).sort(() => Math.random() - 0.5);
  return [WORLDS[startId] && startId !== 'finale' ? startId : pool.shift(), ...pool, 'finale'];
}
// Passa al mondo successivo: il gruppo resta dov'è, il mondo si "ricuce" intorno
function nextLoop() {
  G.loop++;
  G.nodes = G.loop - 1;
  if ((G.loop - 1) % G.order8.length === 0) G.order8 = endlessOrder(null);
  const id = G.order8[(G.loop - 1) % G.order8.length];
  G.segStart = G.t; G.segKills = G.elitesKilled;
  Object.assign(G, { firedElite: [], bossE: null, won: false, winT: undefined, afterWin: false, bossWarn: false, contE: null, titleCard: null, event: null, evT: 35, teles: [], eprojs: [], zones: [], intruders: null, hordeT: 100, arena: null, spawnMul: 1, xpEventMul: 1 });
  for (const e of G.enemies) e.dead = true;
  G.enemies = [];
  G.stage = STAGES[id];
  G.stage.init();
  G.chapter = 'ENDLESS · PUNTO ' + G.loop;
  for (const pl of G.players) withPl(pl, () => { if (G.char.hpMode !== 'anxiety') healPlayer(G.char.hpMode === 'hp' ? G.p.maxHp * 0.3 : 2); });
  G.flashW = 1; shake(6); sfx('evo');
  MODE = 'play';
  banner('PUNTO ' + G.loop + ': ' + G.stage.name.toUpperCase(), 'Il Telaio cuce un nuovo mondo intorno a voi · difficoltà +' + Math.round(G.nodes * 22) + '%', 3.2, '#e2b04a');
}

// --- Co-op: due battute d'ingresso tra i compagni ----------------------------------------
const COOP_LINES = {
  knight: '[Il Cavaliere annuisce ai compagni. Poi guarda avanti.]',
  v1: '> ALLEATI RILEVATI. CONDIVISIONE DEL SANGUE: NEGATA.',
  zagreus: 'Una squadra! Papà odierebbe tutto questo. Mi piace già.',
  madeline: 'Ok, siamo in tanti. È… più facile, così. Grazie.',
  prisoner: '[Il Prigioniero batte il pugno con il primo che capita. Era una porta.]',
  penitent: '[Il Penitente si inginocchia un istante. Una benedizione silenziosa per tutti.]',
  terrarian: 'La Guida: «Più siete, più torce servono. Dividetevele!»',
  isaac: '*tira su col naso* …non mi lasciate indietro, vero?',
};
function coopIntro() {
  return G.players.slice(1).map(pl => {
    const id = pl.char.id, who = id === 'terrarian' ? 'guide' : id;
    return [who, COOP_LINES[id] || '…'];
  });
}

// --- Orde (come gli sciami e gli accerchiamenti di Vampire Survivors) ---------------------
function updateHordes(dt) {
  if (!G.times.horde || G.bossE || G.won || segT() < 150) return;
  G.hordeT -= dt;
  if (G.hordeT > 0) return;
  G.hordeT = rnd(80, 115);
  const table = G.stage.table(segT());
  const type = table[0][0];
  if (!ETYPES[type] || ETYPES[type].elite || type === 'ticket') return;
  const c = G.center, n = G.players.length;
  if (Math.random() < 0.55) {
    const k = Math.round((26 + Math.min(20, segT() / 50)) * (1 + 0.3 * (n - 1)));
    for (let i = 0; i < k; i++) { const a = i / k * TAU; const [x, y] = G.stage.clampPos(c.x + Math.cos(a) * 230, c.y + Math.sin(a) * 160); spawnEnemy(type, x, y); }
    banner('ACCERCHIAMENTO!', 'Apri un varco prima che il cerchio si chiuda', 1.8, '#e0303a');
  } else {
    const a = rnd(TAU), dx = Math.cos(a), dy = Math.sin(a);
    const k = Math.round(22 * (1 + 0.3 * (n - 1)));
    for (let i = 0; i < k; i++) {
      const off = (i - k / 2) * 12;
      const e = spawnEnemy(type, c.x - dx * 380 - dy * off, c.y - dy * 260 + dx * off);
      e.ai = AI.ticket; e.dx = dx; e.dy = dy; e.spd *= 2.4; e.noSep = true;
    }
    banner('CARICA!', 'Una mandria attraversa la toppa: spostati di lato', 1.8, '#e0303a');
  }
  sfx('bell');
}

// --- Oggetti distruttibili (le "candele" di VS) ---------------------------------------
const BRK = { hallownest: 'brk_lumafly', inferno: 'brk_terminal', tartaro: 'brk_urn', celeste: 'brk_lantern', deadcells: 'brk_crate', cvstodia: 'brk_candelabra', terraria: 'brk_pot', basement: 'brk_rock' };
const BRK_LIGHT = { brk_lumafly: '#9fe0ff', brk_terminal: '#ff5a4a', brk_urn: '#ffb03a', brk_lantern: '#ffd27a', brk_candelabra: '#ffd27a', brk_brazier: '#ff8a2a' };
ETYPES.brk = { spr: 'brk_brazier', hp: 1, spd: 0, dmg: 0, r: 7, xp: 0, name: 'Oggetto', init: e => { e.prop = true; e.harmless = true; e.anchored = true; e.noXp = true; e.noSep = true; e.kbRes = 1; } };
function updateProps(dt) {
  if (!G.stage.world && G.stage.id !== 'telaio') return;
  G.brkT -= dt;
  if (G.brkT > 0) return;
  G.brkT = 2.5;
  const c = G.center;
  let n = 0;
  for (const e of G.enemies) if (e.prop) { if (d2(e.x, e.y, c.x, c.y) > 720 * 720) { e.dead = true; e.noXp = true; } else n++; }
  if (n >= 7) return;
  const a = rnd(TAU), d = rnd(170, 330);
  const [x, y] = G.stage.clampPos(c.x + Math.cos(a) * d * 1.3, c.y + Math.sin(a) * d * 0.8);
  const e = spawnEnemy('brk', x, y);
  const want = BRK[G.stage.id] || 'brk_brazier';
  e.spr = SPR[want] ? want : (SPR.brk_brazier ? 'brk_brazier' : 'p_urn');
  e.hp = e.maxHp = 1;
  e.light = BRK_LIGHT[e.spr] || null;
}
function breakProp(e) {
  fxParticles(e.x, e.y - 4, e.light || '#c9b8a0', 12, 70, 0.4);
  sfx('hit');
  const luck = G.s.luck || 1;
  const r = Math.random();
  let kind;
  if (r < 0.06 * luck) kind = pick(['pk_rosary', 'pk_hourglass', 'pk_magnet']);
  else if (r < 0.14 * luck) kind = pick(['pk_bomb', 'pk_ultorb']);
  else if (r < 0.15 * luck && Math.random() < 0.4) kind = 'pk_revive';
  else if (r < 0.45) kind = 'food';
  else if (r < 0.7) kind = Math.random() < 0.15 ? 'pk_purse_big' : 'pk_purse';
  else { for (let i = 0; i < 4; i++) dropGem(e.x + rnd(-6, 6), e.y + rnd(-6, 6), 2.5); return; }
  dropPickup(kind, e.x, e.y);
}

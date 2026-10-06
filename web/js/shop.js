'use strict';
// =============================================================================
// MERCERIA (Alfa 4) — negozio di potenziamenti permanenti sul modello di
// Vampire Survivors: griglia di potenziamenti con più livelli, il prezzo sale
// con il livello e con il numero totale di acquisti, "Rimborsa tutto"
// restituisce il Filo speso. Nella seconda scheda si comprano le Ultimate.
// =============================================================================

const POWERUPS = [
  { id: 'might', name: 'Ago Affilato', line: '+5% danno', max: 5, base: 120, apply: (s, l) => { s.might += 0.05 * l; } },
  { id: 'armor', name: 'Ditale d\'Acciaio', line: '+1 armatura: −1 a ogni colpo subito', max: 3, base: 360, apply: (s, l) => { s.armor += l; } },
  { id: 'hp', name: 'Imbottitura Extra', line: '+10% Vita (Maschere e Cuori: +1 ogni 2 livelli)', max: 3, base: 120, apply: (s, l) => { s.hpMul += 0.1 * l; s.units += Math.floor(l / 2); } },
  { id: 'recovery', name: 'Rammendo Lento', line: '+0,2 Vita rigenerata al secondo', max: 5, base: 120, apply: (s, l) => { s.regen += 0.2 * l; } },
  { id: 'cooldown', name: 'Spoletta Rapida', line: '−2,5% ricarica delle armi', max: 2, base: 540, apply: (s, l) => { s.cd *= 1 - 0.025 * l; } },
  { id: 'area', name: 'Orlo Ampio', line: '+5% area degli attacchi', max: 2, base: 180, apply: (s, l) => { s.area += 0.05 * l; } },
  { id: 'duration', name: 'Filo Resistente', line: '+15% durata degli effetti', max: 2, base: 180, apply: (s, l) => { s.duration += 0.15 * l; } },
  { id: 'speed', name: 'Scarpe Rattoppate', line: '+5% velocità di movimento', max: 2, base: 180, apply: (s, l) => { s.speed += 0.05 * l; } },
  { id: 'magnet', name: 'Calamita da Sarta', line: '+25% raggio di raccolta', max: 2, base: 180, apply: (s, l) => { s.magnet += 0.25 * l; } },
  { id: 'luck', name: 'Bottone Fortunato', line: '+10% fortuna (oggetti e forzieri migliori)', max: 3, base: 360, apply: (s, l) => { s.luck += 0.1 * l; } },
  { id: 'growth', name: 'Gomitolo della Crescita', line: '+3% esperienza', max: 5, base: 540, apply: (s, l) => { s.growth += 0.03 * l; } },
  { id: 'greed', name: 'Borsellino di Sor Ditale', line: '+10% Filo raccolto', max: 5, base: 120, apply: (s, l) => { s.greed += 0.1 * l; } },
  { id: 'curse', name: 'Patto Scucito', line: '+10% nemici: più numerosi, resistenti e veloci, ma +10% esperienza', max: 5, base: 1000, apply: (s, l) => { s.curse += 0.1 * l; } },
  { id: 'revival', name: 'Ago d\'Oro', line: '+1 rianimazione per run: rinasci al 50%', max: 1, base: 3000, apply: () => {} },
  { id: 'reroll', name: 'Forbici di Riserva', line: '+1 Ritira per run', max: 5, base: 600, apply: () => {} },
];
const ULT_COST = 1000;
const powerLvl = id => { const it = POWERUPS.find(x => x.id === id); return it ? Math.min(it.max, (META.up && META.up[id]) || 0) : 0; };
function applyPowerUps(s) { for (const it of POWERUPS) { const l = powerLvl(it.id); if (l) it.apply(s, l); } }
const totalBought = () => POWERUPS.reduce((a, it) => a + powerLvl(it.id), 0);
// prezzo alla Vampire Survivors: base × (livello+1), +10% per ogni acquisto già fatto
const powerCost = (it, lvl) => Math.round(it.base * (lvl + 1) * (1 + 0.1 * totalBought()));
function buyPower(it) {
  const lvl = powerLvl(it.id);
  if (lvl >= it.max) return false;
  const cost = powerCost(it, lvl);
  if (META.thread < cost) return false;
  META.thread -= cost; META.up[it.id] = lvl + 1; META.spent = (META.spent || 0) + cost;
  saveMeta();
  return true;
}
function refundAll() {
  let back = META.spent || 0;
  if (!back) {
    // salvataggi vecchi: stima di quanto è stato speso
    let n = 0;
    for (const it of POWERUPS) for (let k = 0; k < powerLvl(it.id); k++) { back += Math.round(it.base * (k + 1) * (1 + 0.1 * n)); n++; }
  }
  META.thread += back; META.up = {}; META.spent = 0;
  saveMeta();
  return back;
}
function buyUlt(id) {
  META.ult = META.ult || {};
  if (META.ult[id] || META.thread < ULT_COST) return false;
  META.thread -= ULT_COST; META.ult[id] = true;
  saveMeta();
  return true;
}
// icona del potenziamento: sprite disegnato (art4_items) se c'è, altrimenti icona generica
const PU_FALLBACK = { might: ['sword', '#c9ced8', '#6b7085'], armor: ['shield', '#9aa6b8', '#3a3550'], hp: ['heart', '#e0303a', '#5a1e24'], recovery: ['heart', '#6aff8a', '#2a5a3a'], cooldown: ['clock', '#bfe4ff', '#3a86d0'], area: ['ring', '#e2b04a', '#8a5a2a'], duration: ['clock', '#c9a6ff', '#4a2a6a'], speed: ['feather', '#5fb3ff', '#22305a'], magnet: ['magnet', '#e2b04a', '#8a5a2a'], luck: ['coin', '#7aff9a', '#2a5a3a'], growth: ['crystal', '#ff9ad9', '#4aa0ff'], greed: ['coin', '#ffd23f', '#8a5a2a'], curse: ['skull', '#c96aff', '#3a1a4a'], revival: ['knife', '#ffd23f', '#8e2b3a'], reroll: ['knife', '#efe6d2', '#8e2b3a'] };
function puIconURL(id, k = 3) {
  if (SPR['pu_' + id]) return spriteURL('pu_' + id, k);
  const f = PU_FALLBACK[id] || ['star', '#ffd23f', '#8a5a2a'];
  return iconURL(f[0], f[1], f[2], k);
}

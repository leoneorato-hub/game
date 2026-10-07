'use strict';
// =============================================================================
// ICONE DEGLI OGGETTI (Alfa 5) — le icone disegnate a mano 16×16 di armi,
// oggetti, amuleti, doni, pergamene e reliquie (art5_icons_*.js). Se un'icona
// manca si torna ai vecchi template ricolorati di icon(). La Spada Corta del
// Terrariano ha la lama in scala di grigi: qui prende il colore del minerale.
// =============================================================================

const icKey = (id, evo) => (evo && SPR['ic_' + id + '_evo'] ? 'ic_' + id + '_evo' : SPR['ic_' + id] ? 'ic_' + id : null);

// ricolora i pixel grigi (la lama) con il colore del minerale, mantenendo luci e ombre
const IC_TIER = {};
function tierTint(name, col) {
  const key = name + col;
  if (IC_TIER[key]) return IC_TIER[key];
  const src = SPR[name].img, w = src.width, h = src.height;
  const c = makeCanvas(w, h), g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  const im = g.getImageData(0, 0, w, h), D = im.data;
  const R = parseInt(col.slice(1, 3), 16), Gc = parseInt(col.slice(3, 5), 16), B = parseInt(col.slice(5, 7), 16);
  for (let i = 0; i < D.length; i += 4) {
    if (!D[i + 3]) continue;
    const mx = Math.max(D[i], D[i + 1], D[i + 2]), mn = Math.min(D[i], D[i + 1], D[i + 2]);
    if (mx - mn > 18 || mx < 50) continue;          // colori veri e contorno restano com'erano
    const L = mx / 255, k = 0.3 + 0.95 * L, hi = L > 0.93 ? 70 : 0;
    D[i] = Math.min(255, R * k + hi); D[i + 1] = Math.min(255, Gc * k + hi); D[i + 2] = Math.min(255, B * k + hi);
  }
  g.putImageData(im, 0, 0);
  return (IC_TIER[key] = c);
}

// immagine 16×16 di un'arma posseduta (con evoluzione e minerale), o null se non è disegnata
function weaponIconImg(w) {
  const d = WEAPONS[w.id], k = icKey(w.id, w.evo);
  if (!k) return null;
  if (d.tiers && !(w.evo && k.endsWith('_evo'))) return tierTint(k, TIERS[clamp(w.lvl - 1, 0, TIERS.length - 1)].c);
  return SPR[k].img;
}
// immagine di un oggetto di supporto (passivo, amuleto, reliquia, oggetto di Isaac)
function passiveIconImg(id) { const k = icKey(id); return k ? SPR[k].img : null; }
// immagine di un'opzione del level-up / dei forzieri
function optIconImg(o) {
  if (!o || !o.kind) return null;
  if (o.kind === 'weapon') {
    const k = icKey(o.id);
    if (!k) return null;
    return WEAPONS[o.id].tiers ? tierTint(k, TIERS[clamp(o.lvl || 0, 0, TIERS.length - 1)].c) : SPR[k].img;
  }
  const k = o.kind === 'boon' ? icKey('boon_' + o.god) : o.kind === 'scroll' ? icKey('scroll_' + o.id) : icKey(o.id);
  return k ? SPR[k].img : null;
}

// miniature lisce per gli slot piccolissimi (pannelli della co-op)
const IC_MINI = new Map();
function iconMini(img, size) {
  let m = IC_MINI.get(img);
  if (!m) IC_MINI.set(img, (m = {}));
  if (!m[size]) {
    const c = makeCanvas(size, size), g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, size, size);
    m[size] = c;
  }
  return m[size];
}
// data-URL ingrandito a scala intera (per le carte HTML)
const IC_URL = new Map();
function imgURL(img, scale) {
  let m = IC_URL.get(img);
  if (!m) IC_URL.set(img, (m = {}));
  if (!m[scale]) {
    const c = makeCanvas(img.width * scale, img.height * scale), g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, c.width, c.height);
    m[scale] = c.toDataURL();
  }
  return m[scale];
}
// URL dell'icona di un'opzione: sprite nuovo se c'è, altrimenti il vecchio template
function optIconURL(o, scale = 3) {
  const img = optIconImg(o);
  if (img) return imgURL(img, scale);
  return iconURL(o.icon[0], o.icon[1], o.icon[2], Math.max(2, Math.round(scale * 1.6)));
}
function weaponIconURL(w, scale = 2) {
  const img = weaponIconImg(w);
  if (img) return imgURL(img, scale);
  const d = WEAPONS[w.id];
  return iconURL(d.icon[0], w.evo ? '#ffd23f' : (d.tiers ? TIERS[w.lvl - 1].c : d.icon[1]), d.icon[2], scale);
}
function passiveIconURL(id, scale = 2) {
  const img = passiveIconImg(id);
  if (img) return imgURL(img, scale);
  const d = PASSIVES[id];
  return iconURL(d.icon[0], d.icon[1], d.icon[2], scale);
}

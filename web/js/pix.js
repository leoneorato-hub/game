'use strict';
// =============================================================================
// PIX (Alfa 3) — rasterizzatore di pixel-art ombreggiata.
// Ogni sprite è descritto come forme (ellissi, capsule, poligoni) con un
// materiale; il motore le rasterizza senza anti-aliasing e poi applica le
// regole della pixel-art "fatta a mano" nello stile del riferimento:
//  · rampe di 5 toni con hue-shift (ombre più fredde, luci più calde)
//  · luce dall'alto a sinistra, calcolata dalla distanza dai bordi della forma
//  · ombra di contatto dove una forma ne copre un'altra
//  · contorno selettivo (colorato col tono più scuro del materiale vicino)
//  · materiali emissivi (vetri, fiamme, ali luminose) che non si scuriscono
// =============================================================================

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  if (!s) return [l * 255, l * 255, l * 255].map(Math.round);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
}
function hueToward(h, target, amt) { let d = ((target - h + 540) % 360) - 180; return h + clamp(d, -amt, amt); }

const RAMPS = {};
function ramp(hex) {
  if (RAMPS[hex]) return RAMPS[hex];
  const [h, s, l] = hexToHsl(hex);
  const r = [
    hslToRgb(hueToward(h, 250, 30), Math.min(1, s * 0.7 + 0.08), l * 0.24),
    hslToRgb(hueToward(h, 245, 16), Math.min(1, s * 0.85), l * 0.66),
    hslToRgb(h, s, l),
    hslToRgb(hueToward(h, 55, 10), s * 0.95, Math.min(0.92, l * 1.2 + 0.06)),
    hslToRgb(hueToward(h, 55, 18), s * 0.75, Math.min(0.97, l * 1.42 + 0.14)),
  ];
  return (RAMPS[hex] = r);
}

// --- Il pennello ----------------------------------------------------------------------
class Brush {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.sid = new Int32Array(w * h);   // id della forma (0 = vuoto)
    this.mat = new Array(w * h).fill(null);
    this.n = 0; this.mats = []; this.ox = 0; this.oy = 0;
  }
  _m(m) { if (typeof m === 'string') m = { c: m }; return m; }
  _set(x, y, m, keep) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    if (m === null) { this.sid[i] = 0; this.mat[i] = null; return; }
    if (keep) { if (!this.sid[i]) return; this.mat[i] = m; return; }
    this.sid[i] = this.n; this.mat[i] = m;
  }
  off(x, y) { this.ox = x; this.oy = y; return this; }
  _fill(x0, y0, x1, y1, test, m, keep) {
    const OX = this.ox, OY = this.oy; x0 += OX; x1 += OX; y0 += OY; y1 += OY; const t0 = test; test = (x, y) => t0(x - OX, y - OY);
    if (m !== null && !keep) this.n++;
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.h - 1, Math.ceil(y1)); y++)
      for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(this.w - 1, Math.ceil(x1)); x++)
        if (test(x + 0.5, y + 0.5)) this._set(x, y, m, keep);
    return this;
  }
  ell(cx, cy, rx, ry, m, o = {}) {
    m = m === null ? null : this._m(m);
    const rot = o.rot || 0, c = Math.cos(rot), s = Math.sin(rot), R = Math.max(rx, ry) + 1;
    return this._fill(cx - R, cy - R, cx + R, cy + R, (x, y) => { const dx = x - cx, dy = y - cy, u = dx * c + dy * s, v = -dx * s + dy * c; return (u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1; }, m, o.keep);
  }
  rect(x, y, w, h, m, o = {}) { m = m === null ? null : this._m(m); return this._fill(x, y, x + w, y + h, (px, py) => px >= x && px <= x + w && py >= y && py <= y + h, m, o.keep); }
  poly(pts, m, o = {}) {
    m = m === null ? null : this._m(m);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return this._fill(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), (x, y) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }, m, o.keep);
  }
  cap(x1, y1, x2, y2, r, m, o = {}) {
    m = m === null ? null : this._m(m);
    const r2 = (o.r2 ?? r);
    const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1;
    return this._fill(Math.min(x1, x2) - Math.max(r, r2) - 1, Math.min(y1, y2) - Math.max(r, r2) - 1, Math.max(x1, x2) + Math.max(r, r2) + 1, Math.max(y1, y2) + Math.max(r, r2) + 1, (x, y) => {
      const t = clamp(((x - x1) * dx + (y - y1) * dy) / L, 0, 1);
      const px = x1 + dx * t - x, py = y1 + dy * t - y, rr = r + (r2 - r) * t;
      return px * px + py * py <= rr * rr;
    }, m, o.keep);
  }
  px(x, y, m, o = {}) { m = m === null ? null : this._m(m); if (!o.keep && m) this.n++; this._set(Math.floor(x + this.ox), Math.floor(y + this.oy), m, !!o.keep); return this; }
  dot(x, y, m) { return this.px(x, y, m, { keep: true }); }
  // raggiera (ali di V1, aureole, esplosioni)
  rays(cx, cy, n, r0, r1, w, m, off = 0, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = off + i / n * TAU + (o.jit ? o.jit(i) : 0);
      const L = r1 * (o.len ? o.len(i) : 1);
      const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
      this.poly([[cx + ca * r0 + px * w, cy + sa * r0 + py * w], [cx + ca * L, cy + sa * L], [cx + ca * r0 - px * w, cy + sa * r0 - py * w]], m);
    }
    return this;
  }

  // --- Ombreggiatura e contorno ----------------------------------------------------
  bake(opts = {}) {
    const { w, h, sid, mat } = this;
    const id = new ImageData(w + 2, h + 2);
    const D = id.data;
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : sid[y * w + x]);
    const dist = (x, y, dx, dy, s) => { for (let k = 1; k <= 4; k++) if (at(x + dx * k, y + dy * k) !== s) return k; return 5; };
    const put = (x, y, rgb, a = 255) => { const i = ((y + 1) * (w + 2) + (x + 1)) * 4; D[i] = rgb[0]; D[i + 1] = rgb[1]; D[i + 2] = rgb[2]; D[i + 3] = a; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const s = sid[y * w + x];
      if (!s) continue;
      const m = mat[y * w + x], R = ramp(m.c);
      let k;
      if (m.flat) k = m.tone ?? 2;
      else {
        const t = dist(x, y, 0, -1, s), b = dist(x, y, 0, 1, s), l = dist(x, y, -1, 0, s), r = dist(x, y, 1, 0, s);
        const v = (b - t) + 0.6 * (r - l);
        k = v > 0.9 ? 3 : v < -0.9 ? 1 : 2;
        if (t === 1 && l <= 2 && v > 1.2 && b + t > 3) k = 4;
        if (b === 1 && t > 1) k = Math.min(k, 1);
        const up = at(x, y - 1);
        if (up && up !== s && up > s) k = Math.max(1, k - 1);
        if (m.glow) k = (t > 1 && b > 1 && l > 1 && r > 1) ? 4 : 3;
      }
      put(x, y, R[k]);
    }
    if (opts.outline !== false) {
      for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
        if (at(x, y)) continue;
        let best = null;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const s = at(x + dx, y + dy);
          if (s) { const m = mat[(y + dy) * w + (x + dx)]; best = m; if (dy === -1) break; }
        }
        if (best) put(x, y, best.glow ? ramp(best.c)[1] : (opts.ink ? opts.ink : ramp(best.c)[0]));
      }
    }
    const c = makeCanvas(w + 2, h + 2);
    c.getContext('2d').putImageData(id, 0, 0);
    return c;
  }
}

function paint(w, h, fn, opts) { const b = new Brush(w, h); fn(b); return b.bake(opts); }
// Registra uno sprite già cotto con le sue varianti (bianco per i colpi, specchiato)
function regSprite(name, img) {
  const white = tinted(img, '#ffffff');
  SPR[name] = { img, white, flip: flipped(img), flipWhite: flipped(white), w: img.width, h: img.height };
  return SPR[name];
}
function regPaint(name, w, h, fn, opts) { return regSprite(name, paint(w, h, fn, opts)); }
// materiali comodi
const M = {
  glow: c => ({ c, glow: true }),
  flat: (c, tone = 2) => ({ c, flat: true, tone }),
};

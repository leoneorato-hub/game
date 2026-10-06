'use strict';
// =============================================================================
// ART4 · BOSS + MINI-BOSS (bosses-b)
// Escribar (Blasphemous), Il Signore della Luna (Terraria), Mamma + occhio
// (The Binding of Isaac) e i mini-boss: Falso Cavaliere, Swordsmachine,
// Megera, Mr. Oshiro, Ten Piedad, Occhio di Cthulhu, Monstro, il Portinaio.
// Pixel-art originale ispirata ai design ufficiali. Mini-pittore a forme con
// rampe scelte a mano (ombre fredde, luci calde), luce dall'alto a sinistra,
// pulizia dei pixel orfani, ombre portate, linee di separazione interne,
// materiali emissivi e contorno d'inchiostro di 1 px.
// Boss: B_<id>_0 / B_<id>_1 (idle) / B_<id>_p2 · Mini-boss: <nome> / <nome>_b.
// =============================================================================
(() => {
  const HEX = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const LV = (() => { const v = [-0.55, -0.72, 0.6], l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]); return v.map(a => a / l); })();
  const LX = LV[0], LY = LV[1], LZ = LV[2];
  const lit = (nx, ny, nz) => { const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1, d = (nx * LX + ny * LY + nz * LZ) / l; return 0.26 + 0.7 * (d > -0.2 ? d : -0.2); };
  const RR = [0, 0]; // intervallo di riga riutilizzato (niente allocazioni per riga)
  const span = (lo, hi) => { RR[0] = lo; RR[1] = hi; return RR; };
  const RGB = {};
  const rgbOf = h => RGB[h] || (RGB[h] = HEX(h));
  // materiali: tutti con la stessa forma (accessi monomorfici nel cuocitore)
  const MAT = (r, o = {}) => ({ r, glow: !!o.glow, base: o.base ?? 1, ol: o.ol || null, ink: o.ink || null, soft: !!o.soft, noOl: !!o.noOl, nocast: !!o.nocast, _rgb: null, _ol: 0 });

  class Px {
    // free: lati su cui le forme possono toccare il bordo (di norma resta 1 px per il contorno)
    constructor(w, h, free = {}) {
      this.w = w; this.h = h; const N = w * h;
      this.cx0 = free.all || free.left ? 0 : 1; this.cy0 = free.all || free.top ? 0 : 1;
      this.cx1 = free.all || free.right ? w - 1 : w - 2; this.cy1 = free.all || free.bottom ? h - 1 : h - 2;
      this.sid = new Int32Array(N); this.mt = new Array(N).fill(null); this.tn = new Int8Array(N); this.fx = new Uint8Array(N);
      this.n = 0; this.info = [null];
      this.bx0 = w; this.by0 = h; this.bx1 = -1; this.by1 = -1;
    }
    _bb(xa, ya, xb, yb) { if (xa < this.bx0) this.bx0 = xa; if (ya < this.by0) this.by0 = ya; if (xb > this.bx1) this.bx1 = xb; if (yb > this.by1) this.by1 = yb; }
    _new(o) { this.n++; this.info[this.n] = { edge: o.edge, cast: o.cast !== false }; return this.n; }
    // riempimento generico: f(x,y) -> null fuori | v (0..1) luminosità
    // rr(yc) opzionale: intervallo [lo, hi] della riga (in coordinate continue) per saltare i vuoti
    fill(x0, y0, x1, y1, f, m, o = {}, rr) {
      const keep = !!o.keep, id = keep ? 0 : (o.same ? this.n : this._new(o));
      const only = o.only ? [].concat(o.only) : null, clip = o.clip || null, tone = o.tone, bias = o.bias || 0;
      const fixed = tone !== undefined, toneF = typeof tone === 'function';
      const W = this.w, sid = this.sid, mt = this.mt, tn = this.tn, fx = this.fx;
      const ya = Math.max(this.cy0, Math.floor(y0)), yb = Math.min(this.cy1, Math.ceil(y1)), xa = Math.max(this.cx0, Math.floor(x0)), xb = Math.min(this.cx1, Math.ceil(x1));
      const nr = m ? m.r.length : 0;
      if (!keep && m) this._bb(xa, ya, xb, yb);
      for (let y = ya; y <= yb; y++) {
        let xs = xa, xe = xb;
        const yc = y + 0.5, row = y * W;
        if (rr) { const r = rr(yc); if (r === null) continue; const lo = Math.floor(r[0] - 0.5), hi = Math.ceil(r[1] - 0.5); if (lo > xs) xs = lo; if (hi < xe) xe = hi; }
        for (let x = xs; x <= xe; x++) {
          const i = row + x;
          if (keep && sid[i] === 0) continue;
          if (only !== null && !only.includes(mt[i])) continue;
          const v = f(x + 0.5, yc);
          if (v === null) continue;
          if (clip !== null && !clip(x, y)) continue;
          if (m === null) { sid[i] = 0; mt[i] = null; continue; }
          if (!keep) sid[i] = id;
          mt[i] = m;
          if (fixed) { tn[i] = toneF ? tone(x, y) : tone; fx[i] = 1; }
          else { const t = Math.floor((v + bias) * nr); tn[i] = t < 0 ? 0 : t >= nr ? nr - 1 : t; fx[i] = 0; }
        }
      }
      return this;
    }
    ell(cx, cy, rx, ry, m, o = {}) {
      const rot = o.rot || 0, c = Math.cos(rot), s = Math.sin(rot), R = Math.max(rx, ry) + 1, fl = o.fl ?? 1;
      const Rx = rot ? R : rx + 1, Ry = rot ? R : ry + 1, ov = o.v || null, fixedT = o.tone !== undefined;
      return this.fill(cx - Rx, cy - Ry, cx + Rx, cy + Ry, rot ? (x, y) => {
        const dx = x - cx, dy = y - cy, u = (dx * c + dy * s) / rx, w = (-dx * s + dy * c) / ry, d = u * u + w * w;
        if (d > 1) return null;
        if (ov !== null) return ov(x, y);
        if (fixedT) return 0.5;
        const nx = u * c - w * s, ny = u * s + w * c;
        return lit(nx * fl, ny * fl, Math.sqrt(1 - d));
      } : (x, y) => {
        const u = (x - cx) / rx, w = (y - cy) / ry, d = u * u + w * w;
        if (d > 1) return null;
        if (ov !== null) return ov(x, y);
        if (fixedT) return 0.5;
        return lit(u * fl, w * fl, Math.sqrt(1 - d));
      }, m, o, rot ? undefined : yc => { const w = (yc - cy) / ry; if (w < -1 || w > 1) return null; const hw = rx * Math.sqrt(Math.max(0, 1 - w * w)); return span(cx - hw - 0.01, cx + hw + 0.01); });
    }
    // uovo: semiasse verticale diverso sopra/sotto, si stringe verso il basso
    egg(cx, cy, rx, ryT, ryB, taper, m, o = {}) {
      const fl = o.fl ?? 1, ov = o.v || null, fixedT = o.tone !== undefined;
      return this.fill(cx - rx - 1, cy - ryT - 1, cx + rx + 1, cy + ryB + 1, (x, y) => {
        const dy = y - cy, ry = dy < 0 ? ryT : ryB, rxe = rx * (1 - taper * Math.max(0, dy / ryB));
        const u = (x - cx) / rxe, w = dy / ry, d = u * u + w * w;
        if (d > 1) return null;
        if (ov !== null) return ov(x, y);
        if (fixedT) return 0.5;
        return lit(u * fl, w * fl, Math.sqrt(1 - d));
      }, m, o, yc => { const dy = yc - cy, ry = dy < 0 ? ryT : ryB, w = dy / ry; if (w < -1 || w > 1) return null; const hw = rx * (1 - taper * Math.max(0, dy / ryB)) * Math.sqrt(Math.max(0, 1 - w * w)); return span(cx - hw - 0.01, cx + hw + 0.01); });
    }
    cap(x1, y1, x2, y2, r, m, o = {}) {
      const r2 = o.r2 ?? r, dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1, Mx = Math.max(r, r2) + 1, fl = o.fl ?? 1, ov = o.v || null, fixedT = o.tone !== undefined;
      return this.fill(Math.min(x1, x2) - Mx, Math.min(y1, y2) - Mx, Math.max(x1, x2) + Mx, Math.max(y1, y2) + Mx, (x, y) => {
        let t = ((x - x1) * dx + (y - y1) * dy) / L; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const px = x - (x1 + dx * t), py = y - (y1 + dy * t), rr = r + (r2 - r) * t, d2 = (px * px + py * py) / (rr * rr);
        if (d2 > 1) return null;
        if (ov !== null) return ov(x, y);
        if (fixedT) return 0.5;
        return lit(px / rr * fl, py / rr * fl, Math.sqrt(1 - d2));
      }, m, o, yc => {
        const R = Mx - 1;
        let ta = 0, tb = 1;
        if (Math.abs(dy) < 1e-6) { if (Math.abs(y1 - yc) > R) return null; }
        else { ta = (yc - R - y1) / dy; tb = (yc + R - y1) / dy; if (ta > tb) { const t = ta; ta = tb; tb = t; } if (ta < 0) ta = 0; if (tb > 1) tb = 1; if (ta > tb) return null; }
        const xa = x1 + dx * ta, xb = x1 + dx * tb;
        return span(Math.min(xa, xb) - R - 0.01, Math.max(xa, xb) + R + 0.01);
      });
    }
    poly(pts, m, o = {}) {
      // scanline: per ogni riga si calcolano una volta gli attraversamenti dei lati
      const n = pts.length;
      let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity;
      for (let i = 0; i < n; i++) { const p = pts[i]; if (p[0] < X0) X0 = p[0]; if (p[0] > X1) X1 = p[0]; if (p[1] < Y0) Y0 = p[1]; if (p[1] > Y1) Y1 = p[1]; }
      const rows = [];
      for (let y = Math.max(0, Math.floor(Y0)); y <= Math.min(this.h - 1, Math.ceil(Y1)); y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0, j = n - 1; i < n; j = i++) {
          const yi = pts[i][1], yj = pts[j][1];
          if ((yi > yc) !== (yj > yc)) xs.push((pts[j][0] - pts[i][0]) * (yc - yi) / (yj - yi) + pts[i][0]);
        }
        rows[y] = xs;
      }
      const cx = o.cx ?? (X0 + X1) / 2, cy = o.cy ?? (Y0 + Y1) / 2, hw = (X1 - X0) / 2 || 1, hh = (Y1 - Y0) / 2 || 1, fl = o.fl ?? 0.6;
      const ov = o.v || null, fixedT = o.tone !== undefined;
      return this.fill(X0, Y0, X1, Y1, (x, y) => {
        const xs = rows[y - 0.5];
        if (!xs) return null;
        let c = 0;
        for (let q = 0; q < xs.length; q++) if (xs[q] > x) c++;
        if (!(c & 1)) return null;
        if (ov !== null) return ov(x, y);
        if (fixedT) return 0.5;
        let u = (x - cx) / hw, w = (y - cy) / hh; u = u < -1 ? -1 : u > 1 ? 1 : u; w = w < -1 ? -1 : w > 1 ? 1 : w;
        return lit(u * fl, w * fl * 0.8, Math.sqrt(Math.max(0.05, 1 - (u * u + w * w) * fl * fl)));
      }, m, o, yc => { const xs = rows[yc - 0.5]; if (!xs || !xs.length) return null; let lo = Infinity, hi = -Infinity; for (let q = 0; q < xs.length; q++) { if (xs[q] < lo) lo = xs[q]; if (xs[q] > hi) hi = xs[q]; } return span(lo - 0.01, hi + 0.01); });
    }
    rect(x, y, w, h, m, o = {}) { return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], m, o); }
    // pixel singolo / linea (Bresenham) con tono esplicito
    px(x, y, m, t, o = {}, same) {
      x = Math.floor(x); y = Math.floor(y);
      if (x < this.cx0 || y < this.cy0 || x > this.cx1 || y > this.cy1) return this;
      const i = y * this.w + x;
      if (o.keep && !this.sid[i]) return this;
      if (o.only && (Array.isArray(o.only) ? !o.only.includes(this.mt[i]) : o.only !== this.mt[i])) return this;
      if (m === null) { this.sid[i] = 0; this.mt[i] = null; return this; }
      if (!o.keep) { if (!(same || o.same)) this._new(o); this.sid[i] = this.n; this._bb(x, y, x, y); }
      this.mt[i] = m; this.tn[i] = t ?? 2; this.fx[i] = 1;
      return this;
    }
    line(x0, y0, x1, y1, m, t, o = {}, cont) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy, first = !cont;
      for (;;) {
        this.px(x0, y0, m, t, o, !first);
        first = false;
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
      return this;
    }
    // polilinea
    path(pts, m, t, o = {}) { for (let i = 1; i < pts.length; i++) this.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], m, t, o, i > 1); return this; }
    get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; return this.mt[y * this.w + x]; }
    // cottura: pulizia orfani, ombre portate, linee interne, nuclei emissivi, contorno
    bake(o = {}) {
      const { w, h, sid, mt, tn, fx, info } = this;
      const c = makeCanvas(w, h), cx = c.getContext('2d'), id = new ImageData(w, h);
      if (this.bx1 < 0) return c;
      const X0 = Math.max(0, this.bx0 - 1), X1 = Math.min(w - 1, this.bx1 + 1), Y0 = Math.max(0, this.by0 - 1), Y1 = Math.min(h - 1, this.by1 + 1);
      const U = new Uint32Array(id.data.buffer), G = new Uint8Array(w * h), T0 = Int8Array.from(tn);
      // proprietà per forma in array piatti: linea interna (-1 = no, 9 = nera) e ombra portata
      const NS = this.n + 1, EDG = new Int8Array(NS), CST = new Uint8Array(NS);
      for (let k = 1; k < NS; k++) { const e = info[k].edge; EDG[k] = e === undefined || e === false ? -1 : e === true ? 9 : e; CST[k] = info[k].cast ? 1 : 0; }
      // 1) maschera emissiva + pixel orfani (un tono isolato dentro la stessa forma prende il tono dei vicini)
      for (let y = Math.max(1, Y0); y <= Math.min(h - 2, Y1); y++) for (let x = Math.max(1, X0), i = y * w + x; x <= Math.min(w - 2, X1); x++, i++) {
        const s = sid[i];
        if (s === 0) continue;
        const m = mt[i];
        if (m === null) continue;
        if (m.glow) { G[i] = 1; continue; }
        if (fx[i] === 1) continue;
        const t0 = T0[i];
        if ((sid[i - 1] === s && T0[i - 1] === t0 && mt[i - 1] === m) || (sid[i + 1] === s && T0[i + 1] === t0 && mt[i + 1] === m) ||
            (sid[i - w] === s && T0[i - w] === t0 && mt[i - w] === m) || (sid[i + w] === s && T0[i + w] === t0 && mt[i + w] === m)) continue;
        let nb = 0, t1 = -1, c1 = 0, t2 = -1, c2 = 0, j, tj;
        j = i + w; if (sid[j] === s && mt[j] === m) { nb++; tj = T0[j]; if (t1 < 0 || tj === t1) { t1 = tj; c1++; } else if (t2 < 0 || tj === t2) { t2 = tj; c2++; } }
        j = i - w; if (sid[j] === s && mt[j] === m) { nb++; tj = T0[j]; if (t1 < 0 || tj === t1) { t1 = tj; c1++; } else if (t2 < 0 || tj === t2) { t2 = tj; c2++; } }
        j = i + 1; if (sid[j] === s && mt[j] === m) { nb++; tj = T0[j]; if (t1 < 0 || tj === t1) { t1 = tj; c1++; } else if (t2 < 0 || tj === t2) { t2 = tj; c2++; } }
        j = i - 1; if (sid[j] === s && mt[j] === m) { nb++; tj = T0[j]; if (t1 < 0 || tj === t1) { t1 = tj; c1++; } else if (t2 < 0 || tj === t2) { t2 = tj; c2++; } }
        if (nb >= 3) tn[i] = c1 >= c2 ? t1 : t2;
      }
      // pixel emissivi sul bordo della tela (fuori dal ciclo precedente)
      for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
        if (y > 0 && y < h - 1 && x > 0 && x < w - 1) { if (x < X1) x = X1 - 1; continue; }
        const i = y * w + x, m = mt[i]; if (sid[i] && m && m.glow) G[i] = 1;
      }
      const gAt = (x, y) => x >= 0 && y >= 0 && x < w && y < h && G[y * w + x] === 1;
      const pack = m => m._rgb || (m._rgb = m.r.map(hx => { const v = rgbOf(hx); return (255 << 24 | v[2] << 16 | v[1] << 8 | v[0]) >>> 0; }));
      const inkOf = mm => mm.glow || mm.soft ? 0 : mm.ink ? (mm._ol || (mm._ol = pack({ r: [mm.ink] })[0])) : INKU;
      const softOf = mm => mm._ol || (mm._ol = pack({ r: [mm.ol || mm.r[0]] })[0]);
      const INKU = pack({ r: [INK] })[0], outline = o.outline !== false;
      // 2) colore: nuclei emissivi, linee interne, ombre portate · contorno d'inchiostro sui vuoti
      for (let y = Y0; y <= Y1; y++) for (let x = X0, i = y * w + X0; x <= X1; x++, i++) {
        const s = sid[i], m = s === 0 ? null : mt[i];
        if (m === null) {
          if (!outline) continue;
          const dn = y + 1 < h && sid[i + w] !== 0, up = y > 0 && sid[i - w] !== 0, rt = x + 1 < w && sid[i + 1] !== 0, lf = x > 0 && sid[i - 1] !== 0;
          if (!(dn || up || rt || lf)) continue;
          let hard = 0, soft = null, mm;
          if (dn && (mm = mt[i + w]) && !mm.noOl) { const k = inkOf(mm); if (k) hard = k; else soft = mm; }
          if (up && (mm = mt[i - w]) && !mm.noOl) { const k = inkOf(mm); if (k) hard = k; else soft = mm; }
          if (rt && (mm = mt[i + 1]) && !mm.noOl) { const k = inkOf(mm); if (k) hard = k; else soft = mm; }
          if (lf && (mm = mt[i - 1]) && !mm.noOl) { const k = inkOf(mm); if (k) hard = k; else soft = mm; }
          if (hard) U[i] = hard; else if (soft) U[i] = softOf(soft);
          continue;
        }
        let t = tn[i];
        const R = m._rgb || pack(m), L = R.length - 1;
        if (G[i] === 1) {
          if (fx[i] === 0) {
            let d = 1;
            for (; d < 4; d++) if (!gAt(x, y + d) || !gAt(x, y - d) || !gAt(x + d, y) || !gAt(x - d, y)) break;
            t = m.base + d - 1;
          }
        } else {
          const edge = EDG[s];
          let e = false;
          if (edge >= 0) {
            let s2;
            if (y + 1 < h && (s2 = sid[i + w]) && s2 < s && !G[i + w]) e = true;
            else if (y > 0 && (s2 = sid[i - w]) && s2 < s && !G[i - w]) e = true;
            else if (x + 1 < w && (s2 = sid[i + 1]) && s2 < s && !G[i + 1]) e = true;
            else if (x > 0 && (s2 = sid[i - 1]) && s2 < s && !G[i - 1]) e = true;
            if (e) t = edge === 9 ? 0 : (edge < t ? edge : t);
          }
          if (!e && fx[i] === 0 && !m.nocast && y > 0) {
            const upS = sid[i - w];
            if (upS > s && CST[upS] === 1 && !G[i - w] && t > 0) t--;
          }
        }
        U[i] = R[t < 0 ? 0 : t > L ? L : t];
      }
      cx.putImageData(id, 0, 0);
      return c;
    }
  }
  // Registrazione nel registro SPR con la stessa forma di regSprite ({img, white, flip, flipWhite, w, h}),
  // ma le varianti bianca/specchiata si creano solo al primo uso (molti boss non vengono mai
  // specchiati): così il caricamento resta veloce.
  function regLazy(name, img) {
    const o = { img };
    const lazy = (k, mk) => Object.defineProperty(o, k, { configurable: true, enumerable: true, get() { const v = mk(); Object.defineProperty(o, k, { value: v, writable: true, enumerable: true, configurable: true }); return v; } });
    lazy('white', () => tinted(img, '#ffffff'));
    lazy('flip', () => flipped(img));
    lazy('flipWhite', () => flipped(o.white));
    o.w = img.width; o.h = img.height;
    SPR[name] = o;
    return o;
  }
  function reg3(id, w, h, draw, only0, free) {
    for (const [suf, k, p2] of only0 ? [['_0', 0, 0]] : [['_0', 0, 0], ['_1', 1, 0], ['_p2', 0, 1]]) {
      const P = new Px(w, h, free);
      draw(P, k, p2);
      regLazy('B_' + id + suf, P.bake());
    }
  }
  function reg2(name, w, h, draw) {
    for (const [suf, k] of [['', 0], ['_b', 1]]) {
      const P = new Px(w, h);
      draw(P, k);
      regLazy(name + suf, P.bake());
    }
  }
  // lingua di fiamma (emissiva): base in (x,y), alta h, larga w, inclinata di lean
  const flame = (P, x, y, h, w, m, lean = 0) => P.poly([[x - w, y], [x - w * 0.55 + lean * 0.35, y - h * 0.55], [x + lean, y - h], [x + w * 0.5 + lean * 0.45, y - h * 0.5], [x + w, y]], m);

  // ---------------------------------------------------------------- PALETTE comuni
  const GOLD = MAT(['#4a2a12', '#8a561c', '#c98e2c', '#efc458', '#fff0a6']);
  const BONE = MAT(['#3c3440', '#6e6670', '#a8a29c', '#d6d0c2', '#f4f0e2']);
  const DARK = MAT(['#0b0910', '#16121e', '#221c2c', '#30283c']);

  // =============================================================================
  // IL SIGNORE DELLA LUNA (Terraria) — 98x74, non specchiato.
  // Testa a cupola con cervello esposto, occhio frontale, tentacoli sulla bocca,
  // petto con gabbia toracica e Nucleo; due mani con un occhio nel palmo.
  // Mani centrate a x = 49 ± 38, y = 42 (= e.y − 12 con r = 20), come gli hitbox.
  // =============================================================================
  {
    const SK = MAT(['#262a40', '#414c66', '#647884', '#8ca39f', '#b3c7bd', '#dbe8dc']);
    const SKD = MAT(['#1c1e30', '#2f3650', '#46566a', '#627a80', '#86a09a']);
    const TEN = MAT(['#16203c', '#24406a', '#336a90', '#4c97ac', '#77c4c0']);
    const SCL = MAT(['#3a4652', '#8a9c9c', '#d2e0d8', '#f6fff8']);
    const IRIS = MAT(['#0b3a44', '#127a80', '#21c4b8', '#7af2dc', '#e8fff6'], { glow: true, base: 1, ol: '#0b2a34' });
    const CORE = MAT(['#123050', '#1e6a98', '#2ec0dc', '#8af4f0', '#ffffff'], { glow: true, base: 1, ol: '#0e2440' });
    const CAV = MAT(['#0c0a14', '#160f22', '#241a34', '#33264a']);
    const CLAW = MAT(['#141020', '#2a2438', '#4a4258', '#6e6680']);
    const CX = 49;

    const eye = (P, x, y, rx, ry, open, glowy, look = 0) => {
      // palpebre (pelle) + sclera + iride luminosa
      P.ell(x, y, rx + 1.6, ry + 1.4, SK, { fl: 0.8 });
      if (open <= 0) { P.line(x - rx, y, x + rx, y, SK, 0, { keep: true }); P.line(x - rx + 1, y + 1, x + rx - 1, y + 1, SK, 1, { keep: true }); return; }
      P.ell(x, y, rx, ry * open, glowy ? IRIS : SCL, { edge: 1 });
      const ir = Math.min(rx, ry * open) * 0.75;
      P.ell(x + look, y, ir, Math.min(ir, ry * open), IRIS, { keep: true });
      P.ell(x + look, y, Math.max(0.6, ir * 0.38), Math.max(0.8, ir * 0.7), CAV, { keep: true, tone: 0 });
      P.px(x + look - ir * 0.5, y - ir * 0.5, SCL, 3, { keep: true });
    };

    reg3('moonlord', 98, 74, (P, k, p2) => {
      const sw = k ? 1 : -1;
      // ---- spina dorsale esposta che pende sotto il busto, con brandelli di carne
      P.cap(CX - 4, 56, CX - 7, 64 + k, 1.6, SKD, { r2: 0.8 });
      P.cap(CX + 4, 56, CX + 6, 66 - k, 1.6, SKD, { r2: 0.8 });
      for (let i = 0; i < 7; i++) {
        const y = 57 + i * 2.3, x = CX + Math.sin(i * 0.8 + k * 0.7) * (i * 0.3);
        P.ell(x, y, 2.7 - i * 0.22, 1.2, BONE, { fl: 0.7 });
        if (i < 5) { P.px(x - 3 + i * 0.2, y, BONE, 1, { same: true }); P.px(x + 3 - i * 0.2, y, BONE, 1, { same: true }); }
      }
      // ---- braccia (dietro al busto): spalla -> gomito in basso -> polso
      for (const s of [-1, 1]) {
        const hx = CX + s * 38, hy = 42;
        const sx = CX + s * 17, sy = 33, ex = CX + s * 31, ey = 59;
        P.cap(sx, sy, ex, ey, 4.4, SK, { r2: 3.2 });
        P.ell(sx + s * 6, sy + 10, 3.6, 5.2, SK, { rot: -s * 0.5, keep: false, fl: 0.8 }); // bicipite
        P.ell(ex, ey, 3.4, 3.2, SK, { edge: 2 });                                         // gomito
        P.cap(ex, ey, hx + s * 0.5, hy + 8.5, 3.4, SK, { r2: 2.6, edge: 2 });
        // speroni d'osso sull'avambraccio e sul braccio
        for (let i = 0; i < 3; i++) { const t = 0.2 + i * 0.27, x = ex + (hx - ex) * t, y = ey + (hy + 8 - ey) * t; P.poly([[x + s * 2.4, y - 1.4], [x + s * 5.6, y + 0.6], [x + s * 2.6, y + 1.2]], SKD, { fl: 0.4 }); }
        for (let i = 0; i < 2; i++) { const t = 0.3 + i * 0.3, x = sx + (ex - sx) * t, y = sy + (ey - sy) * t; P.poly([[x + s * 3.4, y - 1.8], [x + s * 6.6, y - 1.2], [x + s * 3.6, y + 0.8]], SKD, { fl: 0.4 }); }
        // mano: 4 dita lunghe e artigliate verso l'alto + pollice verso l'interno
        const fing = [[-2.7, -1.1, 9], [-0.9, -0.3, 11.5], [0.9, 0.3, 11.5], [2.7, 1.1, 9]];
        fing.forEach(([fx, a, len], j) => {
          const bx = hx + fx * 1.85, by = hy - 4;
          const curl = k && (j === 1 || j === 2) ? 1 : 0;
          const mx = bx + a * 1.2, my = by - len * 0.55 + curl * 0.5, tx = bx + a * 2.4 + a * curl * 0.8, ty = by - len + curl;
          P.cap(bx, by, mx, my, 1.75, SK, { r2: 1.5, edge: 2 });
          P.cap(mx, my, tx, ty, 1.5, SK, { r2: 1.15, same: true });
          P.cap(tx, ty, tx + a * 0.9, ty - 2.6, 1, CLAW, { r2: 0.45 });
        });
        P.cap(hx - s * 5.5, hy + 3, hx - s * 10.5, hy - 2 + k, 1.9, SK, { r2: 1.4, edge: 2 });
        P.cap(hx - s * 10.5, hy - 2 + k, hx - s * 12, hy - 5 + k, 1, CLAW, { r2: 0.45 });
        P.egg(hx, hy + 1, 7.2, 7, 7.6, 0.25, SK, { edge: 2 });
        // pieghe del palmo
        P.path([[hx - 5, hy - 3], [hx - 2, hy - 4.6], [hx + 2, hy - 4.6], [hx + 5, hy - 3]], SK, 1, { keep: true });
        P.path([[hx - 4, hy + 6], [hx, hy + 7.4], [hx + 4, hy + 6]], SK, 2, { keep: true });
        // occhio nel palmo
        eye(P, hx, hy + 1.2, 4.4, 3.3, p2 ? 1 : (k ? 0.72 : 0.92), p2, -s * 0.6);
      }
      // ---- busto: torace largo che si stringe in vita, chiuso in basso da carne lacera
      P.poly([[CX - 21, 31], [CX + 21, 31], [CX + 18, 42], [CX + 11, 52], [CX + 9, 57], [CX + 5, 55.5], [CX + 2, 58], [CX - 2, 56], [CX - 5, 58], [CX - 9, 56], [CX - 11, 52], [CX - 18, 42]], SK, { fl: 0.7 });
      P.ell(CX - 9.5, 37.5, 9.5, 6.8, SK, { fl: 0.85 });
      P.ell(CX + 9.5, 37.5, 9.5, 6.8, SK, { fl: 0.85 });
      for (let i = 0; i < 2; i++) for (const s of [-1, 1]) P.ell(CX + s * 3.8, 50 + i * 3.4, 3.2, 1.8, SK, { fl: 0.6 });
      for (const s of [-1, 1]) P.path([[CX + s * 17, 41], [CX + s * 15, 45], [CX + s * 10, 48]], SK, 1, { keep: true }); // costato laterale
      // spalle (deltoidi)
      P.ell(CX - 18.5, 32.5, 6.6, 5.4, SK, { fl: 0.9 }); P.ell(CX + 18.5, 32.5, 6.6, 5.4, SK, { fl: 0.9 });
      // cavità toracica con costole + Nucleo
      if (!p2) {
        P.egg(CX, 44, 5.8, 5.2, 6, 0.45, CAV, { edge: true });
        P.ell(CX, 45, 3.4, 4, MAT(CORE.r, { glow: true, base: 1, ol: CORE.ol }), { keep: true, only: CAV });
        for (let i = 0; i < 4; i++) { const y = 40.5 + i * 2.6; P.cap(CX - 6 + i * 0.7, y, CX - 1.2, y + 1, 0.8, BONE); P.cap(CX + 6 - i * 0.7, y, CX + 1.2, y + 1, 0.8, BONE); }
        P.line(CX, 39, CX, 49, BONE, 2);
      } else {
        P.egg(CX, 44.5, 8.6, 7, 8, 0.35, CAV, { edge: true });
        for (let i = 0; i < 4; i++) { const y = 39 + i * 3; P.cap(CX - 8.5 + i * 0.4, y, CX - 12.5 + i * 0.6, y - 2, 1, BONE); P.cap(CX + 8.5 - i * 0.4, y, CX + 12.5 - i * 0.6, y - 2, 1, BONE); }
        for (const [a, l] of [[-2.6, 13], [-0.55, 13], [2.5, 12], [0.65, 12], [1.57, 12]]) P.line(CX + Math.cos(a) * 8, 45 + Math.sin(a) * 7, CX + Math.cos(a) * l * 1.5, 45 + Math.sin(a) * l * 1.1, CORE, 2, { keep: true, only: SK });
        P.ell(CX, 45, 5.8, 6.4, CORE);
        P.ell(CX - 1.6, 42.5, 1.2, 1.5, CORE, { tone: 4, keep: true });
      }
      // ---- collo / trapezi
      P.poly([[CX - 14, 33], [CX - 7, 23], [CX + 7, 23], [CX + 14, 33]], SK, { fl: 0.5 });
      // ---- testa a cupola
      P.egg(CX, 15.5, 14, 14.5, 12.5, 0.45, SK, { fl: 0.95 });
      // cervello esposto: lobi gonfi separati da solchi scuri
      const BR = MAT(['#2a2a44', '#4c5670', '#78908e', '#a2bab0', '#c8dcd0', '#e8f2e6']);
      for (const [x, y, rx, ry] of [[-9.5, 6.5, 3.6, 3.4], [9.5, 6.5, 3.6, 3.4], [-5, 3, 4.2, 2.8], [5, 3, 4.2, 2.8], [-5.5, 8, 3.8, 2.8], [5.5, 8, 3.8, 2.8], [-1.6, 5.5, 2.6, 4.2], [1.6, 5.5, 2.6, 4.2]]) P.ell(CX + x, y, rx, ry, BR, { edge: 1, clip: (xx, yy) => yy < 11 && P.get(xx, yy) });
      P.path([[CX, 1.5], [CX, 10]], BR, 0, { keep: true });
      // arcata sopraccigliare + occhio frontale
      P.path([[CX - 8, 13], [CX - 4, 11.6], [CX + 4, 11.6], [CX + 8, 13]], SKD, 2, { keep: true });
      eye(P, CX, 16.5, 5.2, 3.8, p2 ? 1 : (k ? 0.75 : 1), p2, 0);
      // orbite infossate ai lati con occhietti azzurri
      for (const s of [-1, 1]) { P.ell(CX + s * 8.6, 21.5, 2.6, 1.9, CAV, { keep: true, tone: 1 }); P.px(CX + s * 8.6 - (s > 0 ? 1 : 0), 21, IRIS, p2 ? 4 : 2, { keep: true }); }
      // zigomi
      for (const s of [-1, 1]) P.path([[CX + s * 12, 19], [CX + s * 10, 24], [CX + s * 7, 25.5]], SK, 1, { keep: true });
      // bocca con denti
      P.ell(CX, 25.5, 6.5, 2.4, CAV, { keep: true, tone: 0 });
      for (const x of [-5, -2, 2, 5]) { P.px(CX + x, 23.5, BONE, 3, { keep: true }); P.px(CX + x, 24.5, BONE, 2, { keep: true }); }
      for (const x of [-4, 0, 4]) P.px(CX + x, 27, BONE, 2, { keep: true });
      // tentacoli della bocca (barba di Cthulhu) — corti, lasciano vedere il petto
      const tl = [8, 11, 13, 14, 13, 11, 8];
      for (let i = 0; i < 7; i++) {
        const x0 = CX + (i - 3) * 2.2, y0 = 26, L = tl[i], bend = (i - 3) * 0.8 + sw * (i % 2 ? 1 : -0.7);
        const x1 = x0 + bend * 0.5, y1 = y0 + L * 0.55, x2 = x0 + bend * 1.2 + (i < 3 ? -1.5 : i > 3 ? 1.5 : 0), y2 = y0 + L;
        P.cap(x0, y0, x1, y1, 1.5, TEN, { r2: 1.25, edge: 1 });
        P.cap(x1, y1, x2, y2, 1.25, TEN, { r2: 0.6, same: true });
        P.px(x2 + (i < 3 ? -1 : 1), y2 - 0.5, TEN, 3, { same: true });
      }
    });
  }

  // =============================================================================
  // ESCRIBAR (Blasphemous) — 60x66, non specchiato, fluttua.
  // Fase 1 · Sua Santità: pontefice gigante con mitra altissima d'oro e bianco,
  // volto-maschera di pietra con lacrime di sangue, piviale rosso, alba bianca con
  // stola d'oro, ferula papale; un'aureola di raggi con tante manine di scribi
  // che reggono piume. Fase 2 · l'Ultimo Figlio del Miracolo: la maschera si
  // spacca e rivela il volto cremisi, la veste brucia, la mitra è oro fuso.
  // =============================================================================
  {
    const ROBE = MAT(['#2e2840', '#5e5874', '#9a96aa', '#cfccd6', '#f4f2ec']);
    const RED = MAT(['#24080f', '#4e1020', '#7e1a28', '#b02a34', '#d84a42']);
    const MASK = MAT(['#2e2a30', '#5e5856', '#918a80', '#bfb6a4', '#e2dccb']);
    const HAND = MAT(['#3e2a2c', '#7a5a54', '#b08c7c', '#d8b8a2', '#f0dac8']);
    const GLD = MAT(['#7a4a10', '#c4861e', '#f0c44a', '#fff09a', '#ffffff'], { glow: true, base: 1, ol: '#5a3008' });
    const QUILL = MAT(['#1a1420', '#3a3040', '#e8e4dc', '#ffffff']);
    // fase 2
    const CRIM = MAT(['#1e0608', '#4a0c12', '#821418', '#c42a1e', '#f0602a']);
    const CHAR = MAT(['#0e0a0e', '#1e161c', '#34262a', '#4e3a34']);
    const FIRE = MAT(['#6a1406', '#c83c0c', '#ff8a1e', '#ffcc4a', '#fff6c8'], { glow: true, base: 1, ol: '#3a0a06' });
    const FLESH = MAT(['#2a060a', '#6a0e16', '#a81c20', '#e0402c', '#ff8a5a']);
    const CX = 30;

    reg3('escribar', 60, 66, (P, k, p2) => {
      const robe = p2 ? CRIM : ROBE, cape = p2 ? CHAR : RED, gold = p2 ? CHAR : GOLD, trim = p2 ? FIRE : GOLD;
      // ---- raggiera da ostensorio dietro (oro / fuoco): raggi alterni lunghi e corti
      const ac = [CX, 21];
      for (let i = 0; i < 25; i++) {
        const a = Math.PI * 0.92 + i / 24 * Math.PI * 1.16, L = i % 2 ? 21 : 27, c = Math.cos(a), sn = Math.sin(a), w = i % 2 ? 0.8 : 1.2, r0 = 14;
        P.poly([[ac[0] + c * r0 - sn * w, ac[1] + sn * r0 + c * w], [ac[0] + c * L, ac[1] + sn * L], [ac[0] + c * r0 + sn * w, ac[1] + sn * r0 - c * w]], p2 ? FIRE : GLD);
      }
      P.ell(ac[0], ac[1], 15.2, 15.2, p2 ? FIRE : GLD, { clip: (x, y) => y < 33 });
      P.ell(ac[0], ac[1], 14, 14, null);
      // ---- manine di scribi con le piume, sulla raggiera
      const hands = [[-2.8, 22], [-2.3, 24], [-1.8, 25], [-1.34, 25], [-0.84, 24], [-0.34, 22]];
      hands.forEach(([a, r], j) => {
        const bob = ((j + k) % 2) ? 1 : 0;
        const x = ac[0] + Math.cos(a) * r, y = ac[1] + Math.sin(a) * r + bob, s = x < CX ? -1 : 1;
        P.cap(x + s * 0.5, y - 1, x + s * 3.2, y - 6, 0.55, QUILL, { tone: 0 });
        P.cap(x + s * 2, y - 3.2, x + s * 4.2, y - 7.6, 1.25, p2 ? FIRE : QUILL, { r2: 0.5, ...(p2 ? {} : { tone: 2 }) });
        if (!p2) P.line(x + s * 2.4, y - 3.8, x + s * 3.8, y - 6.8, QUILL, 1, { keep: true });
        P.ell(x, y, 1.9, 1.7, p2 ? CHAR : HAND, { fl: 0.6 });
        P.px(x - s * 1.8, y - 1, p2 ? CHAR : HAND, 3, { same: true });
        P.px(x, y + 2, p2 ? CHAR : HAND, 1, { same: true });
      });
      // ---- piviale (mantello) dietro, con bordo d'oro
      const sway = k ? 1 : 0;
      P.poly([[CX - 13, 32], [CX + 13, 32], [CX + 22, 52], [CX + 25 + sway, 63], [CX + 18, 61], [CX + 10, 64], [CX, 62], [CX - 10, 64], [CX - 18, 61], [CX - 25 - sway, 63], [CX - 22, 52]], cape, { fl: 0.5 });
      P.path([[CX - 13, 32], [CX - 22, 52], [CX - 25 - sway, 63]], trim, 2, { keep: true });
      P.path([[CX + 13, 32], [CX + 22, 52], [CX + 25 + sway, 63]], trim, 2, { keep: true });
      P.path([[CX - 16, 41], [CX - 19, 52], [CX - 20, 61]], cape, 1, { keep: true });
      P.path([[CX + 16, 41], [CX + 19, 52], [CX + 20, 61]], cape, 1, { keep: true });
      // ---- alba (svasata) con orlo dorato ondulato
      P.poly([[CX - 10, 33], [CX + 10, 33], [CX + 16, 50], [CX + 18 - sway, 62], [CX + 12, 64], [CX + 6, 62.5], [CX, 64.5], [CX - 6, 62.5], [CX - 12, 64], [CX - 18 + sway, 62], [CX - 16, 50]], robe, { fl: 0.55 });
      for (const fx of [-11, -6, 6, 11]) P.path([[CX + fx * 0.55, 41], [CX + fx * 0.85, 52], [CX + fx, 61]], robe, 1, { keep: true });
      for (const fx of [-9, -4, 8]) P.path([[CX + fx * 0.6, 45], [CX + fx * 0.9, 56]], robe, 3, { keep: true });
      P.path([[CX - 18 + sway, 62], [CX - 12, 64], [CX - 6, 62.5], [CX, 64.5], [CX + 6, 62.5], [CX + 12, 64], [CX + 18 - sway, 62]], trim, 2, { keep: true });
      P.path([[CX - 17 + sway, 60.5], [CX - 12, 62.5], [CX - 6, 61], [CX, 63], [CX + 6, 61], [CX + 12, 62.5], [CX + 17 - sway, 60.5]], trim, 3, { keep: true });
      // stola / orfreo d'oro con croce rossa
      P.poly([[CX - 3, 33], [CX + 3, 33], [CX + 3.5, 63], [CX - 3.5, 63]], gold, { fl: 0.4, edge: 1 });
      P.poly([[CX - 8, 39.5], [CX + 8, 39.5], [CX + 8, 42.5], [CX - 8, 42.5]], gold, { fl: 0.4, edge: 1 });
      P.line(CX, 35, CX, 61, p2 ? FIRE : RED, 3, { keep: true });
      P.line(CX - 6, 41, CX + 6, 41, p2 ? FIRE : RED, 3, { keep: true });
      for (const y of [47, 53, 59]) { P.px(CX - 2, y, trim, 4, { keep: true }); P.px(CX + 2, y, trim, 4, { keep: true }); }
      // ---- maniche a campana + mani
      // destra (a sinistra nello schermo): mano alzata in benedizione
      P.poly([[CX - 9, 33], [CX - 13, 34], [CX - 18, 47], [CX - 13, 50], [CX - 8, 47], [CX - 6, 39]], robe, { fl: 0.6, edge: 1 });
      P.path([[CX - 18, 47], [CX - 13, 50], [CX - 8, 47]], trim, 3, { keep: true });
      P.ell(CX - 9, 43.5, 2.2, 2.3, p2 ? FLESH : HAND, { edge: 1 });
      P.cap(CX - 9.6, 42, CX - 10.2, 38.4, 0.75, p2 ? FLESH : HAND, { same: true });
      P.cap(CX - 8.1, 42, CX - 8.1, 38, 0.75, p2 ? FLESH : HAND, { same: true });
      // sinistra (a destra nello schermo): regge la ferula papale
      P.poly([[CX + 9, 33], [CX + 13, 34], [CX + 19, 46], [CX + 14, 49], [CX + 9, 46], [CX + 6, 39]], robe, { fl: 0.6, edge: 1 });
      P.path([[CX + 19, 46], [CX + 14, 49], [CX + 9, 46]], trim, 3, { keep: true });
      const fx = CX + 17;
      P.cap(fx, 9, fx, 62, 0.8, trim, { fl: 0.5 });
      P.cap(fx, 2, fx, 10, 0.9, trim); P.cap(fx - 3.5, 5, fx + 3.5, 5, 0.85, trim, { same: true }); P.cap(fx - 2.5, 8, fx + 2.5, 8, 0.85, trim, { same: true });
      P.px(fx, 5, p2 ? FIRE : RED, 3, { keep: true });
      P.ell(fx - 1, 45, 2.4, 2, p2 ? FLESH : HAND, { edge: 1 });
      // ---- infule rosse bordate d'oro (dietro al volto)
      for (const s of [-1, 1]) {
        P.poly([[CX + s * 5, 17], [CX + s * 8, 17], [CX + s * 9.5, 31], [CX + s * 6.5, 32]], p2 ? CHAR : RED, { fl: 0.4 });
        P.path([[CX + s * 8, 17], [CX + s * 9.5, 31], [CX + s * 6.5, 32]], trim, 2, { keep: true });
      }
      // ---- collare d'oro a raggiera
      P.ell(CX, 32.5, 10.5, 3.6, gold, { fl: 0.7 });
      for (let i = 0; i < 7; i++) P.px(CX - 9 + i * 3, 33, trim, p2 ? 2 : 1, { keep: true });
      // ---- volto
      if (!p2) {
        P.egg(CX, 24.5, 6.6, 6.5, 7, 0.34, MASK, { fl: 0.6, bias: 0.12 });
        // maschera serena di pietra: arcate, occhi chiusi, naso, bocca; lacrime di sangue
        P.line(CX - 5, 21.5, CX - 2, 21.5, MASK, 4, { keep: true }); P.line(CX + 2, 21.5, CX + 4, 21.5, MASK, 3, { keep: true });
        P.line(CX - 4, 23.5, CX - 2, 23.5, MASK, 0, { keep: true }); P.line(CX + 2, 23.5, CX + 4, 23.5, MASK, 0, { keep: true });
        P.px(CX - 5, 23, MASK, 1, { keep: true }); P.px(CX + 5, 23, MASK, 1, { keep: true });
        P.line(CX + 1, 23, CX + 1, 26.5, MASK, 1, { keep: true }); P.line(CX, 22.5, CX, 26, MASK, 4, { keep: true });
        P.px(CX - 1, 27, MASK, 1, { keep: true }); P.px(CX + 1, 27, MASK, 1, { keep: true });
        P.line(CX - 1, 29, CX + 1, 29, MASK, 1, { keep: true });
        P.line(CX - 3, 24.5, CX - 3, 27.5 + k, RED, 3, { keep: true }); P.line(CX + 3, 24.5, CX + 3, 26.5 - k, RED, 2, { keep: true });
        P.path([[CX + 5.5, 19.5], [CX + 4.5, 21], [CX + 5, 22]], MASK, 1, { keep: true }); // crepa
      } else {
        P.egg(CX, 24.5, 6.6, 6.5, 7, 0.34, FLESH, { fl: 0.9 });
        // volto cremisi: sopracciglia aggrottate, occhi di brace, bocca spalancata
        P.path([[CX - 5, 21.5], [CX - 1, 23.5]], DARK, 1, { keep: true }); P.path([[CX + 5, 21.5], [CX + 1, 23.5]], DARK, 1, { keep: true });
        P.line(CX - 4, 23.5, CX - 2, 24.5, FIRE, 4, { keep: true }); P.line(CX + 4, 23.5, CX + 2, 24.5, FIRE, 4, { keep: true });
        P.ell(CX, 28.6, 1.7, 2.3, DARK, { keep: true, tone: 0 });
        P.px(CX - 1, 27, BONE, 2, { keep: true }); P.px(CX + 1, 27, BONE, 2, { keep: true });
        P.line(CX - 5, 26, CX - 5, 29, FLESH, 1, { keep: true }); P.line(CX + 5, 26, CX + 5, 29, FLESH, 1, { keep: true });
        // la maschera spaccata in due che si apre ai lati
        P.poly([[CX - 8, 20], [CX - 5, 21.5], [CX - 6.5, 25.5], [CX - 9.5, 31.5], [CX - 11.5, 28]], MASK, { fl: 0.6, edge: 1 });
        P.poly([[CX + 6, 17.5], [CX + 9.5, 16.5], [CX + 11, 21], [CX + 7.5, 23]], MASK, { fl: 0.6, edge: 1 });
        P.line(CX - 7, 24, CX - 9, 26, DARK, 1, { keep: true }); P.px(CX - 7, 22, MASK, 4, { keep: true });
      }
      // ---- mitra altissima
      const mit = [[CX - 7.5, 19], [CX - 8.5, 13], [CX - 7.5, 8], [CX - 5, 4], [CX - 2, 1.5], [CX, 0.5], [CX + 2, 1.5], [CX + 5, 4], [CX + 7.5, 8], [CX + 8.5, 13], [CX + 7.5, 19]];
      P.poly(mit, gold, { fl: 0.7 });
      const inner = (x, y) => { const t = clamp((y - 1) / 18, 0, 1), half = 1.2 + Math.sqrt(t) * 5.6; return y > 3 && y < 15.5 && Math.abs(x - CX) < half && Math.abs(x - CX) > 1.1; };
      P.fill(0, 0, P.w - 1, 18, (x, y) => inner(x - 0.5, y - 0.5) ? 0.5 : null, p2 ? CHAR : ROBE, { keep: true, tone: (x, y) => p2 ? 1 + (x < CX ? 1 : 0) : (x < CX ? 4 : 3) - (y > 11 ? 1 : 0) });
      if (p2) for (const pts of [[[CX - 5, 5], [CX - 4, 8], [CX - 6, 11], [CX - 5, 14]], [[CX + 4, 4], [CX + 5, 7], [CX + 3, 10], [CX + 5, 13]], [[CX, 2], [CX, 7], [CX - 1, 10]]]) P.path(pts, FIRE, 2, { keep: true });
      if (!p2) {
        P.line(CX, 2, CX, 15, GOLD, 3, { keep: true });
        P.line(CX - 4, 8, CX + 4, 8, GOLD, 3, { keep: true });
        P.ell(CX, 8, 1.4, 1.4, RED, { keep: true, tone: 3 }); P.px(CX - 0.5, 7.5, RED, 4, { keep: true });
        for (const [x, y] of [[CX - 4, 12], [CX + 4, 12], [CX - 3, 4.5], [CX + 3, 4.5]]) P.px(x, y, RED, 3, { keep: true });
      }
      P.poly([[CX - 8.5, 15.5], [CX + 8.5, 15.5], [CX + 8, 19], [CX - 8, 19]], gold, { fl: 0.4, edge: 1 });
      for (let i = 0; i < 5; i++) P.px(CX - 6 + i * 3, 17, p2 ? FIRE : RED, p2 ? 3 : 3, { keep: true });
      P.cap(CX, -0.5, CX, 2.5, 0.6, trim, { tone: p2 ? 3 : 4 });
      // ---- fase 2: fiamme che lambiscono l'orlo e le maniche, braci
      if (p2) {
        for (let i = 0; i < 9; i++) { const x = CX - 20 + i * 5, base = 64 - (i % 2); flame(P, x, base, 6 + ((i + k) % 3) * 2, 2.1, FIRE, (i % 2 ? 1 : -1) * (k ? 1 : 0.5)); }
        flame(P, CX - 16, 48, 6, 1.8, FIRE, -1 - k); flame(P, CX + 16, 47, 6, 1.8, FIRE, 1 + k);
        for (const [x, y] of [[CX - 22, 36], [CX + 24, 34], [CX - 25, 47], [CX + 26, 53]]) P.px(x, y - k, FIRE, 3);
      }
    });
  }

  // =============================================================================
  // LA MAMMA (The Binding of Isaac) — 42x72, non specchiato.
  // La gamba scende dall'alto: orlo della gonna anni '70 in cima, gamba nuda,
  // décolleté rossa col tacco a spillo che pesta. Fase 2: vene bluastre e lividi
  // (come la Mamma "forte" del Mausoleo), scarpa scorticata.
  // + l'occhio della Mamma che sbircia dalla fessura della porta (32x24).
  // =============================================================================
  {
    const LEG = MAT(['#4e2630', '#94545a', '#c88676', '#e8b296', '#f8d6be']);
    const LEG2 = MAT(['#4a2034', '#8a4a5a', '#c07a76', '#e0a28e', '#f2c6b0']);
    const SHOE = MAT(['#2a0610', '#6a0e1e', '#ae1a26', '#e0383a', '#ff8a7a']);
    const SKIRT = MAT(['#10203a', '#1e3e62', '#2e6488', '#4a90a8', '#7ab8c0']);
    const LACE = MAT(['#6a6a78', '#b8b8c2', '#e8e6e0', '#ffffff']);
    const VEIN = MAT(['#1e2050', '#34408a', '#5a6ab8', '#8a9ad8']);
    const BRUISE = MAT(['#2a1a3a', '#4e2a5a', '#7a4a7a', '#9a6a8a']);

    reg3('mom', 42, 72, (P, k, p2) => {
      const skin = p2 ? LEG2 : LEG;
      // ---- gamba di profilo (punta a destra): coscia, ginocchio davanti, polpaccio dietro, caviglia
      P.poly([[11, 0], [30.5, 0], [31, 12], [30, 22], [30.5, 26], [29, 31], [27.5, 40], [25.5, 48], [24, 55], [17.5, 56], [16.5, 51], [12.5, 45], [10.8, 38], [11.2, 32], [12.6, 26], [11.6, 14]], skin, { fl: 0.85, cx: 20, cy: 26 });
      P.path([[26, 25], [28, 27.5], [28, 30]], skin, 1, { keep: true });   // rotula
      P.path([[13.5, 27], [12.5, 31]], skin, 1, { keep: true });          // incavo del ginocchio
      P.path([[12, 35], [12, 40], [13.5, 44]], skin, 4, { keep: true });  // luce sul polpaccio
      P.path([[19, 47], [18.5, 54]], skin, 1, { keep: true });            // tendine d'Achille
      P.path([[26.5, 35], [25, 44]], skin, 2, { keep: true });            // stinco
      // ---- collo del piede (pelle che esce dalla scarpa)
      P.poly([[17.5, 53], [24, 53], [27, 58], [31.5, 62], [26, 64.5], [20, 61], [17, 59]], skin, { fl: 0.6, bias: 0.05 });
      P.path([[22, 56], [25, 59.5], [28, 61.5]], skin, 3, { keep: true });
      // ---- décolleté rossa col tacco a spillo
      P.poly([[13.5, 56.5], [19.5, 57], [21, 61], [26, 64], [31.5, 62.5], [36, 64.5], [39.5, 67.5], [39.5, 70.5], [31, 70.5], [26, 68.5], [21, 66], [17.5, 64.5], [13.5, 63.5], [12.5, 60]], SHOE, { v: (x, y) => 0.86 - (y - 57) * 0.045 - (x < 18 ? 0.08 : 0) + (x > 30 && y < 67 ? 0.06 : 0) });
      P.path([[19.5, 57.5], [21, 61], [26, 63.5], [31.5, 62]], SHOE, 4, { keep: true }); // bordo lucido dell'apertura
      P.path([[26, 68.5], [31, 70.5], [39, 70.5]], SHOE, 0, { keep: true });            // suola
      P.path([[33, 65], [36, 65.5], [37.5, 67]], SHOE, 4, { keep: true }); P.px(15, 58.5, SHOE, 4, { keep: true }); P.px(15, 59.5, SHOE, 4, { keep: true });
      // tacco a spillo
      P.poly([[13.5, 62.5], [17.5, 64], [16.3, 71], [15, 71]], SHOE, { fl: 0.4 });
      P.line(15, 70, 16, 70, DARK, 2, { keep: true });
      // ---- orlo della gonna anni '70 (pieghe + pizzo + fiorellini)
      const fl2 = k ? 1 : 0;
      P.poly([[6, 0], [36, 0], [36.5, 6], [34 + fl2, 9.5], [30, 8], [26, 10], [21, 8.5], [16, 10], [11, 8], [7 - fl2, 9.5], [5.5, 6]], SKIRT, { fl: 0.6 });
      for (const x of [11, 16, 21, 26, 31]) P.line(x, 1, x + (x < 21 ? -0.5 : 0.5), 8, SKIRT, 1, { keep: true });
      for (const [x, y] of [[9, 3], [14, 5], [19, 2], [24, 5], [29, 3], [33, 6], [8, 7]]) { P.px(x, y, LACE, 3, { keep: true }); P.px(x + 1, y, SKIRT, 4, { keep: true }); }
      P.path([[7 - fl2, 9.5], [11, 8], [16, 10], [21, 8.5], [26, 10], [30, 8], [34 + fl2, 9.5]], LACE, 2, { keep: false });
      P.path([[7 - fl2, 10.5], [11, 9], [16, 11], [21, 9.5], [26, 11], [30, 9], [34 + fl2, 10.5]], LACE, 1, { same: true });
      for (const x of [9, 13, 18, 23, 28, 32]) P.px(x, 11 + (x % 2), LACE, 2, { same: true });
      // ---- fase 2: vene varicose bluastre e lividi
      if (p2) {
        P.path([[16, 13], [17, 18], [15.5, 23], [16.5, 29], [15, 35], [16.5, 41], [16, 46]], VEIN, 1, { keep: true, only: skin });
        P.path([[17, 18], [19.5, 21], [20, 25]], VEIN, 1, { keep: true, only: skin }); P.path([[16.5, 29], [19, 32], [20, 37]], VEIN, 1, { keep: true, only: skin });
        for (const [x, y] of [[16, 23], [15, 35], [16, 41]]) P.px(x, y, VEIN, 2, { keep: true });
        P.path([[24, 14], [23, 19], [25, 23]], VEIN, 1, { keep: true, only: skin });
        P.ell(22, 17, 2.4, 1.8, BRUISE, { keep: true, only: skin }); P.ell(19.5, 44, 1.8, 2.4, BRUISE, { keep: true, only: skin });
        P.px(21, 16, BRUISE, 3, { keep: true }); P.px(19, 43, BRUISE, 3, { keep: true });
        for (const [x, y] of [[28, 66], [33, 68], [18, 62]]) P.px(x, y, SHOE, 1, { keep: true });
      }
    }, false, { top: true }); // la gamba entra dall'alto: niente contorno in cima

    // ---- l'occhio della Mamma nella fessura della porta
    const WOOD = MAT(['#1e100e', '#3e2218', '#5e3820', '#7e5230', '#9e6e44']);
    const IRISM = MAT(['#1e0e08', '#4a2a14', '#7a4a22', '#a87638', '#d8a85a']);
    const SCLM = MAT(['#6a5a5a', '#c4b4ae', '#ece4dc', '#ffffff']);
    reg3('momeye', 32, 24, (P, k, p2) => {
      // la pelle del volto riempie la fessura (primissimo piano)
      P.rect(6, 0, 20, 24, LEG, { v: (x, y) => 0.62 - Math.abs(x - 16) * 0.03 - Math.abs(y - 12) * 0.012 });
      // sopracciglio
      P.path([[8, 4], [11, 2.5], [16, 2], [21, 2.5], [24, 4]], IRISM, 1, { keep: true });
      P.path([[9, 3], [12, 1.5], [16, 1]], IRISM, 2, { keep: true });
      // occhio a mandorla (palpebra in ombra attorno)
      const ry = 5.6, look = k ? 2 : -0.5;
      P.ell(16, 12, 10.5, ry + 2.4, LEG, { keep: true, bias: -0.2 });
      P.fill(5, 4, 27, 20, (x, y) => { const u = (x - 16) / 9, w = (y - 12.3) / (ry * (1 - 0.35 * Math.abs((x - 16) / 9))); return (u * u + w * w <= 1) ? 0.5 : null; }, p2 ? MAT(['#5a1a1a', '#b44a44', '#e08a80', '#f4c4bc']) : SCLM, { tone: (x, y) => (y < 11 ? 2 : 3) - (Math.abs(x - 16) > 6 ? 1 : 0) });
      const scl = P.get(16, 12);
      // vene rosse sulla sclera
      for (const pts of [[[8, 12], [10, 11.5], [11, 13]], [[24, 12], [22, 13], [21.5, 11]], [[9, 14], [11, 14.5]], [[23, 10.5], [21, 10]]]) P.path(pts, SHOE, p2 ? 1 : 2, { keep: true, only: scl });
      if (p2) for (const pts of [[[10, 10], [12.5, 9.5]], [[22, 15], [20, 15.5]], [[12, 16], [13, 15]]]) P.path(pts, SHOE, 2, { keep: true, only: scl });
      const ir = p2 ? 3.6 : 4.2;
      P.ell(16 + look, 12.3, ir, ir, IRISM, { keep: true, only: [scl, IRISM] });
      P.ell(16 + look, 12.3, p2 ? 1.1 : 1.9, p2 ? 1.1 : 1.9, DARK, { keep: true, tone: 0, only: IRISM });
      P.px(14.5 + look, 10.5, SCLM, 3, { keep: true }); P.px(15.5 + look, 10.5, SCLM, 3, { keep: true });
      // palpebra superiore (linea spessa con ciglia) e inferiore
      P.path([[6.5, 12.5], [9, 9], [12, 7.2], [16, 6.6], [20, 7.2], [23, 9], [25.5, 12.5]], DARK, 1, { keep: true });
      P.path([[8, 10], [11, 8], [16, 7.4], [21, 8], [24, 10]], DARK, 2, { keep: true, only: scl });
      for (const [x, y, d] of [[8, 9, -1], [10, 7.5, -1], [13, 6.5, -1], [19, 6.5, 1], [22, 7.5, 1], [24, 9, 1]]) P.px(x + d, y - 1.5, DARK, 1, { keep: true });
      P.path([[8, 15], [12, 17], [20, 17], [24, 15]], LEG, 1, { keep: true });
      P.path([[9, 18.5], [16, 19.5], [23, 18.5]], LEG, 2, { keep: true });
      // ante della porta (legno a doghe) ai lati della fessura
      for (const [x0, x1] of [[0, 6.5], [25.5, 31]]) {
        P.rect(x0, 0, x1 - x0, 23, WOOD, { fl: 0.4, edge: true });
        P.line(Math.round((x0 + x1) / 2), 1, Math.round((x0 + x1) / 2), 22, WOOD, 1, { keep: true });
        P.px(x0 + 1.5, 4, WOOD, 4, { keep: true }); P.px(x0 + 1.5, 18, WOOD, 4, { keep: true });
      }
    }, true, { all: true }); // il gioco usa solo B_momeye_0 (effetto 'img' della Mamma)
    SPR.B_momeye_1 = SPR.B_momeye_p2 = SPR.B_momeye_0; // niente versioni vecchie in giro
  }

  // =============================================================================
  // MINI-BOSS (2 fotogrammi, rivolti a destra)
  // =============================================================================

  // ---- FALSO CAVALIERE (Hollow Knight): un verme nell'armatura grigia di Hegemol,
  // elmo tondo da cui sbircia la faccina arancione del verme, mazza enorme
  // (la "Macebug", con le zampette) alzata sopra la testa.
  {
    const ARM = MAT(['#16161f', '#2c2e3c', '#4a4e60', '#727890', '#a4aabb']);
    const ARMD = MAT(['#0e0e16', '#1c1c28', '#2e3040', '#444858']);
    const MAG = MAT(['#4a1e0c', '#9a4a1a', '#d8823a', '#f6b868', '#ffe0a8']);
    const MACE = MAT(['#0e0c14', '#1e1a28', '#363044', '#56506a', '#827c96']);
    const HAN = MAT(['#2a160e', '#4e2e1a', '#7a4a2a', '#a06a3c']);
    reg2('falseknight', 42, 38, (P, k) => {
      const mu = k ? 2 : 0;
      // gambette tozze
      P.cap(12, 30, 11 + (k ? 1 : -1), 35.5, 2.6, ARMD, { r2: 2.2 }); P.ell(10.5 + (k ? 1 : -1), 36, 3.4, 1.6, ARMD);
      P.cap(22, 30, 23 + (k ? -1 : 1), 35.5, 2.6, ARMD, { r2: 2.2 }); P.ell(23.5 + (k ? -1 : 1), 36, 3.4, 1.6, ARMD);
      // braccio posteriore
      P.cap(7, 20, 4, 27, 2.6, ARMD, { r2: 2.2 }); P.ell(4, 28, 2.6, 2.2, ARMD);
      // corpo-corazza tondo a piastre
      P.ell(17, 22, 12.5, 10.5, ARM);
      for (const [y, w] of [[17, 10], [22, 12], [27, 10]]) P.path([[17 - w, y + 1], [17 - w * 0.5, y - 0.5], [17 + w * 0.5, y - 0.5], [17 + w, y + 1]], ARM, 1, { keep: true });
      for (const [x, y] of [[9, 16], [13, 15], [21, 15], [8, 21], [26, 21], [10, 26], [24, 26]]) P.px(x, y, ARM, 4, { keep: true });
      P.ell(17, 31, 8, 2, ARMD, { keep: true, tone: 1 });
      // spallaccio anteriore
      P.ell(25, 15, 5.2, 4.2, ARM, { edge: 1 });
      P.path([[21, 15], [25, 13], [29, 15]], ARM, 4, { keep: true });
      // elmo tondo con cresta, apertura frontale con la faccina del verme
      P.ell(19, 9, 7.6, 6.6, ARM, { edge: 1 });
      P.poly([[16, 3.5], [19, -0.5], [21, 3]], ARM, { fl: 0.4 });
      P.ell(22.5, 10, 4.2, 3.6, ARMD, { keep: true, tone: 0 });
      P.ell(23, 10.5, 3, 2.6, MAG, { keep: true });
      P.px(22, 10, DARK, 0, { keep: true }); P.px(24.5, 10, DARK, 0, { keep: true });
      P.path([[13, 6], [16, 3.5], [20, 3]], ARM, 4, { keep: true });
      P.path([[12.5, 12], [15, 14.5], [19, 15.5]], ARM, 1, { keep: true });
      // braccio anteriore alzato che regge la mazza
      P.cap(26, 16, 31, 9 - mu, 2.6, ARM, { r2: 2.3, edge: 1 });
      // mazza: manico + testa chiodata enorme (la Macebug, con le zampette)
      const mx = 34.5, my = 7 - mu;
      P.cap(29.5, 15 - mu, mx - 2, my + 3, 1.3, HAN);
      P.ell(30.5, 10.5 - mu, 2.8, 2.5, ARMD, { edge: 1 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.4; P.poly([[mx + Math.cos(a - 0.32) * 4.8, my + Math.sin(a - 0.32) * 4.8], [mx + Math.cos(a) * 7.4, my + Math.sin(a) * 7.4], [mx + Math.cos(a + 0.32) * 4.8, my + Math.sin(a + 0.32) * 4.8]], MACE, { fl: 0.3 }); }
      P.ell(mx, my, 5.6, 5.4, MACE);
      P.path([[mx - 3.5, my - 2], [mx - 1, my - 4], [mx + 2.5, my - 3.5]], MACE, 4, { keep: true });
      P.path([[mx - 4.5, my + 2], [mx, my + 4], [mx + 4.5, my + 2]], MACE, 1, { keep: true });
      P.path([[mx - 5, my], [mx + 5, my]], MACE, 2, { keep: true });
      for (const [dx, d] of [[-3, -1], [0, 0], [3, 1]]) P.line(mx + dx, my + 5.5, mx + dx + d, my + 8 + (k ? 0 : 1), MACE, 1);
    });
  }

  // ---- SWORDSMACHINE (ULTRAKILL): macchina allampanata gialla e nera, testa alta e
  // rettangolare con gli occhi blu in cima (spaiati), armatura bruciacchiata,
  // avambraccio-fucile a pompa e spada motorizzata che arroventa il filo.
  {
    const YEL = MAT(['#2e1e06', '#6e4c0e', '#b48a16', '#e8c228', '#fff27a']);
    const BLK = MAT(['#09080d', '#15121b', '#241f2c', '#36303f']);
    const STEEL = MAT(['#1e2028', '#3e4250', '#6a7080', '#9aa2b2', '#d0d6e2']);
    const EYEB = MAT(['#0a2050', '#1a50b0', '#3a96ff', '#a0dcff', '#ffffff'], { glow: true, base: 2, ol: '#0a1640' });
    const HOT = MAT(['#6a1a06', '#c84a0e', '#ff8a1e', '#ffd04a', '#fff6c8'], { glow: true, base: 1, ol: '#4a1206' });
    reg2('swordsmachine', 32, 34, (P, k) => {
      const st = k ? 1 : 0;
      // gambe lunghe e nere con schinieri gialli
      P.cap(12, 22, 10 + (k ? 1.5 : -1), 31, 1.6, BLK); P.rect(7.5 + (k ? 1.5 : -1), 31, 5, 2.4, BLK);
      P.cap(18, 22, 20 + (k ? -1.5 : 1), 31, 1.6, BLK); P.rect(17.5 + (k ? -1.5 : 1), 31, 5, 2.4, BLK);
      P.poly([[9.5 + (k ? 1 : -0.5), 25], [13.5 + (k ? 1 : -0.5), 25], [13 + (k ? 1.4 : -1), 30], [10 + (k ? 1.4 : -1), 30]], YEL, { fl: 0.5 });
      P.poly([[17 + (k ? -1 : 0.5), 25], [21 + (k ? -1 : 0.5), 25], [21 + (k ? -1.4 : 1), 30], [18 + (k ? -1.4 : 1), 30]], YEL, { fl: 0.5 });
      // bacino
      P.rect(10, 19.5, 10, 3.5, BLK, { fl: 0.4 });
      // braccio posteriore: avambraccio = fucile a pompa
      P.cap(9, 12, 6, 18, 1.5, BLK);
      P.rect(2, 17.5, 7, 3, STEEL, { fl: 0.4 }); P.rect(0.5, 18, 2, 2, BLK, { tone: 0 }); P.rect(5, 20.5, 2.5, 2, BLK);
      P.line(2, 18, 7, 18, STEEL, 4, { keep: true });
      // torso: corazza gialla a placche, giunture nere
      P.poly([[8, 10], [22, 10], [21, 19.5], [9, 19.5]], YEL, { fl: 0.6 });
      P.rect(13.5, 11, 3, 8.5, BLK, { fl: 0.3 });
      P.line(8, 15, 13, 15, YEL, 1, { keep: true }); P.line(17, 15, 21.5, 15, YEL, 1, { keep: true });
      for (const [x, y] of [[10, 12], [19, 17], [11, 18], [20, 12]]) P.px(x, y, YEL, 0, { keep: true }); // bruciature
      P.ell(8.5, 11, 2.6, 2, YEL, { edge: 1 }); P.ell(21.5, 11, 2.6, 2, YEL, { edge: 1 });
      // testa alta e rettangolare, occhi blu in cima e spaiati
      P.rect(12, 0.5, 6.5, 9, YEL, { fl: 0.5 });
      P.rect(12.5, 4.5, 5.5, 4, BLK, { tone: 1 });
      P.line(13, 7, 17.5, 7, BLK, 3, { keep: true });
      P.px(13, 1.5, EYEB, 3); P.px(14, 1.5, EYEB, 3, { same: true }); P.px(16.5, 2.5, EYEB, 3); P.px(17.5, 2.5, EYEB, 2, { same: true });
      P.rect(14, 9, 2.5, 1.5, BLK);
      // braccio anteriore + spada motorizzata (filo arroventato, denti della catena)
      P.cap(22, 12, 24, 17.5 + st, 1.6, BLK);
      const hx = 24.5, hy = 18.5 + st, tx = 30.5, ty = 0.5 + st;
      P.cap(hx - 1, hy + 1, hx + 0.5, hy - 2, 1.4, BLK);
      P.poly([[hx - 1, hy - 2], [hx + 3, hy - 1], [tx + 1, ty + 2], [tx - 0.5, ty - 0.5], [tx - 2.5, ty + 0.5]], STEEL, { fl: 0.5 });
      P.line(hx, hy - 3, tx - 2, ty + 1, STEEL, 4, { keep: true });
      P.line(hx + 2.5, hy - 1.5, tx + 0.5, ty + 2, HOT, 2, { keep: true });
      for (let i = 0; i < 6; i++) { const t = 0.12 + i * 0.15, x = hx + 3 + (tx + 1 - hx - 3) * t, y = hy - 1 + (ty + 2 - hy + 1) * t; P.px(x + 1, y + ((i + k) % 2) * 0.6, HOT, 3); }
      P.rect(hx - 2.5, hy - 3, 5, 2, YEL, { fl: 0.4 }); // guardia / motore
      P.px(hx - 2, hy - 2.5, BLK, 1, { keep: true });
      P.ell(hx, hy, 1.8, 1.6, BLK);
    });
  }

  // ---- MEGERA (Hades): pelle azzurro pallido, capelli blu scuro in coda alta, occhi
  // gialli, labbra rosa, una sola grande ala da pipistrello (dentro nero-blu, fuori
  // rosa-rossa), abiti grigio scuro e blu con placche d'oro, frusta rosa.
  {
    const SKN = MAT(['#26304e', '#46587e', '#7690b4', '#a6bed8', '#d4e4f0']);
    const HAIR = MAT(['#0a0c22', '#161c44', '#24306c', '#36488e']);
    const CLO = MAT(['#0c0c16', '#1a1a2a', '#2a2c44', '#3c4060', '#565a7e']);
    const WIN = MAT(['#07070d', '#101224', '#1a2038', '#283050']);
    const WRED = MAT(['#2e0814', '#6a1228', '#a82640', '#d8505e', '#f08a88']);
    const WHIP = MAT(['#3e0822', '#8e164c', '#d8327a', '#ff7ab4', '#ffc4de']);
    const YEYE = MAT(['#6a4a06', '#c89a10', '#ffe040', '#fff8b0'], { glow: true, base: 2 });
    reg2('megaera', 36, 34, (P, k) => {
      const f = k ? 4 : 0; // battito d'ala
      // ---- l'unica grande ala da pipistrello, dal dorso verso sinistra
      const sh = [15, 12];
      const tips = [[1, 1 + f * 0.6], [0.5, 10 + f * 0.4], [3, 18 + f * 0.1], [8, 22 - f * 0.2]];
      const knuckle = [6, 3 + f * 0.5];
      P.poly([sh, knuckle, ...tips.slice(0, 1), [2.5, 6 + f * 0.5], tips[1], [4.5, 15 + f * 0.25], tips[2], [6.5, 19.5], tips[3], [12, 20]], WIN, { fl: 0.3 });
      P.cap(sh[0], sh[1], knuckle[0], knuckle[1], 1.3, WRED, { r2: 1 });
      for (const t of tips) P.cap(knuckle[0], knuckle[1], t[0], t[1], 0.6, WRED, { tone: 2 });
      P.path([knuckle, tips[0]], WRED, 3, { keep: true });
      P.poly([[knuckle[0] - 1, knuckle[1] - 2], [knuckle[0] - 2.5, knuckle[1] - 4.5], [knuckle[0] + 0.5, knuckle[1] - 1]], WRED, { fl: 0.3 }); // artiglio
      // ---- gambe: stivali scuri con schinieri d'oro
      P.cap(18, 24, 17 + (k ? 0.5 : -0.5), 32, 1.6, CLO); P.cap(23, 24, 24 + (k ? -0.5 : 0.5), 32, 1.6, CLO);
      P.rect(15.5 + (k ? 0.5 : -0.5), 31.5, 4, 2, CLO); P.rect(22.5 + (k ? -0.5 : 0.5), 31.5, 4, 2, CLO);
      P.rect(16.5, 26.5, 3, 3, GOLD, { fl: 0.5 }); P.rect(22.5, 26.5, 3, 3, GOLD, { fl: 0.5 });
      // ---- veste: gonna a pannelli grigio-blu con spacchi
      P.poly([[15, 16], [26, 16], [28, 25], [24, 23.5], [21, 26], [18, 23.5], [14, 25]], CLO, { fl: 0.6 });
      P.line(21, 18, 21, 25, CLO, 1, { keep: true });
      P.rect(15.5, 16, 10, 1.6, GOLD, { fl: 0.3 }); // cintura
      // braccio posteriore
      P.cap(16, 11, 13.5, 17, 1.3, SKN);
      // ---- busto
      P.poly([[16, 9.5], [25, 9.5], [24.5, 16.5], [16.5, 16.5]], CLO, { fl: 0.6 });
      P.poly([[18.5, 9.5], [22.5, 9.5], [20.5, 13]], SKN, { fl: 0.4 }); // scollo
      P.ell(16.5, 10.5, 2.4, 1.8, GOLD, { edge: 1 }); P.ell(24.8, 10.5, 2.4, 1.8, GOLD, { edge: 1 }); // spalline d'oro
      // ---- testa: coda alta che ricade dietro, occhi gialli, labbra rosa
      P.cap(17.5, 2.5, 12.5, 5 + (k ? 1 : 0), 1.6, HAIR, { r2: 1.2 }); P.cap(12.5, 5 + (k ? 1 : 0), 10, 11 + (k ? 1 : 0), 1.2, HAIR, { r2: 0.6, same: true });
      P.ell(21.5, 6, 4, 4.3, SKN);
      P.poly([[17, 6.5], [17.2, 3], [19.5, 1], [23, 1], [25.5, 3], [25.5, 4.5], [23, 3.2], [20.5, 3.6], [19, 5], [19, 8.5]], HAIR, { fl: 0.5 });
      P.ell(17.6, 2.6, 2, 1.7, HAIR); P.px(16.5, 4, GOLD, 4); // chignon + fermaglio
      P.line(22, 5.5, 23, 5.5, YEYE, 3); P.px(25, 5.5, YEYE, 3);
      P.line(21.5, 4.5, 23, 4.2, HAIR, 1, { keep: true });
      P.px(24, 8.5, WHIP, 3, { keep: true });
      P.px(19.5, 7.5, GOLD, 4, { keep: true }); // orecchino
      // ---- braccio anteriore con bracciale d'oro + frusta rosa
      P.cap(25, 11, 27.5, 16.5, 1.3, SKN);
      P.rect(26, 14.5, 2.5, 1.5, GOLD, { tone: 3 });
      P.ell(28, 17.5, 1.4, 1.3, SKN);
      P.cap(28, 17, 29.5, 19.5, 0.9, WHIP, { tone: 1 }); // impugnatura
      const wp = k ? [[29.5, 19.5], [32, 17], [34.5, 18.5], [34, 22.5], [30.5, 24], [29, 27.5], [31.5, 30.5], [34.5, 31]]
                   : [[29.5, 19.5], [31, 23], [34.5, 23.5], [35, 19.5], [33, 16.5], [30.5, 13.5], [32, 10], [34.5, 9]];
      P.path(wp, WHIP, 2);
      P.path(wp.slice(0, 4), WHIP, 3, { keep: true });
    });
  }

  // ---- MR. OSHIRO (Celeste): il fantasma del portiere del Celestial Resort; pelle
  // azzurro-lavanda, grosso naso, ciuffi bianchi ai lati della testa calva,
  // completo blu notte con camicia bianca e papillon rosso, coda di fantasma.
  {
    const GH = MAT(['#262a4a', '#4a5488', '#7686bc', '#a0b2dc', '#cad8f0']);
    const SUIT = MAT(['#0c1026', '#1a2046', '#2a3670', '#3e5096', '#5a70b4']);
    const WHITE = MAT(['#5a6078', '#a4aac0', '#dfe2ee', '#ffffff']);
    const BOW = MAT(['#3a0a14', '#8a1a2a', '#d0303e', '#ff7070']);
    reg2('oshiro', 26, 30, (P, k) => {
      // coda di fantasma che ondeggia
      const tw = k ? 1 : -1;
      P.poly([[7.5, 19], [17.5, 19], [16.5, 23], [13 + tw, 26], [9 + tw * 2, 28.5], [6.5 + tw * 2, 28.5], [8.5 + tw, 25.5], [8, 22]], GH, { fl: 0.6 });
      P.path([[10, 21], [11 + tw, 24.5], [9 + tw * 2, 27]], GH, 4, { keep: true });
      // giacca blu notte
      P.poly([[7, 12], [18, 12], [18.5, 21], [12.5, 22.5], [6.5, 21]], SUIT, { fl: 0.6 });
      P.poly([[11.5, 12], [16.5, 12], [14, 19]], WHITE, { fl: 0.3 });
      P.line(14, 16, 14, 21, SUIT, 1, { keep: true });
      P.px(13, 18, GOLD, 4, { keep: true }); P.px(13, 20.5, GOLD, 3, { keep: true });
      // papillon rosso
      P.poly([[11.5, 12], [14, 13.2], [16.5, 12], [16.5, 14.8], [14, 13.6], [11.5, 14.8]], BOW, { fl: 0.4 });
      P.px(14, 13, BOW, 3);
      // braccia con guanti bianchi (gesticola)
      P.cap(8, 13.5, 5, 18 - k, 1.4, SUIT); P.ell(4.5, 18.5 - k, 1.6, 1.5, WHITE);
      P.cap(18, 13.5, 21, 16 + k * 2, 1.4, SUIT); P.ell(21.5, 16.5 + k * 2, 1.6, 1.5, WHITE);
      // testa: calva, ciuffi bianchi, orecchio, occhietti, sopracciglio folto, naso grosso
      P.ell(12.5, 7, 6.2, 6, GH);
      P.ell(7, 8.5, 1.6, 2.4, WHITE, { fl: 0.5 }); P.px(8, 5.5, WHITE, 2); P.px(9, 5, WHITE, 3, { same: true });
      P.ell(9.5, 8, 1.4, 1.8, GH, { edge: 1 });
      P.line(14, 4.5, 16.5, 5, WHITE, 2, { keep: true });
      P.px(15.5, 6.5, DARK, 0, { keep: true }); P.px(15.5, 7.5, DARK, 1, { keep: true });
      P.ell(19.5, 8.5, 3.2, 2.7, GH, { bias: 0.04 }); P.px(19, 7.5, GH, 4, { keep: true });
      P.line(15, 11, 17.5, 11, GH, 1, { keep: true });
      P.px(13, 10.5, GH, 1, { keep: true });
    });
  }

  // ---- TEN PIEDAD (Blasphemous): gigante simile a un albero, arti allungati, teschio
  // di capra con corna ricurve, mani e piedi fatti di radici, rovi che lo avvolgono.
  {
    const BARK = MAT(['#18120e', '#33281e', '#544430', '#7a6848', '#a2906a']);
    const VINE = MAT(['#0e160e', '#1e2e18', '#334a24', '#4e6a32']);
    const EMB = MAT(['#5a1004', '#b0300a', '#ff7a1e', '#ffd070'], { glow: true, base: 2, ol: '#3a0a04' });
    reg2('tenpiedad', 42, 40, (P, k) => {
      const sw = k ? 1 : 0;
      // gambe-radice
      for (const [x0, x1, d] of [[14, 11, -1], [24, 27, 1]]) {
        P.cap(x0, 28, x1 + (k ? -d * 0.5 : d * 0.5), 36, 3, BARK, { r2: 2.4 });
        const fx = x1 + (k ? -d * 0.5 : d * 0.5);
        for (const [dx, dy] of [[-4, 1.5], [-1.5, 2.5], [2, 2.2], [4.5, 1]]) P.cap(fx, 36, fx + dx, 37.5 + dy * 0.5, 1, BARK, { r2: 0.5 });
      }
      // braccio posteriore lunghissimo, mano-radice a terra
      P.cap(11, 15, 6, 26, 2.8, BARK, { r2: 2.2 }); P.cap(6, 26, 4 - sw, 34, 2.2, BARK, { r2: 1.8, same: true });
      for (const [dx, dy] of [[-3.5, 3], [-1, 4], [2, 3.5]]) P.cap(4 - sw, 34, 4 - sw + dx, 34 + dy, 0.9, BARK, { r2: 0.5 });
      // tronco/busto curvo (gobba in alto a sinistra)
      P.egg(19, 20, 12.5, 11, 9, 0.3, BARK);
      P.ell(13, 13.5, 7, 5.5, BARK, { bias: 0.05 }); // gobba
      // venature/costole della corteccia
      for (const pts of [[[10, 16], [13, 22], [12, 28]], [[17, 12], [18, 19], [16, 26]], [[24, 14], [25, 21], [27, 26]], [[20, 22], [22, 27]]]) P.path(pts, BARK, 1, { keep: true });
      for (const pts of [[[9, 12], [12, 10]], [[15, 10], [19, 9]]]) P.path(pts, BARK, 4, { keep: true });
      // rovi che lo avvolgono
      P.path([[7, 21], [12, 23], [18, 22], [24, 24], [30, 22]], VINE, 2);
      P.path([[9, 15], [14, 17.5], [20, 16], [26, 18]], VINE, 2);
      for (const [x, y] of [[10, 22], [15, 23], [21, 23], [27, 23], [12, 16], [18, 16], [23, 17]]) P.px(x, y - 1, VINE, 3);
      // collo e testa: teschio di capra proteso in avanti
      P.cap(24, 13, 29, 11, 3, BARK, { r2: 2.6 });
      P.poly([[27, 6], [33, 6.5], [36.5, 11], [38, 16], [36.5, 18.5], [34, 18], [31, 13.5], [27, 12]], BONE, { fl: 0.6, edge: 1 });
      P.ell(29.5, 8.5, 3.6, 3.2, BONE, { edge: 1 });
      P.ell(31, 9.5, 1.5, 1.3, DARK, { keep: true, tone: 0 }); P.px(31, 9.5, EMB, 3, { keep: true });
      P.path([[34.5, 13.5], [36, 16], [35.5, 17.5]], DARK, 2, { keep: true }); // narice/muso
      for (const x of [33, 35]) P.px(x, 17, BONE, 1, { keep: true });
      P.path([[28, 7], [31, 6.2], [33, 7]], BONE, 4, { keep: true });
      // corna ricurve all'indietro
      P.cap(28, 6, 24, 2, 1.6, BONE, { r2: 1.3 }); P.cap(24, 2, 20, 3.5, 1.3, BONE, { r2: 0.9, same: true }); P.cap(20, 3.5, 19, 6.5, 0.9, BONE, { r2: 0.5, same: true });
      P.cap(30, 5.5, 31, 1.5, 1.3, BONE, { r2: 1 }); P.cap(31, 1.5, 34, 0.5, 1, BONE, { r2: 0.5, same: true });
      for (const [x, y] of [[26, 3], [23, 2], [21, 3]]) P.px(x, y, BONE, 1, { keep: true });
      // braccio anteriore lunghissimo che arriva a terra, dita-radice
      P.cap(27, 15, 32, 25, 2.9, BARK, { r2: 2.3, edge: 1 }); P.cap(32, 25, 34 + sw, 33, 2.3, BARK, { r2: 1.9, same: true });
      for (const [dx, dy] of [[-2.5, 4], [0.5, 4.5], [3, 3.5], [5, 1.5]]) P.cap(34 + sw, 33, 34 + sw + dx, 33 + dy, 0.9, BARK, { r2: 0.5 });
      P.path([[30, 18], [32, 23]], BARK, 4, { keep: true });
    });
  }

  // ---- OCCHIO DI CTHULHU (Terraria): enorme bulbo con vene rosse, iride blu con
  // eterocromia centrale, tentacoli-nervi che penzolano dietro.
  {
    const SCL = MAT(['#4e3c46', '#9c8690', '#d8c8c6', '#f4ece6', '#ffffff']);
    const VEINR = MAT(['#3e0610', '#7e0e1e', '#c42030', '#ff5a5a']);
    const TENR = MAT(['#2a0610', '#5e1020', '#9a2032', '#cc4450', '#ec7a7a']);
    const IRB = MAT(['#0a1840', '#163a86', '#2a64c8', '#5a94ec', '#9ac4ff']);
    const IRC = MAT(['#3a2408', '#7a5214', '#b88a2a', '#e8c25a']);
    reg2('eoc', 42, 32, (P, k) => {
      // tentacoli-nervi dietro (a sinistra)
      for (let i = 0; i < 5; i++) {
        const y0 = 9 + i * 3.5, ph = (i + k) % 2 ? 1.5 : -1.5;
        const pts = [[13, y0], [8, y0 + ph * 0.7], [4, y0 - ph * 0.5 + (i - 2) * 0.8], [1.5, y0 + ph + (i - 2) * 1.4]];
        P.cap(pts[0][0], pts[0][1], pts[1][0], pts[1][1], 1.5, TENR, { r2: 1.2 });
        P.cap(pts[1][0], pts[1][1], pts[2][0], pts[2][1], 1.2, TENR, { r2: 0.9, same: true });
        P.cap(pts[2][0], pts[2][1], pts[3][0], pts[3][1], 0.9, TENR, { r2: 0.5, same: true });
      }
      // bulbo
      P.ell(25, 16, 14, 13.5, SCL);
      // vene ramificate che partono da dietro
      for (const pts of [[[12, 9], [16, 9.5], [19, 7], [22, 6.5]], [[16, 9.5], [18, 12]], [[11.5, 16], [16, 15.5], [19, 17.5]], [[16, 15.5], [18, 13.5]], [[12, 22], [16, 22], [19, 25], [22, 26]], [[16, 22], [19, 20.5]], [[14, 5], [18, 3.5], [21, 3]], [[14, 27], [18, 28.5]]]) P.path(pts, VEINR, 2, { keep: true, only: SCL });
      P.ell(13, 16, 2.2, 6, SCL, { keep: true, only: SCL, tone: 1 });
      // iride blu + anello interno ambrato (eterocromia) + pupilla
      P.ell(31.5, 16, 7, 7.4, IRB, { fl: 0.6, edge: 1 });
      P.ell(32.5, 16, 4.2, 4.4, IRC, { keep: true, fl: 0.5 });
      P.ell(33, 16, 2.6, 2.8, DARK, { keep: true, tone: 0 });
      P.px(29, 12, SCL, 4, { keep: true }); P.px(30, 12, SCL, 4, { keep: true }); P.px(29, 13, SCL, 4, { keep: true });
      P.path([[26, 10], [27.5, 8.8], [29.5, 8.5]], IRB, 4, { keep: true });
    });
  }

  // ---- MONSTRO (The Binding of Isaac): grosso blob rosa a bitorzoli con macchie,
  // occhietti, boccone con labbra carnose e denti (ne manca uno: il Dente di Monstro).
  {
    const PINK = MAT(['#3a1222', '#782c42', '#b45268', '#e08694', '#f6bcbe']);
    const LIP = MAT(['#2e0812', '#62142a', '#9a2840', '#c84a5e', '#e47a84']);
    const MOUTH = MAT(['#120408', '#2a0810', '#46101c', '#641a28']);
    const TOOTH = MAT(['#6a5a50', '#b8aa98', '#ece2cc', '#ffffff']);
    reg2('monstro', 46, 38, (P, k) => {
      const sq = k ? 1 : 0, cy = 21 + sq, ry = 15 - sq, rx = 21 + sq * 0.6;
      P.egg(23, cy, rx, ry, ry - 1.5, 0.05, PINK, { fl: 0.95 });
      // bitorzoli sul profilo superiore
      for (const [x, y, r] of [[12, 10 + sq, 3.4], [21, 7 + sq, 3.6], [31, 7.5 + sq, 3.4]]) P.ell(x, y, r, r * 0.75, PINK);
      P.ell(23, cy - 4, rx - 3, ry - 6, PINK, { fl: 0.7 });
      // macchie e pustole
      for (const [x, y, r] of [[8, 22, 1.6], [12, 14, 1.1], [38, 24, 1.8], [33, 13, 1.2], [40, 17, 1], [6, 27, 1.2], [36, 30, 1.2], [19, 10, 1]]) { P.ell(x, y + sq, r, r * 0.8, PINK, { keep: true, tone: 1 }); P.px(x - 0.5, y - 0.5 + sq, PINK, 3, { keep: true }); }
      // occhietti
      for (const x of [17, 31]) { P.ell(x, 15 + sq, 2.6, 2.4, DARK, { keep: true, tone: 0 }); P.px(x - 1, 14 + sq, TOOTH, 2, { keep: true }); }
      P.path([[13.5, 11.5 + sq], [16, 12 + sq], [19.5, 11 + sq]], PINK, 1, { keep: true });
      P.path([[28.5, 11 + sq], [32, 12 + sq], [34.5, 11.5 + sq]], PINK, 1, { keep: true });
      // boccone con labbra carnose
      const my = 25 + sq, mh = k ? 3.6 : 4.6;
      P.ell(24, my, 13, mh + 2.6, LIP, { fl: 0.8 });
      P.ell(24, my, 11, mh, MOUTH, { keep: true });
      P.path([[13, my - 3], [18, my - 5.5], [24, my - 6], [30, my - 5.5], [35, my - 3]], LIP, 4, { keep: true });
      // denti in alto (uno mancante) e in basso
      for (let i = 0; i < 8; i++) { if (i === 5) continue; const x = 15.5 + i * 2.3; P.rect(x, my - mh + 0.2, 1.6, 2, TOOTH, { keep: true, tone: (xx, yy) => yy < my - mh + 1.5 ? 3 : 2 }); }
      for (let i = 0; i < 6; i++) { const x = 17 + i * 2.4; P.rect(x, my + mh - 1.8, 1.6, 1.6, TOOTH, { keep: true, tone: 2 }); }
      P.ell(24, my + 1.2, 4, 1.2, LIP, { keep: true, only: MOUTH, tone: 2 }); // lingua
    });
  }

  // ---- IL PORTINAIO (Dead Cells): bruto enorme dalle spalle tonde, testolina chiusa
  // in un elmo di ferro con la fessura rovente, cinghie di cuoio sul petto, ceppi ai
  // polsi con catene spezzate, pugni enormi.
  {
    const MUS = MAT(['#2a1220', '#562a3c', '#8a4e5e', '#b67a84', '#dca8a8']);
    const IRON = MAT(['#121219', '#272a36', '#464b5c', '#717888', '#a2a8b6']);
    const TROU = MAT(['#100e18', '#1e1a2c', '#302a44', '#463e5e']);
    const LEATH = MAT(['#1e0e08', '#3e2012', '#64361e', '#8a522e', '#ae7444']);
    const VIS = MAT(['#5a0a06', '#b01a0a', '#ff4a2a', '#ffa07a', '#fff0d0'], { glow: true, base: 2, ol: '#2a0604' });
    reg2('concierge', 42, 40, (P, k) => {
      const sw = k ? 1 : -1;
      // gambe corte e massicce
      P.cap(15, 30, 14 - sw, 36, 3.6, TROU, { r2: 3.2 }); P.ell(13.5 - sw, 37.5, 4.4, 2, IRON);
      P.cap(26, 30, 27 + sw, 36, 3.6, TROU, { r2: 3.2 }); P.ell(27.5 + sw, 37.5, 4.4, 2, IRON);
      // braccio posteriore + pugno + ceppo
      P.cap(9, 14, 5, 25, 4, MUS, { r2: 3.4 });
      P.ell(4.5, 28 + (k ? 1 : 0), 4.2, 3.8, MUS, { edge: 1 });
      P.rect(1.5, 23 + (k ? 1 : 0), 6, 2.6, IRON, { fl: 0.4 });
      // busto a botte, ventre più chiaro
      P.egg(20, 21, 14.5, 11, 10, 0.18, MUS);
      P.ell(21, 25, 9, 6.5, MUS, { keep: true, bias: 0.06 });
      P.path([[14, 18], [20, 20], [27, 18]], MUS, 1, { keep: true }); // pettorali
      P.line(20.5, 22, 20.5, 29, MUS, 1, { keep: true });
      // pantaloni / cintura
      P.poly([[9, 28], [32, 28], [31, 32], [10, 32]], TROU, { fl: 0.4 });
      P.rect(9, 27.5, 23, 2, LEATH, { fl: 0.3 }); P.rect(18.5, 27.3, 4, 2.4, IRON, { tone: 3 });
      // cinghie incrociate con anello di ferro
      P.path([[9, 13], [14, 17], [20, 21], [26, 24], [31, 27]], LEATH, 2);
      P.path([[31, 13], [26, 17], [20, 21], [14, 24], [9, 27]], LEATH, 2);
      P.path([[9, 14], [14, 18], [20, 22], [26, 25], [31, 28]], LEATH, 1, { keep: true, only: MUS });
      P.ell(20, 21, 1.8, 1.8, IRON); P.px(20, 21, IRON, 0, { keep: true });
      // spalle enormi
      P.ell(9, 13, 6, 5, MUS, { edge: 2 }); P.ell(31, 13, 6.4, 5.2, MUS, { edge: 2 });
      // testolina nell'elmo di ferro con fessura rovente
      P.ell(21, 8.5, 5.2, 5.4, IRON);
      P.rect(16, 7.4, 10.5, 2, VIS);
      P.line(18, 4.5, 24, 4.5, IRON, 4, { keep: true });
      for (const x of [17.5, 24.5]) P.px(x, 11.5, IRON, 4, { keep: true });
      P.rect(16.5, 11, 9, 2.2, IRON, { fl: 0.3 }); // gorgiera
      // braccio anteriore + pugno + ceppo con catena spezzata
      P.cap(32, 14, 35, 24, 4.2, MUS, { r2: 3.6, edge: 2 });
      P.ell(36, 28 - (k ? 1 : 0), 4.6, 4.2, MUS, { edge: 1 });
      P.path([[33, 26.5 - (k ? 1 : 0)], [35, 25.5 - (k ? 1 : 0)], [38, 26 - (k ? 1 : 0)]], MUS, 1, { keep: true }); // nocche
      P.rect(32, 22.5 - (k ? 1 : 0), 7, 2.8, IRON, { fl: 0.4 });
      for (let i = 0; i < 3; i++) P.ell(39.5 + (i % 2) * 0.5, 26 + i * 2.6 - (k ? 1 : 0) + (k ? i * 0.3 : 0), 1.1, 1.4, IRON);
      for (let i = 0; i < 2; i++) P.ell(2 - (i % 2) * 0.5, 27 + i * 2.6 + (k ? 1 : 0), 1.1, 1.4, IRON);
    });
  }
})();

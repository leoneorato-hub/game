'use strict';
// =============================================================================
// ART4 · BOSS (bosses-a)
// Il Cavaliere Cavo (Hollow Knight), Gabriele (ULTRAKILL), Ade (Hades),
// La Mano del Re (Dead Cells), La Cucitrice (originale).
// Pixel-art originale ispirata ai design ufficiali. Mini-pittore a forme con
// rampe scelte a mano, luce dall'alto a sinistra, ombre portate, linee interne
// di separazione, materiali emissivi con nucleo caldo e contorno d'inchiostro.
// Registra B_<id>_0, B_<id>_1 (idle), B_<id>_p2 (seconda fase).
// =============================================================================
(() => {
  const HEXC = {};
  const HEX = h => HEXC[h] || (HEXC[h] = (n => [n >> 16 & 255, n >> 8 & 255, n & 255])(parseInt(h.slice(1), 16)));
  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const LV = (() => { const v = [-0.52, -0.7, 0.62], l = Math.hypot(v[0], v[1], v[2]); return v.map(a => a / l); })();
  // luce lambert -> 0..1 (con ambiente)
  const L0 = LV[0], L1 = LV[1], L2 = LV[2];
  const lit = (nx, ny, nz) => { const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; return 0.3 + 0.62 * ((nx * L0 + ny * L1 + nz * L2) / l); };
  // materiale con forma fissa (stesse proprietà per tutti: accessi monomorfici e veloci)
  const MAT = (r, o = {}) => ({
    r, rgb: r.map(HEX), glow: !!o.glow, soft: !!o.soft, noOl: !!o.noOl, base: o.base ?? 1,
    ol: o.ol || null, olRgb: HEX(o.ol || r[0]), ink: o.ink || null,
  });

  class Px {
    constructor(w, h) {
      this.w = w; this.h = h; const N = w * h;
      this.sid = new Int32Array(N); this.mt = new Array(N).fill(null); this.tn = new Int8Array(N); this.fx = new Uint8Array(N);
      this.n = 0; this.info = [null];
    }
    // riempimento generico: f(x,y) -> null fuori | v (0..1) luminosità
    fill(x0, y0, x1, y1, f, m, o = {}, span = null) {
      const keep = !!o.keep, W = this.w, sid = this.sid, mt = this.mt, tn = this.tn, fx = this.fx;
      const only = o.only, tone = o.tone, bias = o.bias || 0;
      let id = this.n;
      if (!keep && !o.same) { id = ++this.n; this.info[id] = { edge: o.edge, cast: o.cast !== false }; }
      const ya = Math.max(0, Math.floor(y0)), yb = Math.min(this.h - 1, Math.ceil(y1));
      for (let y = ya; y <= yb; y++) {
        let xa = Math.max(0, Math.floor(x0)), xb = Math.min(W - 1, Math.ceil(x1));
        if (span) { const r = span(y + 0.5); if (!r) continue; xa = Math.max(xa, Math.floor(r[0]) - 1); xb = Math.min(xb, Math.ceil(r[1]) + 1); }
        for (let x = xa; x <= xb; x++) {
          const v = f(x + 0.5, y + 0.5);
          if (v === null || v === undefined || v === false) continue;
          const i = y * W + x;
          if (keep && !sid[i]) continue;
          if (only && mt[i] !== only) continue;
          if (m === null) { sid[i] = 0; mt[i] = null; continue; }
          if (!keep) sid[i] = id;
          mt[i] = m;
          if (tone !== undefined) { tn[i] = tone; fx[i] = 1; }
          else { const n = m.r.length; let q = Math.floor(((typeof v === 'number' ? v : 0.5) + bias) * n); tn[i] = q < 0 ? 0 : q >= n ? n - 1 : q; fx[i] = 0; }
        }
      }
      return this;
    }
    q(m, v) { const n = m.r.length; return clamp(Math.floor(v * n), 0, n - 1); }
    ell(cx, cy, rx, ry, m, o = {}) {
      const V = o.v;
      const rot = o.rot || 0, c = Math.cos(rot), s = Math.sin(rot), R = Math.max(rx, ry) + 1, fl = o.fl ?? 1;
      return this.fill(cx - R, cy - R, cx + R, cy + R, (x, y) => {
        const dx = x - cx, dy = y - cy, u = (dx * c + dy * s) / rx, w = (-dx * s + dy * c) / ry, d = u * u + w * w;
        if (d > 1) return null;
        if (V) return V(x, y);
        const nx = u * c - w * s, ny = u * s + w * c;
        return lit(nx * fl, ny * fl, Math.sqrt(Math.max(0, 1 - d)));
      }, m, o, rot ? null : yy => { const t = (yy - cy) / ry; if (t * t > 1) return null; const hw = rx * Math.sqrt(1 - t * t); return [cx - hw, cx + hw]; });
    }
    // uovo: semiasse verticale diverso sopra/sotto, si stringe verso il basso
    egg(cx, cy, rx, ryT, ryB, taper, m, o = {}) {
      const V = o.v;
      const fl = o.fl ?? 1;
      return this.fill(cx - rx - 1, cy - ryT - 1, cx + rx + 1, cy + ryB + 1, (x, y) => {
        const dy = y - cy, ry = dy < 0 ? ryT : ryB, rxe = rx * (1 - taper * Math.max(0, dy / ryB));
        const u = (x - cx) / rxe, w = dy / ry, d = u * u + w * w;
        if (d > 1) return null;
        if (V) return V(x, y);
        return lit(u * fl, w * fl, Math.sqrt(Math.max(0, 1 - d)));
      }, m, o);
    }
    cap(x1, y1, x2, y2, r, m, o = {}) {
      const V = o.v;
      const r2 = o.r2 ?? r, dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1, M = Math.max(r, r2) + 1, fl = o.fl ?? 1;
      return this.fill(Math.min(x1, x2) - M, Math.min(y1, y2) - M, Math.max(x1, x2) + M, Math.max(y1, y2) + M, (x, y) => {
        const t = clamp(((x - x1) * dx + (y - y1) * dy) / L, 0, 1);
        const px = x - (x1 + dx * t), py = y - (y1 + dy * t), rr = r + (r2 - r) * t, d2 = (px * px + py * py) / (rr * rr);
        if (d2 > 1) return null;
        if (V) return V(x, y);
        return lit(px / rr * fl, py / rr * fl, Math.sqrt(Math.max(0, 1 - d2)));
      }, m, o);
    }
    poly(pts, m, o = {}) {
      const V = o.v;
      let X0 = 1e9, X1 = -1e9, Y0 = 1e9, Y1 = -1e9;
      for (const p of pts) { if (p[0] < X0) X0 = p[0]; if (p[0] > X1) X1 = p[0]; if (p[1] < Y0) Y0 = p[1]; if (p[1] > Y1) Y1 = p[1]; }
      const cx = o.cx ?? (X0 + X1) / 2, cy = o.cy ?? (Y0 + Y1) / 2, hw = (X1 - X0) / 2 || 1, hh = (Y1 - Y0) / 2 || 1, fl = o.fl ?? 0.55;
      // intervalli orizzontali per riga (scanline, regola pari-dispari sul centro del pixel)
      const spans = new Map(), n = pts.length;
      for (let y = Math.max(0, Math.floor(Y0)); y <= Math.min(this.h - 1, Math.ceil(Y1)); y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0, j = n - 1; i < n; j = i++) {
          const yi = pts[i][1], yj = pts[j][1];
          if ((yi > yc) !== (yj > yc)) xs.push(pts[i][0] + (pts[j][0] - pts[i][0]) * (yc - yi) / (yj - yi));
        }
        if (xs.length) { xs.sort((a, b) => a - b); spans.set(y, xs); }
      }
      return this.fill(X0, Y0, X1, Y1, (x, y) => {
        const xs = spans.get(y - 0.5);
        if (!xs) return null;
        let inside = false;
        for (let i = 0; i < xs.length; i++) { if (x < xs[i]) break; inside = !inside; }
        if (!inside) return null;
        if (V) return V(x, y);
        const u = clamp((x - cx) / hw, -1, 1), w = clamp((y - cy) / hh, -1, 1);
        return lit(u * fl, w * fl * 0.8, Math.sqrt(Math.max(0.05, 1 - (u * u + w * w) * fl * fl)));
      }, m, o, yy => { const xs = spans.get(yy - 0.5); return xs ? [xs[0], xs[xs.length - 1]] : null; });
    }
    rect(x, y, w, h, m, o = {}) { return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], m, o); }
    // pixel singolo / linea (Bresenham) con tono esplicito
    // o.keep: dipinge solo su pixel già pieni (senza nuova forma) · o.same: continua la forma corrente
    px(x, y, m, t, o = {}) { return this._px(x, y, m, t, !!o.keep, !!o.same, o.edge, o.cast); }
    _px(x, y, m, t, keep, same, edge, cast) {
      x = Math.floor(x); y = Math.floor(y);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
      const i = y * this.w + x;
      if (keep && !this.sid[i]) return this;
      if (m === null) { this.sid[i] = 0; this.mt[i] = null; return this; }
      if (!keep) { if (!same) { this.n++; this.info[this.n] = { edge, cast: cast !== false }; } this.sid[i] = this.n; }
      this.mt[i] = m; this.tn[i] = t ?? 2; this.fx[i] = 1;
      return this;
    }
    line(x0, y0, x1, y1, m, t, o = {}) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, keep = !!o.keep;
      let e = dx + dy, first = true;
      for (;;) {
        this._px(x0, y0, m, t, keep, keep ? false : (!first || !!o.same), o.edge, o.cast);
        first = false;
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
      return this;
    }
    // griglia di caratteri -> pixel (map: char -> [mat, tono] | null per cancellare)
    stamp(x0, y0, rows, map, o = {}) {
      let first = true;
      const keep = !!o.keep;
      for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === '.' || ch === ' ' || !(ch in map)) continue;
        const v = map[ch];
        if (v === null) { this._px(x0 + x, y0 + y, null); continue; }
        this._px(x0 + x, y0 + y, v[0], v[1], keep, keep ? false : !first, o.edge, o.cast);
        first = false;
      }
      return this;
    }
    // cottura: ombre portate, linee interne, nuclei emissivi, contorno
    bake(o = {}) {
      const { w, h, sid, mt, tn, fx, info } = this;
      const N = w * h, T = Int8Array.from(tn), GL = new Uint8Array(N);
      for (let i = 0; i < N; i++) if (sid[i] && mt[i] && mt[i].glow) GL[i] = 1;
      // tabelle per forma: tono della linea interna (-1 = nessuna) e ombra portata
      const EDG = new Int8Array(this.n + 1).fill(-1), CST = new Uint8Array(this.n + 1);
      for (let q = 1; q <= this.n; q++) { const f = info[q]; if (!f) continue; if (f.edge !== undefined && f.edge !== false) EDG[q] = f.edge === true ? 0 : f.edge; CST[q] = f.cast ? 1 : 0; }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, s = sid[i], m = mt[i];
        if (!s || !m) continue;
        if (GL[i]) {
          if (fx[i]) continue;
          let d = 1;
          for (; d < 4; d++) {
            if (y + d >= h || !GL[i + d * w] || y - d < 0 || !GL[i - d * w] || x + d >= w || !GL[i + d] || x - d < 0 || !GL[i - d]) break;
          }
          const t = m.base + d - 1, n1 = m.r.length - 1;
          T[i] = t < 0 ? 0 : t > n1 ? n1 : t;
          continue;
        }
        const et = EDG[s];
        if (et >= 0) {
          let e = false, j;
          if (y + 1 < h) { j = i + w; const s2 = sid[j]; if (s2 && s2 < s && !GL[j]) e = true; }
          if (!e && y > 0) { j = i - w; const s2 = sid[j]; if (s2 && s2 < s && !GL[j]) e = true; }
          if (!e && x + 1 < w) { j = i + 1; const s2 = sid[j]; if (s2 && s2 < s && !GL[j]) e = true; }
          if (!e && x > 0) { j = i - 1; const s2 = sid[j]; if (s2 && s2 < s && !GL[j]) e = true; }
          if (e) { T[i] = Math.min(T[i], et); continue; }
        }
        if (!fx[i] && y > 0) {
          const j = i - w, up = sid[j];
          if (up > s && CST[up] && !GL[j]) T[i] = Math.max(0, T[i] - 1);
        }
      }
      const c = makeCanvas(w, h), cx = c.getContext('2d'), id = cx.createImageData(w, h), D = id.data;
      const put = (i, hex) => { const rgb = HEX(hex), k = i * 4; D[k] = rgb[0]; D[k + 1] = rgb[1]; D[k + 2] = rgb[2]; D[k + 3] = 255; };
      for (let i = 0; i < N; i++) {
        const m = mt[i];
        if (!sid[i] || !m) continue;
        const rgb = m.rgb[T[i]], k = i * 4;
        D[k] = rgb[0]; D[k + 1] = rgb[1]; D[k + 2] = rgb[2]; D[k + 3] = 255;
      }
      // contorno: ogni pixel pieno marca i 4 vicini vuoti (1 = inchiostro, 2 = bordo emissivo)
      const OL = new Uint8Array(N), OM = new Array(N);
      if (o.outline !== false) {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x, m = mt[i];
          if (!sid[i] || !m || m.noOl) continue;
          const g = m.glow || m.soft;
          if (y + 1 < h && !sid[i + w]) { if (!g) OL[i + w] = 1; else if (!OL[i + w]) { OL[i + w] = 2; OM[i + w] = m; } }
          if (y > 0 && !sid[i - w]) { if (!g) OL[i - w] = 1; else if (!OL[i - w]) { OL[i - w] = 2; OM[i - w] = m; } }
          if (x + 1 < w && !sid[i + 1]) { if (!g) OL[i + 1] = 1; else if (!OL[i + 1]) { OL[i + 1] = 2; OM[i + 1] = m; } }
          if (x > 0 && !sid[i - 1]) { if (!g) OL[i - 1] = 1; else if (!OL[i - 1]) { OL[i - 1] = 2; OM[i - 1] = m; } }
        }
        const ink = HEX(INK);
        for (let i = 0; i < N; i++) {
          if (!OL[i]) continue;
          const rgb = OL[i] === 1 ? ink : OM[i].olRgb, k = i * 4;
          D[k] = rgb[0]; D[k + 1] = rgb[1]; D[k + 2] = rgb[2]; D[k + 3] = 255; OL[i] = 1;
        }
      }
      // aura (seconda fase): anello di 1 px attorno al contorno
      if (this.aura) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (sid[i] || OL[i]) continue;
        let n = false;
        for (let q = 0; q < 4; q++) { const X = x + DIRS[q][0], Y = y + DIRS[q][1]; if (X >= 0 && Y >= 0 && X < w && Y < h && OL[Y * w + X] === 1) { n = true; break; } }
        if (n) { put(i, this.aura); OL[i] = 2; }
      }
      cx.putImageData(id, 0, 0);
      return c;
    }
  }
  function reg3(id, w, h, draw) {
    for (const [suf, k, p2] of [['_0', 0, 0], ['_1', 1, 0], ['_p2', 0, 1]]) {
      const P = new Px(w, h);
      draw(P, k, p2);
      regSprite('B_' + id + suf, P.bake());
    }
  }

  // ---------------------------------------------------------------- PALETTE
  const GOLD = MAT(['#5a3010', '#9a5e1a', '#d39a30', '#f2cc5e', '#fff0a8']);
  const GOLDL = MAT(['#a85a10', '#e8a020', '#ffd23f', '#fff09a', '#ffffff'], { glow: true });
  const SILVER = MAT(['#2e3246', '#555b72', '#8a90a6', '#bcc2d2', '#eef0f6']);
  const glowOf = (m, base) => MAT(m.r, { glow: m.glow, soft: m.soft, noOl: m.noOl, ol: m.ol, base });
  // lingua di fiamma (emissiva): base in (x,y), alta h, larga w, inclinata di lean
  const flame = (P, x, y, h, w, m, lean = 0) => P.poly([[x - w, y], [x - w * 0.55 + lean * 0.35, y - h * 0.55], [x + lean, y - h], [x + w * 0.5 + lean * 0.45, y - h * 0.5], [x + w, y]], m);
  // bordo dorato lungo l'orlo inferiore di un materiale
  const hemTrim = (P, m, gm, t, x0 = 0, x1 = 1e9) => {
    for (let x = Math.max(0, x0); x < Math.min(P.w, x1); x++) for (let y = P.h - 1; y >= 0; y--) {
      const i = y * P.w + x;
      if (P.mt[i] === m && P.sid[i]) { P.px(x, y - 1, gm, t, { keep: true }); break; }
    }
  };

  // =============================================================================
  // IL CAVALIERE CAVO — Vaso Puro infetto (48x60, non specchiato)
  // Corna lunghe, maschera fessurata che perde Infezione arancione, mantello
  // grigio a brandelli, catene spezzate, un solo braccio (il destro regge l'Aculeo,
  // disegnato a parte dal gioco: perno a (30, 39) nello sprite).
  // =============================================================================
  {
    const SHELL = MAT(['#7c788c', '#b6b3c2', '#e2e0e8', '#f8f8fb']);
    const VOID = MAT(['#060509', '#110f17', '#1e1b28', '#302b3e']);
    const CLOAK = MAT(['#1d2129', '#323843', '#4b535e', '#68717c', '#8e979f']);
    const INF = MAT(['#7a2406', '#d0520e', '#ff8a1e', '#ffc04a', '#fff2c0'], { glow: true, ol: '#4a1606' });
    const IRON = MAT(['#24242e', '#484a58', '#767a8c', '#a4a8b6']);
    const BL = {
      1: ['c'],
      2: ['cb', 'ba'],
      3: ['.c.', 'cdb', '.a.'],
      4: ['.cb.', 'cdcb', 'bcba', '.aa.'],
      5: ['.ccb.', 'cddcb', 'cdcba', 'bcbaa', '.aaa.'],
    };
    const BM = { a: [INF, 1], b: [INF, 2], c: [INF, 3], d: [INF, 4] };
    const blob = (P, x, y, n) => P.stamp(Math.round(x - n / 2), Math.round(y - n / 2), BL[n], BM);
    // catena: linea di 1 px a toni alterni (anelli), con contorno automatico
    const chain = (P, pts) => {
      let j = 0;
      for (let q = 0; q < pts.length - 1; q++) {
        const [x0, y0] = pts[q], [x1, y1] = pts[q + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0 || 1;
        for (let t = 0; t < n; t++, j++) {
          const x = Math.round(x0 + (x1 - x0) * t / n), y = Math.round(y0 + (y1 - y0) * t / n);
          P.px(x, y, IRON, [3, 2, 0][j % 3], { same: j > 0 });
          if (j % 3 === 0) P.px(x + 1, y, IRON, 1, { same: true });
        }
      }
    };
    reg3('hollowknight', 48, 60, (P, k, p2) => {
      const y = k;            // il busto "respira" di 1 px
      const sw = k ? 1 : 0;   // brandelli che ondeggiano
      // gambe lunghe e sottili, piedi a punta
      P.cap(21, 43, 20.5, 56.5, 1.4, VOID, { r2: 1 });
      P.cap(27, 43, 27.5, 56.5, 1.4, VOID, { r2: 1 });
      P.poly([[18, 56], [21.6, 55.6], [21.8, 58.6], [17, 58.6]], VOID, { tone: 2 });
      P.poly([[26.4, 55.6], [30, 56], [31, 58.6], [26.2, 58.6]], VOID, { tone: 2 });
      // mantello, telo posteriore a brandelli
      P.poly([[17, 27 + y], [31, 27 + y], [35, 35], [36.5, 46], [34 + sw, 45], [33.5, 50], [30.5 - sw, 46.5], [28.5, 49], [26, 46], [23.5 + sw, 50], [21, 46], [18.5, 49.5], [16 - sw, 45.5], [14, 50], [12, 44], [13, 35]], CLOAK, { bias: -0.1 });
      // busto del vaso (nero), visibile nell'apertura
      P.egg(24.3, 34 + y, 4.8, 7, 11, 0.35, VOID, { fl: 0.7 });
      // lembo sinistro (copre il moncherino del braccio perduto)
      P.poly([[15.5, 27.5 + y], [22, 27 + y], [21.5, 34 + y], [20.5, 42], [19 + sw, 48], [17, 44.5], [14.5, 48.5], [13, 42], [13.3, 33]], CLOAK, { edge: 1, bias: 0.06 });
      // lembo destro (dietro al braccio)
      P.poly([[27.5, 27 + y], [32.5, 28 + y], [35, 34], [35.5, 43], [33.5 + sw, 47.5], [31.5, 44], [29, 46.5], [29.2, 37]], CLOAK, { edge: 1, bias: -0.04 });
      // pieghe
      P.line(17, 31 + y, 15.5, 43, CLOAK, 1, { keep: true }); P.line(19.5, 33 + y, 18.5, 45, CLOAK, 1, { keep: true });
      P.line(33, 34, 33.5, 42, CLOAK, 1, { keep: true });
      P.line(14.5, 31 + y, 14, 40, CLOAK, 4, { keep: true });
      // colletto sulle spalle
      P.ell(24, 27.5 + y, 8.5, 2.4, CLOAK, { edge: 1, fl: 0.5, bias: 0.02 });
      P.ell(24, 26 + y, 3.4, 1.4, VOID, { tone: 0 });
      // Infezione sul busto
      const blobs = p2
        ? [[25, 35, 5], [22.5, 40.5, 4], [27.5, 41, 3], [23.5, 31.2, 3], [20.5, 36, 2], [17, 39, 3], [32.5, 31.5, 2], [26, 45, 2], [15, 46, 2], [33, 44, 2]]
        : [[25, 35.5, 4], [22.5, 40.5, 3], [27.5, 41.5, 2]];
      for (const [bx, by, n] of blobs) blob(P, bx, by + (by < 44 ? y : 0), n);
      // braccio destro (regge l'Aculeo)
      P.cap(31, 29.5 + y, 32, 37 + y, 1.5, VOID, { edge: 2, r2: 1.2 });
      P.ell(31.5, 38.5, 1.8, 1.6, VOID, { tone: 3 });
      P.rect(30.2, 35 + y, 3.4, 1.2, IRON, { tone: 2 });  // manetta
      // catene spezzate: dalla spalla sinistra e dalla manetta
      chain(P, [[13, 29 + y], [11, 33 + y], [10 + sw, 38 + y], [10.5 + sw, 42 + y]]);
      chain(P, [[34, 36 + y], [35.5, 39 + y], [36 + sw, 43]]);
      // corna
      P.cap(19.5, 11 + y, 17.6, 4 + y, 1.9, SHELL, { r2: 1.3 });
      P.cap(17.6, 4.5 + y, 16.4, 1 + y, 1.3, SHELL, { r2: 0.7, same: true });
      P.cap(28.5, 11 + y, 30.4, 4 + y, 1.9, SHELL, { r2: 1.3 });
      P.cap(30.4, 4.5 + y, 31.6, 1 + y, 1.3, SHELL, { r2: 0.7, same: true });
      // maschera
      P.egg(24, 16.5 + y, 8.6, 7.5, 9.5, 0.34, SHELL, { edge: 1, fl: 0.75, bias: 0.16 });
      // occhi
      P.ell(20.2, 18 + y, 2.4, 3.8, VOID, { tone: 0, rot: 0.12 });
      P.ell(27.8, 18 + y, 2.4, 3.8, VOID, { tone: 0, rot: -0.12 });
      // crepa che perde Infezione dall'occhio destro
      P.line(27, 9 + y, 26, 11 + y, VOID, 1); P.line(26, 11 + y, 27, 13 + y, VOID, 1, { same: true });
      P.px(27, 14 + y, INF, 1);
      P.stamp(27, 17 + y, ['c', 'd', 'b', 'a'], BM);
      P.stamp(27, 23 + y, ['b', 'a', 'a'], BM); P.px(28, 24 + y, INF, 1);
      if (p2) {
        P.line(26, 14 + y, 25, 15 + y, VOID, 1); P.line(22, 23 + y, 23, 25 + y, VOID, 1);
        P.stamp(20, 17 + y, ['c', 'd', 'b'], BM);
        P.stamp(23, 24 + y, ['c', 'b'], BM);
        blob(P, 18.5, 11 + y, 2); blob(P, 30, 21 + y, 2);
      }
    });
  }

  // =============================================================================
  // GABRIELE, Giudice dell'Inferno (60x62) — armatura d'argento a rifiniture
  // d'oro, elmo senza occhi con croce dorata, ali e aureola di luce, due spade
  // nel fodero al fianco, spada di luce in mano. p2: furia rossa, occhi ardenti.
  // =============================================================================
  {
    const ARM = MAT(['#2a2e42', '#4e556c', '#7f879e', '#b4bacb', '#e8ebf2']);
    const ARM2 = MAT(['#1c1620', '#352a36', '#564450', '#7e646c', '#a8888a']);
    const GLD2 = MAT(['#3a1006', '#74240e', '#ac4416', '#d8742c', '#f4ae5a']);
    const LIGHT = MAT(['#a85a10', '#e8a020', '#ffd23f', '#fff09a', '#ffffff'], { glow: true, ol: '#6a3208' });
    const RAGE = MAT(['#6a0c08', '#c8200e', '#ff4a1e', '#ff9a5a', '#ffe8d0'], { glow: true, ol: '#3a0606' });
    const CLOTH = MAT(['#6e6258', '#a89c8c', '#d8cebe', '#f6f0e4']);
    // penne di luce: non emissive (così ogni penna ha il suo bordo), contorno caldo
    const FEA = MAT(['#c0701a', '#f0a428', '#ffd23f', '#fff09a', '#ffffff'], { soft: true, ol: '#6a3208' });
    const FEA2 = MAT(['#9a1a0c', '#d8341a', '#ff5a2a', '#ffa070', '#ffe8d0'], { soft: true, ol: '#3a0606' });
    const CLOTH2 = MAT(['#2e0e12', '#5a1a20', '#8a2a2e', '#b44842']);
    const LEATH = MAT(['#1c1016', '#36202a', '#543440', '#74505a']);
    reg3('gabriel', 60, 62, (P, k, p2) => {
      const A = p2 ? ARM2 : ARM, G = p2 ? GLD2 : GOLD, L = p2 ? RAGE : LIGHT, C = p2 ? CLOTH2 : CLOTH;
      const LB = glowOf(L, 2), y = k;
      // ali di luce: 5 penne affilate per lato
      const wing = (rx, ry, s) => {
        const angs = [-10, 10, 30, 50, 68], lens = [15, 21, 25, 24, 19];
        angs.forEach((a, i) => {
          const t = a * Math.PI / 180, dx = s * Math.cos(t), dy = -Math.sin(t), px = -dy, py = dx;
          const len = lens[i] + (k && i % 2 ? 1 : 0) + (p2 ? 1 : 0), w = 1.7, bx = rx + dx * 2, by = ry + dy * 2;
          const F = p2 ? FEA2 : FEA;
          P.poly([[bx + px * w, by + py * w], [bx + dx * len * 0.72 + px * w * 0.9, by + dy * len * 0.72 + py * w * 0.9], [rx + dx * len, ry + dy * len], [bx + dx * len * 0.72 - px * w * 0.9, by + dy * len * 0.72 - py * w * 0.9], [bx - px * w, by - py * w]], F, { edge: 1, v: (X, Y) => { const t = ((X - rx) * dx + (Y - ry) * dy) / len, q = ((X - bx) * px + (Y - by) * py) / w; return 0.3 + t * 0.42 - q * s * 0.14; } });
          P.line(bx + dx * 3, by + dy * 3, rx + dx * (len - 3), ry + dy * (len - 3), F, 3, { keep: true });
        });
      };
      wing(25, 25 + y, -1); wing(37, 25 + y, 1);
      // aureola
      P.ell(31, 4 + y, 7, 2.4, LB); P.ell(31, 4 + y, 4.6, 0.9, null);
      // due spade nel fodero sul fianco ("Lo Splendore è Giustizia")
      for (const [x0, y0, x1, y1] of [[25, 35, 16.5, 46], [26.5, 36, 19, 48]]) {
        P.cap(x0, y0, x1, y1, 1.25, LEATH, { edge: 1 });
        P.line(x0 - 1, y0, x1 - 0.5, y1 - 1, G, 2, { keep: true });
        P.px(x1, y1, G, 3, { keep: true });
        P.line(x0 + 1, y0 - 2, x0 + 3, y0 - 5, A, 4);                 // impugnatura
        P.line(x0 - 0.5, y0 - 2.5, x0 + 2, y0 - 1, G, 3, { same: true }); // guardia
      }
      // gambe
      P.cap(27.5, 38, 26.5, 47, 2.6, A, { edge: 1 }); P.cap(34.5, 38, 35.5, 47, 2.6, A, { edge: 1 });
      P.cap(26.5, 48, 26, 57, 2.2, A, { edge: 1, r2: 1.9 }); P.cap(35.5, 48, 36.5, 57, 2.2, A, { edge: 1, r2: 1.9 });
      P.ell(26.5, 47.5, 2.1, 1.6, G, { edge: 1 }); P.ell(35.5, 47.5, 2.1, 1.6, G, { edge: 1 });
      P.poly([[23.5, 56.5], [28.5, 56.5], [30.5, 60.6], [23, 60.6]], A, { edge: 1 });
      P.poly([[34, 56.5], [38.6, 56.5], [41.5, 60.6], [33.6, 60.6]], A, { edge: 1 });
      // tabarda
      P.poly([[28, 35], [34, 35], [34.6, 49], [31, 52.5 + k], [27.4, 49]], C, { edge: 1 });
      P.line(28, 36, 28, 48, G, 3, { keep: true }); P.line(34, 36, 34, 48, G, 2, { keep: true });
      P.line(29, 49, 31, 51 + k, G, 3, { keep: true }); P.line(33, 49, 31, 51 + k, G, 2, { keep: true });
      P.stamp(30, 41, ['.g.', 'ggg', '.g.', '.g.'], { g: [G, 3] }, { keep: true });
      // fiancali + cintura
      P.poly([[25, 34], [37, 34], [38.5, 39], [23.5, 39]], A, { edge: 1 });
      P.line(24, 38, 38, 38, G, 2, { keep: true });
      P.rect(25.5, 32.5, 11, 2, G, { edge: 1 });
      // spalla lontana + braccio sinistro
      P.ell(23, 23.6 + y, 4.8, 3.8, G); P.ell(23, 22.6 + y, 4.6, 3.4, A, { edge: 1 });
      P.cap(21.5, 26 + y, 20.5, 33 + y, 2.1, A, { edge: 1 });
      P.ell(20.5, 34 + y, 2.2, 2, G, { edge: 1 });
      // corazza
      P.poly([[24.5, 20 + y], [37.5, 20 + y], [36.5, 29 + y], [34.5, 33], [27.5, 33], [25.5, 29 + y]], A, { edge: 1 });
      P.line(26, 22 + y, 31, 27 + y, G, 3, { keep: true }); P.line(36, 22 + y, 31, 27 + y, G, 2, { keep: true });
      P.line(31, 27 + y, 31, 32, G, 2, { keep: true });
      P.line(27, 30 + y, 35, 30 + y, A, 1, { keep: true });
      // gorgiera
      P.rect(28.5, 18 + y, 5, 2.4, G, { edge: 1 });
      // spada di luce (dietro la mano)
      P.cap(46, 35 + y, 55, 54, 1.3, L, { r2: 0.5 });
      P.line(44, 37 + y, 48, 33 + y, G, 3);
      // spalla vicina + braccio destro
      P.ell(39, 23.6 + y, 4.9, 3.8, G); P.ell(39, 22.6 + y, 4.7, 3.4, A, { edge: 1 });
      P.cap(40, 26 + y, 42, 30 + y, 2.1, A, { edge: 1 });
      P.cap(42, 30 + y, 45, 33 + y, 2, A, { edge: 1 });
      P.ell(45.5, 34 + y, 2.1, 1.9, G, { edge: 1 });
      // elmo
      P.egg(31, 13 + y, 4.9, 5.6, 5.6, 0.22, A, { edge: 1 });
      P.line(32, 8 + y, 32, 17 + y, G, 3); P.line(29, 12 + y, 35, 12 + y, G, 3, { same: true });
      P.px(33, 12 + y, G, 4); P.px(32, 13 + y, G, 2);
      if (p2) {
        P.px(30, 11 + y, RAGE, 4); P.px(29, 11 + y, RAGE, 2); P.px(34, 11 + y, RAGE, 4); P.px(35, 11 + y, RAGE, 2);
        P.line(32, 8 + y, 32, 17 + y, RAGE, 3, { keep: true }); P.line(29, 12 + y, 35, 12 + y, RAGE, 3, { keep: true });
        P.aura = '#8a1408';
      }
    });
  }

  // =============================================================================
  // ADE, Signore degli Inferi (60x66) — enorme, pelle grigia, occhi rossi su
  // sclera nera, lunghi capelli ondulati neri, i baffi che si incrociano sul petto
  // (il Gigaros), veste rossa e nera, gioielli d'oro a forma di teschio, corona
  // d'alloro color fiamma, Varatha la Lancia Eterna. p2: aura rossa, fiamme.
  // =============================================================================
  {
    const SKIN = MAT(['#24212c', '#403d4c', '#625f70', '#878496', '#adaabb']);
    const HAIR = MAT(['#08060b', '#15111b', '#241e2c', '#3a3244']);
    const ROBE = MAT(['#32060e', '#62101e', '#9c1c28', '#cc3a34', '#ec7056']);
    const BLK = MAT(['#0d0911', '#1a1520', '#2a2332', '#3e3448']);
    const FIRE = MAT(['#7a1a08', '#d8401a', '#ff7a1e', '#ffc04a', '#fff0a0'], { glow: true, ol: '#4a0a06' });
    const EYE = MAT(['#5a0606', '#c01414', '#ff3a2a', '#ffb0a0'], { glow: true, ol: '#2a0404' });
    const SHAFT = MAT(['#100a10', '#261a22', '#3e2c36', '#5a4450']);
    const BONE = MAT(['#6a5a3a', '#a89060', '#d8c08a', '#f2e2b0']);
    reg3('hades', 60, 66, (P, k, p2) => {
      const y = k;
      // mantello nero dietro
      P.poly([[12, 22 + y], [43, 22 + y], [47, 40], [50, 64.6], [4, 64.6], [7, 40]], BLK, { bias: -0.1 });
      // capelli lunghi e ondulati dietro le spalle
      P.poly([[19, 6 + y], [38, 6 + y], [41, 20 + y], [43, 31 + y], [40, 29.5 + y], [38, 33 + y], [35.5, 30 + y], [21.5, 30 + y], [19, 33 + y], [16.5, 29.5 + y], [13.5, 31 + y], [16, 20 + y]], HAIR, { bias: -0.05 });
      P.line(17, 22 + y, 15, 29 + y, HAIR, 3, { keep: true }); P.line(40, 21 + y, 41.5, 28 + y, HAIR, 2, { keep: true });
      // veste rossa (copre anche le spalle)
      P.poly([[15, 22 + y], [42, 22 + y], [44.5, 27 + y], [42.5, 32], [44, 48], [48, 64.6], [8, 64.6], [11, 48], [12, 32], [12, 26 + y]], ROBE, { edge: 1 });
      for (const [a, b] of [[17, 13], [22.5, 20.5], [33, 35], [38.5, 42.5]]) { P.line(a, 44, b, 63, ROBE, 1, { keep: true }); P.line(a + 1, 44, b + 1, 63, ROBE, 3, { keep: true }); }
      P.line(36, 24 + y, 41, 31, ROBE, 1, { keep: true }); P.line(20, 25 + y, 17, 33, ROBE, 1, { keep: true });
      // pannello nero frontale bordato d'oro
      P.poly([[24, 41], [32, 41], [34.5, 64.6], [21.5, 64.6]], BLK, { edge: 1 });
      P.line(24, 42, 22, 63, GOLD, 3, { keep: true }); P.line(32, 42, 34, 63, GOLD, 2, { keep: true });
      hemTrim(P, ROBE, GOLD, 3);
      // cintura con fibbia a teschio e gemma
      P.rect(12.5, 39, 31, 2.6, GOLD, { edge: 1 });
      P.stamp(25.5, 37, ['.bbb.', 'bkbkb', 'bbrbb', '.bkb.'], { b: [BONE, 3], k: [BLK, 0], r: [EYE, 2] }, { edge: 1 });
      // braccio sinistro
      P.cap(14, 27 + y, 11, 37 + y, 3.6, SKIN, { edge: 1 });
      P.cap(11, 37 + y, 11, 45, 3.2, SKIN, { edge: 1 });
      P.rect(7.6, 39.5, 6.8, 3.2, GOLD, { edge: 1 }); P.px(11, 41, EYE, 2);
      P.ell(11, 47.5, 3, 2.8, SKIN, { edge: 1 });
      // spallaccio a teschio d'oro sulla spalla sinistra
      P.ell(15.5, 24.5 + y, 6, 4.6, GOLD, { edge: 1 });
      P.stamp(13, 22 + y, ['.bbb.', 'bkbkb', 'bbbbb', '.b.b.'], { b: [BONE, 3], k: [BLK, 0] });
      P.px(10, 26 + y, EYE, 2); P.px(21, 26 + y, EYE, 2);
      // Varatha, la Lancia Eterna
      P.cap(51.5, 13, 51.5, 64.5, 1.1, SHAFT);
      P.rect(50, 52, 3, 1.4, GOLD, { tone: 3 });
      P.poly([[51.5, 0.5], [54.2, 6], [53.6, 10.5], [51.5, 12.6], [49.4, 10.5], [48.8, 6]], SILVER, { edge: 1 });
      P.line(51, 3, 51, 11, SILVER, 1, { keep: true });
      P.rect(49.5, 12, 4, 2.2, GOLD, { edge: 1 }); P.px(51, 13, EYE, 2);
      // braccio destro che impugna la lancia
      P.cap(41, 27 + y, 45.5, 33 + y, 3.4, SKIN, { edge: 1 });
      P.cap(45.5, 33 + y, 49.5, 37 + y, 3, SKIN, { edge: 1 });
      P.rect(44.4, 32 + y, 3.6, 3.6, GOLD, { edge: 1 });
      P.ell(51.5, 38 + y, 2.8, 2.6, SKIN, { edge: 1 });
      // collo e testa (più larga, mascella squadrata)
      P.cap(28.5, 18 + y, 28.5, 23 + y, 3.2, SKIN);
      P.egg(28.5, 13.5 + y, 6.6, 6.8, 7, 0.3, SKIN, { edge: 1, fl: 0.8 });
      // capelli: attaccatura a punta + ciocche ai lati del viso
      P.poly([[21, 6 + y], [36, 6 + y], [36.4, 10.5 + y], [33.5, 9 + y], [28.5, 10.6 + y], [23.5, 9 + y], [20.6, 10.5 + y]], HAIR);
      P.poly([[20.5, 8 + y], [22.6, 9.5 + y], [22.4, 17 + y], [21, 24 + y], [18.5, 22 + y], [19.6, 14 + y]], HAIR, { edge: 1 });
      P.poly([[36.5, 8 + y], [37.4, 14 + y], [38.5, 22 + y], [36, 24 + y], [34.6, 17 + y], [34.4, 9.5 + y]], HAIR, { edge: 1 });
      P.line(20, 12 + y, 20, 19 + y, HAIR, 3, { keep: true }); P.line(37, 12 + y, 37.5, 19 + y, HAIR, 2, { keep: true });
      // sopracciglia pesanti, occhi (sclera nera, iride rossa), naso, zigomi
      P.line(23, 11 + y, 27, 12 + y, HAIR, 1); P.line(30, 12 + y, 34, 11 + y, HAIR, 1);
      P.stamp(24, 13 + y, ['krk'], { k: [HAIR, 0], r: [EYE, p2 ? 3 : 2] });
      P.stamp(31, 13 + y, ['krk'], { k: [HAIR, 0], r: [EYE, p2 ? 3 : 2] });
      P.line(28, 13 + y, 28, 16 + y, SKIN, 3, { keep: true }); P.px(29, 17 + y, SKIN, 1); P.px(27, 17 + y, SKIN, 1);
      P.px(24, 15 + y, SKIN, 3); P.px(32, 15 + y, SKIN, 1);
      // barba corta e baffi lunghissimi che si incrociano sul petto (Gigaros)
      P.poly([[23, 18.4 + y], [34, 18.4 + y], [34.6, 22 + y], [31.5, 25.5 + y], [28.5, 26.5 + y], [25.5, 25.5 + y], [22.4, 22 + y]], HAIR, { edge: 1 });
      P.line(26, 19 + y, 31, 19 + y, HAIR, 0);
      P.line(24, 22 + y, 27, 25 + y, HAIR, 3, { keep: true }); P.line(33, 22 + y, 30, 25 + y, HAIR, 2, { keep: true });
      const must = (pts, hi) => {
        for (let i = 0; i < pts.length - 1; i++) P.cap(pts[i][0], pts[i][1] + y, pts[i + 1][0], pts[i + 1][1] + y, i < 1 ? 1.4 : 1.1, HAIR, { r2: i === pts.length - 2 ? 0.6 : 1.1, edge: 1, same: i > 0 });
        for (let i = 1; i < pts.length - 1; i++) P.line(pts[i][0] - 0.5, pts[i][1] + y - 0.5, pts[i + 1][0] - 0.5, pts[i + 1][1] + y - 0.5, HAIR, hi, { keep: true });
      };
      must([[25.5, 18.5], [22.5, 23], [27, 30], [33, 35.5], [35.5, 34]], 3);
      must([[31.5, 18.5], [34.5, 23], [30, 30], [24, 35.5], [21.5, 34]], 2);
      // corona d'alloro color fiamma (foglie appuntite verso l'alto e indietro)
      const fl = p2 ? 1.5 : 1;
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1.08 + i * 0.105), bx = 28.5 + Math.cos(a) * 7.2, by = 9 + y + Math.sin(a) * 4.2;
        flame(P, bx, by + 1, (2.4 + (i % 2) * 1.2 + (k && i % 3 === 1 ? 1 : 0)) * fl, 1.05, FIRE, -0.9 + Math.cos(a) * 0.9);
      }
      if (p2) {
        P.aura = '#a01010';
        for (const [fx, fy, fh, ln] of [[11, 22, 6, -1], [15.5, 20, 7, -0.4], [41, 21, 7, 0.4], [44.5, 23, 5, 1]]) flame(P, fx, fy + y, fh, 1.7, FIRE, ln);
        P.px(25, 12 + y, EYE, 2); P.px(32, 12 + y, EYE, 2);
      }
    });
  }

  // =============================================================================
  // LA MANO DEL RE (58x64) — cavaliere reale massiccio: armatura d'acciaio a
  // rifiniture d'oro, elmo a corona, mantello rosso, lancia gigante a doppio
  // filo. p2: armatura rovente e fiamme.
  // =============================================================================
  {
    const STEEL = MAT(['#181c2c', '#2e364d', '#4d5876', '#7b87a6', '#b2bcd4']);
    const HOT = MAT(['#1c0606', '#440e0a', '#741c10', '#ac3c1a', '#e8782c']);
    const CAPE = MAT(['#2c0812', '#58101e', '#8c1a2a', '#be2e36', '#e0584a']);
    const VIS = MAT(['#7a2a06', '#e06a10', '#ffb02a', '#fff0a0'], { glow: true, ol: '#2a0a04' });
    const FIRE = MAT(['#7a1a08', '#d8401a', '#ff7a1e', '#ffc04a', '#fff0a0'], { glow: true, ol: '#4a0a06' });
    const WOOD = MAT(['#1a100e', '#342018', '#543624', '#785232']);
    const DARK = MAT(['#08060a', '#120e16', '#1e1824', '#2c2434']);
    reg3('handofking', 58, 64, (P, k, p2) => {
      const S = p2 ? HOT : STEEL, y = k, sw = k ? 1 : 0;
      // mantello rosso
      P.poly([[14, 18 + y], [44, 18 + y], [48, 36], [52, 62.6], [47 + sw, 60], [42, 62.6], [36, 60.5], [30, 62.6], [24, 60.5], [18, 62.6], [12 - sw, 60], [6, 62.6], [10, 36]], CAPE, { bias: -0.12 });
      P.line(11, 40, 8, 60, CAPE, 1, { keep: true }); P.line(47, 40, 50, 60, CAPE, 1, { keep: true });
      // gambe
      P.cap(23, 40, 21.5, 51, 4, S, { edge: 1 }); P.cap(35, 40, 36.5, 51, 4, S, { edge: 1 });
      P.cap(21.5, 52, 21, 58, 3.4, S, { edge: 1 }); P.cap(36.5, 52, 37.5, 58, 3.4, S, { edge: 1 });
      P.ell(21.5, 51, 2.8, 2.3, GOLD, { edge: 1 }); P.ell(36.5, 51, 2.8, 2.3, GOLD, { edge: 1 });
      P.poly([[16.5, 57.5], [25, 57.5], [25.5, 62.6], [15.5, 62.6]], S, { edge: 1 });
      P.poly([[33.5, 57.5], [41.5, 57.5], [44, 62.6], [33, 62.6]], S, { edge: 1 });
      // falde + tabarda rossa
      P.poly([[18, 36], [40, 36], [42, 44.5], [16, 44.5]], S, { edge: 1 });
      P.line(17, 40, 41, 40, S, 1, { keep: true }); P.line(16, 44, 42, 44, GOLD, 2, { keep: true });
      P.poly([[25, 36], [33, 36], [34, 52], [29, 55.5], [24, 52]], CAPE, { edge: 1 });
      P.line(25, 37, 25, 51, GOLD, 3, { keep: true }); P.line(33, 37, 33, 51, GOLD, 2, { keep: true });
      // corazza
      P.poly([[17, 18 + y], [41, 18 + y], [42, 28 + y], [39, 37], [19, 37], [16, 28 + y]], S, { edge: 1 });
      P.line(21, 31 + y, 37, 31 + y, S, 1, { keep: true }); P.line(21, 34, 37, 34, S, 1, { keep: true });
      P.line(29, 19 + y, 29, 30 + y, S, 3, { keep: true });
      P.stamp(26, 23 + y, ['g.g.g', 'ggggg', '.grg.', 'ggggg'], { g: [GOLD, 3], r: [CAPE, 4] }, { edge: 1 });
      P.rect(17.5, 35.5, 23, 2.4, GOLD, { edge: 1 });
      // braccio sinistro e guanto
      P.cap(11.5, 27 + y, 10, 38 + y, 3.4, S, { edge: 1 });
      P.rect(6.6, 37 + y, 6.8, 2, GOLD, { edge: 1 });
      P.ell(10, 41.5 + y, 3.6, 3.2, S, { edge: 1 });
      // lancia gigante
      P.cap(51, 18, 51, 62.5, 1.3, WOOD);
      P.poly([[51, 0.5], [54.8, 7], [54.2, 13], [51, 16], [47.8, 13], [47.2, 7]], SILVER, { edge: 1 });
      P.line(51, 3, 51, 14, SILVER, 1, { keep: true }); P.line(50, 5, 50, 12, SILVER, 4, { keep: true });
      P.rect(47.2, 15.6, 7.6, 2, GOLD, { edge: 1 });
      // braccio destro sulla lancia
      P.cap(45, 27 + y, 48, 34 + y, 3.2, S, { edge: 1 });
      P.cap(48, 34 + y, 50, 37 + y, 2.8, S, { edge: 1 });
      P.ell(51, 39 + y, 3.4, 3, S, { edge: 1 });
      P.line(48, 37 + y, 54, 37 + y, GOLD, 3, { keep: true });
      // spallacci a lame sovrapposte con bordo d'oro
      for (const [sx, d] of [[14, -1], [44, 1]]) {
        P.ell(sx - d * 1, 26 + y, 7, 3.6, S, { edge: 1 });
        P.ell(sx, 21.2 + y, 8.2, 6.2, GOLD, { edge: 1 });
        P.ell(sx, 20.4 + y, 7.8, 5.6, S, { same: true });
        P.px(sx - 3, 17 + y, S, 4);
      }
      // gorgiera ed elmo a corona
      P.ell(29, 18 + y, 5.4, 2.6, GOLD, { edge: 1 });
      P.egg(29, 11.5 + y, 6, 6.5, 5.5, 0.15, S, { edge: 1 });
      P.rect(24.5, 10.4 + y, 10, 1.4, DARK, { tone: 0 }); P.rect(28.5, 10.4 + y, 1.6, 6, DARK, { tone: 0 });
      P.px(26, 10 + y, VIS, p2 ? 3 : 2); P.px(27, 10 + y, VIS, 1); P.px(32, 10 + y, VIS, p2 ? 3 : 2); P.px(31, 10 + y, VIS, 1);
      P.rect(22.6, 5.8 + y, 12.8, 2, GOLD, { edge: 1 });
      for (let i = 0; i < 5; i++) { const x = 23.4 + i * 2.8; P.poly([[x - 1.2, 6.4 + y], [x, (i % 2 ? 3.2 : 1.4) + y], [x + 1.2, 6.4 + y]], GOLD); }
      P.px(29, 6 + y, CAPE, 4);
      if (p2) {
        for (const [fx, fy, fh, lean] of [[9, 16, 7, -1], [14, 15, 9, -0.5], [19, 17, 6, 0], [39, 17, 6, 0], [44, 15, 9, 0.5], [49, 16, 7, 1], [26, 3, 5, -0.4], [32, 3, 5, 0.4]]) flame(P, fx, fy + y, fh, 1.8, FIRE, lean);
        const HS = glowOf(FIRE, 2);
        P.line(21, 31 + y, 37, 31 + y, HS, 2, { keep: true }); P.line(21, 34, 37, 34, HS, 2, { keep: true });
        P.line(17, 40, 41, 40, HS, 3, { keep: true });
        for (const [x0, y0, x1, y1] of [[10, 18, 13, 23], [46, 18, 43, 24], [21, 45, 22, 49], [37, 45, 36, 49], [11, 30, 10, 35], [27, 8, 26, 9]]) P.line(x0, y0 + (y0 < 36 ? y : 0), x1, y1 + (y1 < 36 ? y : 0), HS, 3, { keep: true });
        P.aura = '#7a1a08';
      }
    });
  }

  // =============================================================================
  // LA CUCITRICE (56x66, non specchiata) — figura alta ed elegante, maschera di
  // porcellana con occhi a bottone e punto a croce, veste viola cucita con filo
  // d'oro, dita ad ago, aureola di fili. p2: la veste si scuce, cuciture ardenti.
  // =============================================================================
  {
    const ROBE = MAT(['#1a0b26', '#311544', '#4f2664', '#714088', '#9864ac']);
    const ROBE2 = MAT(['#220a26', '#40143e', '#64205a', '#8a3874', '#b25e90']);
    const PORC = MAT(['#8a7c7a', '#c6b8b0', '#ece2d6', '#fffaf2']);
    const BTN = MAT(['#120818', '#2a1834', '#4a2c56']);
    const STITCH = MAT(['#4a0c1a', '#8e2b3a', '#c44a58']);
    const THR = MAT(['#a85a10', '#e8a020', '#ffd23f', '#fff09a', '#ffffff'], { glow: true, ol: '#4a2208' });
    const LOOSE = MAT(['#a85a10', '#e8a020', '#ffd23f', '#fff09a', '#ffffff'], { glow: true, noOl: true });
    // cucitura "a toppa": linea scura con punti d'oro perpendicolari
    const seam = (P, x0, y0, x1, y1, R, G, t) => {
      P.line(x0, y0, x1, y1, R, 0, { keep: true });
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let i = 1; i < n; i += 3) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; P.px(x + nx, y + ny, G, t, { keep: true }); P.px(x - nx, y - ny, G, t - 1, { keep: true }); }
    };
    reg3('cucitrice', 56, 66, (P, k, p2) => {
      const R = p2 ? ROBE2 : ROBE, SEAM = p2 ? THR : GOLD, y = k, sw = k ? 1 : 0;
      // aureola di fili: anello + raggi
      for (let i = 0; i < 64; i++) { const a = i / 64 * TAU; P.px(28 + Math.cos(a) * 12.5, 13 + y + Math.sin(a) * 12.5, THR, 2, { same: i > 0 }); }
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU + (k ? 0.13 : 0), r1 = i % 2 ? 15 : 17;
        P.line(28 + Math.cos(a) * 9, 13 + y + Math.sin(a) * 9, 28 + Math.cos(a) * r1, 13 + y + Math.sin(a) * r1, THR, i % 2 ? 2 : 3);
      }
      // veste (orlo a punte)
      const hem = p2
        ? [[49, 60], [45, 57], [41, 61], [36, 57.5], [31.5, 61.5], [28, 58], [24, 61.5], [19.5, 57.5], [15, 61], [11, 57], [7, 60]]
        : [[49.5, 64.6], [44.5, 62 + sw], [39, 64.6], [33.5, 62 - sw], [28, 64.6], [22.5, 62 + sw], [17, 64.6], [11.5, 62 - sw], [6.5, 64.6]];
      P.poly([[21, 22 + y], [35, 22 + y], [38, 34], [42, 48], ...hem, [14, 48], [18, 34]], R);
      for (const [a, b] of [[22, 15], [25, 21], [31, 35], [34, 41]]) { P.line(a, 36, b, 60, R, 1, { keep: true }); P.line(a + 1, 37, b + 1, 60, R, 3, { keep: true }); }
      hemTrim(P, R, SEAM, 3);
      // cucitura centrale a zig-zag
      P.line(28, 26 + y, 28, 63, R, 0, { keep: true });
      for (let yy = 27 + y; yy < 63; yy += 3) { P.px(27, yy, SEAM, 3, { keep: true }); P.px(29, yy + 1, SEAM, 2, { keep: true }); }
      // toppe cucite sulla veste
      seam(P, 16, 52, 26, 46, R, SEAM, p2 ? 3 : 3);
      seam(P, 31, 44, 41, 51, R, SEAM, p2 ? 3 : 3);
      seam(P, 21, 33, 26, 38, R, SEAM, 3);
      if (p2) {
        // la veste si scuce: fili sciolti che pendono dall'orlo, strappi luminosi
        for (const [tx, ty, l, c] of [[9, 58, 6, 1], [12, 57, 7, -1], [16, 59, 5, 1], [20, 58, 6, 0], [25, 60, 4, 1], [31, 60, 4, -1], [35, 58, 7, 1], [39, 59, 5, 0], [43, 57, 7, -1], [47, 58, 5, 1]]) {
          P.line(tx, ty, tx, ty + l - 2, LOOSE, 3); P.line(tx, ty + l - 2, tx + c, ty + l, LOOSE, 2);
        }
        P.poly([[17, 49], [19.5, 47], [21.5, 50.5], [18.5, 53]], THR); P.poly([[35, 43], [38, 41.5], [39.5, 46], [36.5, 47]], THR);
        P.line(20, 40, 15, 56, THR, 3, { keep: true }); P.line(36, 38, 41, 55, THR, 3, { keep: true });
      }
      // maniche a campana con polsini d'oro
      P.poly([[21, 23 + y], [24.5, 25 + y], [22.5, 34 + y], [21.5, 41.5 + y], [12.5, 43 + y], [15.5, 34 + y]], R, { edge: 0, bias: 0.14 });
      P.poly([[35, 23 + y], [31.5, 25 + y], [33.5, 34 + y], [34.5, 41.5 + y], [43.5, 43 + y], [40.5, 34 + y]], R, { edge: 0, bias: 0.02 });
      P.line(20, 28 + y, 17, 40 + y, R, 1, { keep: true }); P.line(36, 28 + y, 39, 40 + y, R, 1, { keep: true });
      P.ell(16.8, 42.6 + y, 3.4, 1, R, { tone: 0, keep: true }); P.ell(39.2, 42.6 + y, 3.4, 1, R, { tone: 0, keep: true });
      P.line(12.5, 42 + y, 21.5, 41 + y, SEAM, 3, { keep: true }); P.line(34.5, 41 + y, 43.5, 42 + y, SEAM, 3, { keep: true });
      // mani di porcellana con dita ad ago
      for (const s of [-1, 1]) {
        const hx = 28 + s * 11.5, hy = 44 + y;
        [[2, 0, 9.5, 7], [1, 1, 6.5, 11], [0, 1.5, 2, 13]].forEach(([ox, oy, ex, ey], j) => {
          P.line(hx + s * ox, hy + oy, hx + s * ex, hy + ey + (j === 1 ? sw : 0), SILVER, 3);
          P.px(hx + s * ex, hy + ey + (j === 1 ? sw : 0), SILVER, 4, { keep: true });
        });
        P.ell(hx, hy, 2, 1.7, PORC, { edge: 1 });
      }
      P.line(28 - 11.5 - 9.5, 44 + y + 7, 28 - 11.5 - 11, 44 + y + 12, THR, 3); P.px(28 - 11.5 - 10, 44 + y + 14, THR, 2);
      // colletto rigido bordato d'oro
      P.poly([[20.5, 20 + y], [35.5, 20 + y], [34, 26 + y], [28, 28.5 + y], [22, 26 + y]], R, { edge: 1, bias: 0.15 });
      P.line(22, 26 + y, 28, 28 + y, SEAM, 3, { keep: true }); P.line(34, 26 + y, 28, 28 + y, SEAM, 2, { keep: true });
      // cappuccio appuntito
      P.poly([[28, 0.5 + y], [34.5, 6 + y], [36.5, 15 + y], [35.5, 23 + y], [20.5, 23 + y], [19.5, 15 + y], [21.5, 6 + y]], R, { edge: 1, bias: -0.05 });
      P.line(28, 1 + y, 22, 7 + y, SEAM, 3, { keep: true }); P.line(28, 1 + y, 34, 7 + y, SEAM, 2, { keep: true });
      // maschera di porcellana
      P.egg(28, 13.5 + y, 5.6, 6.5, 7.5, 0.32, PORC, { edge: 1 });
      const eye = p2 ? [THR, 4] : [GOLD, 3];
      P.stamp(24, 11 + y, ['bcb', 'cgc', 'bcb'], { b: [BTN, 0], c: [BTN, 2], g: eye });
      P.stamp(29, 11 + y, ['bcb', 'cgc', 'bcb'], { b: [BTN, 0], c: [BTN, 2], g: eye });
      P.stamp(26, 16 + y, ['s.s', '.t.', 's.s'], { s: [STITCH, 1], t: [STITCH, 2] });
      P.px(31, 15 + y, STITCH, 1); P.px(32, 16 + y, STITCH, 2); P.px(31, 17 + y, STITCH, 1);
      if (p2) {
        P.line(28, 7 + y, 27, 9 + y, THR, 3); P.line(27, 9 + y, 28, 11 + y, THR, 4, { same: true }); P.px(26, 20 + y, THR, 2);
        P.aura = '#6a2a10';
      }
    });
  }
})();

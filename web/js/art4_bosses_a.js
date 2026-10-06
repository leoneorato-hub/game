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
  const HEX = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const LV = (() => { const v = [-0.52, -0.7, 0.62], l = Math.hypot(v[0], v[1], v[2]); return v.map(a => a / l); })();
  // luce lambert -> 0..1 (con ambiente)
  const lit = (nx, ny, nz) => { const l = Math.hypot(nx, ny, nz) || 1; return 0.3 + 0.62 * ((nx * LV[0] + ny * LV[1] + nz * LV[2]) / l); };
  const MAT = (r, o = {}) => Object.assign({ r }, o);

  class Px {
    constructor(w, h) {
      this.w = w; this.h = h; const N = w * h;
      this.sid = new Int32Array(N); this.mt = new Array(N).fill(null); this.tn = new Int8Array(N); this.fx = new Uint8Array(N);
      this.n = 0; this.info = [null];
    }
    // riempimento generico: f(x,y) -> null fuori | v (0..1) luminosità
    fill(x0, y0, x1, y1, f, m, o = {}) {
      const keep = !!o.keep;
      let id = this.n;
      if (!keep && !o.same) { id = ++this.n; this.info[id] = { edge: o.edge, cast: o.cast !== false }; }
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.h - 1, Math.ceil(y1)); y++)
        for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(this.w - 1, Math.ceil(x1)); x++) {
          const v = f(x + 0.5, y + 0.5);
          if (v === null || v === undefined || v === false) continue;
          const i = y * this.w + x;
          if (keep && !this.sid[i]) continue;
          if (o.only && this.mt[i] !== o.only) continue;
          if (m === null) { this.sid[i] = 0; this.mt[i] = null; continue; }
          if (!keep) this.sid[i] = id;
          this.mt[i] = m;
          if (o.tone !== undefined) { this.tn[i] = o.tone; this.fx[i] = 1; }
          else { this.tn[i] = this.q(m, (typeof v === 'number' ? v : 0.5) + (o.bias || 0)); this.fx[i] = 0; }
        }
      return this;
    }
    q(m, v) { const n = m.r.length; return clamp(Math.floor(v * n), 0, n - 1); }
    ell(cx, cy, rx, ry, m, o = {}) {
      const rot = o.rot || 0, c = Math.cos(rot), s = Math.sin(rot), R = Math.max(rx, ry) + 1, fl = o.fl ?? 1;
      return this.fill(cx - R, cy - R, cx + R, cy + R, (x, y) => {
        const dx = x - cx, dy = y - cy, u = (dx * c + dy * s) / rx, w = (-dx * s + dy * c) / ry, d = u * u + w * w;
        if (d > 1) return null;
        if (o.v) return o.v(x, y);
        const nx = u * c - w * s, ny = u * s + w * c;
        return lit(nx * fl, ny * fl, Math.sqrt(Math.max(0, 1 - d)));
      }, m, o);
    }
    // uovo: semiasse verticale diverso sopra/sotto, si stringe verso il basso
    egg(cx, cy, rx, ryT, ryB, taper, m, o = {}) {
      const fl = o.fl ?? 1;
      return this.fill(cx - rx - 1, cy - ryT - 1, cx + rx + 1, cy + ryB + 1, (x, y) => {
        const dy = y - cy, ry = dy < 0 ? ryT : ryB, rxe = rx * (1 - taper * Math.max(0, dy / ryB));
        const u = (x - cx) / rxe, w = dy / ry, d = u * u + w * w;
        if (d > 1) return null;
        if (o.v) return o.v(x, y);
        return lit(u * fl, w * fl, Math.sqrt(Math.max(0, 1 - d)));
      }, m, o);
    }
    cap(x1, y1, x2, y2, r, m, o = {}) {
      const r2 = o.r2 ?? r, dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1, M = Math.max(r, r2) + 1, fl = o.fl ?? 1;
      return this.fill(Math.min(x1, x2) - M, Math.min(y1, y2) - M, Math.max(x1, x2) + M, Math.max(y1, y2) + M, (x, y) => {
        const t = clamp(((x - x1) * dx + (y - y1) * dy) / L, 0, 1);
        const px = x - (x1 + dx * t), py = y - (y1 + dy * t), rr = r + (r2 - r) * t, d2 = (px * px + py * py) / (rr * rr);
        if (d2 > 1) return null;
        if (o.v) return o.v(x, y);
        return lit(px / rr * fl, py / rr * fl, Math.sqrt(Math.max(0, 1 - d2)));
      }, m, o);
    }
    poly(pts, m, o = {}) {
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const X0 = Math.min(...xs), X1 = Math.max(...xs), Y0 = Math.min(...ys), Y1 = Math.max(...ys);
      const cx = o.cx ?? (X0 + X1) / 2, cy = o.cy ?? (Y0 + Y1) / 2, hw = (X1 - X0) / 2 || 1, hh = (Y1 - Y0) / 2 || 1, fl = o.fl ?? 0.55;
      return this.fill(X0, Y0, X1, Y1, (x, y) => {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
        }
        if (!inside) return null;
        if (o.v) return o.v(x, y);
        const u = clamp((x - cx) / hw, -1, 1), w = clamp((y - cy) / hh, -1, 1);
        return lit(u * fl, w * fl * 0.8, Math.sqrt(Math.max(0.05, 1 - (u * u + w * w) * fl * fl)));
      }, m, o);
    }
    rect(x, y, w, h, m, o = {}) { return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], m, o); }
    // pixel singolo / linea (Bresenham) con tono esplicito
    px(x, y, m, t, o = {}) {
      x = Math.floor(x); y = Math.floor(y);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
      const i = y * this.w + x;
      if (o.keep && !this.sid[i]) return this;
      if (m === null) { this.sid[i] = 0; this.mt[i] = null; return this; }
      if (!o.keep) { if (!o.same) { this.n++; this.info[this.n] = { edge: o.edge, cast: o.cast !== false }; } this.sid[i] = this.n; }
      this.mt[i] = m; this.tn[i] = t ?? 2; this.fx[i] = 1;
      return this;
    }
    line(x0, y0, x1, y1, m, t, o = {}) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy, first = true;
      for (;;) {
        this.px(x0, y0, m, t, Object.assign({}, o, { same: o.keep ? false : !first || o.same }));
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
      for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === '.' || ch === ' ' || !(ch in map)) continue;
        const v = map[ch];
        if (v === null) { this.px(x0 + x, y0 + y, null); continue; }
        this.px(x0 + x, y0 + y, v[0], v[1], Object.assign({}, o, { same: o.keep ? false : !first }));
        first = false;
      }
      return this;
    }
    // cottura: ombre portate, linee interne, nuclei emissivi, contorno
    bake(o = {}) {
      const { w, h, sid, mt, tn, fx, info } = this;
      const N = w * h, T = Int8Array.from(tn);
      const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : sid[y * w + x]);
      const mAt = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : mt[y * w + x]);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, s = sid[i], m = mt[i];
        if (!s || !m) continue;
        if (m.glow) {
          if (fx[i]) continue;
          let d = 1;
          for (; d < 4; d++) {
            let out = false;
            for (const [ax, ay] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const mm = mAt(x + ax * d, y + ay * d); if (!mm || !mm.glow) { out = true; break; } }
            if (out) break;
          }
          T[i] = clamp((m.base ?? 1) + d - 1, 0, m.r.length - 1);
          continue;
        }
        const inf = info[s];
        if (inf && inf.edge !== undefined && inf.edge !== false) {
          let e = false;
          for (const [ax, ay] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const s2 = at(x + ax, y + ay); if (s2 && s2 !== s && s2 < s && !(mAt(x + ax, y + ay) || {}).glow) { e = true; break; } }
          if (e) { T[i] = inf.edge === true ? 0 : Math.min(T[i], inf.edge); continue; }
        }
        if (!fx[i]) {
          const up = at(x, y - 1);
          if (up && up > s && info[up] && info[up].cast && !(mAt(x, y - 1) || {}).glow) T[i] = Math.max(0, T[i] - 1);
        }
      }
      const c = makeCanvas(w, h), cx = c.getContext('2d'), id = cx.createImageData(w, h), D = id.data;
      const put = (i, hex) => { const [r, g, b] = HEX(hex); D[i * 4] = r; D[i * 4 + 1] = g; D[i * 4 + 2] = b; D[i * 4 + 3] = 255; };
      for (let i = 0; i < N; i++) if (sid[i] && mt[i]) put(i, mt[i].r[T[i]]);
      if (o.outline !== false) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (sid[i]) continue;
        let ink = null, glowN = null;
        for (const [ax, ay] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const mm = mAt(x + ax, y + ay);
          if (!mm || !at(x + ax, y + ay)) continue;
          if (mm.glow || mm.soft) glowN = mm; else ink = mm.ink || INK;
        }
        if (ink) put(i, ink); else if (glowN) put(i, glowN.ol || glowN.r[0]);
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
    const IRON = MAT(['#2a2a36', '#55586a', '#8a8ea0', '#c4c8d4']);
    const BL = {
      1: ['c'],
      2: ['cb', 'ba'],
      3: ['.c.', 'cdb', '.a.'],
      4: ['.cb.', 'cdcb', 'bcba', '.aa.'],
      5: ['.ccb.', 'cddcb', 'cdcba', 'bcbaa', '.aaa.'],
    };
    const BM = { a: [INF, 1], b: [INF, 2], c: [INF, 3], d: [INF, 4] };
    const blob = (P, x, y, n) => P.stamp(Math.round(x - n / 2), Math.round(y - n / 2), BL[n], BM);
    // anelli di catena: verticale (ovale) / orizzontale (barretta)
    const link = (P, x, y, vert) => {
      if (vert) P.stamp(Math.round(x) - 1, Math.round(y) - 1, ['.c.', 'b.b', '.a.'], { a: [IRON, 1], b: [IRON, 2], c: [IRON, 3] });
      else P.stamp(Math.round(x) - 1, Math.round(y), ['cb'], { b: [IRON, 1], c: [IRON, 3] });
    };
    const chain = (P, pts) => { pts.forEach(([x, y], i) => link(P, x, y, i % 2 === 0)); };
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
      P.egg(24.5, 34 + y, 5.2, 7, 11, 0.35, VOID, { fl: 0.7 });
      // lembo sinistro (copre il moncherino del braccio perduto)
      P.poly([[15.5, 27.5 + y], [22, 27 + y], [21.5, 34 + y], [20.5, 42], [19 + sw, 48], [17, 44.5], [14.5, 48.5], [13, 42], [13.3, 33]], CLOAK, { edge: 1, bias: 0.06 });
      // lembo destro (dietro al braccio)
      P.poly([[27.5, 27 + y], [32.5, 28 + y], [35, 34], [35.5, 43], [33.5 + sw, 47.5], [31.5, 44], [29, 46.5], [29.2, 37]], CLOAK, { edge: 1, bias: -0.04 });
      // pieghe
      P.line(17, 31 + y, 15.5, 43, CLOAK, 1, { keep: true }); P.line(19.5, 33 + y, 18.5, 45, CLOAK, 1, { keep: true });
      P.line(33, 34, 33.5, 42, CLOAK, 1, { keep: true });
      P.line(14.5, 31 + y, 14, 40, CLOAK, 4, { keep: true });
      // colletto sulle spalle
      P.ell(24, 27.5 + y, 8.5, 2.4, CLOAK, { edge: 1, fl: 0.5, bias: 0.15 });
      // Infezione sul busto
      const blobs = p2
        ? [[25, 35, 5], [22.5, 40.5, 4], [27.5, 41, 3], [23.5, 31.2, 3], [20.5, 36, 2], [17, 39, 3], [32.5, 31.5, 2], [26, 45, 2], [15, 46, 2], [33, 44, 2]]
        : [[25, 35.5, 4], [22.5, 40.5, 3], [27.5, 41.5, 2]];
      for (const [bx, by, n] of blobs) blob(P, bx, by + (by < 44 ? y : 0), n);
      // braccio destro (regge l'Aculeo)
      P.cap(30.5, 30 + y, 31, 37.5, 1.5, VOID, { edge: 2, r2: 1.2 });
      P.ell(30.5, 38.5, 1.8, 1.6, VOID, { tone: 3 });
      P.rect(29.2, 35.5 + y, 3.2, 1.2, IRON, { tone: 2 });  // manetta
      // catene spezzate: dalla spalla sinistra e dalla manetta
      chain(P, [[12.5, 30 + y], [11.5, 32 + y], [11, 34 + y], [10.5 + sw, 36 + y], [10.5 + sw, 38 + y], [11 + sw, 40 + y]]);
      chain(P, [[33.5, 37 + y], [34.5, 39 + y], [35, 41 + y + sw], [35.5, 43 + y + sw]]);
      // corna
      P.cap(19.5, 11 + y, 17.6, 4 + y, 1.9, SHELL, { r2: 1.3 });
      P.cap(17.6, 4.5 + y, 16.4, 1 + y, 1.3, SHELL, { r2: 0.7, same: true });
      P.cap(28.5, 11 + y, 30.4, 4 + y, 1.9, SHELL, { r2: 1.3 });
      P.cap(30.4, 4.5 + y, 31.6, 1 + y, 1.3, SHELL, { r2: 0.7, same: true });
      // maschera
      P.egg(24, 16.5 + y, 8.6, 7.5, 9.5, 0.34, SHELL, { edge: 1 });
      // occhi
      P.ell(20.3, 18 + y, 2.2, 3.5, VOID, { tone: 0, rot: 0.12 });
      P.ell(27.7, 18 + y, 2.2, 3.5, VOID, { tone: 0, rot: -0.12 });
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
})();

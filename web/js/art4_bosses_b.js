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
  const LV = (() => { const v = [-0.55, -0.72, 0.6], l = Math.hypot(v[0], v[1], v[2]); return v.map(a => a / l); })();
  const lit = (nx, ny, nz) => { const l = Math.hypot(nx, ny, nz) || 1; return 0.26 + 0.7 * Math.max(-0.2, (nx * LV[0] + ny * LV[1] + nz * LV[2]) / l); };
  const MAT = (r, o = {}) => Object.assign({ r }, o);
  const N4 = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  class Px {
    constructor(w, h) {
      this.w = w; this.h = h; const N = w * h;
      this.sid = new Int32Array(N); this.mt = new Array(N).fill(null); this.tn = new Int8Array(N); this.fx = new Uint8Array(N);
      this.n = 0; this.info = [null];
    }
    _new(o) { this.n++; this.info[this.n] = { edge: o.edge, cast: o.cast !== false }; return this.n; }
    // riempimento generico: f(x,y) -> null fuori | v (0..1) luminosità
    fill(x0, y0, x1, y1, f, m, o = {}) {
      const keep = !!o.keep, id = keep ? 0 : (o.same ? this.n : this._new(o));
      const only = o.only ? [].concat(o.only) : null;
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.h - 1, Math.ceil(y1)); y++)
        for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(this.w - 1, Math.ceil(x1)); x++) {
          const v = f(x + 0.5, y + 0.5);
          if (v === null || v === undefined || v === false) continue;
          if (o.clip && !o.clip(x, y)) continue;
          const i = y * this.w + x;
          if (keep && !this.sid[i]) continue;
          if (only && !only.includes(this.mt[i])) continue;
          if (m === null) { this.sid[i] = 0; this.mt[i] = null; continue; }
          if (!keep) this.sid[i] = id;
          this.mt[i] = m;
          if (o.tone !== undefined) { this.tn[i] = typeof o.tone === 'function' ? o.tone(x, y) : o.tone; this.fx[i] = 1; }
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
      const r2 = o.r2 ?? r, dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1, Mx = Math.max(r, r2) + 1, fl = o.fl ?? 1;
      return this.fill(Math.min(x1, x2) - Mx, Math.min(y1, y2) - Mx, Math.max(x1, x2) + Mx, Math.max(y1, y2) + Mx, (x, y) => {
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
      const cx = o.cx ?? (X0 + X1) / 2, cy = o.cy ?? (Y0 + Y1) / 2, hw = (X1 - X0) / 2 || 1, hh = (Y1 - Y0) / 2 || 1, fl = o.fl ?? 0.6;
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
      if (o.only && ![].concat(o.only).includes(this.mt[i])) return this;
      if (m === null) { this.sid[i] = 0; this.mt[i] = null; return this; }
      if (!o.keep) { if (!o.same) this._new(o); this.sid[i] = this.n; }
      this.mt[i] = m; this.tn[i] = t ?? 2; this.fx[i] = 1;
      return this;
    }
    line(x0, y0, x1, y1, m, t, o = {}) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy, first = true;
      for (;;) {
        this.px(x0, y0, m, t, Object.assign({}, o, { same: o.keep ? false : (!first || o.same) }));
        first = false;
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
      return this;
    }
    // polilinea
    path(pts, m, t, o = {}) { for (let i = 1; i < pts.length; i++) this.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], m, t, Object.assign({}, o, { same: o.keep ? false : (i > 1 || o.same) })); return this; }
    // griglia di caratteri -> pixel (map: char -> [mat, tono] | null per cancellare)
    stamp(x0, y0, rows, map, o = {}) {
      let first = true;
      for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === '.' || ch === ' ' || !(ch in map)) continue;
        const v = map[ch];
        const X = o.flip ? x0 + rows[y].length - 1 - x : x0 + x;
        if (v === null) { this.px(X, y0 + y, null); continue; }
        this.px(X, y0 + y, v[0], v[1], Object.assign({}, o, { same: o.keep ? false : (!first || o.same) }));
        first = false;
      }
      return this;
    }
    get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; return this.mt[y * this.w + x]; }
    // cottura: pulizia orfani, ombre portate, linee interne, nuclei emissivi, contorno
    bake(o = {}) {
      const { w, h, sid, mt, tn, fx, info } = this;
      const N = w * h;
      const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : sid[y * w + x]);
      const mAt = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : mt[y * w + x]);
      // 1) pixel orfani: un tono isolato dentro la stessa forma prende il tono dei vicini
      const T0 = Int8Array.from(tn);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x, s = sid[i];
        if (!s || fx[i] || !mt[i] || mt[i].glow) continue;
        const cnt = {}; let same = 0, nb = 0;
        for (const [ax, ay] of N4) { const j = (y + ay) * w + x + ax; if (sid[j] !== s || mt[j] !== mt[i]) continue; nb++; if (T0[j] === T0[i]) same++; else cnt[T0[j]] = (cnt[T0[j]] || 0) + 1; }
        if (nb >= 3 && same === 0) { let bt = T0[i], bc = 0; for (const k in cnt) if (cnt[k] > bc) { bc = cnt[k]; bt = +k; } tn[i] = bt; }
      }
      const T = Int8Array.from(tn);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, s = sid[i], m = mt[i];
        if (!s || !m) continue;
        if (m.glow) {
          if (fx[i]) continue;
          let d = 1;
          for (; d < 4; d++) {
            let out = false;
            for (const [ax, ay] of N4) { const mm = mAt(x + ax * d, y + ay * d); if (!mm || !mm.glow) { out = true; break; } }
            if (out) break;
          }
          T[i] = clamp((m.base ?? 1) + d - 1, 0, m.r.length - 1);
          continue;
        }
        const inf = info[s];
        if (inf && inf.edge !== undefined && inf.edge !== false) {
          let e = false;
          for (const [ax, ay] of N4) { const s2 = at(x + ax, y + ay); if (s2 && s2 !== s && s2 < s && !(mAt(x + ax, y + ay) || {}).glow) { e = true; break; } }
          if (e) { T[i] = inf.edge === true ? 0 : Math.min(T[i], inf.edge); continue; }
        }
        if (!fx[i]) {
          const up = at(x, y - 1);
          if (up && up > s && info[up] && info[up].cast && !(mAt(x, y - 1) || {}).glow && !m.nocast) T[i] = Math.max(0, T[i] - 1);
        }
      }
      const c = makeCanvas(w, h), cx = c.getContext('2d'), id = cx.createImageData(w, h), D = id.data;
      const put = (i, hex) => { const [r, g, b] = HEX(hex); D[i * 4] = r; D[i * 4 + 1] = g; D[i * 4 + 2] = b; D[i * 4 + 3] = 255; };
      for (let i = 0; i < N; i++) if (sid[i] && mt[i]) put(i, mt[i].r[clamp(T[i], 0, mt[i].r.length - 1)]);
      if (o.outline !== false) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (sid[i]) continue;
        let ink = null, soft = null;
        for (const [ax, ay] of N4) {
          const mm = mAt(x + ax, y + ay);
          if (!mm || !at(x + ax, y + ay) || mm.noOl) continue;
          if (mm.glow || mm.soft) soft = mm; else ink = mm.ink || INK;
        }
        if (ink) put(i, ink); else if (soft) put(i, soft.ol || soft.r[0]);
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
  function reg2(name, w, h, draw) {
    for (const [suf, k] of [['', 0], ['_b', 1]]) {
      const P = new Px(w, h);
      draw(P, k);
      regSprite(name + suf, P.bake());
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
      // cervello esposto: lobi più chiari e solchi
      P.egg(CX, 9, 12, 8, 3, 0.05, SK, { keep: true, bias: 0.1, clip: (x, y) => y < 11 });
      for (const pts of [[[CX, 1.5], [CX, 4], [CX - 1, 7], [CX, 10]], [[CX - 4, 2.5], [CX - 5, 4.5], [CX - 4, 6.5], [CX - 6, 9]], [[CX + 4, 2.5], [CX + 5, 4.5], [CX + 4, 6.5], [CX + 6, 9]], [[CX - 9, 4], [CX - 9, 6], [CX - 11, 8]], [[CX + 9, 4], [CX + 9, 6], [CX + 11, 8]]]) P.path(pts, SK, 1, { keep: true });
      P.path([[CX - 13, 11], [CX - 9, 10.5], [CX - 4, 11], [CX, 10.5], [CX + 4, 11], [CX + 9, 10.5], [CX + 13, 11]], SKD, 1, { keep: true });
      // arcata sopraccigliare + occhio frontale
      P.path([[CX - 8, 13], [CX - 4, 11.6], [CX + 4, 11.6], [CX + 8, 13]], SKD, 2, { keep: true });
      eye(P, CX, 16.5, 5.2, 3.8, p2 ? 1 : (k ? 0.75 : 1), p2, 0);
      // orbite infossate ai lati con occhietti azzurri
      for (const s of [-1, 1]) { P.ell(CX + s * 8.6, 21.5, 2.6, 1.9, CAV, { keep: true, tone: 1 }); P.px(CX + s * 8.6 - (s > 0 ? 1 : 0), 21, IRIS, p2 ? 4 : 2, { keep: true }); }
      // zigomi
      for (const s of [-1, 1]) P.path([[CX + s * 12, 19], [CX + s * 10, 24], [CX + s * 7, 25.5]], SK, 1, { keep: true });
      // bocca con denti
      P.ell(CX, 25.5, 6.5, 2.4, CAV, { keep: true, tone: 0 });
      for (let i = -3; i <= 3; i++) { P.px(CX + i * 2, 24, BONE, 3, { keep: true }); P.px(CX + i * 2 + 1, 27, BONE, 2, { keep: true }); }
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
        P.egg(CX, 24.5, 6.6, 6.5, 7, 0.34, MASK, { fl: 0.9, bias: 0.08 });
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
        P.poly([[CX - 9.5, 18.5], [CX - 6, 18.5], [CX - 6.5, 25], [CX - 5.5, 31], [CX - 9, 30]], MASK, { fl: 0.6 });
        P.poly([[CX + 6, 18.5], [CX + 9.5, 18.5], [CX + 9, 30], [CX + 5.5, 31], [CX + 6.5, 25]], MASK, { fl: 0.6 });
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
      P.poly([[13.5, 56.5], [19.5, 57], [21, 61], [26, 64], [31.5, 62.5], [36, 64.5], [39.5, 67.5], [39.5, 70.5], [31, 70.5], [26, 68.5], [21, 66], [17.5, 64.5], [13.5, 63.5], [12.5, 60]], SHOE, { fl: 0.55, bias: 0.06, cx: 23, cy: 62 });
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
    });

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
    });
  }
})();

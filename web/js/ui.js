'use strict';
const V1REF = new Image(); V1REF.src = 'assets/v1_ref.png';
// =============================================================================
// UI (Alfa 2) — menu, Storia, selezione animata, Merceria, level-up, scelte,
// pausa e "scontrino" di fine run. Mouse, tastiera (frecce + INVIO, ESC),
// gamepad e touch.
// =============================================================================

const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

const HOME_WORLD = { knight: 'hk', v1: 'hades', zagreus: 'hades', madeline: 'celeste', prisoner: 'terra', penitent: 'blas', terrarian: 'terra', isaac: 'blas' };
const CHAR_BG = { knight: ['#1e2840', '#9fe0ff'], v1: ['#4a1414', '#ff8a2a'], zagreus: ['#1c2a24', '#3ad08a'], madeline: ['#2a3458', '#ffffff'], prisoner: ['#262e22', '#7aff9a'], penitent: ['#5a4630', '#ffd27a'], terrarian: ['#2c4a22', '#ffe680'], isaac: ['#4a3424', '#c9a07a'] };

const UI = {
  current: null,
  sel: { char: 'knight', stage: 'telaio' },
  mode: 'story',
  levelOpts: [],
  back: null,
  anim: [],
  voice: { text: '', shown: 0, acc: 0, who: null },

  show(id, focusSel) {
    document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== id; });
    this.current = id;
    $('#ui').hidden = !id;
    document.body.classList.toggle('in-menu', !!id && !G);
    const scr = id && $('#' + id);
    if (scr) {
      const f = (focusSel && scr.querySelector(focusSel)) || scr.querySelector('.nav.is-sel') || scr.querySelector('.nav');
      if (f) setTimeout(() => f.focus({ preventScroll: false }), 0);
    }
  },
  hideAll() { this.show(null); if (document.activeElement) document.activeElement.blur(); },

  // Animazioni dei canvas nei menu (chiamata a ogni fotogramma)
  tick(dt) {
    const t = performance.now() / 1000;
    for (const a of this.anim) if (a.cnv.isConnected && a.cnv.offsetParent !== null) a.draw(t, dt);
    const v = this.voice;
    if (v.el && v.shown < v.text.length) {
      v.acc += dt * 50;
      while (v.acc >= 1 && v.shown < v.text.length) { v.acc--; v.shown++; if (v.shown % 2 === 0 && !inBrackets(v.text, v.shown)) blip(v.who, v.text[v.shown - 1], v.shown); }
      v.el.textContent = v.text.slice(0, v.shown);
    }
  },
  say(elm, who, text) { Object.assign(this.voice, { el: elm, who, text, shown: 0, acc: 0 }); elm.textContent = ''; elm.style.setProperty('--vc', (VOICES[who] || {}).col || '#fff'); },

  // ------------------------------------------------------------------ TITOLO
  initTitle() {
    $('#b-start').onclick = () => { sfx('ui'); this.openPlayers(); };
    $('#b-shop').onclick = () => { sfx('ui'); this.openShop(); };
    $('#b-controls').onclick = () => { sfx('ui'); this.openControls('s-title'); };
    $('#b-options').onclick = () => { sfx('ui'); this.openOptions('s-title'); };
    $('#splash').textContent = pick(SPLASHES);
    $('#title-tip').textContent = pick(TIPS);
    const done = Object.keys(META.beaten).length;
    $('#title-progress').textContent = done ? 'Storia: ' + done + '/' + STORY.length + ' capitoli ricuciti · Filo: ' + META.thread : 'Filo: ' + META.thread;
  },
  openTitle() { this.initTitle(); this.back = null; this.show('s-title'); },

  // ------------------------------------------------------------------ SINGOLO / CO-OP
  players: 'single',
  party: [],
  openPlayers() {
    this.bigArt();
    $('#b-single').onclick = () => { sfx('ui'); this.players = 'single'; this.party = []; this.openModes(); };
    $('#b-coop').onclick = () => { sfx('ui'); this.players = 'coop'; this.openModes(); };
    this.back = () => this.openTitle();
    this.show('s-players', this.players === 'coop' ? '#b-coop' : '#b-single');
  },
  openModes() {
    this.bigArt();
    $('#modes-who').textContent = this.players === 'coop' ? 'Co-op locale (2–4 giocatori)' : 'Giocatore singolo';
    const done = Object.keys(META.beaten).length;
    $('#m-story-meta').textContent = done ? 'Capitoli ricuciti: ' + done + '/' + STORY.length : 'Consigliata per iniziare';
    $('#m-endless-meta').textContent = 'Record: punto ' + (META.endlessBest || 0) + ' · ' + fmtTime(META.endlessTime || 0) + ' · Memorie: ' + (META.lore || 0) + '/' + LORE.length;
    const go = mode => { sfx('ui'); this.mode = mode; if (this.players === 'coop') this.openLobby(); else this.openChars(); };
    $('#b-m-story').onclick = () => go('story');
    $('#b-m-endless').onclick = () => go('endless');
    $('#b-m-extra').onclick = () => go('extra');
    this.back = () => this.openPlayers();
    this.show('s-modes', this.mode === 'endless' ? '#b-m-endless' : '#b-m-story');
  },
  // disegni animati sulle grandi scelte
  bigArt() {
    document.querySelectorAll('.bc-art').forEach(cnv => {
      if (this.anim.some(a => a.cnv === cnv)) return;
      const kind = cnv.dataset.art;
      this.anim.push({ cnv, draw: t => {
        const x = cnv.getContext('2d'); x.imageSmoothingEnabled = false;
        x.fillStyle = '#120c16'; x.fillRect(0, 0, 160, 90);
        if (TILES) { const k = { single: 'hk', coop: 'terra', story: 'blas', endless: 'hades' }[kind] || 'hk'; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { x.globalAlpha = 0.35; x.drawImage(TILES[k] || TILES.hk, i * 32 - ((t * 10) % 32), j * 32); } x.globalAlpha = 1; }
        const hero = (n, px, py, ph, sc = 1.5) => { const s = SPR[n + '_w' + (Math.floor(t * 8 + ph) % 4)] || SPR[n]; if (!s) return; x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(px, py, 9, 2.5, 0, 0, TAU); x.fill(); x.drawImage(s.img, Math.round(px - s.w * sc / 2), Math.round(py - s.h * sc), s.w * sc, s.h * sc); };
        if (kind === 'single') hero(this.sel.char || 'knight', 80, 82, 0, 1.8);
        else if (kind === 'coop') ['knight', 'madeline', 'zagreus', 'isaac'].forEach((n, i) => { hero(n, 30 + i * 34, 80 + (i % 2) * 3, i); x.fillStyle = PCOL[i]; x.fillRect(30 + i * 34 - 5, 14 + (i % 2) * 3, 10, 2); });
        else if (kind === 'story') {
          STORY.slice(1, 9).forEach((ch, i) => {
            const px = 8 + (i % 4) * 30, py = 12 + Math.floor(i / 4) * 34, b = META.beaten[ch.id];
            const tl = WTHUMB[ch.id] || (WTHUMB[ch.id] = paintTile(WORLDS[ch.id].tiles[0], 3));
            x.drawImage(tl, 0, 0, 26, 26, px, py, 26, 26);
            x.strokeStyle = b ? '#ffd23f' : '#1a1220'; x.strokeRect(px + 0.5, py + 0.5, 25, 25);
            if (b) { x.fillStyle = '#ffd23f'; x.fillRect(px + 20, py + 2, 4, 4); }
            x.strokeStyle = '#e2b04a'; x.setLineDash([2, 2]); x.strokeRect(px - 1.5, py - 1.5, 29, 29); x.setLineDash([]);
          });
          const s = SPR['B_cucitrice_0']; if (s) { const k = Math.min(1, 80 / s.h); x.drawImage(s.img, 156 - s.w * k, 88 - s.h * k + Math.sin(t * 2) * 2, s.w * k, s.h * k); }
        }
        else { const cx = 80, cy = 45; for (let i = 0; i < 9; i++) { const a = t * 0.8 + i / 9 * TAU; x.fillStyle = ['#1e2840', '#4a1414', '#1c2a24', '#c8d4e8', '#2a3226', '#5a4630', '#2c4a22', '#4a3424', '#0c0a14'][i]; x.fillRect(Math.round(cx + Math.cos(a) * 52 - 8), Math.round(cy + Math.sin(a) * 26 - 6), 16, 12); } x.strokeStyle = '#e2b04a'; x.setLineDash([2, 2]); x.beginPath(); x.ellipse(cx, cy, 52, 26, 0, 0, TAU); x.stroke(); x.setLineDash([]); if (SPR.spool) x.drawImage(SPR.spool.img, cx - 9, cy - 10, 18, 20); }
      } });
    });
  },

  // ------------------------------------------------------------------ LOBBY CO-OP
  lobby: [],
  openLobby() {
    this.lobby = this.lobby.filter(m => m.dev);
    this.lobbyGo = null;
    $('#lobby-help').innerHTML = ['kb1', 'kb2', 'kb3', 'kb4', 'pad0'].map(d => `<span><b>${esc(DEVICES[d].name)}</b> · ${esc(DEVICES[d].hint)}</span>`).join('');
    this.renderLobby();
    this.back = () => this.openModes();
    this.show('s-lobby');
  },
  renderLobby() {
    const box = $('#lobby-slots');
    box.innerHTML = '';
    this.anim = this.anim.filter(a => !a.lobby);
    for (let i = 0; i < 4; i++) {
      const m = this.lobby[i];
      const d = el('div', 'lobby-slot' + (m ? ' joined' : '') + (m && m.ready ? ' ready' : ''));
      d.style.setProperty('--pc', PCOL[i]);
      if (!m) {
        d.innerHTML = `<span class="ls-label">P${i + 1}</span><span class="ls-hint">Libero<br>Premi SPAZIO, INVIO, U, 0 del tastierino o A su un gamepad per entrare</span>`;
      } else {
        const c = CHARS[m.char];
        d.innerHTML = `<span class="ls-label">P${i + 1}</span><span class="ls-dev">${esc(DEVICES[m.dev].name)}</span><canvas width="48" height="56"></canvas><span class="ls-arrows">◀ <span class="ls-name">${esc(c.name)}</span> ▶</span><span class="ls-hint">${esc(c.game)}</span><span class="ls-hint">${m.ready ? 'Pronto! (abilità per annullare)' : 'Abilità = PRONTO'}</span>`;
        const cnv = d.querySelector('canvas');
        this.anim.push({ lobby: true, cnv, draw: t => {
          const x = cnv.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 48, 56);
          const s = SPR[c.spr + (m.ready ? '_w' + (Math.floor(t * 9) % 4) : (Math.sin(t * 2.6 + i) > 0 ? '_i1' : '_i0'))] || SPR[c.spr];
          const k = Math.min(1.4, 44 / s.h);
          x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(24, 53, 12, 3, 0, 0, TAU); x.fill();
          x.drawImage(s.img, Math.round(24 - s.w * k / 2), Math.round(55 - s.h * k), s.w * k, s.h * k);
        } });
      }
      box.appendChild(d);
    }
    const n = this.lobby.length, ready = n >= 2 && this.lobby.every(m => m.ready);
    $('#lobby-status').textContent = n < 2 ? 'Servono almeno 2 giocatori' : ready ? 'Tutti pronti! Si parte…' : 'In attesa che tutti siano pronti (' + this.lobby.filter(m => m.ready).length + '/' + n + ')';
    if (ready && !this.lobbyGo) {
      this.lobbyGo = setTimeout(() => {
        this.lobbyGo = null;
        if (UI.current !== 's-lobby' || !(this.lobby.length >= 2 && this.lobby.every(m => m.ready))) return;
        this.party = this.lobby.map(m => ({ char: m.char, dev: m.dev }));
        sfx('evo');
        if (this.mode === 'extra') this.openStages(); else this.openStory();
      }, 900);
    }
  },
  lobbyAct(dev, act) {
    let i = this.lobby.findIndex(m => m.dev === dev);
    const ids = Object.keys(CHARS);
    if (i < 0) {
      if (act !== 'ab' || this.lobby.length >= 4) return false;
      const taken = this.lobby.map(m => m.char);
      this.lobby.push({ dev, char: ids.find(id => !taken.includes(id)) || 'knight', ready: false });
      i = this.lobby.length - 1;
      sfx('ui'); voiceBlips(this.lobby[i].char === 'terrarian' ? 'guide' : this.lobby[i].char, 'eccomi', 4);
    } else {
      const m = this.lobby[i];
      if (act === 'ab') { m.ready = !m.ready; sfx(m.ready ? 'evo' : 'ui'); }
      else if ((act === 'l' || act === 'r') && !m.ready) { const k = ids.indexOf(m.char); m.char = ids[(k + (act === 'r' ? 1 : -1) + ids.length) % ids.length]; sfx('ui'); const [who, text] = vary('sel' + m.char, SELECT_ALT[m.char]); voiceBlips(who, text, 6); }
      else if (act === 'leave') { this.lobby.splice(i, 1); sfx('ui'); }
      else return false;
    }
    this.renderLobby();
    const slot = $('#lobby-slots').children[Math.min(i, 3)]; if (slot) { slot.classList.remove('bump'); void slot.offsetWidth; slot.classList.add('bump'); }
    return true;
  },
  lobbyKey(e) {
    if (e.repeat) return true;
    if (e.code === 'Escape') { if (this.lobby.length) { this.lobby.pop(); this.renderLobby(); } else this.back(); return true; }
    for (const dev of ['kb1', 'kb2', 'kb3', 'kb4']) {
      const D = DEVICES[dev];
      if (D.ab.includes(e.code)) return this.lobbyAct(dev, 'ab');
      if (D.left.includes(e.code)) return this.lobbyAct(dev, 'l');
      if (D.right.includes(e.code)) return this.lobbyAct(dev, 'r');
    }
    return false;
  },
  lobbyPad(i, P) {
    const dev = 'pad' + i;
    if (P.aEdge) this.lobbyAct(dev, 'ab');
    if (P.lEdge) this.lobbyAct(dev, 'l');
    if (P.rEdge) this.lobbyAct(dev, 'r');
    if (P.bEdge) { if (this.lobby.some(m => m.dev === dev)) this.lobbyAct(dev, 'leave'); else if (!this.lobby.length) this.back(); }
  },
  partyOf() { return this.players === 'coop' && this.party.length ? this.party : [{ char: this.sel.char, dev: 'solo' }]; },
  partyName() { return this.partyOf().map(m => CHARS[m.char].name).join(' · '); },

  // ------------------------------------------------------------------ PERSONAGGI
  openChars() {
    const grid = $('#char-grid');
    grid.innerHTML = '';
    this.anim = this.anim.filter(a => !a.card);
    Object.values(CHARS).forEach((c, i) => {
      const b = el('button', 'char-card nav' + (c.id === this.sel.char ? ' is-sel' : ''));
      b.type = 'button';
      b.dataset.id = c.id;
      const cnv = el('canvas'); cnv.width = 48; cnv.height = 56;
      b.append(el('span', 'char-key', String(i + 1)), cnv, el('span', 'char-name', esc(c.name)), el('span', 'char-game', esc(c.game)));
      if (META.storyDone[c.id]) b.append(el('span', 'char-done', '★'));
      b.onfocus = b.onmouseenter = () => { if (this.sel.char !== c.id) this.pickChar(c.id); };
      b.onclick = () => { this.pickChar(c.id); this.confirmChar(); };
      grid.appendChild(b);
      this.anim.push({ card: true, cnv, draw: t => {
        const x = cnv.getContext('2d'); x.imageSmoothingEnabled = false;
        x.clearRect(0, 0, cnv.width, cnv.height);
        const sel = this.sel.char === c.id;
        let n = sel ? c.spr + '_w' + (Math.floor(t * 9) % 4) : c.spr + ((t + i * 0.7) % 3.3 < 0.12 ? '_bl' : Math.sin(t * 2.6 + i) > 0 ? '_i1' : '_i0');
        const s = SPR[n] || SPR[c.spr];
        const bob = sel ? 0 : (Math.sin(t * 3 + i) > 0.6 ? 1 : 0);
        x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(24, 52, 12, 3, 0, 0, TAU); x.fill();
        const k = c.id === 'v1' ? 1.25 : 1.5;
        x.drawImage(s.img, Math.round(24 - s.w * k / 2), Math.round(54 - s.h * k), s.w * k, s.h * k);
      } });
    });
    const pc = $('#char-portrait');
    this.anim = this.anim.filter(a => a.cnv !== pc);
    const parts = Array.from({ length: 26 }, () => ({ x: rnd(160), y: rnd(160), v: rnd(6, 16), s: Math.random() < 0.3 ? 2 : 1 }));
    this.anim.push({ cnv: pc, draw: (t, dt) => {
      const x = pc.getContext('2d'); x.imageSmoothingEnabled = false;
      const c = CHARS[this.sel.char];
      const [bg, pcol] = CHAR_BG[c.id];
      x.fillStyle = bg; x.fillRect(0, 0, 160, 160);
      if (TILES) { x.globalAlpha = 0.5; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) x.drawImage(TILES[HOME_WORLD[c.id]] || TILES.hk, i * 32, j * 32); x.globalAlpha = 1; }
      const g = x.createRadialGradient(80, 90, 10, 80, 90, 95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(6,3,12,.85)'); x.fillStyle = g; x.fillRect(0, 0, 160, 160);
      x.fillStyle = pcol;
      for (const p of parts) { p.y -= p.v * dt; if (p.y < 0) { p.y = 160; p.x = rnd(160); } x.globalAlpha = 0.6; x.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
      x.globalAlpha = 1;
      const picked = this.pickedT && t - this.pickedT < 0.6;
      const jump = picked ? Math.sin((t - this.pickedT) / 0.6 * Math.PI) * 18 : 0;
      const ph = Math.floor(t * 7) % 4;
      let n = c.spr + '_w' + ph;
      const s = SPR[n] || SPR[c.spr], sc = 4;
      x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(80, 140, 34 - jump * 0.8, 6, 0, 0, TAU); x.fill();
      if (c.id === 'madeline' && !(window.HERO_META && HERO_META.madeline)) { x.fillStyle = '#d1343a'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(80 - 14 - i * 10, 60 + i * 5 + Math.sin(t * 6 + i) * 2 - jump, 15 - i * 1.6, 0, TAU); x.fill(); } }
      if (c.id === 'v1' && V1REF.complete && V1REF.naturalWidth) {
        const k = 2, bob = Math.round(Math.sin(t * 2.5) * 2);
        if (picked) x.filter = 'brightness(3)';
        x.drawImage(V1REF, Math.round(80 - V1REF.naturalWidth * k / 2), Math.round(146 - V1REF.naturalHeight * k - jump + bob), V1REF.naturalWidth * k, V1REF.naturalHeight * k);
        x.filter = 'none';
      } else x.drawImage(picked ? s.white : s.img, Math.round(80 - s.w * sc / 2), Math.round(140 - s.h * sc - jump), s.w * sc, s.h * sc);
    } });
    this.pickChar(this.sel.char, true);
    $('#b-chars-next').textContent = this.mode === 'story' ? 'Scegli il capitolo →' : this.mode === 'endless' ? 'Scegli il mondo di partenza →' : 'Scegli la toppa →';
    $('#chars-title').textContent = (this.mode === 'story' ? 'Storia' : this.mode === 'endless' ? 'Endless' : 'Toppe classiche') + ': scegli chi ricucire';
    this.back = () => this.openModes();
    this.show('s-chars');
  },
  pickChar(id, silent) {
    this.sel.char = id;
    document.querySelectorAll('.char-card').forEach(b => { const on = b.dataset.id === id; b.classList.toggle('is-sel', on); if (on && !silent) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } });
    const c = CHARS[id], w = WEAPONS[c.start];
    $('#char-detail-body').innerHTML = `
      <div class="cd-head"><div><h2>${esc(c.name)}</h2><p class="muted">${esc(c.game)}${META.storyDone[c.id] ? ' · <span class="gold">Storia completata ★</span>' : ''}</p></div></div>
      <p>${esc(c.blurb)}</p>
      <dl class="facts">
        <dt>Vita</dt><dd>${esc(c.life)}</dd>
        <dt>Risorsa</dt><dd>${esc(c.resource)}</dd>
        <dt>Arma iniziale</dt><dd><img class="ico" alt="" src="${iconURL(w.icon[0], w.icon[1], w.icon[2], 2)}"> ${esc(w.name)}: ${esc(w.lines[0])}</dd>
        <dt>Abilità <kbd>SPAZIO</kbd></dt><dd><b>${esc(c.abilityName)}</b>: ${esc(c.abilityHint)}${c.id === 'v1' ? ' · <kbd>Q</kbd> cambia arma' : ''}</dd>
        <dt>Difficoltà</dt><dd>${'◆'.repeat(c.diff)}${'◇'.repeat(3 - c.diff)}</dd>
      </dl>`;
    const [who, text] = vary('sel' + id, SELECT_ALT[id]);
    $('#char-voice-name').textContent = (VOICES[who] || {}).name || '';
    this.say($('#char-voice'), who, text);
    if (!silent) sfx('ui');
  },
  confirmChar() {
    this.pickedT = performance.now() / 1000;
    sfx('evo');
    setTimeout(() => (this.mode === 'extra' ? this.openStages() : this.openStory()), 380);
  },

  // ------------------------------------------------------------------ STORIA
  openStory() {
    const list = $('#story-list');
    list.innerHTML = '';
    const endless = this.mode === 'endless';
    $('#story-title').textContent = endless ? 'Il Telaio Infinito' : 'La Scala dei Finali';
    $('#story-rule').textContent = endless ? 'scegli il mondo di partenza: poi i mondi si susseguono senza fine (boss ogni 5 minuti)' : 'ogni capitolo dura 20 minuti: mini-boss al 5\', intruso al 10\', mini-boss rinforzato al 15\', boss al 18\'';
    const party = this.partyOf();
    if (endless) {
      const b = el('button', 'quilt-patch nav');
      b.type = 'button'; b.style.setProperty('--i', 0);
      b.innerHTML = `<span class="thumb" style="background-image:url(${stageThumb('telaio')})"></span><span class="qp-body"><span class="st-num">Endless</span><span class="st-name">Mondo casuale</span><span class="st-tag">Il Telaio sceglie per te</span><span class="st-boss">Record: punto <b>${META.endlessBest || 0}</b></span></span>`;
      b.onclick = () => { sfx('ui'); startRun(party, pick(Object.keys(WORLDS).filter(k => k !== 'finale')), 'endless'); };
      list.appendChild(b);
    }
    (endless ? STORY.filter(ch => WORLDS[ch.id] && ch.id !== 'finale') : STORY).forEach((ch, i) => {
      const st = STAGES[ch.id];
      const beaten = META.beaten[ch.id];
      const b = el('button', 'quilt-patch nav' + (beaten ? ' done' : ''));
      b.type = 'button';
      b.style.setProperty('--i', i);
      const bossName = ETYPES[st.boss].name;
      b.innerHTML = `<span class="thumb" style="background-image:url(${stageThumb(ch.id)})"></span>
        <span class="qp-body"><span class="st-num">${esc(ch.chap)}${beaten ? ' · ✓ ricucito' : ''}</span>
        <span class="st-name">${esc(st.name)}</span>
        <span class="st-tag">${esc(st.game || '')}</span>
        <span class="st-boss">Boss: <b>${esc(bossName)}</b></span></span>`;
      b.onclick = () => { sfx('ui'); startRun(party, ch.id, endless ? 'endless' : 'story'); };
      list.appendChild(b);
    });
    $('#story-who').textContent = this.partyName();
    this.back = () => (this.players === 'coop' ? this.openLobby() : this.openChars());
    const firstOpen = STORY.find(ch => !META.beaten[ch.id]);
    this.show('s-story');
    if (firstOpen && !endless) setTimeout(() => list.children[STORY.indexOf(firstOpen)]?.focus(), 0);
  },

  // ------------------------------------------------------------------ TOPPE EXTRA
  openStages() {
    const list = $('#stage-list');
    list.innerHTML = '';
    let best = {};
    try { best = JSON.parse(localStorage.getItem('pe_best') || '{}'); } catch (e) { /* ignora */ }
    ['telaio', 'capolinea', 'pozzo'].map(id => STAGES[id]).forEach((s, i) => {
      const b = el('button', 'stage-card nav' + (s.id === this.sel.stage ? ' is-sel' : ''));
      b.type = 'button';
      const bt = best[this.sel.char + ':' + s.id];
      b.innerHTML = `<span class="thumb" style="background-image:url(${stageThumb(s.id)})"></span>
        <span class="st-body">
          <span class="st-num">Toppa ${i + 1}</span>
          <span class="st-name">${esc(s.name)}</span>
          <span class="st-tag">${esc(s.tagline)}</span>
          <span class="st-desc">${esc(s.desc)}</span>
          <span class="st-list">${s.hazards.map(h => '<span>• ' + esc(h) + '</span>').join('')}</span>
          <span class="st-boss">Boss: <b>${esc(ETYPES[s.boss].name)}</b>: ${esc(s.bossSub)}</span>
          ${bt ? `<span class="st-best">Completato con ${esc(CHARS[this.sel.char].name)} in ${fmtTime(bt)}</span>` : ''}
        </span>`;
      b.onfocus = () => { this.sel.stage = s.id; document.querySelectorAll('.stage-card').forEach(x => x.classList.toggle('is-sel', x === b)); };
      b.onclick = () => { this.sel.stage = s.id; sfx('ui'); startRun(this.partyOf(), s.id, 'extra'); };
      list.appendChild(b);
    });
    $('#stage-who').textContent = this.partyName();
    this.back = () => (this.players === 'coop' ? this.openLobby() : this.openChars());
    this.show('s-stages');
  },

  // ------------------------------------------------------------------ MERCERIA
  shopTab: 'pu',
  shopSel: 'might',
  openShop(tab) {
    if (tab) this.shopTab = tab;
    const grid = $('#shop-grid'), det = $('#shop-detail');
    grid.innerHTML = '';
    document.querySelectorAll('.shop-tab').forEach(b => b.classList.toggle('on', b.id === 'tab-' + this.shopTab));
    $('#tab-pu').onclick = () => { sfx('ui'); this.openShop('pu'); };
    $('#tab-ult').onclick = () => { sfx('ui'); this.openShop('ult'); };
    $('#tab-lore').onclick = () => { sfx('ui'); this.openShop('lore'); };
    $('#b-refund').hidden = this.shopTab !== 'pu';
    $('#b-refund').onclick = () => {
      const back = refundAll();
      sfx('ui');
      this.openShop();
      this.say($('#shop-voice'), 'ditale', back ? 'Rimborsati ' + back + ' Filo. Scuci pure, poi ricuci come preferisci.' : 'Non c\'è niente da rimborsare, tesoro.');
    };
    const sayBuy = () => this.say($('#shop-voice'), 'ditale', pick(['Ottima scelta! Te lo cucio subito.', 'Venduto! Niente resi… a parte il pulsante "Rimborsa tutto". Quello sì.', 'Ah, un intenditore. O una intenditrice. O un recipiente di Vuoto.', 'Un punto in più, un pericolo in meno.']));
    if (this.shopTab === 'pu') {
      for (const it of POWERUPS) {
        const lvl = powerLvl(it.id), max = lvl >= it.max;
        const b = el('button', 'pu-tile nav' + (max ? ' maxed' : '') + (this.shopSel === it.id ? ' is-sel' : ''));
        b.type = 'button'; b.dataset.id = it.id;
        b.innerHTML = `<img alt="" src="${puIconURL(it.id, 3)}"><span class="pu-n">${esc(it.name)}</span><span class="pips">${Array.from({ length: it.max }, (_, k) => `<i class="${k < lvl ? 'on' : ''}"></i>`).join('')}</span>`;
        const showDet = () => {
          this.shopSel = it.id;
          document.querySelectorAll('.pu-tile').forEach(x => x.classList.toggle('is-sel', x === b));
          const l = powerLvl(it.id), mx = l >= it.max, cost = powerCost(it, l);
          det.innerHTML = `<img alt="" src="${puIconURL(it.id, 4)}"><h3>${esc(it.name)}</h3><p>${esc(it.line)}</p><p class="sd-from">Livello ${l}/${it.max}</p><p class="sd-cost">${mx ? 'AL MASSIMO' : cost + ' Filo'}</p><button class="btn primary nav" type="button" id="b-buy" ${mx || META.thread < cost ? 'disabled' : ''}>${mx ? 'Completo' : META.thread < cost ? 'Filo insufficiente' : 'Compra'}</button>`;
          $('#b-buy').onclick = () => { if (buyPower(it)) { sfx('evo'); this.openShop(); const t = document.querySelector(`.pu-tile[data-id="${it.id}"]`); if (t) { t.classList.add('buy'); t.focus(); } sayBuy(); } };
        };
        b.onfocus = b.onmouseenter = showDet;
        b.onclick = () => { showDet(); if (buyPower(it)) { sfx('evo'); this.openShop(); const t = document.querySelector(`.pu-tile[data-id="${it.id}"]`); if (t) { t.classList.add('buy'); t.focus(); } sayBuy(); } else sfx('ui'); };
        grid.appendChild(b);
        if (this.shopSel === it.id) showDet();
      }
      if (!POWERUPS.some(it => it.id === this.shopSel)) { this.shopSel = 'might'; }
    } else if (this.shopTab === 'ult') {
      for (const id of Object.keys(CHARS)) {
        const U = ULTS[id], own = ultOwned(id);
        const b = el('button', 'pu-tile nav' + (own ? ' owned' : ' locked') + (this.shopSel === 'u:' + id ? ' is-sel' : ''));
        b.type = 'button'; b.dataset.id = 'u:' + id;
        const ic = SPR['ult_' + id] ? spriteURL('ult_' + id, 3) : spriteURL(CHARS[id].spr, 2);
        b.innerHTML = `<img alt="" src="${ic}"><span class="pu-n">${esc(U.name)}</span><span class="pu-n" style="color:var(--muted)">${esc(CHARS[id].name)}</span>`;
        const showDet = () => {
          this.shopSel = 'u:' + id;
          document.querySelectorAll('.pu-tile').forEach(x => x.classList.toggle('is-sel', x === b));
          det.innerHTML = `<img alt="" src="${SPR['ult_' + id] ? spriteURL('ult_' + id, 4) : spriteURL(CHARS[id].spr, 3)}"><h3 style="color:${U.col}">${esc(U.name)}</h3><p class="sd-from">${esc(CHARS[id].name)} · ${esc(U.from)}</p><p>${esc(U.desc)}</p><p class="sd-from">Si carica uccidendo, colpendo ed essendo colpiti. Si usa con <kbd>E</kbd> (pad: <kbd>Y</kbd>) quando l'anello del ritratto è pieno.</p><p class="sd-cost">${own ? 'GIÀ TUA' : ULT_COST + ' Filo'}</p><button class="btn primary nav" type="button" id="b-buy" ${own || META.thread < ULT_COST ? 'disabled' : ''}>${own ? 'Sbloccata' : META.thread < ULT_COST ? 'Filo insufficiente' : 'Compra'}</button>`;
          $('#b-buy').onclick = () => { if (buyUlt(id)) { sfx('evo'); this.openShop(); sayBuy(); } };
        };
        b.onfocus = b.onmouseenter = showDet;
        b.onclick = () => { showDet(); if (buyUlt(id)) { sfx('evo'); this.openShop(); const t = document.querySelector(`.pu-tile[data-id="u:${id}"]`); if (t) { t.classList.add('buy'); t.focus(); } sayBuy(); } else sfx('ui'); };
        grid.appendChild(b);
        if (this.shopSel === 'u:' + id) showDet();
      }
      if (!this.shopSel.startsWith('u:')) det.innerHTML = '<p class="muted">Ogni personaggio ha una mossa definitiva presa dal suo gioco. Scegline una per i dettagli.</p>';
    } else {
      const n = META.lore || 0;
      det.innerHTML = `<h3>Memorie del Telaio</h3><p>${n}/${LORE.length} recuperate.</p><p class="sd-from">Si sbloccano battendo i boss nella modalità Endless: una per ogni mondo ricucito.</p>`;
      const box = el('div', 'lore-list');
      LORE.forEach((l, i) => box.appendChild(el('p', 'lore-item' + (i < n ? '' : ' locked'), i < n ? `<b>${esc(VOICES[l[0]].name)}:</b> ${esc(l[1].replace('{nome}', 'viandante'))}` : 'Memoria ' + (i + 1) + ' — ancora cucita nel Telaio…')));
      grid.appendChild(box);
    }
    $('#shop-thread').textContent = META.thread;
    const sp = $('#shop-portrait');
    if (!this.anim.some(a => a.cnv === sp)) this.anim.push({ cnv: sp, draw: t => {
      const x = sp.getContext('2d'); x.imageSmoothingEnabled = false;
      x.fillStyle = '#2a1f2e'; x.fillRect(0, 0, 96, 96);
      const s = SPR.ditale, bob = Math.sin(t * 2.5) > 0.5 ? 1 : 0;
      x.drawImage(s.img, 48 - s.w * 3, 90 - s.h * 6 + bob, s.w * 6, s.h * 6);
    } });
    if (!this.voice.el || this.voice.el.id !== 'shop-voice' || this.voice.shown >= this.voice.text.length) this.say($('#shop-voice'), 'ditale', pick(DITALE_QUIPS));
    this.back = () => this.openTitle();
    if (this.current !== 's-shop') this.show('s-shop', '.shop-tab.on');
  },

  // ------------------------------------------------------------------ COMANDI / OPZIONI
  openControls(from) {
    const rows = Object.values(CHARS).map(c => `<tr><td><img class="ico" alt="" src="${spriteURL(c.spr, 2)}"> ${esc(c.name)}</td><td><b>${esc(c.abilityName)}</b></td><td>${esc(c.abilityHint)}${c.id === 'v1' ? ' · Q: cambia arma' : ''}</td></tr>`).join('');
    $('#ability-table').innerHTML = rows;
    this.back = () => (from === 's-pause' ? this.openPause() : this.openTitle());
    $('#b-controls-back').onclick = () => this.back();
    this.show('s-controls');
  },
  openOptions(from) {
    const f = $('#opt-form');
    f.vol.value = Math.round(SET.vol * 100);
    f.shake.checked = SET.shake; f.dmg.checked = SET.dmgNums; f.auto.checked = SET.autoAbility; f.assist.checked = SET.assist;
    f.speed.value = Math.round(SET.speed * 100);
    $('#opt-speed-v').textContent = f.speed.value + '%';
    $('#opt-vol-v').textContent = f.vol.value + '%';
    f.oninput = () => {
      SET.vol = f.vol.value / 100; SET.shake = f.shake.checked; SET.dmgNums = f.dmg.checked; SET.autoAbility = f.auto.checked; SET.assist = f.assist.checked; SET.speed = f.speed.value / 100;
      $('#opt-speed-v').textContent = f.speed.value + '%';
      $('#opt-vol-v').textContent = f.vol.value + '%';
      saveSettings();
    };
    f.onsubmit = e => e.preventDefault();
    this.back = () => (from === 's-pause' ? this.openPause() : this.openTitle());
    $('#b-options-back').onclick = () => this.back();
    this.show('s-options');
  },

  // ------------------------------------------------------------------ LEVEL-UP
  openLevelUp() {
    MODE = 'levelup';
    if (!G.lvQueue.length) { G.pendingLv--; G.lvQueue = alivePls().slice(); }
    const pl = G.lvQueue.shift();
    usePl(pl); this.lvPl = pl;
    sfx('lvl');
    fxRing(G.p.x, G.p.y, 4, 60, coop() ? pl.col : '#ffd23f', 0.5, 3);
    this.levelOpts = buildOptions(3);
    this.renderLevelUp();
    this.back = null;
    this.show('s-levelup');
  },
  renderLevelUp() {
    const opts = this.levelOpts;
    const c = G.char;
    $('#lv-title').innerHTML = 'LIVELLO ' + G.level + (coop() ? `<span class="lv-who" style="color:${this.lvPl.col}">${esc(this.lvPl.label)} · ${esc(c.name)} sceglie</span>` : '');
    const boon = opts.find(o => o.kind === 'boon');
    const sub = c.scrolls && opts[0]?.kind === 'scroll' ? 'Scegli una Pergamena del Potere' : c.id === 'isaac' ? 'Scegli un piedistallo' : c.id === 'zagreus' && boon ? 'Un dono dall\'Olimpo' : 'Scegli una toppa da cucire';
    $('#lv-sub').textContent = sub;
    const god = $('#lv-god');
    if (boon) { god.hidden = false; god.style.setProperty('--god', boon.godCol); god.innerHTML = `<b>${esc(GODS[boon.god].name)}:</b> «${esc(boon.godQuote)}»`; voiceBlips('zagreus', boon.godQuote, 10); }
    else god.hidden = true;
    const row = $('#lv-cards');
    row.innerHTML = '';
    opts.forEach((o, i) => {
      const relic = o.kind === 'passive' && PASSIVES[o.id]?.relic;
      const b = el('button', 'lv-card nav kind-' + o.kind + (o.group ? ' grp-' + o.group : '') + (c.id === 'isaac' ? ' pedestal' : '') + (relic ? ' relic' : '') + (o.evo ? ' evo' : ''));
      b.type = 'button';
      b.style.animationDelay = (i * 0.07) + 's';
      if (o.godCol) b.style.setProperty('--god', o.godCol);
      const pips = o.max && o.max > 1 && o.max < 99 ? `<span class="pips">${Array.from({ length: o.max }, (_, k) => `<i class="${k < o.lvl ? 'on' : k === o.lvl ? 'next' : ''}"></i>`).join('')}</span>` : '';
      b.innerHTML = `<span class="lv-key">${i + 1}</span>
        <span class="lv-tag">${esc(o.tag || (o.kind === 'scroll' ? 'PERGAMENA' : ''))}</span>
        <img alt="" src="${iconURL(o.icon[0], o.icon[1], o.icon[2], 5)}">
        <span class="lv-name">${esc(o.name)}</span>
        ${pips}
        <span class="lv-line">${esc(o.line)}</span>
        ${o.syn && o.syn.length ? `<span class="lv-syn">⟿ ${o.syn.map(esc).join(' · ')}</span>` : ''}
        ${o.evo ? '<span class="lv-evo">★ RICUCITURA PRONTA</span>' : ''}
        ${o.warn ? `<span class="lv-warn">${esc(o.warn)}</span>` : ''}`;
      b.onclick = () => this.choose(i);
      b.onfocus = b.onmouseenter = () => this.previewMap(o);
      row.appendChild(b);
    });
    $('#b-reroll').textContent = (c.id === 'isaac' ? 'D6 · Ritira' : 'Ritira') + ' (' + G.rerolls + ')  [R]';
    $('#b-reroll').disabled = G.rerolls <= 0;
    $('#b-reroll').onclick = () => this.reroll();
    $('#b-skip').onclick = () => this.skip();
    this.previewMap(opts[0]);
  },
  previewMap(o) {
    const box = $('#lv-map');
    const list = G.weapons.map(w => {
      const d = WEAPONS[w.id];
      const col = d.tiers ? TIERS[w.lvl - 1].c : d.icon[1];
      const hl = o && o.id === w.id ? ' hl' : '';
      return `<li class="${hl}"><img alt="" src="${iconURL(d.icon[0], w.evo ? '#ffd23f' : col, d.icon[2], 2)}"> ${esc(weaponName(w))} <span class="muted">lv ${w.lvl}</span></li>`;
    }).join('');
    const syns = SYN.filter(s => s.char === G.char.id || s.char === '*').map(s => {
      const on = owned(s.a) && owned(s.b);
      const would = o && !on && ((s.a === o.id && owned(s.b)) || (s.b === o.id && owned(s.a)) || (o.kind === 'boon' && ((s.a === 'boon:' + o.god && owned(s.b)) || (s.b === 'boon:' + o.god && owned(s.a)))));
      if (!on && !would) return '';
      return `<li class="${would ? 'new' : 'on'}"><span class="thread" style="--c:${synColor(s.name)}"></span>${esc(s.name)}${would ? ' <b>NUOVA</b>' : ''}</li>`;
    }).join('');
    box.innerHTML = `<h3>Mappa delle Trame</h3><ul class="map-w">${list || '<li class="muted">Nessuna arma</li>'}</ul><h4>Sinergie</h4><ul class="map-s">${syns || '<li class="muted">Nessuna ancora: guarda le righe ⟿ sulle toppe</li>'}</ul>`;
  },
  choose(i) {
    const o = this.levelOpts[i];
    if (!o) return;
    const card = document.querySelectorAll('.lv-card')[i];
    if (card) card.classList.add('chosen');
    applyOption(o);
    sfx('evo');
    fxRing(G.p.x, G.p.y, 4, 34, o.godCol || '#e2b04a', 0.4, 2);
    G.p.castT = 0.4; G.p.castCol = o.godCol || '#ffd23f';
    if (Math.random() < 0.45) bark('lvl');
    setTimeout(() => this.afterLevel(), 160);
  },
  afterLevel() {
    if (!G) return;
    if (G.lvQueue.length || G.pendingLv > 0) { this.openLevelUp(); return; }
    usePl(leadPl());
    this.hideAll();
    MODE = 'play';
  },
  reroll() { if (G.rerolls <= 0) return; G.rerolls--; sfx('ui'); this.levelOpts = buildOptions(3); this.renderLevelUp(); const f = document.querySelector('.lv-card'); f && f.focus(); },
  skip() { G.thread += 10; this.afterLevel(); },

  // ------------------------------------------------------------------ SCELTE (doni, reliquie)
  openChoice(title, sub, opts) {
    MODE = 'choice';
    $('#ch-title').textContent = title;
    $('#ch-sub').textContent = sub;
    const row = $('#ch-cards');
    row.innerHTML = '';
    opts.forEach((o, i) => {
      const b = el('button', 'lv-card nav relic');
      b.type = 'button';
      b.style.animationDelay = (i * 0.07) + 's';
      b.innerHTML = `<span class="lv-key">${i + 1}</span><img alt="" src="${iconURL(o.icon[0], o.icon[1], o.icon[2], 5)}"><span class="lv-name">${esc(o.name)}</span><span class="lv-line">${esc(o.line)}</span>`;
      b.onclick = () => { o.act(); sfx('evo'); this.hideAll(); MODE = 'play'; if (G) usePl(leadPl()); };
      row.appendChild(b);
    });
    this.back = null;
    this.show('s-choice');
  },

  // ------------------------------------------------------------------ PAUSA
  openPause() {
    if (MODE === 'play') MODE = 'pause';
    $('#pause-map').innerHTML = coop() ? G.players.map(pl => withPl(pl, () => `<div class="tm-pl" style="--pc:${pl.col}"><h3 style="color:${pl.col};font-size:13px;grid-column:1/-1">${esc(pl.label)} · ${esc(pl.char.name)}${pl.down ? ' · A TERRA' : ''}</h3>${threadMapHTML()}</div>`)).join('') : threadMapHTML();
    $('#pause-tip').textContent = pick(TIPS);
    $('#b-resume').onclick = () => this.resume();
    $('#b-p-controls').onclick = () => this.openControls('s-pause');
    $('#b-p-options').onclick = () => this.openOptions('s-pause');
    $('#b-quit').onclick = () => { G = null; MODE = 'menu'; this.openTitle(); };
    this.back = () => this.resume();
    this.show('s-pause');
  },
  resume() { this.hideAll(); MODE = 'play'; },

  // ------------------------------------------------------------------ SCONTRINO DI FINE RUN
  showEnd() {
    const c = G.char;
    const win = G.win;
    const lines = {
      knight: ['[Il Cavaliere rinfodera l\'Aculeo.]', '[La maschera si incrina. Da qualche parte, un\'Ombra aspetta.]'],
      v1: ['> MISSIONE COMPLETATA. SANGUE RACCOLTO: SUFFICIENTE.', '> UNITÀ DISTRUTTA. RIATTIVAZIONE IN CORSO.'],
      zagreus: ['Beh. Il panorama era nuovo, almeno. Papà sarà furioso.', 'Di nuovo lo Stige. Ciao, Ipno. No, non voglio parlarne.'],
      madeline: ['…L\'ho fatto. L\'ho fatto davvero!', '…Di nuovo. Ok. Una volta ancora.'],
      prisoner: ['[Il Prigioniero si inchina. È palesemente sarcastico.]', '[Le cellule scivolano via in un tubo. Si ricomincia.]'],
      penitent: ['«Anche questa terra cucita ha conosciuto la tua penitenza.» Deogracias', '«Anche la caduta è preghiera, se ci si rialza.» Deogracias'],
      terrarian: ['La Guida: «Fantastico! Ora che ne dici di costruire una casa qui?»', 'La Guida: «Hai provato a costruire una casa? Le case risolvono quasi tutto.»'],
      isaac: ['…e Isaac, per una volta, smise di piangere.', '*singhiozza*'],
    }[c.id];
    if (END_ALT[c.id]) { lines[0] = vary('ew' + c.id, END_ALT[c.id].win); lines[1] = vary('el' + c.id, END_ALT[c.id].lose); }
    const reason = G.reason === 'continue' ? 'IL CONTINUE è arrivato a zero.' : G.reason === 'panic' ? 'L\'attacco di panico ha avuto la meglio.' : '';
    $('#end-title').textContent = G.mode === 'endless' ? 'IL TELAIO SI FERMA · PUNTO ' + G.loop : win ? (G.stage.id === 'finale' && G.mode === 'story' ? 'LA COPERTA È SCUCITA' : 'TOPPA RICUCITA') : 'GAME OVER';
    $('#end-title').className = win ? 'win' : 'lose';
    $('#end-quote').textContent = win ? lines[0] : lines[1];
    $('#end-reason').textContent = reason;
    const row = (a, b, cls = '') => `<div class="rc-row ${cls}"><span>${a}</span><span>${b}</span></div>`;
    const kills = G.kills, straw = G.straw, thread = Math.floor(G.thread);
    $('#end-receipt').innerHTML = `
      <div class="rc-head">MERCERIA DEL MULTIVERSO<br><small>di Sor Ditale · P.IVA 00000000001</small></div>
      ${row(G.players.length > 1 ? 'Clienti' : 'Cliente', esc(G.players.map(pl => pl.char.name).join(', ')))}${row(G.mode === 'endless' ? 'Ultimo mondo' : 'Toppa', esc(G.stage.name))}${row('Durata', fmtTime(G.t))}${G.mode === 'endless' ? row('Punti del Telaio', G.loop) + row('Memorie', (META.lore || 0) + '/' + LORE.length) : ''}
      <div class="rc-sep"></div>
      ${row('Uccisioni × ' + kills, (kills * 0.01).toFixed(2) + ' F')}
      ${row('Livello raggiunto', G.level)}
      ${row('Danno inflitto', Math.round(G.dmgDealt).toLocaleString('it-IT'))}
      ${G.players.length > 1 ? G.players.map(pl => row(`<b style="color:${pl.col}">${pl.label}</b> ${esc(pl.char.name)}`, pl.kills + ' ucc. · ' + Math.round(pl.dmg).toLocaleString('it-IT') + ' dmg')).join('') : G.weapons.map(w => row('&nbsp;&nbsp;' + esc(weaponName(w)) + ' lv ' + w.lvl, w.evo ? '★' : '')).join('')}
      ${row('Fragole × ' + straw, '0,00 F', 'muted')}
      ${row('IVA del Multiverso (22%)', 'inclusa')}
      <div class="rc-sep"></div>
      ${row('<b>TOTALE FILO</b>', '<b>' + thread + ' F</b>')}
      ${row('Filo in Merceria', META.thread + ' F', 'muted')}
      <div class="rc-foot">Grazie e arrivederci!<br>Non si accettano resi. Né strappi.</div>`;
    const idx = STORY.findIndex(x => x.id === G.stage.id);
    const party = G.players.map(pl => ({ char: pl.char.id, dev: pl.dev }));
    const nextStory = G.mode === 'story' && win && idx >= 0 && STORY[idx + 1];
    const extraIds = ['telaio', 'capolinea', 'pozzo'];
    const nextExtra = G.mode !== 'story' && win && extraIds[extraIds.indexOf(G.stage.id) + 1];
    const next = nextStory ? nextStory.id : nextExtra;
    $('#b-next').hidden = !next;
    $('#b-next').textContent = nextStory ? nextStory.chap + ' →' : 'Prossima toppa →';
    $('#b-next').onclick = () => startRun(party, next, G.mode);
    $('#b-retry').onclick = () => startRun(party, G.mode === 'endless' ? G.order8[0] : G.stage.id, G.mode);
    $('#b-change').onclick = () => { const m = G.mode; G = null; MODE = 'menu'; this.mode = m; if (this.players === 'coop') { this.lobby.forEach(x => { x.ready = false; }); this.openLobby(); } else this.openChars(); };
    $('#b-menu').onclick = () => { G = null; MODE = 'menu'; this.openTitle(); };
    this.back = null;
    this.show('s-end', next ? '#b-next' : '#b-retry');
  },
};

function threadMapHTML() {
  const c = G.char;
  const ws = G.weapons.map(w => { const d = WEAPONS[w.id]; return `<li><img alt="" src="${iconURL(d.icon[0], w.evo ? '#ffd23f' : (d.tiers ? TIERS[w.lvl - 1].c : d.icon[1]), d.icon[2], 2)}"> ${esc(weaponName(w))} <span class="muted">lv ${w.lvl}/${d.max}</span>${d.slot && G.boons[d.slot] ? ` <span style="color:${GODS[G.boons[d.slot].god].col}">· ${esc(BOON_NAMES[G.boons[d.slot].god][d.slot])}</span>` : ''}</li>`; }).join('');
  const ps = [...G.passives, ...G.charms].map(p => { const d = PASSIVES[p.id]; return `<li><img alt="" src="${iconURL(d.icon[0], d.icon[1], d.icon[2], 2)}"> ${esc(d.name)} ${d.relic ? '<span class="gold">· reliquia</span>' : ''}${d.max > 1 && d.max < 99 ? `<span class="muted">lv ${p.lvl}</span>` : ''}</li>`; }).join('');
  const syn = SYN.filter(s => s.char === c.id || s.char === '*').map(s => {
    const a = owned(s.a), b = owned(s.b);
    const st = a && b ? 'on' : (a || b) ? 'half' : 'off';
    const name = st === 'off' ? '???' : esc(s.name);
    const need = st === 'half' ? ' · manca: ' + esc(itemName(a ? s.b : s.a)) : '';
    return `<li class="${st}"><span class="thread" style="--c:${synColor(s.name)}"></span>${name}<span class="muted">${st === 'off' ? '' : ' · ' + esc(s.desc) + need}</span></li>`;
  }).join('');
  const evo = EVOS.filter(r => r.char === c.id).map(r => {
    const w = getW(r.w);
    const done = w && w.evo;
    const parts = [itemName(r.w) + ' lv max', ...r.req.map(itemName)];
    const have = [w && w.lvl >= WEAPONS[r.w].max, ...r.req.map(owned)];
    return `<li class="${done ? 'on' : ''}">★ <b>${esc(r.into)}</b> = ${parts.map((p, i) => `<span class="${have[i] ? 'ok' : 'no'}">${esc(p)}</span>`).join(' + ')} + Strappo${done ? ' <b>✓</b>' : ''}</li>`;
  }).join('');
  return `<div class="tm-col"><h4>Armi</h4><ul>${ws}</ul><h4>Passivi e reliquie</h4><ul>${ps || '<li class="muted">Nessuno</li>'}</ul></div>
    <div class="tm-col"><h4>Sinergie</h4><ul class="map-s">${syn}</ul><h4>Ricuciture</h4><ul class="map-e">${evo}</ul></div>`;
}

const THUMB = {}, WTHUMB = {};
function stageThumb(id) {
  if (THUMB[id]) return THUMB[id];
  const c = makeCanvas(96, 54), x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  const st = STAGES[id];
  if (id === 'telaio') {
    const kinds = ['hk', 'hades', 'celeste', 'terra', 'blas'];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) x.drawImage(TILES[kinds[(i * 2 + j) % 5]], i * 32, j * 32);
    x.strokeStyle = '#e2b04a'; x.setLineDash([2, 2]); x.beginPath(); x.moveTo(32.5, 0); x.lineTo(32.5, 54); x.moveTo(64.5, 0); x.lineTo(64.5, 54); x.moveTo(0, 32.5); x.lineTo(96, 32.5); x.stroke();
  } else if (id === 'capolinea') {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) x.drawImage(TILES.station, i * 32, j * 32);
    x.fillStyle = '#3a3a3a'; x.fillRect(0, 20, 96, 16); x.fillStyle = '#9aa4b8'; x.fillRect(0, 24, 96, 1); x.fillRect(0, 31, 96, 1);
    x.fillStyle = '#f2c230'; for (let i = 0; i < 96; i += 6) { x.fillRect(i, 17, 3, 2); x.fillRect(i, 37, 3, 2); }
  } else if (id === 'pozzo') {
    x.fillStyle = '#07060a'; x.fillRect(0, 0, 96, 54);
    for (let r = 60; r > 0; r -= 8) { x.fillStyle = (r / 8) % 2 ? '#4a423a' : '#3c342e'; x.beginPath(); x.arc(48, 27, r, 0, TAU); x.fill(); }
    x.strokeStyle = '#8c6a2f'; x.beginPath(); x.arc(48, 27, 60, 0, TAU); x.stroke();
  } else if (st && st.world) {
    const d = st.world;
    const tiles = d.tiles.map((t, i) => paintTile(t, i));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) x.drawImage(tiles[(i + j) % tiles.length], i * 32, j * 32);
    const props = d.props;
    for (let k = 0; k < 4; k++) { const pr = props[k % props.length]; const s = SPR[pr.spr]; x.drawImage(s.img, 10 + k * 22, 40 - s.h); }
    const boss = BOSSES[d.boss];
    x.fillStyle = 'rgba(6,3,12,' + (d.dark * 0.6) + ')'; x.fillRect(0, 0, 96, 54);
    if (boss) { const sx = camX, sy = camY; camX = 0; camY = 0; try { boss.draw(x, { x: 0, y: 0, r: boss.r, t: 0, flash: 0, face: -1, def: boss }, 70, 30); } catch (e) { /* miniatura senza boss */ } camX = sx; camY = sy; }
  }
  return (THUMB[id] = c.toDataURL());
}

// --- Navigazione tastiera/gamepad nei menu -------------------------------------------------
function navMove(dx, dy) {
  const scr = UI.current && $('#' + UI.current);
  if (!scr) return;
  const items = [...scr.querySelectorAll('.nav, input, select')].filter(n => !n.disabled && n.offsetParent !== null);
  if (!items.length) return;
  const cur = document.activeElement && items.includes(document.activeElement) ? document.activeElement : null;
  if (!cur) { items[0].focus(); return; }
  const r0 = cur.getBoundingClientRect();
  const c0 = [r0.left + r0.width / 2, r0.top + r0.height / 2];
  let best = null, bs = Infinity;
  for (const n of items) {
    if (n === cur) continue;
    const r = n.getBoundingClientRect();
    const v = [r.left + r.width / 2 - c0[0], r.top + r.height / 2 - c0[1]];
    const along = v[0] * dx + v[1] * dy;
    if (along <= 4) continue;
    const across = Math.abs(v[0] * dy - v[1] * dx);
    const score = along + across * 2.5;
    if (score < bs) { bs = score; best = n; }
  }
  if (best) { best.focus(); sfx('ui'); }
}

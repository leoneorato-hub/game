'use strict';
// =============================================================================
// UI — menu, selezione, level-up, pausa, rendiconto. Navigabile con mouse,
// tastiera (frecce + INVIO, ESC per tornare), gamepad e touch.
// =============================================================================

const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

const UI = {
  current: null,
  sel: { char: 'knight', stage: 'telaio' },
  levelOpts: [],
  back: null,

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

  // ------------------------------------------------------------------ TITOLO
  initTitle() {
    $('#b-play').onclick = () => { sfx('ui'); this.openChars(); };
    $('#b-controls').onclick = () => { sfx('ui'); this.openControls('s-title'); };
    $('#b-options').onclick = () => { sfx('ui'); this.openOptions('s-title'); };
  },

  // ------------------------------------------------------------------ PERSONAGGI
  openChars() {
    const grid = $('#char-grid');
    grid.innerHTML = '';
    Object.values(CHARS).forEach((c, i) => {
      const b = el('button', 'char-card nav' + (c.id === this.sel.char ? ' is-sel' : ''));
      b.type = 'button';
      b.innerHTML = `<span class="char-key">${i + 1}</span><img alt="" src="${spriteURL(c.spr, 4)}"><span class="char-name">${esc(c.name)}</span><span class="char-game">${esc(c.game)}</span>`;
      b.onfocus = b.onmouseenter = () => this.pickChar(c.id);
      b.onclick = () => { this.pickChar(c.id); sfx('ui'); this.openStages(); };
      b.dataset.id = c.id;
      grid.appendChild(b);
    });
    this.pickChar(this.sel.char);
    this.back = () => this.show('s-title');
    this.show('s-chars');
  },
  pickChar(id) {
    this.sel.char = id;
    document.querySelectorAll('.char-card').forEach(b => b.classList.toggle('is-sel', b.dataset.id === id));
    const c = CHARS[id], w = WEAPONS[c.start];
    $('#char-detail').innerHTML = `
      <div class="cd-head"><img alt="" src="${spriteURL(c.spr, 6)}"><div><h2>${esc(c.name)}</h2><p class="muted">${esc(c.game)}</p></div></div>
      <blockquote>${esc(c.quote)}</blockquote>
      <p>${esc(c.blurb)}</p>
      <dl class="facts">
        <dt>Vita</dt><dd>${esc(c.life)}</dd>
        <dt>Risorsa</dt><dd>${esc(c.resource)}</dd>
        <dt>Arma iniziale</dt><dd><img class="ico" alt="" src="${iconURL(w.icon[0], w.icon[1], w.icon[2], 2)}"> ${esc(w.name)} — ${esc(w.lines[0])}</dd>
        <dt>Abilità <kbd>SPAZIO</kbd></dt><dd><b>${esc(c.abilityName)}</b> — ${esc(c.abilityHint)}</dd>
        <dt>Difficoltà</dt><dd>${'◆'.repeat(c.diff)}${'◇'.repeat(3 - c.diff)}</dd>
        <dt>Voce</dt><dd class="muted">${esc(c.voice)}</dd>
      </dl>`;
  },

  // ------------------------------------------------------------------ STAGE
  openStages() {
    const list = $('#stage-list');
    list.innerHTML = '';
    let best = {};
    try { best = JSON.parse(localStorage.getItem('pe_best') || '{}'); } catch (e) { /* ignora */ }
    Object.values(STAGES).forEach((s, i) => {
      const b = el('button', 'stage-card nav' + (s.id === this.sel.stage ? ' is-sel' : ''));
      b.type = 'button';
      const bt = best[this.sel.char + ':' + s.id];
      b.innerHTML = `<span class="thumb" style="background-image:url(${stageThumb(s.id)})"></span>
        <span class="st-body">
          <span class="st-num">Stage ${i + 1}</span>
          <span class="st-name">${esc(s.name)}</span>
          <span class="st-tag">${esc(s.tagline)}</span>
          <span class="st-desc">${esc(s.desc)}</span>
          <span class="st-list">${s.hazards.map(h => '<span>• ' + esc(h) + '</span>').join('')}</span>
          <span class="st-boss">Boss: <b>${esc(ETYPES[s.boss].name)}</b> — ${esc(s.bossSub)}</span>
          ${bt ? `<span class="st-best">Completato con ${esc(CHARS[this.sel.char].name)} in ${fmtTime(bt)}</span>` : ''}
        </span>`;
      b.onfocus = () => { this.sel.stage = s.id; document.querySelectorAll('.stage-card').forEach(x => x.classList.toggle('is-sel', x === b)); };
      b.onclick = () => { this.sel.stage = s.id; sfx('ui'); startRun(this.sel.char, s.id); };
      list.appendChild(b);
    });
    $('#stage-who').textContent = CHARS[this.sel.char].name;
    this.back = () => this.openChars();
    this.show('s-stages');
  },

  // ------------------------------------------------------------------ COMANDI / OPZIONI
  openControls(from) {
    const rows = Object.values(CHARS).map(c => `<tr><td><img class="ico" alt="" src="${spriteURL(c.spr, 2)}"> ${esc(c.name)}</td><td><b>${esc(c.abilityName)}</b></td><td>${esc(c.abilityHint)}</td></tr>`).join('');
    $('#ability-table').innerHTML = rows;
    this.back = () => (from === 's-pause' ? this.openPause() : this.show(from));
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
    this.back = () => (from === 's-pause' ? this.openPause() : this.show(from));
    $('#b-options-back').onclick = () => this.back();
    this.show('s-options');
  },

  // ------------------------------------------------------------------ LEVEL-UP
  openLevelUp() {
    MODE = 'levelup';
    sfx('lvl');
    this.levelOpts = buildOptions(G.char.id === 'isaac' ? 3 : 3);
    this.renderLevelUp();
    this.back = null;
    this.show('s-levelup');
  },
  renderLevelUp() {
    const opts = this.levelOpts;
    const c = G.char;
    $('#lv-title').textContent = 'LIVELLO ' + G.level;
    const boon = opts.find(o => o.kind === 'boon');
    const sub = c.scrolls && opts[0]?.kind === 'scroll' ? 'Scegli una Pergamena del Potere' : c.id === 'isaac' ? 'Scegli un piedistallo' : c.id === 'zagreus' && boon ? 'Un dono dall\'Olimpo' : 'Scegli una toppa da cucire';
    $('#lv-sub').textContent = sub;
    const god = $('#lv-god');
    if (boon) { god.hidden = false; god.style.setProperty('--god', boon.godCol); god.innerHTML = `<b>${esc(GODS[boon.god].name)}:</b> «${esc(boon.godQuote)}»`; }
    else god.hidden = true;
    const row = $('#lv-cards');
    row.innerHTML = '';
    opts.forEach((o, i) => {
      const b = el('button', 'lv-card nav kind-' + o.kind + (c.id === 'isaac' ? ' pedestal' : ''));
      b.type = 'button';
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
    const syns = SYN.filter(s => s.char === G.char.id).map(s => {
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
    applyOption(o);
    G.pendingLv--;
    sfx('evo');
    fxRing(G.p.x, G.p.y, 4, 34, o.godCol || '#e2b04a', 0.4, 2);
    if (G.pendingLv > 0) { this.openLevelUp(); return; }
    this.hideAll();
    MODE = 'play';
  },
  reroll() { if (G.rerolls <= 0) return; G.rerolls--; sfx('ui'); this.levelOpts = buildOptions(3); this.renderLevelUp(); const f = document.querySelector('.lv-card'); f && f.focus(); },
  skip() { G.pendingLv--; G.thread += 10; if (G.pendingLv > 0) { this.openLevelUp(); return; } this.hideAll(); MODE = 'play'; },

  // ------------------------------------------------------------------ PAUSA
  openPause() {
    if (MODE === 'play') MODE = 'pause';
    $('#pause-map').innerHTML = threadMapHTML();
    $('#b-resume').onclick = () => this.resume();
    $('#b-p-controls').onclick = () => this.openControls('s-pause');
    $('#b-p-options').onclick = () => this.openOptions('s-pause');
    $('#b-quit').onclick = () => { G = null; MODE = 'menu'; this.show('s-title'); };
    this.back = () => this.resume();
    this.show('s-pause');
  },
  resume() { this.hideAll(); MODE = 'play'; },

  // ------------------------------------------------------------------ RENDICONTO
  showEnd() {
    const c = G.char;
    const win = G.win;
    const lines = {
      knight: ['…', '…'],
      v1: ['MISSIONE COMPLETATA. SANGUE RACCOLTO: SUFFICIENTE.', 'UNITÀ DISTRUTTA. RIATTIVAZIONE IN CORSO.'],
      zagreus: ['Beh. Il panorama era nuovo, almeno. Papà sarà furioso.', 'Di nuovo lo Stige. Ciao, Ipno. No, non voglio parlarne.'],
      madeline: ['…L\'ho fatto. L\'ho fatto davvero!', '…Di nuovo. Ok. Una volta ancora.'],
      prisoner: ['[Il Prigioniero si inchina. È palesemente sarcastico.]', '[Le cellule scivolano via in un tubo. Si ricomincia.]'],
      penitent: ['«Anche questa terra cucita ha conosciuto la tua penitenza.» — Deogracias', '«Anche la caduta è preghiera, se ci si rialza.» — Deogracias'],
      terrarian: ['La Guida: «Fantastico! Ora che ne dici di costruire una casa qui?»', 'La Guida: «Hai provato a costruire una casa? Le case risolvono quasi tutto.»'],
      isaac: ['…e Isaac, per una volta, smise di piangere.', '*singhiozza*'],
    }[c.id];
    const reason = G.reason === 'continue' ? 'IL CONTINUE è arrivato a zero.' : G.reason === 'panic' ? 'L\'attacco di panico ha avuto la meglio.' : '';
    try { const tot = +(localStorage.getItem('pe_thread') || 0) + Math.floor(G.thread); localStorage.setItem('pe_thread', String(tot)); } catch (e) { /* ignora */ }
    $('#end-title').textContent = win ? 'STAGE COMPLETATO' : 'GAME OVER';
    $('#end-title').className = win ? 'win' : 'lose';
    $('#end-quote').textContent = win ? lines[0] : lines[1];
    $('#end-reason').textContent = reason;
    $('#end-stats').innerHTML = `
      <dt>Personaggio</dt><dd>${esc(c.name)}</dd><dt>Stage</dt><dd>${esc(G.stage.name)}</dd>
      <dt>Tempo</dt><dd>${fmtTime(G.t)}</dd><dt>Livello</dt><dd>${G.level}</dd>
      <dt>Uccisioni</dt><dd>${G.kills}</dd><dt>Danno inflitto</dt><dd>${Math.round(G.dmgDealt).toLocaleString('it-IT')}</dd>
      <dt>Fragole</dt><dd>${G.straw} <span class="muted">(non servono a nulla)</span></dd><dt>Filo raccolto</dt><dd>${Math.floor(G.thread)}</dd>`;
    $('#end-weapons').innerHTML = G.weapons.map(w => { const d = WEAPONS[w.id]; return `<li><img alt="" src="${iconURL(d.icon[0], w.evo ? '#ffd23f' : (d.tiers ? TIERS[w.lvl - 1].c : d.icon[1]), d.icon[2], 2)}"> ${esc(weaponName(w))} <span class="muted">lv ${w.lvl}</span></li>`; }).join('');
    const ids = Object.keys(STAGES);
    const nextId = ids[ids.indexOf(G.stage.id) + 1];
    $('#b-next').hidden = !(win && nextId);
    $('#b-next').onclick = () => startRun(c.id, nextId);
    $('#b-retry').onclick = () => startRun(c.id, G.stage.id);
    $('#b-change').onclick = () => { G = null; MODE = 'menu'; this.openChars(); };
    $('#b-menu').onclick = () => { G = null; MODE = 'menu'; this.show('s-title'); };
    this.back = null;
    this.show('s-end', win && nextId ? '#b-next' : '#b-retry');
  },
};

function threadMapHTML() {
  const c = G.char;
  const ws = G.weapons.map(w => { const d = WEAPONS[w.id]; return `<li><img alt="" src="${iconURL(d.icon[0], w.evo ? '#ffd23f' : (d.tiers ? TIERS[w.lvl - 1].c : d.icon[1]), d.icon[2], 2)}"> ${esc(weaponName(w))} <span class="muted">lv ${w.lvl}/${d.max}</span>${d.slot && G.boons[d.slot] ? ` <span style="color:${GODS[G.boons[d.slot].god].col}">· ${esc(BOON_NAMES[G.boons[d.slot].god][d.slot])}</span>` : ''}</li>`; }).join('');
  const ps = [...G.passives, ...G.charms].map(p => { const d = PASSIVES[p.id]; return `<li><img alt="" src="${iconURL(d.icon[0], d.icon[1], d.icon[2], 2)}"> ${esc(d.name)} ${d.max > 1 && d.max < 99 ? `<span class="muted">lv ${p.lvl}</span>` : ''}</li>`; }).join('');
  const syn = SYN.filter(s => s.char === c.id).map(s => {
    const a = owned(s.a), b = owned(s.b);
    const st = a && b ? 'on' : (a || b) ? 'half' : 'off';
    const name = st === 'off' ? '???' : esc(s.name);
    const need = st === 'half' ? ' — manca: ' + esc(itemName(a ? s.b : s.a)) : '';
    return `<li class="${st}"><span class="thread" style="--c:${synColor(s.name)}"></span>${name}<span class="muted">${st === 'off' ? '' : ' · ' + esc(s.desc) + need}</span></li>`;
  }).join('');
  const evo = EVOS.filter(r => r.char === c.id).map(r => {
    const w = getW(r.w);
    const done = w && w.evo;
    const parts = [itemName(r.w) + ' lv max', ...r.req.map(itemName)];
    const have = [w && w.lvl >= WEAPONS[r.w].max, ...r.req.map(owned)];
    return `<li class="${done ? 'on' : ''}">★ <b>${esc(r.into)}</b> = ${parts.map((p, i) => `<span class="${have[i] ? 'ok' : 'no'}">${esc(p)}</span>`).join(' + ')} + Strappo${done ? ' <b>✓</b>' : ''}</li>`;
  }).join('');
  return `<div class="tm-col"><h4>Armi</h4><ul>${ws}</ul><h4>Passivi</h4><ul>${ps || '<li class="muted">Nessuno</li>'}</ul></div>
    <div class="tm-col"><h4>Sinergie</h4><ul class="map-s">${syn}</ul><h4>Ricuciture</h4><ul class="map-e">${evo}</ul></div>`;
}

function stageThumb(id) {
  const c = makeCanvas(96, 54), x = c.getContext('2d');
  if (id === 'telaio') {
    const kinds = ['hk', 'hades', 'celeste', 'terra', 'blas'];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) x.drawImage(TILES[kinds[(i * 2 + j) % 5]], i * 32, j * 32);
    x.strokeStyle = '#e2b04a'; x.setLineDash([2, 2]); x.beginPath(); x.moveTo(32.5, 0); x.lineTo(32.5, 54); x.moveTo(64.5, 0); x.lineTo(64.5, 54); x.moveTo(0, 32.5); x.lineTo(96, 32.5); x.stroke();
  } else if (id === 'capolinea') {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) x.drawImage(TILES.station, i * 32, j * 32);
    x.fillStyle = '#3a3a3a'; x.fillRect(0, 20, 96, 16); x.fillStyle = '#9aa4b8'; x.fillRect(0, 24, 96, 1); x.fillRect(0, 31, 96, 1);
    x.fillStyle = '#f2c230'; for (let i = 0; i < 96; i += 6) { x.fillRect(i, 17, 3, 2); x.fillRect(i, 37, 3, 2); }
  } else {
    x.fillStyle = '#07060a'; x.fillRect(0, 0, 96, 54);
    for (let r = 60; r > 0; r -= 8) { x.fillStyle = (r / 8) % 2 ? '#4a423a' : '#3c342e'; x.beginPath(); x.arc(48, 27, r, 0, TAU); x.fill(); }
    x.strokeStyle = '#8c6a2f'; x.beginPath(); x.arc(48, 27, 60, 0, TAU); x.stroke();
    x.fillStyle = '#8c6a2f'; x.beginPath(); x.moveTo(42, 20); x.lineTo(38, 34); x.lineTo(58, 34); x.lineTo(54, 20); x.fill();
  }
  return c.toDataURL();
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

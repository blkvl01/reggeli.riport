// AZ UTOLSÓ ADÁS – játékmotor: menük, feliratok, döntések, QTE, mentés, befejezések.
(function (root) {
  'use strict';
  const STORY = root.STORY, RT = STORY.RT, H = STORY.H, CAST = STORY.CAST;
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const KEY = { save: 'utolsoadas.save.v1', end: 'utolsoadas.endings.v1', set: 'utolsoadas.settings.v1' };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privát mód */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  const G = (root.G = {
    s: null, paused: false, busy: false, auto: false, fast: false,
    settings: Object.assign({ master: 0.9, music: 0.75, sfx: 0.9, textSpeed: 1, autoAdvance: true, qte: 1, reduceFlash: false, grain: 1 }, store.get(KEY.set, {})),
  });
  const params = new URLSearchParams(location.search);
  G.auto = params.has('auto'); // teszt: automatikus végigjátszás
  G.fast = params.has('fast') || G.auto;
  const seed = +(params.get('seed') || Date.now() % 1e6);
  let rnd = (function (a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })(seed);

  // ------------------------------------------------------------ idő, szünet
  const raw = (ms) => new Promise((r) => setTimeout(r, ms));
  async function wait(ms) {
    if (G.fast) ms = Math.min(ms, 30);
    let left = ms;
    while (left > 0) { const st = Math.min(40, left); await raw(st); if (!G.paused) left -= st; }
  }
  const nameOf = (role) => (CAST[role] ? CAST[role].name : role);
  const colorOf = (role) => (CAST[role] ? CAST[role].color : '#ddd');
  const playerName = (p) => (p === 'p1' ? '1. játékos' : '2. játékos');

  // ------------------------------------------------------------ bemenet-útválasztás
  const handlers = [];
  const push = (fn) => { handlers.push(fn); return () => { const i = handlers.indexOf(fn); if (i >= 0) handlers.splice(i, 1); }; };
  IN.on((p, a, src) => {
    AU.init();
    if (a === 'pause' && G.inGame && !G.menuOpen) { togglePause(); return; }
    const h = handlers[handlers.length - 1];
    if (h) h(p, a, src);
  });
  document.addEventListener('click', () => AU.init(), { once: false });

  // ------------------------------------------------------------ UI elemek
  const UI = {};
  function buildUI() {
    const ui = $('#ui');
    ui.innerHTML = `
      <div id="bars"><i class="top"></i><i class="bot"></i></div>
      <div id="doc"></div>
      <div id="subs"><div class="name"></div><div class="text"></div><div class="next">▾</div></div>
      <div id="toasts"></div>
      <div id="choice"></div>
      <div id="qte"></div>
      <div id="card"></div>
      <div id="private"></div>
      <div id="menu"></div>
      <div id="hud"><span class="hud-ch"></span></div>
      <div id="vhs"><span class="rec">● REC</span><span class="tc">2010.10.17</span><span class="bat"><i></i></span><span class="mode">SP</span></div>`;
    ['subs', 'toasts', 'choice', 'qte', 'card', 'private', 'menu', 'doc', 'hud', 'bars', 'vhs'].forEach((k) => (UI[k] = $('#' + k)));
    // VHS időkód
    setInterval(() => {
      if (!UI.vhs.classList.contains('show')) return;
      const t = new Date(Date.UTC(2010, 9, 17, 23, 41, 0) + (performance.now() % 3.6e6));
      const p = (n) => String(n).padStart(2, '0');
      UI.vhs.querySelector('.tc').textContent = `OKT 17 2010   ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:${p(t.getUTCSeconds())}`;
    }, 500);
  }

  function toast(text, kind) {
    const t = el('div', 'toast ' + (kind || ''), `<span class="ico">📻</span><span>${esc(text)}</span>`);
    UI.toasts.appendChild(t);
    AU.sfx('note');
    setTimeout(() => t.classList.add('out'), 4200);
    setTimeout(() => t.remove(), 5200);
  }

  // ------------------------------------------------------------ feliratok
  function waitAdvance(allowed, autoMs) {
    return new Promise((resolve) => {
      let done = false, tm = null;
      const finish = () => { if (done) return; done = true; off(); if (tm) clearInterval(tm); resolve(); };
      const off = push((p, a) => { if (a === 'act' && (!allowed || allowed.includes(p))) finish(); });
      if (G.auto) { setTimeout(finish, 5); return; }
      if (autoMs) { let left = autoMs; tm = setInterval(() => { if (!G.paused) left -= 50; if (left <= 0) finish(); }, 50); }
    });
  }

  async function say(b, allowed) {
    const subs = UI.subs, nm = subs.querySelector('.name'), tx = subs.querySelector('.text');
    const who = b.who;
    const nmText = b.name !== undefined ? b.name : who === 'N' ? '' : nameOf(who);
    nm.textContent = nmText; nm.style.color = colorOf(who);
    subs.className = 'show ' + (who === 'N' ? 'narr' : '') + (who === 'R' || b.rec ? ' rec' : '') + (who === 'NUM' ? ' num' : '');
    if (who === 'NUM') AU.speakNumbers(b.text.replace(/[^\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ .]/g, ''));
    if (who === 'R' || b.rec) AU.garble(b.text, b.voice);
    // írógép-hatás
    const text = b.text;
    tx.textContent = '';
    let i = 0, skip = false;
    const offSkip = push((p, a) => { if (a === 'act' && (!allowed || allowed.includes(p))) skip = true; });
    const speed = 22 / (G.settings.textSpeed || 1);
    while (i < text.length && !skip && !G.fast) {
      i += 2; tx.textContent = text.slice(0, i);
      if (i % 6 === 0 && who !== 'N') AU.sfx('tick');
      await wait(speed * 2);
    }
    offSkip();
    tx.textContent = text;
    subs.classList.add('done');
    const autoMs = G.settings.autoAdvance ? Math.max(1800, text.length * 55) / (G.settings.textSpeed || 1) : 0;
    await waitAdvance(allowed, autoMs);
    subs.classList.remove('done');
  }
  function hideSubs() { UI.subs.className = ''; }

  // ------------------------------------------------------------ kártyák (cím, fejezet, halál, szerep)
  async function card(html, cls, ms, waitPress) {
    UI.card.className = 'show ' + (cls || '');
    UI.card.innerHTML = html;
    await wait(ms || 2600);
    if (waitPress && !G.auto) await waitAdvance(null, 6000);
    UI.card.classList.remove('show');
    await wait(500);
    UI.card.className = '';
  }

  // ------------------------------------------------------------ dokumentumok
  const DOCS = {
    rita: () => `<div class="paper diary"><div class="hand">1998. október 18., vasárnap</div>
      <div class="hand">K. úr megint vasárnap jön. Azt mondja, a két kulcsot <u>egyszerre</u> kell elfordítani.</div>
      <div class="hand">Zoli rosszul alszik. Azt mondja, valaki áll éjjel az ágy végében. Én is láttam. Nem merem neki megmondani.</div>
      <div class="hand sig">– Rita</div></div>`,
    order: () => `<div class="paper typed"><div class="stamp">SZIGORÚAN TITKOS</div>
      <p>MAGYAR NÉPHADSEREG · VK-7 VADKŐ-TETŐ<br>Szám: 88/1113/CS</p>
      <p><b>PARANCS</b><br>1988. XI. 13. 23:00 – CSEND program, teljes teljesítményű éjszakai teszt.</p>
      <p>Az éjszakai műszak <b>NEM ÉRTESÍTENDŐ.</b> A reakciókat a belső hangosbemondón rögzíteni.</p>
      <p class="sig">Kardos B. százados <span class="photo"></span></p></div>`,
    schematic: () => `<div class="paper blueprint"><div class="bp-title">REZONÁTOR – 19 Hz · CSEND</div>
      <svg viewBox="0 0 400 220"><g fill="none" stroke="#cfe6ff" stroke-width="1.4">
      <rect x="20" y="40" width="90" height="140"/><text x="26" y="58" fill="#cfe6ff" stroke="none" font-size="11">VEZÉRLŐ (-2)</text>
      <path d="M110 110 H190"/><circle cx="220" cy="110" r="30"/><path d="M200 110 a20 20 0 0 1 40 0"/><text x="196" y="160" fill="#cfe6ff" stroke="none" font-size="11">TEKERCS</text>
      <path d="M250 110 H330 V30"/><path d="M320 30 L330 6 L340 30 Z"/><text x="276" y="128" fill="#cfe6ff" stroke="none" font-size="11">TÁPKÁBEL → AKNA</text>
      <path d="M360 200 L330 40 L300 200 M312 150 H348 M318 110 H342"/><text x="300" y="215" fill="#cfe6ff" stroke="none" font-size="11">TORONY</text></g></svg>
      <div class="bp-note">Generátorindításkor automatikus vészüzem.</div></div>`,
    dossier: () => `<div class="paper dossier"><div class="tab">K. B. – SZEMÉLYES</div>
      <div class="pair"><span class="ph x"></span><span class="ph x"></span><b>1998</b> Barta Rita · Barta Zoltán</div>
      <div class="pair"><span class="ph x"></span><span class="ph x"></span><b>2010</b> Kerekes Dani · Fehér Gergő</div>
      <div class="pair now"><span class="ph"></span><span class="ph"></span><b>2026</b> Kerekes Máté · Szántó Lili<br><i>benzinkút, 16:32</i></div>
      <div class="sig">K. B. alezr.</div></div>`,
  };
  function showDoc(k) { if (!DOCS[k]) return; UI.doc.innerHTML = DOCS[k](); UI.doc.className = 'show'; }
  function hideDoc() { UI.doc.className = ''; }

  // ------------------------------------------------------------ fx
  async function doFx(b) {
    const a = b.arg;
    switch (b.fx) {
      case 'title': hideSubs(); await card(`<div class="title-line">${esc(a)}</div>`, 'title', 2600); break;
      case 'chapter': {
        hideSubs(); hideDoc();
        const [num, name] = String(a).split('·').map((x) => x.trim());
        UI.hud.querySelector('.hud-ch').textContent = a;
        AU.sfx('sting');
        await card(`<div class="ch-num">${esc(num)}</div><div class="ch-name" data-t="${esc(name)}">${esc(name)}</div>`, 'chapter', 3600);
        break;
      }
      case 'sfx':
        AU.sfx(a);
        if (a === 'thunder') R.lightning();
        if (a === 'generator') { R.state.genOn = true; R.shake(0.8); }
        if (a === 'power_up') R.setDark(0);
        if (a === 'power_down' || a === 'power_flicker') R.state.genOn = a === 'power_flicker';
        if (a === 'impact' || a === 'door_slam' || a === 'gunshot') IN.rumble('p1', 250) || IN.rumble('p2', 250);
        await wait(a === 'generator' || a === 'thunder' ? 900 : 250);
        break;
      case 'music': AU.music(a); break;
      case 'flash': R.flash(a === 'red' ? 'red' : 'white', G.settings.reduceFlash ? 0.25 : 0.9); await wait(150); break;
      case 'shake': R.shake(1); await wait(250); break;
      case 'jump':
        hideSubs();
        R.jump(a, 700); AU.sfx('jump'); IN.rumble('p1', 400, 1); IN.rumble('p2', 400, 1);
        if (!G.settings.reduceFlash) R.flash('white', 0.35);
        await wait(900); break;
      case 'dark': R.setDark(0.92); await wait(700); break;
      case 'wait': await wait(a || 1000); break;
      case 'bg': R.setScene(a); await wait(500); break;
      case 'note': toast(a); await wait(400); break;
      case 'focus': R.state.zoom = { x: 0.32, y: 0.8, k: 1.3, t0: performance.now() }; await wait(800); break;
      case 'doc': showDoc(a); await wait(500); break;
      case 'ghost': R.ghost(); AU.sfx('static_cut'); await wait(300); break;
      case 'calm': R.calm(); AU.music('silence'); await wait(1200); break;
      case 'sting': AU.sfx('sting'); R.shake(0.6); await wait(600); break;
      case 'death': {
        hideSubs();
        AU.sfx('death'); R.flash('red', 0.6);
        const who = a, p = who === 'M' ? 'p1' : 'p2'; // Máté mindig az 1., Lili a 2. játékos
        await card(`<div class="death">${esc(nameOf(who).toUpperCase())} MEGHALT</div><div class="death-sub">${playerName(p)}: ne tedd le a ${p === 'p1' ? 'billentyűzetet' : 'kontrollert'}.</div>`, 'death', 3200);
        break;
      }
      case 'role': {
        hideSubs();
        const p = RT.playerOf(G.s, a);
        if (!p) break;
        const txt = a === 'S'
          ? `<div class="role-t">${playerName(p)}</div><div class="role-n">Mostantól <b style="color:${colorOf('S')}">SÁNDORT</b> irányítod.</div><div class="role-s">Sándor dönt helyetted, és te döntesz helyette.</div>`
          : `<div class="role-t">${playerName(p)}</div><div class="role-n">Mostantól <b style="color:${colorOf('K')}">KARDOST</b> irányítod.</div><div class="role-s">Kardos keze a tiéd. Ne kímélj senkit.</div>`;
        await card(txt, 'role', 3600, true);
        break;
      }
      case 'credits': await credits(true); break;
    }
  }

  function updateLook(sc) {
    const s = G.s;
    const bg = RT.val(sc.bg, s), mu = RT.val(sc.music, s);
    if (bg) { R.setScene(bg); R.setDark(0); }
    if (mu) AU.music(mu);
    R.setVhs(!!sc.vhs);
    UI.vhs.classList.toggle('show', !!sc.vhs);
    R.state.genOn = s.genBe; R.state.rezKi = s.rezKi;
    const e = Math.max(s.el.M ? s.exp.M : 0, s.el.L ? s.exp.L : 0);
    R.setHallu(H.rezBe(s) ? Math.max(0, Math.min(1, (e - 1.5) / 5.5)) * 0.9 : 0);
    R.state.zoom = null;
  }

  // ------------------------------------------------------------ döntési UI
  const DIRS = { 1: ['down'], 2: ['left', 'right'], 3: ['left', 'up', 'right'], 4: ['up', 'left', 'right', 'down'] };

  async function runChoice(sc, it) {
    const s = G.s;
    hideSubs();
    const hidden = it.mode === 'hidden';
    const box = UI.choice;
    box.innerHTML = '';
    box.className = 'show ' + it.mode + (it.parts.length === 1 ? ' solo' : '');
    box.appendChild(el('div', 'c-prompt', (hidden ? '<span class="secret">TITKOS DÖNTÉS</span>' : '') + esc(it.prompt)));
    const tbar = el('div', 'c-timer', '<i></i>'); if (it.timer) box.appendChild(tbar);
    const panels = el('div', 'c-panels'); box.appendChild(panels);
    const picks = {}, map = {};
    for (const part of it.parts) {
      const dirs = DIRS[Math.min(4, part.opts.length)] || DIRS[4];
      const pnl = el('div', 'c-panel ' + part.player);
      pnl.innerHTML = `<div class="c-head"><b style="color:${colorOf(part.role)}">${esc(nameOf(part.role).toUpperCase())}</b><span>${playerName(part.player)} · ${IN.deviceName(part.player)}</span></div>`;
      const grid = el('div', 'c-grid n' + part.opts.length);
      part.opts.forEach((o, i) => {
        const d = dirs[i];
        const b = el('div', 'c-opt d-' + d, `<span class="${IN.glyphClass(part.player, d)}">${IN.glyph(part.player, d)}</span><span class="c-t">${esc(o.t)}</span>`);
        b.dataset.k = o.k; grid.appendChild(b);
        (map[part.player] = map[part.player] || {})[d] = o.k;
        b.addEventListener('click', () => pick(part, o.k));
      });
      pnl.appendChild(grid);
      pnl.appendChild(el('div', 'c-done', hidden || it.mode === 'vote' ? '✓ DÖNTÖTT' : ''));
      panels.appendChild(pnl);
      part.el = pnl;
    }
    let resolveAll;
    const allDone = new Promise((r) => (resolveAll = r));
    function pick(part, k) {
      if (picks[part.role] !== undefined) return;
      picks[part.role] = k;
      AU.sfx(hidden ? 'lock' : 'select');
      part.el.classList.add('picked');
      if (!hidden && it.mode !== 'vote') part.el.querySelector(`[data-k="${k}"]`).classList.add('sel');
      if (it.parts.every((x) => picks[x.role] !== undefined)) resolveAll();
    }
    const off = push((p, a) => {
      const part = it.parts.find((x) => x.player === p);
      if (!part || !map[p] || !map[p][a]) return;
      pick(part, map[p][a]);
    });
    // automata teszt
    if (G.auto) for (const part of it.parts) setTimeout(() => pick(part, part.opts[Math.floor(rnd() * part.opts.length)].k), 10);
    // időzítő
    let timerDone = false;
    if (it.timer && !G.auto) {
      (async () => {
        const T = it.timer, t0 = performance.now(); let paused = 0, last = t0;
        while (!timerDone) {
          await raw(50);
          const nw = performance.now(); if (G.paused) paused += nw - last; last = nw;
          const left = T - (nw - t0 - paused);
          tbar.firstChild.style.transform = `scaleX(${Math.max(0, left / T)})`;
          if (left < 3000 && Math.floor(left / 1000) !== Math.floor((left + 50) / 1000)) AU.sfx('tick');
          if (left <= 0) { for (const part of it.parts) if (picks[part.role] === undefined) pick(part, part.def); break; }
        }
      })();
    }
    await allDone;
    timerDone = true;
    off();
    // felfedés (nyílt szavazás)
    if (it.mode === 'vote' && it.parts.length > 1) {
      for (const part of it.parts) part.el.querySelector(`[data-k="${picks[part.role]}"]`).classList.add('sel');
      box.classList.add('reveal');
      await wait(1300);
    } else await wait(hidden ? 700 : 450);
    box.className = '';
    let duel;
    if (RT.needsDuel(it, picks)) duel = await runDuel(it.parts);
    // napló
    for (const part of it.parts) {
      const o = part.opts.find((x) => x.k === picks[part.role]);
      s.naplo.push({ ch: sc.ch, prompt: it.prompt, role: part.role, t: o ? o.t : picks[part.role], hidden });
    }
    if (it.echo) toast('Ez a döntés visszhangzik…', 'echo');
    return RT.resolveChoice(s, sc, picks, duel);
  }

  async function runDuel(parts) {
    const box = UI.qte;
    const [a, b] = parts;
    box.className = 'show duel';
    box.innerHTML = `<div class="q-title">VITA!</div><div class="q-sub">Nem értetek egyet. Nyomjátok gyorsan a saját gombotokat!</div>
      <div class="duel-row"><span style="color:${colorOf(a.role)}">${esc(nameOf(a.role))} <span class="${IN.glyphClass(a.player, 'act')}">${IN.glyph(a.player, 'act')}</span></span>
      <div class="duel-bar"><i></i></div>
      <span style="color:${colorOf(b.role)}"><span class="${IN.glyphClass(b.player, 'act')}">${IN.glyph(b.player, 'act')}</span> ${esc(nameOf(b.role))}</span></div>`;
    const bar = box.querySelector('.duel-bar i');
    let pos = 0;
    const off = push((p, act) => {
      if (act !== 'act') return;
      if (p === a.player) pos -= 0.06; else if (p === b.player) pos += 0.06;
      pos = Math.max(-1, Math.min(1, pos)); bar.style.left = 50 + pos * 50 + '%'; AU.sfx('tick');
    });
    if (G.auto) pos = rnd() < 0.5 ? -1 : 1;
    const t0 = performance.now();
    while (Math.abs(pos) < 1 && performance.now() - t0 < 5000 && !G.auto) await wait(30);
    off();
    const win = pos === 0 ? (rnd() < 0.5 ? a : b) : pos < 0 ? a : b;
    box.innerHTML = `<div class="q-title" style="color:${colorOf(win.role)}">${esc(nameOf(win.role).toUpperCase())} DÖNT</div>`;
    await wait(1100);
    box.className = '';
    return win.role;
  }

  // ------------------------------------------------------------ QTE
  async function runQte(sc, it) {
    const st = G.s;
    hideSubs();
    const box = UI.qte, mult = G.settings.qte || 1;
    const ms = it.ms * mult;
    const players = it.players;
    const who = it.role === 'co' ? null : it.role;
    const head = who ? `<div class="q-who" style="color:${colorOf(who)}">${esc(nameOf(who).toUpperCase())} · ${playerName(players[0])}</div>` : '';
    box.className = 'show ' + it.kind;
    let ok = false;
    if (G.auto) { ok = rnd() < 0.6; box.className = ''; s_log(st, sc, it, ok); return RT.qteResult(st, sc, ok); }

    if (it.kind === 'press') {
      const dir = ['up', 'left', 'right', 'down'][Math.floor(rnd() * 4)];
      const p = players[0];
      box.innerHTML = `${head}<div class="q-prompt">${esc(it.prompt)}</div><div class="q-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/></svg><span class="${IN.glyphClass(p, dir)} big">${IN.glyph(p, dir)}</span></div>`;
      const ring = box.querySelector('circle');
      ok = await new Promise((res) => {
        let done = false;
        const off = push((pp, a) => { if (pp !== p || !['up', 'left', 'right', 'down'].includes(a)) return; done = true; off(); res(a === dir); });
        (async () => { const t0 = performance.now(); let paused = 0, last = t0;
          while (!done) { await raw(16); const nw = performance.now(); if (G.paused) paused += nw - last; last = nw;
            const f = Math.min(1, (nw - t0 - paused) / ms); ring.style.strokeDashoffset = 276 * f;
            if (f >= 1) { done = true; off(); res(false); } } })();
      });
    } else if (it.kind === 'mash') {
      const p = players[0];
      box.innerHTML = `${head}<div class="q-prompt">${esc(it.prompt)}</div><div class="q-mash"><span class="${IN.glyphClass(p, 'act')} big pulse">${IN.glyph(p, 'act')}</span><div class="q-bar"><i></i></div></div>`;
      const bar = box.querySelector('.q-bar i');
      let n = 0;
      const off = push((pp, a) => { if (pp === p && a === 'act') { n++; bar.style.width = Math.min(100, (n / it.count) * 100) + '%'; AU.sfx('tick'); } });
      const t0 = performance.now(); let paused = 0, last = t0;
      while (n < it.count) { await raw(16); const nw = performance.now(); if (G.paused) paused += nw - last; last = nw; if (nw - t0 - paused > ms) break; }
      off(); ok = n >= it.count;
    } else if (it.kind === 'hold') {
      const ps = players;
      box.innerHTML = `${head}<div class="q-prompt">${esc(it.prompt)}</div><div class="q-hold">${ps.map((p) => `<span class="${IN.glyphClass(p, 'act')} big">${IN.glyph(p, 'act')}</span>`).join('')}<div class="q-bar"><i></i></div><div class="q-sub">Kezdjétek el nyomva tartani…</div></div>`;
      const bar = box.querySelector('.q-bar i'), sub = box.querySelector('.q-sub');
      let t0 = performance.now();
      while (!ps.every((p) => IN.isHeld(p, 'act'))) { await raw(16); if (performance.now() - t0 > 2600) break; }
      if (ps.every((p) => IN.isHeld(p, 'act'))) {
        sub.textContent = 'Ne engedjétek el…';
        t0 = performance.now(); ok = true;
        let paused = 0, last = t0;
        while (true) {
          await raw(16); const nw = performance.now(); if (G.paused) paused += nw - last; last = nw;
          const f = (nw - t0 - paused) / ms; bar.style.width = Math.min(100, f * 100) + '%';
          if (!G.paused && !ps.every((p) => IN.isHeld(p, 'act'))) { ok = false; break; }
          if (f >= 1) break;
        }
      }
    } else if (it.kind === 'co') {
      box.innerHTML = `<div class="q-prompt">${esc(it.prompt)}</div><div class="q-co">${players.map((p) => `<span class="${IN.glyphClass(p, 'act')} big" data-p="${p}">${IN.glyph(p, 'act')}</span>`).join('')}</div><div class="q-cue">KÉSZÜLJETEK…</div>`;
      const cue = box.querySelector('.q-cue');
      const times = {};
      let early = false, cueAt = 0;
      const off = push((p, a) => {
        if (a !== 'act' || !players.includes(p) || times[p]) return;
        if (!cueAt) { early = true; return; }
        times[p] = performance.now(); const g = box.querySelector(`[data-p="${p}"]`); if (g) g.classList.add('hit');
      });
      await wait(1200 + rnd() * 1800);
      if (!early) { cueAt = performance.now(); cue.textContent = 'MOST!'; cue.classList.add('now'); AU.sfx('select'); }
      const t0 = performance.now();
      while (!early && Object.keys(times).length < players.length && performance.now() - t0 < 1600) await raw(16);
      off();
      const ts = Object.values(times);
      ok = !early && ts.length === players.length && Math.max(...ts) - Math.min(...ts) <= ms;
      cue.textContent = early ? 'TÚL KORÁN!' : ok ? 'EGYSZERRE!' : 'NEM EGYSZERRE…';
    }
    AU.sfx(ok ? 'qte_ok' : 'qte_fail');
    box.classList.add(ok ? 'ok' : 'fail');
    await wait(650);
    box.className = '';
    s_log(st, sc, it, ok);
    return RT.qteResult(st, sc, ok);
  }
  function s_log(st, sc, it, ok) { st.naplo.push({ ch: sc.ch, prompt: it.prompt, role: it.role === 'co' ? 'co' : it.role, t: ok ? 'Sikerült' : 'Nem sikerült', qte: true }); }

  // ------------------------------------------------------------ titkos tárcsa
  async function runDial(sc, it) {
    const st = G.s;
    hideSubs();
    const box = UI.qte;
    box.className = 'show dial';
    box.innerHTML = `<div class="q-prompt">Az adó frekvenciatárcsája. Hangoljátok be, és indulhat az adás.</div>
      <div class="dial"><div class="dial-led">— — . — —</div><div class="dial-knob"></div></div>
      <div class="q-sub">${IN.glyph('p1', 'act')} / ${IN.glyph('p2', 'act')}: ADÁS INDÍTÁSA</div>`;
    const led = box.querySelector('.dial-led');
    let typed = '', found = false;
    const dig = (d) => {
      typed = (typed + d).slice(-12); led.textContent = typed.replace(/(\d{2})(?=\d)/g, '$1 ');
      AU.sfx('tick');
      if (typed.endsWith(it.code) && !found) { found = true; led.classList.add('found'); AU.sfx('static'); }
    };
    IN.digits.add(dig);
    if (G.auto) { if (rnd() < 0.5) it.code.split('').forEach(dig); }
    else await waitAdvance(null, 0);
    IN.digits.delete(dig);
    box.className = '';
    return RT.dialResult(st, sc, found);
  }

  // ------------------------------------------------------------ privát („fordulj el”) jelenet
  async function privateIntro(role) {
    const p = RT.playerOf(G.s, role);
    const other = p === 'p1' ? 'p2' : 'p1';
    const otherRole = G.s.szerep[other];
    UI.private.className = 'show';
    UI.private.innerHTML = `<div class="pv-big">${esc(nameOf(otherRole).toUpperCase())}, FORDULJ EL!</div>
      <div class="pv-sub">Ezt csak <b style="color:${colorOf(role)}">${esc(nameOf(role))}</b> láthatja.</div>
      <div class="pv-hint">${playerName(p)}: ha a párod nem néz, nyomd meg: <span class="${IN.glyphClass(p, 'act')}">${IN.glyph(p, 'act')}</span></div>`;
    AU.sfx('sting');
    await waitAdvance([p]);
    UI.private.className = 'show dim';
    UI.private.innerHTML = `<div class="pv-badge">CSAK ${esc(nameOf(role).toUpperCase())} LÁTJA</div>`;
    return p;
  }
  async function privateOutro(p) {
    UI.private.className = 'show';
    UI.private.innerHTML = `<div class="pv-sub">${playerName(p)}: nyomd meg <span class="${IN.glyphClass(p, 'act')}">${IN.glyph(p, 'act')}</span>, ha végeztél.</div>`;
    hideSubs();
    await waitAdvance([p]);
    UI.private.innerHTML = `<div class="pv-big">VISSZANÉZHETSZ.</div>`;
    await wait(1100);
    UI.private.className = '';
  }

  // ------------------------------------------------------------ fő ciklus
  async function play(id) {
    G.inGame = true;
    const run = (G.runId = (G.runId || 0) + 1);
    const s = G.s;
    s.naplo = s.naplo || [];
    while (id) {
      if (run !== G.runId) return;
      store.set(KEY.save, { id, s });
      const sc = RT.scene(id);
      G.sceneId = id;
      RT.enter(s, sc);
      if (RT.val(sc.bg, s)) hideDoc();
      updateLook(sc);
      let allowed = null, pvPlayer = null;
      if (sc.private) { const role = RT.val(sc.private, s); pvPlayer = await privateIntro(role); allowed = [pvPlayer]; }
      for (const b of RT.iterBeats(s, sc.beats)) {
        if (run !== G.runId) return;
        if (b.fx) await doFx(b); else await say(b, allowed);
        updateLook({ bg: null, music: null, vhs: sc.vhs });
      }
      if (pvPlayer) await privateOutro(pvPlayer);
      const it = RT.interaction(s, sc);
      let next = null;
      if (it.type === 'choice') next = await runChoice(sc, it);
      else if (it.type === 'qte') next = await runQte(sc, it);
      else if (it.type === 'dial') next = await runDial(sc, it);
      else if (it.type === 'ending') { hideSubs(); await endingScreen(it.code); return; }
      else next = RT.next(s, sc);
      id = next;
    }
  }

  // ------------------------------------------------------------ befejezések
  const HINTS = {
    E1: 'Az igazság élőben, mindenki életben.', E2: 'Valakinek bent kell maradnia.', E3: 'Egy fiú és az apja.',
    E4: 'Elmenni bizonyíték nélkül.', E5: 'Hazavinni valakit.', E6: 'Az életetekért cserébe.', E7: 'A szörny a résben.',
    E8: 'Csak egy jön haza.', E9: 'Együtt, a sötétben.', E10: 'Négy, nyolc, tizenöt…',
  };
  async function endingScreen(code) {
    G.inGame = false;
    const got = store.get(KEY.end, []);
    const isNew = !got.includes(code);
    if (isNew) { got.push(code); store.set(KEY.end, got); }
    store.del(KEY.save);
    const order = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10'];
    AU.sfx('sting');
    await card(`<div class="end-k">BEFEJEZÉS ${order.indexOf(code) + 1} / 10</div><div class="end-t">${esc(STORY.ENDINGS[code].toUpperCase())}</div>${isNew ? '<div class="end-new">ÚJ BEFEJEZÉS FELOLDVA</div>' : ''}`, 'ending', 4200);
    if (code !== 'E10') await credits(false);
    if (G.auto) { G.lastEnding = code; root.dispatchEvent(new CustomEvent('ending', { detail: code })); return; }
    showSummary(code);
  }

  function showSummary(code) {
    const s = G.s;
    const got = store.get(KEY.end, []);
    const chs = ['Prológus', 'Érkezés', 'Zaj', 'Ketten', 'A két kulcs', 'Adás', 'Epilógus'];
    const groups = {};
    for (const n of s.naplo || []) (groups[n.ch] = groups[n.ch] || []).push(n);
    const log = Object.keys(groups).sort((a, b) => a - b).map((ch) => `<div class="log-ch"><h4>${chs[ch] || ch}</h4>${groups[ch].map((n) =>
      `<div class="log-row${n.qte ? ' q' : ''}"><span class="log-who" style="color:${colorOf(n.role)}">${n.role === 'co' ? 'Közös' : esc(nameOf(n.role))}</span><span class="log-p">${esc(n.prompt.replace(/^Titkos döntés\. ?/, ''))}</span><span class="log-a">${n.hidden ? '🔒 ' : ''}${esc(n.t)}</span></div>`).join('')}</div>`).join('');
    const gal = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10'].map((k, i) => {
      const has = got.includes(k);
      return `<div class="gal ${has ? 'has' : ''} ${k === code ? 'cur' : ''}"><b>${i + 1}</b><span>${has ? esc(STORY.ENDINGS[k]) : '???'}</span><i>${has ? '' : esc(HINTS[k])}</i></div>`;
    }).join('');
    const facts = [
      ['Bizalom köztetek', s.bizalom + ' / 10'], ['Megtalált nyomok', s.nyomok.length + ' / 6'],
      ['Sándor', s.sandor.el ? 'életben' : 'halott'], ['Kardos', { aktiv: 'szabadon', artalmatlan: 'ártalmatlanná téve', halott: 'halott' }[s.kardos]],
      ['Rezonátor', s.rezKi ? 'kikapcsolva' : 'működött'], ['Titkok', (s.titok.M ? 'Máté bevallotta' : 'Máté titkolta') + ' · ' + (s.titok.L ? 'Lili bevallotta' : 'Lili titkolta')],
    ].map(([a, b]) => `<div class="fact"><span>${a}</span><b>${b}</b></div>`).join('');
    openMenu(`<div class="sum"><h2>${esc(STORY.ENDINGS[code])}</h2>
      <div class="sum-cols"><div class="sum-log"><h3>Döntési napló</h3>${log}</div>
      <div class="sum-side"><h3>Az éjszaka mérlege</h3>${facts}<h3>Befejezések · ${got.length} / 10</h3><div class="gallery">${gal}</div></div></div>
      <div class="menu-list row"><button data-a="new">Új éjszaka</button><button data-a="title">Főmenü</button></div></div>`, {
      new: () => newGame(), title: () => titleScreen(),
    }, 'summary');
  }

  async function credits(sting) {
    hideSubs();
    const box = UI.card;
    box.className = 'show credits';
    const photo = (root.PHOTO_CREDITS || []).map((c) => `<div class="cr-ph">${esc(c)}</div>`).join('');
    box.innerHTML = `<div class="roll"><div class="cr-t">AZ UTOLSÓ ADÁS</div>
      <div class="cr-h">Szereplők</div><div>Kerekes Máté · Szántó Lili</div><div>Kardos Béla „Kertész” · Kardos Sándor</div><div>Kerekes Dani · Fehér Gergő</div>
      <div class="cr-h">Történet, játékmenet, kód, hang és zene</div><div>Claude</div>
      <div class="cr-h">Ötlet és első játékosok</div><div>Ti ketten</div>
      <div class="cr-h">Ihlette</div><div>Until Dawn · The Quarry · The Dark Pictures · The Walking Dead · Silent Hill · Firewatch · Heavy Rain · Detroit · It Takes Two</div>
      <div class="cr-h">Fotók (szabad licenc, átdolgozva)</div>${photo || '<div>Procedurális grafika</div>'}
      <div class="cr-h">Betűtípusok</div><div>Oswald · IBM Plex Sans · Courier Prime · Caveat (SIL OFL)</div>
      <div class="cr-end">A VK-7 kitalált helyszín. A 19 Hz-es „szellemfrekvencia” valós kutatásokon alapul.</div></div>`;
    const roll = box.querySelector('.roll');
    const dur = G.fast ? 50 : 26000;
    roll.style.animationDuration = dur + 'ms';
    await Promise.race([wait(dur), waitAdvance(null, 0)]);
    box.className = '';
    void sting;
  }

  // ------------------------------------------------------------ menük
  let menuOff = null;
  function openMenu(html, actions, cls) {
    G.menuOpen = true;
    UI.menu.className = 'show ' + (cls || '');
    UI.menu.innerHTML = html;
    const btns = [...UI.menu.querySelectorAll('button')];
    let idx = 0;
    const focus = () => { btns.forEach((b, i) => b.classList.toggle('focus', i === idx)); };
    focus();
    btns.forEach((b, i) => {
      b.addEventListener('mouseenter', () => { idx = i; focus(); });
      b.addEventListener('click', () => fire(b));
    });
    function fire(b) {
      AU.init(); AU.sfx('select');
      const a = b.dataset.a;
      if (actions[a]) actions[a](b);
    }
    if (menuOff) menuOff();
    menuOff = push((p, a) => {
      if (!btns.length) return;
      if (a === 'up' || a === 'left') { idx = (idx - 1 + btns.length) % btns.length; focus(); AU.sfx('tick'); }
      if (a === 'down' || a === 'right') { idx = (idx + 1) % btns.length; focus(); AU.sfx('tick'); }
      if (a === 'act') fire(btns[idx]);
    });
  }
  function closeMenu() { G.menuOpen = false; UI.menu.className = ''; UI.menu.innerHTML = ''; if (menuOff) { menuOff(); menuOff = null; } }

  function titleScreen() {
    G.inGame = false; G.paused = false;
    hideSubs(); hideDoc(); UI.choice.className = ''; UI.qte.className = ''; UI.card.className = ''; UI.private.className = '';
    R.setScene('gate_night'); R.setHallu(0); R.setVhs(false); R.setDark(0);
    AU.music('wind');
    const save = store.get(KEY.save, null);
    const got = store.get(KEY.end, []);
    openMenu(`<div class="title-screen"><div class="logo"><span>AZ UTOLSÓ</span><span class="b">ADÁS</span></div>
      <div class="tag">Egy éjszaka. Két kulcs. Tíz befejezés.</div>
      <div class="menu-list">
        ${save ? '<button data-a="cont">Folytatás</button>' : ''}
        <button data-a="new">Új játék</button>
        <button data-a="end">Befejezések · ${got.length}/10</button>
        <button data-a="ctrl">Irányítás</button>
        <button data-a="set">Beállítások</button>
      </div>
      <div class="foot">Fejhallgató ajánlott · Két játékos, egy gép · 16+</div></div>`, {
      cont: () => { closeMenu(); G.s = save.s; play(save.id); },
      new: () => warning(),
      end: () => galleryScreen(),
      ctrl: () => controlsScreen(titleScreen),
      set: () => settingsScreen(titleScreen),
    }, 'title');
  }

  function warning() {
    openMenu(`<div class="panel warn"><h2>Mielőtt elkezditek</h2>
      <p>Ez a játék <b>ijesztő jeleneteket, erőszakot, halált</b> és <b>villogó fényeket</b> tartalmaz.</p>
      <p>Két játékos, egy képernyő. <b>Máté</b> az 1. játékos, <b>Lili</b> a 2. játékos. A <b>titkos döntéseknél</b> ne lessetek egymás kezére. A <b>„Fordulj el!”</b> képernyőknél tényleg forduljatok el.</p>
      <p>A döntéseitek számítanak: a játékban bárki meghalhat, és tíz különböző befejezés van.</p>
      <div class="menu-list row"><button data-a="go">Tovább</button><button data-a="back">Vissza</button></div></div>`, {
      go: () => controlsScreen(() => { closeMenu(); newGame(); }, true), back: () => titleScreen(),
    });
  }

  function controlsScreen(back, starting) {
    const render = () => {
      const pad = IN.padIndex.p2 !== null;
      openMenu(`<div class="panel ctrl"><h2>Irányítás</h2>
        <div class="ctrl-cols">
          <div class="ctrl-p"><h3 style="color:${colorOf('M')}">1. játékos · MÁTÉ</h3><div class="dev">Billentyűzet</div>
            <div class="keys"><span class="key">W</span><span class="key">A</span><span class="key">S</span><span class="key">D</span> választás</div>
            <div class="keys"><span class="key">SZÓKÖZ</span> tovább / akció</div><div class="keys"><span class="key">ESC</span> szünet</div></div>
          <div class="ctrl-p"><h3 style="color:${colorOf('L')}">2. játékos · LILI</h3><div class="dev">${pad ? 'Kontroller csatlakoztatva ✓' : 'Nincs kontroller: nyomj meg rajta egy gombot. Addig a nyilak + Enter.'}</div>
            ${pad ? `<div class="keys"><span class="pad pad-Y">Y</span><span class="pad pad-X">X</span><span class="pad pad-B">B</span><span class="pad pad-A">A</span> választás</div><div class="keys"><span class="pad pad-A">A</span> tovább / akció</div><div class="keys"><span class="key">START</span> szünet</div>`
              : `<div class="keys"><span class="key">↑</span><span class="key">←</span><span class="key">↓</span><span class="key">→</span> választás</div><div class="keys"><span class="key">ENTER</span> tovább / akció</div>`}</div>
        </div>
        <p class="small">Gyorsreakciós jeleneteknél (QTE) a kijelzett gombot kell megnyomni, nyomva tartani vagy gyorsan nyomkodni. Közös akciónál a <b>MOST!</b> jelre <b>egyszerre</b> kell nyomnotok.</p>
        <div class="menu-list row">${starting ? '<button data-a="go">Kezdjük</button>' : ''}<button data-a="back">Vissza</button></div></div>`, {
        go: () => back(), back: () => (starting ? titleScreen() : back()),
      });
    };
    IN.onPadChange = render;
    render();
  }

  function settingsScreen(back) {
    const st = G.settings;
    const rows = [
      ['master', 'Fő hangerő', [0, 0.25, 0.5, 0.75, 0.9, 1], (v) => Math.round(v * 100) + '%'],
      ['music', 'Zene és atmoszféra', [0, 0.25, 0.5, 0.75, 1], (v) => Math.round(v * 100) + '%'],
      ['sfx', 'Hanghatások', [0, 0.25, 0.5, 0.75, 0.9, 1], (v) => Math.round(v * 100) + '%'],
      ['textSpeed', 'Szövegsebesség', [0.6, 1, 1.5, 2.5], (v) => ({ 0.6: 'lassú', 1: 'normál', 1.5: 'gyors', 2.5: 'nagyon gyors' })[v]],
      ['autoAdvance', 'Automatikus továbblépés', [true, false], (v) => (v ? 'be' : 'ki')],
      ['qte', 'Reakcióidő (QTE)', [1.6, 1.25, 1, 0.8], (v) => ({ 1.6: 'kényelmes', 1.25: 'könnyű', 1: 'normál', 0.8: 'nehéz' })[v]],
      ['reduceFlash', 'Villogás csökkentése', [false, true], (v) => (v ? 'be' : 'ki')],
      ['grain', 'Filmszemcse', [0, 0.5, 1, 1.5], (v) => ({ 0: 'ki', 0.5: 'gyenge', 1: 'normál', 1.5: 'erős' })[v]],
    ];
    const render = () => {
      openMenu(`<div class="panel settings"><h2>Beállítások</h2>${rows.map(([k, l, , f]) => `<button data-a="${k}" class="set-row"><span>${l}</span><b>${f(st[k])}</b></button>`).join('')}
        <button data-a="fs" class="set-row"><span>Teljes képernyő</span><b>${document.fullscreenElement ? 'be' : 'ki'}</b></button>
        <div class="menu-list row"><button data-a="back">Vissza</button></div></div>`, Object.assign({
        back: () => { store.set(KEY.set, st); back(); },
        fs: () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); setTimeout(render, 300); },
      }, Object.fromEntries(rows.map(([k, , vals]) => [k, () => { const i = vals.indexOf(st[k]); st[k] = vals[(i + 1) % vals.length]; applySettings(); render(); }]))));
    };
    render();
  }

  function applySettings() {
    const st = G.settings;
    AU.setVolume('master', st.master); AU.setVolume('music', st.music); AU.setVolume('sfx', st.sfx);
    R.state.reduce = !!st.reduceFlash; R.state.grain = 0.07 * st.grain;
    store.set(KEY.set, st);
  }

  function galleryScreen() {
    const got = store.get(KEY.end, []);
    const gal = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10'].map((k, i) => {
      const has = got.includes(k);
      return `<div class="gal ${has ? 'has' : ''}"><b>${i + 1}</b><span>${has ? esc(STORY.ENDINGS[k]) : '???'}</span><i>${has ? '' : esc(HINTS[k])}</i></div>`;
    }).join('');
    openMenu(`<div class="panel"><h2>Befejezések · ${got.length} / 10</h2><div class="gallery big">${gal}</div>
      <div class="menu-list row"><button data-a="back">Vissza</button></div></div>`, { back: () => titleScreen() });
  }

  function togglePause() {
    if (G.paused) { G.paused = false; closeMenu(); return; }
    G.paused = true;
    openMenu(`<div class="panel pause"><h2>Szünet</h2><div class="menu-list">
      <button data-a="res">Folytatás</button><button data-a="set">Beállítások</button><button data-a="ctrl">Irányítás</button><button data-a="quit">Mentés és kilépés a főmenübe</button></div></div>`, {
      res: () => { G.paused = false; closeMenu(); },
      set: () => settingsScreen(() => { G.paused = false; togglePause(); }),
      ctrl: () => controlsScreen(() => { G.paused = false; togglePause(); }),
      quit: () => { G.runId++; G.paused = false; closeMenu(); hideSubs(); hideDoc(); UI.vhs.classList.remove('show'); titleScreen(); },
    }, 'pause');
    G.menuOpen = false; // a szünetmenü ESC-re is bezárható
  }

  function newGame() {
    closeMenu();
    G.s = STORY.newState();
    G.s.naplo = [];
    store.del(KEY.save);
    play('p_1');
  }

  // ------------------------------------------------------------ indulás
  function boot() {
    buildUI();
    if (params.has('norender')) R.disabled = true;
    R.init($('#view'));
    applySettings();
    if (G.auto) {
      AU.init();
      G.s = STORY.newState(); G.s.naplo = [];
      const start = params.get('start') || 'p_1';
      play(start).catch((e) => { console.error('AUTO HIBA', e); root.__autoError = String(e && e.stack || e); });
      return;
    }
    // indító képernyő: hang engedélyezéséhez egy kattintás/gomb kell
    openMenu(`<div class="press"><div class="logo small"><span>AZ UTOLSÓ</span><span class="b">ADÁS</span></div><div class="blink">Nyomj meg egy gombot</div></div>`, {}, 'press');
    const off = push(() => { off(); AU.init(); titleScreen(); });
    document.addEventListener('click', function once() { document.removeEventListener('click', once); if (!G.menuOpen || UI.menu.classList.contains('press')) { off(); AU.init(); titleScreen(); } });
  }
  G.debug = { play, titleScreen, newGame };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);

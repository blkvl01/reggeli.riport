// Egységes bemenet két játékosnak: billentyűzet + kontroller (Gamepad API).
// Események: up, left, right, down, act, pause – játékosonként (p1, p2).
(function (root) {
  'use strict';
  const IN = (root.IN = {});
  const listeners = new Set();
  const held = { p1: {}, p2: {} }; // billentyűzet
  const padHeld = { p1: {}, p2: {} }; // kontroller
  const lastDown = { p1: {}, p2: {} };
  IN.padIndex = { p1: null, p2: null }; // melyik kontroller kié
  IN.p2Keyboard = true; // ha nincs kontroller, a 2. játékos a nyilakat használja

  const KEYS = {
    p1: { KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right', Space: 'act', KeyE: 'act', Escape: 'pause' },
    p2: { ArrowUp: 'up', ArrowLeft: 'left', ArrowDown: 'down', ArrowRight: 'right', Enter: 'act', NumpadEnter: 'act', Numpad0: 'act', ShiftRight: 'act',
      Numpad8: 'up', Numpad4: 'left', Numpad2: 'down', Numpad6: 'right', Backspace: 'pause' },
  };
  // Számbillentyűk (titkos kód) – külön csatorna
  const DIGIT = /^(Digit|Numpad)([0-9])$/;

  function emit(p, a, src) {
    lastDown[p][a] = performance.now();
    for (const fn of [...listeners]) fn(p, a, src);
  }
  IN.on = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  IN.isHeld = (p, a) => !!held[p][a] || !!padHeld[p][a];
  IN.digits = new Set();

  root.addEventListener('keydown', (e) => {
    const d = e.code.match(DIGIT);
    if (d) { for (const fn of IN.digits) fn(d[2]); }
    for (const p of ['p1', 'p2']) {
      const a = KEYS[p][e.code];
      if (!a) continue;
      if (p === 'p2' && !IN.p2Keyboard && a !== 'pause') continue;
      e.preventDefault();
      if (e.repeat) return;
      held[p][a] = true;
      emit(p, a, 'kb');
    }
  });
  root.addEventListener('keyup', (e) => {
    for (const p of ['p1', 'p2']) { const a = KEYS[p][e.code]; if (a) held[p][a] = false; }
  });
  root.addEventListener('blur', () => { held.p1 = {}; held.p2 = {}; });
  void lastDown;

  // --- kontroller ---
  const BTN = { 0: ['down', 'act'], 1: ['right'], 2: ['left'], 3: ['up'], 12: ['up'], 13: ['down'], 14: ['left'], 15: ['right'], 9: ['pause'], 8: ['pause'] };
  const prev = {};
  IN.connected = () => (navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []);

  function assignPads() {
    const pads = IN.connected();
    if (!pads.length) { IN.padIndex.p2 = null; IN.padIndex.p1 = null; return; }
    // 1 kontroller → 2. játékos. 2 kontroller → mindkettő (a billentyűzet is marad az 1. játékosnak).
    if (IN.padIndex.p2 === null || !pads.find((g) => g.index === IN.padIndex.p2)) IN.padIndex.p2 = pads[0].index;
    const other = pads.find((g) => g.index !== IN.padIndex.p2);
    IN.padIndex.p1 = other ? other.index : null;
  }
  root.addEventListener('gamepadconnected', () => { assignPads(); IN.onPadChange && IN.onPadChange(); });
  root.addEventListener('gamepaddisconnected', () => { assignPads(); IN.onPadChange && IN.onPadChange(); });

  function poll() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of ['p1', 'p2']) {
      const idx = IN.padIndex[p];
      if (idx === null || idx === undefined) continue;
      const g = pads[idx];
      if (!g) continue;
      const pv = prev[idx] || (prev[idx] = {});
      const state = {};
      g.buttons.forEach((b, i) => { if (BTN[i] && (b.pressed || b.value > 0.5)) BTN[i].forEach((a) => (state[a] = true)); });
      // bal kar mint D-pad
      const ax = g.axes[0] || 0, ay = g.axes[1] || 0;
      if (ax < -0.6) state.left = true; if (ax > 0.6) state.right = true;
      if (ay < -0.6) state.up = true; if (ay > 0.6) state.down = true;
      for (const a of ['up', 'left', 'right', 'down', 'act', 'pause']) {
        if (state[a] && !pv[a]) emit(p, a, 'pad');
        padHeld[p][a] = !!state[a];
      }
      Object.assign(pv, { up: state.up, left: state.left, right: state.right, down: state.down, act: state.act, pause: state.pause });
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);
  assignPads();

  // Kontroller-rezgés (ha támogatott)
  IN.rumble = (p, ms, strong) => {
    const idx = IN.padIndex[p];
    if (idx === null) return;
    const g = navigator.getGamepads()[idx];
    const act = g && g.vibrationActuator;
    if (act && act.playEffect) act.playEffect('dual-rumble', { duration: ms || 200, strongMagnitude: strong || 0.8, weakMagnitude: 0.5 }).catch(() => {});
  };

  // Gomb-feliratok a UI-hoz
  IN.glyph = (p, a) => {
    if (p === 'p2' && IN.padIndex.p2 !== null) return { up: 'Y', left: 'X', right: 'B', down: 'A', act: 'A', pause: 'START' }[a];
    if (p === 'p2') return { up: '↑', left: '←', right: '→', down: '↓', act: 'ENTER', pause: '⌫' }[a];
    return { up: 'W', left: 'A', right: 'D', down: 'S', act: 'SZÓKÖZ', pause: 'ESC' }[a];
  };
  IN.glyphClass = (p, a) => (p === 'p2' && IN.padIndex.p2 !== null ? 'pad pad-' + IN.glyph(p, a) : 'key');
  IN.deviceName = (p) => (p === 'p1' ? 'billentyűzet' : IN.padIndex.p2 !== null ? 'kontroller' : 'nyilak + Enter');
})(window);

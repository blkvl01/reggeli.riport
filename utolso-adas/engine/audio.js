// AZ UTOLSÓ ADÁS – procedurális hangmotor (Web Audio). Minden hang itt születik, nincs külső fájl.
(function (root) {
  'use strict';
  const A = (root.AU = {});
  let ctx = null, master, musicBus, sfxBus, ambBus, verb, verbSend, comp;
  const vol = { master: 0.9, music: 0.8, sfx: 0.9 };
  let noiseW, noiseP, noiseB;
  let current = null, currentKey = null;

  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.25;
    master = ctx.createGain(); master.gain.value = vol.master;
    master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = vol.music; musicBus.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = vol.music; ambBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = vol.sfx; sfxBus.connect(master);
    verb = ctx.createConvolver(); verb.buffer = impulse(3.2, 2.6);
    verbSend = ctx.createGain(); verbSend.gain.value = 0.35; verbSend.connect(verb); verb.connect(master);
    noiseW = noiseBuf('white'); noiseP = noiseBuf('pink'); noiseB = noiseBuf('brown');
    A.analyser = ctx.createAnalyser(); A.analyser.fftSize = 2048; comp.connect(A.analyser);
  };
  // mért kimeneti szint (RMS, csúcs) – teszteléshez
  A.level = () => {
    if (!A.analyser) return null;
    const d = new Float32Array(A.analyser.fftSize); A.analyser.getFloatTimeDomainData(d);
    let s = 0, pk = 0; for (const v of d) { s += v * v; pk = Math.max(pk, Math.abs(v)); }
    return { rms: Math.sqrt(s / d.length), peak: pk };
  };

  A.setVolume = (k, v) => {
    vol[k] = v;
    if (!ctx) return;
    if (k === 'master') master.gain.value = v;
    if (k === 'music') { musicBus.gain.value = v; ambBus.gain.value = v; }
    if (k === 'sfx') sfxBus.gain.value = v;
  };
  A.vol = vol;

  function impulse(sec, decay) {
    const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  function noiseBuf(type) {
    const len = ctx.sampleRate * 4, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'white') d[i] = w;
      else if (type === 'pink') { b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.1848) * 1.6; }
      else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    }
    return b;
  }
  const now = () => ctx.currentTime;
  function noise(type, loop) { const s = ctx.createBufferSource(); s.buffer = type === 'pink' ? noiseP : type === 'brown' ? noiseB : noiseW; s.loop = loop !== false; return s; }
  function filt(type, f, q) { const x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q !== undefined) x.Q.value = q; return x; }
  function gain(v) { const g = ctx.createGain(); g.gain.value = v; return g; }
  function osc(type, f) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; }
  function chain(...n) { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; }
  function env(g, t, a, peak, d, sus, r, end) {
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + d);
    if (end !== undefined) { g.gain.setValueAtTime(Math.max(sus, 0.0001), end); g.gain.exponentialRampToValueAtTime(0.0001, end + r); }
  }
  function lfo(rate, depth, target) { const o = osc('sine', rate), g = gain(depth); o.connect(g); g.connect(target); o.start(); return o; }

  // ----------------------------------------------------------- HANGULATOK (zene + atmoszféra), keresztáttűnéssel
  // Mindegyik egy függvény, ami egy kimeneti csomóponttal és stop()-pal tér vissza.
  const MOODS = {};

  function bed(out) { const g = gain(0); g.connect(out); return g; }

  function windLayer(g, amt) {
    const n = noise('pink'), f = filt('bandpass', 500, 0.6), gg = gain(0.35 * amt);
    chain(n, f, gg, g); n.start();
    const l1 = lfo(0.07, 260, f.frequency), l2 = lfo(0.11, 0.18 * amt, gg.gain);
    const hn = noise('white'), hf = filt('bandpass', 2400, 3), hg = gain(0.03 * amt);
    chain(hn, hf, hg, g); hn.start(); const l3 = lfo(0.19, 900, hf.frequency);
    return [n, hn, l1, l2, l3];
  }
  function rainLayer(g, amt) {
    const n = noise('white'), f = filt('highpass', 1200), f2 = filt('lowpass', 8000), gg = gain(0.12 * amt);
    chain(n, f, f2, gg, g); n.start();
    const r = noise('brown'), rf = filt('lowpass', 300), rg = gain(0.25 * amt); chain(r, rf, rg, g); r.start();
    return [n, r];
  }
  function droneLayer(g, base, amt, beat) {
    amt *= 0.5; // keverés: a mély réteg ne nyomja el a többit
    const nodes = [];
    [1, 1.5, 2, 2.997].forEach((m, i) => {
      const o = osc(i ? 'sine' : 'triangle', base * m), og = gain(amt * (i ? 0.12 / i : 0.35));
      chain(o, og, g); o.start(); nodes.push(o);
      const o2 = osc('sine', base * m + (beat || 0.7)); const o2g = gain(amt * (i ? 0.08 / i : 0.25)); chain(o2, o2g, g); o2.start(); nodes.push(o2);
    });
    const n = noise('brown'), f = filt('lowpass', 120), ng = gain(amt * 0.5); chain(n, f, ng, g); n.start(); nodes.push(n);
    // „infrahang”-érzet: lassú amplitúdó-pulzálás
    const pulse = gain(1); g.disconnect(); g.connect(pulse);
    nodes.push(lfo(0.35, 0.25, pulse.gain));
    return { nodes, out: pulse };
  }
  function padLayer(g, notes, amt, bright) {
    amt *= 1.9;
    const nodes = [], lp = filt('lowpass', bright || 900, 0.7); lp.connect(g);
    notes.forEach((f) => {
      for (const d of [-4, 4]) {
        const o = osc('sawtooth', f); o.detune.value = d; const og = gain(amt * 0.05);
        chain(o, og, lp); o.start(); nodes.push(o);
      }
    });
    nodes.push(lfo(0.08, (bright || 900) * 0.4, lp.frequency));
    return nodes;
  }
  function heartLayer(g, bpm, amt) {
    let alive = true;
    const beat = () => {
      if (!alive) return;
      const t = now();
      for (const [dt, a] of [[0, 1], [0.22, 0.7]]) {
        const o = osc('sine', 58), og = gain(0); chain(o, og, g);
        o.frequency.setValueAtTime(70, t + dt); o.frequency.exponentialRampToValueAtTime(38, t + dt + 0.14);
        env(og, t + dt, 0.008, amt * a, 0.16, 0.0001);
        o.start(t + dt); o.stop(t + dt + 0.3);
      }
      setTimeout(beat, 60000 / bpm());
    };
    beat();
    return { stop: () => (alive = false) };
  }

  // Eredeti, karcos keringő (d-moll, 3/4) – saját szerzemény, gramofon-szűrővel.
  function waltz(g, amt) {
    amt *= 1.7;
    let alive = true, step = 0;
    const lp = filt('lowpass', 2600, 0.5), hp = filt('highpass', 280), wob = gain(1);
    chain(wob, hp, lp, g);
    const crack = noise('white'), cf = filt('highpass', 3000), cg = gain(0.02 * amt); chain(crack, cf, cg, g); crack.start();
    const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
    // dallam (MIDI), 0 = szünet; 3 negyed ütemenként
    const mel = [62, 0, 65, 69, 0, 67, 65, 0, 64, 62, 0, 0, 61, 0, 64, 67, 0, 65, 64, 0, 62, 61, 0, 0,
      62, 0, 65, 69, 0, 72, 70, 0, 69, 67, 0, 65, 64, 0, 62, 61, 0, 64, 62, 0, 0, 0, 0, 0];
    const bass = [38, 45, 41, 33, 38, 45, 43, 38];
    const beat = 0.42;
    const play = () => {
      if (!alive) return;
      const t = now() + 0.03;
      const m = mel[step % mel.length];
      if (m) {
        const o = osc('triangle', N(m)), o2 = osc('sine', N(m) * 2.005), og = gain(0);
        o.detune.value = Math.sin(step * 0.7) * 12; // „ingadozó” gramofon
        chain(o, og, wob); chain(o2, og);
        env(og, t, 0.01, 0.16 * amt, 0.5, 0.02, 0.3, t + beat * 1.6);
        o.start(t); o2.start(t); o.stop(t + 2.2); o2.stop(t + 2.2);
      }
      if (step % 3 === 0) {
        const b = bass[(step / 3 | 0) % bass.length], o = osc('triangle', N(b)), og = gain(0); chain(o, og, wob);
        env(og, t, 0.01, 0.14 * amt, 0.3, 0.01, 0.2, t + 0.4); o.start(t); o.stop(t + 1);
      } else {
        const b = bass[(step / 3 | 0) % bass.length];
        [b + 12 + 3, b + 12 + 7].forEach((n) => { const o = osc('triangle', N(n)), og = gain(0); chain(o, og, wob); env(og, t, 0.01, 0.05 * amt, 0.2, 0.005, 0.1, t + 0.2); o.start(t); o.stop(t + 0.6); });
      }
      step++;
      setTimeout(play, beat * 1000);
    };
    play();
    return { stop: () => { alive = false; try { crack.stop(); } catch (e) {} } };
  }

  // Zenei dobozka (befejezésekhez)
  function musicBox(g, amt, notes, speed) {
    amt *= 1.5;
    let alive = true, i = 0;
    const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
    const play = () => {
      if (!alive) return;
      const n = notes[i % notes.length], t = now() + 0.02;
      if (n) {
        const o = osc('sine', N(n)), o2 = osc('sine', N(n) * 3.01), og = gain(0); chain(o, og, g); const o2g = gain(0.2); chain(o2, o2g, og);
        env(og, t, 0.003, 0.12 * amt, 1.4, 0.0001); o.start(t); o2.start(t); o.stop(t + 2); o2.stop(t + 2);
      }
      i++; setTimeout(play, speed * 1000);
    };
    play();
    return { stop: () => (alive = false) };
  }

  function mood(build) {
    return (fadeIn) => {
      const out = gain(0); out.connect(musicBus);
      const st = { nodes: [], stops: [] };
      build(out, st);
      out.gain.setValueAtTime(0.0001, now()); out.gain.exponentialRampToValueAtTime(1, now() + (fadeIn || 2));
      return {
        out,
        stop(fade) {
          const t = now(); out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value || 0.0001, t);
          out.gain.exponentialRampToValueAtTime(0.0001, t + (fade || 2));
          setTimeout(() => { st.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }); st.stops.forEach((s) => s.stop()); out.disconnect(); }, (fade || 2) * 1000 + 200);
        },
      };
    };
  }

  const D = (n) => 440 * Math.pow(2, (n - 69) / 12);
  MOODS.silence = mood(() => {});
  MOODS.wind = mood((o, st) => { st.nodes.push(...windLayer(o, 1)); });
  MOODS.storm = mood((o, st) => {
    st.nodes.push(...windLayer(o, 1.4), ...rainLayer(o, 1));
    const d = droneLayer(gain(1), 36, 0.35, 0.4); d.out.connect(o); st.nodes.push(...d.nodes);
  });
  MOODS.drone_low = mood((o, st) => { const g = gain(1); const d = droneLayer(g, 41, 0.5, 0.6); d.out.connect(o); st.nodes.push(...d.nodes); });
  MOODS.drone = mood((o, st) => {
    const g = gain(1); const d = droneLayer(g, 38, 0.7, 0.9); d.out.connect(o); st.nodes.push(...d.nodes);
    const hn = noise('pink'), hf = filt('bandpass', 60, 2), hg = gain(0.5); chain(hn, hf, hg, o); hn.start(); st.nodes.push(hn); // generátor-zúgás
  });
  MOODS.drone_deep = mood((o, st) => {
    const g = gain(1); const d = droneLayer(g, 31, 0.9, 1.3); d.out.connect(o); st.nodes.push(...d.nodes);
    st.nodes.push(...padLayer(o, [D(38), D(44)], 0.8, 400));
  });
  MOODS.tension_soft = mood((o, st) => { st.nodes.push(...padLayer(o, [D(50), D(53), D(57)], 0.7, 700)); const d = droneLayer(gain(1), 41, 0.3); d.out.connect(o); st.nodes.push(...d.nodes); });
  MOODS.tension = mood((o, st) => {
    st.nodes.push(...padLayer(o, [D(62), D(63), D(69)], 0.6, 1600));
    const d = droneLayer(gain(1), 36, 0.5, 1.1); d.out.connect(o); st.nodes.push(...d.nodes);
    st.stops.push(heartLayer(o, () => 72, 0.35));
  });
  MOODS.heartbeat = mood((o, st) => { st.stops.push(heartLayer(o, () => 84, 0.6)); const d = droneLayer(gain(1), 33, 0.4); d.out.connect(o); st.nodes.push(...d.nodes); });
  MOODS.heartbeat_fast = mood((o, st) => { st.stops.push(heartLayer(o, () => 128, 0.7)); st.nodes.push(...padLayer(o, [D(62), D(63)], 0.5, 2200)); const d = droneLayer(gain(1), 33, 0.5, 2); d.out.connect(o); st.nodes.push(...d.nodes); });
  MOODS.chase = mood((o, st) => {
    st.stops.push(heartLayer(o, () => 140, 0.6));
    const d = droneLayer(gain(1), 36, 0.6, 3); d.out.connect(o); st.nodes.push(...d.nodes);
    st.nodes.push(...padLayer(o, [D(57), D(58), D(64)], 0.6, 2400));
  });
  MOODS.waltz = mood((o, st) => { st.stops.push(waltz(o, 1)); });
  MOODS.numbers = mood((o, st) => {
    const c = osc('sine', 1000), cg = gain(0.015); chain(c, cg, o); c.start(); st.nodes.push(c);
    const n = noise('white'), f = filt('bandpass', 1800, 0.8), ng = gain(0.06); chain(n, f, ng, o); n.start(); st.nodes.push(n);
    const d = droneLayer(gain(1), 38, 0.4); d.out.connect(o); st.nodes.push(...d.nodes);
  });
  MOODS.tape = mood((o, st) => { const n = noise('white'), f = filt('highpass', 4000), g = gain(0.04); chain(n, f, g, o); n.start(); st.nodes.push(n); st.nodes.push(...padLayer(o, [D(45), D(52)], 0.5, 500)); });
  MOODS.grief = mood((o, st) => { st.nodes.push(...padLayer(o, [D(50), D(53), D(57), D(60)], 0.8, 900)); st.stops.push(musicBox(o, 0.6, [74, 0, 72, 69, 0, 0, 65, 0, 67, 0, 0, 0], 0.9)); });
  MOODS.sandor = mood((o, st) => { st.nodes.push(...padLayer(o, [D(41), D(48), D(53)], 0.8, 600)); });
  MOODS.archive = mood((o, st) => { st.nodes.push(...padLayer(o, [D(38), D(45), D(51)], 0.7, 700)); const d = droneLayer(gain(1), 29, 0.6); d.out.connect(o); st.nodes.push(...d.nodes); });
  MOODS.dread = mood((o, st) => { st.nodes.push(...padLayer(o, [D(36), D(42), D(48)], 0.9, 500)); st.stops.push(heartLayer(o, () => 66, 0.4)); });
  MOODS.climax = mood((o, st) => { st.stops.push(heartLayer(o, () => 150, 0.7)); st.nodes.push(...padLayer(o, [D(50), D(51), D(57), D(62)], 0.9, 3000)); });
  MOODS.fire = mood((o, st) => {
    const n = noise('brown'), f = filt('lowpass', 500), g = gain(0.7); chain(n, f, g, o); n.start(); st.nodes.push(n);
    let alive = true; st.stops.push({ stop: () => (alive = false) });
    const crackle = () => { if (!alive) return; A.sfx('crackle', 0.5); setTimeout(crackle, 60 + Math.random() * 220); }; crackle();
    st.nodes.push(...padLayer(o, [D(38), D(44)], 0.6, 600));
  });
  MOODS.resolve = mood((o, st) => { st.nodes.push(...padLayer(o, [D(50), D(57), D(62), D(65)], 0.6, 1100)); });
  MOODS.broadcast = mood((o, st) => {
    const c = osc('sine', 1000), cg = gain(0.008); chain(c, cg, o); c.start(); st.nodes.push(c);
    st.nodes.push(...padLayer(o, [D(50), D(57), D(62), D(66)], 0.8, 1800));
    st.stops.push(musicBox(o, 0.6, [62, 66, 69, 74, 0, 73, 69, 66, 64, 0, 0, 0], 0.6));
  });
  MOODS.sacrifice = mood((o, st) => { st.nodes.push(...padLayer(o, [D(47), D(54), D(59), D(62)], 0.9, 1400)); st.stops.push(heartLayer(o, () => 60, 0.5)); });
  MOODS.aftermath = mood((o, st) => { st.nodes.push(...windLayer(o, 0.5)); st.nodes.push(...padLayer(o, [D(45), D(52), D(57)], 0.5, 700)); });
  MOODS.ending_hope = mood((o, st) => { st.nodes.push(...padLayer(o, [D(50), D(57), D(62), D(66)], 0.7, 1500)); st.stops.push(musicBox(o, 0.8, [74, 0, 69, 0, 66, 69, 74, 0, 76, 0, 73, 0, 69, 0, 0, 0], 0.55)); });
  MOODS.ending_bitter = mood((o, st) => { st.nodes.push(...padLayer(o, [D(50), D(53), D(57), D(64)], 0.7, 1100)); st.stops.push(musicBox(o, 0.7, [74, 0, 72, 0, 69, 0, 65, 0, 64, 0, 62, 0, 0, 0, 0, 0], 0.6)); });
  MOODS.ending_dark = mood((o, st) => { st.stops.push(waltz(o, 0.6)); const d = droneLayer(gain(1), 33, 0.5); d.out.connect(o); st.nodes.push(...d.nodes); });

  A.music = function (key) {
    if (!ctx || key === currentKey) return;
    if (current) current.stop(2.5);
    currentKey = key;
    current = MOODS[key] ? MOODS[key](2.5) : null;
  };
  A.stopAll = () => { if (current) current.stop(1); current = null; currentKey = null; };

  // ----------------------------------------------------------- EFFEKTEK
  function out(level, wet) {
    const g = gain(level); g.connect(sfxBus);
    if (wet) { const s = gain(wet); g.connect(s); s.connect(verbSend); }
    return g;
  }
  function burst(type, dur, f, q, level, wet, ftype) {
    const t = now(), n = noise(type), fl = filt(ftype || 'bandpass', f, q), g = gain(0), o = out(level, wet);
    chain(n, fl, g, o); env(g, t, 0.005, 1, dur, 0.0001); n.start(t); n.stop(t + dur + 0.2);
    return { n, fl, g, t };
  }
  function tone(type, f1, f2, dur, level, wet) {
    const t = now(), o = osc(type, f1), g = gain(0), d = out(level, wet);
    chain(o, g, d); o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
    env(g, t, 0.005, 1, dur, 0.0001); o.start(t); o.stop(t + dur + 0.1);
  }
  const later = (ms, fn) => setTimeout(fn, ms);

  const SFX = {
    metal: () => { tone('square', 520, 380, 0.4, 0.08, 0.5); burst('white', 0.15, 3200, 4, 0.2, 0.4); },
    clank_far: () => { tone('square', 300, 220, 0.6, 0.05, 1); burst('white', 0.1, 2000, 6, 0.1, 1); },
    car_stop: () => { burst('brown', 1.5, 200, 0.6, 0.6, 0.1, 'lowpass'); later(1200, () => burst('white', 0.08, 1500, 2, 0.2, 0.2)); },
    car_leave: () => {
      const t = now(), o = osc('sawtooth', 45), g = gain(0), f = filt('lowpass', 300), d = out(0.25, 0.2);
      chain(o, f, g, d); o.frequency.linearRampToValueAtTime(70, t + 2); o.frequency.linearRampToValueAtTime(55, t + 6);
      env(g, t, 0.3, 1, 0.5, 0.6, 3, t + 3); o.start(t); o.stop(t + 7);
    },
    generator: () => {
      const t = now(), o = osc('sawtooth', 18), f = filt('lowpass', 260), g = gain(0), d = out(1, 0.3);
      chain(o, f, g, d); o.frequency.exponentialRampToValueAtTime(50, t + 2.2);
      env(g, t, 0.4, 1, 1, 0.5, 1.5, t + 2.5); o.start(t); o.stop(t + 4.5);
      for (let i = 0; i < 6; i++) later(i * 160, () => burst('brown', 0.12, 120, 1, 0.5, 0.2));
    },
    flicker: () => { for (let i = 0; i < 5; i++) later(i * 60 + Math.random() * 80, () => burst('white', 0.03, 4000, 8, 0.12, 0.1)); tone('sawtooth', 120, 118, 0.4, 0.04); },
    scream: () => { // éles, disszonáns horror-akkord + zaj
      [880, 932, 1245, 1661].forEach((f) => tone('sawtooth', f, f * 0.7, 1.1, 0.1, 0.6));
      burst('white', 0.9, 2500, 1, 0.45, 0.6);
    },
    scream_male: () => { [220, 233, 311].forEach((f) => tone('sawtooth', f, f * 0.6, 1.2, 0.07, 0.6)); burst('pink', 1, 900, 1, 0.3, 0.5); },
    impact: () => { tone('sine', 120, 35, 0.5, 0.9, 0.3); burst('white', 0.25, 1200, 0.8, 0.6, 0.5); burst('brown', 0.4, 200, 1, 0.6, 0.2); },
    impact_muffled: () => { tone('sine', 90, 30, 0.4, 0.6, 0.1); burst('brown', 0.3, 150, 1, 0.5, 0.05, 'lowpass'); },
    impact_far: () => { tone('sine', 60, 25, 1.2, 0.5, 1); burst('brown', 1, 120, 1, 0.4, 1, 'lowpass'); },
    radio_on: () => { burst('white', 0.05, 3000, 2, 0.3); tone('sine', 1000, 1000, 0.3, 0.05); },
    static: () => { const b = burst('white', 1.6, 1800, 0.6, 0.25, 0.05); b.fl.frequency.linearRampToValueAtTime(900, b.t + 1.5); },
    static_cut: () => { burst('white', 0.08, 2000, 0.6, 0.3); },
    power_down: () => { tone('sawtooth', 120, 20, 2.5, 0.3, 0.4); },
    power_down_soft: () => { tone('sine', 76, 19, 3.5, 0.4, 0.4); },
    power_up: () => { tone('sawtooth', 30, 100, 1.2, 0.15, 0.3); SFX.flicker(); },
    power_flicker: () => { tone('sawtooth', 100, 40, 0.6, 0.25, 0.3); later(500, () => SFX.flicker()); },
    door_lock: () => { tone('square', 140, 80, 0.15, 0.3, 0.6); burst('brown', 0.3, 300, 1, 0.6, 0.6); later(180, () => burst('white', 0.05, 2600, 4, 0.2, 0.6)); },
    door_slam: () => { tone('sine', 80, 30, 0.8, 1, 0.8); burst('white', 0.4, 800, 0.6, 0.8, 0.8); },
    door_open_heavy: () => { burst('white', 1.4, 5000, 0.5, 0.12, 0.3, 'highpass'); later(1200, () => SFX.door_lock()); },
    mast_creak: () => {
      const t = now(), o = osc('sawtooth', 70), f = filt('bandpass', 600, 8), g = gain(0), d = out(0.2, 0.8);
      chain(o, f, g, d); o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(95, t + 1.8);
      lfo(13, 8, o.frequency); env(g, t, 0.4, 1, 1.2, 0.3, 0.8, t + 1.8); o.start(t); o.stop(t + 3);
    },
    walkie: () => { tone('sine', 1400, 1400, 0.06, 0.08); later(70, () => tone('sine', 1800, 1800, 0.06, 0.08)); burst('white', 0.25, 2200, 1, 0.12); },
    walkie_off: () => { burst('white', 0.12, 2200, 1, 0.15); tone('sine', 900, 900, 0.05, 0.06); },
    glass: () => { tone('sine', 3200, 3000, 0.3, 0.08, 0.6); tone('sine', 4100, 3900, 0.2, 0.05, 0.6); },
    locker_open: () => { tone('sawtooth', 300, 200, 0.4, 0.06, 0.4); burst('white', 0.3, 1500, 1, 0.6, 0.5); tone('sine', 90, 40, 0.3, 0.7); },
    tape_play: () => { tone('square', 200, 200, 0.04, 0.2); burst('white', 0.06, 1500, 2, 0.3); const t = now(), o = osc('sawtooth', 55), g = gain(0), d = out(0.02); chain(o, g, d); env(g, t, 0.1, 1, 0.5, 0.6, 0.5, t + 3); o.start(t); o.stop(t + 4); },
    tape_stop: () => { tone('square', 180, 180, 0.04, 0.2); tone('sawtooth', 300, 40, 0.4, 0.04); },
    tape_snap: () => { burst('white', 0.04, 4000, 2, 0.4); tone('triangle', 900, 100, 0.2, 0.15); },
    pa_click: () => { burst('white', 0.03, 1200, 1, 0.35, 0.8); tone('sine', 60, 60, 0.15, 0.3, 0.8); },
    flare: () => { burst('white', 0.08, 2000, 0.5, 0.9, 0.6); const b = burst('pink', 1.2, 800, 0.4, 0.4, 0.4); b.fl.frequency.linearRampToValueAtTime(3000, b.t + 1.1); },
    footsteps: () => { for (let i = 0; i < 6; i++) later(i * 480, () => { tone('sine', 110, 50, 0.12, 0.35, 0.6); burst('brown', 0.08, 400, 1, 0.3, 0.6); }); },
    footsteps_far: () => { for (let i = 0; i < 8; i++) later(i * 620, () => { tone('sine', 90, 45, 0.1, 0.12, 1); if (i % 2) burst('white', 0.03, 2500, 4, 0.06, 1); }); },
    drawer: () => { burst('pink', 0.5, 700, 1, 0.3, 0.3); later(450, () => tone('square', 200, 120, 0.1, 0.1, 0.4)); },
    zap: () => { for (let i = 0; i < 8; i++) later(i * 25, () => burst('white', 0.03, 3000 + Math.random() * 3000, 2, 0.35)); tone('sawtooth', 2000, 60, 0.4, 0.12); },
    thunder: () => { burst('white', 0.15, 3000, 0.5, 0.5, 0.8); const b = burst('brown', 3.5, 180, 0.5, 1, 1, 'lowpass'); b.fl.frequency.linearRampToValueAtTime(60, b.t + 3); },
    owl: () => { [0, 500].forEach((d, i) => later(d, () => { const t = now(), o = osc('sine', 420 - i * 30), g = gain(0), dd = out(0.12, 0.9); chain(o, g, dd); lfo(6, 8, o.frequency); env(g, t, 0.05, 1, 0.3, 0.4, 0.2, t + 0.35); o.start(t); o.stop(t + 0.8); })); },
    slip: () => { burst('brown', 0.6, 400, 0.7, 0.6, 0.2); burst('white', 0.3, 900, 1, 0.3, 0.2); },
    fall: () => { const b = burst('white', 2, 1200, 0.6, 0.3, 0.8); b.fl.frequency.exponentialRampToValueAtTime(150, b.t + 2); },
    cable_snap: () => { burst('white', 0.06, 3000, 0.5, 0.9, 0.5); SFX.zap(); tone('sine', 76, 19, 2.5, 0.4, 0.5); },
    axe_door: () => { [0, 650, 1300].forEach((d) => later(d, () => { tone('sine', 140, 40, 0.3, 0.8, 0.6); burst('white', 0.2, 1500, 0.8, 0.7, 0.6); tone('square', 600, 400, 0.15, 0.08, 0.6); })); },
    gunshot: () => { burst('white', 0.18, 1500, 0.4, 0.62, 0.9); tone('sine', 150, 40, 0.3, 0.6, 0.5); },
    alarm_buzz: () => { const t = now(), o = osc('square', 220), g = gain(0), d = out(0.12, 0.4); chain(o, g, d); env(g, t, 0.01, 1, 0.1, 0.8, 0.1, t + 0.7); o.start(t); o.stop(t + 1); },
    alarm_far: () => { for (let i = 0; i < 4; i++) later(i * 900, () => tone('square', 700, 560, 0.7, 0.04, 1)); },
    vault_open: () => { burst('white', 2.2, 5000, 0.5, 0.12, 0.4, 'highpass'); tone('sawtooth', 60, 40, 3, 0.2, 0.8); later(2200, () => SFX.door_lock()); },
    struggle: () => { for (let i = 0; i < 6; i++) later(i * 180 + Math.random() * 100, () => { tone('sine', 120, 50, 0.15, 0.5); burst('pink', 0.12, 600, 1, 0.4); }); },
    fire_whoosh: () => { const b = burst('pink', 2, 300, 0.5, 0.9, 0.4); b.fl.frequency.exponentialRampToValueAtTime(2000, b.t + 1.5); },
    crackle: (lv) => { burst('white', 0.02 + Math.random() * 0.03, 1500 + Math.random() * 3000, 2, 0.25 * (lv || 1)); },
    onair: () => { tone('sine', 1000, 1000, 0.5, 0.12); later(600, () => tone('sine', 1000, 1000, 0.5, 0.12)); later(1200, () => tone('sine', 1500, 1500, 0.8, 0.12)); },
    metal_break: () => { tone('square', 500, 200, 0.5, 0.2, 0.6); burst('white', 0.4, 2500, 1, 0.7, 0.6); },
    metal_snap: () => { burst('white', 0.08, 3500, 2, 0.6, 0.4); tone('square', 900, 300, 0.25, 0.15, 0.5); },
    sting: () => { [55, 58.27, 82.4, 116.5].forEach((f) => tone('sawtooth', f, f, 2.5, 0.12, 0.8)); burst('pink', 0.2, 300, 1, 0.6, 1); },
    jump: () => { [523, 554, 740, 784, 1046].forEach((f) => tone('sawtooth', f, f * 0.98, 0.9, 0.08, 0.5)); burst('white', 0.6, 2000, 0.5, 0.6, 0.5); tone('sine', 80, 30, 0.6, 1); },
    note: () => { tone('sine', 1320, 1320, 0.25, 0.05, 0.6); later(120, () => tone('sine', 1760, 1760, 0.4, 0.04, 0.6)); },
    tick: () => { tone('square', 2400, 2400, 0.012, 0.012); },
    select: () => { tone('sine', 660, 990, 0.08, 0.06, 0.2); },
    lock: () => { tone('sine', 440, 440, 0.12, 0.08, 0.3); },
    death: () => { tone('sine', 50, 20, 3, 0.9, 0.8); [110, 116.5].forEach((f) => tone('sawtooth', f, f * 0.5, 3, 0.06, 0.9)); },
    qte_ok: () => { tone('sine', 880, 1320, 0.15, 0.08, 0.3); },
    qte_fail: () => { tone('sawtooth', 200, 80, 0.4, 0.15, 0.3); },
  };

  A.sfx = function (key, lv) {
    if (!ctx) return;
    const f = SFX[key];
    if (f) try { f(lv); } catch (e) { console.warn('sfx', key, e); }
  };

  // „Torz hang” rádión/szalagon: szótagritmusú, sávszűrt zaj – hangulat, nem érthető szöveg.
  A.garble = function (text, kind) {
    if (!ctx) return;
    const syll = Math.min(40, Math.max(3, Math.round(text.length / 3.2)));
    const base = kind === 'woman' ? 900 : kind === 'young' ? 700 : kind === 'old' ? 380 : 520;
    let t = now() + 0.05;
    const o = out(0.12, 0.2);
    for (let i = 0; i < syll; i++) {
      const n = noise('pink'), f = filt('bandpass', base * (0.8 + Math.random() * 0.6), 6), f2 = filt('bandpass', base * 2.4, 4), g = gain(0);
      chain(n, f, g, o); n.connect(f2); f2.connect(g);
      const d = 0.08 + Math.random() * 0.1;
      env(g, t, 0.02, 0.8, d, 0.0001); n.start(t); n.stop(t + d + 0.1);
      t += d + 0.04 + (Math.random() < 0.15 ? 0.15 : 0);
    }
    const st = noise('white'), sf = filt('bandpass', 2500, 0.7), sg = gain(0.04); chain(st, sf, sg, o); st.start(); st.stop(t + 0.1);
  };

  // Számállomás: beszédszintézis (magyar hang, ha van), különben sípok.
  let huVoice = null;
  function pickVoice() {
    if (!root.speechSynthesis) return;
    const vs = speechSynthesis.getVoices();
    huVoice = vs.find((v) => /^hu/i.test(v.lang)) || null;
  }
  if (root.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  A.speakNumbers = function (text) {
    if (root.speechSynthesis && huVoice) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.voice = huVoice; u.lang = huVoice.lang; u.rate = 0.72; u.pitch = 0.55; u.volume = 0.9 * vol.master;
        speechSynthesis.speak(u);
        return;
      } catch (e) { /* tovább a sípokra */ }
    }
    const words = text.split(/\s+/).length;
    for (let i = 0; i < words; i++) later(i * 520, () => tone('sine', 600 + (i % 3) * 120, 600 + (i % 3) * 120, 0.25, 0.06, 0.4));
  };
  A.stopSpeech = () => { if (root.speechSynthesis) speechSynthesis.cancel(); };
  A.ready = () => !!ctx;
})(window);

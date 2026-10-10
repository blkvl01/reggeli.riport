// AZ UTOLSÓ ADÁS – helyszín → fotó, színezés és dinamikus rétegek.
// g: színezés (b fényerő, c kontraszt, s telítettség, sep szépia, h árnyalat, night day-for-night, tint [szín, alfa, mód])
// kb: lassú kameramozgás [kezdő nagyítás, vég nagyítás, x eltolás, y eltolás]
// fx: rétegek (fog, rain, storm, mast, mastDraw, flicker, dust, dark+beams, lampMask, red, fire, smoke, …)
(function (root) {
  const P = root.R.PHOTO;
  const COOL = ['#5a7a9a', 0.35, 'soft-light'];
  const WARM = ['#ff9a50', 0.3, 'soft-light'];

  // --- KÜLSŐ ---
  P.gate_dusk = { img: 'fence', g: { b: 0.62, c: 1.2, s: 0.55, sep: 0.25, h: -12, tint: ['#ff7a3a', 0.4, 'soft-light'] }, kb: [1.04, 1.1, 0, -0.01],
    fx: { mastDraw: [0.72, 0.6, 0.08, 46], mastC: '#16100e', mast: [0.72, 0.085], fog: [0.48, 0.32, 8, 0.28, '#d09078'], fog2: [0.7, 0.3, 14, 0.18, '#a07070'] } };
  P.gate_night = { img: 'fence', g: { b: 0.95, c: 1.2, s: 0.5, night: 1 }, kb: [1.05, 1.12, 0, -0.01],
    fx: { mastDraw: [0.72, 0.6, 0.08, 46], mastC: '#05070a', mast: [0.72, 0.085], fog: [0.5, 0.3, 8, 0.3, '#56657e'], rain: 0.55, storm: 0 } };
  P.gatehouse = { img: 'fence', g: { b: 0.85, c: 1.25, s: 0.45, night: 1 }, kb: [1.1, 1.16, 0.06, 0], hand: 1,
    fx: { window: [0.13, 0.38], fog: [0.55, 0.32, 20, 0.3, '#3a4658'], rain: 0.95, storm: 1, volvo: [0.3, 0.97, 0.95] } };
  P.courtyard = { img: 'station', g: { b: 0.95, c: 1.2, s: 0.5, night: 1 }, kb: [1.03, 1.1, -0.01, 0],
    fx: { mastDraw: [0.2, 0.62, -0.05, 90], mastC: '#04060a', mast: [0.2, -0.02], windows: [[0.66, 0.45, 70], [0.74, 0.45, 60], [0.56, 0.47, 45]], fog: [0.6, 0.3, 10, 0.22, '#4a5870'] } };
  P.courtyard_storm = { img: 'station', g: { b: 0.8, c: 1.25, s: 0.4, night: 1 }, kb: [1.05, 1.12, 0, 0], hand: 1,
    fx: { mastDraw: [0.2, 0.62, -0.05, 90], mastC: '#020305', mast: [0.2, -0.02], windows: [[0.66, 0.45, 70], [0.74, 0.45, 60]], fog: [0.55, 0.35, 40, 0.3, '#2c3646'], rain: 1, rainAngle: -0.4, storm: 1 } };
  P.courtyard_dawn = { img: 'station', g: { b: 0.62, c: 1.1, s: 0.4, sep: 0.15, tint: ['#c0a0a0', 0.3, 'soft-light'] }, kb: [1.02, 1.07, 0, 0],
    fx: { mastDraw: [0.2, 0.62, -0.05, 90], mastC: '#2a2228', fog: [0.6, 0.35, 5, 0.4, '#e8cfc0'] } };
  P.tower_storm = { img: 'pylon', g: { b: 0.85, c: 1.35, s: 0.3, night: 1 }, kb: [1.03, 1.12, 0, 0.02], hand: 1,
    fx: { fog: [0.0, 0.5, 60, 0.35, '#1f2836'], rain: 1, rainAngle: -0.45, storm: 1, mast: [0.5, 0.06] } };
  P.forest_storm = { img: 'forest', g: { b: 0.8, c: 1.2, s: 0.5, h: 10 }, kb: [1.04, 1.12, 0, 0], hand: 1,
    fx: { dark: 0.62, beams: 2, beamAt: [0.5, 0.6], rain: 1, storm: 1, fog: [0.5, 0.4, 25, 0.25, '#30384a'] } };
  P.dawn_forest = { img: 'road_fog', g: { b: 0.95, c: 1.05, s: 0.6 }, kb: [1.03, 1.08, 0, 0], fx: { fog: [0.4, 0.4, 6, 0.35, '#c8d0dc'] } };
  P.ravine = { img: 'gorge', g: { b: 0.85, c: 1.3, s: 0.35, night: 1 }, kb: [1.05, 1.12, 0, 0.02], hand: 1,
    fx: { dark: 0.7, beams: 2, beamAt: [0.4, 0.62], beamSpread: 220, rain: 1, storm: 1, fog: [0.55, 0.4, 20, 0.3, '#232c3a'] } };
  P.dawn_valley = { img: 'valley', g: { b: 1, c: 1.05, s: 0.85 }, kb: [1.02, 1.08, 0, 0], fx: { fog: [0.55, 0.35, 4, 0.3, '#f0d8c8'] } };

  // --- BELSŐ ---
  P.corridor_lit = { img: 'corridor', g: { b: 0.85, c: 1.15, s: 0.6, tint: COOL }, kb: [1.3, 1.34, -0.15, 0], fx: { flicker: 9, dust: 0.3 } };
  P.corridor_dark = { img: 'corridor', g: { b: 0.8, c: 1.2, s: 0.45, tint: COOL }, kb: [1.3, 1.34, -0.15, 0], hand: 1, fx: { dark: 0.9, beams: 2, beamAt: [0.5, 0.55] } };
  P.corridor_red = { img: 'corridor', g: { b: 0.7, c: 1.25, s: 0.3 }, kb: [1.3, 1.34, -0.15, 0], fx: { red: 1 } };
  P.vhs_corridor = { img: 'corridor', g: { b: 0.9, c: 1.1, s: 0.5, sep: 0.25 }, kb: [1.3, 1.32, -0.15, 0], fx: { figure: [0.47, 0.7, 0.24, '#08090b'] } };
  P.locker = null; // procedurális (a folyosó a réseken át)
  P.stairs = { img: 'stairs', g: { b: 0.95, c: 1.2, s: 0.5, tint: COOL }, kb: [1.04, 1.12, 0, 0.01], hand: 1, fx: { dark: 0.78, beams: 2, beamAt: [0.55, 0.55], dust: 0.3 } };
  P.stairs_red = { img: 'stairs', g: { b: 0.7, c: 1.25, s: 0.3 }, kb: [1.04, 1.12, 0, 0.01], fx: { red: 1 } };
  P.shaft = { img: 'shaft', g: { b: 0.6, c: 1.3, s: 0.4 }, kb: [1.0, 1.15, 0, 0], fx: { red: 0.8, dust: 0.3 } };
  P.firedoor = { img: 'firedoor', g: { b: 0.65, c: 1.2, s: 0.4 }, kb: [1.03, 1.08, 0, 0], fx: { red: 0.9 } };
  P.firedoor_breach = { img: 'firedoor', g: { b: 0.65, c: 1.2, s: 0.4 }, kb: [1.05, 1.08, 0, 0], hand: 1, fx: { red: 0.9, hole: [0.29, 0.34, 0.085] } };
  P.firedoor_red = { img: 'firedoor', g: { b: 0.5, c: 1.3, s: 0.3 }, kb: [1.06, 1.1, 0, 0], fx: { red: 1.2, hole: [0.29, 0.34, 0.085] } };
  P.minus3_door = { img: 'blastdoor', g: { b: 0.7, c: 1.2, s: 0.45, tint: COOL }, kb: [1.03, 1.1, 0, 0], hand: 1,
    fx: { sign: [0.52, 0.42, 'LEZÁRVA – 1989'], panel: [0.86, 0.5], dark: 0.85, beams: 2, beamAt: [0.5, 0.45] } };
  P.vault = { img: 'vault', g: { b: 0.9, c: 1.15, s: 0.45, tint: COOL }, kb: [1.03, 1.1, -0.01, 0], hand: 1, fx: { dark: 0.72, beams: 2, beamAt: [0.45, 0.45], beamSpread: 380, dust: 0.3 } };
  P.archive = { img: 'archive', g: { b: 0.65, c: 1.3, s: 0.35, sep: 0.35, tint: WARM }, kb: [1.03, 1.1, 0, 0],
    fx: { bulb: [0.5, 0.12], dark: 0.82, lampMask: [0.5, 0.32, 620], dust: 0.5 } };
  P.archive_red = { img: 'archive', g: { b: 0.55, c: 1.3, s: 0.25 }, kb: [1.04, 1.1, 0, 0], fx: { red: 1.1 } };
  P.archive_fire = { img: 'archive', g: { b: 0.55, c: 1.3, s: 0.6, sep: 0.4 }, kb: [1.04, 1.12, 0, 0], hand: 1, fx: { fire: 1, smoke: 0.55 } };
  P.radio_room = { img: 'radio', g: { b: 0.62, c: 1.25, s: 0.45, sep: 0.2, tint: ['#6a8a70', 0.35, 'soft-light'] }, kb: [1.03, 1.1, 0, 0], fx: { flicker: 5, flickerSeed: 21, dust: 0.3 } };
  P.radio_room_dark = { img: 'radio', g: { b: 0.62, c: 1.25, s: 0.45, sep: 0.3 }, kb: [1.03, 1.08, 0, 0], fx: { lamp: [0.3, 0.75, 320], dark: 0.9, lampMask: [0.3, 0.72, 460] } };
  P.radio_room_red = { img: 'radio', g: { b: 0.55, c: 1.3, s: 0.3 }, kb: [1.04, 1.1, 0, 0], fx: { red: 1.1, smoke: 0.3 } };
  P.dani_room = { img: 'bunkerroom', g: { b: 0.7, c: 1.25, s: 0.35, sep: 0.3 }, kb: [1.03, 1.1, 0, 0], hand: 1,
    fx: { slumped: [0.46, 0.97, 0.34], dark: 0.88, beams: 2, beamAt: [0.5, 0.65], beamSpread: 200, dust: 0.6 } };
  P.generator_room = { img: 'generator', g: { b: 0.62, c: 1.25, s: 0.45, tint: COOL }, kb: [1.03, 1.1, 0, 0], gen: 1, fx: { flicker: 4, flickerSeed: 41, dust: 0.35, darkIfOff: 0.92 } };
  P.machine_room = { img: 'machine', g: { b: 0.8, c: 1.25, s: 0.35, tint: COOL }, kb: [1.03, 1.1, 0, 0], hand: 1, fx: { waves: [0.55, 0.5], dark: 0.62, beams: 2, beamAt: [0.5, 0.5] } };
  P.office = { img: 'office', g: { b: 0.9, c: 1.2, s: 0.5, sep: 0.25 }, kb: [1.03, 1.1, 0, 0], hand: 1,
    fx: { lamp: [0.68, 0.55, 280], dark: 0.85, lampMask: [0.65, 0.6, 420], beams: 1, beamAt: [0.35, 0.5], dust: 0.4 } };
  P.guard_room = { img: 'lockers', g: { b: 0.8, c: 1.15, s: 0.45, tint: COOL }, kb: [1.03, 1.1, 0, 0], fx: { flicker: 7, flickerSeed: 55, dust: 0.3 } };
  P.barracks = { img: 'barracks', g: { b: 0.6, c: 1.25, s: 0.35, tint: COOL }, kb: [1.03, 1.1, 0, 0], hand: 1, fx: { dark: 0.9, beams: 1, beamAt: [0.5, 0.6] } };
  P.asylum = { img: 'asylum', g: { b: 0.95, c: 1.1, s: 0.2, tint: ['#9ab0c0', 0.3, 'soft-light'] }, kb: [1.02, 1.08, 0, 0], fx: { dust: 0.25 } };
  P.workshop_night = { img: 'dial', g: { b: 0.9, c: 1.15, s: 0.7 }, kb: [1.02, 1.12, 0, 0], fx: { dialGlow: [0.5, 0.45] } };
  root.R.preload();
})(window);

// AZ UTOLSÓ ADÁS – automata logikai teszt.
// Véletlen döntésekkel sokszor végigjátssza a történetet, és ellenőrzi:
//  - minden hivatkozott jelenet létezik, nincs zsákutca és végtelen ciklus
//  - halott szereplő nem beszél, halott játékos nem dönt / nem kap QTE-t
//  - minden választásnak van legalább egy opciója
//  - mind a 10 befejezés elérhető, és a befejezés megegyezik a kiértékelővel
//  - minden jelenet elérhető legalább egyszer
// Futtatás: node test/logika.js [végigjátszások száma]
const path = require('path');
const dir = path.join(__dirname, '..', 'story');
const STORY = require(path.join(dir, 'core.js'));
for (const f of ['c0_prolog', 'c1_erkezes', 'c2_zaj', 'c3_ketten', 'c4_kulcsok', 'c5_adas', 'c6_epilog', 'runtime'])
  require(path.join(dir, f + '.js'));
const RT = STORY.RT;

const N = +process.argv[2] || 200000;
const FX = new Set(['title', 'chapter', 'sfx', 'music', 'flash', 'shake', 'jump', 'dark', 'wait', 'bg', 'note', 'focus',
  'doc', 'ghost', 'calm', 'sting', 'death', 'role', 'credits']);

// determinisztikus RNG (mulberry32)
function rngFrom(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hibak = new Map();
const hiba = (msg, ctx) => { if (!hibak.has(msg)) hibak.set(msg, ctx); };
const latott = new Set();
const vegek = {};
let osszBeat = 0, osszValasztas = 0;

function jatek(seed, profil) {
  const rnd = rngFrom(seed);
  const s = STORY.newState();
  let id = 'p_1';
  for (let lepes = 0; lepes < 600; lepes++) {
    let sc;
    try { sc = RT.scene(id); } catch (e) { hiba('Hiányzó jelenet: ' + id, s.ut.slice(-5)); return; }
    latott.add(id);
    RT.enter(s, sc);
    try { RT.val(sc.bg, s); RT.val(sc.music, s); } catch (e) { hiba('bg/music hiba ' + id + ': ' + e.message, s.ut.slice(-5)); }
    try {
      for (const b of RT.iterBeats(s, sc.beats)) {
        osszBeat++;
        if (b.fx) { if (!FX.has(b.fx)) hiba('Ismeretlen fx: ' + b.fx + ' @' + id); continue; }
        if (typeof b.text !== 'string' || !b.text.trim()) hiba('Üres szöveg @' + id);
        if (!STORY.CAST[b.who]) hiba('Ismeretlen beszélő ' + b.who + ' @' + id);
        if (!b.rec && RT.ELO.includes(b.who) && !RT.el(s, b.who))
          hiba('HALOTT BESZÉL: ' + b.who + ' @' + id + ': ' + b.text.slice(0, 50), s.ut.slice(-6));
      }
    } catch (e) { hiba('Beat-hiba @' + id + ': ' + e.message, s.ut.slice(-5)); return; }

    const it = RT.interaction(s, sc);
    let next;
    if (it.type === 'ending') {
      const v = STORY.ertekel(s);
      if (v !== it.code) hiba('Befejezés-eltérés ' + it.code + ' vs ' + v, s.ut.slice(-6));
      vegek[it.code] = (vegek[it.code] || 0) + 1;
      ellenoriz(s, it.code);
      return it.code;
    } else if (it.type === 'choice') {
      osszValasztas++;
      if (!it.parts.length) { hiba('Senki nem dönthet @' + id, { szerep: s.szerep, el: s.el }); return; }
      const picks = {};
      for (const p of it.parts) {
        if (!p.opts.length) { hiba('Nincs opció @' + id + ' (' + p.role + ')'); return; }
        if ((p.role === 'M' || p.role === 'L') && !s.el[p.role]) hiba('Halott játékos dönt @' + id);
        // profil: 0 = teljesen véletlen, 1 = mindig az első, 2 = mindig az utolsó opció, 3 = alapértelmezett (lejárt idő)
        const o = profil === 1 ? p.opts[0] : profil === 2 ? p.opts[p.opts.length - 1] : profil === 3 ? p.opts.find((x) => x.k === p.def) : p.opts[Math.floor(rnd() * p.opts.length)];
        picks[p.role] = o.k;
      }
      const duel = RT.needsDuel(it, picks) ? it.parts[Math.floor(rnd() * it.parts.length)].role : undefined;
      next = RT.resolveChoice(s, sc, picks, duel);
    } else if (it.type === 'qte') {
      if (it.players.some((p) => !p)) { hiba('QTE játékos nélkül @' + id + ' (' + it.role + ')', s.szerep); return; }
      if (it.role !== 'co' && (it.role === 'M' || it.role === 'L') && !s.el[it.role]) hiba('Halott kap QTE-t @' + id);
      const esely = profil === 1 ? 0.95 : profil === 2 ? 0.1 : 0.6;
      next = RT.qteResult(s, sc, rnd() < esely);
    } else if (it.type === 'dial') {
      next = RT.dialResult(s, sc, rnd() < 0.5);
    } else {
      next = RT.next(s, sc);
      if (next === undefined) { hiba('Zsákutca (nincs then) @' + id); return; }
    }
    if (typeof next !== 'string' || !STORY.scenes[next]) { hiba('Rossz következő jelenet "' + next + '" @' + id, s.ut.slice(-5)); return; }
    id = next;
  }
  hiba('Végtelen ciklus gyanú', s.ut.slice(-12));
}

// Befejezésenkénti logikai invariánsok
function ellenoriz(s, v) {
  const elok = ['M', 'L'].filter((x) => s.el[x]).length;
  const ok = {
    E9: elok === 0,
    E7: !!s.tukor && s.el[s.tukor],
    E2: !!s.aldozat && elok === 1 && s.szalagok === 'eter',
    E8: elok === 1,
    E6: elok === 2 && s.szalagok === 'kardos',
    E3: elok === 2 && s.sandorRantotta && !s.sandor.el && s.kardos === 'halott',
    E10: elok === 2 && s.titkosKod && s.rezKi && s.sandor.el && s.kardos !== 'aktiv',
    E1: elok === 2 && s.szalagok === 'eter' && s.kardos !== 'aktiv',
    E5: elok === 2 && (s.szalagok === 'rendorseg' || s.kameraNalunk),
    E4: elok === 2,
  }[v];
  if (!ok) hiba('Invariáns sérül: ' + v, { el: s.el, szalagok: s.szalagok, kardos: s.kardos, tukor: s.tukor });
  if (s.pisztolyToltet < 0) hiba('Negatív patron');
  if (s.szalagok === 'eter' && !s.archivum) hiba('Adás archívum nélkül');
  if (s.archivum && !s.bkulcs) hiba('Archívum B kulcs nélkül');
  if (s.tukorVolt && s.rezKi && s.ut.indexOf('c4_m1') > Math.max(s.ut.indexOf('c3_8_ok'), s.ut.indexOf('c4_t_ok')) && (s.ut.includes('c3_8_ok') || s.ut.includes('c4_t_ok')))
    hiba('Tükörjelenet kikapcsolt Rezonátor után');
  if (s.sandor.szov && !s.sandor.talalkozott) hiba('Szövetséges Sándor találkozás nélkül');
  if (s.ut.includes('c5_1') && !s.archivum) hiba('Finálé archívum nélkül');
}

const t0 = Date.now();
let seed = 1;
for (let i = 0; i < N; i++) jatek(seed++, i % 10 === 0 ? 1 + (i / 10) % 3 : 0);

console.log('Végigjátszások:', N, '·', ((Date.now() - t0) / 1000).toFixed(1) + 's');
console.log('Átlag szövegsor/végigjátszás:', Math.round(osszBeat / N), '· átlag döntés:', (osszValasztas / N).toFixed(1));
console.log('\nBefejezések:');
for (const k of Object.keys(STORY.ENDINGS)) {
  const db = vegek[k] || 0;
  console.log(`  ${k.padEnd(4)} ${STORY.ENDINGS[k].padEnd(20)} ${String(db).padStart(7)}  ${((100 * db) / N).toFixed(2)}%`);
}
const nemLatott = Object.keys(STORY.scenes).filter((x) => !latott.has(x));
console.log('\nJelenetek:', Object.keys(STORY.scenes).length, '· sosem elért:', nemLatott.length ? nemLatott.join(', ') : 'nincs');
const hianyzoVeg = Object.keys(STORY.ENDINGS).filter((k) => !vegek[k]);
if (hibak.size || hianyzoVeg.length || nemLatott.length) {
  console.log('\nHIBÁK:');
  for (const [m, c] of hibak) console.log(' ✗', m, c ? JSON.stringify(c) : '');
  if (hianyzoVeg.length) console.log(' ✗ Elérhetetlen befejezés:', hianyzoVeg.join(', '));
  if (nemLatott.length) console.log(' ✗ Elérhetetlen jelenet(ek)');
  process.exit(1);
}
console.log('\n✓ Minden ellenőrzés sikeres.');

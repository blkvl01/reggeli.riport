// AZ UTOLSÓ ADÁS – történet-mag: állapot, segédfüggvények, befejezések.
// Ugyanezt a fájlt tölti be a böngészős játék és a Node-os logikai teszt.
(function (root) {
  const STORY = root.STORY || (root.STORY = { scenes: {} });

  // Szereplőkódok. Az élők ellenőrzése ezek alapján történik.
  STORY.CAST = {
    M: { name: 'Máté', color: '#7fb3d5' },
    L: { name: 'Lili', color: '#e6a0b4' },
    K: { name: 'Kertész', color: '#c9b37e' },
    S: { name: 'Sándor', color: '#9fbf8f' },
    D: { name: 'Dani', color: '#8fb0e0' },
    G: { name: 'Gergő', color: '#e0b08f' },
    R: { name: 'Rádió', color: '#b0b0b0' },
    NUM: { name: 'Számállomás', color: '#d06060' },
    N: { name: '', color: '#d8d8d8' },
  };

  STORY.newState = function () {
    return {
      fejezet: 0,
      bizalom: 5,
      exp: { M: 0, L: 0 },
      gen: null, // 'jatekosok' | 'kardos'
      genBe: false,
      rezKi: false, // véglegesen kikapcsolt Rezonátor
      titok: { M: false, L: false }, // kiderült-e
      gyanu: false, // gyanítják-e, hogy Kertész szándékosan hozta őket
      nyomok: [], // teszt_parancs, kapcsolasi_rajz, rita_naplo, dani_kazetta, dosszie, kertesz_hangja
      kazettak: [],
      sandor: { el: true, szov: false, talalkozott: false, sebesult: false, ellenseg: false },
      pisztoly: null, // 'M' | 'L'
      fejsze: null, // 'M' | 'L'
      feszito: null,
      fejszeTort: false,
      el: { M: true, L: true },
      seb: { M: 0, L: 0 },
      halalOka: { M: null, L: null },
      tukor: null, // gyilkos kódja
      szetvalt: false,
      minus3: false,
      kamera: 'szellozo', // a prológusban dől el
      kameraNalunk: false,
      bkulcs: false,
      archivum: false,
      szalagok: null, // 'eter' | 'rendorseg' | 'kardos' | 'bent'
      kardos: 'aktiv', // 'aktiv' | 'artalmatlan' | 'halott'
      tuz: false,
      aldozat: null,
      sandorRantotta: false,
      menekult: null, // 'elotte' | 'utana'
      titkosKod: false,
      kodHallotta: false,
      voltKapu: false,
      voltTorony: false,
      tukorVolt: false,
      szefProba: 0,
      pisztolyToltet: 2, // a jelzőpisztolyhoz két patron van
      walkieKi: false, // Máté kiiktatta a lehallgató walkie-talkie-t
      tudRez: false, // tudnak-e a Rezonátorról és a kikapcsolásáról
      kardosIsmert: false, // tudják-e, hogy „Kertész” = Kardos
      mateRohan: false,
      szerep: { p1: 'M', p2: 'L' }, // ki kit irányít
      ut: [], // bejárt jelenetek (döntési fához)
      dontesek: [], // {jelenet, ki, valasz}
    };
  };

  // ---- segédfüggvények (a jelenetekből hívva) ----
  const H = (STORY.H = {});
  H.nyom = (s, n) => { if (!s.nyomok.includes(n)) s.nyomok.push(n); };
  H.van = (s, n) => s.nyomok.includes(n);
  H.bizalom = (s, d) => { s.bizalom = Math.max(0, Math.min(10, s.bizalom + d)); };
  H.elok = (s) => ['M', 'L'].filter((x) => s.el[x]);
  H.masik = (x) => (x === 'M' ? 'L' : 'M');
  H.nev = (x) => STORY.CAST[x].name;
  H.rezBe = (s) => s.genBe && !s.rezKi;
  // Expozíció: csak bekapcsolt Rezonátornál nő; kint csökken.
  H.expo = (s, kik, d) => {
    for (const x of kik) {
      if (!s.el[x]) continue;
      if (d > 0 && !H.rezBe(s)) continue;
      s.exp[x] = Math.max(0, Math.min(8, s.exp[x] + d));
    }
  };
  H.hallucinal = (s, x) => H.rezBe(s) && s.exp[x] >= 3;
  H.eros = (s, x) => H.rezBe(s) && s.exp[x] >= 5;
  H.fegyverErtek = (s, x) =>
    s.pisztoly === x && s.pisztolyToltet > 0 ? 3 : (s.fejsze === x && !s.fejszeTort) || s.feszito === x ? 2 : 1;
  H.fegyverNev = (s, x) =>
    s.pisztoly === x && s.pisztolyToltet > 0 ? 'jelzőpisztoly'
      : s.fejsze === x && !s.fejszeTort ? 'fejsze' : s.feszito === x ? 'feszítővas' : 'puszta kéz';
  H.lo = (s) => { s.pisztolyToltet = Math.max(0, s.pisztolyToltet - 1); };
  H.megol = (s, x, ok) => { s.el[x] = false; s.halalOka[x] = ok; };
  H.genIndul = (s, ki) => { s.gen = ki; s.genBe = true; };
  // Szavazás: ha egyeznek a választások, az; ha nem, a „vita” (gombnyomás-párbaj) győztese dönt.
  // A motor P.duel-be írja a győztes szerepkódját, ha a döntések eltértek.
  H.valasztas = (P, kik) => {
    const v = kik.map((k) => P[k]).filter((x) => x !== undefined);
    if (v.length && v.every((x) => x === v[0])) return v[0];
    return P[P.duel] !== undefined ? P[P.duel] : v[0];
  };
  H.egyezik = (P, kik) => {
    const v = kik.map((k) => P[k]);
    return v.every((x) => x === v[0]) ? v[0] : null;
  };
  // A kazetták (és minden kulcstárgy) aki él, annál vannak.
  H.vivo = (s) => (s.el.L ? 'L' : 'M');

  // Halott vezető karakter játékosa Sándort, ha ő sem elérhető, Kardost irányítja.
  H.frissitSzerepek = (s) => {
    for (const [p, alap] of [['p1', 'M'], ['p2', 'L']]) {
      if (s.el[alap]) s.szerep[p] = alap;
      else if (s.sandor.el && s.sandor.szov) s.szerep[p] = 'S';
      else if (s.kardos === 'aktiv') s.szerep[p] = 'K';
      else s.szerep[p] = 'X'; // néző: nincs több irányítható szereplő
    }
  };

  // ---- BEFEJEZÉSEK – pontosan a TERV.md 6. fejezete szerinti sorrendben ----
  STORY.ENDINGS = {
    E1: 'Tiszta adás',
    E2: 'Az utolsó adás',
    E3: 'Apa és fia',
    E4: 'Csendes hajnal',
    E5: 'Testvér',
    E6: 'Alku',
    E7: 'Tükör',
    E8: 'Egyedül',
    E9: 'Ketten a sötétben',
    E10: 'A Hallgató',
  };

  STORY.ertekel = function (s) {
    const el = H.elok(s).length;
    if (el === 0) return 'E9';
    if (s.tukor && s.el[s.tukor]) return 'E7';
    if (s.aldozat && el === 1) return 'E2';
    if (el === 1) return 'E8';
    // innentől mindketten élnek
    if (s.szalagok === 'kardos') return 'E6';
    if (s.sandorRantotta) return 'E3';
    if (s.szalagok === 'eter' && s.kardos !== 'aktiv') {
      if (s.rezKi && s.sandor.el && s.nyomok.length >= 4 && s.titkosKod) return 'E10';
      return 'E1';
    }
    if (s.szalagok === 'rendorseg' || s.kameraNalunk) return 'E5';
    return 'E4';
  };

  // Jelenet-regisztráció
  STORY.S = function (id, def) {
    if (STORY.scenes[id]) throw new Error('Duplikált jelenet: ' + id);
    def.id = id;
    STORY.scenes[id] = def;
  };

  if (typeof module !== 'undefined') module.exports = STORY;
})(typeof window !== 'undefined' ? window : globalThis);

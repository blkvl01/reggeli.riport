// PROLÓGUS – 2010. október 17., vasárnap éjjel. Dani (1. játékos) és Gergő (2. játékos).
// Kánon: Dani mindenképp meghal. A játékos egyetlen tartós döntése: hova rejti a kamerát.
(function (root) {
  const { S, H } = root.STORY;

  S('p_1', {
    ch: 0, bg: 'gate_night', music: 'wind', vhs: true,
    enter: (s) => { s.szerep = { p1: 'D', p2: 'G' }; },
    beats: [
      ['fx', 'title', 'VK-7 · 2010. OKTÓBER 17. · 23:41'],
      ['G', 'Megy a felvétel. Mondj valamit a nézőknek.'],
      ['D', 'Sziasztok. Ez a VK-7. Nyolcvankilenc óta senki nem járt bent.'],
      ['G', 'A fórumon azt írták, a kapuoszlopban van egy doboz.'],
      ['fx', 'sfx', 'metal'],
      ['D', 'Megvan. Két kulcs.'],
      ['G', 'Ki hagy kulcsokat egy elhagyott bunkerhez?'],
      ['D', 'Valaki, aki azt akarja, hogy bejussunk.'],
    ],
    then: 'p_2',
  });

  S('p_2', {
    ch: 0, bg: 'corridor_dark', music: 'drone_low', vhs: true,
    choice: {
      by: 'both', mode: 'vote', timer: 10000,
      prompt: 'Teljes sötét. A falon egy generátor-kapcsolótábla.',
      opts: [
        { k: 'be', t: 'Bekapcsoljuk a generátort' },
        { k: 'nez', t: 'Előbb körülnézünk zseblámpával' },
      ],
      // A prológus kánon: a generátor így is, úgy is elindul.
      resolve: (s, P) => (P.D === 'nez' && P.G === 'nez' ? 'p_2b' : 'p_3'),
    },
  });

  S('p_2b', {
    ch: 0, bg: 'corridor_dark', vhs: true,
    beats: [
      ['N', 'A zseblámpa fénye egy falfeliratra esik: „CSEND”.'],
      ['G', 'Csend. Kösz, értjük.'],
      ['D', 'Hideg van, és semmit nem látok. Bekapcsolom.'],
    ],
    then: 'p_3',
  });

  S('p_3', {
    ch: 0, bg: 'corridor_lit', music: 'waltz', vhs: true,
    beats: [
      ['fx', 'sfx', 'generator'],
      ['fx', 'flash'],
      ['N', 'A neoncsövek egyenként kattannak fel. A hangosbemondóból karcos keringő szól.'],
      ['G', 'Ezt meg ki tette fel?'],
      ['D', 'Automatika. Hidegháborús cucc, magától indul.'],
      ['fx', 'music', 'drone'],
      ['D', 'Fura… mintha nyomná a fülemet.'],
      ['G', 'Nekem is. Mint repülőn.'],
      ['D', 'Lemegyek megnézni a raktárt. Te maradj itt, és vegyél fel mindent.'],
      ['G', 'Ez a horrorfilmek első szabálya, hogy ne váljunk szét.'],
      ['D', 'Két perc.'],
    ],
    then: 'p_4',
  });

  // Gergő hallucinál: a „lény” valójában a visszatérő Dani.
  S('p_4', {
    ch: 0, bg: 'corridor_lit', vhs: true,
    private: 'G',
    beats: [
      ['fx', 'sfx', 'flicker'],
      ['N', 'Négy perc telt el. A lámpák vibrálnak.'],
      ['N', 'A lépcső felől lépések jönnek felfelé. Lassan. Csoszogva.'],
      ['fx', 'music', 'tension'],
      ['N', 'Valami kiér a lépcsőfordulóba. Túl magas. A feje rossz szögben áll, mintha eltört volna a nyaka.'],
      ['N', 'Nincs arca. Csak egy sötét, nedves lyuk, ami hörög.'],
      ['fx', 'jump', 'creature'],
      ['N', 'A kezedben a falról letépett tűzoltófejsze.'],
    ],
    then: 'p_5',
  });

  S('p_5', {
    ch: 0, bg: 'stairs', vhs: true,
    private: 'D',
    beats: [
      ['N', 'Feljössz a lépcsőn. Lent nem volt semmi, csak rozsdás hordók.'],
      ['N', 'Gergő a folyosó végén áll, és a kamerát rád szegezi. Nem mozdul.'],
      ['D', 'Gergő? Mi van?'],
      ['N', 'Nem válaszol. Csak lihegni hallod. A kezében valami fémesen csillan.'],
    ],
    then: 'p_6',
  });

  S('p_6', {
    ch: 0, bg: 'corridor_lit', vhs: true,
    choice: {
      by: 'G', mode: 'solo', timer: 5000, hidden: true,
      prompt: 'Gergő: a lény közeledik.',
      opts: [
        { k: 'tamad', t: 'Rátámadsz' },
        { k: 'fut', t: 'Elfutsz' },
        { k: 'kiabal', t: 'Ráordítasz: „Ki vagy?!”' },
      ],
      default: 'tamad',
      resolve: (s, P) => 'p_7_' + P.G,
    },
  });

  S('p_7_tamad', {
    ch: 0, bg: 'corridor_lit', vhs: true,
    beats: [['fx', 'sfx', 'scream'], ['N', 'Gergő felemeli a fejszét, és előrelendül.']],
    then: 'p_8',
  });
  S('p_7_fut', {
    ch: 0, bg: 'corridor_lit', vhs: true,
    beats: [
      ['N', 'Gergő hátrál, de a lény utánanyúl. Hideg ujjak a csuklóján.'],
      ['D', 'Gergő, állj meg, én vagyok—'],
      ['N', 'Gergő csak hörgést hall. Pánikban suhint.'],
    ],
    then: 'p_8',
  });
  S('p_7_kiabal', {
    ch: 0, bg: 'corridor_lit', vhs: true,
    beats: [
      ['G', 'KI VAGY?!'],
      ['D', 'Gergő, én vagyok! Dani!'],
      ['N', 'Gergő csak egy torz, mély hangot hall, ami nem lehet emberi. A lény közelebb lép.'],
    ],
    then: 'p_8',
  });

  S('p_8', {
    ch: 0, bg: 'corridor_lit', vhs: true,
    qte: { by: 'D', kind: 'press', ms: 1100, prompt: 'Dani: ugorj félre!', ok: 'p_9a', fail: 'p_9b' },
  });

  S('p_9a', {
    ch: 0, bg: 'corridor_red', vhs: true,
    beats: [
      ['fx', 'sfx', 'impact'], ['fx', 'shake'],
      ['N', 'A fejsze a válladat éri, nem a fejedet. Meleg folyik végig a karodon.'],
      ['N', 'A kamera kicsúszik Gergő kezéből. Felkapod, és rohansz lefelé.'],
    ],
    then: 'p_10',
  });
  S('p_9b', {
    ch: 0, bg: 'corridor_red', vhs: true,
    beats: [
      ['fx', 'sfx', 'impact'], ['fx', 'shake'], ['fx', 'flash', 'red'],
      ['N', 'A penge az oldaladba mar. Felüvöltesz.'],
      ['N', 'Gergő hátratántorodik, és elejti a kamerát. Felkapod, és lebotladozol a lépcsőn.'],
    ],
    then: 'p_10',
  });

  S('p_10', {
    ch: 0, bg: 'radio_room', music: 'drone_low', vhs: true,
    beats: [
      ['N', '-3. szint. Vészrádiószoba. Az ajtó elektromosan záródik mögötted.'],
      ['fx', 'sfx', 'radio_on'],
      ['D', 'Ha valaki hallja ezt… VK-7, Vadkő-tető. A barátom… valami van itt.'],
      ['D', 'Ne kapcsolják be a generátort. Ismétlem: ne kapcsolják be a generátort…'],
      ['fx', 'sfx', 'static'],
    ],
    then: 'p_11',
  });

  S('p_11', {
    ch: 0, bg: 'radio_room', vhs: true,
    choice: {
      by: 'D', mode: 'solo', timer: 9000,
      prompt: 'Dani: el kell rejtened a kamerát, mielőtt valaki elveszi.',
      opts: [
        { k: 'szellozo', t: 'A szellőzőnyílásba' },
        { k: 'alatta', t: 'Magad alá, a kabátod alá' },
      ],
      default: 'alatta',
      resolve: (s, P) => { s.kamera = P.D; return 'p_12'; },
    },
  });

  S('p_12', {
    ch: 0, bg: 'radio_room', vhs: true,
    beats: [
      ['D', 'Máté… ha valaha megtalálod… bocs, öcsi.'],
      ['fx', 'sfx', 'power_down'],
      ['fx', 'dark'],
      ['N', 'Valahol fent leáll a generátor. A fények kialszanak.'],
      ['fx', 'sfx', 'door_lock'],
      ['N', 'Az ajtó zárja kattan. Aztán csend.'],
      ['D', 'Ne… ne, ne, ne—'],
      ['fx', 'wait', 1800],
      ['fx', 'title', 'AZ UTOLSÓ ADÁS'],
      ['fx', 'title', 'Tizenhat évvel később'],
    ],
    then: 'c1_1',
  });
})(typeof window !== 'undefined' ? window : globalThis);

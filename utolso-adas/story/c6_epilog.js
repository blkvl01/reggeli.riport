// EPILÓGUS – a 10 befejezés. A kiértékelés a core.js STORY.ertekel() függvényében van.
(function (root) {
  const STORY = root.STORY;
  const { S, H } = STORY;

  S('epilog', {
    ch: 6, bg: 'black',
    then: (s) => 'ep_' + STORY.ertekel(s),
  });

  // --- közös epilógus-töredékek ---
  const parkapcsolat = (s) =>
    s.bizalom >= 8
      ? 'Egy évvel később Máté megkérte Lili kezét. A gyűrűt egy rádióadó réz alkatrészéből csinálta.'
      : s.bizalom >= 5
        ? 'Együtt maradtak. De vannak éjszakák, amikor egyikük sem alszik, csak fogják egymás kezét a sötétben.'
        : 'Nem maradtak együtt. Túl sok volt a titok. Lili néha még meghallgatja a felvételt, amin Máté nevet.';

  const sandorSorsa = (s) =>
    s.sandor.el
      ? 'Sándor 38 év után először aludt fedett helyen. Kiköltözött az erdőből, és vett egy lemezjátszót. Csak vidám zenét hallgat.'
      : s.sandorRantotta
        ? null
        : s.sandor.talalkozott
          ? 'Kardos Sándort az erdészház mögött temették el. A sírjára valaki egy gázálarcot tett, üvegével lefelé.'
          : null;

  const kardosSorsa = (s) =>
    s.kardos === 'halott'
      ? null
      : s.szalagok !== 'eter' && s.szalagok !== 'rendorseg' && s.kameraNalunk
        ? s.kardosIsmert
          ? 'Dani felvétele és a dosszié alapján Kardos Bélát a 2010-es halálesetek miatt ítélték el. A CSEND-ről a tárgyaláson senki nem kérdezett.'
          : 'Dani felvétele alapján újranyitották az ügyet. A nyomok egy Kertész Béla nevű emberhez vezettek, aki nem létezik.'
      : s.szalagok === 'eter' || s.szalagok === 'rendorseg'
        ? 'Kardos Bélát ' + (9 + ['M', 'L'].filter((x) => !s.el[x]).length + (s.sandor.el ? 0 : 1)) +
          ' ember haláláért és embereken végzett titkos kísérletekért ítélték el. A tárgyaláson egyetlen szót sem szólt.'
        : 'Kardos Béla ellen nem emeltek vádat. A hivatalos jelentés szerint a VK-7-en „szén-monoxid-szivárgás” történt. Megint.';

  const sor = (fn) => ({ if: (s) => !!fn(s), then: [['N', fn]] });
  const zaro = [
    ['fx', 'wait', 1200],
    ['N', 'A VK-7-et novemberben lebontották. Az antennatornyot utolsóként döntötték le. Vasárnap.'],
  ];

  // 1 – TISZTA ADÁS
  S('ep_E1', {
    ch: 6, bg: 'dawn_valley', music: 'ending_hope', ending: 'E1',
    beats: [
      { if: (s) => s.el.L, then: [['L', 'Ez a Zajszint 48. epizódja. A címe: Az utolsó adás. Egy éjszakáról szól, amit majdnem nem éltünk túl.', { name: 'Lili · podcast' }]] },
      ['N', 'Az adást a völgyben százak hallották élőben. Két nappal később már milliók.'],
      ['N', 'A CSEND-archívumot feloldották. Az 1988-as műszak öt áldozatának nevét felolvasták a parlamentben.'],
      sor(kardosSorsa),
      ['N', 'Kerekes Danit Miskolcon temették el, az anyjuk mellé. Máté a koporsóra tette a régi cipősdoboz-rádiót.'],
      sor(sandorSorsa),
      sor(parkapcsolat),
      ...zaro,
    ],
  });

  // 10 – A HALLGATÓ (titkos): mint az 1-es, de a stáblista után…
  S('ep_E10', {
    ch: 6, bg: 'dawn_valley', music: 'ending_hope', ending: 'E10',
    beats: [
      { if: (s) => s.el.L, then: [['L', 'Ez a Zajszint 48. epizódja. A címe: Az utolsó adás.', { name: 'Lili · podcast' }]] },
      ['N', 'Az adást milliók hallották. A CSEND-archívumot feloldották. Kardos Bélát elítélték.'],
      ['N', 'Danit az anyjuk mellé temették. Sándor kiköltözött az erdőből.'],
      sor(parkapcsolat),
      ...zaro,
      ['fx', 'credits'],
      ['fx', 'bg', 'workshop_night'],
      ['fx', 'music', 'silence'],
      ['fx', 'title', 'Három hónappal később'],
      ['N', 'Máté műhelyében, a polcon áll a VK-7 adójának frekvenciatárcsája. Emlékbe hozta haza. Nincs bedugva. Nincs benne elem.'],
      ['N', 'Hajnali 3:14-kor a tárcsa halványan felvilágosodik.'],
      ['fx', 'sfx', 'static'],
      ['NUM', 'Figyelem. Figyelem. Máté. Lili.'],
      ['NUM', 'Láttam a fényképet a tárcádban. Láttam a diktafont a zsebedben.'],
      ['NUM', 'Láttam, mit láttatok az ajtó résén át. Senki más nem látta.'],
      ['NUM', 'Köszönöm, hogy meghallgattatok.'],
      ['fx', 'sfx', 'static_cut'],
      ['fx', 'dark'],
      ['N', 'A Rezonátort leszerelték. Az adó áram nélkül van. Ezt senki nem tudja megmagyarázni.'],
    ],
  });

  // 2 – AZ UTOLSÓ ADÁS
  S('ep_E2', {
    ch: 6, bg: 'dawn_valley', music: 'ending_bitter', ending: 'E2',
    beats: [
      ['N', (s) => 'Az adás hat percig tartott. ' + H.nev(s.aldozat) + ' végig nyomva tartotta a gombot.'],
      { if: (s) => s.el.L, then: [['L', 'Ezt az epizódot nem én akartam elkészíteni. Ő akarta. Én csak befejeztem.', { name: 'Lili · podcast' }]] },
      { if: (s) => s.el.M, then: [['N', 'Máté a közmédiánál lett rádiómérnök. Minden év október 18-án éjjel egy percre elnémítja az adót.']] },
      ['N', 'Kardos Bélát két nappal később a határon fogták el. A felvételeket az egész ország hallotta.'],
      sor(sandorSorsa),
      ['N', 'Danit és őt egymás mellé temették. A sírkövükre egy rádiófrekvenciát vésettek.'],
      ...zaro,
    ],
  });

  // 3 – APA ÉS FIA
  S('ep_E3', {
    ch: 6, bg: 'dawn_valley', music: 'ending_bitter', ending: 'E3',
    beats: [
      ['N', 'A bontási brigád a liftakna alján egymás mellett találta meg őket. Apát és fiát.'],
      ['N', 'Sándor keze az apja kabátját markolta. Kardosé a fiáét.'],
      { if: (s) => s.szalagok === 'eter', then: [['N', 'A CSEND-szalagok élő adásban mentek ki. A tárgyalásra már nem volt szükség.']] },
      { if: (s) => s.szalagok === 'rendorseg', then: [['N', 'Máté és Lili a szalagokkal reggel hétkor besétált a miskolci rendőrkapitányságra. Délre a minisztérium is ott volt.']] },
      { if: (s) => s.szalagok === 'bent' || !s.szalagok, then: [['N', 'A szalagok odalent maradtak. De két holttest egy liftaknában már elég volt ahhoz, hogy valaki kérdezni kezdjen.']] },
      ['N', 'Danit hazavitték, az anyjuk mellé.'],
      sor(parkapcsolat),
      ...zaro,
    ],
  });

  // 4 – CSENDES HAJNAL
  S('ep_E4', {
    ch: 6, bg: 'dawn_valley', music: 'ending_dark', ending: 'E4',
    beats: [
      ['N', 'Túléltétek. A rendőrség felvette a jegyzőkönyvet, és megköszönte.'],
      { if: (s) => s.kardosIsmert, then: [['N', 'Feljelentést tettetek Kardos Béla ellen. A nyomozást bizonyíték hiányában három hét után lezárták.']] },
      { if: (s) => !s.kardosIsmert, then: [['N', 'Kertész Béla nevű ember nem létezik. A fantomcég megszűnt. A Volvót senki nem látta.']] },
      { if: (s) => s.minus3, then: [['N', 'A bontás előtti bejáráson a -3. szinten találtak egy holttestet. Azonosítás folyamatban. Fél év óta.']] },
      sor(parkapcsolat),
      ['fx', 'wait', 1200],
      ['fx', 'bg', 'laptop_night'],
      ['fx', 'title', 'A következő szombaton'],
      ['N', 'Debrecen, egy albérlet. Egy lány megnyit egy névtelen e-mailt. Egy hangfájl és egy mondat:'],
      ['N', '„A Szabó-ügy nincs lezárva. VK-7.”'],
      ['N', 'A bontás csak novemberben kezdődik. Addig még három vasárnap van.'],
    ],
  });

  // 5 – TESTVÉR
  S('ep_E5', {
    ch: 6, bg: 'dawn_valley', music: 'ending_hope', ending: 'E5',
    beats: [
      { if: (s) => s.kameraNalunk, then: [['N', 'Dani kamerájának felvételét egy héttel később a bíróság is megnézte. Gergő szemszögéből. Dani hangjával.']] },
      { if: (s) => s.szalagok === 'rendorseg', then: [['N', 'A CSEND-szalagokat egy hónapig hallgatták a nyomozók. Az egyikük utána felmondott.']] },
      sor(kardosSorsa),
      ['N', 'Danit Miskolcon temették el, az anyjuk mellé. Tizenhat év után valaki végre virágot vitt neki.'],
      { if: (s) => s.el.M, then: [['M', 'Megtaláltalak, tesó. Elkéstem, de megtaláltalak.']] },
      { if: (s) => s.szalagok !== 'rendorseg', then: [['N', 'Az Archívum a bontással együtt eltűnt. A CSEND-ről soha senki nem beszélt nyilvánosan.']] },
      sor(sandorSorsa),
      sor(parkapcsolat),
      ...zaro,
    ],
  });

  // 6 – ALKU
  S('ep_E6', {
    ch: 6, bg: 'dawn_valley', music: 'ending_dark', ending: 'E6',
    beats: [
      ['N', 'A szalagok Kardosnál maradtak. A rendőrség meghallgatta a vallomásotokat, aztán meghallgatta Kardos ügyvédjét.'],
      { if: (s) => s.el.L, then: [['N', 'Lili epizódját „ügyes kitalációnak” nevezték a kommentekben. Leszedte.']] },
      sor(sandorSorsa),
      sor(parkapcsolat),
      ['fx', 'wait', 1200],
      ['fx', 'bg', 'tv_static'],
      ['fx', 'title', 'Fél évvel később'],
      ['N', 'Egy külföldi hírcsatorna: „Megmagyarázhatatlan tömeghisztéria egy tüntetésen. A résztvevők egymást látták szörnynek.”'],
      ['N', 'A felvétel háttérzajában, ha nagyon figyelsz, egy karcos keringő szól.'],
    ],
  });

  // 7 – TÜKÖR
  S('ep_E7', {
    ch: 6, bg: 'asylum', music: 'ending_dark', ending: 'E7',
    beats: [
      ['N', (s) => H.nev(s.tukor) + ' azt mondta a rendőröknek, hogy egy szörnyet ölt meg. A rendőrök egy holttestet találtak.'],
      { if: (s) => s.szalagok === 'eter' || s.szalagok === 'rendorseg', then: [
        ['N', 'A CSEND-szalagok alapján a bíróság felmentette. Beszámíthatatlan állapot, idegen behatás.'],
        ['N', 'A bíróság felmentette. Ő nem mentette fel önmagát.'],
      ] },
      { if: (s) => !(s.szalagok === 'eter' || s.szalagok === 'rendorseg'), then: [
        ['N', 'A szakértők szerint pszichotikus epizód. Zárt osztály, határozatlan ideig.'],
        ['N', 'Éjszakánként a falat nézi, és a párja nevét suttogja. Hogy legközelebb időben kimondja.'],
      ] },
      sor(kardosSorsa),
      ['fx', 'wait', 1200],
      ['fx', 'bg', 'guard_room'],
      ['fx', 'title', 'Valamikor később'],
      ['N', 'Egy új pár az őrszobában. Az asztalon egy kazetta, rajta filccel: VISSZHANG 3.'],
      ['fx', 'sfx', 'tape_play'],
      ['R', (s) => (s.tukor === 'M' ? 'Lili? Lili, kérlek… mit csináltam…' : 'Máté? Máté, kérlek… mit csináltam…'), { name: 'Kazetta', voice: 'tape' }],
      ['fx', 'sfx', 'tape_stop'],
      ['N', 'Mindig ugyanaz lesz.'],
    ],
  });

  // 8 – EGYEDÜL
  const halalOk = (s, x) =>
    ({
      szakadek: 'lezuhant a szakadékba, ugyanott, ahol Gergő',
      kardos: 'Kardos golyójától halt meg',
      aldozat: 'az adóteremben maradt',
      tukor: 'meghalt a tűzgátló ajtónál',
    })[s.halalOka[x]] || 'nem jött haza';

  S('ep_E8', {
    ch: 6, bg: 'dawn_valley', music: 'ending_bitter', ending: 'E8',
    beats: [
      ['N', (s) => { const h = ['M', 'L'].find((x) => !s.el[x]); return H.nev(h) + ' ' + halalOk(s, h) + '.'; }],
      ['N', (s) => H.nev(H.elok(s)[0]) + ' egyedül ért le a völgybe. Senkinek nem szólt egy szót sem két napig.'],
      { if: (s) => s.szalagok === 'eter' || s.szalagok === 'rendorseg', then: [['N', 'A szalagok eljutottak oda, ahova kellett. Ez az egyetlen, amiért megérte.']] },
      { if: (s) => s.szalagok === 'kardos', then: [['N', 'A szalagok Kardosnál maradtak. A túlélő vallomásának senki nem hitt.']] },
      { if: (s) => s.kameraNalunk && s.szalagok !== 'eter' && s.szalagok !== 'rendorseg', then: [['N', 'Csak Dani kamerája maradt bizonyítéknak. Arra elég volt, hogy újranyissák a 2010-es ügyet.']] },
      sor(kardosSorsa),
      sor(sandorSorsa),
      { if: (s) => s.el.L, then: [['L', 'Minden epizódot azzal kezdek, hogy kimondom a nevét. Hogy ne legyen csend.', { name: 'Lili · podcast' }]] },
      { if: (s) => s.el.M, then: [['N', 'Máté azóta minden éjjel bekapcsolva hagyja a rádiót. Csak zúgás jön belőle. De ő hallgatja.']] },
      ...zaro,
    ],
  });

  // 9 – KETTEN A SÖTÉTBEN
  S('ep_E9', {
    ch: 6, bg: 'black_rain', music: 'ending_dark', ending: 'E9',
    beats: [
      { if: (s) => s.szalagok === 'eter', then: [
        ['N', 'Az adás kiment. Hat perc. A völgyben százak hallották, két nap múlva milliók.'],
        ['N', 'Akik beszéltek benne, már nem láthatták.'],
        sor(kardosSorsa),
      ] },
      { if: (s) => s.szalagok !== 'eter' && s.halalOka.M === 'szakadek' && s.halalOka.L === 'szakadek', then: [
        ['N', 'A hivatalos jelentés szerint két turista a viharban lezuhant a Vadkő-tető alatti szakadékba. Ugyanoda, ahova 2010-ben Fehér Gergő.'],
      ] },
      { if: (s) => s.szalagok !== 'eter' && !(s.halalOka.M === 'szakadek' && s.halalOka.L === 'szakadek'), then: [
        { if: (s) => s.kardos !== 'halott', then: [['N', 'Hajnalban Kardos egyedül ment le a -2-re. Megállt egy pillanatra, aztán elvégezte, amiért jött.']] },
        ['N', 'A jelentés szerint két fiatal turista szén-monoxid-mérgezésben hunyt el egy elhagyott katonai létesítményben.'],
      ] },
      { if: (s) => s.halalOka.M === s.halalOka.L && s.halalOka.M !== 'szakadek', then: [['N', 'Egymás mellett találták meg őket. A kezük összeért.']] },
      { if: (s) => s.halalOka.M !== s.halalOka.L, then: [['N', 'Két holttest, két különböző helyen. Ugyanazon az éjszakán, ugyanazért.']] },
      { if: (s) => s.el.L === false && !s.titok.L, then: [['N', 'Lili zsebében a diktafon a végéig forgott. Senki nem hallgatta meg.']] },
      { if: (s) => s.szalagok !== 'eter', then: [
        ['fx', 'wait', 1200],
        ['fx', 'bg', 'laptop_night'],
        ['N', 'A következő héten egy új e-mail indul útnak. Egy hangfájl és egy mondat.'],
      ] },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);

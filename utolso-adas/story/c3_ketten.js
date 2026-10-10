// 3. FEJEZET – KETTEN. Iroda, Archívum-ajtó, a -3, Dani, a kamera, Sándor.
(function (root) {
  const { S, H } = root.STORY;

  S('c3_1', {
    ch: 3, bg: 'office', music: 'drone',
    enter: (s) => { s.fejezet = 3; H.expo(s, ['M', 'L'], 1); },
    beats: [
      ['fx', 'chapter', '3. fejezet · KETTEN'],
      ['N', '-1. szint. A folyosó végén egy ajtó: „PK. IRODA – BELÉPNI TILOS”. Résnyire nyitva.'],
      ['N', 'Bent minden úgy maradt, ahogy 1988-ban. A hamutálban csikk, a falon a Szovjetunió térképe.'],
      { if: (s) => H.hallucinal(s, 'L'), then: [['fx', 'ghost'], ['N', 'Lili a sarokban egy ülő alakot lát. A lámpa felé fordul: egy kabát egy széken.']] },
      ['M', 'Két helyre jut időnk, mielőtt ez a nyomás szétveri a fejem.'],
    ],
    choice: {
      by: 'both', mode: 'vote', timer: 14000,
      prompt: 'Mindketten válasszatok egy helyet. Ha ugyanazt választjátok, csak egy dolgot találtok.',
      opts: [
        { k: 'irat', t: 'Iratszekrény' },
        { k: 'asztal', t: 'Íróasztal' },
        { k: 'lemez', t: 'Lemezjátszó és kazetták' },
        { k: 'fiok', t: 'Az íróasztal alsó fiókja' },
      ],
      default: 'irat',
      resolve: (s, P) => {
        s.irodaValasztas = [...new Set([P.M, P.L])];
        return 'c3_1_' + s.irodaValasztas[0];
      },
    },
  });

  // Az irodai jelenetek láncban: az első után a második választás jön, ha volt.
  const kovetkezoIroda = (s, ez) => {
    const i = s.irodaValasztas.indexOf(ez);
    const k = s.irodaValasztas[i + 1];
    return k ? 'c3_1_' + k : (s.gyanu ? 'c3_walkie' : 'c3_2');
  };

  S('c3_1_irat', {
    ch: 3, bg: 'office',
    enter: (s) => H.nyom(s, 'teszt_parancs'),
    beats: [
      ['fx', 'doc', 'order'],
      ['N', '„SZIGORÚAN TITKOS. 1988. XI. 13. CSEND-program, teljes teljesítményű éjszakai teszt.”'],
      ['N', '„Az éjszakai műszak NEM ÉRTESÍTENDŐ. A reakciókat rögzíteni.” Aláírás: Kardos B. százados.'],
      ['N', 'A lap sarkára egy igazolványkép van tűzve. Egy negyvenes, keskeny arcú tiszt.'],
      { if: (s) => s.gyanu, then: [['L', 'Ezt az arcot… mintha láttam volna már.'], ['M', 'Harmincnyolc éves kép. Bárki lehet.']] },
      ['L', 'Nem értesítendő? Szóval tudták, hogy mi fog történni.'],
      ['fx', 'note', 'Nyom: A teszt parancsa'],
    ],
    then: (s) => kovetkezoIroda(s, 'irat'),
  });

  S('c3_1_asztal', {
    ch: 3, bg: 'office',
    enter: (s) => { H.nyom(s, 'kapcsolasi_rajz'); s.tudRez = true; },
    beats: [
      ['fx', 'doc', 'schematic'],
      ['N', 'Az asztalon kapcsolási rajz, tussal, gondos kézírással. A címe: „REZONÁTOR – 19 Hz”.'],
      ['M', 'Ez nem rádió. Ez egy infrahang-generátor.'],
      ['L', 'Magyarul?'],
      ['M', 'Tizenkilenc hertz. Ezt nem halljuk, de a testünk érzi. A szemgolyó ezen a frekvencián rezonál.'],
      ['M', 'Szorongás. Nyomás a fülben. Alakok a szemed sarkában.'],
      ['L', 'Szóval amit láttunk…'],
      ['M', 'Lehet, hogy nem is volt ott. Ez nem szellem, Lili. Ez egy gép.'],
      ['M', 'Itt van, hogyan kell kikapcsolni: a vezérlőszekrény a -2-n van, a tápkábel a torony tövében, egy aknában.'],
      ['fx', 'note', 'Nyom: A kapcsolási rajz'],
    ],
    then: (s) => kovetkezoIroda(s, 'asztal'),
  });

  S('c3_1_lemez', {
    ch: 3, bg: 'office',
    beats: [
      ['N', 'A lemezjátszó mellett egy kazetta, rajta filccel: VISSZHANG 2. Mellette egy cetli: „HALLGASD MEG.”'],
      ['N', 'A szalag kitekeredett, és összegabalyodott.'],
      ['L', 'Kell egy ceruza. Ezt minden kilencvenes gyerek tudja.'],
    ],
    qte: { by: 'L', kind: 'mash', count: 16, ms: 5000, prompt: 'Lili: tekerd vissza ceruzával! Nyomd gyorsan!', ok: 'c3_1_lemez_ok', fail: 'c3_1_lemez_szakadt' },
  });

  S('c3_1_lemez_ok', {
    ch: 3, bg: 'office',
    enter: (s) => { s.gyanu = true; if (!s.kazettak.includes(2)) s.kazettak.push(2); },
    beats: [
      ['fx', 'sfx', 'tape_play'],
      ['R', '…két kulcs… egyszerre kell elfordítani… ő kint vár, a kapunál…', { name: 'Kazetta', voice: 'man' }],
      ['R', '…mindig vasárnap jön… Rita, ne nézz rám így… én vagyok…', { name: 'Kazetta', voice: 'man' }],
      ['fx', 'sfx', 'tape_stop'],
      ['M', 'Két kulcs. Mint a raktárajtón.'],
      ['L', '„Ő kint vár.” Máté… Kertész is kint vár.'],
    ],
    then: (s) => kovetkezoIroda(s, 'lemez'),
  });

  S('c3_1_lemez_szakadt', {
    ch: 3, bg: 'office',
    beats: [
      ['fx', 'sfx', 'tape_snap'],
      ['N', 'A szalag elpattan a ceruzán. Egy darabig még pörög az üres orsó.'],
      ['L', 'A francba.'],
    ],
    then: (s) => kovetkezoIroda(s, 'lemez'),
  });

  S('c3_1_fiok', {
    ch: 3, bg: 'office',
    beats: [
      ['fx', 'sfx', 'drawer'],
      ['fx', 'jump', 'rat'],
      ['N', 'Egy patkány ugrik ki a fiókból. Valaki felsikolt, és csak utána jön rá, hogy ő volt az.'],
      ['N', 'A fiók alján egy csoportkép: hat fiatal sorkatona az antennatorony előtt, 1988 nyarán.'],
      ['N', 'A hátoldalán: „Éjszakai műszak. Isten óvjon minket.” Öt névre ceruzával kereszt van húzva. A hatodikra nem.'],
      ['N', 'A hatodik név: „S.”'],
    ],
    then: (s) => kovetkezoIroda(s, 'fiok'),
  });

  // Gyanú esetén Máté rájön: a walkie-talkie folyamatosan ad.
  S('c3_walkie', {
    ch: 3, bg: 'office',
    beats: [
      ['L', 'Honnan tud mindent? Hogy kiabáltunk, hogy hol vagyunk?'],
      ['N', 'Máté a walkie-talkie-ra néz. Az adásjelző LED halványan, folyamatosan világít.'],
      ['M', 'Ez végig adott. A beszélőgomb le van ragasztva a burkolat alatt.'],
    ],
    choice: {
      by: 'M', mode: 'solo', timer: 10000, echo: true,
      prompt: 'Máté: Kertész mindent hall, amit mondotok.',
      opts: [
        { k: 'kiiktat', t: 'Kiiktatod: kiveszed az elemet' },
        { k: 'hagy', t: 'Hagyod. Jobb, ha nem tudja, hogy rájöttetek.' },
      ],
      default: 'hagy',
      resolve: (s, P) => { s.walkieKi = P.M === 'kiiktat'; return 'c3_walkie_' + P.M; },
    },
  });

  S('c3_walkie_kiiktat', {
    ch: 3, bg: 'office',
    beats: [
      ['fx', 'sfx', 'walkie_off'],
      ['N', 'A LED kialszik. Máté zsebre teszi az elemet.'],
      ['M', 'Most már ő sem lát minket.'],
    ],
    then: 'c3_2',
  });

  S('c3_walkie_hagy', {
    ch: 3, bg: 'office',
    beats: [
      ['N', 'Máté visszarakja az övére a walkie-t. A szájához emeli az ujját: innentől csak suttogva.'],
      ['L', '(suttogva) Akkor hadd higgye, hogy semmit nem tudunk.'],
    ],
    then: 'c3_2',
  });

  S('c3_2', {
    ch: 3, bg: 'vault', music: 'drone',
    enter: (s) => H.expo(s, ['M', 'L'], 1),
    beats: [
      ['N', '-2. szint. Egy kerek acélajtó, két méter átmérőjű. Fölötte stencilezve: „ARCHÍVUM · KÉTKULCSOS ELJÁRÁS”.'],
      ['N', 'Két kulcslyuk van rajta, három méterre egymástól. Egy ember nem éri el egyszerre mindkettőt.'],
      ['N', 'Máté kulcsa a bal oldaliba illik.'],
      ['M', '„Raktárkulcs.” Hát persze.'],
      ['L', 'Kétember-szabály. Mint az atomtengeralattjárókon. A jobb oldalihoz nincs kulcsunk.'],
      { if: (s) => !s.walkieKi, then: [
        ['fx', 'sfx', 'walkie'],
        ['K', 'Ó, a másik kulcs? Talán az előző… gondnoknál maradt. Nézzenek körül a -3-on.'],
        ['L', 'Nem mondtuk neki, hogy a széfnél vagyunk.'],
        { do: (s) => { s.gyanu = true; } },
      ] },
      { if: (s) => s.walkieKi, then: [
        ['M', 'Ha a második kulcs itt van valahol, akkor csak lent lehet. A -3-on.'],
      ] },
    ],
    then: 'c3_3',
  });

  S('c3_3', {
    ch: 3, bg: 'minus3_door', music: 'drone_deep',
    enter: (s) => H.expo(s, ['M', 'L'], 2),
    beats: [
      ['N', '-3. szint. Egy acélajtó, rajta egy rozsdás tábla: „LEZÁRVA – 1989”.'],
      ['N', 'De a mellette lévő kezelőpanel most világít. Áram van.'],
      ['M', 'Ezt nyolcvankilencben nem zárták le. Ez csak azért zárt, mert nem volt áram.'],
      { if: (s) => H.hallucinal(s, 'M'), then: [['fx', 'ghost'], ['N', 'Máté egy pillanatra mintha kopogást hallana az ajtó túloldaláról.']] },
    ],
    qte: { by: 'M', kind: 'press', ms: 1400, prompt: 'Máté: kösd át a vezetékeket, amikor a szikra kialszik!', ok: 'c3_4', fail: 'c3_3_aram' },
  });

  S('c3_3_aram', {
    ch: 3, bg: 'minus3_door',
    enter: (s) => { s.seb.M += 1; },
    beats: [
      ['fx', 'sfx', 'zap'], ['fx', 'flash'], ['fx', 'shake'],
      ['N', 'Az áram végigrázza Máté karját. Hátraesik, a keze lüktet.'],
      ['M', 'Jól… jól vagyok. Még egyszer.'],
      ['N', 'Másodszorra sikerül.'],
    ],
    then: 'c3_4',
  });

  S('c3_4', {
    ch: 3, bg: 'dani_room', music: 'grief',
    enter: (s) => { s.minus3 = true; },
    beats: [
      ['fx', 'sfx', 'door_open_heavy'],
      ['N', 'Az ajtó tizenhat év után sziszegve kinyílik. Állott, száraz levegő.'],
      ['N', 'A rádiópult előtt egy alak ül a földön, a falnak dőlve. Farmerdzseki. Egy kifakult urbex-sapka.'],
      ['N', 'A keze még mindig a mikrofon kábelén.'],
      ['M', '…Dani.'],
    ],
    then: (s) => (s.titok.M ? 'c3_4_tudja' : 'c3_4_titok'),
  });

  S('c3_4_titok', {
    ch: 3, bg: 'dani_room',
    choice: {
      by: 'both', mode: 'hidden', timer: 10000, echo: true,
      prompt: 'Titkos döntés. Lili Mátéra néz. Máté keze remeg.',
      opts: (s, who) =>
        who === 'M'
          ? [
              { k: 'be', t: 'Kimondod: „Ez a bátyám.”' },
              { k: 'hallgat', t: 'Hallgatsz, és elfordulsz' },
            ]
          : [
              { k: 'be', t: 'Kimondod: „Ez Dani, ugye?”' },
              { k: 'hallgat', t: 'Nem kérdezel semmit' },
            ],
      default: 'hallgat',
      resolve: (s, P) => {
        if (P.M === 'be' && P.L === 'be') { s.titok.M = true; s.titok.L = true; s.gyanu = true; H.bizalom(s, 1); return 'c3_4_mindketten'; }
        if (P.M === 'be') { s.titok.M = true; H.bizalom(s, 1); return 'c3_4_mate'; }
        if (P.L === 'be') { s.titok.M = true; s.titok.L = true; s.gyanu = true; H.bizalom(s, -1); return 'c3_4_lili'; }
        return 'c3_4_csend';
      },
    },
  });

  S('c3_4_mindketten', {
    ch: 3, bg: 'dani_room',
    beats: [
      ['M', 'Ez a bátyám. Ezért jöttem ide.'],
      ['L', 'Tudom. Ezért hoztalak. Valaki elküldte nekem a hangját.'],
      ['N', 'Máté ránéz. Aztán bólint. Most nincs idő haragudni.'],
    ],
    then: 'c3_4_tudja',
  });
  S('c3_4_mate', {
    ch: 3, bg: 'dani_room',
    beats: [
      ['M', 'Ez a bátyám. Dani. Tizenhat éve keresem.'],
      ['L', 'Máté… annyira sajnálom.'],
      { if: (s) => !s.titok.L, then: [['N', 'Lili zsebében a diktafon forog. Most nem tudja kikapcsolni.']] },
    ],
    then: 'c3_4_tudja',
  });
  S('c3_4_lili', {
    ch: 3, bg: 'dani_room',
    beats: [
      ['L', 'Ez Dani, ugye? A bátyád.'],
      ['M', '…Honnan tudod a nevét?'],
      ['L', 'Valaki elküldte nekem a hangját. Ezért beszéltelek rá erre a munkára.'],
      ['M', 'És nem szóltál.'],
      ['L', 'Te sem.'],
      ['fx', 'note', 'Máté ezt nem felejti el.'],
    ],
    then: 'c3_4_tudja',
  });
  S('c3_4_csend', {
    ch: 3, bg: 'dani_room',
    beats: [
      ['N', 'Máté hátat fordít. Lili nem kérdez semmit, de látja a vállát rázkódni.'],
      ['N', 'Néha a csend a legnagyobb hazugság.'],
    ],
    then: 'c3_4_tudja',
  });

  S('c3_4_tudja', {
    ch: 3, bg: 'dani_room',
    enter: (s) => { s.bkulcs = true; if (s.kamera === 'alatta') s.kameraNalunk = true; },
    beats: [
      ['N', 'Dani nyakában egy láncon egy kulcs. Ugyanolyan, mint Mátéé, csak a fogazata tükörképe.'],
      ['N', 'Máté óvatosan leveszi róla.'],
      ['M', 'Ne haragudj, tesó. Kölcsönveszem.'],
      { if: (s) => s.kamera === 'alatta', then: [
        ['N', 'A dzseki alatt valami kemény: egy régi videokamera. A tokján egy matrica: „AZ IGAZSÁG ODAÁT VAN”.'],
        ['fx', 'note', 'Megvan: Dani kamerája'],
      ] },
    ],
    then: (s) => (s.kameraNalunk ? 'c3_kamera_kerdes' : 'c3_4_keres'),
  });

  S('c3_4_keres', {
    ch: 3, bg: 'dani_room',
    beats: [['N', 'A fal mellett egy üres kameratok. A kamera nincs benne.']],
    choice: {
      by: 'both', mode: 'vote', timer: 10000,
      duel: true,
      prompt: 'Átkutatjátok a szobát? Itt lent minden perc nyomja a fejeteket.',
      opts: [
        { k: 'keres', t: 'Átkutatjuk' },
        { k: 'nem', t: 'Nincs rá időnk' },
      ],
      resolve: (s, P) => (H.valasztas(P, ['M', 'L']) === 'keres' ? 'c3_4_szellozo' : 'c3_5'),
    },
  });

  S('c3_4_szellozo', {
    ch: 3, bg: 'dani_room',
    enter: (s) => { H.expo(s, ['M', 'L'], 1); s.kameraNalunk = true; },
    beats: [
      ['N', 'Lili észreveszi, hogy a szellőzőrács egyik csavarja hiányzik.'],
      ['N', 'Mögötte, a porban ott a kamera. A tokján egy matrica: „AZ IGAZSÁG ODAÁT VAN”.'],
      ['L', 'Dani elrejtette. Valaki elől.'],
      ['fx', 'note', 'Megvan: Dani kamerája'],
    ],
    then: 'c3_kamera_kerdes',
  });

  S('c3_kamera_kerdes', {
    ch: 3, bg: 'dani_room',
    choice: {
      by: 'both', mode: 'vote', timer: 10000, echo: true,
      duel: true,
      prompt: 'Az akkumulátor csodával határos módon pislákol. Megnézitek most?',
      opts: [
        { k: 'most', t: 'Most nézzük meg' },
        { k: 'kesobb', t: 'Később, nem itt' },
      ],
      resolve: (s, P) => (H.valasztas(P, ['M', 'L']) === 'most' ? 'c3_kamera' : 'c3_5'),
    },
  });

  // Dani felvétele – a kamera nem hallucinál. (A 4. fejezetben a kocsiban is megnézhető.)
  S('c3_kamera', {
    ch: 3, bg: 'vhs_corridor', vhs: true, music: 'tape',
    enter: (s) => H.nyom(s, 'dani_kazetta'),
    beats: [
      ['fx', 'title', '▶ PLAY · 2010.10.17 23:58'],
      ['N', 'Gergő szemszöge. A folyosó. A lépcsőn valaki feljön.'],
      ['N', 'Dani az. Csak Dani. Fáradtan, poros kézzel.'],
      ['D', 'Gergő? Mi van? Miért nézel így?', { rec: true }],
      ['N', 'A kép megrándul. Egy fejsze villan a kép szélén.'],
      ['D', 'Gergő, én vagyok! DANI!', { rec: true }],
      ['fx', 'sfx', 'impact_muffled'],
      ['N', 'A kamera a földre esik. A kép oldalra dől.'],
      ['fx', 'title', '▶ PLAY · 2010.10.18 00:31'],
      ['N', 'Dani arca, közelről, sápadtan. Mögötte a rádiószoba.'],
      ['D', 'Máté… ha ezt valaha látod… nincsenek itt szörnyek.', { rec: true }],
      ['D', 'Gergő engem látott szörnynek. Valami van a levegőben… vagy a fejünkben…', { rec: true }],
      ['D', 'Ne higgy annak, amit látsz. Higgy annak, aki melletted van.', { rec: true }],
      ['D', 'És a kamerának. A kamera nem hazudik.', { rec: true }],
      ['fx', 'title', '■ STOP'],
      ['N', 'Hosszú csend. Lili Máté kezét fogja.'],
      ['fx', 'note', 'Nyom: Dani felvétele · Amit egy felvevő rögzít, az valódi.'],
    ],
    then: (s) => (s.fejezet === 4 ? 'c4_k3' : 'c3_5'),
  });

  S('c3_5', {
    ch: 3, bg: 'dani_room',
    beats: [
      { if: (s) => !s.walkieKi, then: [
        ['fx', 'sfx', 'walkie'],
        ['K', 'Halló? Megtalálták a fiút?'],
        ['M', '…Milyen fiút?'],
        ['N', 'Recsegés. Hosszú, hosszú csend.'],
        ['K', 'A kulcsot. Úgy értettem, a kulcsot. Öreg vagyok, fiam, keverem a szavakat.'],
        ['K', 'Tudják, mi a kedvenc horrorfilmem? Azok, amelyikben a fiatalok nem hallgatnak az öregekre.'],
        { do: (s) => { s.gyanu = true; } },
      ] },
      { if: (s) => s.walkieKi, then: [
        ['L', 'Kertész már egy ideje nem szólt. Amióta kivetted az elemet.'],
        ['M', 'Most biztos nagyon ideges.'],
      ] },
    ],
    then: (s) => (s.sandor.el ? 'c3_6' : 'c3_7'),
  });

  S('c3_6', {
    ch: 3, bg: 'minus3_door', music: 'sandor',
    enter: (s) => { s.sandor.talalkozott = true; },
    beats: [
      ['fx', 'sfx', 'footsteps'],
      ['N', 'Az ajtóban ott áll a gázálarcos. Nem jön közelebb.'],
      { if: (s) => s.sandor.sebesult, then: [['N', 'A bal válla alatt égett, fekete folt. Nehezen tartja a karját.']] },
      ['N', 'Lassan leveszi az álarcot. Egy ötvenes-hatvanas férfi, ősz szakállal, véreres szemmel.'],
      ['S', 'Ne ijedjetek meg. Nem bántalak titeket.'],
      ['S', 'Az a fiú… a bátyád… Hallottam a rádióban, tizenhat éve. Lejöttem. Lekapcsoltam a generátort, hogy megálljon ez az átok.'],
      ['S', 'De ez az ajtó áram nélkül bezár. Én zártam be. Vele együtt.'],
      ['S', 'Tizenhat éve hallgatom a hangját. Ezért játszottam le nektek. Hogy menjetek el.'],
    ],
    choice: {
      by: 'both', mode: 'hidden', timer: 10000, echo: true,
      prompt: 'Titkos döntés. A férfi lehajtott fejjel áll előttetek.',
      opts: (s, who) => [
        { k: 'meghallgat', t: 'Hagyod beszélni. Ő is áldozat.' },
        { k: 'elzavar', t: 'Elzavarod: „Tűnjön el.”' },
        { k: 'tamad', t: 'Rátámadsz (' + H.fegyverNev(s, who) + ')', if: H.fegyverErtek(s, who) > 1 },
      ].filter((o) => o.if !== false),
      default: 'meghallgat',
      resolve: (s, P) => {
        const t = ['M', 'L'].filter((x) => P[x] === 'tamad');
        if (t.length) {
          s.tamado = t[0];
          s.tamadoFegyver = H.fegyverNev(s, t[0]);
          if (s.tamadoFegyver === 'jelzőpisztoly') H.lo(s);
          if (P[H.masik(t[0])] === 'meghallgat') H.bizalom(s, -2);
          return 'c3_6_tamad';
        }
        if (P.M === 'meghallgat' && P.L === 'meghallgat') { s.sandor.szov = true; H.bizalom(s, 1); return 'c3_6_szov'; }
        if (P.M === 'meghallgat') { s.sandor.szov = true; return 'c3_6_mate_bocsat'; }
        if (P.L === 'meghallgat') { s.tudRez = true; s.sandor.ellenseg = false; return 'c3_6_lili_cetli'; }
        return 'c3_6_elzavar';
      },
    },
  });

  S('c3_6_tamad', {
    ch: 3, bg: 'minus3_door',
    beats: [
      ['N', 'Nem védekezik. Csak lehunyja a szemét.'],
      ['S', 'Jogos.'],
      { do: (s) => { s.sandor.el = false; } },
      { if: (s) => s.tamadoFegyver === 'jelzőpisztoly', then: [['fx', 'sfx', 'flare'], ['fx', 'flash', 'red']] },
      { if: (s) => s.tamadoFegyver !== 'jelzőpisztoly', then: [['fx', 'sfx', 'impact']] },
      ['fx', 'shake'],
      ['N', 'A férfi lecsúszik az ajtófélfa mentén, és ott marad, Dani mellett.'],
      ['N', 'Tizenhat év után ugyanabban a szobában.'],
      { if: (s) => s.bizalom <= 3, then: [['N', 'A másik szó nélkül néz rá arra, aki ezt tette.']] },
    ],
    then: 'c3_7',
  });

  S('c3_6_mate_bocsat', {
    ch: 3, bg: 'minus3_door',
    beats: [
      ['L', 'Tűnjön el innen!'],
      ['M', 'Lili. Ne. …Ő is ugyanígy itt ragadt, mint Dani.'],
      ['N', 'Lili nem érti. De Máté a bátyja mellett áll, és ő dönt.'],
    ],
    then: 'c3_6_szov',
  });

  S('c3_6_szov', {
    ch: 3, bg: 'minus3_door',
    enter: (s) => { s.tudRez = true; s.kardosIsmert = true; },
    beats: [
      ['M', 'Hogy hívják?'],
      { if: (s) => (s.irodaValasztas || []).includes('fiok'), then: [['S', 'Sándor. Az „S.” a csoportképen. Az egyetlen, akinek a nevét nem húzták át.']] },
      { if: (s) => !(s.irodaValasztas || []).includes('fiok'), then: [['S', 'Sándor. Sorkatona voltam itt. Az egyetlen, aki 1988-ban túlélte.']] },
      ['S', 'Kint voltam a toronyban jeget verni. Mire visszajöttem, a többiek… egymást.'],
      ['S', 'Gáz van a levegőben. Ezért hordom az álarcot.'],
      ['S', 'A kazettákat is én hagytam nektek. Rita és Zoltán hangja, 1998-ból. A hangosbemondó vonalát az én kunyhómba kötöttem. Mindent hallok, ami itt történik.'],
      ['S', 'Hogy halljátok, mi lesz, ha maradtok. Mert mindig ugyanaz lesz.'],
      { if: (s) => H.van(s, 'kapcsolasi_rajz'), then: [
        ['M', 'Sándor. Ez nem gáz. Ez hang. Infrahang. Egy gép csinálja, a Rezonátor.'],
        ['N', 'Sándor sokáig nézi az álarcot a kezében.'],
        ['S', 'Harmincnyolc évig hordtam… a semmiért.'],
        ['N', 'Leejti a földre.'],
      ] },
      { if: (s) => !H.van(s, 'kapcsolasi_rajz'), then: [
        ['S', 'A torony tövében van egy akna. Ha elvágjátok benne a vastag kábelt, vége. Én sosem mertem lemenni.'],
      ] },
      ['S', 'És még valami. Az a kedves öregúr a walkie-talkie-ban, a „kertész”.'],
      ['S', 'Kardos Béla. Ő vezette a programot. Ő adta ki a parancsot 1988-ban.'],
      ['S', '…És ő az apám.'],
      ['fx', 'sting'],
      ['fx', 'note', 'Sándor veletek tart'],
    ],
    then: 'c3_7',
  });

  S('c3_6_lili_cetli', {
    ch: 3, bg: 'minus3_door',
    beats: [
      ['M', 'Tűnjön el. Most.'],
      ['N', 'Sándor bólint. Ahogy elmegy Lili mellett, a kezébe nyom egy összehajtott cetlit.'],
      ['N', 'Lili csak akkor nézi meg, amikor már egyedül vannak: „TORONY. AKNA. VÁGD EL A KÁBELT. – S.”'],
    ],
    then: 'c3_7',
  });

  S('c3_6_elzavar', {
    ch: 3, bg: 'minus3_door',
    beats: [
      ['M', 'Tűnjön el.'],
      ['N', 'Sándor visszahúzza az álarcot, és szó nélkül elmegy.'],
      ['S', 'Akkor legalább ne higgyetek a szemeteknek.', { name: 'Sándor' }],
    ],
    then: 'c3_7',
  });

  // A Rezonátor kikapcsolása a -2-n (csak ha tudnak róla és van ép fejsze).
  S('c3_7', {
    ch: 3, bg: 'vault',
    beats: [
      { if: (s) => s.tudRez && !s.rezKi, then: [['N', 'A Rezonátor vezérlőszekrénye a széf melletti gépházban van. Lehegesztett ajtó, rajta egy sárga villám.']] },
    ],
    then: (s) => (s.tudRez && !s.rezKi && s.fejsze && !s.fejszeTort && s.el[s.fejsze] ? 'c3_7_dont' : 'c4_1'),
  });

  S('c3_7_dont', {
    ch: 3, bg: 'vault',
    choice: {
      by: 'both', mode: 'vote', timer: 12000, echo: true,
      duel: true,
      prompt: 'Feltöritek most a fejszével a szekrényt?',
      opts: [
        { k: 'most', t: 'Most. Elég volt ebből a nyomásból.' },
        { k: 'kesobb', t: 'Előbb a széf, aztán a gép' },
      ],
      resolve: (s, P) => (H.valasztas(P, ['M', 'L']) === 'most' ? 'c3_8' : 'c4_1'),
    },
  });

  S('c3_8', {
    ch: 3, bg: 'machine_room', music: 'drone_deep',
    beats: [['N', 'A hegesztési varrat vastag és rozsdás. A fejsze minden csapásnál visszapattan.']],
    qte: { by: (s) => s.fejsze, kind: 'mash', count: 22, ms: 6000, prompt: 'TÖRD FEL! Nyomd gyorsan!', ok: 'c3_8_ok', fail: 'c3_8_tort' },
  });

  S('c3_8_ok', {
    ch: 3, bg: 'machine_room', music: 'silence',
    enter: (s) => { s.rezKi = true; },
    beats: [
      ['fx', 'sfx', 'metal_break'],
      ['N', 'Az ajtó kiszakad. Bent egy szekrénynyi biztosíték és egy vastag, zümmögő tekercs.'],
      ['N', 'Máté egyenként kirántja a biztosítékokat.'],
      ['fx', 'sfx', 'power_down_soft'],
      ['fx', 'calm'],
      ['N', 'A nyomás elmúlik. Olyan, mintha egy kéz elengedné a koponyádat.'],
      ['L', 'Úristen… hallom a saját szívverésemet.'],
      ['M', 'Ez volt az egész. Egy gép.'],
      ['fx', 'note', 'A Rezonátor kikapcsolva'],
    ],
    then: 'c4_1',
  });

  S('c3_8_tort', {
    ch: 3, bg: 'machine_room',
    enter: (s) => { s.fejszeTort = true; s.feszito = 'M'; },
    beats: [
      ['fx', 'sfx', 'metal_snap'],
      ['N', 'A fejsze nyele kettéreccsen. A szekrény meg se moccant.'],
      ['N', 'Máté felkap a földről egy feszítővasat. Ez most nem elég az ajtóhoz.'],
      ['M', 'Marad a torony. Vagy semmi.'],
    ],
    then: 'c4_1',
  });
})(typeof window !== 'undefined' ? window : globalThis);

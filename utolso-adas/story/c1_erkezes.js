// 1. FEJEZET – ÉRKEZÉS. 2026. október 17., szombat, 18:40.
(function (root) {
  const { S, H } = root.STORY;

  S('c1_1', {
    ch: 1, bg: 'gate_dusk', music: 'wind',
    enter: (s) => { s.fejezet = 1; s.szerep = { p1: 'M', p2: 'L' }; },
    beats: [
      ['fx', 'chapter', '1. fejezet · ÉRKEZÉS'],
      ['fx', 'title', 'Zemplén · Vadkő-tető · szombat, 18:40'],
      ['fx', 'sfx', 'car_stop'],
      ['K', 'Hát itt is volnánk. VK-7. Hatvankettőben épült, nyolcvankilencben zárták be.'],
      ['L', 'Miért zárták be?'],
      ['K', 'Szén-monoxid. Csúnya história. Ne keressék a szellőzőket, kisasszony, azóta nincs bennük semmi.'],
      ['K', 'Ez a raktárkulcs, Máté úr. És két walkie-talkie. A hármas csatornán egymást is, engem is elérik.'],
      ['M', 'Reggelig maradunk?'],
      ['K', 'Hatkor itt vagyok. Vasárnap reggel. Jó éjszakát, fiatalok.'],
      ['fx', 'sfx', 'car_leave'],
      ['N', 'A hátsó lámpák lefelé kanyarognak a szerpentinen… aztán a kapuháznál megállnak, és kialszanak.'],
      ['L', 'Most megállt?'],
      ['M', 'Biztos csak a fák takarják.'],
    ],
    then: 'c1_2',
  });

  S('c1_2', {
    ch: 1, bg: 'gate_dusk', private: 'M',
    beats: [
      ['N', 'A bátyád, Kerekes Dani tizenhat éve itt tűnt el. Huszonnégy éves volt, te tizenöt.'],
      ['N', 'A rendőrség szerint eltévedt az erdőben. Te ezt sosem hitted el.'],
      ['N', 'Amikor egy Kertész nevű ember pont ide hívott felmérést végezni, nem kérdeztél semmit. Igent mondtál.'],
      ['N', 'Lilinek sosem mondtad el, hogy Dani pont itt tűnt el.'],
    ],
    then: 'c1_3',
  });

  S('c1_3', {
    ch: 1, bg: 'gate_dusk', private: 'L',
    beats: [
      ['N', 'Három hete névtelen e-mailt kaptál. Egy hangfájl volt benne és egy mondat:'],
      ['N', '„A Kerekes-ügy nincs lezárva. VK-7.”'],
      ['N', 'A felvételen egy fiatal férfi segítséget kér. Utánanéztél: Máté bátyja, Dani.'],
      ['N', 'Amikor Máté megemlítette ezt a munkát, te beszélted rá, hogy vállalja el.'],
      ['N', 'A kabátod belső zsebében megy a diktafonod. Ebből lesz a podcastod legjobb epizódja. Máté nem tudja.'],
    ],
    then: 'c1_4',
  });

  S('c1_4', {
    ch: 1, bg: 'courtyard', music: 'wind',
    beats: [
      ['fx', 'sfx', 'mast_creak'],
      ['L', 'Ez a torony nyikorog, vagy sír?'],
      ['M', 'Mindkettő. Százhúsz méter acél, szélben.'],
      ['fx', 'bg', 'radio_room_dark'],
      ['N', 'Rádióterem. Por, régi magnók, egy felborult szék.'],
      ['N', 'A műszaki napló nyitva maradt. Az utolsó bejegyzés: 1988. november 13., vasárnap.'],
      ['M', '„Hangosbemondó javítva. M. Elek.” És mellé írva: „Mindenhez ért.”'],
      ['L', 'Mekk Elek dolgozott itt?'],
      ['M', 'Ez sok mindent megmagyaráz a vezetékekről.'],
    ],
    then: 'c1_5',
  });

  S('c1_5', {
    ch: 1, bg: 'generator_room', music: 'drone_low',
    beats: [
      ['N', '-1. szint. A generátor akkora, mint egy kisbusz.'],
      ['M', 'Dízel. Tele a tartály, szóval valaki tankolt bele.'],
      ['M', 'Várj.'],
      ['fx', 'focus', 'fuel_line'],
      ['M', 'Az üzemanyagcső. Ez nem rozsda, ezt valaki elvágta.'],
      ['L', 'Mikor?'],
      ['M', 'Még nedves a vége. Ma.'],
      ['fx', 'sfx', 'clank_far'],
      ['N', 'Valahol fölöttetek fém koppan a betonon. Aztán csend.'],
    ],
    then: 'c1_6',
  });

  S('c1_6', {
    ch: 1, bg: 'generator_room',
    beats: [
      ['fx', 'sfx', 'static'],
      ['N', 'Máté övén a szkenner, amit mindig hord, magától zúgni kezd.'],
      ['R', '…ha valaki hallja ezt… VK-7… Vadkő-tető…', { name: 'Rádió', voice: 'dani' }],
      ['R', '…ne kapcsolják be a generátort… ismétlem… ne kapcsolják…', { name: 'Rádió', voice: 'dani' }],
      ['fx', 'sfx', 'static_cut'],
      ['N', 'Elhallgat.'],
      ['N', 'Mindketten felismeritek a hangot, de egyikőtök sem tudja, hogy a másik is.'],
    ],
    then: 'c1_7',
  });

  S('c1_7', {
    ch: 1, bg: 'generator_room', music: 'tension_soft',
    choice: {
      by: 'both', mode: 'hidden', timer: 12000, echo: true,
      prompt: 'Titkos döntés. A párod nem látja, mit választasz.',
      opts: (s, who) =>
        who === 'M'
          ? [
              { k: 'be', t: 'Bevallod: „Ez a bátyám hangja.”' },
              { k: 'hallgat', t: 'Hallgatsz' },
              { k: 'hazud', t: 'Legyintesz: „Régi felvétel, semmi.”' },
            ]
          : [
              { k: 'be', t: 'Bevallod: „Ismerem ezt a felvételt.”' },
              { k: 'hallgat', t: 'Hallgatsz' },
              { k: 'szinlel', t: 'Úgy teszel, mintha megijedtél volna' },
            ],
      default: 'hallgat',
      resolve: (s, P) => {
        const m = P.M === 'be', l = P.L === 'be';
        if (m && l) { s.titok.M = s.titok.L = true; s.gyanu = true; H.bizalom(s, 2); return 'c1_8_mind'; }
        if (l) {
          s.titok.L = s.titok.M = true; s.gyanu = true;
          H.bizalom(s, P.M === 'hazud' ? -2 : -1);
          return P.M === 'hazud' ? 'c1_8_lili_hazud' : 'c1_8_lili';
        }
        if (m) { s.titok.M = true; H.bizalom(s, 1); return 'c1_8_mate'; }
        H.bizalom(s, -1);
        return 'c1_8_senki';
      },
    },
  });

  S('c1_8_mind', {
    ch: 1, bg: 'generator_room',
    beats: [
      ['M', 'Ez Dani. A bátyám. Tizenhat éve itt tűnt el.'],
      ['L', 'Tudom.'],
      ['M', '…Tessék?'],
      ['L', 'Valaki elküldte nekem ezt a felvételt három hete. Névtelenül. Ezért beszéltelek rá.'],
      ['M', 'Engem pedig valaki pont ide hívott dolgozni, ugyanazon a héten.'],
      ['L', 'Akkor ez nem véletlen. Valaki ide akart hozni minket. Mindkettőnket.'],
      ['fx', 'note', 'Bizalom nőtt · Ugyanaz a titok'],
    ],
    then: 'c1_9',
  });

  S('c1_8_lili', {
    ch: 1, bg: 'generator_room',
    beats: [
      ['L', 'Máté, ezt a felvételt ismerem. Valaki elküldte nekem névtelenül.'],
      ['L', 'Ez Dani, ugye? A bátyád.'],
      ['M', '…Igen.'],
      ['L', 'És mikor akartad elmondani, hogy itt tűnt el?'],
      ['M', 'Mikor akartad elmondani, hogy ezért hoztál ide?'],
      ['N', 'Egyikőtök sem válaszol.'],
      ['L', 'Valaki ide akart hozni minket. Ez nem véletlen.'],
      ['fx', 'note', 'Máté ezt nem felejti el.'],
    ],
    then: 'c1_9',
  });

  S('c1_8_lili_hazud', {
    ch: 1, bg: 'generator_room',
    beats: [
      ['M', 'Régi felvétel. Semmi.'],
      ['L', 'Máté. Ez Dani. A bátyád. Valaki elküldte nekem névtelenül.'],
      ['N', 'Máté arca megfeszül. Rajtakapták.'],
      ['L', 'A szemembe hazudtál.'],
      ['M', 'Te meg idehoztál, és nem mondtad meg, miért.'],
      ['L', 'Valaki ide akart hozni minket. Mindkettőnket.'],
      ['fx', 'note', 'Lili ezt nem felejti el.'],
    ],
    then: 'c1_9',
  });

  S('c1_8_mate', {
    ch: 1, bg: 'generator_room',
    beats: [
      ['M', 'Lili… ez Dani. A bátyám. Itt tűnt el, tizenhat éve. Ezért vállaltam el.'],
      ['L', 'Úristen. Máté…'],
      ['N', 'Lili átölel. A kabátja zsebében a diktafon tovább forog.'],
      ['fx', 'note', 'Lili ezt nem felejti el.'],
    ],
    then: 'c1_9',
  });

  S('c1_8_senki', {
    ch: 1, bg: 'generator_room',
    beats: [
      ['L', 'Ez… valami régi adás lehetett.'],
      ['M', 'Valószínűleg. Az ionoszféra furcsa dolgokat csinál.'],
      ['N', 'Mindketten hazudtok, és mindketten érzitek, hogy a másik is.'],
    ],
    then: 'c1_9',
  });

  S('c1_9', {
    ch: 1, bg: 'generator_room',
    choice: {
      by: 'both', mode: 'vote', timer: 15000, echo: true,
      prompt: 'Máté meg tudja foltozni a csövet. Bekapcsoljátok a generátort?',
      opts: [
        { k: 'javit', t: 'Megjavítjuk és bekapcsoljuk. Fagy van, és vaksötét.' },
        { k: 'var', t: 'Várunk. A hang azt mondta, ne.' },
      ],
      // Óvatossági szabály: ha nem értetek egyet, a generátor kikapcsolva marad.
      resolve: (s, P) => (P.M === 'javit' && P.L === 'javit' ? 'c1_10f' : P.M !== P.L ? 'c1_10vita' : 'c1_10w'),
    },
  });

  S('c1_10vita', {
    ch: 1, bg: 'generator_room',
    beats: [
      ['N', 'Nem értetek egyet. Amíg az egyikőtök nemet mond, a gép kikapcsolva marad.'],
    ],
    then: 'c1_10w',
  });

  S('c1_10f', {
    ch: 1, bg: 'generator_room',
    beats: [['M', 'Szigetelőszalag, bilincs… Mekk Elek büszke lenne rám.']],
    qte: { by: 'M', kind: 'mash', count: 14, ms: 4200, prompt: 'Máté: rántsd be az indítózsinórt!', ok: 'c1_11f', fail: 'c1_11f_nehez' },
  });

  S('c1_11f_nehez', {
    ch: 1, bg: 'generator_room',
    beats: [
      ['N', 'A zsinór kicsúszik a kezedből, a markolat a csuklódba csapódik.'],
      ['M', 'Au… Jó. Még egyszer.'],
      ['N', 'Harmadszorra köhög fel a motor.'],
    ],
    then: 'c1_11f',
  });

  S('c1_11f', {
    ch: 1, bg: 'generator_room',
    enter: (s) => H.genIndul(s, 'jatekosok'),
    beats: [
      ['fx', 'sfx', 'generator'],
      ['fx', 'flash'],
      ['N', '20:14. A generátor felbömböl. Fent sorban gyulladnak a lámpák.'],
      ['L', 'Na ugye. Semmi baj.'],
    ],
    then: 'c2_1',
  });

  S('c1_10w', {
    ch: 1, bg: 'radio_room_dark', music: 'wind',
    beats: [
      ['N', 'A rádióteremben vertek tábort: két hálózsák, egy gázlámpa, termoszban tea.'],
      ['N', 'A szél fütyül a torony kötelein. Az óra lassan halad.'],
    ],
    then: 'c1_10w2',
  });

  S('c1_10w2', {
    ch: 1, bg: 'radio_room_dark',
    choice: {
      by: 'L', mode: 'solo', timer: 14000,
      prompt: 'Lili: a gázlámpa fényében Máté arca nagyon fáradt.',
      opts: (s) => [
        { k: 'kerdez', t: 'Megkérdezed: „Mi a legszebb emléked?”' },
        { k: 'vall', t: 'Bevallod a diktafont', if: !s.titok.L },
        { k: 'hozzabujik', t: 'Szó nélkül hozzábújsz' },
      ].filter((o) => o.if !== false),
      default: 'hozzabujik',
      resolve: (s, P) => 'c1_10w_' + P.L,
    },
  });

  S('c1_10w_kerdez', {
    ch: 1, bg: 'radio_room_dark',
    enter: (s) => H.bizalom(s, 1),
    beats: [
      { if: (s) => s.titok.M, then: [
        ['M', 'Dani egyszer épített nekem egy rádiót egy cipősdobozból. Tízéves voltam.'],
        ['M', 'Az első adás, amit fogtunk, egy orosz számállomás volt. Egy nő csak számokat mondott.'],
        ['M', 'Dani azt mondta, kémeknek szól. Egész éjjel hallgattuk.'],
      ] },
      { if: (s) => !s.titok.M, then: [
        ['M', 'Gyerekként építettem egy rádiót egy cipősdobozból. Valaki segített.'],
        ['L', 'Ki?'],
        ['M', '…Majd egyszer elmesélem.'],
      ] },
      ['fx', 'note', 'Bizalom nőtt'],
    ],
    then: 'c1_12w',
  });

  S('c1_10w_vall', {
    ch: 1, bg: 'radio_room_dark',
    enter: (s) => { s.titok.L = true; s.gyanu = true; H.bizalom(s, 1); },
    beats: [
      ['L', 'Máté. Megy egy diktafon a zsebemben. Mióta kiszálltunk a kocsiból.'],
      ['L', 'És… valaki küldött nekem egy hangfájlt. Ugyanazt, amit az előbb hallottunk.'],
      ['M', 'Ezért akartad, hogy elvállaljam.'],
      ['L', 'Igen. Sajnálom.'],
      ['M', '…Én is tartozom egy vallomással. Dani a bátyám volt. Itt tűnt el.'],
      { do: (s) => { s.titok.M = true; } },
      ['fx', 'note', 'Bizalom nőtt · Már nincs titok köztetek'],
    ],
    then: 'c1_12w',
  });

  S('c1_10w_hozzabujik', {
    ch: 1, bg: 'radio_room_dark',
    enter: (s) => H.bizalom(s, 1),
    beats: [
      ['N', 'Máté magára húzza a hálózsákot, és átkarol. Egy percre csak a szél hallatszik.'],
      ['M', 'Ha hazaértünk, főzök neked egy rendes vacsorát.'],
      ['L', 'Te nem tudsz főzni.'],
      ['M', 'Mekk Elek is mindenhez ért.'],
      ['fx', 'note', 'Bizalom nőtt'],
    ],
    then: 'c1_12w',
  });

  // Ha a játékosok nem indítják el, Kardos lopózik fel, és ő indítja el.
  S('c1_12w', {
    ch: 1, bg: 'radio_room_dark',
    enter: (s) => H.genIndul(s, 'kardos'),
    beats: [
      ['fx', 'title', '23:52'],
      ['N', 'Félálomban vagytok, amikor lentről megrázkódik az épület.'],
      ['fx', 'sfx', 'generator'],
      ['fx', 'flash'],
      ['N', 'A generátor felbömböl. A lámpák felgyulladnak.'],
      ['M', 'Ki kapcsolta be?!'],
      ['L', 'Máté… az ablak.'],
      ['N', 'Lent az udvaron egy zseblámpa fénye kanyarog a kapu felé. Lassan. Sietség nélkül.'],
      ['N', 'Aztán kialszik.'],
    ],
    then: 'c2_1',
  });
})(typeof window !== 'undefined' ? window : globalThis);

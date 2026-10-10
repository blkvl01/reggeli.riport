// 4. FEJEZET – A KÉT KULCS. Kapu (dosszié), menekülés, torony, TÜKÖR, széf.
(function (root) {
  const { S, H } = root.STORY;

  const hubOpciok = (s) => [
    { k: 'kapu', t: 'Le a kapuhoz: ott talán van térerő', if: !s.voltKapu },
    { k: 'torony', t: 'Ki a toronyhoz: elvágjuk a Rezonátor kábelét', if: s.tudRez && !s.rezKi && !s.voltTorony },
    { k: 'szef', t: 'Vissza a széfhez: két kulcs, egyszerre' },
  ].filter((o) => o.if !== false);

  S('c4_1', {
    ch: 4, bg: 'courtyard_storm', music: 'storm',
    enter: (s) => { s.fejezet = 4; },
    beats: [
      { if: (s) => !s.c4Cim, then: [
        { do: (s) => { s.c4Cim = true; } },
        ['fx', 'chapter', '4. fejezet · A KÉT KULCS'],
        ['fx', 'title', 'Vasárnap, 01:17'],
        ['N', 'Kint vihar készül. A torony tetején a piros jelzőfény idegesen villog.'],
        ['L', 'Nincs térerő. Fent a kapunál volt egy csík, amikor jöttünk.'],
      ] },
    ],
    then: (s) => (hubOpciok(s).length > 1 ? 'c4_1v' : 'c4_2'),
  });

  S('c4_1v', {
    ch: 4, bg: 'courtyard_storm',
    choice: {
      by: 'both', mode: 'vote', timer: 14000, duel: true, echo: true,
      prompt: 'Mi legyen a következő lépés?',
      opts: hubOpciok,
      resolve: (s, P) => ({ kapu: 'c4_k1', torony: 'c4_t1', szef: 'c4_2' })[H.valasztas(P, ['M', 'L'])],
    },
  });

  // ---------------- KAPU ----------------
  S('c4_k1', {
    ch: 4, bg: 'gatehouse', music: 'storm',
    enter: (s) => { s.voltKapu = true; H.expo(s, ['M', 'L'], -2); },
    beats: [
      ['N', 'Lefelé a szerpentinen. Ahogy távolodtok az állomástól, a nyomás a fejetekben enged.'],
      ['N', 'A kapuháznál egy autó áll, lekapcsolt lámpákkal. Egy régi, sötétzöld Volvo.'],
      ['L', 'Ez Kertész kocsija. Azt mondta, hazament.'],
      ['N', 'Az ajtó nincs bezárva. Slusszkulcs nincs benne. A kesztyűtartóban egy vastag dosszié.'],
      { do: (s) => { H.nyom(s, 'dosszie'); s.gyanu = true; s.kardosIsmert = true; } },
      ['fx', 'doc', 'dossier'],
      ['N', '1998: Barta Rita és Barta Zoltán. Két fotó, mindkettőn piros tollal egy X.'],
      ['N', '2010: Kerekes Dani és Fehér Gergő. Két fotó, két X.'],
      ['N', '2026: Kerekes Máté és Szántó Lili. A fotó ma délután készült, a benzinkúton. Lili éppen nevet rajta.'],
      ['M', 'Ő fotózott minket. Ma.'],
      ['N', 'A lap alján: „K. B. alezredes”. Mellette egy régi igazolvány: Kardos Béla.'],
      { if: (s) => H.van(s, 'teszt_parancs'), then: [['M', 'Kardos B. Ő írta alá 1988-ban a parancsot. Kertész az. Kertész Kardos.']] },
      { if: (s) => !s.titok.L, then: [
        ['N', 'Máté lapoz. Lili lapja: „Hangfelvétel elküldve szeptember 24-én. Rá fogja beszélni.”'],
        ['M', 'Lili. Mit küldött neked?'],
        ['L', '…Dani hangját. Ezért akartam, hogy elvállald. Nem tudtam, hogy ez…'],
        { do: (s) => { s.titok.L = true; H.bizalom(s, -2); } },
        ['fx', 'note', 'Máté ezt nem felejti el.'],
      ] },
      { if: (s) => !s.titok.M, then: [
        ['N', 'Lili is lapoz. Máté lapja: „Kerekes Dani öccse. Motivált. Igent fog mondani.”'],
        ['L', 'Dani a bátyád volt. És te végig tudtad, hova jövünk.'],
        { do: (s) => { s.titok.M = true; H.bizalom(s, -1); } },
        ['fx', 'note', 'Lili ezt nem felejti el.'],
      ] },
      ['L', 'Párokat hoz ide. Mindig kettőt. Mert a széfhez kettő kell.'],
      ['fx', 'note', 'Nyom: Kardos dossziéja'],
    ],
    then: (s) => (s.kameraNalunk && !H.van(s, 'dani_kazetta') ? 'c4_k2' : 'c4_k3'),
  });

  S('c4_k2', {
    ch: 4, bg: 'gatehouse',
    choice: {
      by: 'both', mode: 'vote', timer: 10000, duel: true,
      prompt: 'A kocsiban száraz van. Megnézitek végre Dani kameráját?',
      opts: [
        { k: 'most', t: 'Most, itt' },
        { k: 'nem', t: 'Nem. Nincs időnk.' },
      ],
      resolve: (s, P) => (H.valasztas(P, ['M', 'L']) === 'most' ? 'c3_kamera' : 'c4_k3'),
    },
  });

  S('c4_k3', {
    ch: 4, bg: 'gatehouse',
    beats: [
      ['fx', 'sfx', 'thunder'],
      ['fx', 'flash'],
      ['N', 'A villám fényében Lili felnéz a kapuház ablakára.'],
      ['fx', 'jump', 'window_face'],
      ['N', 'Kertész ül odabent egy széken, a sötétben. Titeket néz, és mosolyog. Integet.'],
      { if: (s) => !s.walkieKi, then: [
        ['fx', 'sfx', 'walkie'],
        ['K', 'Ugye nem a kocsimban kotorásznak, fiatalok?'],
        ['K', 'Menjenek vissza dolgozni. Hatig még sok idő van.'],
      ] },
      ['N', 'A szoba elsötétül. Az ablak üres.'],
      { if: (s) => s.sandor.el && s.sandor.szov, then: [
        ['fx', 'sfx', 'owl'],
        ['N', 'A fák közül Sándor lép elő. Egy bagoly néz le rátok egy ágról, mozdulatlanul.'],
        ['S', 'A baglyok nem azok, aminek látszanak.'],
        ['L', 'Ezt honnan ismerem?'],
        ['S', 'Egy amerikai sorozatból. Kilencvenben láttam, utoljára néztem tévét.'],
        ['S', 'Nem fog utánatok jönni, ha elmentek. Csak megvárja a következő párt.'],
      ] },
    ],
    then: 'c4_k4',
  });

  S('c4_k4', {
    ch: 4, bg: 'gatehouse',
    choice: {
      by: 'both', mode: 'vote', timer: 14000, duel: true, echo: true,
      prompt: 'Visszamentek, vagy gyalog elindultok az erdőn át, a viharban?',
      opts: [
        { k: 'vissza', t: 'Vissza. Ezt be kell fejezni, Daniért.' },
        { k: 'menekul', t: 'El innen, gyalog. Most.' },
      ],
      resolve: (s, P) => (H.valasztas(P, ['M', 'L']) === 'vissza' ? 'c4_1' : 'c4_f1'),
    },
  });

  // ---------------- MENEKÜLÉS AZ ERDŐN ÁT ----------------
  const kalauz = (s) => (s.sandor.el && s.sandor.szov ? 350 : 0);

  S('c4_f1', {
    ch: 4, bg: 'forest_storm', music: 'chase',
    enter: (s) => { s.menekult = s.minus3 ? 'utana' : 'elotte'; },
    beats: [
      ['N', 'Az ösvény a szakadék peremén fut. Az eső vízszintesen vág. A zseblámpa fénye két méterig ér.'],
      { if: (s) => s.sandor.el && s.sandor.szov, then: [['S', 'Lépjetek oda, ahova én. Itt csúszott le a másik fiú, Gergő.']] },
      { if: (s) => !(s.sandor.el && s.sandor.szov), then: [['M', 'Itt találták meg Gergőt. Dani barátját. A szakadék alján.']] },
    ],
    then: 'c4_f2',
  });

  S('c4_f2', {
    ch: 4, bg: 'ravine',
    qte: { by: 'M', kind: 'press', ms: (s) => 1100 + kalauz(s) - 200 * s.seb.M, prompt: 'Máté: kapaszkodj!', ok: 'c4_f3', fail: 'c4_f2x' },
  });

  S('c4_f2x', {
    ch: 4, bg: 'ravine',
    beats: [['fx', 'sfx', 'slip'], ['N', 'Máté lába alól kicsúszik a sár. Egy kézzel kapaszkodik egy gyökérbe.'], ['M', 'LILI!']],
    qte: { by: 'L', kind: 'press', ms: (s) => 900 + (s.bizalom >= 7 ? 500 : 0) - 150 * s.seb.L, prompt: 'Lili: KAPD EL!', ok: 'c4_f2y', fail: 'c4_f2z' },
  });

  S('c4_f2y', {
    ch: 4, bg: 'ravine',
    enter: (s) => { s.seb.M += 1; H.bizalom(s, 1); },
    beats: [['N', 'Lili elkapja a csuklóját, és teljes súlyával hátradől. Máté felkapaszkodik.'], ['M', 'Tartozom egy vacsorával.'], ['fx', 'note', 'Máté ezt nem felejti el.']],
    then: 'c4_f3',
  });

  S('c4_f2z', {
    ch: 4, bg: 'ravine',
    enter: (s) => { H.megol(s, 'M', 'szakadek'); H.frissitSzerepek(s); },
    beats: [
      ['N', 'Lili ujjai Máté kabátujját érintik. Aztán már csak az esőt.'],
      ['fx', 'sfx', 'fall'],
      ['N', 'Máté nem kiált. Egyszerűen eltűnik a sötétben, ott, ahol tizenhat éve Gergő.'],
      ['L', 'MÁTÉ!'],
      ['fx', 'death', 'M'],
    ],
    then: 'c4_f3',
  });

  S('c4_f3', {
    ch: 4, bg: 'ravine',
    then: (s) => (s.el.L ? 'c4_f3q' : 'c4_f_vege'),
  });

  S('c4_f3q', {
    ch: 4, bg: 'ravine',
    qte: { by: 'L', kind: 'press', ms: (s) => 1100 + kalauz(s) - 200 * s.seb.L, prompt: 'Lili: ugorj át a kidőlt fán!', ok: 'c4_f_vege', fail: 'c4_f3x' },
  });

  S('c4_f3x', {
    ch: 4, bg: 'ravine',
    beats: [['fx', 'sfx', 'slip'], ['N', 'Lili megbotlik a fa törzsén, és a perem felé csúszik.']],
    then: (s) => (s.el.M ? 'c4_f3m' : s.sandor.el && s.sandor.szov ? 'c4_f3s' : 'c4_f3z'),
  });

  S('c4_f3m', {
    ch: 4, bg: 'ravine',
    qte: { by: 'M', kind: 'press', ms: (s) => 900 + (s.bizalom >= 7 ? 500 : 0) - 150 * s.seb.M, prompt: 'Máté: KAPD EL!', ok: 'c4_f3y', fail: 'c4_f3z' },
  });

  S('c4_f3y', {
    ch: 4, bg: 'ravine',
    enter: (s) => { s.seb.L += 1; H.bizalom(s, 1); },
    beats: [['N', 'Máté a hátizsákja pántjánál fogva rántja vissza.'], ['L', 'Még egyszer ilyet csinálsz, és szakítok veled.'], ['fx', 'note', 'Lili ezt nem felejti el.']],
    then: 'c4_f_vege',
  });

  S('c4_f3s', {
    ch: 4, bg: 'ravine',
    enter: (s) => { s.seb.L += 1; },
    beats: [['N', 'Egy erős kéz kapja el a kabátját. Sándor.'], ['S', 'Tizenhat éve elkéstem. Most nem.']],
    then: 'c4_f_vege',
  });

  S('c4_f3z', {
    ch: 4, bg: 'ravine',
    enter: (s) => { H.megol(s, 'L', 'szakadek'); H.frissitSzerepek(s); },
    beats: [
      ['fx', 'sfx', 'fall'],
      ['N', 'A sötétség egyetlen hang nélkül nyeli el.'],
      { if: (s) => s.el.M, then: [['M', 'LILI! LILI!']] },
      ['fx', 'death', 'L'],
    ],
    then: 'c4_f_vege',
  });

  S('c4_f_vege', {
    ch: 4, bg: 'dawn_forest', music: 'aftermath',
    beats: [
      { if: (s) => H.elok(s).length > 0, then: [['N', 'Hajnali négykor egy erdészeti út szélén botorkáltok ki. Egy tejszállító autó áll meg.']] },
    ],
    then: 'epilog',
  });

  // ---------------- TORONY ----------------
  S('c4_t1', {
    ch: 4, bg: 'tower_storm', music: 'storm',
    enter: (s) => { s.voltTorony = true; H.expo(s, ['M', 'L'], -1); },
    beats: [
      ['N', 'A torony tövében egy rácsos akna. Lent, a vízben egy kar vastagságú kábel zümmög.'],
      ['N', 'Máté a generátorteremből hozott egy csapszegvágót. Ketten kell nyomni a két nyelét, egyszerre.'],
      { if: (s) => s.sandor.el && s.sandor.szov, then: [['S', 'Én tartom a rácsot. Ti vágjatok, amikor villámlik, akkor láttok.']] },
    ],
    then: 'c4_t2',
  });

  S('c4_t2', {
    ch: 4, bg: 'tower_storm',
    qte: {
      by: 'co', kind: 'co', ms: (s) => 380 + kalauz(s) * 0.7 + 150 * (s.toronyProba || 0),
      prompt: 'VILLÁMLÁSKOR EGYSZERRE! Mindketten nyomjátok meg egyszerre!',
      ok: 'c4_t_ok', fail: 'c4_t_fail',
    },
  });

  S('c4_t_fail', {
    ch: 4, bg: 'tower_storm',
    enter: (s) => {
      s.toronyProba = (s.toronyProba || 0) + 1;
      const x = s.toronyProba % 2 ? 'M' : 'L';
      s.seb[x] += 1; s.toronySeb = x;
    },
    beats: [
      ['fx', 'sfx', 'thunder'], ['fx', 'flash'], ['fx', 'shake'],
      { if: (s) => s.toronySeb === 'M', then: [['N', 'A vágó megcsúszik, és Máté keze a rács éles peremének csapódik. Vér és esővíz.']] },
      { if: (s) => s.toronySeb === 'L', then: [['N', 'Lili hanyatt esik a sárban, a vágó nyele a bordáinak vágódik.']] },
    ],
    then: (s) => (s.toronyProba >= 3 ? 'c4_t_eroszak' : 'c4_t2'),
  });

  S('c4_t_eroszak', {
    ch: 4, bg: 'tower_storm',
    beats: [['N', 'Negyedszerre már nem egyszerre nyomjátok, hanem mindketten teljes súlyotokkal ráfekszetek. A kábel enged.']],
    then: 'c4_t_ok',
  });

  S('c4_t_ok', {
    ch: 4, bg: 'tower_storm', music: 'silence',
    enter: (s) => { s.rezKi = true; },
    beats: [
      ['fx', 'sfx', 'cable_snap'], ['fx', 'flash'],
      ['N', 'Szikraeső. Aztán a zümmögés, ami órák óta a csontjaitokban volt, egyszerűen megszűnik.'],
      ['fx', 'calm'],
      ['L', 'Csend. Igazi csend.'],
      ['M', 'Mostantól csak az van ott, ami tényleg ott van.'],
      ['fx', 'note', 'A Rezonátor kikapcsolva'],
    ],
    then: 'c4_1',
  });

  // ---------------- SZÉF + TÜKÖR ----------------
  S('c4_2', {
    ch: 4, bg: 'stairs_red', music: 'drone_deep',
    enter: (s) => { s.toro = s.fejszeTort ? s.feszito : s.fejsze; },
    beats: [['N', 'Vissza, le a lépcsőn, a -2-re. A falakon kondenzvíz csorog.']],
    then: (s) => (H.rezBe(s) && (H.eros(s, 'M') || H.eros(s, 'L')) ? 'c4_m1' : 'c4_v1'),
  });

  S('c4_m1', {
    ch: 4, bg: 'firedoor', music: 'heartbeat',
    beats: [
      ['fx', 'sfx', 'power_flicker'],
      ['fx', 'dark'],
      ['N', 'A generátor köhög egyet. Kialszanak a fények. Csak a vészvilágítás vöröse marad.'],
      ['fx', 'sfx', 'door_slam'], ['fx', 'shake'],
      ['N', 'Egy automata tűzgátló acélajtó vágódik le köztetek. Az egyikőtök az egyik oldalon, a másik a másikon.'],
      ['N', 'Az ajtó túloldaláról hangok jönnek. Torzak. Mintha víz alól.'],
      { do: (s) => { s.tukorVolt = true; } },
    ],
    then: 'c4_m2',
  });

  S('c4_m2', {
    ch: 4, bg: 'firedoor',
    private: (s) => s.toro,
    beats: [
      { if: (s) => H.eros(s, s.toro), then: [
        ['N', 'Az ajtó túloldaláról kaparás hallatszik. Valami a nevedet suttogja, de nem a párod hangján. Túl mélyen. Túl lassan.'],
        ['N', 'Aztán sikoly. A párod sikolya, vagy valamié, ami utánozza.'],
      ] },
      { if: (s) => !H.eros(s, s.toro), then: [
        ['N', 'A túloldalról a párod sír. Valami nincs rendben vele, be kell jutnod hozzá.'],
      ] },
      ['N', (s) => 'A kezedben a ' + (s.fejszeTort ? 'feszítővas' : 'fejsze') + '.'],
      ['N', 'Ütni kezded az ajtót. Fa és fém reccsen. Lyuk nyílik rajta.'],
    ],
    then: 'c4_m3',
  });

  S('c4_m3', {
    ch: 4, bg: 'firedoor_breach',
    private: (s) => H.masik(s.toro),
    beats: [
      ['fx', 'sfx', 'axe_door'], ['fx', 'shake'],
      ['N', 'Valami töri az ajtót. Csapás. Csapás. A fémlemez beszakad.'],
      { if: (s) => H.eros(s, H.masik(s.toro)), then: [
        ['fx', 'jump', 'door_creature'],
        ['N', 'Egy arc nyomul be a résen. Nyúlós szürke bőr, túl sok fog, és a szemek helyén csak két fekete gödör.'],
        ['N', '„Itt vagyok!” – hörgi. Ismerős a hangja, és ettől még rosszabb.'],
      ] },
      { if: (s) => !H.eros(s, H.masik(s.toro)), then: [
        ['fx', 'jump', 'door_face'],
        ['N', 'Egy arc nyomul be a résen. A párod. Verejtékes, tágra nyílt szemmel, vigyorogva. Vagy csak a vörös fény teszi?'],
        ['N', '„Itt vagyok!” – kiáltja.'],
      ] },
    ],
    then: 'c4_m4',
  });

  S('c4_m4', {
    ch: 4, bg: 'firedoor_breach', music: 'heartbeat_fast',
    choice: {
      by: 'both', mode: 'hidden', echo: true,
      timer: (s) => 6000 + (s.bizalom >= 7 ? 3000 : 0),
      prompt: 'Titkos döntés. Egy másodperc, és a résen át ér hozzád.',
      opts: (s, who) => {
        const o = [
          { k: 'tamad', t: 'Támadsz (' + H.fegyverNev(s, who) + ')' },
          { k: 'var', t: 'Mozdulatlan maradsz' },
          { k: 'nev', t: 'Kimondod a párod nevét' },
        ];
        if (H.van(s, 'dani_kazetta') && who === 'M' && s.kameraNalunk) o.push({ k: 'eszkoz', t: 'Dani kameráján át nézed' });
        if (H.van(s, 'dani_kazetta') && who === 'L') o.push({ k: 'eszkoz', t: 'Belehallgatsz a diktafonodba' });
        return o;
      },
      default: 'var',
      resolve: (s, P) => {
        const n = (x) => (x === 'eszkoz' ? 'nev' : x);
        s.tukorValasz = { M: P.M, L: P.L };
        const a = n(P.M), b = n(P.L);
        // Mindketten támadnak: a résen át, karnyújtásnyiról mindketten halálosan találnak.
        // Csak Sándor tud közbelépni, ha él.
        if (a === 'tamad' && b === 'tamad') {
          if (H.fegyverNev(s, 'M') === 'jelzőpisztoly' || H.fegyverNev(s, 'L') === 'jelzőpisztoly') H.lo(s);
          return s.sandor.el ? 'c4_m_sandor' : 'c4_m_ketten';
        }
        if (a === 'tamad' || b === 'tamad') {
          const t = a === 'tamad' ? 'M' : 'L', c = H.masik(t);
          s.tamado = t;
          s.tukorFegyver = H.fegyverNev(s, t);
          if (n(P[c]) === 'nev' && s.bizalom >= 7) return 'c4_m_megall';
          if (s.tukorFegyver === 'jelzőpisztoly') H.lo(s);
          s.tukor = t;
          return 'c4_m_halal';
        }
        if (a === 'nev' && b === 'nev') { H.bizalom(s, 3); return 'c4_m_felismer'; }
        if (a === 'nev' || b === 'nev') { H.bizalom(s, 1); return 'c4_m_felismer_fel'; }
        return 'c4_m_csend';
      },
    },
  });

  S('c4_m_megall', {
    ch: 4, bg: 'firedoor_breach',
    beats: [['N', 'Már lendül a kéz, amikor a „szörny” szájából a párod igazi hangja szól. Tisztán. A nevedet mondja.']],
    qte: { by: (s) => s.tamado, kind: 'press', ms: 900, prompt: 'ÁLLJ MEG!', ok: 'c4_m_megallt', fail: 'c4_m_megallt_nem' },
  });

  S('c4_m_megallt_nem', {
    ch: 4, bg: 'firedoor_breach',
    enter: (s) => { if (s.tukorFegyver === 'jelzőpisztoly') H.lo(s); s.tukor = s.tamado; },
    beats: [['N', 'Túl késő. A test gyorsabb, mint a felismerés.']],
    then: 'c4_m_halal',
  });

  S('c4_m_megallt', {
    ch: 4, bg: 'firedoor_breach',
    enter: (s) => { const c = H.masik(s.tamado); s.seb[c] += 1; H.bizalom(s, -1); },
    beats: [
      ['fx', 'sfx', 'impact'], ['fx', 'shake'],
      ['N', 'A csapás a fej mellett csapódik a falba. Centikre.'],
      ['N', 'A vészfény vibrál. A szörny eltűnik, csak a párod áll ott, véres arccal, sírva.'],
      ['N', 'Egyikőtök sem tud megszólalni.'],
    ],
    then: 'c4_m_utan',
  });

  S('c4_m_halal', {
    ch: 4, bg: 'firedoor_red', music: 'grief',
    enter: (s) => { const c = H.masik(s.tukor); H.megol(s, c, 'tukor'); s.aldozatTukor = c; H.frissitSzerepek(s); },
    beats: [
      { if: (s) => s.tukorFegyver === 'jelzőpisztoly', then: [['fx', 'sfx', 'flare'], ['fx', 'flash', 'red']] },
      { if: (s) => s.tukorFegyver !== 'jelzőpisztoly', then: [['fx', 'sfx', 'impact']] },
      ['fx', 'shake'],
      ['N', 'A lény összerogy. Hörög. Aztán elhallgat.'],
      ['fx', 'sfx', 'power_up'],
      ['N', 'A fények visszakapcsolnak.'],
      { if: (s) => s.aldozatTukor === 'L', then: [['N', 'A földön nem szörny fekszik, hanem Lili. A kabátja zsebéből kicsúszott diktafon még mindig forog.'], ['M', 'Nem… nem, nem, Lili… LILI!']] },
      { if: (s) => s.aldozatTukor === 'M', then: [['N', 'A földön nem szörny fekszik, hanem Máté. A kezében még mindig ott a szerszám, amivel érted jött.'], ['L', 'Máté? Máté, kérlek… MÁTÉ!']] },
      ['fx', 'death', (s) => s.aldozatTukor],
      { if: (s) => s.sandor.el && s.sandor.szov, then: [['fx', 'role', 'S']] },
      { if: (s) => !(s.sandor.el && s.sandor.szov), then: [['fx', 'role', 'K']] },
    ],
    then: (s) => (s.sandor.el && s.sandor.szov ? 'c4_mh_sandor' : 'c4_esc'),
  });

  S('c4_m_ketten', {
    ch: 4, bg: 'firedoor_red', music: 'grief',
    enter: (s) => { H.megol(s, 'M', 'tukor'); H.megol(s, 'L', 'tukor'); },
    beats: [
      ['fx', 'sfx', 'impact'], ['fx', 'shake'], ['fx', 'flash', 'red'],
      ['N', 'Egyszerre csaptok le, a résen át, karnyújtásnyiról. Egyszerre találtok.'],
      ['N', 'A vészfényben két szörny fekszik egymás mellett. Aztán kigyulladnak a lámpák.'],
      ['N', 'Két ember. Egymás kezét keresik. Megtalálják.'],
      ['fx', 'death', 'M'], ['fx', 'death', 'L'],
    ],
    then: 'epilog',
  });

  S('c4_m_sandor', {
    ch: 4, bg: 'firedoor_red',
    enter: (s) => { s.seb.M += 2; s.seb.L += 2; H.bizalom(s, -2); },
    beats: [
      ['fx', 'sfx', 'impact'], ['fx', 'shake'],
      ['N', 'Egyszerre csaptok le, és mindketten találtok. Vér a betonon.'],
      ['N', 'Ekkor két erős kar ránt szét titeket. Sándor.'],
      ['S', 'ELÉG! Nézzétek meg egymást! NÉZZÉTEK!'],
      ['N', 'Ahogy a vészfény visszakapcsol, a szörnyek eltűnnek. Csak két vérző ember marad.'],
      ['S', 'Pontosan ezt csinálta a műszakom is. 1988-ban.'],
    ],
    then: 'c4_m_utan',
  });

  S('c4_m_felismer', {
    ch: 4, bg: 'firedoor_breach',
    beats: [
      ['N', 'Egyszerre mondjátok ki egymás nevét.'],
      ['N', 'A szörny arca megremeg, mint a víz tükre. Aztán ott vagy te. És ott van ő.'],
      { if: (s) => s.tukorValasz.M === 'eszkoz' || s.tukorValasz.L === 'eszkoz', then: [['N', 'A felvevő nem hazudik. Dani igazat mondott.']] },
      ['N', 'Átnyúltok a résen. Valahogy összeér a kezetek.'],
      ['fx', 'note', 'Bizalom nőtt · Nem hittetek a szemeteknek'],
    ],
    then: 'c4_m_utan',
  });

  S('c4_m_felismer_fel', {
    ch: 4, bg: 'firedoor_breach',
    beats: [
      ['N', 'Az egyikőtök kimondja a másik nevét. Remegő hangon, de kimondja.'],
      ['N', 'A szörny megtorpan a résben. Aztán a vészfény alatt a párod arca lesz.'],
    ],
    then: 'c4_m_utan',
  });

  S('c4_m_csend', {
    ch: 4, bg: 'firedoor_breach',
    beats: [
      ['N', 'Mindketten mozdulatlanok maradtok. Percekig. A lyuk két oldalán.'],
      ['N', 'Aztán visszakapcsol a világítás. A lyukban a párod arca, falfehéren.'],
      ['N', 'Egyikőtök sem tudja, mennyi hiányzott.'],
    ],
    then: 'c4_m_utan',
  });

  S('c4_m_utan', {
    ch: 4, bg: 'firedoor',
    beats: [
      ['L', 'Láttalak. És nem te voltál.'],
      ['M', 'Dani is ezt látta. Gergő is. Rita is. Ezt csinálja velünk.'],
    ],
    then: 'c4_v1',
  });

  // Egy főszereplő halott, Sándor szövetséges: Sándor fordítja a másik kulcsot.
  S('c4_mh_sandor', {
    ch: 4, bg: 'firedoor_red',
    beats: [
      ['fx', 'sfx', 'footsteps'],
      ['N', 'Sándor ér le a lépcsőn. Megáll. Ránéz a holttestre, aztán a túlélőre.'],
      ['S', 'Én is ezt láttam. Harmincnyolc éve, öt barátommal.'],
      ['S', 'Most nem futhatsz el. Ha elfutsz, az apám győz, és ez megtörténik a következő párral is.'],
      ['S', 'Add ide a másik kulcsot. Befejezzük.'],
    ],
    then: 'c4_v1',
  });

  // Egy főszereplő halott, nincs Sándor: Kardos jön. A halott játékosa Kardost irányítja.
  S('c4_esc', {
    ch: 4, bg: 'stairs_red', music: 'chase',
    beats: [
      ['fx', 'sfx', 'footsteps'],
      ['N', 'Lépések a lépcsőn. Nyugodtak, kimértek. Egy öregember lépései.'],
      { if: (s) => !s.walkieKi, then: [['K', 'Mindent hallottam. Hát megint ez lett. Mindig ez lesz.']] },
      { if: (s) => s.walkieKi, then: [['K', 'A sikolyt a kapuházig hallani. Hát megint ez lett. Mindig ez lesz.']] },
      ['K', (s) => (s.el.M ? 'Sajnálom, fiam.' : 'Sajnálom, kisasszony.') + ' Egyedül nem nyitod ki nekem azt az ajtót. Így már csak tanú vagy.'],
      ['N', 'Kardos a kezében pisztolyt tart. Három út vezet ki a -2-ről.'],
    ],
    choice: {
      by: 'both', mode: 'hidden', timer: 8000, echo: true,
      prompt: 'Titkos döntés. A túlélő menekül, Kardos lő.',
      opts: (s, who) =>
        who === 'K'
          ? [
              { k: 'lepcso', t: 'A lépcsőházra célzol' },
              { k: 'akna', t: 'A liftaknára célzol' },
              { k: 'szellozo', t: 'A szellőzőjáratra célzol' },
            ]
          : [
              { k: 'lepcso', t: 'Fel a lépcsőn' },
              { k: 'akna', t: 'Le a liftaknán, a létrán' },
              { k: 'szellozo', t: 'Be a szellőzőjáratba' },
            ],
      default: 'lepcso',
      resolve: (s, P) => {
        const tul = H.elok(s)[0];
        return P[tul] === P.K ? 'c4_esc_halal' : 'c4_esc_ok';
      },
    },
  });

  S('c4_esc_halal', {
    ch: 4, bg: 'stairs_red',
    enter: (s) => { const t = H.elok(s)[0]; s.esett = t; H.megol(s, t, 'kardos'); },
    beats: [
      ['fx', 'sfx', 'gunshot'], ['fx', 'flash'],
      ['N', 'Kardos jól célzott. Ötven éve nem célzott rosszul.'],
      ['fx', 'death', (s) => s.esett],
    ],
    then: 'epilog',
  });

  S('c4_esc_ok', {
    ch: 4, bg: 'forest_storm',
    beats: [
      ['fx', 'sfx', 'gunshot'],
      ['N', 'A golyó a falba csapódik, ahol egy másodperccel korábban voltál.'],
      ['N', 'Kijutsz. Az erdő. Az eső. Futsz, amíg bírsz, aztán még tovább.'],
    ],
    then: 'epilog',
  });

  S('c4_v1', {
    ch: 4, bg: 'vault', music: 'drone_deep',
    beats: [
      { if: (s) => s.szefProba === 0, then: [
        { if: (s) => s.el.M && s.el.L, then: [['N', 'Két kulcs, két zár, három méter. Máté a balhoz áll, Lili a jobbhoz.']] },
        { if: (s) => !(s.el.M && s.el.L), then: [['N', 'Két kulcs, két zár. Az egyik oldalon a túlélő, a másikon Sándor.']] },
        ['N', 'A zár csak akkor nyit, ha egy tizedmásodpercen belül fordítjátok el.'],
      ] },
    ],
    qte: {
      by: 'co', kind: 'co', ms: (s) => 300 + 170 * s.szefProba,
      prompt: 'HÁROM… KETTŐ… EGY… MOST! Egyszerre fordítsátok el a kulcsot!',
      ok: 'c4_v2', fail: 'c4_v_fail',
    },
  });

  S('c4_v_fail', {
    ch: 4, bg: 'vault',
    enter: (s) => { s.szefProba++; H.expo(s, ['M', 'L'], 1); },
    beats: [
      ['fx', 'sfx', 'alarm_buzz'], ['fx', 'flash', 'red'],
      ['N', 'Hibajelzés. A zár visszaugrik. A nyomás erősödik.'],
      { if: (s) => s.szefProba >= 2, then: [['N', 'Számoljatok hangosan. Együtt.']] },
    ],
    then: 'c4_v1',
  });

  S('c4_v2', {
    ch: 4, bg: 'archive', music: 'archive',
    enter: (s) => { s.archivum = true; H.nyom(s, 'teszt_parancs'); },
    beats: [
      ['fx', 'sfx', 'vault_open'],
      ['N', 'A kerek ajtó hörögve kifordul. Mögötte polcok, polcok, polcok. Magnószalagok fémdobozokban.'],
      ['N', 'Mindegyiken egy dátum és egy szó: CSEND.'],
      ['N', 'A legelső doboz: „1988. XI. 13. – Belső hangosbemondó, teljes felvétel.” Valaki a magnóba fűzi.'],
      ['fx', 'sfx', 'tape_play'],
      ['R', 'Apa! Apa, állítsd le! Ölik egymást! APA!', { name: 'Szalag, 1988', voice: 'young' }],
      ['R', 'Folytassák a tesztet, Kardos honvéd. Ez parancs.', { name: 'Szalag, 1988', voice: 'old' }],
      ['fx', 'sfx', 'tape_stop'],
      { do: (s) => { H.nyom(s, 'kertesz_hangja'); s.kardosIsmert = true; } },
      [(s) => H.vivo(s), 'Ez… ez Kertész hangja. Fiatalabban, de ő az.'],
      { if: (s) => s.sandor.el && s.sandor.szov, then: [['S', 'A fiatal hang… az én vagyok. Húszévesen.']] },
      { if: (s) => !(s.sandor.el && s.sandor.szov), then: [['M', '„Apa.” A saját fiát hagyta odabent.']] },
      ['N', 'A polc végén egy lemezes doboz: „SZOMORÚ VASÁRNAP – CSEND hordozójel”. A keringő, ami egész éjjel szólt.'],
      ['fx', 'sfx', 'alarm_far'],
      ['N', 'Az ajtókeret fölött egy vörös lámpa gyullad ki. Alatta egy felirat: „RIASZTÁS → KAPUHÁZ”.'],
      [(s) => H.vivo(s), 'Most már tudja.'],
      ['fx', 'note', 'Nyom: Kardos hangja'],
    ],
    then: 'c5_1',
  });
})(typeof window !== 'undefined' ? window : globalThis);

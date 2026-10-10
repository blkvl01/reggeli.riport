// 5. FEJEZET – ADÁS. Kardos megérkezik. Szalagok, apa és fiú, az utolsó adás.
(function (root) {
  const { S, H } = root.STORY;

  const sandorJatekos = (s) => s.szerep.p1 === 'S' || s.szerep.p2 === 'S';
  const kardosJatekos = (s) => s.szerep.p1 === 'K' || s.szerep.p2 === 'K';

  S('c5_1', {
    ch: 5, bg: 'archive', music: 'dread',
    enter: (s) => { s.fejezet = 5; H.frissitSzerepek(s); },
    beats: [
      ['fx', 'chapter', '5. fejezet · ADÁS'],
      ['fx', 'title', 'Vasárnap, 04:40'],
      ['fx', 'sfx', 'footsteps_far'],
      ['N', 'Fentről, a lépcsőházból lassú lépések jönnek. Egy bot koppan minden második lépésnél.'],
    ],
    then: (s) => (s.walkieKi ? 'c5_1les' : 'c5_2'),
  });

  // Ha a walkie ki van iktatva, Kardos vakon jön, és lesből meg lehet lepni.
  S('c5_1les', {
    ch: 5, bg: 'archive',
    beats: [['N', 'A riasztás elárulta neki, hogy a széf nyitva van. De a walkie hallgat: azt nem tudja, hol álltok, és mire készültök.']],
    choice: {
      by: 'both', mode: 'vote', timer: 9000,
      prompt: 'Lesből támadtok, vagy szemtől szemben álltok elé?',
      opts: [
        { k: 'les', t: 'Les: az ajtó két oldalán várunk' },
        { k: 'szemben', t: 'Szemtől szemben. Hallani akarom, mit mond.' },
      ],
      default: 'szemben',
      // Óvatossági szabály: a les csak akkor jöhet, ha mindenki benne van.
      resolve: (s, P) => (P[s.szerep.p1] === 'les' && P[s.szerep.p2] === 'les' ? 'c5_les' : 'c5_2'),
    },
  });

  S('c5_les', {
    ch: 5, bg: 'archive', music: 'heartbeat',
    beats: [['N', 'Kardos belép az ajtón. A pisztoly csöve előtte. Egy lépés. Még egy.']],
    qte: { by: 'co', kind: 'co', ms: 450, prompt: 'MOST! Egyszerre ugorjatok rá!', ok: 'c5_les_ok', fail: 'c5_les_fail' },
  });

  S('c5_les_ok', {
    ch: 5, bg: 'archive',
    enter: (s) => { s.kardos = 'artalmatlan'; },
    beats: [
      ['fx', 'sfx', 'struggle'], ['fx', 'shake'],
      ['N', 'Két oldalról értek el egyszerre. A pisztoly csörögve csúszik be a polcok alá.'],
      ['N', 'Kardos a földön fekszik, egy kábellel összekötött csuklóval. Nem ellenkezik.'],
      ['K', 'Harmincnyolc év. És két gyerek egy elemmel győz le.'],
      { if: (s) => s.sandor.el, then: [['N', 'Sándor lép be az ajtón. Az apja ránéz, és elfordítja a fejét.']] },
    ],
    then: 'c5_dontes',
  });

  S('c5_les_fail', {
    ch: 5, bg: 'archive',
    beats: [['N', 'Egy cipőtalp csikordul. Kardos megfordul, és a pisztoly rátok szegeződik.'], ['K', 'Ügyes. De nem elég ügyes.']],
    then: 'c5_2',
  });

  S('c5_2', {
    ch: 5, bg: 'archive',
    beats: [
      ['N', 'Kardos megáll az ajtóban. Tweedzakó, sétabot, egy régi Makarov pisztoly.'],
      { if: (s) => H.rezBe(s), then: [
        ['N', 'A fején egy vastag, katonai fülvédő. Izzad. A szeme ide-oda ugrál.'],
        ['K', 'Fülvédő. Tudom, hogy nem segít. De megnyugtat.'],
      ] },
      { if: (s) => !H.rezBe(s), then: [
        ['K', 'Csend van. Kikapcsolták. Okos gyerekek… túl okosak.'],
      ] },
      ['K', 'Kertész Béla nincs. Kardos Béla vagyok. Nyugalmazott alezredes.'],
      { if: (s) => H.van(s, 'dosszie'), then: [
        [(s) => H.vivo(s), 'Barta Rita. Barta Zoltán. Fehér Gergő.'],
        { if: (s) => s.el.M, then: [['M', 'Kerekes Dani.']] },
        { if: (s) => !s.el.M, then: [['L', 'És Kerekes Dani. Máté bátyja.']] },
        ['K', 'Önkéntesek voltak. Ahogy maguk is. Senki nem kényszerítette magukat, hogy idejöjjenek.'],
      ] },
      { if: (s) => s.el.M, then: [['K', 'A bátyja bátor fiú volt, Máté. Maga is az. Ezért választottam.']] },
      ['K', 'Párokat hoztam ide, mert a párok bíznak egymásban. Legalábbis azt hiszik.'],
      ['K', 'Adják ide a szalagokat. Aztán mindenki hazamegy. Szavamra.'],
    ],
    then: 'c5_3',
  });

  S('c5_3', {
    ch: 5, bg: 'archive', music: 'heartbeat_fast',
    choice: {
      by: 'both', mode: 'hidden', timer: 9000, echo: true,
      prompt: 'Titkos döntés. Kardos pisztolya a szalagokat tartó kézre mutat.',
      opts: (s, who) =>
        who === 'S'
          ? [
              { k: 'tamad', t: 'Rátámadsz az apádra' },
              { k: 'beszel', t: 'Kilépsz elé: „Apa.”' },
              { k: 'var', t: 'Vársz a sötétben' },
            ]
          : [
              { k: 'atad', t: 'Átadod a szalagokat' },
              { k: 'ido', t: 'Húzod az időt: beszélteted' },
              { k: 'tamad', t: 'Támadsz (' + H.fegyverNev(s, who) + ')', if: H.fegyverErtek(s, who) > 1 },
            ].filter((o) => o.if !== false),
      default: (s, who) => (who === 'S' ? 'var' : 'ido'),
      resolve: (s, P) => {
        const lead = H.elok(s);
        const tamadok = lead.filter((x) => P[x] === 'tamad');
        if (tamadok.length) {
          const lovesz = tamadok.find((x) => H.fegyverNev(s, x) === 'jelzőpisztoly');
          const a = lovesz || tamadok[0];
          s.tamado = a; s.tamadoFegyver = H.fegyverNev(s, a);
          if (lovesz) { H.lo(s); return 'c5_flare'; }
          return 'c5_kezi';
        }
        if (sandorJatekos(s) && P.S === 'tamad') return 'c5_rantas';
        if (lead.every((x) => P[x] === 'atad')) return 'c5_alku';
        if (s.sandor.el) {
          if (sandorJatekos(s)) return P.S === 'beszel' ? 'c5_apa' : 'c5_lejart';
          return s.sandor.szov ? 'c5_jel' : 'c5_sandor_magan';
        }
        return 'c5_lejart';
      },
    },
  });

  S('c5_flare', {
    ch: 5, bg: 'archive_fire', music: 'fire',
    enter: (s) => { s.kardos = 'artalmatlan'; s.tuz = true; },
    beats: [
      ['fx', 'sfx', 'flare'], ['fx', 'flash', 'red'], ['fx', 'shake'],
      ['N', 'A jelzőrakéta Kardos mellkasába csapódik. Hátratántorodik, és nekiesik a polcnak.'],
      ['N', 'A magnószalag gyúlékony. Negyven év pora még inkább.'],
      ['fx', 'sfx', 'fire_whoosh'],
      ['N', 'A polc lángra kap. Aztán a mellette lévő. Aztán a mennyezet.'],
      ['K', 'Ne… a szalagok… ne!'],
      ['N', 'Kardos a földön fekszik, égett zakóban, és nem tud felállni.'],
    ],
    then: 'c5_dontes',
  });

  S('c5_kezi', {
    ch: 5, bg: 'archive',
    beats: [['N', (s) => H.nev(s.tamado) + ' előrevetődik. Két lépés. Kardos keze már emelkedik.']],
    qte: { by: (s) => s.tamado, kind: 'press', ms: (s) => 950 - 150 * s.seb[s.tamado], prompt: 'ÜSD KI A KEZÉBŐL!', ok: 'c5_disarm', fail: (s) => (s.sandor.el ? 'c5_sandor_golyo' : 'c5_lelott_tamado') },
  });

  S('c5_disarm', {
    ch: 5, bg: 'archive',
    enter: (s) => { s.kardos = 'artalmatlan'; },
    beats: [
      ['fx', 'sfx', 'impact'], ['fx', 'shake'],
      ['N', (s) => 'A ' + s.tamadoFegyver + ' Kardos csuklóján csattan. A Makarov elsül, a golyó a mennyezetbe megy, a pisztoly kirepül a kezéből.'],
      ['N', 'Az öregember térdre esik. Hirtelen nagyon öregnek látszik.'],
      ['K', 'Harmincnyolc év…'],
    ],
    then: 'c5_dontes',
  });

  S('c5_lelott_tamado', {
    ch: 5, bg: 'archive',
    enter: (s) => { s.celpont = s.tamado; },
    then: 'c5_lelott',
  });

  S('c5_lelott', {
    ch: 5, bg: 'archive_red', music: 'grief',
    beats: [
      ['fx', 'sfx', 'gunshot'], ['fx', 'flash'], ['fx', 'shake'],
      ['N', (s) => 'A lövés visszhangzik a betonfalak között. ' + H.nev(s.celpont) + ' megtántorodik, és a polcnak dől.'],
      { if: (s) => s.celpont === 'L' && s.el.M, then: [['L', 'Máté… a diktafon… ne hagyd…']] },
      { if: (s) => s.celpont === 'L' && !s.el.M, then: [['L', 'Dani… mondd meg Máténak…']] },
      { if: (s) => s.celpont === 'M' && s.el.L, then: [['M', 'Lili… fuss…']] },
      { if: (s) => s.celpont === 'M' && !s.el.L, then: [['M', 'Jövök, Lili…']] },
      { do: (s) => { H.megol(s, s.celpont, 'kardos'); H.frissitSzerepek(s); } },
      ['fx', 'death', (s) => s.celpont],
      { if: (s) => kardosJatekos(s), then: [['fx', 'role', 'K']] },
      { if: (s) => sandorJatekos(s), then: [['fx', 'role', 'S']] },
    ],
    then: 'c5_dontes',
  });

  S('c5_sandor_golyo', {
    ch: 5, bg: 'archive_red', music: 'grief',
    beats: [
      ['N', 'Egy alak vetődik elétek a sötétből.'],
      ['fx', 'sfx', 'gunshot'], ['fx', 'flash'],
      ['N', 'Sándor. A golyó a mellkasát éri. Lassan leül a földre, a polcnak dőlve.'],
      ['K', 'Sanyi? …Sanyi?!'],
      ['S', 'Szia, apa.'],
      { do: (s) => { s.sandor.el = false; s.kardos = 'artalmatlan'; H.frissitSzerepek(s); } },
      ['N', 'Kardos keze elernyed. A pisztoly a földre koppan. Az öregember a fia mellé térdel, és nem áll fel többé.'],
    ],
    then: 'c5_dontes',
  });

  S('c5_alku', {
    ch: 5, bg: 'archive',
    enter: (s) => { s.szalagok = 'kardos'; s.kardos = 'aktiv'; },
    beats: [
      ['N', 'Odaadjátok. Doboz doboz után egy vászontáskába.'],
      ['K', 'Okos gyerekek. Az okos gyerekek megérik a reggelt.'],
      ['K', 'Mondhatnak bárkinek bármit. Ki hinne maguknak? Szén-monoxid, fiatalok. Hallucináció.'],
      ['K', 'Két újabb holttest túl sok kérdést szülne. Két zavarodott fiatal viszont senkit nem érdekel.'],
      ['N', 'Kihátrál az ajtón. A léptei és a bot koppanása elhalnak a lépcsőn.'],
      { if: (s) => s.sandor.el, then: [['N', 'Sándor sokáig áll az üres polcok előtt. Aztán szó nélkül kimegy az erdőbe.']] },
    ],
    then: 'epilog',
  });

  S('c5_jel', {
    ch: 5, bg: 'archive',
    beats: [['N', 'Kardos háta mögött, a lépcsőház sötétjében megmozdul valami. Sándor. Rátok néz, és vár.']],
    choice: {
      by: 'leads', mode: 'vote', timer: 7000, duel: true, echo: true,
      prompt: 'Jeleztek Sándornak?',
      opts: [
        { k: 'jel', t: 'Bólintasz: „Most.”' },
        { k: 'nem', t: 'Alig láthatóan megrázod a fejed' },
      ],
      default: 'nem',
      resolve: (s, P) => (H.valasztas(P, H.elok(s)) === 'jel' ? 'c5_rantas' : 'c5_apa'),
    },
  });

  S('c5_rantas', {
    ch: 5, bg: 'shaft', music: 'climax',
    beats: [
      ['N', 'Sándor hátulról kapja el az apját. A pisztoly elsül, a golyó a falba csapódik.'],
      ['fx', 'sfx', 'struggle'], ['fx', 'shake'],
      ['N', 'Dulakodnak. Hátra, hátra, a liftakna nyitott rácsa felé.'],
      ['K', 'Sándor! Engedj el! Az apád vagyok!'],
      ['S', 'Harmincnyolc éve nem vagy.'],
      ['N', 'Sándor ránéz a túlélőkre. Szinte mosolyog.'],
      ['S', 'Menjetek. És kapcsoljátok le a villanyt, ha kimentek.'],
      { do: (s) => { s.sandorRantotta = true; s.sandor.el = false; s.kardos = 'halott'; H.frissitSzerepek(s); } },
      ['fx', 'sfx', 'fall'],
      ['N', 'Együtt zuhannak le. Hosszú, hosszú ideig nem hallatszik semmi.'],
      ['fx', 'sfx', 'impact_far'],
    ],
    then: 'c5_dontes',
  });

  S('c5_apa', {
    ch: 5, bg: 'archive',
    beats: [
      ['N', 'Sándor kilép a fényre. Fegyver nélkül. Álarc nélkül.'],
      ['S', 'Apa.'],
    ],
    then: (s) => (H.rezBe(s) ? 'c5_apa_szorny' : 'c5_apa_bocsanat'),
  });

  S('c5_apa_bocsanat', {
    ch: 5, bg: 'archive',
    enter: (s) => { s.kardos = 'artalmatlan'; },
    beats: [
      ['N', 'Kardos keze remeg. A Rezonátor hallgat. Semmi nem torzítja a fia arcát.'],
      ['K', 'Sanyi…'],
      ['S', 'Harmincnyolc évig vártam, hogy egyszer a szemembe nézz.'],
      ['N', 'A pisztoly lassan lesüllyed. Kardos leül a lépcsőre, és a tenyerébe temeti az arcát.'],
      ['K', 'Én csak… meg akartam mutatni nekik, hogy működik.'],
      ['S', 'Működött.'],
    ],
    then: 'c5_dontes',
  });

  S('c5_apa_szorny', {
    ch: 5, bg: 'archive_red',
    enter: (s) => { s.sandor.el = false; s.kardos = 'artalmatlan'; H.frissitSzerepek(s); },
    beats: [
      ['N', 'Kardos szeme tágra nyílik. Ő nem a fiát látja.'],
      ['K', 'Mi vagy te? Mi vagy TE?!'],
      ['fx', 'sfx', 'gunshot'], ['fx', 'flash'],
      ['N', 'Sándor összerogy. A Rezonátor dübörög tovább. Harmincnyolc év után megint működött.'],
      ['N', 'Kardos odalép. Lenéz. A „szörny” arca lassan a fia arcává válik.'],
      ['K', 'Nem… Sanyi… nem, nem, nem…'],
      ['N', 'A pisztoly kicsúszik az ujjai közül. Az öregember térdre esik a fia mellett.'],
    ],
    then: 'c5_dontes',
  });

  S('c5_sandor_magan', {
    ch: 5, bg: 'archive',
    beats: [
      ['N', 'A lépcsőházból valaki kiáltva rohan be. Sándor. Egyedül, puszta kézzel, egyenesen az apjának.'],
      ['S', 'APA!'],
    ],
    then: (s) => (H.rezBe(s) ? 'c5_apa_szorny' : 'c5_rantas'),
  });

  S('c5_lejart', {
    ch: 5, bg: 'archive',
    enter: (s) => { s.celpont = H.vivo(s); },
    beats: [
      ['K', 'Lejárt az idő.'],
      ['N', (s) => 'A Makarov csöve ' + H.nev(s.celpont) + ' mellkasára fordul. A kezében a szalagos táska.'],
    ],
    qte: { by: (s) => s.celpont, kind: 'press', ms: (s) => 1000 - 150 * s.seb[s.celpont], prompt: 'UGORJ FÉLRE!', ok: 'c5_elugrott', fail: (s) => (s.sandor.el ? 'c5_sandor_golyo' : 'c5_lelott') },
  });

  S('c5_elugrott', {
    ch: 5, bg: 'archive',
    enter: (s) => {
      const tobbiek = H.elok(s).filter((x) => x !== s.celpont);
      if (tobbiek.length || s.sandor.el) s.kardos = 'artalmatlan';
      s.levetette = tobbiek[0] || (s.sandor.el ? 'S' : null);
    },
    beats: [
      ['fx', 'sfx', 'gunshot'], ['fx', 'flash'],
      ['N', 'Oldalra vetődsz. A golyó egy szalagosdobozt szakít fel mögötted.'],
      { if: (s) => s.levetette === 'M' || s.levetette === 'L', then: [['N', (s) => H.nev(s.levetette) + ' ráveti magát Kardosra. A pisztoly a földre csúszik, és ott marad.']] },
      { if: (s) => s.levetette === 'S', then: [['N', 'Sándor a sötétből kapja el az apja karját, és kicsavarja belőle a pisztolyt.']] },
      { if: (s) => !s.levetette, then: [['N', 'Kardos újratölt. Egyedül vagy vele, és nincs kitől segítséget várni.']] },
    ],
    then: 'c5_dontes',
  });

  // ---------------- A NAGY DÖNTÉS ----------------
  S('c5_dontes', {
    ch: 5, bg: (s) => (s.tuz ? 'archive_fire' : 'archive'),
    then: (s) => (H.elok(s).length === 0 || s.szalagok === 'kardos' ? 'epilog' : 'c5_dontes2'),
  });

  S('c5_dontes2', {
    ch: 5, bg: (s) => (s.tuz ? 'archive_fire' : 'archive'), music: (s) => (s.tuz ? 'fire' : 'resolve'),
    beats: [
      { if: (s) => s.tuz, then: [['N', 'A tűz terjed. A füst a mennyezet alatt gomolyog. Perceitek vannak.']] },
      { if: (s) => s.kardos === 'aktiv', then: [['N', 'Kardos még mindig fegyveres, valahol a füstben vagy a lépcsőházban.']] },
      ['N', 'A szalagok egy vászontáskában. Fent a rádióteremben ott az állomás adója, ami még mindig működik.'],
    ],
    choice: {
      by: 'leads', mode: 'vote', timer: 14000, duel: true, echo: true,
      prompt: 'Mi legyen a szalagokkal?',
      opts: [
        { k: 'eter', t: 'Élő adás az állomás adóján, most. Hallja az egész ország.' },
        { k: 'rendorseg', t: 'Elvisszük a rendőrségre' },
        { k: 'menekul', t: 'Itt hagyjuk. Csak el innen.' },
      ],
      resolve: (s, P) => {
        const v = H.valasztas(P, H.elok(s));
        if (v === 'eter') return s.kardos === 'aktiv' || s.tuz ? 'c5_aldozat' : 'c5_tarcsa';
        if (v === 'rendorseg') return s.kardos === 'aktiv' ? 'c5_szokes' : (s.szalagok = 'rendorseg', 'c5_ki');
        s.szalagok = s.tuz ? 'bent' : s.kardos === 'aktiv' ? 'kardos' : 'bent';
        return 'c5_ki';
      },
    },
  });

  S('c5_aldozat', {
    ch: 5, bg: (s) => (s.tuz ? 'archive_fire' : 'radio_room_red'), music: 'sacrifice',
    beats: [
      ['N', 'A régi adó kézi üzemmódban megy. Valakinek hat percig nyomva kell tartania a gombot, és itt kell maradnia.'],
      { if: (s) => s.tuz, then: [['N', 'A tűz már a lépcsőházban van.']] },
      { if: (s) => s.kardos === 'aktiv', then: [['N', 'Kardos a lépcsőházban vár. Aki itt marad, azt meg fogja találni.']] },
    ],
    choice: {
      by: 'leads', mode: 'hidden', timer: 10000, echo: true,
      prompt: 'Titkos döntés. Ki marad?',
      opts: (s) =>
        H.elok(s).length === 2
          ? [
              { k: 'en', t: 'Én maradok.' },
              { k: 'egyutt', t: 'Együtt megyünk. Adás nélkül.' },
            ]
          : [
              { k: 'en', t: 'Maradok. Az igazság kimegy.' },
              { k: 'egyutt', t: 'Menekülök a szalagokkal.' },
            ],
      default: 'egyutt',
      resolve: (s, P) => {
        const elok = H.elok(s);
        const maradok = elok.filter((x) => P[x] === 'en');
        s.szalagok = 'eter';
        if (maradok.length === 1) { s.aldozat = maradok[0]; return 'c5_adas_aldozat'; }
        if (maradok.length === 2) return 'c5_adas_ketten';
        s.szalagok = null;
        return s.kardos === 'aktiv' ? 'c5_szokes' : (s.szalagok = 'rendorseg', 'c5_ki');
      },
    },
  });

  S('c5_szokes', {
    ch: 5, bg: 'stairs_red', music: 'chase',
    enter: (s) => { s.celpont = H.vivo(s); },
    beats: [['N', (s) => H.nev(s.celpont) + ' a vállára veti a szalagos táskát, és nekiindul. Kardos valahol fent vár.']],
    // Aktív Kardos csak akkor maradhat, ha az egyik főszereplő már halott, ilyenkor a játékosa irányítja Kardost.
    then: (s) => (kardosJatekos(s) ? 'c5_szokes_jatek' : 'c5_szokes_ok'),
  });

  S('c5_szokes_jatek', {
    ch: 5, bg: 'stairs_red',
    choice: {
      by: 'both', mode: 'hidden', timer: 8000, echo: true,
      prompt: 'Titkos döntés. A szökevény választ utat, Kardos célba vesz egyet.',
      opts: (s, who) =>
        who === 'K'
          ? [
              { k: 'lepcso', t: 'A lépcsőházra célzol' },
              { k: 'akna', t: 'A liftaknára célzol' },
              { k: 'szellozo', t: 'A szellőzőjáratra célzol' },
            ]
          : [
              { k: 'lepcso', t: 'Fel a lépcsőn' },
              { k: 'akna', t: 'Fel a liftakna létráján' },
              { k: 'szellozo', t: 'Át a szellőzőjáraton' },
            ],
      default: 'lepcso',
      resolve: (s, P) => (P[s.celpont] === P.K ? 'c5_szokes_halal' : 'c5_szokes_ok'),
    },
  });

  S('c5_szokes_ok', {
    ch: 5, bg: 'courtyard_dawn',
    enter: (s) => { s.szalagok = 'rendorseg'; },
    beats: [
      ['fx', 'sfx', 'gunshot'],
      ['N', 'A golyó mellétek csapódik a betonba. Aztán már kint vagytok, a hajnali szürkeségben.'],
    ],
    then: 'c5_ki',
  });

  S('c5_szokes_halal', {
    ch: 5, bg: 'stairs_red',
    enter: (s) => { H.megol(s, s.celpont, 'kardos'); s.szalagok = 'kardos'; },
    beats: [
      ['fx', 'sfx', 'gunshot'], ['fx', 'flash'],
      ['N', 'Egy lövés. A táska kicsúszik a kézből, és legurul a lépcsőn. Kardos lábához.'],
      ['fx', 'death', (s) => s.celpont],
    ],
    then: 'c5_ki',
  });

  // Titkos kód: 4 8 15 16 23 42 beütése az adó tárcsáján.
  S('c5_tarcsa', {
    ch: 5, bg: 'radio_room', music: 'resolve',
    beats: [
      ['N', 'Fent a rádióteremben az adó bemelegszik. A frekvenciatárcsa halványan világít.'],
      [(s) => (s.el.M ? 'M' : 'L'), 'Ha bármelyik rádió a völgyben szól, ezt most hallani fogja.'],
    ],
    dial: { code: '4815162342', set: (s) => { s.titkosKod = true; }, then: 'c5_adas' },
  });

  S('c5_adas', {
    ch: 5, bg: 'radio_room', music: 'broadcast',
    enter: (s) => { s.szalagok = 'eter'; },
    beats: [
      ['fx', 'sfx', 'onair'],
      ['fx', 'title', '● ADÁSBAN'],
      { if: (s) => s.el.L, then: [
        ['L', 'Itt Szántó Lili, a Zajszint műsorából. Ez nem egy szokásos epizód.'],
        ['L', 'A Vadkő-tetői VK-7 állomásról beszélek. Ez az utolsó adás innen.'],
      ] },
      { if: (s) => !s.el.L, then: [['M', 'Itt Kerekes Máté beszél, a Vadkő-tetői VK-7 állomásról. Ez az utolsó adás innen.']] },
      ['N', 'Elindul a szalag. Egy fiatal hang: „Apa, állítsd le!” Egy öreg hang: „Folytassák a tesztet.”'],
      ['N', 'A völgyben, a hajnali tejszállítók fülkéjében, egy ébren fekvő nagymama konyhai rádiójában, egy rendőrautóban mind ez szól.'],
      { if: (s) => s.el.M, then: [['M', 'És… még egy dolog. A bátyám neve Kerekes Dani volt. Itt halt meg 2010-ben. Nem tévedt el.']] },
    ],
    then: 'epilog',
  });

  S('c5_adas_aldozat', {
    ch: 5, bg: (s) => (s.tuz ? 'archive_fire' : 'radio_room_red'), music: 'sacrifice',
    beats: [
      ['fx', 'sfx', 'onair'],
      ['fx', 'title', '● ADÁSBAN'],
      { if: (s) => H.elok(s).length === 2, then: [
        ['N', (s) => H.nev(H.masik(s.aldozat)) + ' nem akar elmenni. ' + H.nev(s.aldozat) + ' egyszerűen kitolja az ajtón.'],
        { if: (s) => s.aldozat === 'M', then: [['M', 'Menj. Valakinek el kell mesélnie. Te jobban tudsz mesélni.']] },
        { if: (s) => s.aldozat === 'L', then: [['L', 'Menj. És vidd a diktafont. Abban minden benne van. Én is.']] },
      ] },
      ['N', 'A gomb nyomva. A szalag forog. Négy perc. Öt.'],
      { if: (s) => s.kardos === 'aktiv', then: [['fx', 'sfx', 'footsteps'], ['N', 'Lépések a folyosón. Egy bot koppan.'], ['fx', 'sfx', 'gunshot']] },
      { if: (s) => s.kardos !== 'aktiv', then: [['fx', 'sfx', 'fire_whoosh'], ['N', 'A lángok elérik az ajtót.']] },
      ['N', 'A szalag a hatodik perc végéig megy. A gomb végig nyomva marad.'],
      { do: (s) => { H.megol(s, s.aldozat, 'aldozat'); } },
      ['fx', 'death', (s) => s.aldozat],
    ],
    then: 'epilog',
  });

  S('c5_adas_ketten', {
    ch: 5, bg: (s) => (s.tuz ? 'archive_fire' : 'radio_room_red'), music: 'sacrifice',
    beats: [
      ['fx', 'sfx', 'onair'],
      ['fx', 'title', '● ADÁSBAN'],
      ['N', 'Egyikőtök sem hajlandó elmenni.'],
      ['L', 'Akkor együtt.'],
      ['M', 'Mindig is ez volt a terv.'],
      ['N', 'Két kéz ugyanazon a gombon. A szalag forog. Odakint a völgyben minden rádió szól.'],
      { if: (s) => s.kardos === 'aktiv', then: [['fx', 'sfx', 'footsteps'], ['fx', 'sfx', 'gunshot'], ['fx', 'sfx', 'gunshot']] },
      { if: (s) => s.kardos !== 'aktiv', then: [['fx', 'sfx', 'fire_whoosh']] },
      { do: (s) => { H.megol(s, 'M', 'aldozat'); H.megol(s, 'L', 'aldozat'); } },
      ['fx', 'death', 'M'], ['fx', 'death', 'L'],
    ],
    then: 'epilog',
  });

  S('c5_ki', {
    ch: 5, bg: 'courtyard_dawn', music: 'aftermath',
    beats: [
      { if: (s) => H.elok(s).length > 0, then: [['N', 'Kint hajnalodik. A torony piros fénye utoljára felvillan, aztán kialszik.']] },
      { if: (s) => s.tuz, then: [['N', 'Mögöttetek az állomás alsó szintjeiből fekete füst gomolyog.']] },
    ],
    then: 'epilog',
  });
})(typeof window !== 'undefined' ? window : globalThis);

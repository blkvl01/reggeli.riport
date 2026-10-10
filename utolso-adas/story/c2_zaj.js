// 2. FEJEZET – ZAJ. A generátor jár, a Rezonátor dolgozik. Megjelenik a „gázálarcos”.
(function (root) {
  const { S, H } = root.STORY;
  const MASZK = { name: 'Gázálarcos' };

  S('c2_1', {
    ch: 2, bg: 'corridor_lit', music: 'waltz',
    enter: (s) => {
      s.fejezet = 2; s.kodHallotta = true;
      H.expo(s, ['M', 'L'], s.gen === 'jatekosok' ? 2 : 1);
    },
    beats: [
      ['fx', 'chapter', '2. fejezet · ZAJ'],
      ['N', 'A hangosbemondóból karcos keringő szól. Valahonnan nagyon messziről, nagyon régről.'],
      ['L', 'Ez honnan szól?'],
      ['M', 'A hangszórókból. De senki nem tett fel lemezt.'],
      ['fx', 'music', 'numbers'],
      ['NUM', 'Figyelem. Figyelem.'],
      ['NUM', 'Négy. Nyolc. Tizenöt. Tizenhat. Huszonhárom. Negyvenkettő.'],
      ['NUM', 'Négy. Nyolc. Tizenöt. Tizenhat. Huszonhárom. Negyvenkettő.'],
      ['L', 'Ezeket a számokat ismerem valahonnan.'],
      ['M', 'Ha száznyolc percenként be kell ütni őket valahova, én hazamegyek.'],
      ['fx', 'music', 'drone'],
      ['N', 'A zene elhallgat. Ami marad, az egy mély, tompa nyomás a dobhártyátok mögött.'],
      ['L', 'Neked is nyomja a füled?'],
      ['M', 'Mint repülőn, leszálláskor.'],
      { if: (s) => s.gen === 'kardos', then: [
        ['L', 'Máté. Valaki bekapcsolta. Valaki itt van.'],
        ['M', 'Vagy egy időzítő. Régi rendszer.'],
        ['L', 'Ezt te sem hiszed el.'],
      ] },
    ],
    then: 'c2_2',
  });

  S('c2_2', {
    ch: 2, bg: 'radio_room', music: 'drone',
    beats: [
      ['fx', 'sfx', 'walkie'],
      ['K', 'Halló, fiatalok? Látom, van áram.'],
      ['M', 'Honnan látja?'],
      ['K', 'A fények, fiam. Messzire látszanak a völgyben.'],
      { if: (s) => s.gen === 'kardos', then: [
        ['M', 'Kertész úr, nem mi kapcsoltuk be. Van itt valaki.'],
        ['K', 'Ó, biztos az automatika. Ezek a régi rendszerek maguktól is elindulnak.'],
      ] },
      ['K', 'A raktárt a -2-n találják. A kulcs nyitja. Szép estét.'],
      ['fx', 'sfx', 'walkie_off'],
      ['N', 'Lili a bemondópult mögött megtalálja a lemezjátszót. A tű még a lemez szélén pihen.'],
      ['L', 'A címke: „Szomorú vasárnap”. Az öngyilkos dal. Hát persze.'],
      ['M', 'Kár, hogy nem a Macskafogó betétdala.'],
    ],
    then: 'c2_3',
  });

  S('c2_3', {
    ch: 2, bg: 'corridor_lit',
    choice: {
      by: 'both', mode: 'vote', timer: 12000, echo: true,
      prompt: 'Az állomás nagy. Szétváltok, vagy együtt maradtok?',
      opts: [
        { k: 'szet', t: 'Szétválunk: gyorsabb. Walkie-n tartjuk a kapcsolatot.' },
        { k: 'egyutt', t: 'Együtt maradunk. Ez a horrorfilmek első szabálya.' },
      ],
      // Óvatossági szabály: elég, ha egyikőtök nemet mond, és együtt maradtok.
      resolve: (s, P) => (P.M === 'szet' && P.L === 'szet' ? 'c2_s1' : 'c2_t1'),
    },
  });

  // ---------- SZÉTVÁLÁS ----------
  S('c2_s1', {
    ch: 2, bg: 'guard_room',
    enter: (s) => { s.szetvalt = true; H.expo(s, ['M'], 1); s.pisztoly = 'M'; },
    beats: [
      ['fx', 'title', 'MÁTÉ · őrszoba'],
      ['N', 'Fegyverszekrény, üresen. Csak egy narancssárga jelzőpisztoly maradt benne, két patronnal.'],
      ['M', 'Jobb, mint a semmi.'],
      ['N', 'Az asztalon egy kazetta. Ráírva filccel: VISSZHANG. Mellette egy cetli: „HALLGASD MEG.”'],
      ['N', 'A cetli tintája még nem fakult ki.'],
      { do: (s) => { if (!s.kazettak.includes(1)) s.kazettak.push(1); } },
      ['fx', 'sfx', 'tape_play'],
      ['R', 'Én vagyok! Kérlek… kérlek, én vagyok! Ne—', { name: 'Kazetta', voice: 'woman' }],
      ['fx', 'sfx', 'impact_muffled'],
      ['fx', 'sfx', 'tape_stop'],
      ['M', '…Mi a franc volt ez?'],
      ['fx', 'bg', 'barracks'],
      ['N', 'A szomszédos hálóteremben egy emeletes ágy alól egy füzet lóg ki. Napló.'],
      { do: (s) => H.nyom(s, 'rita_naplo') },
      ['fx', 'doc', 'rita'],
      ['R', '„1998. október 18., vasárnap. K. úr megint vasárnap jön. Azt mondja, a két kulcsot egyszerre kell elfordítani.”', { name: 'Napló', voice: 'none' }],
      ['R', '„Zoli rosszul alszik. Azt mondja, valaki áll éjjel az ágy végében. Én is láttam. Nem merem neki megmondani.”', { name: 'Napló', voice: 'none' }],
      ['fx', 'note', 'Nyom: Rita naplója'],
    ],
    then: 'c2_s2',
  });

  S('c2_s2', {
    ch: 2, bg: 'corridor_lit',
    enter: (s) => { H.expo(s, ['L'], 1); s.fejsze = 'L'; },
    beats: [
      ['fx', 'title', 'LILI · keleti folyosó'],
      ['N', 'A falon egy piros tűzoltószekrény, benne fejsze. Lili kiveszi.'],
      ['L', 'Jó. Most már én vagyok a horrorfilm végén maradó lány.'],
      { if: (s) => H.hallucinal(s, 'L'), then: [
        ['fx', 'ghost'],
        ['N', 'A szeme sarkából valakit lát a folyosó végén. Odakapja a fejét. Senki.'],
      ] },
      ['fx', 'sfx', 'glass'],
      ['N', 'Az ablaküveg mögött egy arc. Gázálarc. Két kerek, üres szemüveg.'],
      ['fx', 'jump', 'gasmask'],
      ['N', 'Eltűnik. Két másodperccel később a folyosó végén nyikordul az ajtó.'],
      ['L', 'Máté… MÁTÉ!'],
      ['fx', 'sfx', 'walkie'],
    ],
    then: 'c2_s3',
  });

  S('c2_s3', {
    ch: 2, bg: 'guard_room',
    choice: {
      by: 'M', mode: 'solo', timer: 5000, echo: true,
      prompt: 'Máté: Lili sikolt a walkie-ban.',
      opts: [
        { k: 'rohan', t: 'Rohansz hozzá azonnal' },
        { k: 'tolt', t: 'Előbb megtöltöd a pisztolyt' },
      ],
      default: 'tolt',
      resolve: (s, P) => { s.mateRohan = P.M === 'rohan'; return 'c2_s4'; },
    },
  });

  S('c2_s4', {
    ch: 2, bg: 'corridor_lit', music: 'chase',
    beats: [['N', 'A gázálarcos alak kilép a sötétből. Lassan jön Lili felé. Nem siet.']],
    choice: {
      by: 'L', mode: 'solo', timer: 6000, echo: true,
      prompt: 'Lili: nincs sok időd.',
      opts: [
        { k: 'tamad', t: 'Rátámadsz a fejszével' },
        { k: 'bujik', t: 'Bebújsz a tűzoltószekrénybe' },
        { k: 'szolit', t: 'Megszólítod: „Ki maga?”' },
      ],
      default: 'bujik',
      resolve: (s, P) => 'c2_s5_' + P.L,
    },
  });

  S('c2_s5_tamad', {
    ch: 2, bg: 'corridor_lit',
    qte: { by: 'L', kind: 'press', ms: 1000, prompt: 'Lili: SUHINTS!', ok: 'c2_s6_olt', fail: 'c2_s6_lefogta' },
  });

  S('c2_s6_olt', {
    ch: 2, bg: 'corridor_red',
    enter: (s) => { s.sandor.el = false; s.sandor.talalkozott = true; },
    beats: [
      ['fx', 'sfx', 'impact'], ['fx', 'shake'], ['fx', 'flash', 'red'],
      ['N', 'A fejsze a nyaka és a válla közé csapódik. Az alak térdre rogy, és nem kel fel többé.'],
      ['N', 'Lili hátratántorodik. A gázálarc szemüvege bepárásodik, aztán kitisztul. Már nem lélegzik.'],
      ['L', 'Én… ő… ő jött felém…'],
      { if: (s) => s.mateRohan, then: [['N', 'Máté befut. Megáll. Nem szól semmit, csak magához húzza Lilit.']] },
      { if: (s) => !s.mateRohan, then: [['N', 'Máté csak fél perc múlva ér oda, a töltött pisztollyal. Már nincs kire fognia.']] },
      ['M', 'Nem a te hibád. Hallod? Megtámadott.'],
      ['N', 'Egyikőtök sem meri levenni róla a gázálarcot.'],
    ],
    then: 'c2_end',
  });

  S('c2_s6_lefogta', {
    ch: 2, bg: 'corridor_red',
    enter: (s) => { s.sandor.talalkozott = true; },
    beats: [
      ['N', 'Az alak elkapja a nyelet, és kicsavarja a fejszét Lili kezéből. A falnak löki.'],
      ['fx', 'sfx', 'impact'], ['fx', 'shake'],
      { if: (s) => s.mateRohan, then: [
        ['N', 'Ekkor Máté befordul a sarkon, és a jelzőpisztolyt az alakra szegezi.'],
        ['M', 'ENGEDD EL!'],
        ['N', 'Az alak elengedi Lilit, és a lépcső felé hátrál. A fejszét eldobja.'],
        { do: (s) => H.bizalom(s, 2) },
        ['fx', 'note', 'Lili ezt nem felejti el.'],
      ] },
      { if: (s) => !s.mateRohan, then: [
        { do: (s) => { s.seb.L += 1; H.bizalom(s, -1); } },
        ['N', 'Lili feje a betonnak csapódik. Csillagokat lát.'],
        ['N', 'Az alak fölé hajol. A gázálarc szűrője sípol.'],
        ['S', 'Menjetek… el…', MASZK],
        ['N', 'Elejti a fejszét, és eltűnik. Máté csak most ér oda.'],
        ['fx', 'note', 'Lili ezt nem felejti el.'],
      ] },
    ],
    then: 'c2_end',
  });

  S('c2_s5_bujik', {
    ch: 2, bg: 'locker',
    qte: { by: 'L', kind: 'hold', ms: 4500, prompt: 'Lili: TARTSD VISSZA A LÉLEGZETED! Tartsd nyomva a gombot!', ok: 'c2_s6_elment', fail: 'c2_s6_megtalalta' },
  });

  S('c2_s6_elment', {
    ch: 2, bg: 'locker',
    enter: (s) => { s.sandor.talalkozott = true; },
    beats: [
      ['N', 'A szekrény résén át látod: megáll előtted. A szűrő sípol. Egy örökkévalóság.'],
      ['N', 'Aztán továbbmegy. A földön, ahol állt, egy összegyűrt cetli: „MENJETEK EL.”'],
      { if: (s) => s.mateRohan, then: [['N', 'Máté lihegve fordul be a sarkon. Egyedül talál rád, élve.'], { do: (s) => H.bizalom(s, 1) }] },
    ],
    then: 'c2_end',
  });

  S('c2_s6_megtalalta', {
    ch: 2, bg: 'locker',
    enter: (s) => { s.sandor.talalkozott = true; s.gyanu = true; },
    beats: [
      ['fx', 'sfx', 'locker_open'], ['fx', 'jump', 'gasmask'],
      ['N', 'Az ajtó kicsapódik. Egy kesztyűs kéz a gallérodnál fogva kirángat.'],
      ['N', 'A gázálarc egészen közel. Mögötte egy szem, véreres és fáradt.'],
      ['S', 'Ne bízz… a kertészben.', MASZK],
      ['N', 'Elenged. Eltűnik a lépcsőházban.'],
      { if: (s) => s.mateRohan, then: [['N', 'Máté két másodperccel később ér oda. Lili remegve kapaszkodik belé.'], { do: (s) => H.bizalom(s, 1) }] },
      { if: (s) => !s.mateRohan, then: [['N', 'Máté egy perccel később ér oda. Lili addig egyedül ül a földön.'], { do: (s) => H.bizalom(s, -1) }, ['fx', 'note', 'Lili ezt nem felejti el.']] },
    ],
    then: 'c2_end',
  });

  S('c2_s5_szolit', {
    ch: 2, bg: 'corridor_lit',
    enter: (s) => { s.sandor.talalkozott = true; s.sandor.jo = true; },
    beats: [
      ['L', 'Ki maga? Mit akar?'],
      ['N', 'Az alak megtorpan. Hosszú csend. A szűrő sípol.'],
      ['S', 'Menjetek el. Amíg tudtok.', MASZK],
      ['N', 'Felemeli a kezét, és a mennyezeti hangszóróra mutat. Aztán megrázza a fejét, és lemegy a lépcsőn.'],
      { if: (s) => s.mateRohan, then: [['N', 'Máté befut a pisztollyal. Már csak a lépcsőházban visszhangzó lépteket hallja.'], { do: (s) => H.bizalom(s, 1) }] },
    ],
    then: 'c2_end',
  });

  // ---------- EGYÜTT ----------
  S('c2_t1', {
    ch: 2, bg: 'guard_room',
    enter: (s) => H.expo(s, ['M', 'L'], 1),
    beats: [
      ['N', 'Őrszoba. Üres fegyverszekrény, benne csak egy narancssárga jelzőpisztoly, két patronnal.'],
      ['N', 'A folyosón egy piros szekrényben tűzoltófejsze.'],
      ['N', 'Az asztalon egy kazetta. Filccel ráírva: VISSZHANG. Mellette egy cetli: „HALLGASD MEG.”'],
      { do: (s) => { if (!s.kazettak.includes(1)) s.kazettak.push(1); } },
      ['fx', 'sfx', 'tape_play'],
      ['R', 'Én vagyok! Kérlek… kérlek, én vagyok! Ne—', { name: 'Kazetta', voice: 'woman' }],
      ['fx', 'sfx', 'impact_muffled'],
      ['fx', 'sfx', 'tape_stop'],
      ['L', 'Ez egy nő hangja. Mintha… mintha én lennék, csak idősebb.'],
      ['M', 'Ki hagy itt ilyet? És kinek?'],
    ],
    then: 'c2_t2',
  });

  S('c2_t2', {
    ch: 2, bg: 'guard_room',
    choice: {
      by: 'L', mode: 'solo', timer: 10000,
      prompt: 'Lili: ki vigye a jelzőpisztolyt? A másiknál lesz a fejsze.',
      opts: [
        { k: 'M', t: 'Máté vigye a pisztolyt, nálam a fejsze' },
        { k: 'L', t: 'Én viszem a pisztolyt, Máté a fejszét' },
      ],
      default: 'M',
      resolve: (s, P) => { s.pisztoly = P.L; s.fejsze = H.masik(P.L); return 'c2_t3'; },
    },
  });

  S('c2_t3', {
    ch: 2, bg: 'corridor_lit', music: 'tension',
    beats: [
      { if: (s) => H.hallucinal(s, 'M'), then: [['fx', 'ghost'], ['N', 'Máté egy pillanatra két alakot lát a folyosó végén. Pislant: csak egy van.']] },
      ['fx', 'sfx', 'flicker'],
      ['N', 'A folyosó végén áll valaki. Gázálarc. Katonai köpeny. Felemeli a kezét, tenyérrel felétek.'],
      ['fx', 'jump', 'gasmask'],
    ],
    choice: {
      by: 'both', mode: 'hidden', timer: 6000, echo: true,
      prompt: 'Titkos döntés. Az alak lassan elindul felétek.',
      opts: (s, who) => [
        { k: 'tamad', t: 'Támadsz (' + H.fegyverNev(s, who) + ')' },
        { k: 'var', t: 'Nem mozdulsz' },
        { k: 'fut', t: 'Elfutsz' },
      ],
      default: 'var',
      resolve: (s, P) => {
        s.sandor.talalkozott = true;
        const t = ['M', 'L'].filter((x) => P[x] === 'tamad');
        if (t.length === 2) { H.lo(s); return 'c2_t4_olt'; }
        if (t.length === 1) {
          const a = t[0];
          s.tamado = a;
          if (s.pisztoly === a) { H.lo(s); return 'c2_t4_lott'; }
          return 'c2_t4_fejsze';
        }
        if (P.M === 'fut' || P.L === 'fut') return 'c2_t4_fut';
        return 'c2_t4_var';
      },
    },
  });

  S('c2_t4_olt', {
    ch: 2, bg: 'corridor_red',
    enter: (s) => { s.sandor.el = false; },
    beats: [
      ['fx', 'sfx', 'flare'], ['fx', 'flash', 'red'],
      ['N', 'A jelzőrakéta a mellkasába csapódik, vörös fény önti el a folyosót. A fejsze a következő pillanatban éri.'],
      ['fx', 'sfx', 'impact'], ['fx', 'shake'],
      ['N', 'Az alak összecsuklik. A gázálarc üvegén megcsillan a vörös fény, aztán kialszik.'],
      ['L', 'Ő… meghalt?'],
      ['M', 'Ránk támadt. Ugye? Ránk támadt.'],
      ['N', 'Egyikőtök sem emlékszik pontosan, hogy támadott-e.'],
    ],
    then: 'c2_end',
  });

  S('c2_t4_lott', {
    ch: 2, bg: 'corridor_red',
    enter: (s) => { s.sandor.sebesult = true; },
    beats: [
      ['fx', 'sfx', 'flare'], ['fx', 'flash', 'red'],
      ['N', 'A jelzőrakéta a vállát éri. A köpenye lángra kap.'],
      ['fx', 'sfx', 'scream_male'],
      ['N', 'Az alak a falhoz csapja magát, elfojtja a lángot, és üvöltve eltűnik a lépcsőházban.'],
      ['N', 'A folyosón égett gyapjú és benzin szaga marad.'],
    ],
    then: 'c2_end',
  });

  S('c2_t4_fejsze', {
    ch: 2, bg: 'corridor_lit',
    qte: { by: (s) => s.tamado, kind: 'press', ms: 1000, prompt: 'SUHINTS!', ok: 'c2_t5_olt', fail: 'c2_t5_lefogta' },
  });

  S('c2_t5_olt', {
    ch: 2, bg: 'corridor_red',
    enter: (s) => { s.sandor.el = false; },
    beats: [
      ['fx', 'sfx', 'impact'], ['fx', 'shake'], ['fx', 'flash', 'red'],
      ['N', 'A fejsze telibe találja. Az alak térdre rogy, aztán oldalra dől. Nem mozdul többé.'],
      ['N', 'A gázálarc szűrője még kétszer sípol. Aztán csend.'],
      ['M', 'Mi… mit csináltunk?'],
    ],
    then: 'c2_end',
  });

  S('c2_t5_lefogta', {
    ch: 2, bg: 'corridor_lit',
    enter: (s) => { s.seb[s.tamado] += 1; },
    beats: [
      ['N', 'Az alak elkapja a nyelet, kicsavarja, és a támadót a falhoz vágja.'],
      ['fx', 'sfx', 'impact'], ['fx', 'shake'],
      ['S', 'Menjetek… el!', MASZK],
      ['N', 'A fejszét a földre dobja, és eltűnik a sötétben.'],
    ],
    then: 'c2_end',
  });

  S('c2_t4_fut', {
    ch: 2, bg: 'locker', music: 'chase',
    beats: [['N', 'Futtok. Egy öltözőszekrény, ketten préselődtök be. Lépések a folyosón.']],
    qte: { by: 'co', kind: 'hold', ms: 5000, prompt: 'TARTSÁTOK VISSZA A LÉLEGZETETEKET! Mindketten tartsátok nyomva a gombot!', ok: 'c2_t5_elment', fail: 'c2_t5_megtalalta' },
  });

  S('c2_t5_elment', {
    ch: 2, bg: 'locker',
    enter: (s) => H.bizalom(s, 1),
    beats: [
      ['N', 'A lépések megállnak a szekrény előtt. A szűrő sípol. Lili keze Mátéén.'],
      ['N', 'Aztán a lépések továbbmennek. A szekrény előtt egy összegyűrt cetli: „MENJETEK EL.”'],
    ],
    then: 'c2_end',
  });

  S('c2_t5_megtalalta', {
    ch: 2, bg: 'locker',
    enter: (s) => { s.gyanu = true; },
    beats: [
      ['fx', 'sfx', 'locker_open'], ['fx', 'jump', 'gasmask'],
      ['N', 'Az ajtó kicsapódik. A gázálarc egészen közel. Mögötte egy véreres, fáradt szem.'],
      ['S', 'Ne bízzatok… a kertészben.', MASZK],
      ['N', 'Becsapja az ajtót. Mire kimásztok, a folyosó üres.'],
    ],
    then: 'c2_end',
  });

  S('c2_t4_var', {
    ch: 2, bg: 'corridor_lit',
    enter: (s) => { s.sandor.jo = true; },
    beats: [
      ['N', 'Nem mozdultok. Az alak is megáll, úgy tíz méterre.'],
      ['N', 'Lassan leengedi a kezét. Aztán a mennyezeti hangszóróra mutat, és megrázza a fejét.'],
      ['S', 'Kapcsoljátok… le. És menjetek… el.', MASZK],
      ['N', 'Megfordul, és lemegy a lépcsőn.'],
      ['L', 'Ez… figyelmeztetett minket?'],
    ],
    then: 'c2_end',
  });

  // ---------- FEJEZETZÁRÁS ----------
  S('c2_end', {
    ch: 2, bg: 'radio_room',
    beats: [['fx', 'sfx', 'walkie'], ['K', 'Halló? Kiabálást hallottam. Minden rendben odafönt?']],
    choice: {
      by: 'M', mode: 'solo', timer: 9000,
      prompt: 'Máté: mit mondasz Kertésznek?',
      opts: [
        { k: 'elmond', t: '„Van itt valaki. Gázálarcban.”' },
        { k: 'hallgat', t: '„Semmi. Csak egy patkány.”' },
      ],
      default: 'hallgat',
      resolve: (s, P) => 'c2_end_' + P.M,
    },
  });

  S('c2_end_elmond', {
    ch: 2, bg: 'radio_room',
    beats: [
      ['K', '…Gázálarc.'],
      ['N', 'Hosszú szünet. Csak a recsegés.'],
      ['K', 'Biztos csak egy hajléktalan. Ne törődjenek vele. Menjenek le a -2-re.'],
      { if: (s) => s.gyanu, then: [['L', 'Nem kérdezte meg, hogy jól vagyunk-e.']] },
    ],
    then: 'c2_close',
  });

  S('c2_end_hallgat', {
    ch: 2, bg: 'radio_room',
    enter: (s) => { s.gyanu = true; },
    beats: [
      ['M', 'Semmi. Csak egy patkány.'],
      ['K', 'Egy patkány gázálarcban?'],
      ['N', 'Máté megdermed. Erről egy szót sem szólt.'],
      ['K', '…Vicceltem, fiam. Menjenek le a -2-re. Jó munkát.'],
      ['L', 'Máté. Honnan tudta?'],
    ],
    then: 'c2_close',
  });

  S('c2_close', {
    ch: 2, bg: 'corridor_lit',
    beats: [
      { if: (s) => s.sandor.el, then: [
        ['fx', 'sfx', 'pa_click'],
        ['N', 'A hangosbemondó kattan. Valaki lélegzik bele, nehezen, szűrőn keresztül.'],
        ['S', 'Menjetek el.', { name: 'Hangosbemondó' }],
        ['fx', 'sfx', 'pa_click'],
      ] },
      { if: (s) => !s.sandor.el, then: [
        ['fx', 'sfx', 'pa_click'],
        ['N', 'A hangosbemondó kattan. A keringő újraindul, magától.'],
        ['N', 'Ugyanott, ahol abbamaradt.'],
      ] },
    ],
    then: 'c3_1',
  });
})(typeof window !== 'undefined' ? window : globalThis);

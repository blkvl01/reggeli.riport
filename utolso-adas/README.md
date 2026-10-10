# AZ UTOLSÓ ADÁS

*Egy éjszaka. Két kulcs. Tíz befejezés.*

Kétszemélyes, helyi kooperatív, döntésalapú horror egyetlen gépen, magyarul.
2026 októberében, egy szombat éjjel Máté és Lili egy elhagyatott hidegháborús rádióállomáson ragad a Zemplénben. A zsebrádióban valaki segítséget kér, és mindkettőjük felismeri a hangot.

> ⚠️ **Spoiler-figyelmeztetés:** a `TERV.md` és a `story/` mappa a teljes történetet és mind a 10 befejezést tartalmazza. Játék előtt ne olvassátok el.

## Indítás

**Legegyszerűbb:** nyissátok meg a **`dist/Az-utolso-adas.html`** fájlt dupla kattintással Chrome-ban, Edge-ben vagy Firefoxban. Egyetlen önálló fájl, telepítés nem kell. Internet csak a betűtípusokhoz kell, nélküle is működik.

Fejlesztői mód: az `index.html` is megnyitható közvetlenül, vagy egy helyi szerverről: `python3 -m http.server`, majd http://localhost:8000.

Ajánlott: **fejhallgató vagy jó hangszóró**, sötét szoba, teljes képernyő (Beállítások → Teljes képernyő, vagy F11).

## Irányítás

| | 1. játékos – **Máté** | 2. játékos – **Lili** |
|---|---|---|
| Eszköz | billentyűzet | kontroller (Xbox/PlayStation), vagy ha nincs: nyilak + Enter |
| Választás | `W` `A` `S` `D` | `Y` `X` `B` `A` (vagy D-pad / bal kar) |
| Tovább / akció | `Szóköz` | `A` |
| Szünet | `Esc` | `Start` |

- **Titkos döntések:** mindketten egyszerre választotok, és a képernyő nem árulja el, ki mit nyomott. Ne lessetek egymás kezére!
- **„Fordulj el!” képernyők:** valamit csak az egyikőtök láthat. Tényleg forduljatok el.
- **Gyorsreakciós jelenetek (QTE):** a kijelzett gombot meg kell nyomni, nyomva kell tartani vagy gyorsan nyomkodni. Közös akciónál a **MOST!** jelre **egyszerre** kell nyomnotok.
- **Vita:** ha egy közös döntésben nem értetek egyet, gombnyomkodó párbaj dönt.
- A **Beállításokban** állítható a hangerő, a szövegsebesség, a reakcióidő (QTE) nehézsége, a villogás csökkentése és a filmszemcse.
- A játék minden jelenetnél automatikusan ment. **Folytatás** a főmenüből.

Egy végigjátszás kb. 60–90 perc. A döntéseken múlik, ki marad életben, mi derül ki az igazságból, és melyik a tíz befejezés közül vár rátok. A befejezések galériája és a döntési napló a végén megmutatja, hol ágazott el a történet.

## Tartalmi figyelmeztetés

16+ · ijesztő jelenetek, erőszak, halál, öngyilkosságra utaló motívum (egy dal címe), villogó fények. A villogás a beállításokban csökkenthető.

## Felépítés

```
index.html, style.css      – a játék oldala
story/                     – a forgatókönyv adatként (core.js: állapot és befejezések, c0–c6: fejezetek, runtime.js: közös szabályok)
engine/game.js             – motor: feliratok, döntések, QTE, mentés, menük
engine/render.js           – fotós helyszínek, dinamikus rétegek, WebGL utómunka, ijesztések
engine/scenes.js           – helyszín → fotó, színezés, effektek
engine/audio.js            – procedurális hang (Web Audio): hangulatok, eredeti keringő, ~50 hanghatás
engine/input.js            – billentyűzet + kontroller két játékosnak
assets/img/                – szabad licencű fotók (forrásuk: assets/photos.js és a stáblista)
test/logika.js             – automata logikai teszt
tools/build.py             – beágyazott képek + egyfájlos változat (dist/)
TERV.md                    – sztori-biblia (SPOILER!)
```

## Tesztek

```bash
node test/logika.js 200000   # véletlen végigjátszások: elérhetőség, zsákutcák, halott szereplők, befejezés-invariánsok
python3 tools/build.py       # assets/imgdata.js + dist/Az-utolso-adas.html újragenerálása
```

A böngészős motort automata módban is végig lehet játszatni: `index.html?auto&seed=42` (véletlen döntésekkel, gyorsítva).

## Jogok

- Történet, kód, hang és zene: saját, eredeti munka. A „Szomorú vasárnap” dallama még szerzői jogvédett, ezért a játékban csak a címére történik utalás, a keringő eredeti szerzemény.
- Fotók: szabad licencű képek (CC0, közkincs, CC BY 2.0/2.5/3.0, CC BY-SA 2.0/3.0/4.0) a Wikimedia Commonsról és a Flickrről, átdolgozva. A szerzők és licencek listája az `assets/photos.js` fájlban és a játék stáblistájában szerepel. A CC BY-SA képek átdolgozott változatai ugyanazon licenc alatt érhetők el.
- Betűtípusok: Oswald, IBM Plex Sans, Courier Prime, Caveat (SIL Open Font License, Google Fonts).
- A VK-7 és a szereplők kitaláltak. A 19 Hz-es „szellemfrekvencia” valós kutatásokon alapul (Vic Tandy, 1998).

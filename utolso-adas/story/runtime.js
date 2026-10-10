// Közös futtatási szabályok: ezt használja a játékmotor ÉS a logikai teszt is,
// így a teszt pontosan azt ellenőrzi, ami a játékban fut.
(function (root) {
  const STORY = root.STORY;
  const RT = (STORY.RT = {});
  const ELO = ['M', 'L', 'S', 'K'];

  const val = (v, s, ...a) => (typeof v === 'function' ? v(s, ...a) : v);
  RT.val = val;

  RT.scene = (id) => {
    const sc = STORY.scenes[id];
    if (!sc) throw new Error('Nem létező jelenet: ' + id);
    return sc;
  };

  RT.enter = (s, sc) => {
    s.ut.push(sc.id);
    if (sc.enter) sc.enter(s);
  };

  RT.el = (s, who) =>
    who === 'M' || who === 'L' ? s.el[who] : who === 'S' ? s.sandor.el : who === 'K' ? s.kardos !== 'halott' : true;

  // Lusta bejárás: a {do} lépések és a feltételek a megjelenítés pillanatában értékelődnek ki.
  RT.iterBeats = function* (s, beats) {
    for (const b of beats || []) {
      if (Array.isArray(b)) {
        if (b[0] === 'fx') {
          yield { fx: b[1], arg: val(b[2], s) };
        } else {
          const opt = b[2] || {};
          yield { who: val(b[0], s), text: val(b[1], s), name: opt.name, rec: !!opt.rec, voice: opt.voice };
        }
      } else if (b.do) {
        b.do(s);
      } else if (b.if) {
        if (b.if(s)) yield* RT.iterBeats(s, b.then);
      }
    }
  };

  // Ki melyik játékos (p1/p2) egy adott szerepben.
  RT.playerOf = (s, role) => (s.szerep.p1 === role ? 'p1' : s.szerep.p2 === role ? 'p2' : null);

  RT.participants = (s, by) => {
    if (by === 'both')
      return ['p1', 'p2'].map((p) => ({ player: p, role: s.szerep[p] })).filter((x) => x.role !== 'X');
    if (by === 'leads')
      return ['p1', 'p2'].map((p) => ({ player: p, role: s.szerep[p] })).filter((x) => (x.role === 'M' || x.role === 'L') && s.el[x.role]);
    const p = RT.playerOf(s, by);
    return p ? [{ player: p, role: by }] : [];
  };

  RT.interaction = (s, sc) => {
    if (sc.choice) {
      const c = sc.choice;
      const parts = RT.participants(s, c.by).map((x) => {
        const opts = (typeof c.opts === 'function' ? c.opts(s, x.role) : c.opts).filter((o) => o.if !== false);
        const d = val(c.default, s, x.role);
        return { ...x, opts, def: opts.some((o) => o.k === d) ? d : opts[0] && opts[0].k };
      });
      return {
        type: 'choice', mode: c.mode || 'solo', prompt: val(c.prompt, s), timer: val(c.timer, s) || 0,
        parts, echo: !!c.echo, duel: !!c.duel,
      };
    }
    if (sc.qte) {
      const q = sc.qte;
      const by = val(q.by, s);
      const players = by === 'co' ? ['p1', 'p2'].filter((p) => s.szerep[p] !== 'X') : [RT.playerOf(s, by)];
      return {
        type: 'qte', kind: q.kind, ms: Math.max(250, val(q.ms, s) || 1000), count: q.count || 0,
        prompt: val(q.prompt, s), players, role: by,
      };
    }
    if (sc.dial) return { type: 'dial', code: sc.dial.code };
    if (sc.ending) return { type: 'ending', code: sc.ending };
    return { type: 'then' };
  };

  // picks: { szerepkód: opciókulcs }, duel: a vitát megnyerő szerepkód (ha volt vita)
  RT.resolveChoice = (s, sc, picks, duel) => {
    const P = { ...picks };
    if (duel) P.duel = duel;
    for (const [role, k] of Object.entries(picks)) s.dontesek.push({ jelenet: sc.id, ch: sc.ch, ki: role, valasz: k });
    return sc.choice.resolve(s, P);
  };

  RT.qteResult = (s, sc, ok) => {
    s.dontesek.push({ jelenet: sc.id, ch: sc.ch, ki: 'qte', valasz: ok ? 'siker' : 'kudarc' });
    return val(ok ? sc.qte.ok : sc.qte.fail, s);
  };

  RT.dialResult = (s, sc, talalt) => {
    if (talalt && sc.dial.set) sc.dial.set(s);
    return val(sc.dial.then, s);
  };

  RT.next = (s, sc) => val(sc.then, s);

  // A vita szükséges-e (nyílt szavazás, eltérő döntések, a jelenet kéri)
  RT.needsDuel = (inter, picks) => {
    if (!inter.duel || inter.parts.length < 2) return false;
    const v = inter.parts.map((p) => picks[p.role]);
    return v.some((x) => x !== v[0]);
  };

  RT.ELO = ELO;
  if (typeof module !== 'undefined') module.exports = RT;
})(typeof window !== 'undefined' ? window : globalThis);

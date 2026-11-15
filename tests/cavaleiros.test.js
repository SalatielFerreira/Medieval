// Cavaleiros pelo reino: com muitos cavaleiros (do castelo e moradores das vilas que viraram cavaleiros), andam pelo
// reino no máximo 10 homens armados — os cavaleiros primeiro (até 8) e a guarnição completa o resto. Os outros ficam
// no quartel e continuam contando para o campo de batalha.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      const c = 0, vs = Garrison.villagesOf(c); G.civs[c].garrison = 60;
      for (let k = 0; k < 20; k++) People.create({ rank: 'knight', civ: c, age: 30, home: { type: 'castle', civ: c } });
      for (const x of vs) for (let k = 0; k < 6; k++) People.create({ rank: 'knight', civ: c, age: 30, home: { type: 'village', idx: x.vi } });
      Garrison._fk = null; Garrison._memo.clear();
      const all = G.people.filter(p => p.alive && p.rank === 'knight' && !p.capanga && Garrison.realmOf(p) === c);
      ok(all.length >= 30, `faltam cavaleiros no teste (${all.length})`);
      const pl = Garrison.plan(c), guards = pl.cap + pl.patrol + Object.values(pl.v).reduce((a, b) => a + b, 0);
      ok(Garrison.knightsOut(c) + guards <= Garrison.FIELD, `andam mais de ${Garrison.FIELD} homens armados (${Garrison.knightsOut(c)} cavaleiros + ${guards} soldados)`);
      ok(pl.cap >= 2, 'o castelo ficou sem guarda');
      // passar pelo castelo e por todas as vilas: quantos cavaleiros diferentes apareceram
      const seen = new Set(), cp = World.capitals[c];
      for (const t of [{ x: cp.x, y: cp.y + 4 }, ...vs.map(x => x.v)]) {
        P.x = (t.x + 0.5) * TILE; P.y = (t.y + 0.5) * TILE; G.groups = {};
        for (let k = 0; k < 8; k++) Game.update(0.05);
        for (const e of G.ents) if (!e.dead && e.npc && e.npc.rank === 'knight' && Garrison.realmOf(e.npc) === c) seen.add(e.npc.id);
      }
      ok(seen.size <= Garrison.KNIGHTS, `apareceram ${seen.size} cavaleiros pelo reino (máximo ${Garrison.KNIGHTS})`);
      ok(seen.size > 0, 'nenhum cavaleiro apareceu pelo reino');
      // no campo de batalha contam todos
      ok(War.knightsOf(c) >= 20, `o campo de batalha perdeu os cavaleiros do castelo (${War.knightsOf(c)})`);
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

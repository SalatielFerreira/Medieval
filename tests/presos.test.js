// Presos só aparecem na cela da prisão: não andam pela vila, não ficam nas lojas nem nos prédios, não viajam e não
// duelam. Quem é preso à vista some na hora; na prisão do reino ele está lá; solto, volta a aparecer.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {};
      const ci = G.civs.findIndex(c => c.ruler === 'npc' && !c.dead);
      const vi = World.villages.findIndex(v => v && !v.free && !v.ruin && v.civ === ci), v = World.villages[vi];
      const p = People.residents(vi).find(q => q.age >= 18 && !q.port && !q.trip && !q.capanga && !q.kin && !People.isCourt(q) && G.civs[ci].rulerId !== q.id);
      ok(p, 'sem morador para o teste'); if (!p) return bad;
      const seen = q => G.ents.some(e => !e.dead && e.npc === q);
      const clear = () => { for (const e of G.ents) if (e.kind === 'villager' || e.kind === 'sentry') e.dead = true; G.ents = G.ents.filter(e => !e.dead); G.spawned.clear(); };
      P.x = v.x * TILE; P.y = (v.y + 1) * TILE; G.time = NIGHT_LEN + DAYLIGHT_LEN * 0.4; G.settings.streets = 'all';
      clear(); Game.ambient();
      ok(seen(p), 'o morador não aparece na vila antes de ser preso');
      // preso à vista: some na hora
      ok(Justice.arrest(p, ci, 'teste', 6, true), 'não conseguiu prender');
      ok(!seen(p), 'o preso continua na rua logo depois de preso');
      clear(); Game.ambient();
      ok(!seen(p), 'o preso aparece na vila');
      // a rede central: ninguém consegue pôr o preso no mundo fora da prisão
      const e = Game.spawn('villager', P.x, P.y, { civ: ci, npc: p });
      ok(e && e.dead, 'Game.spawn pôs o preso no mundo');
      G.ents = G.ents.filter(x => !x.dead);
      // viajando ou visitando outra vila: também não
      const vj = World.villages.findIndex((w, i) => w && !w.ruin && i !== vi);
      p.trip = { from: vi, vi: vj, since: G.day, until: G.day + 2 };
      ok(!Trips.visitors(vj).includes(p), 'o preso aparece como visitante em outra vila');
      delete p.trip;
      // duelo: o preso não sai da cela
      G.duel = null; G.honor = null; const n0 = G.ents.length; Society.startDuel(p);
      ok(!seen(p) && G.ents.length === n0, 'o preso saiu da cela para um duelo');
      // dentro de um prédio: o lojista preso não fica atrás do balcão
      const shop = World.structs.find(s => s && !s.removed && s.village === vi && Places.def(s) && Shops.keeper(s) && Shops.keeper(s) !== p);
      if (shop) {
        const k = Shops.keeper(shop); Justice.arrest(k, ci, 'teste', 6, true);
        Places.enterRoom(shop);
        ok(G.place, 'não entrou na loja');
        ok(!seen(k), 'o lojista preso está dentro da loja');
        Places.exit(true, true);
        Justice.release(k, ci, true);
      } else bad.push('sem loja com lojista para o teste');
      // na prisão do reino: o preso está na cela
      const ps = Prison.of(ci);
      Places.enterRoom(ps);
      ok(G.place && G.place.type === 'prison', 'não entrou na prisão');
      ok(seen(p), 'o preso não está na cela da prisão');
      Places.exit(true, true);
      ok(!seen(p), 'o preso saiu da prisão junto com o herói');
      // solto: volta a aparecer
      Justice.release(p, ci, true);
      P.x = v.x * TILE; P.y = (v.y + 1) * TILE; // ao sair da prisão o herói fica na porta do castelo
      clear(); Game.ambient();
      ok(seen(p), 'solto, o morador não volta a aparecer na vila');
      delete G.settings.streets;
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

// Guerra: os moradores armados de um reino em guerra com você atacam — e agora você pode revidar (o golpe acerta) e os
// seus capangas defendem você; os moradores em paz continuam fora do alcance dos seus golpes.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; P.god = true;
      const ci = G.civs.find(c => c && !c.dead && c.ruler !== 'player').id;
      const mk = rank => { const p = People.create({ rank, sex: 'm', age: 30, civ: ci, home: { type: 'village', idx: World.villages.findIndex(v => v && v.civ === ci) } }); const s = freeSpotNear(P.x + 30, P.y, 80); return Game.spawn('villager', s.x, s.y, { civ: ci, npc: p, leash: 4 }); };
      const peace = mk('peasant'); ok(!canHit(peace), 'em paz, o morador pode ser golpeado');
      G.civs[ci].atWar = true;
      const foe = mk('knight'); foe.target = P;
      ok(hostile(foe, P), 'o morador armado do reino em guerra não ataca');
      ok(canHit(foe), 'você não consegue revidar contra o morador que ataca');
      const hp0 = foe.hp; Game.damage(foe, 10, P); ok(foe.hp < hp0, 'o seu golpe não tirou vida do morador que ataca');
      // um capanga defende
      const cp = People.create({ rank: 'mercenary', sex: 'm', age: 30, civ: -1, home: { type: 'wild' } }); cp.capanga = true; const ally = Game.spawnCapanga(cp);
      ok(ally && hostile(ally, foe), 'o seu capanga não defende você do morador que ataca');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

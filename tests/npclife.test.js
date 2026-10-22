// Moradores mais ativos: em 24 meses as famílias abrem negócios novos, as estradas fora das vilas e dos castelos são
// melhoradas (caravanas e reinos), as vilas coletam recursos longe do jogador, e isso não deixa o mês pesado.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const a = await page.evaluate(async () => {
      const biz0 = World.structs.filter(s => s && !s.removed && s.fam !== undefined && FAMILY_BIZ[s.type]).length;
      const wood0 = G.civs.reduce((x, c) => x + (c.stock.wood || 0), 0);
      let slow = 0;
      for (let k = 0; k < 24; k++) {
        const t0 = performance.now(); NpcRoads.travelTick(); slow = Math.max(slow, performance.now() - t0);
        Game.onNewDay(); await new Promise(r => setTimeout(r, 10));
      }
      const biz = World.structs.filter(s => s && !s.removed && s.fam !== undefined && FAMILY_BIZ[s.type]).length;
      // estradas melhoradas longe das vilas e dos castelos
      let outside = 0;
      for (let i = 0; i < World.tiles.length; i++) {
        if (World.tiles[i] !== T.ROAD || (World.roadLv[i] || 1) < 2) continue;
        const x = i % WORLD_W, y = (i / WORLD_W) | 0;
        if (World.villages.every(v => !v || U.dist(x, y, v.x, v.y) > VILLAGE_R + 2) && World.capitals.every(c => !c || U.dist(x, y, c.x, c.y) > 14)) outside++;
      }
      return { biz0, biz, outside, gathered: (G.stats || {}).npcGathered || 0, slow: Math.round(slow), wood0, wood: G.civs.reduce((x, c) => x + (c.stock.wood || 0), 0) };
    });
    if (a.biz <= a.biz0) fails.push(`as famílias não abriram negócios novos em 24 meses (${a.biz0} → ${a.biz})`);
    if (a.outside < 20) fails.push(`só ${a.outside} blocos de estrada melhorados fora das vilas e castelos`);
    if (a.gathered < 100) fails.push(`as vilas coletaram pouco longe do jogador (${a.gathered})`);
    if (a.slow > 120) fails.push(`as estradas do mês levaram ${a.slow} ms (deixa o jogo travar)`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

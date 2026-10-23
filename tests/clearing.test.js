// Desmatamento: em 12 meses os moradores derrubam boa parte das árvores e pedras das vilas e dos arredores dos castelos,
// mesmo longe do jogador; isso continua depois de salvar e carregar; na terra ocupada nada rebrota, no campo rebrota.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const count = () => page.evaluate(() => {
      let n = 0;
      World.villages.forEach(v => { if (!v) return; const R = VILLAGE_R + 2; for (let y = v.y - R; y <= v.y + R; y++) for (let x = v.x - R; x <= v.x + R; x++) if (World.inb(x, y) && NPCWork.clearable(World.obj[World.idx(x, y)])) n++; });
      return n;
    });
    const before = await count();
    await page.evaluate(async () => { for (let k = 0; k < 12; k++) { Game.onNewDay(); await new Promise(r => setTimeout(r, 10)); } });
    const after = await count();
    console.log('    árvores e pedras nas vilas: ' + before + ' → ' + after);
    if (after > before * 0.6) fails.push(`as vilas continuam cheias de mato: ${before} árvores e pedras → ${after} em 12 meses`);
    // rebrota: na vila não, no campo sim
    const rg = await page.evaluate(() => {
      const find = inside => { for (let i = 0; i < World.obj.length; i += 3) { const t = World.obj[i]; if (!NPCWork.clearable(t)) continue; const x = i % WORLD_W, y = (i / WORLD_W) | 0; if (NPCWork.settled(x, y) === inside && U.dist(x, y, P.x / TILE, P.y / TILE) > 20) return i; } return -1; };
      const a = find(true), b = find(false), n0 = World.regrow.length;
      if (a >= 0) World.removeObj(a); const inVillage = World.regrow.length - n0;
      if (b >= 0) World.removeObj(b); const inField = World.regrow.length - n0 - inVillage;
      return { a, b, inVillage, inField };
    });
    if (rg.a >= 0 && rg.inVillage !== 0) fails.push('árvore cortada dentro da vila vai rebrotar');
    if (rg.b >= 0 && rg.inField !== 1) fails.push('árvore cortada no campo não rebrota mais');
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const loaded = await count();
    if (loaded > after + 5) fails.push(`depois de carregar o mato voltou: ${after} → ${loaded}`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

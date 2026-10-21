// 24 meses de jogo como rei, salvar e carregar: nada encavalado, todo prédio com responsável, santuários no lugar.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const a = await page.evaluate(async () => {
      P.god = true; Game.becomeRuler(0, 'Teste.');
      for (let k = 0; k < 24; k++) { Game.econTick(); await new Promise(r => setTimeout(r, 30)); }
      let over = 0; const occ = new Set();
      for (const s of World.structs) if (s && !s.removed && !s.hidden) for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) { const k = j * WORLD_W + i; if (occ.has(k)) over++; else occ.add(k); }
      const work = World.structs.filter(s => Shops.isShop(s) && !Shops.noAuto.has(s.type));
      return { over, work: work.length, kept: work.filter(s => Shops.keeper(s)).length, levels: World.villages.map(v => v.level) };
    });
    if (a.over) fails.push(`${a.over} blocos com construções encavaladas`);
    if (a.kept < a.work) fails.push(`${a.work - a.kept} prédios sem responsável`);
    if (Math.max(...a.levels) < 2) fails.push('nenhuma vila cresceu em 24 meses');
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const b = await page.evaluate(() => ({ shrines: World.structs.filter(s => s.type === 'shrine' && !s.removed).length, settle: Towns.settle() }));
    if (b.shrines !== 3) fails.push(`santuários depois de carregar: ${b.shrines} (deveriam ser 3)`);
    if (b.settle) fails.push(`${b.settle} obras encavaladas depois de carregar`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

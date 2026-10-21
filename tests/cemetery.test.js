// Cemitério: o rei muda de lugar para qualquer canto do mapa (até fora do reino), quem não é rei não consegue, e o lugar
// novo continua depois de salvar e carregar.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const a = await page.evaluate(() => {
      const cem = ci => World.structs.find(s => s && s.type === 'cemetery' && s.owner === ci && !s.removed);
      const c1 = cem(1), refused = !!Urban.movable(c1); // não é rei de lá
      P.god = true; Game.becomeRuler(0, 'Teste.');
      const c = cem(0), ok = !Urban.movable(c);
      // um lugar livre bem longe, fora do reino 0
      let spot = null;
      for (let y = 20; y < WORLD_H - 20 && !spot; y += 3) for (let x = 20; x < WORLD_W - 20 && !spot; x += 3) {
        if (World.terr[World.idx(x, y)] === 0 || U.dist(x, y, c.x, c.y) < 60) continue;
        if (!Urban.placeErr(c, x, y, c, Urban.isCivic(c))) spot = { x, y };
      }
      if (!spot) return { refused, ok, spot: null };
      Urban.relocate(c, spot.x, spot.y);
      return { refused, ok, spot, now: { x: c.x, y: c.y } };
    });
    if (!a.refused) fails.push('quem não é rei conseguiu mudar o cemitério de outro reino');
    if (!a.ok) fails.push('o rei não pôde mudar o cemitério');
    if (!a.spot) fails.push('não achou lugar longe, fora do reino, para o cemitério');
    else {
      await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
      await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
      const b = await page.evaluate(() => { const c = World.structs.filter(s => s && s.type === 'cemetery' && s.owner === 0 && !s.removed); return c.map(s => ({ x: s.x, y: s.y })); });
      if (b.length !== 1) fails.push(`${b.length} cemitérios do reino depois de carregar`);
      else if (b[0].x !== a.spot.x || b[0].y !== a.spot.y) fails.push(`depois de carregar o cemitério voltou para ${b[0].x},${b[0].y} (estava em ${a.spot.x},${a.spot.y})`);
    }
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

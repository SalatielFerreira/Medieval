// Neblina do mapa: jogo novo começa com quase tudo escuro, andar revela, salvar e carregar guarda o que foi visto, o mapa
// do tesouro marca um X e cavar nele dá o tesouro, e a carta do reino revela o território.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; P.god = true;
      ok(G.fogOn && Fog.pct() < 15, `jogo novo sem neblina (${Fog.pct()}% visto)`);
      const p0 = Fog.pct(); Fog.reveal(P.x / TILE + 60, P.y / TILE, 20); ok(Fog.pct() > p0, 'revelar não clareou');
      ok(Fog.seen(Math.floor(P.x / TILE), Math.floor(P.y / TILE)), 'o lugar do herói não está visto');
      ok(MapView.places().length < 7 + World.villages.length, 'a lista do mapa mostra lugares nunca vistos');
      // mapa do tesouro
      Inv.add('treasure_map', 1); Expansion.use('treasure_map'); const tr = G.treasures[0]; ok(tr && Fog.seen(tr.x, tr.y), 'o mapa do tesouro não marcou um X visível');
      const g0 = P.gold; ok(Fog.dig(tr.x, tr.y) && P.gold > g0 && !G.treasures.length, 'cavar no X não deu o tesouro');
      // carta do reino
      const ci = Clima.civAt(Math.floor(P.x / TILE), Math.floor(P.y / TILE));
      if (ci >= 0) { const p1 = Fog.pct(); Inv.add('region_chart', 1); Expansion.use('region_chart'); ok(Fog.pct() > p1, 'a carta do reino não revelou o território'); }
      // desenho com neblina
      Game.drawMinimap(document.createElement('canvas').getContext('2d'), 1000);
      MapView.show && MapView.show(); MapView.hide && MapView.hide();
      Inv.add('treasure_map', 1); Expansion.use('treasure_map');
      return { bad, pct: Fog.pct(), tr: G.treasures.length };
    });
    fails.push(...r.bad);
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const a = await page.evaluate(() => [Fog.pct(), G.treasures.length, G.fogOn]);
    if (a[0] !== r.pct || a[1] !== r.tr || !a[2]) fails.push(`a neblina mudou ao carregar: ${r.pct}% ${r.tr} → ${a[0]}% ${a[1]} ${a[2]}`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

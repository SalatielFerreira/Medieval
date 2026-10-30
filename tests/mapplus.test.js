// Mapa com as construções identificadas: categorias, ícones, filtros na lateral, "perto de você" e a dica do mouse.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      G.fogOn = false; const cp = World.capitals[0]; P.x = (cp.x + 2) * TILE; P.y = (cp.y + 14) * TILE;
      MapView.show(); MapView.centerOn(cp.x, cp.y + 8, 16); MapView.draw();
      const L = MapPlus.list(), cats = new Set(L.map(x => x.cat));
      ok(['shop', 'power', 'faith', 'travel', 'danger'].every(c => cats.has(c)), 'faltam categorias no mapa: ' + [...cats].join(','));
      const port = L.find(x => x.s.type === 'port'); ok(port && MapPlus.icon(port.s) === '⚓' && port.cat === 'travel', 'o porto não tem o ícone certo');
      ok(L.some(x => x.s.type === 'tavern' && x.cat === 'shop' && MapPlus.icon(x.s) === '🍺'), 'a taverna não aparece como loja');
      const side = MapView.side.innerHTML; ok(/O que mostrar/.test(side) && /Perto de você/.test(side) && side.includes('data-mv="mpf:shop"'), 'a lateral não tem os filtros e o perto de você');
      MapView.tool('mpf:shop'); ok(MapPlus.off().shop === true && MapView.side.querySelector('[data-mv="mpf:shop"]').classList.contains('off'), 'o filtro não desligou as lojas');
      ok(!MapPlus.at(port.x, port.y, 0.5) || MapPlus.at(port.x, port.y, 0.5).cat !== 'shop', 'filtro');
      MapView.tool('mpf:shop'); ok(!MapPlus.off().shop, 'o filtro não religou as lojas');
      const it = MapPlus.at(port.x, port.y, 1); ok(it && /Porto/.test(MapPlus.info(it)), 'a dica não diz o que é');
      MapView.hide();
      // o botão de voltar: para a janela de onde você veio (ou para o jogo)
      UI.toggle('showInventory'); UI.showMap(); ok(/Inventário/.test(document.querySelector('#mapView .ph-back').textContent), 'o mapa não tem o botão de voltar para a janela');
      MapView.tool('back'); ok(!MapView.isOpen && UI.cur && UI.cur.fn === 'showInventory', 'voltar não levou à janela de antes');
      UI.close(); UI.showMap(); ok(/Jogo/.test(document.querySelector('#mapView .ph-back').textContent), 'sem janela antes, o botão não diz Jogo'); MapView.tool('back'); ok(!MapView.isOpen, 'voltar não fechou o mapa');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

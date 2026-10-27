// Favoritos: na conversa dá para favoritar uma pessoa; ela aparece com estrela sobre a cabeça, no mapa grande (com a
// seção Favoritos) e no minimapa; a marca vai no jogo salvo e dá para tirar.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      const p = G.people.find(q => q.alive && q.age >= 18 && q.home && q.home.type === 'village');
      UI.showTalk(p.id);
      ok(UI.panel.innerHTML.includes('data-op="fav"'), 'a conversa não tem a opção de favoritar');
      UI.act('tk', { op: 'fav', id: p.id });
      ok(p.starred === true, 'a pessoa não ficou favorita');
      ok(UI.panel.innerHTML.includes('⭐ Favorito'), 'a ficha não mostra que é favorita');
      UI.close();
      ok(!!Favorites.where(p), 'não se sabe onde a pessoa favorita está');
      // perto de você: a estrela é desenhada sobre a cabeça
      const e = Game.spawn('villager', P.x + 40, P.y, { civ: 0, npc: p, leash: 0.2 }); G.spawned.set(p.id, e);
      Game.update(1 / 30); Game.render();
      MapView.show(); ok(MapView.side.innerHTML.includes('Favoritos'), 'o mapa não lista os favoritos'); MapView.draw(); MapView.hide();
      ok(Game.snapshot().people.find(q => q.id === p.id).starred === true, 'a marca não vai no jogo salvo');
      UI.showTalk(p.id); UI.act('tk', { op: 'fav', id: p.id }); UI.close();
      ok(!p.starred, 'não deu para tirar dos favoritos');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

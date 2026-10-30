// Janelas: sino e central de avisos, ficha do item, finanças do reino, lucro nas oficinas, rendimento das construções,
// conversa organizada, camadas do mapa, chance no conselho de guerra e as páginas de Gestão do Portfólio.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 50000;
      // ficha do item
      for (const k of ['wood', 'iron_bar', 'bread', 'trout', 'iron_sword', 'wool']) { UIP.showItem(k); ok(UI.cur.fn === 'showItemInfo' && html().includes('Onde vende melhor'), 'ficha não abriu: ' + k); }
      ok(UIP.sources('wood').length > 0 && UIP.uses('wood').length > 0, 'madeira sem origem ou uso');
      P.inv.wood = 5; UI.sel.inv = 'wood'; UI.showInventory(); ok(html().includes('data-act="iinfo"'), 'inventário sem botão da ficha');
      // oficinas e construção
      UI.act('iinfo', { k: 'bread' }); ok(UI.cur.fn === 'showItemInfo', 'ação iinfo');
      const rc = RECIPES.find(x => x.station); ok(UI.craftDetailHtml(rc, rc.station).includes('Vale a pena'), 'oficina sem lucro');
      UI.sel.bcat = 'producao'; UI.sel.build = 'oven'; UI.showBuild(); ok(html().includes('Pode produzir') && !html().includes('Depois de clicar'), 'a ficha da construção não está no padrão (custo + o que produz)');
      // a ficha é igual em todas as janelas: tamanho, tipo, quantas você tem, custo e os produtos ligados ao imóvel
      for (const [c, k, t] of [['fazenda', 'pen', 'Coleta'], ['negocios', 'biz_bakery', 'Produtos do estabelecimento'], ['guarda', 'stable', 'À venda aqui']]) { UI.sel.bcat = c; UI.sel.build = k; UI.showBuild(); ok(html().includes(t) && html().includes('você tem') && html().includes('Custo'), `ficha de ${k} fora do padrão`); }
      // reino: Gestão no Portfólio, finanças, avisos
      Game.becomeRuler(1, 'teste'); UI.close(); G.civs[1].treasury = 5000; Reign.monthTick(); Lifesim.monthTick();
      UI.showKingdom(); ok(html().includes('data-k="x:alerts"') && html().includes('data-k="x:finance"') && html().includes('data-k="x:reign"'), 'Portfólio sem o grupo Gestão');
      for (const k of ['x:alerts', 'x:finance', 'x:reign']) { UI.act('knav', { k }); ok(UI.cur.fn === 'showKingdom' && UI.sel.knav === k && html().length > 500, 'página não abriu: ' + k); }
      UI.act('knav', { k: 'x:finance' }); ok(html().includes('Entradas') && html().includes('Saídas'), 'finanças sem o extrato');
      Reign.show('money'); ok(UI.cur.fn === 'showKingdom' && UI.sel.knav === 'x:reign' && UI.sel.rgTab === 'money', 'Reinado não abriu no Portfólio');
      UI.act('rgTab', { t: 'army' }); ok(UI.cur.fn === 'showKingdom', 'trocar aba do Reinado saiu do Portfólio');
      Society.show('events'); ok(UI.sel.knav === 'crown' && UI.sel.crTab === 'sociedade', 'Sociedade não abriu no Portfólio');
      UI.showBizBoard('contracts'); ok(UI.sel.knav === 'biz' && UI.sel.bzTab === 'nb_contracts', 'Negócios não abriu em Empreendimentos');
      const L = UIP.alerts(); ok(Array.isArray(L), 'avisos'); ok(L.some(a => /conselho/.test(a.text)) || !Reign.R().dilemma, 'dilema não virou aviso');
      UI.act('knav', { k: 'x:alerts' }); if (L.length) { UI.act('alGo', { i: 0 }); ok(UI.panel, 'Ir não abriu nada'); }
      UI.close(); UIP.bell(); const b = document.getElementById('alertBell'); ok(b, 'sino não existe');
      // conversa
      const p = G.people.find(q => q.alive && q.age >= 18 && q.kin !== 'child'); p.aff = 30;
      UI.showTalk(p.id); ok(html().includes('tk-x-bar'), 'conversa sem a barra de amizade');
      // mapa
      MapView.show(); if (MapView.side) { MapView.renderSide(); ok(MapView.side.innerHTML.includes('data-layer'), 'mapa sem camadas'); const k0 = UIP.layers().faith; MapView.side.querySelector('[data-layer="faith"]').click(); ok(UIP.layers().faith !== k0, 'camada não alternou'); MapView.draw(); }
      MapView.hide();
      // conselho de guerra
      Diplo.declareWar(2, 1, 'teste'); if (G.warCall) { UI.showWarCouncil(); ok(html().includes('Chance estimada'), 'conselho de guerra sem a chance'); }
      else { G.warCall = { own: true, enemy: 2, side: 1, cfg: { soldiers: 0, archers: 0, knights: 0, cats: 0, capangas: false } }; ok(UIP.oddsCard(G.warCall).includes('%'), 'chance de guerra'); G.warCall = null; }
      UI.close();
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

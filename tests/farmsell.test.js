// Fazenda e animais: interagir só recolhe (sem lado de dentro nem responsável), com a opção de vender a produção
// sozinha pelo preço de mercado (o reino paga); a Fazenda de trigo guarda a colheita nela. Empreendimentos: lucro estimado na ficha.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {};
      const at = (type, dx) => { const B = BUILDINGS[type], x = Math.floor(P.x / TILE) + dx, y = Math.floor(P.y / TILE) + 6; for (let j = y; j < y + B.h; j++) for (let i = x; i < x + B.w; i++) World.obj[World.idx(i, j)] = 0; return World.addStruct(type, x, y, B.w, B.h, 'player', { built: true }); };
      const coop = at('coop', -8), farm = at('farm', 0), hive = at('beehive', 6);
      // interagir: a janela de recolher (sem loja nem responsável)
      coop.goods = { egg: 5 }; Game.useStruct(coop);
      ok(UI.cur && UI.cur.fn === 'showFarmBld', 'o galinheiro não abriu a janela de recolher: ' + (UI.cur && UI.cur.fn));
      const h = UI.panel.innerText; ok(/Recolher tudo/.test(h) && /Vender a produção automaticamente/.test(h) && /Comprar animais/.test(h), 'a janela não tem recolher, vender sozinho e comprar animais');
      ok(!Shops.isShop(coop) && !Shops.isShop(farm), 'a construção de fazenda ainda tem responsável');
      UI.act('brcollect', { s: coop.id }); ok(!coop.goods.egg && Inv.count('egg') >= 5, 'recolher não pegou os ovos');
      // vender sozinho: liga e vende o que está guardado; o reino paga
      hive.goods = { honey: 4 }; const ci = BuildRoles.realmOf(hive), c = G.civs[ci]; c.treasury = 5000;
      const g0 = P.gold, t0 = c.treasury; UI.act('brauto', { s: hive.id });
      ok(hive.autosell && !hive.goods.honey && P.gold > g0 && c.treasury === t0 - (P.gold - g0), `vender sozinho: ouro ${g0}→${P.gold}, tesouro ${t0}→${c.treasury}`);
      // a fazenda de trigo guarda a colheita nela e, marcada, vende no fim do mês
      Season.cur().farm = Season.cur().farm || 6; farm.autosell = false; const w0 = Inv.count('wheat');
      Game.econTick(); while (Perf.queue.length) Perf.queue.shift()();
      ok((farm.goods.wheat || 0) > 0 && Inv.count('wheat') === w0, 'a fazenda não guardou o trigo nela');
      farm.autosell = true; const g1 = P.gold; Game.econTick(); while (Perf.queue.length) Perf.queue.shift()();
      ok(!farm.goods.wheat && P.gold > g1, 'o trigo marcado não foi vendido no fim do mês');
      // empreendimento: lucro estimado na ficha
      Game.becomeRuler(0, 't'); UI.close(); UI.sel.bcat = 'negocios'; UI.sel.build = 'biz_bakery'; UI.showBuild();
      ok(/Lucro estimado/.test(UI.panel.innerText), 'a ficha do empreendimento não mostra o lucro estimado');
      UI.close(); Game.useStruct(coop);
      return bad;
    });
    fails.push(...r);
    if (process.env.SHOT) { const el = await page.$('#panel'); if (el) await el.screenshot({ path: process.env.SHOT + '/farm.png' }); await page.evaluate(() => { UI.sel.bcat = 'negocios'; UI.sel.build = 'biz_bakery'; UI.showBuild(); }); const d = await page.$('#panel .bld-dt'); if (d) await d.screenshot({ path: process.env.SHOT + '/biz.png' }); }
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

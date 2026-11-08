// Porto numa página: faixa do porto, Vender ao porto, Mercado do mar (peixes, frutos do mar e produtos do mar,
// comprar e vender) e a coluna do navio em abas, sem nada cortado nem rolando (computador e celular); frutos do mar novos.
'use strict';
const { open } = require('./harness');
const check = async (opts, label) => {
  const { page, errors, close } = await open(opts), fails = [];
  try {
    const r = await page.evaluate(async () => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; P.gold = 9000;
      for (const k of ['shrimp', 'crab', 'lobster', 'oyster', 'squid', 'grilled_shrimp']) ok(ITEMS[k], `falta o item ${k}`);
      for (const k of ['trout', 'cod', 'sardine', 'shark', 'mussels', 'seashell', 'pearl', 'shrimp', 'crab']) Inv.add(k, 3);
      const s = World.structs.find(x => x && x.type === 'port' && !x.removed); ok(s, 'não há porto no mundo'); if (!s) return out;
      const audit = async name => {
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const pb = UI.panel.querySelector('.pb'); ok(pb.scrollHeight <= pb.clientHeight + 2, `${name}: a janela do porto rola`);
        for (const L of UI.panel.querySelectorAll('.pt2-list')) { const lr = L.getBoundingClientRect(); for (const c of L.querySelectorAll(':scope > *:not([hidden]), tr:not([hidden])')) { const cr = c.getBoundingClientRect(); if (cr.height && cr.bottom > lr.bottom + 2) { ok(false, `${name}: há linhas cortadas em ${L.dataset.pg}`); break; } } }
        ok(UI.panel.querySelectorAll('.pt2-col').length === 3 && UI.panel.querySelector('.pt2-top'), `${name}: o porto não está nas três colunas`);
        ok(UI.panel.querySelectorAll('.sea-yard').length === 0 && UI.panel.textContent.split('Estaleiro').length <= 2, `${name}: o estaleiro aparece repetido`);
      };
      UI.showPort(s.id); await audit('porto');
      for (const c of ['peixes', 'frutos', 'produtos']) { UI.act('ptCat', { k: c, s: s.id }); await audit('mercado ' + c); }
      // comprar e vender frutos do mar
      UI.act('ptCat', { k: 'frutos', s: s.id }); const g0 = P.gold, n0 = Inv.count('lobster'); UI.act('ptBuy', { s: s.id, k: 'lobster', n: 1 });
      ok(Inv.count('lobster') === n0 + 1 && P.gold === g0 - PortPlus.buyPrice('lobster'), 'não comprou lagosta no porto');
      const g1 = P.gold; UI.act('portsell', { s: s.id, k: 'crab', n: 3 }); ok(P.gold > g1 && !Inv.count('crab'), 'o porto não comprou o caranguejo');
      // navio: abas do estaleiro, porão e zarpar
      Sea.buy('caravel'); for (const t of ['navio', 'porao', 'zarpar', 'equip']) { UI.act('ptSide', { k: t, s: s.id }); await audit('navio ' + t); }
      UI.close();
      return out;
    });
    fails.push(...r.map(x => `${label}: ${x}`));
  } finally { await close(); }
  return fails.concat(errors.map(e => `${label}: erro no jogo: ${e}`));
};
module.exports = async () => [...await check({}, 'computador'), ...await check({ width: 844, height: 390 }, 'celular')];

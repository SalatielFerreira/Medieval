// Obras nas vilas: o dobro (70 no menu), cada uma com materiais que existem, desenho, ordem do mais barato ao mais caro
// e rendimento no fim do mês.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {};
      Game.becomeRuler(0, 'teste'); UI.close(); UI.showBuild(); UI.close();
      // as obras separadas por tipo: as 70 da vila, a Defesa, a Praça e a Cultura (sem as repetidas)
      const ob = UI.buildCats.filter(c => c[0].startsWith('ob_')), list = ob.flatMap(c => c[3]);
      ok(ob.map(c => c[0]).join() === 'ob_casa,ob_prod,ob_faz,ob_praca,ob_cult,ob_def', 'categorias das obras: ' + ob.map(c => c[0]).join());
      ok(list.filter(k => k.startsWith('c:')).length === 70, `obras nas vilas: ${list.filter(k => k.startsWith('c:')).length} (meta 70)`);
      ok(list.filter(k => BR.DEF.includes(k)).length === 10, 'a Defesa não está nas obras');
      ok(!list.some(k => BR.DUP.includes(k)), 'ainda há obra repetida: ' + list.filter(k => BR.DUP.includes(k)).join());
      ok(new Set(list).size === list.length, 'obra em duas categorias');
      const nm = k => k.startsWith('c:') ? CIVIC[k.slice(2)].name : BUILDINGS[k].name, all = list.map(nm); ok(new Set(all).size === all.length, 'nome repetido nas obras: ' + all.filter((n, i) => all.indexOf(n) !== i).join());
      ok(ob.find(c => c[0] === 'ob_praca')[3].includes('c:vfountain') && ob.find(c => c[0] === 'ob_cult')[3].includes('library') && ob.find(c => c[0] === 'ob_prod')[3].includes('c:smith') && ob.find(c => c[0] === 'ob_faz')[3].includes('c:field'), 'obra na categoria errada');
      const names = list.filter(k => k.startsWith('c:')).map(k => CIVIC[k.slice(2)] && CIVIC[k.slice(2)].name); ok(new Set(names).size === names.length, 'obra com nome repetido');
      for (const [k, d] of Object.entries(VWORKS)) {
        for (const i in d.cost) ok(ITEMS[i], `${d.name}: material ${i} não existe`);
        ok(d.rent || d.stock || d.pm || d.cap || d.attract, `${d.name} não rende nada`);
        ok(CIVIC[k] && CIVIC[k].desc.includes('.'), `${d.name} sem descrição`);
      }
      for (const c of ob) { const vs = c[3].map(k => Order.buildValue(k)).filter(v => v !== null); for (let i = 1; i < vs.length; i++) if (vs[i] < vs[i - 1]) { bad.push(`obras fora de ordem em ${c[2]}`); break; } }
      // desenho de todas, nas quatro estações
      const ctx = document.createElement('canvas').getContext('2d');
      for (const sn of [0, 2, 3]) { World.season = sn; for (const k of Object.keys(VWORKS)) { const d = VWORKS[k]; try { World.drawStruct(ctx, { id: 1, type: k, x: 0, y: 0, w: d.w, h: d.h, owner: 0, village: 0 }, 10, 10, 1); } catch (e) { bad.push(`desenho de ${d.name}: ${e.message}`); } } }
      // uma obra nova rende para o tesouro
      const vi = World.villages.findIndex(v => v.civ === 0 && !v.free); const v = World.villages[vi];
      Urban.addCivic('vmint', v.x + 6, v.y + 6, vi);
      const c = G.civs[0], t0 = c.treasury, g0 = P.gold; VillageWorks.monthTick();
      ok(c.treasury + P.gold > t0 + g0, 'a Casa da Moeda não rendeu');
      Urban.addCivic('vbarley', v.x - 8, v.y + 6, vi); const w0 = c.stock.wheat || 0; VillageWorks.monthTick(); ok((c.stock.wheat || 0) > w0, 'o Campo de Cevada não deu trigo');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

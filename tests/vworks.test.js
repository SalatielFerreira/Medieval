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
      // Obras nas vilas: uma janela só, com a lista separada por classes (sem obras repetidas)
      ok(!UI.buildCats.some(c => c[0].startsWith('ob_')), 'as classes viraram janelas separadas');
      const list = UI.buildCats.find(c => c[0] === 'obras')[3], cls = list.map(k => UI.buildClass[k]);
      ok(list.filter(k => k.startsWith('c:')).length === 70, `obras nas vilas: ${list.filter(k => k.startsWith('c:')).length} (meta 70)`);
      ok(list.filter(k => BR.DEF.includes(k)).length === 10, 'a Defesa não está nas obras');
      ok(!list.some(k => BR.DUP.includes(k)), 'ainda há obra repetida: ' + list.filter(k => BR.DUP.includes(k)).join());
      ok(!list.includes('market_stall') && !list.includes('oratory'), 'a Barraca de Feira ou o Oratório ainda estão nas Obras');
      ok(new Set(list).size === list.length, 'obra repetida na lista');
      const nm = k => k.startsWith('c:') ? CIVIC[k.slice(2)].name : BUILDINGS[k].name, all = list.map(nm); ok(new Set(all).size === all.length, 'nome repetido nas obras: ' + all.filter((n, i) => all.indexOf(n) !== i).join());
      ok(cls.every(Boolean), 'obra sem classe');
      ok(cls.every((c, i) => !i || c === cls[i - 1] || !cls.slice(0, i).includes(c)), 'as classes estão misturadas na lista');
      ok(UI.buildClass['c:vpost'] === 'serv' && UI.buildClass['c:vfountain'] === 'praca' && UI.buildClass['library'] === 'cult' && UI.buildClass['c:chapel'] === 'fe' && UI.buildClass['c:smith'] === 'prod' && UI.buildClass['c:field'] === 'faz' && UI.buildClass['barracks'] === 'def', 'obra na classe errada');
      // Produção, Fazenda e animais e Empreendimentos também em classes, com o título de cada uma
      for (const [ck, n] of [['moradia', 1], ['producao', 6], ['fazenda', 4], ['negocios', 5], ['guarda', 3], ['infra', 2]]) {
        const L = UI.buildCats.find(c => c[0] === ck)[3], C = L.map(k => UI.buildClass[k]);
        ok(L.length && C.every(Boolean), `${ck}: construção sem classe`);
        ok(C.every((c, i) => !i || c === C[i - 1] || !C.slice(0, i).includes(c)), `${ck}: as classes estão misturadas`);
        UI.sel.bcat = ck; UI.showBuild(); ok(UI.panel.querySelectorAll('.grp').length === new Set(C).size && new Set(C).size >= n - 1, `${ck}: faltam os títulos das classes`); UI.close();
      }
      ok(UI.buildClass.forge === 'met' && UI.buildClass.coop === 'ani' && UI.buildClass.biz_inn === 'srv' && UI.buildClass.vault === 'ouro' && UI.buildClass.stable === 'bichos', 'construção na classe errada');
      ok(UI.buildClass['c:vpost'] === 'serv', 'as obras perderam as classes');
      ok(UI.buildCats.find(c => c[0] === 'obras')[2] === 'Obras no reino', 'para o rei, a categoria não se chama Obras no reino');
      UI.sel.bcat = 'obras'; UI.showBuild(); ok(UI.panel.querySelectorAll('.grp').length >= 8, 'a janela das obras não mostra os títulos das classes');
      ok(!/Você manda em|Obra da vila: só onde/.test(UI.panel.innerText), 'a janela das obras ainda repete onde você manda');
      ok(/Obras no reino · /.test(UI.panel.innerText), 'a ficha da obra não mostra a classe'); UI.close();
      { const c = G.civs[0], r0 = c.ruler; c.ruler = 'npc'; const v0 = World.villages.findIndex(v => v && v.civ === 0), ch = World.villages[v0].chief, lo = World.villages[v0].lord; World.villages[v0].lord = 'player'; World.villages[v0].chief = 'player';
        UI.showBuild(); UI.close(); ok(UI.buildCats.find(c => c[0] === 'obras') && UI.buildCats.find(c => c[0] === 'obras')[2] === 'Obras na vila', 'para o governador, a categoria não se chama Obras na vila');
        c.ruler = r0; World.villages[v0].chief = ch; World.villages[v0].lord = lo; UI.showBuild(); UI.close(); }
      for (const k0 of OBRAS_CLASSES.map(c => c[0])) { const vs = list.filter(k => UI.buildClass[k] === k0).map(k => Order.buildValue(k)).filter(v => v !== null); for (let i = 1; i < vs.length; i++) if (vs[i] < vs[i - 1]) { bad.push('obras fora de ordem na classe ' + k0); break; } }
      for (const [k, d] of Object.entries(VWORKS)) {
        for (const i in d.cost) ok(ITEMS[i], `${d.name}: material ${i} não existe`);
        ok(d.rent || d.stock || d.pm || d.cap || d.attract, `${d.name} não rende nada`);
        ok(CIVIC[k] && CIVIC[k].desc.includes('.'), `${d.name} sem descrição`);
      }
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

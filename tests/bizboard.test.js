// Empreendimentos em páginas (Painel, Seus empreendimentos, Contas, Concorrência), cada uma cabendo na janela, com o
// histórico mês a mês: quanto entrou, salários, lucro e a comparação com o mês anterior.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; P.god = true; P.gold = 50000;
      const v0 = World.villages[0];
      const free = (x, y, w, h) => World.areaOk(x, y, w, h) && World.areaFree(x, y, w, h) && [...Array(w)].every((_, i) => [...Array(h)].every((__, j) => !World.obj[World.idx(x + i, y + j)]));
      const build = k => { const b = BUILDINGS[k]; for (let rr = 0; rr < 120; rr++) for (let a = 0; a < 48; a++) { const x = Math.round(v0.x + Math.cos(a / 48 * 6.28) * (14 + rr)), y = Math.round(v0.y + Math.sin(a / 48 * 6.28) * (14 + rr)); if (free(x - 1, y - 1, b.w + 2, b.h + 2)) return World.addStruct(k, x, y, b.w, b.h, 'player', { built: true }); } return null; };
      const hire = s => { for (const c of Biz.candidates(s).slice(0, 2)) { c.p.aff = 40; Biz.hire(c.p, s); } };
      const fits = () => { const k = UI.panel.querySelector('.kpg'); return k && k.scrollHeight <= k.clientHeight + 1; };
      const txt = () => UI.panel.querySelector('.kpg').textContent;
      UI.sel.knav = 'biz'; UI.sel.bzTab = 'painel'; UI.showKingdom();
      ok(/Nenhum mês fechado ainda/.test(txt()), 'sem empreendimentos, o painel não explica que ainda não há meses');
      ['biz_mill', 'biz_bakery', 'biz_farm'].map(build).forEach(hire);
      for (let i = 0; i < 4; i++) { G.day++; Biz.dayTick(); }
      const s0 = Biz.list()[0];
      ok(BizBoard.hist(s0).length === 4, 'o histórico do empreendimento não guardou os meses');
      ok(BizBoard.series().length === 4, 'a soma mês a mês não tem os meses');
      UI.showKingdom();
      ok(/Entrou no último mês/.test(txt()) && /Lucro do último mês/.test(txt()) && /mês a mês/.test(txt()), 'o painel não mostra quanto entrou e o lucro');
      ok(UI.panel.querySelectorAll('.bzb-col').length === 4, 'o gráfico não tem os 4 meses');
      ok(/subindo|caindo|igual/.test(UI.panel.querySelector('.bzb-trend').textContent), 'o painel não diz se os ganhos sobem ou caem');
      ok(fits(), 'o Painel não cabe na janela');
      for (const t of ['lista', 'contas', 'rival']) { UI.act('bzbtab', { t }); ok(UI.sel.bzTab === t, 'a aba ' + t + ' não abriu'); ok(fits(), 'a página ' + t + ' não cabe na janela'); }
      // muitos empreendimentos: a lista vira páginas e nenhum fica cortado
      for (let i = 0; i < 12; i++) hire(build(['biz_mill', 'biz_farm', 'biz_bakery'][i % 3]));
      UI.sel.bzPg = {}; UI.act('bzbtab', { t: 'lista' });
      ok(fits(), 'com muitos empreendimentos, a lista não cabe');
      ok(UI.panel.querySelector('.cr-pager'), 'com muitos empreendimentos, a lista não virou páginas');
      const shown = () => [...UI.panel.querySelectorAll('.bzb-card')].filter(c => !c.hidden).length;
      const n1 = shown(); UI.act('bzbpg', { k: 'lista', d: 1 }); ok(shown() > 0 && /2\//.test(UI.panel.querySelector('.cr-pager b').textContent), 'a segunda página da lista não abriu');
      ok(n1 < Biz.list().length, 'a primeira página mostra todos');
      // o histórico vai no jogo salvo
      const snap = JSON.parse(JSON.stringify(Game.snapshot()));
      ok(JSON.stringify(snap).includes('"hist":[['), 'o histórico dos empreendimentos não foi salvo');
      UI.close();
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

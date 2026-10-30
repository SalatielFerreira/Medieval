// Portfólio enxuto: Família, Estações e clima, Reino, Tratados e Sociedade saem do menu; a Sociedade vai para Coroa e
// títulos, a Família para Linhagens e os Tratados para o Reinado; os atalhos antigos abrem o lugar novo.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {};
      const nav = () => [...UI.panel.querySelectorAll('.snav [data-act="knav"]')].map(b => b.dataset.k);
      const txt = () => (UI.panel.querySelector('.kpg') || UI.panel).textContent;
      const check = () => { UI.sel.knav = 'overview'; UI.showKingdom(); const n = nav(); for (const k of ['family', 'x:clima', 'atlas', 'x:pacts', 'x:society', 'villages', 'x:merc', 'x:horses', 'x:board']) ok(!n.includes(k), `${k} ainda está no menu`); for (const k of ['overview', 'crown', 'tree', 'families']) ok(n.includes(k), `${k} sumiu do menu`); };
      check();
      // a Sociedade dentro de Coroa e títulos; a Família dentro de Linhagens
      // Coroa e títulos em páginas (abas): Títulos, Vantagens, Corte e reinos, Sociedade — cada uma cabe na janela
      UI.sel.knav = 'crown';
      for (const [t, re] of [['titulos', /Título de nobreza/i], ['corte', /relação com os 7 reinos/i], ['vilas', /Vilas que você governa/i], ['sociedade', /Nobreza/i]]) {
        UI.sel.crTab = t; UI.showKingdom(); ok(re.test(txt()), `a página ${t} de Coroa e títulos não mostra o que devia`);
        const k = UI.panel.querySelector('.kpg'); ok(!k || k.scrollHeight <= k.clientHeight + 1, `a página ${t} não cabe na janela`);
      }
      // sem a página Vantagens: as vantagens aparecem embaixo do título de nobreza conforme ele é conquistado
      UI.sel.crTab = 'titulos'; UI.showKingdom();
      ok(!UI.panel.querySelector('[data-act="crtab"][data-t="vantagens"]'), 'a página Vantagens ainda existe');
      ok(!/Suas vantagens/.test(txt()), 'mostra vantagens sem ter título');
      Court.holdings()[1] = 1; UI.showKingdom();
      ok(/Suas vantagens/.test(txt()) && /capangas/.test(txt()), 'as vantagens do título conquistado não aparecem embaixo do título de nobreza');
      { const k = UI.panel.querySelector('.kpg'); ok(k.scrollHeight <= k.clientHeight + 1, 'com as vantagens, a página Títulos não cabe na janela'); }
      // muitos títulos: as vantagens viram páginas e nada fica cortado
      for (const c of [3, 5, 2]) Court.holdings()[c] = 0;
      UI.showKingdom(); { const c = UI.panel.querySelector('.cr-tit .card'); ok(c.scrollHeight <= c.clientHeight + 1, 'com quatro títulos, as vantagens ficam cortadas'); }
      for (const c of [1, 3, 5, 2]) delete Court.holdings()[c];
      UI.sel.knav = 'villages'; UI.showKingdom(); ok(UI.sel.knav === 'crown' && UI.sel.crTab === 'vilas', 'o atalho de Vilas e guardas não abriu Coroa e títulos');
      UI.sel.socTab = 'politics'; UI.sel.crTab = 'sociedade'; UI.showKingdom();
      ok(UI.panel.querySelector('.cr-pager') || UI.panel.querySelector('.cr-soc').scrollHeight <= UI.panel.querySelector('.cr-soc').clientHeight + 1, 'a Política não cabe e não tem páginas');
      (UI.sel.svSub = UI.sel.svSub || {}).ln = 'casa'; UI.sel.knav = 'tree'; UI.showKingdom(); ok(!/A sua Casa/.test(txt()) && /Árvore da casa/.test(txt()), 'a página A sua Casa ainda está em Linhagens');
      // Linhagens em páginas, cabendo na janela; Grandes Casas e Linhagens no grupo Você
      for (const t of ['arvore', 'lacos']) { UI.sel.svSub.ln = t; UI.showKingdom(); const b = UI.panel.querySelector('.snav-body'); ok(b.scrollHeight <= b.clientHeight + 1, `Linhagens → ${t} não cabe na janela`); }
      { const seq = [...UI.panel.querySelectorAll('.snav > *')].map(e => e.classList.contains('snav-g') ? '|' : e.dataset.k).join(' '); ok(/^\| overview crown .*families tree \|/.test(seq), 'Grandes Casas e Linhagens não estão em Você: ' + seq); }
      // atalhos antigos
      Society.show(); ok(UI.sel.knav === 'crown', 'o atalho da Sociedade não abriu Coroa e títulos');
      UI.sel.knav = 'family'; UI.showKingdom(); ok(UI.sel.knav === 'tree', 'o atalho da Família não abriu Linhagens');
      // Mercenários é uma página de Fora da lei
      UI.act('knav', { k: 'x:merc' }); ok(UI.sel.knav === 'x:outlaw' && UI.sel.olTab === 'merc' && /Companhias livres/i.test(txt()), 'Mercenários não abriu dentro de Fora da lei');
      // Serviços cabe na janela: cada página sem rolagem (o que não cabe vira partes)
      for (const [tab, g, ts] of [['bando', 'ol0', ['vida', 'procurado', 'bandos']], ['merc', 'mc', ['companhias', 'regras', 'noticias']]]) for (const t of ts) {
        UI.sel.olTab = tab; (UI.sel.svSub = UI.sel.svSub || {})[g] = t; UI.sel.knav = 'x:outlaw'; UI.showKingdom();
        const b = UI.panel.querySelector('.snav-body'), pg = UI.panel.querySelector('.sv-pg'); ok(b.scrollHeight <= b.clientHeight + 1 && pg && pg.scrollHeight <= pg.clientHeight + 1, `Serviços → ${t} não cabe na janela`);
      }
      // Negócios e Grandes Casas cabem na janela, em todas as páginas
      for (const t of ['biz', 'contracts', 'market', 'log']) { UI.showBizBoard(t); const b = UI.panel.querySelector('.snav-body'); ok(UI.sel.knav === 'biz' && b.scrollHeight <= b.clientHeight + 1, `Negócios → ${t} não cabe na janela`); }
      for (const t of ['podio', 'ranking', 'reinos', 'inquietas']) { (UI.sel.svSub = UI.sel.svSub || {}).gc = t; UI.sel.knav = 'families'; UI.showKingdom(); const b = UI.panel.querySelector('.snav-body'); ok(UI.panel.querySelector('.hs2-pods, .hs2-rows, .hs2-civs, .hs2-un, .hs2-calm') && b.scrollHeight <= b.clientHeight + 1, `Grandes Casas → ${t} não cabe na janela`); }
      // Jogos em páginas, cabendo na janela
      for (const t of ['evento', 'provas', 'registros', 'medalhas']) { (UI.sel.svSub = UI.sel.svSub || {}).og = t; UI.sel.knav = 'x:games'; UI.showKingdom(); const b = UI.panel.querySelector('.snav-body'); ok(UI.panel.querySelector('.og-hero, .og-evs, .og-hist, .sv-none, .og-table') && b.scrollHeight <= b.clientHeight + 1, `Jogos → ${t} não cabe na janela`); }
      UI.act('oltab', { t: 'bando' }); ok(/vida de fora da lei|O bando de/i.test(txt()) && /Serviços/.test(UI.panel.textContent), 'a página Fora da lei não abriu');
      UI.sel.knav = 'x:clima'; UI.showKingdom(); ok(UI.sel.knav === 'overview', 'Estações e clima ainda abre');
      UI.act('atlasciv', { c: 1 }); ok(UI.sel.knav === 'overview', 'o atlas dos reinos ainda abre');
      UI.sel.knav = 'x:pacts'; UI.showKingdom(); ok(UI.sel.knav === 'overview', 'Tratados abriu para quem não é rei');
      // rei: os Tratados dentro do Reinado
      Game.becomeRuler(0, 't'); UI.close(); check();
      UI.sel.knav = 'x:pacts'; UI.showKingdom(); ok(UI.sel.knav === 'x:reign' && /Tratados/.test(txt()) && /CASAMENTO ENTRE DINASTIAS|Casamento entre dinastias/i.test(txt()), 'os Tratados não estão no Reinado');
      UI.close();
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

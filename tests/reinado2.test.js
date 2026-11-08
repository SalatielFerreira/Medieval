// O Reinado reúne Seus reinos, Suas vilas, Finanças do reino e Coroa e títulos: os papéis certos para cada status do
// herói, nenhum número ou quadro repetido entre as abas, os atalhos antigos caindo no lugar novo e as abas cabendo numa
// página no computador.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.gold = 50000;
      const roles = () => Reinado.roles().map(x => x.k);
      const menu = () => { UI.sel.knav = 'overview'; UI.showKingdom(); return [...UI.panel.querySelectorAll('.snav [data-act="knav"]')].map(b => b.dataset.k); };
      // ---- sem cargo: só Títulos e corte, e o Reinado aparece no menu mesmo assim
      ok(roles().join() === 't', 'herói sem cargo tem papéis: ' + roles().join());
      ok(menu().includes('x:reign'), 'o Reinado não aparece no menu para quem não tem cargo');
      for (const k of ['crown', 'villages', 'x:finance', 'x:society', 'x:pacts']) ok(!menu().includes(k), `${k} ainda está no menu`);
      UI.sel.knav = 'x:reign'; UI.showKingdom(); ok(UI.panel.querySelector('.rn-roles') && /Título de nobreza/.test(UI.panel.textContent), 'o Reinado de quem não tem cargo não abriu em Títulos e corte');
      // ---- governador de uma vila do reino 1 e de uma do reino 3
      const va = World.villages.findIndex(v => v && !v.free && v.civ === 1 && !v.ruin), vb = World.villages.findIndex(v => v && !v.free && v.civ === 3 && !v.ruin);
      Chiefdom.grant(va, 'teste'); Chiefdom.grant(vb, 'teste');
      ok(roles().join() === `v:${va},v:${vb},t`, 'governador de duas vilas tem papéis: ' + roles().join());
      UI.sel.knav = 'v:' + vb; UI.showKingdom(); ok(UI.sel.knav === 'x:reign' && UI.sel.rnRole === 'v:' + vb && UI.panel.querySelector('[data-act="nbLeaveV"]') && /Poder econômico/.test(UI.panel.textContent), 'o atalho v: não abriu a página da vila');
      // ---- rei do 1: a vila do próprio reino passa à coroa (etapa A) e some dos papéis
      Game.becomeRuler(1, 'teste'); UI.close(); G.civs[1].treasury = 12345; Reign.monthTick();
      ok(roles().join() === `k:1,v:${vb},t`, 'rei do 1 e governador de uma vila de fora tem papéis: ' + roles().join());
      // ---- nada repetido: o tesouro só na faixa do rei; renúncia, banco, guardas e Tratados num lugar só
      const p = People.create({ rank: 'peasant', civ: 1, home: { type: 'castle', civ: 1 }, age: 30 }); p.capanga = true; p.post = { kind: 'castle', civ: 1 };
      const where = {};
      for (const [t] of RN_TABS) {
        G.civs[1].treasury = 12345; Reinado.go('k:1', t);
        const pages = [...UI.panel.querySelectorAll('.kpages > .kpg')], body = pages.map(pg => [...pg.children].filter(e => !e.matches('.rg-top, .rn-roles, .tabs')).map(e => e.innerHTML).join('')).join('');
        const band = pages[0].querySelector('.rg-top'), n = (band ? band.textContent : '').split('12.345').length - 1;
        ok(n === 1, `${t}: o tesouro aparece ${n} vez(es) na faixa do rei`);
        ok(!/12\.345|12345/.test(body), `${t}: o valor do tesouro aparece também no meio da aba`);
        for (const [k, re] of [['renúncia', /data-act="abdicate"/], ['banco', /data-act="bankName"/], ['guardas do castelo', new RegExp(People.full(p))], ['tratados', /Casamento entre dinastias/], ['bolso', /data-act="kgold"/], ['impostos', /data-act="tax"/], ['leis', /data-act="lawEnact"/], ['conselho', /data-act="cpick"/]]) if (re.test(body)) (where[k] = where[k] || []).push(t);
        // cabe numa página (Leis e justiça e o Conselho do reino principal podem ter duas)
        ok(pages.length <= (['leis', 'conselho'].includes(t) ? 2 : 1), `${t}: ocupa ${pages.length} páginas no computador`);
      }
      for (const [k, tabs] of Object.entries({ renúncia: ['reino'], banco: ['tesouro'], 'guardas do castelo': ['exercito'], tratados: ['diplo'], bolso: ['tesouro'], impostos: ['reino'], leis: ['leis'], conselho: ['conselho'] })) ok((where[k] || []).join() === tabs.join(), `${k} aparece em: ${(where[k] || []).join() || 'nenhuma aba'} (devia ser só ${tabs.join()})`);
      // a página da vila e Títulos e corte não repetem o que é do rei
      Reinado.go('v:' + vb); ok(!/data-act="abdicate"|12\.345/.test(UI.panel.innerHTML), 'a página da vila mostra coisas do reino');
      Reinado.go('t', 'vilas'); ok(!/data-act="abdicate"|data-act="nbLeaveV"|12\.345/.test(UI.panel.innerHTML), 'Títulos e corte mostra coisas do rei ou da vila');
      // ---- atalhos antigos
      const at = (what, cond) => ok(cond(), 'atalho antigo não caiu no lugar novo: ' + what);
      UI.sel.knav = 'k:1'; UI.sel.ksub = 'economia'; UI.showKingdom(); at('k:1 + economia', () => UI.sel.knav === 'x:reign' && UI.sel.rnRole === 'k:1' && UI.sel.rnTab === 'tesouro');
      UI.act('ksub', { s: 'conselho' }); at('ksub conselho', () => UI.sel.rnTab === 'conselho');
      UI.sel.knav = 'x:finance'; UI.showKingdom(); at('x:finance', () => UI.sel.rnTab === 'tesouro' && /Entradas/.test(UI.panel.textContent) && /Saídas/.test(UI.panel.textContent));
      UI.sel.knav = 'x:pacts'; UI.showKingdom(); at('x:pacts', () => UI.sel.rnTab === 'diplo');
      UI.sel.crTab = 'corte'; UI.sel.knav = 'crown'; UI.showKingdom(); at('crown + corte', () => UI.sel.rnRole === 't' && /relação com os 7 reinos/i.test(UI.panel.textContent));
      UI.act('crtab', { t: 'titulos' }); at('crtab', () => UI.sel.rnRole === 't' && UI.sel.crTab === 'titulos');
      UI.sel.knav = 'villages'; UI.showKingdom(); at('villages', () => UI.sel.rnRole === 't' && UI.sel.crTab === 'vilas');
      UI.sel.knav = 'x:society'; UI.showKingdom(); at('x:society', () => UI.sel.rnRole === 't' && UI.sel.crTab === 'sociedade');
      Society.show('events'); at('Society.show', () => UI.sel.rnRole === 't' && UI.sel.socTab === 'events');
      Reign.show('jus'); at('Reign.show(jus)', () => UI.sel.rnRole === 'k:1' && UI.sel.rnTab === 'leis' && /Cela 1/.test(UI.panel.textContent));
      Reign.show('fiefs'); at('Reign.show(fiefs)', () => UI.sel.rnTab === 'vassalos');
      UIP.goPage('x:reign', 'money'); at('UIP.goPage(money)', () => UI.sel.rnTab === 'tesouro');
      UIP.goPage('x:reign', 'spy'); at('UIP.goPage(spy)', () => UI.sel.rnTab === 'conselho' && /Espionagem/.test(UI.panel.textContent));
      UI.act('rgTab', { t: 'army' }); at('rgTab', () => UI.sel.rnTab === 'exercito' && UI.cur.fn === 'showKingdom');
      UI.close(); UI.showKingdom(1); at('UI.showKingdom(ci)', () => UI.sel.rnRole === 'k:1');
      UI.sel.knav = 'k:1/obras'; UI.showKingdom(); at('k:1/obras', () => UI.sel.rnTab === 'obras');
      for (const [t, k] of UI.kAlerts()) { UI.sel.knav = k; UI.showKingdom(); at('aviso: ' + t, () => UI.sel.knav === 'x:reign' || UI.sel.knav === k); }
      // ---- dois reinos: o principal primeiro; no outro, o que é da dinastia vira um aviso
      Game.becomeRuler(2, 'teste'); UI.close();
      ok(roles().join() === `k:1,k:2,v:${vb},t`, 'dois reinos: papéis ' + roles().join());
      Reinado.go('k:2', 'tesouro'); ok(/Na dinastia/.test(UI.panel.textContent) && !UI.panel.querySelector('[data-act="rgBud"]'), 'o segundo reino mostra o orçamento da dinastia');
      Reinado.go('k:1', 'tesouro'); ok(UI.panel.querySelector('[data-act="rgBud"]'), 'o reino principal não mostra o orçamento');
      UI.close();
      return out;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

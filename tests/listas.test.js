// Listas de escolha: quem já ocupa um cargo do conselho (ou da loja) não aparece na lista de outro cargo; as listas da
// loja e dos procurados seguem o jeito da lista da corte; a diplomacia mostra a relação num medidor legível; Leis e
// justiça cabem em duas páginas (computador e celular) sem cortar nada.
'use strict';
const { open } = require('./harness');
const check = async (W, H, fails, tag) => {
  const { page, errors, close } = await open({ width: W, height: H });
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 50000; Secret.seed();
      Game.becomeRuler(1, 'teste'); UI.close();
      // 1. conselho: quem já tem cargo não aparece em outro
      const p = Court.pool(1)[0]; Court.appoint(1, 'treasurer', p);
      ok(Court.pool(1, 'all', 'general').every(q => q !== p) && Court.pool(1, 'all', 'treasurer').includes(p), 'quem é tesoureiro aparece na lista do general (ou sumiu da própria)');
      UI.sel.knav = 'x:reign'; UI.sel.rnRole = 'k:1'; UI.sel.rnTab = 'conselho'; UI.showKingdom(); UI.act('cpick', { s: 'general' });
      ok(!UI.panel.querySelector(`[data-act="appoint"][data-id="${p.id}"]`), 'a lista do general mostra o tesoureiro'); UI.act('cpickx', {});
      // 2. a loja da sociedade: a mesma lista, sem quem já tem cargo
      const k = 'crafts', S0 = Secret.S(); S0.invites[k] = { by: (Secret.brothers(k)[0] || {}).id || 0, until: G.day + 3 }; Secret.accept(k);
      KOrders.S().pts = 10; G.fame = 200; Soc2.S().best[k] = 3;
      const bros = Secret.brothers(k).filter(q => q.alive && q.age >= 18 && !q.capanga).slice(0, 3); bros.forEach(q => { q.met = true; q.aff = 50; });
      Soc2.appoint('tesoureiro', bros[0].id); Soc2.show('rede'); UI.act('tp', { op: 'post', k: 'orador' });
      ok(UI.panel.querySelector('.tp-pick .rn-pick') && UI.panel.querySelector('.tp-pick .rn-cfilt'), 'a lista dos cargos da loja não segue o jeito da lista da corte');
      ok(!UI.panel.querySelector(`[data-op="pick"][data-i="${bros[0].id}"]`) && UI.panel.querySelector(`[data-op="pick"][data-i="${bros[1].id}"]`), 'o tesoureiro aparece na lista do orador');
      UI.act('tp', { op: 'pickx' }); UI.close();
      // 3. diplomacia: o medidor
      UI.sel.knav = 'x:reign'; UI.sel.rnRole = 'k:1'; UI.sel.rnTab = 'diplo'; UI.showKingdom();
      ok(UI.panel.querySelectorAll('.dpg').length >= 3 && UI.panel.querySelector('.dpv b'), 'a diplomacia não mostra o medidor de relação');
      // 4. Leis e justiça em duas páginas
      for (const q of G.people.filter(x => x.alive && x.age > 20 && !x.kin).slice(0, 6)) Justice.jail(1).push({ pid: q.id, why: 'roubo', until: G.day + 3 });
      for (let n = 0; n < 3; n++) Laws.newCase([G.civs[1]]);
      UI.sel.rnTab = 'leis'; UI.showKingdom();
      const pages = UI.panel.querySelectorAll('.kpg.kpage');
      ok(pages.length === 2, 'Leis e justiça não ficou em duas páginas: ' + pages.length);
      for (const pg of pages) { const pr = pg.getBoundingClientRect(); for (const c of pg.querySelectorAll('.lj')) { const cr = c.getBoundingClientRect(); ok(cr.bottom <= pr.bottom + 3, 'um quadro de Leis e justiça passou do pé da página'); } }
      // procurados: a lista para declarar
      UI.act('ljpick', {}); const row = UI.panel.querySelector('[data-act="ljwant"]'); ok(row && UI.panel.querySelector('.lj-want .rn-pick'), 'a lista para declarar procurado não aparece');
      if (row) { const id = +row.dataset.p; UI.act('ljwant', { p: id, c: 1 }); ok(Justice.wanted(People.get(id)).includes(1), 'declarar procurado pela lista não funcionou'); }
      return bad;
    });
    fails.push(...r.map(x => `${tag}: ${x}`));
  } finally { await close(); }
  fails.push(...errors.map(e => `${tag}: erro no jogo: ${e}`));
};
module.exports = async () => { const fails = []; await check(1366, 720, fails, 'pc'); await check(844, 390, fails, 'celular'); return fails; };

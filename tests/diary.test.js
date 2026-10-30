// Diário do herói em páginas: Conquistas, Notícias, Estatísticas, Ranking e Heróis cabem na janela (o que não couber
// vira partes), sem as páginas Dinastia, Contas e Diário, e com a Crônica da dinastia no menu, abaixo de Heróis.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; for (let i = 0; i < 3; i++) { G.day++; Lifesim.monthTick(); }
      UI.sel.dtab = 'ach'; UI.showDiary();
      const nav = [...UI.panel.querySelectorAll('.snav .snav-i')].map(b => b.dataset.k || b.dataset.act);
      ok(nav.join(',') === 'ach,news,stats,rank,heroes,book', 'o menu do Diário: ' + nav.join(','));
      for (const [t, g, subs] of [['ach', 'dyach', ['resumo', 'got', 'todo']], ['news', 'dynews', ['manchetes', 'todas']], ['stats', 'dystats', ['resumo', 'trab', 'comb', 'vida']], ['rank', 'dyrank', ['voce', 'rankings']], ['heroes', 'dyher', ['famosos', 'reinos', 'lendas']]])
        for (const sub of subs) { UI.sel.dtab = t; (UI.sel.svSub = UI.sel.svSub || {})[g] = sub; UI.showDiary(); const b = UI.panel.querySelector('.snav-body'); ok(UI.panel.querySelector('.sv-root') && b.scrollHeight <= b.clientHeight + 1, `Diário → ${t}/${sub} não cabe na janela`); }
      UI.close();
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

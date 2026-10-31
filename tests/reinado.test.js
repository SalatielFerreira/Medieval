// Reinado e a página de cada reino seu: o conteúdo enquadrado em páginas que cabem na janela (no computador também,
// com setas, bolinhas e o número da página), quadros dois a dois, a faixa do rei e os Tratados com aba própria.
'use strict';
const { open } = require('./harness');
const check = async (opts, label) => {
  const { page, errors, close } = await open(opts), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.gold = 50000;
      Game.becomeRuler(1, 'teste'); UI.close(); G.civs[1].treasury = 20000; Reign.monthTick();
      const small = document.body.classList.contains('small');
      const audit = name => {
        const track = UI.panel.querySelector('.kpages'); if (!track) { ok(false, `${name}: não foi dividido em páginas`); return; }
        const pages = [...track.children], body = UI.panel.querySelector('.snav-body').getBoundingClientRect();
        pages.forEach((pg, i) => {
          const content = [...pg.children].filter(e => !e.matches('.pg-head, .tabs, .subtabs, .rg-top'));
          ok(content.length > 0, `${name}: a página ${i + 1} está vazia`);
          const pr = pg.getBoundingClientRect();
          for (const c of content) { const cr = c.getBoundingClientRect(); if (cr.height && cr.bottom > Math.min(pr.bottom, body.bottom) + 3) { ok(false, `${name}: um quadro passa do fim da página ${i + 1} (${c.className})`); break; } }
        });
        if (pages.length > 1 && !small) ok(UI.panel.querySelectorAll('.kdots .kd-arr').length === 2, `${name}: faltam as setas das páginas`);
      };
      for (const t of ['law', 'council', 'jus', 'aud', 'fiefs', 'spy', 'heirs', 'diplo', 'pacts', 'money', 'army', 'court']) { Reign.show(t); audit('Reinado/' + t); }
      Reign.show('council'); ok(UI.panel.querySelector('.rg-top .rg-chip'), 'falta a faixa do rei no Reinado');
      Reign.show('pacts'); ok(/Casamento entre dinastias/i.test(UI.panel.textContent), 'os Tratados não abriram na aba própria');
      Reign.show('money'); ok(!/Casamento entre dinastias/i.test(UI.panel.textContent), 'os Tratados aparecem nas outras abas');
      for (const s of ['resumo', 'coroa', 'economia', 'obras', 'exercito', 'conselho', 'diplo', 'brasao']) { UI.sel.knav = 'k:1'; UI.sel.ksub = s; UI.showKingdom(); audit('Reino/' + s); }
      UI.sel.ksub = 'resumo'; UI.showKingdom(); ok(UI.panel.querySelector('.kpages [data-act="abdicate"]'), 'a renúncia ao trono ficou fora das páginas');
      // as setas passam a página
      Reign.show('pacts'); const tr = UI.panel.querySelector('.kpages'), nx = UI.panel.querySelector('.kd-arr[data-d="1"]');
      if (nx && !nx.disabled && !small) { tr.style.scrollBehavior = 'auto'; nx.click(); }
      UI.close();
      return out;
    });
    fails.push(...r.map(x => `${label}: ${x}`));
  } finally { await close(); }
  return fails.concat(errors.map(e => `${label}: erro no jogo: ${e}`));
};
module.exports = async () => [...await check({}, 'computador'), ...await check({ width: 844, height: 390 }, 'celular')];

// Ajustes: sem "Como jogar"; Jogo, Tela e interface, Som e Controles arrumados em quadros, com dificuldade, idioma,
// jeitos de ouvir e as teclas por assunto — no computador e no celular deitado (cada página cabe na tela).
'use strict';
const { open } = require('./harness');
const check = async (opts, label) => {
  const { page, errors, close } = await open(opts), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.showSettings();
      const tabs = [...UI.panel.querySelectorAll('[data-stab], .snav [data-v]')].map(b => b.textContent.trim()).join('|');
      ok(!/Como jogar/.test(UI.panel.textContent), 'o "Como jogar" ainda está nos Ajustes');
      UI.showSettings('ajuda'); ok(UI.sel.stab === 'jogo', 'a aba antiga "Como jogar" não volta para Jogo');
      // cada página: quadros dentro da janela, nada saindo da página
      const over = () => { const b = UI.panel.querySelector('.snav-body'); if (!b) return 'sem corpo'; const R = b.getBoundingClientRect();
        const bad = [...UI.panel.querySelectorAll('.aj-box')].filter(e => { const r = e.getBoundingClientRect(), pg = e.closest('.kpage'), P2 = pg ? pg.getBoundingClientRect() : R; return r.width && (r.bottom > R.bottom + 2 || r.right > P2.right + 2); }); return bad.map(e => e.className).join(', '); };
      for (const t of ['jogo', 'tela', 'som', 'controles']) { UI.showSettings(t); ok(UI.panel.querySelector('.aj'), `a página ${t} não tem os quadros novos`); const o = over(); ok(!o, `na página ${t} há quadros saindo da tela: ${o}`); }
      // Jogo: dificuldade muda na hora
      UI.showSettings('jogo'); UI.act('setopt', { k: 'diff', v: 'hard' }); ok(G.diff === 'hard', 'a dificuldade não mudou'); UI.act('setopt', { k: 'diff', v: 'normal' });
      // Tela: os três idiomas
      UI.showSettings('tela'); ok(UI.panel.querySelectorAll('[data-act="ajlang"]').length === 3, 'faltam os idiomas na Tela e interface');
      // Som: um jeito de ouvir acerta os dois volumes
      UI.showSettings('som'); UI.act('ajpre', { m: '0.6', f: '0' }); ok(+G.settings.music === 0.6 && +G.settings.sfx === 0 && !G.settings.mute, 'o "Só música" não acertou os volumes');
      UI.act('ajpre', { m: '0.5', f: '0.7' });
      // Controles: teclas por assunto (computador)
      UI.showSettings('controles');
      if (!document.body.classList.contains('small')) ok(UI.panel.querySelectorAll('.aj-kg').length === 4 && UI.panel.querySelectorAll('.aj-key').length >= 20, 'as teclas não estão por assunto');
      else ok(UI.panel.querySelector('[data-act="tcedit"]'), 'falta ajustar os controles de toque');
      UI.close();
      return out;
    });
    fails.push(...r.map(x => `${label}: ${x}`));
  } finally { await close(); }
  return fails.concat(errors.map(e => `${label}: erro no jogo: ${e}`));
};
module.exports = async () => [...await check({}, 'computador'), ...await check({ width: 844, height: 390 }, 'celular')];

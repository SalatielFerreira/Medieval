// Janelas sem engasgo: depois de o jogo começar, as janelas principais são aquecidas escondidas (abertas e fechadas) e
// as quatro estações ficam desenhadas de antemão; nada muda no jogo (nenhuma janela aberta, as abas escolhidas e a
// pausa como estavam) e a janela aquecida abre bem mais rápido na primeira vez.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {};
      ok(UIWarm.done && UIWarm.ms > 0, 'as janelas não foram aquecidas ao começar o jogo');
      ok(!UI.isOpen() && UI.panel.classList.contains('hidden') && !document.documentElement.classList.contains('uiwarm'), 'o aquecimento deixou uma janela aberta');
      ok(Perf.sprites.size === 4, 'as quatro estações não ficaram desenhadas: ' + Perf.sprites.size);
      UI.sel.knav = 'families'; UI.sel.marca = 7; const sel = JSON.stringify(UI.sel), paused = G.paused;
      UIWarm.done = false; UIWarm.run();
      ok(JSON.stringify(UI.sel) === sel && G.paused === paused && !UI.isOpen(), 'o aquecimento mudou as abas escolhidas ou a pausa');
      const t0 = performance.now(); UI.sel.knav = 'biz'; UI.showKingdom(); void document.body.offsetHeight; const ms = performance.now() - t0;
      ok(ms < 60, `a janela aquecida demorou ${Math.round(ms)} ms para abrir`);
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

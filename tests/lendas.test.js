// Jogos dos Sete Reinos: os Registros guardam só as 12 edições mais recentes, mas as Lendas dos Jogos (e as suas
// medalhas, na aba Medalhas e lendas) somam todas as edições, mesmo as que já saíram dos Registros; e continuam depois
// de salvar e carregar. Jogos salvos antigos (sem a soma guardada) começam pelas edições que estão nos Registros.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      const S = Games.S();
      // jogo salvo antigo: 2 edições nos Registros e nenhuma soma guardada
      for (let n = 0; n < 2; n++) { Games.start(); for (const ev of GAMES_ORDER) S.me[ev] = 9999; Games.resolve(); }
      delete S.alltime;
      const me0 = Olympics.legends().find(x => x.who === 'player');
      ok(me0 && me0.m[0] === 2 * GAMES_ORDER.length, 'jogo antigo: as medalhas das edições dos Registros não entraram nas lendas');
      // mais 13 edições: os Registros guardam 5, as lendas somam as 15
      for (let n = 0; n < 13; n++) { Games.start(); for (const ev of GAMES_ORDER) S.me[ev] = 9999; Games.resolve(); }
      ok(S.history.length === GAMES_KEEP && GAMES_KEEP === 5, `os Registros deviam guardar 5 edições (${S.history.length})`);
      const me = Olympics.legends().find(x => x.who === 'player');
      ok(me && me.m[0] === 15 * GAMES_ORDER.length, `as lendas perderam edições antigas (${me && me.m[0]} ouros, eram ${15 * GAMES_ORDER.length})`);
      // a aba Medalhas e lendas mostra o total
      (UI.sel.svSub || (UI.sel.svSub = {})).og = 'medalhas'; const h = Olympics.html();
      ok(h.includes(`<span>${15 * GAMES_ORDER.length}</span>`), 'a aba Medalhas e lendas não mostra todas as suas medalhas');
      Game.save();
      return bad;
    });
    fails.push(...r);
    await page.evaluate(() => Game.load(3)); await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const r2 = await page.evaluate(() => { const me = Olympics.legends().find(x => x.who === 'player'); return me ? me.m[0] : -1; });
    if (r2 !== 150) fails.push(`depois de carregar, as lendas mudaram (${r2} ouros)`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

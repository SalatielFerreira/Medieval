// Placar da dinastia: quando o herdeiro assume, a geração que termina entra na história com o NOME DELA e o placar do que
// fez; a geração nova começa do zero.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true;
      const first = G.name; Progress.add('battlesWon', 3); Progress.add('kill_bandit', 12);
      Game.birth('Herdeira', 'f'); const kid = G.people[G.people.length - 1]; kid.age = 20;
      Game.continueAs(kid.id); UI.close();
      const d = G.dynasty[0];
      ok(d && d.name === first, `a geração que terminou ficou com outro nome: ${d && d.name} (era ${first})`);
      ok(d && d.legacy && d.legacy.battles === 3 && d.legacy.kills >= 12, 'o placar da geração não foi guardado');
      ok(G.name === 'Herdeira', 'o herdeiro não assumiu');
      const n = Legacy.now(); ok(n.battles === 0 && n.kills === 0, 'a geração nova não começou do zero');
      UI.showLegacy(); ok(UI.panel.innerHTML.includes('lugar'), 'o placar não compara as gerações');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

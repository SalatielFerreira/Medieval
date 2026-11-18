// Condenar à prisão no tribunal (e prender um conspirador do complô) leva a pessoa na hora para a cadeia do reino: ela
// aparece na lista da prisão sem esperar a virada do mês.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      Game.becomeRuler(1, 'teste'); UI.close();
      const J = Justice.jail(1); J.length = 0;
      const ids = [];
      for (let k = 0; k < 3; k++) { Laws.newCase([G.civs[1]]); const cs = Laws.L().cases[Laws.L().cases.length - 1]; if (!cs) continue; ids.push(cs.pid); Laws.judge(cs.id, 'prisao'); }
      ok(ids.length === 3, 'não deu para criar os três casos');
      ok(ids.every(id => Justice.jail(1).some(x => x.pid === id) || (Justice.S().queue[1] || []).some(x => x.pid === id)), `os condenados não estão na cadeia (${Justice.jail(1).length} presos)`);
      ok(ids.every(id => G.people[id].jail > G.day), 'os condenados não ficaram presos');
      // complô: prender o conspirador
      const q = G.people.find(p => p.alive && p.age > 20 && !p.kin && !p.capanga && !ids.includes(p.id) && Families.civOf(p) === 1);
      Reign.R().plots.push({ pid: q.id, ci: 1, kind: 'coup', found: true, ripe: G.day + 5 }); Reign.resolvePlot(Reign.R().plots.length - 1, 'arrest');
      ok(Justice.jail(1).some(x => x.pid === q.id), 'o conspirador preso não foi para a cadeia');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

// Leis na rua: guardas multando (a multa vai para o tesouro), contrabando nos portos (prender ou vista grossa), mercado negro à
// noite na taverna e espiões estrangeiros (investigador e acusação).
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 5000;
      const v = World.villages.find(x => x && !x.free), ci = v.civ, vi = World.villages.indexOf(v);
      Game.becomeRuler(ci, 't'); UI.close(); Laws.enact('armas');
      // guardas multando perto de você
      P.x = (v.x + 0.5) * TILE; P.y = (v.y + 2) * TILE;
      const g = Game.spawn('guard', P.x + 40, P.y, { civ: ci, leash: 3 }); const w = People.residents(vi)[0]; const ve = Game.spawn('villager', P.x + 60, P.y, { civ: ci, npc: w, leash: 3 });
      const t0 = G.civs[ci].treasury; LawsPlus.t = 0; LawsPlus.update(1);
      ok(G.civs[ci].treasury > t0, 'o guarda não multou ninguém'); // sem balão de fala: só a multa
      const ctx = document.createElement('canvas').getContext('2d'); g.draw(ctx, 0, 0);
      LawsPlus.monthTick(); ok(LawsPlus.S().fines === 0, 'as multas do mês não foram para o resumo');
      // contrabando num porto seu
      if (!Ports.list().some(s => Sea.civOfPort(s) === ci)) { const cp = World.capitals[ci]; World.addStruct('port', cp.x + 7, cp.y + 7, 4, 3, ci); }
      const port = Ports.list().find(s => Sea.civOfPort(s) === ci);
      LawsPlus.S().smug[port.okey] = { what: 'sal', value: 300, until: G.day + 2 };
      UI.showPort(port.id); ok(html().includes('Contrabando no porto'), 'o porto não mostra o contrabando');
      const g0 = P.gold; LawsPlus.bribe(port); ok(P.gold > g0 && !LawsPlus.smugOf(port), 'a vista grossa não pagou');
      // mercado negro à noite
      G.time = 0; const open0 = LawsPlus.open(); Laws.revoke('recolher');
      if (open0) { const h = LawsPlus.blackHtml(); ok(h.includes('Mercado negro'), 'o mercado negro não abriu à noite'); }
      // espião: plantado, investigado e acusado
      const foe = G.civs.find(o => o.id !== ci && o.ruler !== 'player'); Diplo.D().rel[foe.id][ci] = Diplo.D().rel[ci][foe.id] = -50;
      const rnd = Math.random; Math.random = () => 0.01; try { LawsPlus.plant(); } finally { Math.random = rnd; }
      const sp = LawsPlus.spies()[0]; ok(sp, 'nenhum espião foi plantado');
      if (sp) {
        const t1 = G.civs[ci].treasury; LawsPlus.monthTick(); ok(G.civs[ci].treasury < t1 + 1, 'o espião não roubou nada');
        Math.random = () => 0.01; try { LawsPlus.investigate(sp.vi); } finally { Math.random = rnd; }
        ok(LawsPlus.spies()[0].known, 'o investigador não achou o espião');
        const res = LawsPlus.accuse(G.people[sp.pid]); ok(/preso/.test(res.note) && !LawsPlus.spies().length, 'acusar o espião não deu certo');
        const inn = People.residents(sp.vi).find(p => p.age >= 18 && !p.kin); if (inn) { const r2 = LawsPlus.accuse(inn); ok(/falsa/.test(r2.note), 'acusar um inocente não pesou'); }
      }
      UI.showBoard(ci); ok(html().includes('Investigar espiões'), 'o painel não tem o investigador');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

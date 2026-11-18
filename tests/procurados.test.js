// Procurados: os reis da IA põem gente a prêmio todo mês; o mural (Serviços → Fora da lei → Procurados) mostra os
// cartazes com retrato e valor e cabe na janela; prender na conversa paga a recompensa inteira e manda para a prisão do
// reino; matar paga a metade; o reino em guerra com você não paga.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open({ width: 1366, height: 720 }), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      for (let m = 0; m < 6; m++) Bounty.monthTick();
      const S = Bounty.S(), ids = Object.keys(S);
      ok(ids.length >= 3, 'os reis não puseram ninguém a prêmio: ' + ids.length);
      const per = {}; for (const b of Object.values(S)) per[b.ci] = (per[b.ci] || 0) + 1;
      ok(Object.values(per).every(n => n <= BTY_MAX), 'um reino com cartazes demais');
      // o mural: retratos desenhados e cabe na janela
      UI.sel.olTab = 'bando'; (UI.sel.svSub = UI.sel.svSub || {}).ol0 = 'procurado'; UI.sel.knav = 'x:outlaw'; UI.showKingdom();
      const cards = UI.panel.querySelectorAll('.bty-card'), cv = UI.panel.querySelector('canvas.bty-por:not(.me)');
      ok(cards.length === ids.length, `o mural mostra ${cards.length} de ${ids.length} cartazes`);
      ok(cv && cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data.some((v, i) => i % 4 === 3 && v > 0), 'o retrato do procurado está vazio');
      ok(UI.panel.querySelector('canvas.bty-por.me'), 'o seu cartaz não tem retrato');
      const b = UI.panel.querySelector('.snav-body'), pg = UI.panel.querySelector('.sv-pg');
      ok(b.scrollHeight <= b.clientHeight + 1 && pg.scrollHeight <= pg.clientHeight + 1, 'o mural não cabe na janela');
      // estrela no mapa pelo cartaz
      const p0 = G.people[+ids[0]]; UI.act('bty', { op: 'star', p: p0.id }); ok(p0.starred, 'a estrela do cartaz não marcou a pessoa');
      UI.close();
      // prender: a opção aparece na conversa e paga tudo
      const p = G.people[+ids[1]], bt = S[p.id], ci = bt.ci; G.civs[ci].atWar = false; G.civs[ci].treasury = 5000;
      const acts = []; Lifesim.acts(p, acts); ok(acts.some(a => a[0] === 'btyCap'), 'a conversa não tem "Prender"');
      const g0 = P.gold, v = bt.v, rnd = Math.random; Math.random = () => 0;
      try { UI.talkAct({ id: p.id, op: 'btyCap' }); } finally { Math.random = rnd; }
      ok(P.gold - g0 === v, `prender não pagou a recompensa: ${P.gold - g0} de ${v}`);
      ok(Justice.jailedIn(p) === ci && !S[p.id], 'o procurado não foi para a prisão do reino');
      // matar: metade
      const q = G.people[+ids[2]], bq = S[q.id]; G.civs[bq.ci].atWar = false;
      const e = new Creature('villager', 0, 0, { npc: q }); e.npc = q; const g1 = P.gold; Game.kill(e, P);
      ok(P.gold - g1 >= Math.round(bq.v / 2) && !S[q.id], 'matar o procurado não pagou a metade');
      // em guerra não paga
      const w = Object.entries(S)[0];
      if (w) { G.civs[w[1].ci].atWar = true; ok(Bounty.pay(w[1]) === 0, 'um reino em guerra pagou a recompensa'); G.civs[w[1].ci].atWar = false; }
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

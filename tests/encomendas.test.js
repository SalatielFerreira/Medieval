// Serviços: encomendar assassinato e roubo (Fora da lei → Encomendas) — o serviço acontece no mês seguinte; se der
// errado, o contratado é preso e pode contar quem pagou (a família da vítima vira inimiga e a cabeça vai a prêmio).
// Ordens para as companhias de mercenários contratadas: caçar bandidos, guarnecer o reino, escoltar e voltar à reserva.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, r0 = Math.random;
      const seq = a => { let i = 0; Math.random = () => (i < a.length ? a[i++] : 0.5); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 50000;
      try {
        G.people.filter(p => p.alive && p.age > 18).slice(0, 80).forEach(p => { p.met = true; });
        // a aba Encomendas aparece em Serviços
        UI.sel.knav = 'x:outlaw'; UI.sel.olTab = 'bando'; (UI.sel.svSub || (UI.sel.svSub = {})).ol0 = 'encomendas'; UI.showKingdom();
        ok(UI.panel.querySelector('.ct') && UI.panel.querySelectorAll('.ct-row').length > 3, 'a aba Encomendas não aparece em Serviços');
        // 1. assassinato que dá certo
        const vic = Contracts.targets('kill').find(p => Contracts.importance(p) === 1), A = Contracts.agents();
        ok(vic && A.length >= 2, `faltam vítimas ou contratados (${A.length})`);
        UI.act('ct', { op: 'k', k: 'kill' }); UI.act('ct', { op: 't', i: vic.id }); UI.act('ct', { op: 'a', i: A[0].id }); const g0 = P.gold; UI.act('ct', { op: 'go' });
        ok(Contracts.S().list.length === 1 && P.gold < g0, 'não deu para encomendar o assassinato');
        G.day++; seq([0, 0.9]); Contracts.monthTick(); Math.random = r0;
        ok(!vic.alive && !Contracts.S().list.length, 'o assassinato encomendado não aconteceu');
        // 2. roubo que dá certo: metade do roubo é sua
        const fam = Contracts.targets('rob')[0], w0 = fam.wealth; Contracts.order('rob', fam.id, A[1].id);
        const g1 = P.gold; G.day++; seq([0, 0.9]); Contracts.monthTick(); Math.random = r0;
        ok(fam.wealth < w0 && P.gold > g1, 'o roubo encomendado não tirou da família nem trouxe a sua parte');
        // 3. deu errado: o contratado é preso e conta quem pagou
        const vic2 = Contracts.targets('kill').find(p => Contracts.importance(p) === 1 && Families.of(p) && !Families.of(p).player), f2 = Families.of(vic2);
        const ag = Contracts.agents().find(p => p !== A[0] && p !== A[1]);
        Contracts.order('kill', vic2.id, ag.id); G.day++; seq([0.99, 0.9, 0]); Contracts.monthTick(); Math.random = r0;
        ok(vic2.alive && (ag.jail > G.day || !ag.alive), 'o contratado que falhou não foi preso');
        ok(Families.members(f2).every(p => (p.aff || 0) <= -40) && Contracts.S().log.some(l => /descobriu/.test(l.t)), 'a família da vítima não descobriu quem pagou');
        // 4. ordens dos mercenários
        Mercs.hire('lobo'); ok(Mercs.co('lobo').emp === 'player', 'não contratou a companhia');
        UI.sel.olTab = 'merc'; UI.refresh(); ok(UI.panel.querySelector('[data-act="mercOrd"]'), 'o cartão da companhia não tem as ordens');
        const camps0 = World.camps.filter(c => !c.cleared).length;
        UI.act('mercOrd', { k: 'lobo', o: 'caca' }); ok(MercOrders.of('lobo') === 'caca', 'a ordem de caçar bandidos não ficou');
        const g2 = P.gold; Math.random = () => 0.01; MercOrders.monthTick(); Math.random = r0;
        ok(World.camps.filter(c => !c.cleared).length === camps0 - 1 && P.gold > g2, 'os mercenários não destruíram o acampamento');
        const ci = G.civs.find(c => c && !c.dead && c.ruler !== 'player').id; Game.becomeRuler(ci, 'teste'); UI.close(); G.mainRealm = ci;
        const gar0 = G.civs[ci].garrison; UI.act('mercOrd', { k: 'lobo', o: 'guarda' });
        ok(G.civs[ci].garrison > gar0, 'a guarnição não recebeu os mercenários');
        UI.act('mercOrd', { k: 'lobo', o: 'escolta' }); ok(G.civs[ci].garrison === gar0 && Mercs.leader('lobo').capanga, 'trocar para escolta não tirou os homens da guarnição ou o capitão não segue você');
        Mercs.dismiss('lobo'); ok(!Mercs.leader('lobo').capanga && Mercs.co('lobo').emp === null, 'dispensar não desfez a escolta');
      } finally { Math.random = r0; }
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

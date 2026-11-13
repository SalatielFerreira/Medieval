// Regras do reino coerentes: o gancho único de ganhar/perder um trono (Game.onGainRealm / Game.onLoseRealm) e as
// regras que dependiam dele — título no próprio reino, procurado pela própria guarda, rei governador de vila do reino,
// renúncia e herdeiro escolhido, decretos presos no reino perdido, guerra contra quem deu o título, feudos, fundar vila,
// sucessão e a moeda desvalorizada que dura os meses prometidos.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 500000;
      const kid = (age, extra) => { const p = People.create(Object.assign({ age, rank: 'child', civ: -1, home: { type: 'player' }, surname: G.surname, kin: 'child' }, extra || {})); p.kin = 'child'; return p; };
      const vOf = ci => World.villages.findIndex(v => v && !v.free && v.civ === ci && !v.ruin);

      // 1. virar rei: sai o título no próprio reino (e os de outros reinos: a cidadania é o reino), o procurado, a corte de outro rei e o governo da vila
      const A = 1, B = 2, vi = vOf(A);
      Court.holdings()[A] = 4; Court.holdings()[B] = 1; Court.syncPrincipal();
      Crime.W()[A] = { bounty: 300, crimes: ['teste'], resist: true };
      G.courtier = { civ: B, office: 'advisor', since: G.day, lastVisit: G.day, audience: -99 };
      World.villages[vi].lord = 'player';
      Game.becomeRuler(A, 'teste.');
      ok(Court.levelIn(A) < 0, 'o rei continuou com título de nobreza no próprio reino');
      ok(Court.levelIn(B) < 0 && Court.T().civ === -1 && Cid.get() === A, 'virando rei, o título de outro reino continuou (regra da cidadania: só o seu reino)');
      ok(Court.discount(A) === 0 && !Nobility.power(A), 'o rei ainda tem desconto ou poderes de nobre no próprio reino');
      ok(!Crime.wanted(A) && !Crime.hunting(A), 'o rei continuou procurado pela própria guarda');
      ok(!G.courtier, 'o rei continuou servindo na corte de outro rei');
      ok(World.villages[vi].lord !== 'player', 'o rei continuou governador de uma vila do próprio reino');
      Chiefdom.grant(vi, 'teste'); ok(World.villages[vi].lord !== 'player', 'o rei virou governador de uma vila do próprio reino');
      Society.run(vi); ok(!Society.E(vi).me, 'o rei se candidatou à eleição de uma vila do próprio reino');
      ok(!RoyalCourt.canBeInvited(B), 'o rei pode ser convidado para a corte de outro rei');

      // 2. abdicar: não escolhe quem já é rei; o herdeiro escolhido vem primeiro; G.title acompanha o Duque
      const king = kid(34), k2 = kid(22), k3 = kid(17);
      king.rank = 'ruler'; G.civs[3].rulerId = king.id;
      ok(Abdicate.heir(A).p === k2, 'a renúncia escolheria um filho que já é rei de outro reino');
      Reign.R().heir = k3.id;
      ok(Abdicate.heir(A).p === k3, 'a renúncia não respeitou o herdeiro escolhido');
      Abdicate.go(A);
      ok(G.civs[A].ruler !== 'player' && G.civs[A].rulerId === k3.id, 'o herdeiro escolhido não assumiu o trono');
      ok(Court.levelIn(A) === 4 && Court.T().civ === A && Court.T().lvl === 4, 'depois da renúncia G.title não virou Duque do reino');
      ok(G.mainRealm !== A, 'o reino principal continuou sendo o reino renunciado');

      // 3. perder o reino: decretos, inflação, bônus do comércio, conselho e o reinado ficam para trás
      Game.becomeRuler(A, 'teste.');
      const c = G.civs[A], cons = People.create({ age: 40, rank: 'merchant', civ: A, home: { type: 'castle', civ: A } });
      c.decrees = { feira: true }; c.inflation = 3; c.tradeBonus = 2; Court.appoint(A, 'treasurer', cons);
      Reign.R().generals = [cons.id]; Reign.newPlot(cons.id, 'coup', { ci: A });
      Game.rebellion(c);
      ok(!Object.keys(c.decrees || {}).length && !c.inflation && !c.tradeBonus, 'decretos, inflação ou bônus do comércio ficaram no reino perdido');
      ok(!c.council && !cons.council, 'o conselho continuou no reino perdido');
      ok(G.mainRealm !== A, 'o reino perdido continuou como reino principal');
      // (a dívida do reino é a do banco do reino: fica com o reino)
      ok(!Reign.R().generals.length && !Reign.R().plots.length, 'sem reino, o reinado manteve generais ou complôs');

      // 4. guerra: o reino que ataca você suspende as vantagens do título; declarar guerra a ele tira o título
      Game.becomeRuler(A, 'teste.');
      Court.holdings()[B] = 2; Court.syncPrincipal(); G.civs[B].treasury = 99999;
      Diplo.declareWar(B, A, 'teste');
      ok(Court.levelIn(B) === 2, 'o título sumiu quando o outro reino declarou a guerra (devia só ficar suspenso)');
      let g0 = P.gold; Court.stipendTick(); Nobility.monthTick();
      ok(P.gold === g0, 'o reino inimigo continuou pagando salário ou feudo do título');
      ok(Court.discount(B) === 0 && !Nobility.power(B), 'em guerra, o título ainda dá desconto ou poderes');
      Diplo.makePeace(B, A, 'teste');
      ok(Court.titleLive(B) && Court.discount(B) > 0, 'com a paz, as vantagens do título não voltaram');
      Diplo.declareWar(A, B, 'teste');
      ok(Court.levelIn(B) < 0, 'declarar guerra ao reino que deu o título não tirou o título');
      Diplo.makePeace(A, B, 'teste');

      // 5. feudos só de vilas do seu reino
      const vA = vOf(A), vB = vOf(B), vFree = World.villages.findIndex(v => v && v.free);
      ok(Reign.fiefOk(vA) && !Reign.fiefOk(vB), 'feudo aceito fora do reino (ou recusado dentro dele)');
      if (vFree >= 0) ok(!Reign.fiefOk(vFree), 'vila livre aceita como feudo');
      const fv = Reign.freeVillage(); ok(fv < 0 || World.villages[fv].civ === A, 'a vila oferecida como feudo não é do reino');
      const nb = People.create({ age: 40, rank: 'knight', civ: B, home: { type: 'castle', civ: B } });
      Reign.grantFief(vB, nb.id); ok(!Reign.R().fiefs[vB], 'entregou como feudo uma vila de outro reino');

      // 6. fundar vila: em reino alheio não; no seu reino a vila nasce do reino
      const spot = ci => { for (let y = 10; y < WORLD_H - 10; y += 2) for (let x = 10; x < WORLD_W - 10; x += 2) if (World.terr[World.idx(x, y)] === ci && Families.siteOk(x, y) === true) return { x, y }; return null; };
      const sB = spot(B);
      if (sB) { P.x = (sB.x + 0.5) * TILE; P.y = (sB.y + 2.5) * TILE; const s = Families.playerSite(); ok(s.ok !== true, 'deu para fundar uma vila livre dentro do reino de outro'); }
      const sA = spot(A);
      ok(sA && sB, 'o teste não achou lugar aberto para fundar vila nos reinos de teste');
      if (sA) {
        P.x = (sA.x + 0.5) * TILE; P.y = (sA.y + 2.5) * TILE; const s = Families.playerSite();
        ok(s.ok === true && s.realm, 'não deu para fundar uma vila dentro do seu reino');
        const n0 = World.villages.length; Families.playerFound('Vila Regra');
        const nv = World.villages[n0];
        ok(nv && !nv.free && nv.civ === A && nv.lord !== 'player', 'a vila fundada no seu reino não nasceu do reino');
      }

      // 7. moeda desvalorizada: dura os meses prometidos (o Crown.monthCiv desconta um por mês) e o Reinado não a zera
      const m = Reign.main(); m.treasury = 5000; m.inflation = 0; Reign.R().debase = 0;
      Reign.debase();
      ok(m.inflation === 4, `a moeda desvalorizada não marcou 4 meses de inflação (ficou ${m.inflation})`);
      Crown.monthCiv(m); ok(m.inflation === 3, 'a inflação da moeda desvalorizada acabou depois de um mês');
      Crown.monthCiv(m); Crown.monthCiv(m); Crown.monthCiv(m); ok(!m.inflation, 'a inflação não acabou no prazo prometido');
      m.inflation = 4; Reign.R().debase = 1; Reign.R().inflUntil = G.day - 1; Reign.monthTick();
      ok(m.inflation === 4, 'o Reinado zerou a inflação no mês (a moeda é uma só: o contador de meses)');
      return out;
    });
    fails.push(...r);

    // 8. herdeiro escolhido vale na sucessão: o herói continua como o mais velho, mas o trono fica com o escolhido
    const s = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {};
      const A = 1; if (G.civs[A].ruler !== 'player') Game.becomeRuler(A, 'teste.');
      for (const p of G.people) if (p.kin === 'child') p.kin = null;
      const mk = age => { const p = People.create({ age, rank: 'child', civ: -1, home: { type: 'player' }, surname: G.surname }); p.kin = 'child'; return p; };
      const old = mk(30), pick = mk(20);
      G.family.spouse = null; Reign.R().heir = pick.id;
      Game.continueAs(old.id);
      ok(G.civs[A].ruler !== 'player' && G.civs[A].rulerId === pick.id, 'na sucessão o trono não ficou com o herdeiro escolhido');
      ok(Reign.R().heir === null, 'a escolha do herdeiro não foi zerada para a geração nova');
      return out;
    });
    fails.push(...s);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

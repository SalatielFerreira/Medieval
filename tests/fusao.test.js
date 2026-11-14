// Um sistema de cada: o conselho é um só por reino (com os dilemas e uma lista só de complôs), os tratados do Reinado
// usam a relação entre reinos e não repetem comércio, casamento nem reféns, os decretos não repetem as leis, uma moeda,
// um torneio, um recrutar, o saldo do mês é o mesmo em todas as janelas e bate com o tesouro na virada do mês, sacar
// do tesouro tem a regra do banco, a aba de Prisão e justiça aparece certa depois de refazer a página e um jogo salvo
// "antigo" (com os sistemas que saíram) é convertido ao carregar.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); }, info = {};
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 50000;
      Game.becomeRuler(1, 'teste'); UI.close();
      const c = G.civs[1], R = Reign.R(); c.treasury = 20000; c.garrison = 30; c.stock.wheat = 2000;
      const person = (rank, extra) => People.create(Object.assign({ age: 40, rank, civ: 1, home: { type: 'castle', civ: 1 } }, extra || {}));

      // 1. um conselho por reino: as cadeiras do Court, os dilemas e os complôs num lugar só
      ok(typeof ROYAL_COUNCIL === 'undefined' && !('council' in R), 'ainda existe o conselho próprio do Reinado');
      for (const seat of Object.keys(COUNCIL)) Court.appoint(1, seat, person('merchant'));
      for (const p of Reign.councilors(1)) p.corrupt = false;
      ok(Object.keys(COUNCIL).every(k => Reign.member(k) && Reign.member(k) === Court.member(1, k)), 'Reign.member não lê as cadeiras do conselho do reino');
      ok(Reign.DILEMMAS.every(D => COUNCIL[D.who]), 'há dilema de uma cadeira que não existe no conselho');
      R.dilemma = { id: 'colheita', ci: 1, day: G.day };
      const tz = Reign.member('treasurer'), a0 = tz.aff; Reign.answer(0);
      ok(!R.dilemma && tz.aff === Math.min(100, a0 + 5), 'responder o dilema não mexeu na lealdade do conselheiro do reino');
      const spy = Reign.member('spy'); spy.comp = 10; spy.aff = 80; const s10 = Reign.spySkill(1); spy.comp = 1; spy.aff = 0;
      ok(s10 > Reign.spySkill(1), 'a força da espionagem não depende do espião-mor do conselho');
      // o conselheiro desleal trama: o complô vai para a lista única, é julgado no Reinado e a cadeira fica vaga
      const t = Reign.member('treasurer'); t.aff = -80; t.amb = 100; R.plots = [];
      // (só o tesoureiro trama: os outros conselheiros ficam leais, senão o sorteio podia trazer o complô de outro)
      const loyal = () => { for (const seat of Object.keys(COUNCIL)) { const m = Reign.member(seat); if (m && m !== t) { m.aff = 100; m.amb = 0; } } };
      for (let k = 0; k < 80 && !R.plots.some(x => x.pid === t.id); k++) { loyal(); Court.dayTick(); t.aff = -80; }
      R.plots = R.plots.filter(x => x.pid === t.id);
      const pl = R.plots.find(x => x.pid === t.id);
      ok(pl && pl.seat === 'treasurer' && pl.ci === 1 && pl.kind === 'embezzle', 'o complô do conselheiro não foi para a lista única do Reinado');
      ok(G.plotsC === undefined, 'ainda existe a lista de complôs do Court (G.plotsC)');
      if (pl) {
        pl.found = true;
        ok(Court.plotsOf(1).length === 1 && Reign.plotsOf(1).length === 1, 'o conselho do reino e o Reinado não veem os mesmos complôs');
        Reign.resolvePlot(R.plots.indexOf(pl), 'exile');
        ok(!Court.member(1, 'treasurer') && !t.council && !R.plots.length, 'exilar o conselheiro não vagou a cadeira nem tirou o complô');
      }
      // complô não descoberto ataca com o golpe da cadeira (o general leva soldados)
      const gen = Reign.member('general'); c.garrison = 30; R.plots = []; Reign.newPlot(gen.id, 'coup', { ci: 1, seat: 'general', ripe: G.day });
      const sk = Reign.spySkill; Reign.spySkill = () => 0; try { Reign.monthTick(); } finally { Reign.spySkill = sk; }
      ok(c.garrison <= 15 && !Court.member(1, 'general'), 'o complô do general não aconteceu com o golpe da cadeira');
      // generais de batalha são os do Exército (R.generals); o do conselho é quem recruta e defende
      ok(Array.isArray(R.generals), 'os generais de batalha sumiram');

      // 2. diplomacia e tratados: relação entre reinos (Diplo.rel); sem comércio, casamento e refém repetidos
      G.civs[3].relation = -90; G.diplo.rel[1][3] = G.diplo.rel[3][1] = 37;
      Reign.show('diplo'); let html = UI.panel ? UI.panel.innerHTML : '';
      ok(/>\+37</.test(html), 'a Diplomacia do Reinado não mostra a relação entre os reinos');
      ok(!/Casamento real|Pedir um refém|Livre passagem|Comércio \(\+5% renda\)/.test(html), 'a Diplomacia do Reinado ainda tem comércio, casamento ou refém repetidos');
      ok(typeof Reign.royalWed === 'undefined' && typeof Reign.hostage === 'undefined' && typeof Crown.demand === 'undefined', 'ainda existem Reign.royalWed, Reign.hostage ou Crown.demand');
      Reign.sign(3, 'commerce'); Reign.sign(3, 'passage'); ok(!R.treaties.some(x => x.kind !== 'nonagg'), 'o Reinado ainda assina comércio ou livre passagem');
      Reign.sign(3, 'nonagg'); ok(Reign.treaty(1, 3, 'nonagg'), 'a não agressão não foi assinada');
      ok(typeof Pacts.wed === 'function' && typeof Pacts.askTrade === 'function', 'os Tratados (casamento e comércio) sumiram');
      Reign.show('pacts'); html = UI.panel ? UI.panel.innerHTML : '';
      ok(/Casamento entre dinastias/.test(html) && (html.match(/Casamento entre dinastias/g) || []).length === 1, 'a Diplomacia do Reinado não mostra os Tratados (ou mostra duas vezes)');

      // 3. decretos sem os de mesmo nome das leis
      const lawNames = Object.values(LAWS).map(l => l.name.toLowerCase());
      ok(!['feira', 'toque', 'caca', 'escolas'].some(k => DECREES[k]) && !Object.values(DECREES).some(d => lawNames.includes(d.name.toLowerCase())), 'há decreto com o mesmo nome de uma lei');
      ok(LAWS.feira && LAWS.recolher && LAWS.caca && LAWS.escola, 'as leis equivalentes sumiram');

      // 4. uma moeda (desvalorizar do Reinado, contador de meses); 5. um torneio, um baile; 6. um recrutar
      ok(!Crown.ACTIONS.cunhar && !Crown.ACTIONS.banquete && !Crown.ACTIONS.recrutar && Crown.ACTIONS.torneio, 'a coroa ainda cunha moeda, dá banquete ou recruta (ou perdeu o torneio)');
      ok(typeof Reign.tourney === 'undefined', 'o Reinado ainda tem um torneio próprio');
      Reign.debase(); ok(typeof c.inflation === 'number' && c.inflation === 4, 'desvalorizar não grava a inflação em meses: ' + c.inflation); Reign.strongCoin(); ok(!c.inflation, 'moeda forte não acabou a inflação');
      const fam = Families.ranking(1).find(x => !x.f.player); if (fam) fam.f.loyalty = 10; R.court.ball = -9; Reign.ball();
      ok(R.court.ball === G.day && (!fam || fam.f.loyalty >= 22), 'o baile não ficou com o efeito do banquete nas grandes casas');
      c.garrison = 10; Game.kRecruit(1, 6); ok(c.garrison === 16, 'recrutar com quantidade não funcionou: ' + c.garrison);
      ok(Game.maxGarrison(c) === 50 && Game.maxGarrison(G.civs[2]) === 50, 'o teto da guarnição não é um número só');
      ok(typeof TRIALS === 'undefined' && typeof PETITIONS === 'undefined' && !Crown.trial && !Crown.petition, 'o tribunal ou a audiência da coroa ainda existem');

      // 7. o saldo do mês: o mesmo em todas as janelas e batendo com o tesouro na virada do mês
      c.garrison = 30; c.treasury = 20000; R.dilemma = null; R.aud = []; R.plots = []; R.budget = { army: 1, court: 1, works: 1, church: 1 }; R.customs = 10;
      for (const p of Reign.councilors(1)) p.corrupt = false;
      if (typeof LawsPlus !== 'undefined') LawsPlus.S().spies = [];
      const m = Treasury.month(c), net = m.net;
      ok(Bank.health(1).net === net, 'o banco usa outro saldo do mês');
      UI.sel.knav = 'k:1'; UI.sel.ksub = 'resumo'; UI.showKingdom(); html = UI.panel ? UI.panel.querySelector('.rg-top').innerHTML : '';
      ok(html.includes(`${net >= 0 ? '+' : ''}${net.toLocaleString('pt-BR')}`), 'a faixa do rei no Reinado mostra outro saldo do mês');
      Reinado.go('k:1', 'tesouro'); html = UI.panel ? UI.panel.innerHTML : ''; ok(html.includes(`+${m.tin} 🪙`) && html.includes(`−${m.tout} 🪙`), 'o Tesouro do Reinado mostra outras entradas e saídas');
      UI.close();
      const t0 = c.treasury; Game.onNewDay(); while (Perf.queue && Perf.queue.length) Perf.update(0.016);
      const real = c.treasury - t0; info.month = { pred: net, real, lines: m.inc.concat(m.exp).map(x => x[0] + ' ' + x[1]).join(' | ') };
      ok(Math.abs(real - net) <= Math.max(80, Math.abs(net) * 0.15), `o saldo previsto (${net}) não bateu com a variação real do tesouro (${real})`);

      // 8. sacar e depositar: só com a regra do banco
      ok(typeof Game.kGold === 'undefined', 'ainda existe o Game.kGold sem penalidade');
      c.treasury = 5000; c.happy = 60; const g0 = P.gold; UI.act('kgold', { c: '1', n: '-100' });
      ok(P.gold === g0 + 100 && c.treasury === 4900 && c.happy < 60, 'sacar do tesouro não seguiu a regra do banco (felicidade)');
      UI.act('kgold', { c: '1', n: '200' }); ok(P.gold === g0 - 100 && c.treasury === 5100, 'depositar no tesouro não funcionou');
      UI.close();

      // 9. a aba Leis e justiça (com a prisão) aparece certa depois de refazer a página
      Reign.show('jus'); UI.refresh(); html = UI.panel ? UI.panel.innerHTML : '';
      ok(/Cela 1/.test(html) && !/Crônica do reinado/.test(html), 'depois de UI.refresh a aba jus não mostra a Prisão');
      UIP.goPage('x:reign', 'jus'); html = UI.panel ? UI.panel.innerHTML : '';
      ok(/Cela 1/.test(html) && !/Crônica do reinado/.test(html), 'UIP.goPage(x:reign, jus) não mostra a Prisão');
      UI.close();
      return { out, info };
    });
    fails.push(...r.out);
    console.log(`    mês do tesouro: previsto ${r.info.month.pred}, real ${r.info.month.real}`);
    if (fails.some(f => /saldo previsto/.test(f))) console.log('    ' + r.info.month.lines);

    // 10. jogo salvo antigo: monta o estado de antes da fusão, salva, carrega e confere a conversão (duas vezes)
    const m = await page.evaluate(async () => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {};
      const R = Reign.R(), c = G.civs[1];
      const p1 = People.create({ age: 40, rank: 'merchant', civ: 1, home: { type: 'castle', civ: 1 } }), hk = People.create({ age: 30, rank: 'knight', civ: 4, home: { type: 'castle', civ: 4 } });
      Court.appoint(1, 'spy', p1);
      const s = JSON.parse(JSON.stringify(Game.snapshot()));
      const OR = s.urban.reign;
      OR.council = { treasurer: p1.id }; OR.debt = 480; OR.hist = { 1: [100, 200] }; OR.court.tourney = 3;
      OR.treaties = [{ a: 1, b: 2, kind: 'commerce', day: 1 }, { a: 1, b: 5, kind: 'passage', day: 1 }, { a: 1, b: 6, kind: 'nonagg', day: 1 }];
      OR.hostages = [hk.id]; s.people[hk.id].hostage = 4;
      OR.plots = [{ pid: p1.id, kind: 'embezzle', day: s.day, found: false }];
      s.plotsC = [{ id: 1, civ: 1, pid: p1.id, seat: 'spy', day: s.day, ripe: s.day + 5, found: true, done: false }];
      const k2 = People.create({ age: 50, rank: 'merchant', civ: 1, home: { type: 'castle', civ: 1 } }); s.people[k2.id] = JSON.parse(JSON.stringify(k2));
      s.plotsC.push({ id: 2, civ: 1, pid: k2.id, seat: 'diplomat', day: s.day, ripe: s.day + 5, found: true, done: false });
      s.trial = { ci: 1, vi: 0, id: 'ladrao', day: s.day };
      s.civs[1].decrees = { feira: true, toque: true, caca: false, escolas: true, pao: true }; s.civs[1].crownCd = { cunhar: s.day + 3, monumento: 1 };
      s.urban.law = { active: ['duelos'], cases: [], justice: 0, log: [], wrong: [], since: {} };
      const debt0 = (s.urban.bank && s.urban.bank.k && s.urban.bank.k[1] && s.urban.bank.k[1].debt) || 0;
      await Game.load(3, null, s);
      const check = tag => {
        const R2 = Reign.R(), L = Laws.L(), d = G.civs[1].decrees || {};
        ok(!('council' in R2) && !('hostages' in R2) && !('debt' in R2) && !('hist' in R2) && !('tourney' in R2.court), tag + 'sobrou dado antigo do Reinado');
        ok(R2.plots.some(x => x.pid === k2.id && x.seat === 'diplomat' && x.ci === 1 && x.found && x.kind === 'betray'), tag + 'o complô do conselho (G.plotsC) não foi para a lista única');
        ok(R2.plots.filter(x => x.pid === p1.id).length === 1 && R2.plots.every(x => x.ci !== undefined && x.ripe !== undefined), tag + 'complôs duplicados ou sem reino');
        ok(G.plotsC === undefined && G.trial === undefined, tag + 'o tribunal ou os complôs antigos não foram descartados');
        ok(R2.treaties.length === 1 && R2.treaties[0].kind === 'nonagg', tag + 'sobrou tratado de comércio ou de passagem no Reinado');
        ok(Pacts.trade(1, 2) && Pacts.trade(1, 5) && Pacts.S().trade.filter(t => Pacts.pair(t.a, t.b) === Pacts.pair(1, 2)).length === 1, tag + 'comércio ou passagem não viraram um tratado de comércio');
        ok(Pacts.S().host.filter(h => h.pid === hk.id && h.from === 4 && h.to === 1).length === 1 && G.people[hk.id].hostage === undefined, tag + 'o refém do Reinado não virou refém dos Tratados');
        ok(!('feira' in d) && !('toque' in d) && !('escolas' in d) && !('caca' in d) && d.pao, tag + 'os decretos repetidos não saíram (ou o outro sumiu)');
        ok(L.active.includes('feira') && L.active.includes('recolher') && L.active.includes('escola') && !L.active.includes('caca') && L.active.includes('duelos'), tag + 'os decretos não viraram as leis: ' + L.active.join(','));
        ok(Bank.K(1).debt === debt0 + 480, tag + 'a dívida da coroa não virou dívida do banco: ' + Bank.K(1).debt);
        ok(!(G.civs[1].crownCd || {}).cunhar && (G.civs[1].crownCd || {}).monumento === 1, tag + 'a espera de cunhar ficou (ou a outra sumiu)');
      };
      check('');
      // de novo (idempotente): salva o jogo convertido e carrega outra vez
      const s2 = JSON.parse(JSON.stringify(Game.snapshot())); await Game.load(3, null, s2); Game.migrateFusion(s2);
      check('2ª vez: ');
      return out;
    });
    fails.push(...m);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

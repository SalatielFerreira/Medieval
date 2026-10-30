// Mundo vivo: personalidade dos reis, leis e tribunal, mercenários, Jogos dos Sete Reinos, viajantes, o livro da
// dinastia, as camadas novas do mapa e as páginas novas do Portfólio.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(async () => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 50000;
      const rnd = Math.random;
      // personalidade
      for (const c of G.civs) ok(Personas.of(c.id), 'rei sem personalidade: ' + c.id);
      const c2 = G.civs[2]; c2.persona = 'gastador'; c2.treasury = 1000; const K = Bank.K(2), d0 = K.debt; Math.random = () => 0.01; try { Personas.monthCiv(c2); } finally { Math.random = rnd; } ok(c2.treasury < 1000 && K.debt > d0, 'o rei gastador não gastou nem pediu ao banco');
      c2.persona = 'prudente'; c2.treasury = 1000; Personas.monthCiv(c2); ok(K.debt < d0 + 400, 'o rei prudente não pagou a dívida');
      UI.showCastle(2); ok(html().includes('personalidade do rei'), 'o castelo não mostra a personalidade');
      const old = c2.persona; Succession.seat(c2, People.create({ rank: 'knight', civ: 2, trait: 'corajoso' }), 'ruler'); ok(c2.persona === 'guerreiro', 'o rei novo não trouxe a personalidade dele (' + old + ')');
      // leis e tribunal
      Game.becomeRuler(1, 'teste'); UI.close(); const c1 = G.civs[1];
      Laws.enact('vinho'); Laws.enact('feira'); Laws.enact('duelos'); ok(Laws.has('vinho') && Laws.L().active.length === 3, 'as leis não foram decretadas');
      ok(Game.price(1, 'wine').buy > Math.round(Game.price(2, 'wine').buy * 0.5), 'preço do vinho');
      const t0 = c1.treasury; Laws.monthTick(); ok(c1.treasury !== t0, 'as leis não mexeram no tesouro');
      Laws.revoke('feira'); ok(!Laws.has('feira'), 'revogar');
      Laws.L().cases = []; for (let k = 0; k < 4; k++) Laws.newCase([c1]); ok(Laws.L().cases.length > 0, 'não chegaram casos ao tribunal');
      const cs = Laws.L().cases[0]; cs.guilty = true; const j0 = Laws.L().justice; Laws.judge(cs.id, 'prisao'); ok(Laws.L().justice > j0 && G.people[cs.pid].jail > G.day, 'prender um culpado');
      if (Laws.L().cases[0]) { const c3 = Laws.L().cases[0]; c3.guilty = false; const j1 = Laws.L().justice; Laws.judge(c3.id, 'forca'); ok(Laws.L().justice < j1 && Laws.L().wrong.length, 'enforcar um inocente não pesou'); }
      Reign.show('law'); ok(html().includes('Tribunal') && html().includes('Leis em vigor'), 'a aba de leis e tribunal');
      // mercenários
      const id = MERC_CO[0].id; Mercs.hire(id); ok(Mercs.co(id).emp === 'player', 'não contratou');
      const a1 = War.armyOf(1); ok(a1.mercs > 0, 'os mercenários não entraram no exército');
      P.gold = 0; for (const k of G.civs) if (k.ruler === 'player') k.treasury = 0; Mercs.monthTick(); Mercs.monthTick(); ok(Mercs.co(id).emp !== 'player', 'sem pagamento a companhia não trocou de lado');
      P.gold = 50000; UI.showMercs(); ok(html().includes('Companhias livres'), 'janela dos mercenários');
      // Jogos
      const S = Games.S(); S.year = 0; Games.start(); ok(S.on && S.host >= 0, 'os Jogos não começaram');
      S.me.archery = 99; G.day++; Games.resolve(); ok(!S.on && S.history.length && S.history[0].ev.archery[0].who === 'player', 'o jogador com 99 pontos não ganhou o ouro no arco');
      // a página 🏅 Jogos dentro da Arena (abaixo de Torneio), cabendo na janela
      { Games.start(); const h = S.host; Places.enterRoom(Arena.arenaOf(h)); UI.sel.atab = 'jogos'; UI.showArena(h); const b = UI.panel.querySelector('.snav-body'), ks = [...UI.panel.querySelectorAll('[data-act="anav"]')].map(x => x.dataset.k);
        ok(ks.indexOf('jogos') === ks.indexOf('torneio') + 1 && UI.panel.querySelectorAll('.og-ev').length === 7 && UI.panel.querySelector('[data-act="gPlay"]:not([disabled])') && b.scrollHeight <= b.clientHeight + 1, 'a página Jogos da Arena');
        UI.sel.atab = 'lutar'; UI.close(); Places.exit(true); G.day++; Games.resolve(); }
      Games.archery(); for (let k = 0; k < 3; k++) Games.shoot(); ok(G.arch.shots.length === 3, 'o arco não atirou 3 flechas'); Games.archEnd();
      (UI.sel.svSub = UI.sel.svSub || {}).og = 'medalhas'; UI.showGames(); ok(html().includes('Quadro de medalhas'), 'janela dos Jogos');
      UI.sel.svSub.og = 'registros'; UI.showGames(); ok(html().includes('Jogos do ano') && html().includes('🥇'), 'os registros dos Jogos não mostram o pódio');
      // viajantes
      let went = 0; Math.random = () => 0.001; try { Travel.depart(); } finally { Math.random = rnd; }
      const tr = G.people.filter(p => p.alive && p.trip && p.trip.why); went = tr.length; ok(went > 0, 'ninguém viajou');
      if (tr[0]) { const p = tr[0]; p.fameAt = { [p.trip.vi]: 20 }; Travel.back(p); ok(p.famousAt !== undefined, 'a fama no lugar visitado não contou'); Trips.end(p); ok(!p.trip, 'a viagem não terminou'); }
      const tp = G.people.find(p => p.alive && p.trip && p.trip.from !== undefined); if (tp) { const a = World.villages[tp.trip.from]; P.x = a.x * TILE; P.y = (a.y + 3) * TILE; tp.trip.since = G.day; Travel.routeBusy = 0; for (let k = 0; k < 6; k++) { Travel.t = 0; Travel.update(0.7); } }
      // livro
      Progress.diary('⚔️ Venceu a guerra contra Winterfel.'); Progress.diary('💍 Casou-se com Ana.');
      UI.showBook(0); ok(UI.cur.fn === 'showBook' && html().includes('Crônica da Casa'), 'o livro não abriu'); UI.act('book', { p: 2 }); ok(html().includes('bk-page'), 'virar a página');
      Progress.endHero('teste'); ok(G.bookPending, 'o livro não ficou pendente no fim da geração'); G.bookPending = false;
      // mapa e Portfólio
      UI.close(); MapView.show(); const L = UIP.layers(); ok(L.bank && L.elec && L.crisis && L.barb, 'camadas novas'); MapView.draw(); MapView.hide();
      for (const [k, to] of [['x:merc', 'x:outlaw'], ['x:games', 'x:games']]) { UI.act('knav', { k }); ok(UI.sel.knav === to && html().length > 500, 'página do Portfólio: ' + k); } // Mercenários fica dentro de Fora da lei
      UIP.goPage('x:reign', 'law'); ok(html().includes('Tribunal'), 'o aviso não leva ao tribunal');
      UI.close();
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

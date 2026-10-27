// Reinado: conselho e dilemas, audiências, feudos e revolta, espionagem e complôs, tutores, tratados e não agressão,
// vassalagem, casamento real, orçamento, moeda, alfândega, generais e moral, baile, torneio, castelo e títulos.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true;
      P.god = true; P.gold = 50000;
      Game.becomeRuler(1, 'teste'); UI.close();
      const c = G.civs[1]; c.treasury = 20000; c.garrison = 30;
      Reign.monthTick();
      const R = Reign.R();
      ok(Object.keys(ROYAL_COUNCIL).every(k => Reign.member(k)), 'o conselho não foi formado');
      ok(R.dilemma, 'não veio dilema'); const t0 = c.treasury; Reign.answer(0); ok(!R.dilemma, 'o dilema não foi respondido');
      ok(R.aud.length > 0, 'ninguém pediu audiência'); const n0 = R.aud.length; Reign.hear(0, 0); ok(R.aud.length === n0 - 1, 'a audiência não foi atendida');
      // feudo
      const vi = World.villages.findIndex(v => v.civ === 1), nb = Reign.nobles()[0];
      if (vi >= 0 && nb) { Reign.grantFief(vi, nb.id); ok(R.fiefs[vi], 'o feudo não foi dado'); const t1 = c.treasury; R.fiefs[vi].loyal = 5; Reign.monthTick(); ok(R.fiefs[vi] && R.fiefs[vi].rebel, 'o barão furioso não se revoltou'); UI.act('rgNego', { v: vi }); ok(R.fiefs[vi] && !R.fiefs[vi].rebel, 'negociar não acabou a revolta'); }
      // espionagem
      Reign.plantSpy(2); ok(R.spies[2], 'o espião não entrou'); for (let k = 0; k < 6 && R.spies[2]; k++) Reign.mission(2, 'steal');
      const m = Reign.member('treasurer'); m.loyal = 5; m.amb = 90; R.plots = []; Reign.newPlot(m.id, 'embezzle'); R.plots[0].found = true; Reign.resolvePlot(0, 'pardon'); ok(m.loyal >= 50 && !R.plots.length, 'perdoar o complô não funcionou');
      // herdeiros
      const kid = People.create({ rank: 'child', age: 10, sex: 'm', home: { type: 'player' } }); kid.kin = 'child';
      Reign.setTutor(kid.id, 'guerra'); Ranking.stats(kid); const s0 = kid.str; Reign.monthTick(); ok(kid.str > s0, 'o tutor de guerra não deixou o filho mais forte');
      // diplomacia
      G.civs[3].relation = 60; Reign.sign(3, 'nonagg'); ok(Reign.treaty(1, 3, 'nonagg'), 'tratado não assinado');
      const w0 = Diplo.atWar(3, 1); Diplo.declareWar(3, 1, 'teste'); ok(!Diplo.atWar(3, 1) || w0, 'a não agressão não segurou a guerra');
      G.civs[4].garrison = 1; G.civs[4].treasury = 0; G.civs[4].relation = 20; for (let k = 0; k < 8 && G.civs[4].overlord !== 1; k++) Reign.demandVassal(4); ok(G.civs[4].overlord === 1, 'o reino fraco não virou vassalo');
      const tv = c.treasury; G.civs[4].treasury = 1000; Reign.monthTick(); ok(G.civs[4].treasury < 1000, 'o vassalo não pagou tributo');
      // economia
      const td = c.treasury; Reign.debase(); ok(c.treasury > td && c.inflation, 'desvalorizar não deu ouro nem inflação'); Reign.strongCoin(); ok(!c.inflation, 'moeda forte não acabou a inflação');
      UI.act('rgCustoms', { t: 10 }); ok(R.customs === 10, 'alfândega');
      // exército e corte
      const gc = Reign.genCands()[0]; if (gc) { UI.act('rgGen', { p: gc.id }); ok(Reign.generals().length, 'general não nomeado'); }
      Reign.ball(); ok(R.court.ball === G.day, 'o baile não aconteceu'); Reign.tourney(); ok(R.court.tourney === G.day, 'o torneio não aconteceu');
      Object.assign(P.inv, { stone_block: 200, marble_block: 100, glass: 50, gold_bar: 20 }); Reign.upgradeCastle(1); ok(Reign.castleLv(1) === 2, 'o castelo não subiu de nível');
      const cs = World.structs.find(s => s.type === 'castle' && s.owner === 1); if (cs) World.drawStruct(document.createElement('canvas').getContext('2d'), cs, 10, 10, 1);
      Game.becomeRuler(5, 'teste'); UI.close(); Reign.monthTick(); ok(Reign.titleName().startsWith('Alt') || Reign.titleName().startsWith('Imper'), 'título maior: ' + Reign.titleName());
      for (const t of ['council', 'aud', 'fiefs', 'spy', 'heirs', 'diplo', 'money', 'army', 'court']) { Reign.show(t); ok(UI.cur && UI.cur.fn === 'showKingdom' && UI.sel.knav === 'x:reign' && UI.sel.rgTab === t, 'janela não abriu: ' + t); }
      UI.close(); for (let k = 0; k < 3; k++) Game.onNewDay();
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

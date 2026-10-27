// Política: eleição a cada 5 meses por feitos, relacionamento e fama (você também se reelege), o eleito continua no
// cargo, suborno do círculo do rei (a guarda some da sala do trono), golpe entre os reinos da IA e golpe contra você.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 50000;
      // eleição: muitos feitos e amizade ganham
      const vi = World.villages.findIndex((v, i) => People.residents(i).length >= 6), v = World.villages[vi], E = Society.E(vi);
      for (const p of People.residents(vi)) p.aff = 90;
      Politics.addDeed(vi, 'player', 200); Society.run(vi); E.next = G.day; Society.election(vi);
      ok(v.lord === 'player', 'não ganhou a eleição com feitos e amizade'); ok(E.next === G.day + POL_TERM, 'o mandato não é de 5 meses');
      // reeleição perdida: o povo não gosta e sem feitos
      for (const p of People.residents(vi)) p.aff = -100; Politics.S().deeds[vi] = {}; E.next = G.day; Society.election(vi);
      ok(v.lord !== 'player' && v.elected !== undefined, 'o governador não perdeu a reeleição');
      const el = v.elected; Families.refresh(); ok(v.chief === el, 'o eleito perdeu o cargo para outra família');
      Politics.donate(vi, 100); Politics.party(vi); ok(Politics.deeds(vi, 'player') > 0, 'doar e dar festa não contam como feitos');
      Society.show('politics'); ok(html().includes('Os tronos') && html().includes('pol-v'), 'página de política');
      Politics.monthTick();
      // suborno do círculo do rei
      const ci = 2, L = Politics.circlePeople(ci); ok(L.length === 4, 'o círculo do rei não tem 4 pessoas');
      const rnd = Math.random; Math.random = () => 0.01;
      try { for (const x of L) { x.p.aff = 100; const res = Politics.bribe(x.p); ok(x.p.bribed === 'player', 'suborno falhou: ' + res.text); } } finally { Math.random = rnd; }
      ok(Politics.ready(ci), 'o círculo não ficou todo comprado');
      const acts = []; Lifesim.acts(L[0].p, acts); UI.showCastle(ci); ok(html().includes('O círculo do rei'), 'o castelo não mostra o círculo do rei');
      const cs = World.structs.find(s => s.type === 'castle' && s.owner === ci && !s.removed);
      if (cs) { P.x = (cs.x + 2) * TILE; P.y = (cs.y + cs.h + 1) * TILE; Places.enterRoom(cs); ok(G.place && !G.ents.some(e => !e.dead && e.royalGuard), 'a guarda real continuou na sala do trono'); Places.exit(); }
      // golpe entre os reinos da IA
      const c3 = G.civs[3], rf = G.people[c3.rulerId] ? G.people[c3.rulerId].fam : -1, f = Object.values(Families.F()).find(x => !x.player && x.id !== rf && x.civ === 3 && Families.adults(x).length);
      if (f) {
        const pl = { ci: 3, fam: f.id, day: G.day, bought: Politics.circlePeople(3).map(x => x.p.id), known: true }, old = c3.rulerId;
        Math.random = () => 0.01; try { Politics.npcCoup(pl, f); } finally { Math.random = rnd; }
        ok(c3.rulerId !== old && G.people[c3.rulerId].fam === f.id, 'o golpe da família não tomou o trono');
        ok(G.people.filter(p => p.alive && p.rank === 'ruler' && p.civ === 3).length === 1, 'dois reis no mesmo reino');
      } else bad.push('sem família para o golpe');
      // golpe contra você
      Game.becomeRuler(1, 'teste'); UI.close(); Reign.monthTick();
      const g = Object.values(Families.F()).find(x => !x.player && x.civ === 1 && Families.adults(x).length) || f, h = Families.head(g);
      Politics.coupStrike({ pid: h.id, fam: g.id, kind: 'usurp' }); ok(G.coup && G.ents.some(e => !e.dead && e.tag === 'coup'), 'o golpe não atacou');
      for (const e of G.ents) if (e.tag === 'coup') e.dead = true; Politics.coupUpdate(1); ok(!G.coup && G.civs[1].ruler === 'player', 'vencer os golpistas não acabou o golpe');
      const h2 = Families.head(g) || People.create({ civ: 1, fam: g.id }); h2.jail = 0;
      Politics.coupStrike({ pid: h2.id, fam: g.id, kind: 'usurp' }); Game.playerDie('teste');
      ok(G.civs[1].ruler !== 'player', 'morrer no golpe não passou a coroa aos golpistas');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

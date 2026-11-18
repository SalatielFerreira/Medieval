// O ritmo das eras: no começo as vilas não passam do teto da era (a prosperidade para no limite) e as estradas não sobem
// de nível; a cada 100 anos começa uma nova melhoria das estradas e o teto das vilas sobe — o auge só perto dos 1000 anos.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {};
      const S = Era.S(); S.start = G.day;
      ok(Era.roadMax() === 1 && Era.defMax() === 0, 'no começo as estradas e as defesas já podiam evoluir');
      // a vila não passa do teto da era
      const v = World.villages.find(x => x && !x.ruin && !x.capital && (x.level || 1) <= 2), vi = World.villages.indexOf(v), cap = Era.villageCap(v);
      v.prosper = 139; Towns.dayTick();
      ok(v.level <= cap && v.prosper < VILLAGE_LVLS[cap], `a vila passou do teto da era (nível ${v.level}, teto ${cap})`);
      // as estradas não sobem de nível antes da era
      const before = World.roadLv ? World.roadLv.reduce((a, l) => a + (l > 1 ? 1 : 0), 0) : 0;
      for (const c of G.civs) if (c) c.treasury = 99999;
      NpcRoads.upgradeTick(); NpcRoads.travelTick();
      const after = World.roadLv.reduce((a, l) => a + (l > 1 ? 1 : 0), 0);
      ok(after === before, `as estradas subiram de nível antes da era (${before} → ${after})`);
      // 100 anos depois: nova melhoria das estradas
      S.start = G.day - 100; ok(Era.roadMax() === 2 && Era.nextRoad() === 100, 'aos 100 anos não começou a melhoria das estradas');
      Era.tick(); ok(S.age === 1, 'a nova era não foi anunciada');
      // 1000 anos: o auge
      S.start = G.day - 1000; ok(Era.villageCap(v) === VILLAGE_MAX && Era.roadMax() === 5 && Era.defMax() === 3, 'aos 1000 anos o mundo não chegou ao auge');
      v.prosper = 139; Towns.dayTick(); ok(v.level === VILLAGE_MAX, 'aos 1000 anos a vila não chegou ao auge');
      ok(/A era/.test(Reinado.village(vi)), 'a página da vila não mostra a era');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

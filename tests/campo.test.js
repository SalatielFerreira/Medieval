// Campo de batalha: sem quadrados de estrada soltos na grama, enfeites (lama, estandartes, carroças, estacas), crateras
// das catapultas, o castelo com pátio calçado e estrada até o portão, o placar novo e as ordens Atacar/Segurar/Recuar.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      const side = 1, enemy = 2; Game.becomeRuler(side, 'teste'); UI.close();
      G.civs[side].garrison = 24; G.civs[side].treasury = 4000; G.civs[enemy].garrison = 24; G.civs[enemy].treasury = 3000;
      const go = assault => { G.warCall = { side, enemy, own: true, day: G.day, shown: true, deadline: null, cfg: Object.assign(War.defaults(side, true), { cats: 2 }), assault }; War.start(); };
      // 1. campo aberto
      go(null); const B = G.place;
      ok(B && B.kind === 'battle', 'a batalha não começou');
      let roads = 0; for (let y = B.fy0; y < B.fy0 + B.h; y++) for (let x = B.fx0; x < B.fx0 + B.w; x++) if (World.tiles[World.idx(x, y)] === T.ROAD) roads++;
      ok(roads === 0, `ainda há ${roads} quadrados de estrada soltos no campo`);
      const kinds = new Set(Places.furn.map(f => f.k));
      ok(['bf_mud', 'bf_banner', 'bf_wagon', 'bf_stakes'].every(k => kinds.has(k)), 'faltam enfeites no campo: ' + [...kinds].join(','));
      for (let k = 0; k < 100; k++) Game.update(0.05); Game.render();
      ok(B.phase === 'fight', 'a batalha não passou para a luta');
      ok(!document.getElementById('bfOrders').classList.contains('hidden'), 'os botões de ordem não aparecem');
      // ordens: segurar a linha
      document.querySelector('#bfOrders [data-o="hold"]').click(); Game.update(0.05);
      const mine = War.units(side).filter(e => e.faction !== 'engine' && !e.battleKing);
      ok(B.order === 'hold' && mine.every(e => e.aggroOv <= 6 && e.home && Math.abs(e.home.x - e.bfStart.x) < 1), 'segurar a linha não segurou os soldados');
      document.querySelector('#bfOrders [data-o="fall"]').click(); Game.update(0.05);
      ok(mine.filter(e => !e.dead).every(e => e.home.x < e.bfStart.x - 5 * TILE), 'recuar não mandou o exército para trás');
      // cratera onde a pedra cai
      War.land({ x1: P.x + 200, y1: P.y, civ: enemy }); ok(Places.furn.some(f => f.k === 'bf_crater'), 'a pedra não deixou cratera');
      const cv = document.createElement('canvas'); cv.width = 1366; cv.height = 720; War.drawHud(cv.getContext('2d'), 1366);
      War.leave && War.leave(); if (G.place) Places.exit(true);
      // 2. assalto ao castelo: pátio calçado e estrada até o portão
      go('attack'); const A = G.place && G.place.assault;
      ok(A, 'o assalto não começou');
      if (A) {
        const k2 = new Set(Places.furn.map(f => f.k)); ok(k2.has('bf_yard') && k2.has('bf_road') && k2.has('cgate') && k2.has('ckeep'), 'o castelo não tem pátio, estrada ou portão');
        for (let k = 0; k < 100; k++) Game.update(0.05); Assault.hitGate(A.gateMax * 0.6, P.x, P.y); Game.render();
        Assault.hitGate(A.gateMax, P.x, P.y); Game.render(); ok(A.gateHp <= 0, 'o portão não caiu');
        War.drawHud(cv.getContext('2d'), 1366);
      }
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

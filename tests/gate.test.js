// Portão da vila: instalar na estrada da muralha, pedágio, alarme que bloqueia, e o saque vindo de fora dos muros.
'use strict';
const { open, wait } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      P.god = true; G.day = 5; G.time = NIGHT_LEN + DAYLIGHT_LEN * 0.3; P.gold = 3000; Inv.add('stone', 300); Inv.add('wood', 80); Inv.add('iron_bar', 10);
      World.villages.forEach(v => v.prosper = 999); Towns.dayTick();
      let pick = null;
      for (let vi = 0; vi < World.villages.length && !pick; vi++) { const v = World.villages[vi];
        for (let y = v.y - 18; y <= v.y + 18 && !pick; y++) for (let x = v.x - 18; x <= v.x + 18 && !pick; x++) { if (!World.inb(x, y)) continue; const i = World.idx(x, y); if (World.tiles[i] === T.ROAD && Gate.ring(x, y, v) === 16 && !World.blocker(i) && Gate.axis(x, y)) pick = { vi, x, y }; } }
      if (!pick) return { err: 'nenhuma estrada cruzando muralha' };
      const v = World.villages[pick.vi]; v.lord = 'player';
      P.x = (pick.x + 2.5) * TILE; P.y = (pick.y + 2.5) * TILE;
      Urban.start('c:vgate'); G.mouse.wx = (pick.x + 0.5) * TILE; G.mouse.wy = (pick.y + 0.5) * TILE; Urban.click(); Urban.stop();
      const g = World.blocker(World.idx(pick.x, pick.y)); if (!g || g.type !== 'vgate') return { err: 'portão não instalado' };
      const g0 = P.gold; Gate.caravanPass({ id: 1, from: (v.civ + 1) % 7, to: v.civ, path: [], pos: 0 }, g); const toll = P.gold - g0;
      const foe = (v.civ + 1) % 7; Diplo.declareWar(foe, v.civ, 'teste'); v.raid = { by: foe, until: G.day + 9 };
      P.x = v.x * TILE; P.y = v.y * TILE; G.groups = {}; Game.ambient();
      const ring = e => Math.max(Math.abs(e.x / TILE - v.x), Math.abs(e.y / TILE - v.y) * 1.25);
      const raiders = G.ents.filter(e => !e.dead && e.tag === 'raid' + pick.vi), defs = G.ents.filter(e => !e.dead && e.tag === 'def' + pick.vi);
      window.__g = g.id;
      return { toll, outside: raiders.every(e => ring(e) > 16), inside: defs.every(e => ring(e) < 17), raiders: raiders.length, defs: defs.length };
    });
    if (r.err) fails.push(r.err);
    else {
      if (r.toll <= 0) fails.push('a caravana não pagou pedágio');
      if (!r.raiders || !r.outside) fails.push('inimigos do saque não nasceram fora dos muros');
      if (!r.defs || !r.inside) fails.push('defensores não nasceram dentro dos muros');
      await wait(6000);
      const s = await page.evaluate(() => { const g = World.structs[window.__g]; return { closed: !!g.blocks, hp: Gate.data(g).hp }; });
      if (!s.closed) fails.push('o portão não fechou com os inimigos à vista');
      if (!(s.hp < 300)) fails.push('os inimigos não golpearam o portão');
    }
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

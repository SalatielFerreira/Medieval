// Construir em cima da estrada e abrir estrada embaixo de construção; o portão nos seus próprios muros (sem governar
// vila) e o botão dizendo o motivo certo quando não libera.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const a = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; P.god = true; Dialog.autoYes = true;
      ok(Urban.myVillages().length === 0 && !G.civs.some(c => c.ruler === 'player'), 'o herói já começa governando');
      // um pedaço de chão limpo perto
      let c = null;
      for (let r = 3; r < 60 && !c; r += 2) for (let k = 0; k < 24 && !c; k++) {
        const x = Math.round(P.x / TILE + Math.cos(k / 24 * 6.28) * r), y = Math.round(P.y / TILE + Math.sin(k / 24 * 6.28) * r);
        let free = true; for (let j = y - 3; j <= y + 3 && free; j++) for (let i = x - 4; i <= x + 4; i++) if (!World.inb(i, j) || !ROAD_GROUND.includes(World.tile(i, j)) || World.sgrid[World.idx(i, j)] >= 0 || Urban.foreignRealm(i, j, 1, 1) >= 0 || Urban.foreignTown(i, j)) { free = false; break; }
        if (free) c = { x, y };
      }
      ok(c, 'sem chão livre'); if (!c) return { out };
      for (let j = c.y - 3; j <= c.y + 3; j++) for (let i = c.x - 4; i <= c.x + 4; i++) World.obj[World.idx(i, j)] = 0;
      P.x = (c.x + 0.5) * TILE; P.y = (c.y + 3.9) * TILE;
      // estrada e, em cima dela, um imóvel
      for (let i = c.x - 3; i <= c.x + 3; i++) ok(!Urban.roadErr(i, c.y - 2) && Urban.buildRoad(i, c.y - 2, true) !== false, 'não abriu a estrada');
      ok(World.tiles[World.idx(c.x, c.y - 2)] === T.ROAD, 'a estrada não ficou');
      Inv.add('wood', 200); Inv.add('stone', 200);
      const be = Game.canBuild('wall_stone', c.x, c.y - 2); ok(!be || !/estrada/.test(be), 'ainda recusa construir sobre a estrada: ' + be);
      const bk = Object.keys(BUILDINGS).find(k => BUILDINGS[k].w === 1 && BUILDINGS[k].h === 1 && k !== 'wall_stone' && k !== 'wall_wood' && !BUILDINGS[k].coast);
      const e1 = Game.canBuild(bk, c.x - 1, c.y - 2); ok(!e1, `${bk} não pode sobre a estrada: ${e1}`);
      // estrada embaixo de uma construção
      const s = World.addStruct('wall_stone', c.x + 2, c.y, 1, 1, 'player');
      ok(!Urban.roadErr(c.x + 2, c.y), 'não abre estrada embaixo da construção: ' + Urban.roadErr(c.x + 2, c.y));
      Urban.buildRoad(c.x + 2, c.y, true); ok(World.tiles[World.idx(c.x + 2, c.y)] === T.ROAD && !s.removed && World.blocker(World.idx(c.x + 2, c.y)) === s, 'a estrada embaixo da construção não ficou (ou a construção sumiu)');
      ok(!Urban.unroadErr(c.x + 2, c.y), 'não tira estrada embaixo da construção');
      World.removeStruct(s);
      // portão nos seus muros: muro de c.x-3 a c.x+3 na linha c.y+1, com vão no meio
      Inv.add('iron_bar', 5); Inv.count('stone') < 12 && Inv.add('stone', 20);
      let info = Urban.info('c:vgate'); ok(!info.can && info.lock, 'sem muro, o portão deveria travar dizendo o motivo');
      for (let i = c.x - 3; i <= c.x + 3; i++) if (i !== c.x) World.addStruct('wall_stone', i, c.y + 1, 1, 1, 'player');
      info = Urban.info('c:vgate'); ok(info.can, 'com material e muro seu, o portão continua travado');
      const nWood = Inv.count('wood');
      Urban.mode = 'c:vgate'; G.mouse.wx = (c.x + 0.5) * TILE; G.mouse.wy = (c.y + 1.5) * TILE; Urban.click();
      const g = World.blocker(World.idx(c.x, c.y + 1));
      ok(g && g.type === 'vgate' && g.pgate, 'o portão não foi posto no muro: ' + (g && g.type));
      ok(Inv.count('wood') === nWood - CIVIC.vgate.cost.wood, 'o portão não cobrou o material');
      ok(g && Gate.mine(g) && !Urban.movable(g), 'o portão não ficou seu');
      Game.save(null);
      return { out, slot: G.slot, at: { x: c.x, y: c.y + 1 } };
    });
    fails.push(...a.out);
    if (a.slot) {
      await page.evaluate(s => Game.load(s), a.slot);
      await page.waitForFunction(() => G.state === 'play', { timeout: 60000 });
      const b = await page.evaluate(at => { const g = World.blocker(World.idx(at.x, at.y)); return !!(g && g.type === 'vgate' && g.pgate); }, a.at);
      if (!b) fails.push('depois de carregar, o portão não é mais seu');
    }
    if (errors.length) fails.push('erros: ' + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
  return fails;
};

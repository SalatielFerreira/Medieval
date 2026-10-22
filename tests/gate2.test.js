// Portão em qualquer lugar entre muros: longe das vilas, entre os seus muros de pedra, quem governa um reino instala o
// portão; ele fica ligado à vila mais próxima do reino, você manda nele, e ele continua lá depois de salvar e carregar.
// Sem muro dos lados não deixa; quem não governa nada também não.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const a = await page.evaluate(() => {
      // um trecho de campo limpo, bem longe das vilas
      const clear = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -3; i <= 3; i++) { const k = World.idx(x + i, y + j), t = World.tiles[k]; if (!TINFO[t].walk || World.isWater(t) || t === T.ROAD || t === T.BRIDGE || World.obj[k] || World.blocker(k)) return false; } return true; };
      let sp = null;
      for (let y = 30; y < WORLD_H - 30 && !sp; y += 2) for (let x = 30; x < WORLD_W - 30 && !sp; x += 2)
        if (World.villages.every(v => U.dist(v.x, v.y, x, y) > 35) && clear(x, y)) sp = { x, y };
      if (!sp) return { sp };
      const before = Gate.placeErr(sp.x, sp.y); // sem governar nada
      P.god = true; Game.becomeRuler(0, 'Teste.');
      const noWall = Gate.placeErr(sp.x, sp.y); // sem muro dos lados
      for (const dx of [-3, -2, -1, 1, 2, 3]) World.addStruct('wall_stone', sp.x + dx, sp.y, 1, 1, 'player', { built: true });
      const between = Gate.placeErr(sp.x, sp.y);
      Inv.add('stone', 50); Inv.add('wood', 50); Inv.add('iron_bar', 10);
      P.x = (sp.x + 0.5) * TILE; P.y = (sp.y + 4) * TILE;
      Urban.start('c:vgate'); G.mouse.wx = (sp.x + 0.5) * TILE; G.mouse.wy = (sp.y + 0.5) * TILE; Urban.click();
      const g = World.structs.find(s => s && !s.removed && s.type === 'vgate' && s.x === sp.x && s.y === sp.y);
      return { sp, before, noWall, between, made: !!g, vi: g ? g.village : null, civOk: g ? World.villages[g.village].civ === 0 : false, mine: g ? Gate.mine(g) : false };
    });
    if (!a.sp) { fails.push('não achou campo limpo longe das vilas'); return fails; }
    if (!a.before) fails.push('deixou pôr portão sem governar vila nem reino');
    if (!a.noWall) fails.push('deixou pôr portão sem muro dos lados');
    if (a.between) fails.push('não deixou pôr o portão entre os muros: ' + a.between);
    if (!a.made) fails.push('o portão não foi instalado');
    else {
      if (!a.civOk) fails.push('o portão ficou ligado a uma vila de outro reino');
      if (!a.mine) fails.push('você não manda no portão que instalou');
      await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
      await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
      const ok = await page.evaluate(sp => World.structs.some(s => s && !s.removed && s.type === 'vgate' && s.x === sp.x && s.y === sp.y), a.sp);
      if (!ok) fails.push('o portão sumiu depois de carregar');
    }
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

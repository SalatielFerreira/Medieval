// Estradas dos prédios do castelo: arena, catedral, cemitério, banco e prisão com estrada em volta (ligada à estrada
// principal); o porto com uma estrada só, da porta até a estrada; e as estradas voltam ao carregar.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      const ringOf = s => { let n = 0, t = 0; for (let j = s.y - 1; j <= s.y + s.h; j++) for (let i = s.x - 1; i <= s.x + s.w; i++) { if (j !== s.y - 1 && j !== s.y + s.h && i !== s.x - 1 && i !== s.x + s.w) continue; if (!World.inb(i, j)) continue; t++; if (World.tiles[World.idx(i, j)] === T.ROAD) n++; } return n / Math.max(1, t); };
      for (const s of World.structs.filter(s => s && !s.removed && CROAD_RING.includes(s.type) && typeof s.owner === 'number' && World.capitals[s.owner] && U.dist(s.x, s.y, World.capitals[s.owner].x, World.capitals[s.owner].y) <= 40)) ok(ringOf(s) >= 0.6, `${s.type} de ${CIV_DEFS[s.owner].short} sem estrada em volta (${Math.round(ringOf(s) * 100)}%)`);
      for (const s of World.structs.filter(s => s && !s.removed && s.type === 'port' && typeof s.owner === 'number')) {
        ok(ringOf(s) <= 0.35, `o porto de ${CIV_DEFS[s.owner].short} ganhou estrada em volta`);
        { let any = false; for (let j = s.y - 2; j <= s.y + s.h + 1; j++) for (let i = s.x - 2; i <= s.x + s.w + 1; i++) if (World.inb(i, j) && World.tiles[World.idx(i, j)] === T.ROAD) any = true; ok(any, `o porto de ${CIV_DEFS[s.owner].short} não tem estrada`); }
      }
      window._roads = Object.keys(Urban.E().roads).length;
      return bad;
    });
    fails.push(...r);
    await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const n = await page.evaluate(() => { const s = World.structs.find(x => x && x.type === 'arena' && x.owner === 0); return World.tiles[World.idx(s.x - 1, s.y - 1)] === T.ROAD || World.tiles[World.idx(s.x, s.y - 1)] === T.ROAD; });
    if (!n) fails.push('a estrada em volta da arena sumiu ao carregar');
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

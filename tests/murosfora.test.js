// Terra firme no continente (só o mar, o lago maior e as poças do pântano) e quem vem atacar nasce fora dos muros:
// dentro de um recinto todo murado, com portão, assassinos e bandidos aparecem do lado de fora.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const out = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; P.god = true;
      // ---- água: fora o mar e o pântano, só um lago
      const W = WORLD_W, H = WORLD_H, N = W * H, t = World.tiles, wet = i => t[i] === T.WATER || t[i] === T.DEEP || t[i] === T.BRIDGE;
      const sea = new Uint8Array(N), q = [];
      for (let i = 0; i < N; i++) { const x = i % W, y = (i / W) | 0; if (t[i] === T.DEEP && (!x || !y || x === W - 1 || y === H - 1)) { sea[i] = 1; q.push(i); } }
      const nb = (c, f) => { const x = c % W, y = (c / W) | 0; for (const [dx, dy] of DIRS4) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) f(ny * W + nx); } };
      for (let h = 0; h < q.length; h++) nb(q[h], j => { if (!sea[j] && wet(j) && (t[j] === T.DEEP || World.elev[j] < 0.335)) { sea[j] = 1; q.push(j); } });
      const swampy = i => { const x = i % W, y = (i / W) | 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (World.tile(x + dx, y + dy) === T.SWAMP) return true; return false; };
      const seen = new Uint8Array(N), comps = [];
      for (let i = 0; i < N; i++) {
        if (seen[i] || !wet(i) || sea[i]) continue;
        const L = [i]; seen[i] = 1;
        for (let k = 0; k < L.length; k++) nb(L[k], j => { if (!seen[j] && wet(j) && !sea[j]) { seen[j] = 1; L.push(j); } });
        if (!L.some(swampy)) comps.push(L.length); // as poças do pântano ficam
      }
      comps.sort((a, b) => b - a);
      ok(comps.filter(n => n >= 6).length <= 1, 'ainda há lagos/rios no continente: ' + comps.slice(0, 6).join(', '));
      // ---- recinto murado
      let c = null;
      for (let r = 4; r < 120 && !c; r += 3) for (let k = 0; k < 24 && !c; k++) {
        const x = Math.round(P.x / TILE + Math.cos(k / 24 * 6.28) * r), y = Math.round(P.y / TILE + Math.sin(k / 24 * 6.28) * r);
        let free = true; for (let j = y - 8; j <= y + 8 && free; j++) for (let i = x - 8; i <= x + 8; i++) if (!World.inb(i, j) || !TINFO[World.tile(i, j)].walk || World.sgrid[World.idx(i, j)] >= 0) { free = false; break; }
        if (free) { c = { x, y }; for (let j = y - 8; j <= y + 8; j++) for (let i = x - 8; i <= x + 8; i++) World.obj[World.idx(i, j)] = 0; } // sem árvores no caminho
      }
      ok(c, 'não achou lugar livre para murar'); if (!c) return out;
      const R = 5, walls = [];
      let gate = null;
      for (let j = c.y - R; j <= c.y + R; j++) for (let i = c.x - R; i <= c.x + R; i++) {
        if (Math.max(Math.abs(i - c.x), Math.abs(j - c.y)) !== R) continue;
        if (i === c.x + R && j === c.y) gate = World.addStruct('vgate', i, j, 1, 1, 'player');
        else walls.push(World.addStruct('wall_stone', i, j, 1, 1, 'player'));
      }
      P.x = (c.x + 0.5) * TILE; P.y = (c.y + 0.6) * TILE; Muros._c = null;
      const Rg = Muros.region(); ok(Rg && Rg.gates.includes(gate), 'o recinto murado com portão não foi reconhecido');
      const a = Game.spawn('bandit', P.x + 40, P.y, { tag: 'assassin', leash: 40 });
      ok(!Muros.inside(Rg, a.x, a.y), 'o assassino nasceu dentro dos muros');
      ok(U.dist(a.x, a.y, P.x, P.y) > R * TILE, 'o assassino ficou perto demais');
      const b = Game.spawn('bandit', P.x - 30, P.y + 20, { leash: 20 });
      ok(!Muros.inside(Rg, b.x, b.y), 'o bandido nasceu dentro dos muros');
      const cow = Game.spawn('deer', P.x + 20, P.y, {}); ok(Muros.inside(Rg, cow.x, cow.y), 'um bicho comum foi tirado de dentro');
      a.dead = b.dead = cow.dead = true;
      // muro com um buraco: o lugar é aberto e ninguém é mudado
      const w0 = walls.find(w => w.x === c.x - R && w.y === c.y); World.removeStruct ? World.removeStruct(w0) : (w0.removed = true, World.sgrid[World.idx(w0.x, w0.y)] = -1);
      if (World.sgrid[World.idx(w0.x, w0.y)] >= 0 && World.structs[World.sgrid[World.idx(w0.x, w0.y)]] === w0) World.sgrid[World.idx(w0.x, w0.y)] = -1;
      Muros._c = null; ok(!Muros.region(), 'muro com buraco contou como fechado');
      const d = Game.spawn('bandit', P.x + 30, P.y, { tag: 'assassin', leash: 40 }); ok(U.dist(d.x, d.y, P.x + 30, P.y) < 2, 'sem muro fechado, o assassino foi mudado de lugar'); d.dead = true;
      return out;
    });
    fails.push(...out);
    if (errors.length) fails.push('erros: ' + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
  return fails;
};

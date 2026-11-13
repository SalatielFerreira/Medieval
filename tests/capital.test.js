// A capital de cada reino é uma vila ao lado do castelo; o rei pode mudar a capital; a gente importante se muda para lá;
// e as estradas entre os reinos ficam ligadas.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const out = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true;
      const live = G.civs.filter(c => c && !c.dead && World.capitals[c.id]);
      for (const c of live) { const v = Capital.of(c.id); ok(v && v.capital && U.dist(v.x, v.y, World.capitals[c.id].x, World.capitals[c.id].y) < 50, `${CIV_DEFS[c.id].short} sem a vila da capital perto do castelo`); }
      ok(World.villages.filter(v => v && !v.free).length >= live.length * 2, 'o jogo não começa com duas vilas por reino');
      // estradas: todas as capitais e vilas na mesma malha
      const W = WORLD_W, road = k => World.tiles[k] === T.ROAD || World.tiles[k] === T.BRIDGE, comp = new Int32Array(W * WORLD_H).fill(-1); let id = 0;
      for (let k = 0; k < comp.length; k++) { if (!road(k) || comp[k] >= 0) continue; const q = [k]; comp[k] = id; for (let h = 0; h < q.length; h++) { const x = q[h] % W, y = (q[h] / W) | 0; for (const [dx, dy] of DIRS4) { if (!World.inb(x + dx, y + dy)) continue; const n = World.idx(x + dx, y + dy); if (road(n) && comp[n] < 0) { comp[n] = id; q.push(n); } } } id++; }
      const near = (x, y) => { for (let r = 0; r < 10; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (!World.inb(x + i, y + j)) continue; const k = World.idx(x + i, y + j); if (comp[k] >= 0) return comp[k]; } return -1; };
      const ids = new Set(World.villages.filter(v => v && !v.ruin && !v.free).map(v => near(v.x, v.y)));
      ok(ids.size === 1, `as vilas estão em ${ids.size} malhas de estrada separadas`);
      // mudar a capital (como rei)
      const ci = live[0].id; Game.becomeRuler(ci, 'teste'); UI.close();
      const other = World.villages.findIndex(v => v && !v.free && v.civ === ci && !v.capital);
      if (other >= 0) { UI.act('capmove', { c: ci, v: other }); ok(G.civs[ci].capVi === other && Capital.of(ci) === World.villages[other], 'o rei não mudou a capital'); }
      // gente importante se muda para a capital
      const cap = Capital.of(ci), cvi = World.villages.indexOf(cap), src = World.villages.findIndex((v, i) => v && !v.free && v.civ === ci && i !== cvi);
      if (src >= 0) {
        const k = People.create({ rank: 'knight', civ: ci, home: { type: 'village', idx: src }, age: 35 }); Families.attach && Families.attach(k);
        const r0 = Math.random; Math.random = () => 0.01; for (let m = 0; m < 4 && k.home.idx !== cvi; m++) Capital.monthTick(); Math.random = r0;
        ok(k.home.idx === cvi, 'o cavaleiro não se mudou para a capital');
      }
      return out;
    });
    fails.push(...out);
    if (errors.length) fails.push('erros: ' + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
  return fails;
};

// Guarnição espalhada (15 soldados, abaixo do limite de 18): os soldados do reino ficam no castelo, nas vilas do reino (espalhados por elas) e nas estradas;
// a divisão soma a guarnição inteira; ao recrutar, o aviso diz para onde o soldado foi.
'use strict';
const { open } = require('./harness');
const wait = ms => new Promise(r => setTimeout(r, ms));
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const a = await page.evaluate(() => {
      P.god = true; Game.becomeRuler(0, 'Teste.');
      const c = G.civs[0]; c.garrison = 15; c.treasury = 1000; c.stock.wheat = 100;
      const pl = Garrison.plan(0), vs = Garrison.villagesOf(0);
      const sum = pl.cap + pl.patrol + Object.values(pl.v).reduce((x, y) => x + y, 0);
      const msgs = []; const m0 = UI.msg; UI.msg = (t, ...r) => { msgs.push(t); return m0.call(UI, t, ...r); };
      Game.kRecruit(0); UI.msg = m0;
      // vai até a vila com mais soldados
      const vi = +Object.keys(pl.v).sort((p, q) => pl.v[q] - pl.v[p])[0], v = World.villages[vi];
      for (const e of G.ents) if (e.tag && /^(vg|cap|gp)/.test(e.tag)) e.dead = true;
      G.groups = {};
      P.x = (v.x + 0.5) * TILE; P.y = (v.y + 3) * TILE;
      return { pl, sum, villages: vs.length, recruitMsg: msgs.find(t => t.startsWith('🪖')) || null, vi, want: Garrison.plan(0).v[vi] };
    });
    if (a.sum !== 15 && a.pl.cap < 14) fails.push(`a divisão soma ${a.sum} soldados (a guarnição tem 15)`);
    if (a.villages && !Object.values(a.pl.v).some(n => n > 0)) fails.push('nenhum soldado foi para as vilas do reino');
    if (!a.recruitMsg) fails.push('recrutar não avisou para onde o soldado foi');
    await wait(2500);
    const b = await page.evaluate(vi => {
      const v = World.villages[vi], gs = G.ents.filter(e => !e.dead && e.tag === 'vg' + vi);
      const far = gs.filter(e => U.dist(e.x / TILE, e.y / TILE, v.x, v.y) > 4).length;
      // agora no castelo
      const cp = World.capitals[0]; P.x = (cp.x + 0.5) * TILE; P.y = (cp.y + 12) * TILE;
      return { n: gs.length, far };
    }, a.vi);
    if (b.n < Math.min(2, a.want)) fails.push(`na vila apareceram ${b.n} soldados (a divisão manda ${a.want})`);
    if (b.n >= 3 && b.far < 1) fails.push('os soldados da vila ficaram todos amontoados no centro');
    await wait(2500);
    const c = await page.evaluate(() => {
      const caps = G.ents.filter(e => !e.dead && e.tag === 'cap0').length;
      // e numa estrada do reino, longe de tudo
      let road = null;
      for (let i = 0; i < World.tiles.length && !road; i += 7) {
        if (World.tiles[i] !== T.ROAD || World.terr[i] !== 0) continue;
        const x = i % WORLD_W, y = Math.floor(i / WORLD_W), cp = World.capitals[0];
        if (U.dist(x, y, cp.x, cp.y) > 30 && World.villages.every(v => !v || U.dist(x, y, v.x, v.y) > VILLAGE_R + 8)) road = { x, y };
      }
      if (road) { P.x = (road.x + 0.5) * TILE; P.y = (road.y + 0.5) * TILE; }
      return { caps, road: !!road, plan: Garrison.plan(0) };
    });
    if (c.caps < Math.min(3, c.plan.cap)) fails.push(`no castelo apareceram ${c.caps} soldados (a divisão manda ${c.plan.cap})`);
    if (c.road && c.plan.patrol) {
      await wait(2500);
      const p = await page.evaluate(() => G.ents.filter(e => !e.dead && e.tag === 'gp0').length);
      if (!p) fails.push('ninguém patrulha as estradas do reino');
    }
    // os seus guardas: 6 numa vila (cada um num canto) e 6 no castelo (castelo e vilas do reino)
    const g = await page.evaluate(() => {
      const vs = Garrison.villagesOf(0); if (!vs.length) return null;
      const mk = () => { const p = Game.newMercenary(0); for (const e of G.ents) if (e.npc === p) e.dead = true; G.spawned.delete(p.id); return p; };
      const vpost = { kind: 'village', vi: vs[0].vi, mine: true }, cpost = { kind: 'castle', civ: 0, mine: true };
      World.villages[vs[0].vi].lord = 'player';
      const vg = [], cg = [];
      for (let i = 0; i < 6; i++) { const p = mk(); p.post = Object.assign({}, vpost); vg.push(p); }
      for (let i = 0; i < 6; i++) { const p = mk(); p.post = Object.assign({}, cpost); cg.push(p); }
      const v = World.villages[vs[0].vi], vSlots = vg.map(p => Guards.slot(p)), cSlots = cg.map(p => Guards.slot(p));
      const distinct = L => new Set(L.map(q => Math.round(q.x) + ',' + Math.round(q.y))).size;
      const near = (q, x, y, r) => U.dist(q.x, q.y, x, y) <= r;
      const cp = World.capitals[0];
      return { vDistinct: distinct(vSlots), vFar: vSlots.filter(q => !near(q, v.x, v.y, 4)).length, cDistinct: distinct(cSlots),
        cInVillages: cSlots.filter(q => vs.some(x => near(q, x.v.x, x.v.y, VILLAGE_R))).length, cAtCastle: cSlots.filter(q => near(q, cp.x, cp.y, 12)).length, villages: vs.length };
    });
    if (g) {
      if (g.vDistinct < 6) fails.push(`os 6 guardas da vila ficaram em só ${g.vDistinct} pontos`);
      if (g.vFar < 3) fails.push('os guardas da vila ficaram amontoados no centro');
      if (g.cDistinct < 6) fails.push(`os 6 guardas do castelo ficaram em só ${g.cDistinct} pontos`);
      if (g.villages && !g.cInVillages) fails.push('os guardas mandados ao castelo não foram para as vilas do reino');
      if (!g.cAtCastle) fails.push('nenhum guarda mandado ao castelo ficou no castelo');
    }
    // nada de amontoado na frente do castelo: com 30 cavaleiros e a guarnição cheia, poucos ficam perto do portão
    await page.evaluate(() => {
      for (const e of G.ents) if (!e.dead && (e.kind === 'guard' || (e.npc && e.npc.rank === 'knight'))) { e.dead = true; if (e.npc) G.spawned.delete(e.npc.id); }
      G.groups = {}; G.civs[0].garrison = 18;
      let made = 0; for (const p of G.people) if (made < 30 && p.alive && p.age >= 20 && p.age < 50 && !p.kin && !p.capanga && ['peasant', 'soldier', 'mercenary'].includes(p.rank)) { p.rank = 'knight'; p.home = { type: 'castle', civ: 0 }; made++; }
      const d = World.capitals[0].door; P.x = (d.x + 0.5) * TILE; P.y = (d.y + 4) * TILE;
    });
    await wait(3000);
    const crowd = await page.evaluate(() => { const d = World.capitals[0].door; return G.ents.filter(e => !e.dead && (e.kind === 'guard' || (e.npc && e.npc.rank === 'knight')) && U.dist(e.x / TILE, e.y / TILE, d.x, d.y + 2) < 6).length; });
    if (crowd > 8) fails.push(`${crowd} soldados e cavaleiros amontoados na frente do portão do castelo`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

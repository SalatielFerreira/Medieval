// Desempenho: com 60 moradores andando e virando para os dois lados, depois de aquecer, nenhuma figura é redesenhada do
// zero a cada quadro (a memória de figuras não pode ficar descartando e refazendo) e as bandeiras também ficam prontas.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(async () => {
      const cp = World.capitals[0]; P.x = (cp.door.x + 0.5) * TILE; P.y = (cp.door.y + 6) * TILE;
      await new Promise(r => setTimeout(r, 1500));
      for (const e of G.ents) if (e.kind === 'villager' || e.kind === 'guard') e.dead = true;
      const ppl = G.people.filter(p => p.alive && !p.kin && p.age > 16).slice(0, 60);
      ppl.forEach((p, i) => { const a = i / 60 * 6.283, r = 3 + (i % 6); Game.spawn('villager', P.x + Math.cos(a) * r * TILE, P.y + Math.sin(a) * r * TILE * 0.6, { civ: 0, npc: p, leash: 8 }); });
      G.paused = true;
      let bodies = 0; const hb0 = humanBody; humanBody = function (...a) { bodies++; return hb0.apply(this, a); };
      const frame = k => { for (const e of G.ents) if (e.kind === 'villager') { e.anim = (e.anim || 0) + 0.05; e.moving = true; e.dir = k % 40 < 20 ? 1 : -1; } Game.render(); };
      for (let k = 0; k < 200; k++) frame(k); // aquece: todas as figuras ficam prontas
      bodies = 0; const flags0 = (Heraldry.flagCache || new Map()).size;
      const t0 = performance.now(); for (let k = 200; k < 320; k++) frame(k); const ms = (performance.now() - t0) / 120;
      humanBody = hb0; G.paused = false;
      return { bodies, flagsNew: (Heraldry.flagCache || new Map()).size - flags0, ms: +ms.toFixed(1) };
    });
    if (r.bodies > 10) fails.push(`${r.bodies} figuras redesenhadas do zero em 120 quadros (a memória de figuras está descartando e refazendo)`);
    if (r.flagsNew > 0) fails.push(`${r.flagsNew} bandeiras redesenhadas depois de prontas`);
    console.log(`    desenho: ${r.ms} ms por quadro com 60 moradores andando`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

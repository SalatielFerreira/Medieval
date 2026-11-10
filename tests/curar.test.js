// Depois da briga, o morador ferido se cuida: vai à Casa de Curas mais perto (e é tratado na porta) ou, sem uma
// por perto, para e come; enquanto apanha, não se distrai.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const out = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; P.god = true;
      const calm = () => { for (const e of G.ents) if (!e.dead && !e.npc && ['bandit', 'wild'].includes(fac(e))) e.dead = true; for (const e of G.ents) if (!e.dead && e.npc && (e.npc.hostile || e.npc.hit || e.npc.band)) e.dead = true; };
      const run = (sec, f) => { for (let k = 0; k < sec * 20; k++) { G.realTime += 0.05; if (!(k % 10)) calm(); Game.update(0.05); if (f && f()) return true; } return false; };
      const v = World.villages.find(x => x && !x.ruin); P.x = v.x * TILE; P.y = (v.y + 3) * TILE; G.time = 0.45; run(2);
      const vs = G.ents.filter(e => e.kind === 'villager' && e.npc && Curar.ok(e));
      ok(vs.length >= 2, 'poucos moradores por perto: ' + vs.length); if (vs.length < 2) return out;
      // sem casa de curas por perto: come
      for (const s of World.structs) if (s && Curar.CLINICS.includes(s.type)) s.removed = true;
      const a = vs[0]; a.hp = a.maxHp * 0.3; a.hitT = G.realTime;
      run(2); ok(!a.heal, 'cuidou de si no meio da briga');
      ok(run(8, () => a.heal && a.heal.mode === 'eat'), 'sem casa de curas, o ferido não parou para comer: ' + JSON.stringify({ ok: Curar.ok(a), dead: a.dead, sl: a.sleeping, tg: a.target && { k: a.target === P ? 'P' : a.target.kind, tag: a.target.tag, d: Math.round(U.dist(a.x, a.y, a.target.x, a.target.y)), dead: a.target.dead, f: a.target.faction, has: G.ents.includes(a.target) }, room: a.inRoom, pn: a.placeNpc, kind: a.kind, hitT: a.hitT, hp: Math.round(a.hp), eatCd: a.eatCd, rt: G.realTime, has: G.ents.includes(a) }));
      const h0 = a.hp; run(4); ok(a.hp > h0 + a.maxHp * 0.25, `comer não curou (${Math.round(h0)} → ${Math.round(a.hp)})`);
      // com casa de curas perto: vai até ela e é tratado
      const b = vs[1], tx = Math.round(b.x / TILE) + 6, ty = Math.round(b.y / TILE);
      World.freeArea(tx, ty, 2, 2); const cl = World.addStruct('vclinic', tx, ty, 2, 2, 0, { village: 0 });
      b.hp = b.maxHp * 0.3; b.hitT = G.realTime - 10; b.target = null;
      ok(run(3, () => b.heal && b.heal.mode === 'go'), 'o ferido não foi para a casa de curas: ' + JSON.stringify(b.heal && b.heal.mode));
      ok(run(30, () => b.heal && b.heal.mode === 'treat'), 'não chegou à casa de curas (a ' + Math.round(U.dist(b.x, b.y, (tx + 1) * TILE, (ty + 2.6) * TILE)) + ' px)');
      ok(run(10, () => b.hp >= b.maxHp), 'o tratamento não curou: ' + Math.round(b.hp) + '/' + b.maxHp);
      ok(!b.heal, 'curado, não voltou à rotina');
      // atacado de novo no caminho: para de ir
      b.hp = b.maxHp * 0.4; b.hitT = G.realTime - 10; run(2, () => b.heal);
      b.hitT = G.realTime; run(0.2); ok(!b.heal, 'apanhando, continuou indo se curar');
      // inimigos não se curam assim
      const c = vs.find(e => e !== a && e !== b) || a; c.npc.hostile = true; ok(!Curar.ok(c), 'inimigo também se cura'); c.npc.hostile = false;
      // desenha o sinal sem erro
      const ctx = document.querySelector('canvas').getContext('2d'); b.heal = { mode: 'treat', s: cl, t: 5 }; b.draw(ctx, b.x - 100, b.y - 100); b.heal = null;
      return out;
    });
    fails.push(...out);
    if (errors.length) fails.push('erros: ' + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
  return fails;
};

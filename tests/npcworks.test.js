// Obras dos governadores da IA: as vilas da IA erguem as Obras nas vilas sozinhas, cada uma do seu jeito, conforme o
// nível, o caixa da vila e o tesouro do reino; onde você governa, a IA não mexe.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Game.note = () => {};
      const npcV = World.villages.map((v, vi) => vi).filter(vi => NpcWorks.ruler(World.villages[vi]));
      ok(npcV.length >= 3, 'poucas vilas da IA: ' + npcV.length);
      // a sua vila: nada
      const mine = npcV[0], vm = World.villages[mine]; vm.chief = 'player';
      ok(!NpcWorks.ruler(vm), 'a IA ainda manda na vila que você governa');
      const others = npcV.slice(1), before = World.structs.length;
      // você no modo de obras: as obras da IA não contam como feitos seus
      Urban.mode = 'c:vpost'; const deeds = []; const ad0 = Politics.addDeed; Politics.addDeed = (vi, who, n, why) => { deeds.push(who); return ad0.call(Politics, vi, who, n, why); };
      for (let m = 0; m < 40; m++) for (const vi of others) { const st = NpcWorks.state(vi, NpcWorks.ruler(World.villages[vi])); st.wait = 0; st.fund = Math.max(st.fund, 400); NpcWorks.village(vi); }
      Urban.mode = null; Politics.addDeed = ad0;
      ok(!deeds.includes('player'), 'obra da IA virou feito seu');
      ok(!NpcWorks.S()[mine], 'a IA pensou em obras na sua vila');
      const S = NpcWorks.S(), sets = [];
      for (const vi of others) {
        const v = World.villages[vi], st = S[vi];
        ok(st && st.built.length > 0, `${v.name} não construiu nada`);
        ok(st.built.length <= NpcWorks.limit(v), `${v.name} passou do limite de obras`);
        sets.push(st.built.slice().sort().join());
        const have = NpcWorks.have(vi);
        for (const t of st.built) {
          ok(!NW_SKIP.includes(t) && CIVIC[t], `${v.name}: obra proibida ${t}`);
          if (NW_MINLVL[t]) ok((v.level || 1) >= NW_MINLVL[t], `${v.name} (nível ${v.level}) ergueu ${t}`);
          for (const q of NW_REQ[t] || []) ok(have[q], `${v.name} ergueu ${t} sem ${q}`);
        }
        ok(new Set(st.built.filter(t => t !== 'field')).size === st.built.filter(t => t !== 'field').length, `${v.name} repetiu obra`);
      }
      ok(new Set(sets).size > 1, 'todas as vilas fizeram as mesmas obras');
      // cada obra nova: no chão, sem nada embaixo, fora da estrada e guardada no jogo salvo
      const E = Urban.E(), added = World.structs.slice(before).filter(s => s && !s.removed && CIVIC[s.type] && others.includes(s.village));
      ok(added.length > 0, 'nenhuma obra nova no mapa');
      for (const s of added) {
        for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) { const k = World.idx(i, j); if (World.sgrid[k] !== s.id) { bad.push(`${s.type} encavalada em outra construção`); break; } if (World.tiles[k] === T.ROAD) { bad.push(`${s.type} em cima da estrada`); break; } }
        ok(E.added.some(a => a.type === s.type && a.x === s.x && a.y === s.y && a.village === s.village), `${s.type} não foi guardada no jogo salvo`);
        ok(TownPlan.inBox(World.villages[s.village], s.x, s.y), `${s.type} fora do traçado da vila`);
      }
      // vila nível 1: nada caro demais
      const t1 = NpcWorks.types().filter(t => NpcWorks.allowed(t, { level: 1, x: 0, y: 0 }, { geo: { water: true, rock: true } }, {}));
      ok(t1.length > 10 && !t1.includes('vcathedral') && !t1.includes('vuniv') && !t1.includes('vthermae'), 'vila nível 1 pode erguer obra grande');
      // seu reino: o governador da IA usa só o caixa da vila (nada do seu tesouro)
      const ci = World.villages[others[0]].civ; Game.becomeRuler(ci, 'teste'); UI.close();
      const vk = World.villages.findIndex(v => v && !v.free && v.civ === ci && v.chief !== undefined && v.chief !== 'player' && G.people[v.chief] && G.people[v.chief].alive);
      if (vk >= 0) { const c = G.civs[ci]; c.treasury = 5000; NpcWorks.village(vk); ok(c.treasury === 5000, 'o governador tirou dinheiro do seu tesouro'); }
      // reino da IA rico manda verba; pobre, não
      const vn = World.villages.findIndex(v => v && !v.free && G.civs[v.civ].ruler === 'npc' && NpcWorks.ruler(v));
      const R = NpcWorks.realm(World.villages[vn]); R.c.treasury = 3000; const g1 = NpcWorks.grant(World.villages[vn], R); R.c.treasury = 50; const g2 = NpcWorks.grant(World.villages[vn], R);
      ok(g1 > 0 && g2 === 0, `verba do rei: rico ${g1}, pobre ${g2}`);
      // o mês do jogo chama as obras da IA sem erro
      Lifesim.monthTick(); while (Perf.queue.length) Perf.queue.shift()();
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

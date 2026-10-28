// Teste longo: 10 anos de jogo (120 meses) com o mês em fatias, como no jogo de verdade, e uns sustos no caminho (reis e
// governadores que morrem de repente, tesouro que some). Todo mês as regras que nunca podem quebrar são conferidas:
//  • um só rei vivo por reino (e o reino da IA sempre tem rei);
//  • nenhum governador morto no cargo;
//  • tesouro dos reinos e ouro do herói nunca negativos (nem NaN);
//  • a fila do mês esvazia, e nenhum quadro passa de 40 ms.
// A cada 40 meses o jogo é salvo e carregado, e tudo tem que voltar igual.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  // (ao carregar, cada vila sem padre e cada loja sem responsável ganham um, e o governador interino — o não eleito — é
  // escolhido de novo: aqui isso é feito antes de comparar, nos dois lados)
  const sig = () => page.evaluate(() => (Faith.ensurePriests(), Shops.ensure(), Families.refresh(), JSON.stringify({
    day: G.day, gold: P.gold, people: G.people.filter(p => p.alive).length, villages: World.villages.length, founded: G.founded.length,
    civs: G.civs.map(c => [c.ruler, c.rulerId, Math.round(c.treasury), !!c.dead]),
    chiefs: World.villages.map(v => [v.chief === undefined ? null : v.chief, !!v.free, v.lord || null]),
    bank: typeof Bank !== 'undefined' ? G.civs.map(c => Bank.has(c.id)) : [],
    diplo: typeof Pacts !== 'undefined' ? Pacts.sig() : null, bolsa: JSON.stringify(Bolsa.X().own) + Math.round(Bolsa.X().fund), clima: G.civs.map(c => Clima.kind(c.id)).join(),
  })));
  try {
    for (let part = 0; part < 3; part++) {
      const r = await page.evaluate(async part => {
        const bad = [], ok = (c, m) => { if (!c && !bad.includes(m)) bad.push(m); };
        UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
        // aceitar sozinho o pedido de ajuda na guerra abriria a janela do conselho no meio do mês (no jogo, só no seu clique)
        UI.showWarCouncil = () => {};
        let worst = 0, worstAt = '';
        Perf.stats = {}; let frame = []; const rt = Perf.runTask.bind(Perf); Perf.runTask = function (t) { const t0 = performance.now(); rt(t); frame.push(t.label + ' ' + (performance.now() - t0).toFixed(0)); };
        for (let m = 0; m < 40; m++) {
          // sustos: um rei ou um governador morre de repente, um tesouro some
          const rnd = Math.random();
          if (m === 0 && part === 0) { P.gold += 5000; Bolsa.buy('sal', 10); Bolsa.fundIn(500); }
          if (rnd < 0.08) { const c = U.pick(G.civs.filter(c => c.ruler === 'npc' && !c.dead)); const k = c && G.people[c.rulerId]; if (k && k.alive) People.die(k, 'doença'); }
          else if (rnd < 0.16) { const v = U.pick(World.villages.filter(v => v && v.chief !== undefined && v.chief !== 'player')); const p = v && G.people[v.chief]; if (p && p.alive) People.die(p, 'doença'); }
          else if (rnd < 0.2) { const c = U.pick(G.civs.filter(c => c.ruler === 'npc' && !c.dead)); if (c) c.treasury -= 2000; }
          Perf.live = true; let t = performance.now(); Game.onNewDay(); Perf.live = false; let d = performance.now() - t; if (d > worst) { worst = d; worstAt = 'virada'; }
          let g = 0; while (Perf.queue.length && g++ < 2000) { frame = []; t = performance.now(); Perf.update(0.016); d = performance.now() - t; if (d > worst) { worst = d; worstAt = frame.join(', '); } }
          ok(!Perf.queue.length, 'a fila do mês não esvaziou');
          // as regras
          for (const c of G.civs) {
            if (c.dead) continue;
            const kings = G.people.filter(p => p.alive && p.rank === 'ruler' && p.civ === c.id);
            ok(kings.length <= (c.ruler === 'player' ? 0 : 1), `reino ${c.id} com ${kings.length} reis vivos (mês ${G.day})`);
            if (c.ruler === 'npc') { const k = G.people[c.rulerId]; ok(k && k.alive, `reino ${c.id} da IA sem rei vivo (mês ${G.day})`); }
            ok(typeof c.treasury === 'number' && isFinite(c.treasury) && c.treasury >= 0, `tesouro do reino ${c.id} inválido: ${c.treasury}`);
          }
          World.villages.forEach((v, vi) => { if (v && v.chief !== undefined && v.chief !== 'player') { const p = G.people[v.chief]; ok(p && p.alive, `governador morto no cargo em ${v.name}`); } });
          ok(isFinite(P.gold) && P.gold >= 0, 'ouro do herói inválido: ' + P.gold);
          if (m % 5 === 4) await new Promise(r => setTimeout(r, 0));
        }
        ok(worst < 40, `quadro de ${worst.toFixed(0)} ms (${worstAt})`);
        return { bad, worst: +worst.toFixed(1), worstAt, day: G.day, top: Object.entries(Perf.stats).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + ' ' + v.toFixed(0)).join(', ') };
      }, part);
      fails.push(...r.bad.map(b => `parte ${part + 1}: ${b}`));
      console.log(`    meses ${part * 40 + 1}-${part * 40 + 40}: pior quadro ${r.worst} ms (${r.worstAt}); ${r.top}`);
      // salvar e carregar: tudo volta igual
      const a = await sig(), n0 = await page.evaluate(() => G.people.length), keys0 = await page.evaluate(() => Object.fromEntries(G.people.filter(p => p.alive && p.shop).map(p => [p.shop, [p.id, p.rank]])));
      await page.evaluate(() => Game.save()); await page.evaluate(() => Game.load(3));
      await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
      const b = await sig();
      if (a !== b) {
        const A = JSON.parse(a), B = JSON.parse(b);
        if (A.people !== B.people) console.log('    pessoas novas ao carregar:', await page.evaluate((n, K) => JSON.stringify(G.people.slice(n).map(p => { const o = K[p.shop] && G.people[K[p.shop][0]], s = Shops.byKey(p.shop); return { rank: p.rank, shop: p.shop, prev: K[p.shop], prevNow: o && { alive: o.alive, shop: o.shop, rank: o.rank, home: o.home, kin: o.kin, court: People.isCourt(o) }, st: s && { t: s.type, v: s.village, isShop: Shops.isShop(s), vi: Work.vi(s) } }; })), n0, keys0));
        for (const k of Object.keys(A)) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) fails.push(`parte ${part + 1}: "${k}" mudou ao carregar: ${JSON.stringify(A[k]).slice(0, 160)} → ${JSON.stringify(B[k]).slice(0, 160)}`);
      }
    }
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

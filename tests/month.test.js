// Desempenho da virada do mês: durante o jogo, o mês roda em fatias (nenhum quadro trava), a fila esvazia, o jogo
// salvo nunca fica pela metade e os índices (famílias, moradores) dão o mesmo resultado que a busca completa.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(async () => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      let worstRoll = 0, worstSlice = 0, sum = 0;
      for (let m = 0; m < 24; m++) {
        Perf.live = true; let t = performance.now(); Game.onNewDay(); Perf.live = false; const d = performance.now() - t; worstRoll = Math.max(worstRoll, d); sum += d;
        ok(Perf.queue.length > 0, 'o mês não foi dividido em fatias');
        let guard = 0; while (Perf.queue.length && guard++ < 200) { t = performance.now(); Perf.update(0.016); worstSlice = Math.max(worstSlice, performance.now() - t); }
        ok(!Perf.queue.length, 'a fila do mês não esvaziou');
        if (m % 6 === 5) await new Promise(r => setTimeout(r, 0));
      }
      ok(sum / 24 < 20, `a virada do mês está lenta: ${(sum / 24).toFixed(1)} ms`);
      // salvar no meio do mês termina o mês antes
      Perf.live = true; Game.onNewDay(); Perf.live = false; const n = Perf.queue.length; Game.snapshot(); ok(n > 0 && !Perf.queue.length, 'salvar não terminou o mês');
      // os índices batem com a busca completa
      for (const f of Object.values(Families.F()).slice(0, 40)) { const a = Families.members(f).map(p => p.id).join(), b = G.people.filter(p => p.fam === f.id && p.alive).map(p => p.id).join(); if (a !== b) { bad.push('membros da família diferem: ' + f.surname); break; } }
      for (let vi = 0; vi < World.villages.length; vi++) { const a = People.residents(vi).map(p => p.id).join(), b = G.people.filter(p => p.alive && p.home.type === 'village' && p.home.idx === vi && !p.capanga && (p.job === undefined || p.job === null)).map(p => p.id).join(); if (a !== b) { bad.push('moradores diferem na vila ' + vi); break; } }
      return { bad, avg: +(sum / 24).toFixed(1), worstRoll: +worstRoll.toFixed(1), worstSlice: +worstSlice.toFixed(1) };
    });
    fails.push(...r.bad);
    console.log(`    virada do mês: ${r.avg} ms em média (pior ${r.worstRoll} ms); pior fatia ${r.worstSlice} ms`);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};

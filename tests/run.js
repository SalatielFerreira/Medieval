#!/usr/bin/env node
// Roda os testes do jogo em Chrome sem janela, vários ao mesmo tempo (cada um com o seu navegador e a sua porta).
// Uso:
//   npm test                         → todos (4 por vez; os que medem tempo rodam sozinhos no fim)
//   node tests/run.js porto          → só os que têm "porto" no nome
//   node tests/run.js porto capmount → vários nomes de uma vez
//   JOBS=1 node tests/run.js         → um de cada vez (como antes)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
// testes que medem tempo (quadros, virada do mês): com a máquina ocupada dariam falso alarme, então rodam sozinhos
const TIMED = /performance\.now|ms por quadro|pior quadro/;

(async () => {
  const filters = process.argv.slice(2);
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js') && (!filters.length || filters.some(x => f.includes(x)))).sort();
  const jobs = Math.max(1, +process.env.JOBS || Math.min(4, Math.max(1, Math.floor(os.cpus().length / 2))));
  const timed = files.filter(f => TIMED.test(fs.readFileSync(path.join(__dirname, f), 'utf8')));
  const free = files.filter(f => !timed.includes(f));
  const t00 = Date.now(), bad = [];
  const run = async f => {
    const t0 = Date.now(), s = () => `${((Date.now() - t0) / 1000).toFixed(0)} s`;
    try {
      const fails = await require(path.join(__dirname, f))();
      if (fails.length) { bad.push(f); console.log(`✖ ${f} (${s()})\n   - ${fails.join('\n   - ')}`); }
      else console.log(`✔ ${f} (${s()})`);
    } catch (e) { bad.push(f); console.log(`✖ ${f}: ${e.stack || e.message}`); }
  };
  // os livres: vários ao mesmo tempo
  const queue = [...free];
  await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) await run(queue.shift()); }));
  // os que medem tempo: um de cada vez, com a máquina livre
  for (const f of timed) await run(f);
  const tt = ((Date.now() - t00) / 1000).toFixed(0);
  console.log(bad.length ? `\n${bad.length} de ${files.length} teste(s) falharam (${tt} s): ${bad.join(', ')}` : `\nTodos os ${files.length} testes passaram (${tt} s).`);
  process.exit(bad.length ? 1 : 0);
})();

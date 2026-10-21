#!/usr/bin/env node
// Roda os testes do jogo num Chrome sem janela. Uso:
//   npm test                 → todos
//   node tests/run.js gate   → só os que têm "gate" no nome
'use strict';
const fs = require('fs'), path = require('path');

(async () => {
  const filter = process.argv[2] || '';
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js') && f.includes(filter)).sort();
  let failed = 0;
  for (const f of files) {
    const t0 = Date.now();
    try {
      const fails = await require(path.join(__dirname, f))();
      if (fails.length) { failed++; console.log(`✖ ${f} (${((Date.now() - t0) / 1000).toFixed(0)} s)\n   - ${fails.join('\n   - ')}`); }
      else console.log(`✔ ${f} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    } catch (e) { failed++; console.log(`✖ ${f}: ${e.stack || e.message}`); }
  }
  console.log(failed ? `\n${failed} de ${files.length} teste(s) falharam.` : `\nTodos os ${files.length} testes passaram.`);
  process.exit(failed ? 1 : 0);
})();

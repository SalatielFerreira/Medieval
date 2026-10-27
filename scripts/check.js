#!/usr/bin/env node
// Verificação rápida do jogo, sem instalar nada (só o Node):
//  1. a sintaxe de todos os arquivos de js/ (um erro de digitação quebra o jogo inteiro);
//  2. a lista de carregamento do index.html (FILES) bate com os arquivos de js/ — sem arquivo faltando nem sobrando;
//  3. nenhum nome de arquivo aparece duas vezes na lista;
//  4. nenhum nome global (const, let, class) é declarado em dois arquivos.
// Uso: node scripts/check.js   (também roda no GitHub antes de publicar)
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

const root = path.join(__dirname, '..'), jsDir = path.join(root, 'js');
let fail = 0;
const err = msg => { console.error('✖ ' + msg); fail++; };

// 1. sintaxe
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).sort();
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', path.join(jsDir, f)], { stdio: 'pipe' }); }
  catch (e) { err(`erro de sintaxe em js/${f}:\n${String(e.stderr || e.message).trim()}`); }
}
for (const f of ['sw.js']) {
  try { execFileSync(process.execPath, ['--check', path.join(root, f)], { stdio: 'pipe' }); }
  catch (e) { err(`erro de sintaxe em ${f}:\n${String(e.stderr || e.message).trim()}`); }
}

// 2. e 3. lista de carregamento
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const m = html.match(/var FILES = \[([^\]]*)\]/);
if (!m) err('não achei a lista FILES no index.html');
else {
  const list = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
  const seen = new Set();
  for (const n of list) { if (seen.has(n)) err(`"${n}" aparece duas vezes em FILES (index.html)`); seen.add(n); }
  for (const n of list) if (!files.includes(n + '.js')) err(`FILES (index.html) carrega "${n}", mas js/${n}.js não existe`);
  for (const f of files) if (!seen.has(f.replace(/\.js$/, ''))) err(`js/${f} existe, mas não está na lista FILES do index.html (não é carregado)`);
}

// 4. nenhum nome global (const/let/class no começo da linha) declarado em dois arquivos: o segundo quebraria o carregamento
const owner = {};
for (const f of files) {
  for (const x of fs.readFileSync(path.join(jsDir, f), 'utf8').matchAll(/^(?:const|let|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    const n = x[1];
    if (owner[n] && owner[n] !== f) err(`"${n}" é declarado em js/${owner[n]} e de novo em js/${f} (o jogo para de carregar)`);
    else owner[n] = f;
  }
}

if (fail) { console.error(`\n${fail} problema(s) encontrado(s).`); process.exit(1); }
console.log(`✔ ${files.length} arquivos de js/ sem erro de sintaxe e a lista de carregamento confere.`);

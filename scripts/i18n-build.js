#!/usr/bin/env node
// Traduz os textos do jogo (scripts/i18n/keys.json, feito por i18n-extract.js) e grava js/lang_xx.js.
// As traduções já feitas ficam em scripts/i18n/xx.json: rodando de novo, só os textos novos são traduzidos.
// Correções à mão: scripts/i18n/fix_xx.json ({ "texto em português": "tradução" }) vencem a tradução automática.
// Uso: node scripts/i18n-extract.js && node scripts/i18n-build.js [en es]
'use strict';
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'i18n'), root = path.join(__dirname, '..');
const keys = JSON.parse(fs.readFileSync(path.join(dir, 'keys.json'), 'utf8'));
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ['en', 'es'];
const GT = { en: 'en', es: 'es' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
// os {0} viram números entre colchetes duplos, que o tradutor não mexe
const protect = s => s.replace(/\{(\d+)\}/g, '[[$1]]');
const unprotect = s => s.replace(/\[\s*\[\s*(\d+)\s*\]\s*\]/g, '{$1}');

async function gt(lines, tl) {
  const q = lines.map(protect).join('\n');
  for (let tries = 0; tries < 6; tries++) {
    try {
      const res = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=' + tl + '&dt=t', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: 'q=' + encodeURIComponent(q) });
      if (res.status === 429 || res.status >= 500) { await sleep(15000 * (tries + 1)); continue; }
      const j = await res.json();
      const out = j[0].map(x => x[0]).join('').split('\n').map(s => unprotect(s.trim()));
      return out;
    } catch (e) { await sleep(3000 * (tries + 1)); }
  }
  return null; // o tradutor não respondeu: o lote fica para a próxima vez
}
const phs = s => (s.match(/\{\d+\}/g) || []).sort().join();
const good = (k, t) => t && phs(k) === phs(t);

(async () => {
  for (const lang of LANGS) {
    const file = path.join(dir, lang + '.json');
    const done = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    const todo = keys.filter(k => !(k in done));
    console.log(`${lang}: ${todo.length} textos para traduzir`);
    // lotes de até ~1500 letras
    const batches = []; let cur = [], len = 0;
    for (const k of todo) { if (cur.length && len + k.length > 1500) { batches.push(cur); cur = []; len = 0; } cur.push(k); len += k.length + 1; }
    if (cur.length) batches.push(cur);
    let n = 0, failed = 0;
    const work = async b => {
      let out = await gt(b, GT[lang]);
      if (!out) { failed++; return; }
      if (out.length !== b.length) { out = []; for (const k of b) { const o = await gt([k], GT[lang]); out.push(o && o[0]); } }
      for (let i = 0; i < b.length; i++) {
        let t = out[i];
        if (!good(b[i], t)) { const o = await gt([b[i]], GT[lang]); t = o && o[0]; }
        if (good(b[i], t)) done[b[i]] = t; else if (!/\{\d+\}/.test(b[i])) done[b[i]] = t || b[i]; else done[b[i]] = null; // modelo que o tradutor estragou: fica de fora
      }
      if (++n % 10 === 0) { fs.writeFileSync(file, JSON.stringify(done)); process.stdout.write(`  ${n}/${batches.length}\n`); }
    };
    for (let i = 0; i < batches.length; i += 2) { await Promise.all(batches.slice(i, i + 2).map(work)); await sleep(400); }
    if (failed) console.log(`${lang}: ${failed} lote(s) sem resposta — rode de novo para completar`);
    fs.writeFileSync(file, JSON.stringify(done));
    // o arquivo do jogo: só os textos que existem hoje
    const fixf = path.join(dir, 'fix_' + lang + '.json'), fix = fs.existsSync(fixf) ? JSON.parse(fs.readFileSync(fixf, 'utf8')) : {};
    const d = {};
    for (const k of keys) { const t = k in fix ? fix[k] : done[k]; if (t && t !== k) d[k] = t; }
    for (const k in fix) if (fix[k]) d[k] = fix[k];
    fs.writeFileSync(path.join(root, 'js', 'lang_' + lang + '.js'),
      `// Tradução automática do jogo (${lang}). Gerado por scripts/i18n-build.js — não edite aqui: use scripts/i18n/fix_${lang}.json\n` +
      `I18N.load(${JSON.stringify(lang)}, ${JSON.stringify(d)});\n`);
    console.log(`${lang}: pronto (${Object.keys(d).length} textos)`);
  }
})();

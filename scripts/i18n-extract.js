#!/usr/bin/env node
// Junta todos os textos em português do jogo (js/*.js e index.html) para traduzir.
// Cada texto vira uma "chave" do jeito que aparece na tela: sem as marcas de HTML e sem os pedaços que mudam
// (os ${...} viram {0}, {1}...). A mesma regra (I18N.core) é usada no jogo para achar a tradução.
// Uso: node scripts/i18n-extract.js   → grava scripts/i18n/keys.json
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const { core, isText } = require('../js/i18n.js').I18N_TOOLS;

// lê as strings de um arquivo JS: '...', "..." e `...${}...` (com os ${} aninhados), pulando comentários e regex
function strings(src) {
  const out = []; let i = 0; const n = src.length;
  let prevSig = ''; // último caractere significativo (para saber se "/" abre uma regex)
  const readQuoted = q => { let s = ''; i++; while (i < n && src[i] !== q) { if (src[i] === '\\') { s += esc(); continue; } if (src[i] === '\n') break; s += src[i++]; } i++; return s; };
  const esc = () => { const c = src[i + 1]; i += 2;
    if (c === 'n') return '\n'; if (c === 't') return '\t'; if (c === 'u') { if (src[i] === '{') { const e = src.indexOf('}', i); const v = String.fromCodePoint(parseInt(src.slice(i + 1, e), 16)); i = e + 1; return v; } const v = String.fromCharCode(parseInt(src.substr(i, 4), 16)); i += 4; return v; }
    if (c === 'x') { const v = String.fromCharCode(parseInt(src.substr(i, 2), 16)); i += 2; return v; }
    if (c === '\n') return ''; return c; };
  const skipRegex = () => { i++; let cls = false; while (i < n) { const c = src[i]; if (c === '\\') { i += 2; continue; } if (c === '[') cls = true; else if (c === ']') cls = false; else if (c === '/' && !cls) { i++; break; } else if (c === '\n') break; i++; } while (/[a-z]/.test(src[i] || '')) i++; };
  // template: devolve o texto com \u0001 no lugar de cada ${...}; o que está dentro do ${} é lido como código
  const readTemplate = () => { i++; let s = '';
    while (i < n && src[i] !== '`') {
      if (src[i] === '\\') { s += esc(); continue; }
      if (src[i] === '$' && src[i + 1] === '{') { i += 2; s += '\u0001'; code(1); continue; }
      s += src[i++];
    }
    i++; out.push({ t: s, tpl: true });
  };
  function code(depth) { // lê código até fechar o "}" do ${} (depth 1) ou até o fim (depth 0)
    let d = 0;
    while (i < n) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
      if (c === '\'' || c === '"') { out.push({ t: readQuoted(c) }); prevSig = 'a'; continue; }
      if (c === '`') { readTemplate(); prevSig = 'a'; continue; }
      if (c === '/') { if (!prevSig || /[(,=:[!&|?{};+\-*%<>~^]/.test(prevSig) || /\b(return|typeof|case|in|of)$/.test(src.slice(Math.max(0, i - 8), i).trimEnd())) { skipRegex(); prevSig = 'a'; continue; } }
      if (c === '{') d++;
      if (c === '}') { if (depth && d === 0) { i++; return; } d--; }
      if (!/\s/.test(c)) prevSig = c;
      i++;
    }
  }
  code(0);
  return out;
}

// um texto (string ou template) → os pedaços que aparecem na tela
function pieces(t, tpl) {
  // as marcas de HTML saem (o atributo title="..." e placeholder="..." entram como texto próprio)
  const res = [];
  t.replace(/\b(?:title|placeholder|aria-label|data-tip)="([^"\u0001]*)"/g, (_, a) => { res.push(a); return ''; });
  const parts = t.replace(/<[^>]*>/g, '\u0002').split('\u0002');
  for (const p of parts) {
    const s = p.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    if (!tpl) { res.push(s); continue; }
    res.push(s); // com os {n}
    for (const q of s.split('\u0001')) res.push(q); // e cada pedaço fixo sozinho (serve quando o texto vem quebrado)
  }
  return res;
}

const keys = new Map(); // chave → nº de vezes
const add = s => {
  let k = s; let nPh = 0; k = k.replace(/\u0001/g, () => `{${nPh++}}`);
  k = core(k).core; if (!k || !isText(k)) return;
  if (/^(\{\d+\}\s*)+$/.test(k)) return;
  keys.set(k, (keys.get(k) || 0) + 1);
};
const files = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js') && f !== 'i18n.js' && !f.startsWith('lang_'));
for (const f of files) for (const s of strings(fs.readFileSync(path.join(root, 'js', f), 'utf8'))) for (const p of pieces(s.t, s.tpl)) add(p);
// textos fixos do index.html
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
for (const p of pieces(html.replace(/<head>[\s\S]*<\/head>/, ''), false)) add(p);
fs.mkdirSync(path.join(__dirname, 'i18n'), { recursive: true });
const list = [...keys.keys()].sort();
fs.writeFileSync(path.join(__dirname, 'i18n', 'keys.json'), JSON.stringify(list, null, 0));
console.log(`${list.length} textos, ${list.reduce((a, k) => a + k.length, 0)} letras`);

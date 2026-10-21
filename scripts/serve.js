#!/usr/bin/env node
// Servidor local para jogar e testar sem publicar: node scripts/serve.js  →  http://localhost:8080
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PORT = +process.env.PORT || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.md': 'text/plain; charset=utf-8' };
http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!p.startsWith(ROOT)) { r.writeHead(403); r.end(); return; }
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end('não encontrado'); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); });
}).listen(PORT, () => console.log(`MEDIEVAL rodando em http://localhost:${PORT}  (Ctrl+C para parar)`));

// Base dos testes: sobe um servidor local com o jogo, abre o Chrome (sem janela) e começa um jogo novo.
// Precisa do pacote puppeteer-core (npm install) e de um Chrome instalado. Para usar outro navegador, defina a
// variável CHROME com o caminho do executável.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const CHROMES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const wait = ms => new Promise(r => setTimeout(r, ms));

function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(ROOT, u === '/' ? 'index.html' : u);
      fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); r.end(d); });
    }).listen(0, () => res(srv));
  });
}

// abre o jogo e devolve { page, errors, close }; com newGame, já começa um jogo
async function open(opts = {}) {
  const exe = CHROMES.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
  if (!exe) throw new Error('Chrome não encontrado: defina a variável CHROME com o caminho do navegador.');
  const srv = await serve(), port = srv.address().port;
  const browser = await puppeteer.launch({ executablePath: exe, headless: 'new' });
  const page = await browser.newPage(); await page.setViewport({ width: opts.width || 1366, height: opts.height || 720 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.stack || e.message).slice(0, 400)));
  page.on('dialog', d => d.accept());
  await page.goto(`http://localhost:${port}/${opts.query || ""}`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof G !== 'undefined' && G.state === 'menu' && (window.GAME_LOADED || !window.GAME_LOADER), { timeout: 60000 }); // todos os arquivos carregados
  if (opts.newGame !== false) {
    await page.evaluate(o => { Menu.hide(); return Game.newGame(Object.assign({ name: 'Teste', surname: 'Silva', sex: 'm', age: 25, hair: '#5a3a1a', skin: '#f0c896', slot: 3, diff: 'normal' }, o), null); }, opts.hero || {});
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
  }
  return { page, errors, close: async () => { await browser.close(); srv.close(); } };
}

// confere uma condição; erros viram uma lista no fim do teste
function expect(list) {
  const fails = [];
  const ok = (cond, what) => { if (!cond) fails.push(what); };
  return { ok, fails, list };
}

module.exports = { open, wait, expect };
